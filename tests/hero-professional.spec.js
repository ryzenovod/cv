const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

for (const viewport of [
  { width: 884, height: 414 },
  { width: 1040, height: 900 },
  { width: 1280, height: 960 },
  { width: 1440, height: 1000 }
]) {
  test(`hero title and image stay in separate columns at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);

    const geometry = await page.evaluate(() => {
      const title = document.querySelector('.hero h1').getBoundingClientRect();
      const copy = document.querySelector('.hero-copy').getBoundingClientRect();
      const image = document.querySelector('.hero-image').getBoundingClientRect();
      return {
        title: title.toJSON(),
        copy: copy.toJSON(),
        image: image.toJSON(),
        scrollWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth
      };
    });

    expect(geometry.title.left).toBeGreaterThanOrEqual(geometry.copy.left - 1);
    expect(geometry.title.right).toBeLessThanOrEqual(geometry.copy.right + 1);
    expect(geometry.title.right).toBeLessThanOrEqual(geometry.image.left + 1);
    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.viewportWidth + 1);
  });
}

for (const viewport of [
  { width: 320, height: 720 },
  { width: 390, height: 844 },
  { width: 430, height: 932 }
]) {
  test(`mobile hero stacks cleanly at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);

    const geometry = await page.evaluate(() => {
      const hero = document.querySelector('.hero').getBoundingClientRect();
      const title = document.querySelector('.hero h1').getBoundingClientRect();
      const copy = document.querySelector('.hero-copy').getBoundingClientRect();
      const image = document.querySelector('.hero-image').getBoundingClientRect();
      return {
        hero: hero.toJSON(),
        title: title.toJSON(),
        copy: copy.toJSON(),
        image: image.toJSON(),
        viewportHeight: innerHeight,
        scrollWidth: document.documentElement.scrollWidth,
        viewportWidth: innerWidth
      };
    });

    expect(geometry.title.left).toBeGreaterThanOrEqual(geometry.copy.left - 1);
    expect(geometry.title.right).toBeLessThanOrEqual(geometry.copy.right + 1);
    expect(geometry.image.top).toBeGreaterThanOrEqual(geometry.copy.bottom - 1);
    expect(geometry.hero.bottom).toBeLessThanOrEqual(geometry.viewportHeight + 1);
    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.viewportWidth + 1);
  });
}

test('hero has one identity and no metro-map decoration', async ({ page }) => {
  await page.setViewportSize({ width: 884, height: 414 });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);

  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('.hero-image img')).toHaveAttribute('src', 'assets/hero-moscow.webp');
  await expect(page.locator('.hero-image figcaption')).toContainText('MOSCOW');
  await expect(page.locator('.brand')).toHaveText('@ryzenovod');
  await expect(page.locator('.metro-map, .metro-scheme, .route-diagram, [data-decoration="metro-map"]')).toHaveCount(0);

  const css = fs.readFileSync(path.resolve(__dirname, '..', 'app.css'), 'utf8');
  expect(css).toContain('--red:#ef3124');
  expect(css).toContain('--acid:#c8ff38');
  expect(css).not.toMatch(/#ff4fc7|#9d64ff|#8198ff/iu);
});
