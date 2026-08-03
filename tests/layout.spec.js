const { test, expect } = require('@playwright/test');

const viewports = [
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1440', width: 1440, height: 1000 }
];

async function loadLazyImages(page) {
  await page.evaluate(async () => {
    document.querySelectorAll('img[src^="assets/"]').forEach((image) => {
      image.loading = 'eager';
    });
    const step = Math.max(500, Math.floor(window.innerHeight * 0.8));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 60));
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
  test(`${viewport.name}: no horizontal overflow or overlapping hero`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);

    const layout = await page.evaluate(() => {
      const root = document.documentElement;
      const heroCopy = document.querySelector('.hero-copy')?.getBoundingClientRect();
      const heroVisual = document.querySelector('.hero-visual')?.getBoundingClientRect();
      const company = document.querySelector('.experience-company')?.getBoundingClientRect();
      const viewportWidth = window.innerWidth;

      const offenders = [...document.querySelectorAll('body *')]
        .filter((element) => {
          if (element.closest('.ticker')) return false;
          const style = getComputedStyle(element);
          if (style.position === 'fixed' || style.visibility === 'hidden' || style.display === 'none') return false;
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && (rect.left < -2 || rect.right > viewportWidth + 2);
        })
        .slice(0, 10)
        .map((element) => ({
          tag: element.tagName,
          className: element.className,
          text: element.textContent.trim().slice(0, 80),
          rect: element.getBoundingClientRect().toJSON()
        }));

      return {
        scrollWidth: root.scrollWidth,
        viewportWidth,
        heroCopy,
        heroVisual,
        company,
        offenders
      };
    });

    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
    expect(layout.offenders).toEqual([]);
    expect(layout.company.right).toBeLessThanOrEqual(layout.viewportWidth + 1);

    if (viewport.width < 1040) {
      expect(layout.heroVisual.top).toBeGreaterThanOrEqual(layout.heroCopy.bottom - 1);
    } else {
      expect(layout.heroCopy.right).toBeLessThanOrEqual(layout.heroVisual.left + 2);
    }

    await page.screenshot({
      path: `artifacts/${viewport.name}.png`,
      fullPage: true
    });
  });
}

test('desktop media audit: every local image loads and every visual is captured', async ({ page }) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  await loadLazyImages(page);

  const imageReport = await page.evaluate(() => [...document.querySelectorAll('img[src^="assets/"]')].map((image) => {
    const rect = image.getBoundingClientRect();
    const style = getComputedStyle(image);
    return {
      src: image.getAttribute('src'),
      alt: image.getAttribute('alt'),
      complete: image.complete,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      width: rect.width,
      height: rect.height,
      objectFit: style.objectFit,
      visibility: style.visibility,
      opacity: Number.parseFloat(style.opacity)
    };
  }));

  for (const image of imageReport) {
    expect(image.complete, image.src).toBe(true);
    expect(image.naturalWidth, image.src).toBeGreaterThan(0);
    expect(image.naturalHeight, image.src).toBeGreaterThan(0);
    expect(image.width, image.src).toBeGreaterThan(40);
    expect(image.height, image.src).toBeGreaterThan(40);
  }

  const captures = [
    ['hero', '#top'],
    ['city-editorial', '.city-gallery figure:nth-child(1)'],
    ['metro-grid', '.city-gallery figure:nth-child(2)'],
    ['skyline', '.city-gallery figure:nth-child(3)'],
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
    await page.waitForTimeout(220);
    await target.screenshot({ path: `artifacts/desktop-${name}.png` });
  }

  console.log(JSON.stringify(imageReport, null, 2));
});

test('mobile experience section reveals and keeps long employer name readable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);

  const section = page.locator('#experience');
  await section.scrollIntoViewIfNeeded();
  const company = page.locator('.experience-company').first();
  await expect(company).toBeVisible();

  const typography = await company.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      left: rect.left,
      right: rect.right,
      width: rect.width,
      viewportWidth: window.innerWidth,
      fontSize: Number.parseFloat(style.fontSize),
      lineHeight: Number.parseFloat(style.lineHeight)
    };
  });

  expect(typography.left).toBeGreaterThanOrEqual(0);
  expect(typography.right).toBeLessThanOrEqual(typography.viewportWidth + 1);
  expect(typography.fontSize).toBeLessThanOrEqual(30);
  expect(typography.lineHeight).toBeGreaterThan(typography.fontSize);

  await page.screenshot({ path: 'artifacts/mobile-experience.png' });
});

test('language switch updates visible copy without changing layout width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);

  const before = await page.evaluate(() => document.documentElement.scrollWidth);
  await page.getByRole('button', { name: 'EN' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('h1')).toContainText('Egor');
  const after = await page.evaluate(() => document.documentElement.scrollWidth);

  expect(after).toBeLessThanOrEqual(before + 1);
  expect(after).toBeLessThanOrEqual(391);
});
