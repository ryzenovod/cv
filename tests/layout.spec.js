const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const viewports = [
  { name: 'mobile-320', width: 320, height: 720 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-430', width: 430, height: 932 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'laptop-1024', width: 1024, height: 900 },
  { name: 'desktop-1440', width: 1440, height: 1000 },
  { name: 'desktop-1920', width: 1920, height: 1080 }
];

async function preparePage(page) {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => {
    document.querySelectorAll('img[src^="assets/"]').forEach((image) => {
      image.loading = 'eager';
    });
    const step = Math.max(420, Math.floor(window.innerHeight * 0.72));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 35));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForFunction(
    () => [...document.querySelectorAll('img[src^="assets/"]')].every((image) => image.complete),
    null,
    { timeout: 10000 }
  );
}

function rectanglesOverlap(a, b, tolerance = 1) {
  return !(
    a.right <= b.left + tolerance ||
    b.right <= a.left + tolerance ||
    a.bottom <= b.top + tolerance ||
    b.bottom <= a.top + tolerance
  );
}

for (const viewport of viewports) {
  test(`${viewport.name}: stable layout, readable typography and no overflow`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await preparePage(page);

    const report = await page.evaluate(() => {
      const viewportWidth = window.innerWidth;
      const root = document.documentElement;
      const selectors = [
        '.hero-copy',
        '.hero-visual',
        '.about-content',
        '.about-visual',
        '.project-card',
        '.architecture-card',
        '.experience-company',
        '.contact-box'
      ];

      const offenders = [...document.querySelectorAll('body *')]
        .filter((element) => {
          if (element.closest('.ticker')) return false;
          const style = getComputedStyle(element);
          if (style.position === 'fixed' || style.display === 'none' || style.visibility === 'hidden') return false;
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && (rect.left < -2 || rect.right > viewportWidth + 2);
        })
        .slice(0, 12)
        .map((element) => ({
          tag: element.tagName,
          className: String(element.className),
          text: element.textContent.trim().slice(0, 80),
          rect: element.getBoundingClientRect().toJSON()
        }));

      const boxes = {};
      selectors.forEach((selector) => {
        const nodes = [...document.querySelectorAll(selector)];
        boxes[selector] = nodes.map((node) => node.getBoundingClientRect().toJSON());
      });

      const longText = [...document.querySelectorAll('.experience-company')].map((node) => {
        const rect = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        return {
          right: rect.right,
          width: rect.width,
          fontSize: Number.parseFloat(style.fontSize),
          lineHeight: Number.parseFloat(style.lineHeight)
        };
      });

      return {
        viewportWidth,
        scrollWidth: root.scrollWidth,
        offenders,
        boxes,
        longText
      };
    });

    expect(report.scrollWidth).toBeLessThanOrEqual(report.viewportWidth + 1);
    expect(report.offenders).toEqual([]);

    for (const item of report.longText) {
      expect(item.right).toBeLessThanOrEqual(report.viewportWidth + 1);
      expect(item.width).toBeGreaterThan(120);
      expect(item.lineHeight).toBeGreaterThan(item.fontSize);
    }

    const heroCopy = report.boxes['.hero-copy'][0];
    const heroVisual = report.boxes['.hero-visual'][0];
    if (viewport.width < 1040) {
      expect(heroVisual.top).toBeGreaterThanOrEqual(heroCopy.bottom - 1);
    } else {
      expect(rectanglesOverlap(heroCopy, heroVisual, 2)).toBe(false);
    }

    await page.screenshot({ path: `artifacts/${viewport.name}.png`, fullPage: true });
  });
}

test('content hierarchy: visuals are unique and secondary to project copy', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await preparePage(page);

  const report = await page.evaluate(() => {
    const localImages = [...document.querySelectorAll('img[src^="assets/"]')];
    const sources = localImages.map((image) => image.getAttribute('src'));
    const duplicateSources = sources.filter((source, index) => sources.indexOf(source) !== index);

    const projects = [...document.querySelectorAll('.project-card')].map((card) => {
      const copy = card.querySelector('.project-copy');
      const media = card.querySelector('.project-media');
      const copyRect = copy.getBoundingClientRect();
      const mediaRect = media.getBoundingClientRect();
      return {
        copyBeforeMedia: [...card.children].indexOf(copy) < [...card.children].indexOf(media),
        copyWidth: copyRect.width,
        mediaWidth: mediaRect.width,
        mediaHeight: mediaRect.height,
        cardHeight: card.getBoundingClientRect().height
      };
    });

    return {
      duplicateSources,
      projectCount: projects.length,
      projects,
      aboutVisualCount: document.querySelectorAll('.about-visual').length,
      cityGalleryCount: document.querySelectorAll('.city-gallery').length
    };
  });

  expect(report.duplicateSources).toEqual([]);
  expect(report.projectCount).toBe(3);
  expect(report.aboutVisualCount).toBe(1);
  expect(report.cityGalleryCount).toBe(0);

  for (const project of report.projects) {
    expect(project.copyBeforeMedia).toBe(true);
    expect(project.copyWidth).toBeGreaterThan(project.mediaWidth);
    expect(project.mediaHeight).toBeLessThanOrEqual(project.cardHeight + 1);
  }
});

test('all local media load with real dimensions and section screenshots render', async ({ page }) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await preparePage(page);

  const images = await page.evaluate(() => [...document.querySelectorAll('img[src^="assets/"]')].map((image) => {
    const rect = image.getBoundingClientRect();
    return {
      src: image.getAttribute('src'),
      complete: image.complete,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      width: rect.width,
      height: rect.height
    };
  }));

  for (const image of images) {
    expect(image.complete, image.src).toBe(true);
    expect(image.naturalWidth, image.src).toBeGreaterThan(0);
    expect(image.naturalHeight, image.src).toBeGreaterThan(0);
    expect(image.width, image.src).toBeGreaterThan(40);
    expect(image.height, image.src).toBeGreaterThan(40);
  }

  const captures = [
    ['hero', '#top'],
    ['about', '#about'],
    ['project-medgeo', '.project-card:nth-child(1)'],
    ['project-openrisk', '.project-card:nth-child(2)'],
    ['project-agents', '.project-card:nth-child(3)'],
    ['system-map', '#systems .architecture-card'],
    ['experience', '#experience'],
    ['achievements', '#achievements'],
    ['contact', '#contact']
  ];

  for (const [name, selector] of captures) {
    const target = page.locator(selector);
    await expect(target, selector).toHaveCount(1);
    await target.scrollIntoViewIfNeeded();
    await page.waitForTimeout(160);
    await target.screenshot({ path: `artifacts/desktop-${name}.png` });
  }
});

test('language switch preserves layout on mobile and desktop', async ({ page }) => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1000 }]) {
    await page.setViewportSize(viewport);
    await preparePage(page);
    const before = await page.evaluate(() => document.documentElement.scrollWidth);
    await page.getByRole('button', { name: 'EN' }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('h1')).toContainText('Egor');
    const afterEnglish = await page.evaluate(() => document.documentElement.scrollWidth);
    await page.getByRole('button', { name: 'RU' }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
    const afterRussian = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(afterEnglish).toBeLessThanOrEqual(viewport.width + 1);
    expect(afterRussian).toBeLessThanOrEqual(viewport.width + 1);
    expect(Math.abs(afterEnglish - before)).toBeLessThanOrEqual(1);
  }
});

test('links, anchors and external-link security are valid', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await preparePage(page);

  const report = await page.evaluate(() => {
    const internal = [...document.querySelectorAll('a[href^="#"]')].map((link) => link.getAttribute('href'));
    const missingAnchors = internal.filter((href) => href !== '#' && !document.querySelector(href));
    const unsafeExternal = [...document.querySelectorAll('a[target="_blank"]')]
      .filter((link) => !link.relList.contains('noreferrer'))
      .map((link) => link.href);
    return { missingAnchors, unsafeExternal };
  });

  expect(report.missingAnchors).toEqual([]);
  expect(report.unsafeExternal).toEqual([]);
});

test('SVG graph paths explicitly pass through every visible marker', () => {
  const root = path.resolve(__dirname, '..');
  const checks = [
    {
      file: 'assets/city-editorial.svg',
      path: 'M250 716C360 675 470 735 585 690C720 637 850 610 995 560C1105 522 1190 545 1290 502',
      points: ['cx="250" cy="716"', 'cx="585" cy="690"', 'cx="995" cy="560"', 'cx="1290" cy="502"']
    },
    {
      file: 'assets/medgeo-dashboard.svg',
      path: 'M260 688L447 631L646 626L858 606L1136 585',
      points: ['cx="260" cy="688"', 'cx="447" cy="631"', 'cx="646" cy="626"', 'cx="858" cy="606"', 'cx="1136" cy="585"']
    },
    {
      file: 'assets/openrisk-dashboard.svg',
      path: 'M455 666L620 601L812 565L1120 492',
      points: ['cx="455" cy="666"', 'cx="620" cy="601"', 'cx="812" cy="565"', 'cx="1120" cy="492"']
    }
  ];

  for (const check of checks) {
    const source = fs.readFileSync(path.join(root, check.file), 'utf8');
    expect(source).toContain(`id="trend-line" d="${check.path}"`);
    for (const point of check.points) expect(source).toContain(point);
  }
});
