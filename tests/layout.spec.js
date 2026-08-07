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
    const step = Math.max(420, Math.floor(window.innerHeight * 0.7));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 30));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForFunction(
    () => [...document.querySelectorAll('img[src^="assets/"]')].every((image) => image.complete),
    null,
    { timeout: 10000 }
  );
}

for (const viewport of viewports) {
  test(`${viewport.name}: layout fits the viewport`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await preparePage(page);

    const report = await page.evaluate(() => {
      const viewportWidth = window.innerWidth;
      const root = document.documentElement;
      const offenders = [...document.querySelectorAll('body *')]
        .filter((element) => {
          if (element.closest('.ticker')) return false;
          const style = getComputedStyle(element);
          if (style.position === 'fixed' || style.display === 'none' || style.visibility === 'hidden') return false;
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && (rect.left < -2 || rect.right > viewportWidth + 2);
        })
        .slice(0, 20)
        .map((element) => ({
          tag: element.tagName,
          className: String(element.className),
          text: element.textContent.trim().slice(0, 100),
          rect: element.getBoundingClientRect().toJSON()
        }));

      const headings = [...document.querySelectorAll('h1,h2,h3')].map((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          text: element.textContent.trim(),
          left: rect.left,
          right: rect.right,
          width: rect.width,
          fontSize: Number.parseFloat(style.fontSize),
          lineHeight: Number.parseFloat(style.lineHeight)
        };
      });

      const header = document.querySelector('.site-header').getBoundingClientRect().toJSON();
      const hero = document.querySelector('.hero').getBoundingClientRect().toJSON();
      const headerPosition = getComputedStyle(document.querySelector('.site-header')).position;

      const projects = [...document.querySelectorAll('.project-card')].map((card) => {
        const copy = card.querySelector('.project-copy').getBoundingClientRect();
        const media = card.querySelector('.project-media').getBoundingClientRect();
        return { copy: copy.toJSON(), media: media.toJSON() };
      });

      return {
        viewportWidth,
        scrollWidth: root.scrollWidth,
        offenders,
        headings,
        header,
        hero,
        headerPosition,
        projects
      };
    });

    expect(report.scrollWidth).toBeLessThanOrEqual(report.viewportWidth + 1);
    expect(report.offenders).toEqual([]);

    for (const heading of report.headings) {
      expect(heading.left, heading.text).toBeGreaterThanOrEqual(-1);
      expect(heading.right, heading.text).toBeLessThanOrEqual(report.viewportWidth + 1);
      expect(heading.width, heading.text).toBeGreaterThan(20);
      expect(heading.fontSize, heading.text).toBeGreaterThan(13);
      expect(heading.lineHeight, heading.text).toBeGreaterThanOrEqual(heading.fontSize * 0.88);
    }

    expect(report.hero.top).toBeGreaterThanOrEqual(report.header.bottom - 1);
    if (viewport.width < 1040) {
      expect(['static', 'relative']).toContain(report.headerPosition);
      for (const project of report.projects) {
        expect(project.media.top).toBeGreaterThanOrEqual(project.copy.bottom - 1);
      }
    } else {
      for (const project of report.projects) {
        expect(project.media.left).toBeGreaterThanOrEqual(project.copy.right - 1);
      }
    }

    await page.screenshot({ path: `artifacts/${viewport.name}.png`, fullPage: true });
  });
}

test('public copy follows the editorial rules', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await preparePage(page);

  const source = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');
  const forbidden = [
    /\bне\b/iu,
    /\bnot\b/iu,
    /визуальн(?:ая|ой|ую)\s+метафор/iu,
    /схематич/iu,
    /рабочий\s+контур/iu,
    /сгруппированы\s+по\s+тому/iu,
    /реальные\s+медицинские\s+данные/iu,
    /ч[её]рн(?:ый|ого)\s+ящик/iu
  ];

  for (const pattern of forbidden) {
    expect(source, String(pattern)).not.toMatch(pattern);
  }

  await expect(page.locator('figcaption')).toHaveCount(0);
  await expect(page.locator('#skills h2')).toHaveText('Технологии');
  await expect(page.locator('#projects .project-card')).toHaveCount(3);
});

test('projects present task, contribution and technology', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await preparePage(page);

  const projects = page.locator('.project-card');
  await expect(projects).toHaveCount(3);

  for (let index = 0; index < 3; index += 1) {
    const project = projects.nth(index);
    await expect(project.locator('h3')).toHaveCount(1);
    await expect(project.locator('.project-copy > p')).toHaveCount(1);
    expect(await project.locator('.project-copy > p').innerText()).toMatch(/.{60,}/s);
    expect(await project.locator('.tags span').count()).toBeGreaterThanOrEqual(4);
    await expect(project.locator('.project-media img')).toHaveCount(1);
  }

  expect(await projects.nth(0).locator('.project-points li').count()).toBeGreaterThanOrEqual(2);
  expect(await projects.nth(1).locator('.project-points li').count()).toBeGreaterThanOrEqual(1);
});

test('local media load and key sections render', async ({ page }) => {
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
    ['architecture', '#systems .architecture-card'],
    ['experience', '#experience'],
    ['technologies', '#skills'],
    ['achievements', '#achievements'],
    ['contact', '#contact']
  ];

  for (const [name, selector] of captures) {
    const target = page.locator(selector);
    await expect(target, selector).toHaveCount(1);
    await target.scrollIntoViewIfNeeded();
    await page.waitForTimeout(120);
    await target.screenshot({ path: `artifacts/desktop-${name}.png` });
  }
});

test('language switch preserves layout', async ({ page }) => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1000 }]) {
    await page.setViewportSize(viewport);
    await preparePage(page);
    await page.getByRole('button', { name: 'EN' }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('h1')).toContainText('Egor');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width + 1);
    await page.getByRole('button', { name: 'RU' }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width + 1);
  }
});

test('links and anchors are valid', async ({ page }) => {
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
