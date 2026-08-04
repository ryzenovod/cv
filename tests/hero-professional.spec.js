const { test, expect } = require('@playwright/test');

const desktopViewports = [
  { width: 1040, height: 900 },
  { width: 1100, height: 900 },
  { width: 1280, height: 960 },
  { width: 1440, height: 1000 }
];

for (const viewport of desktopViewports) {
  test(`hero title remains inside its column at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);

    const geometry = await page.evaluate(() => {
      const title = document.querySelector('.hero h1').getBoundingClientRect();
      const copy = document.querySelector('.hero-copy').getBoundingClientRect();
      const visual = document.querySelector('.hero-visual').getBoundingClientRect();
      return {
        title: title.toJSON(),
        copy: copy.toJSON(),
        visual: visual.toJSON(),
        scrollWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth
      };
    });

    expect(geometry.title.left).toBeGreaterThanOrEqual(geometry.copy.left - 1);
    expect(geometry.title.right).toBeLessThanOrEqual(geometry.copy.right + 1);
    expect(geometry.title.right).toBeLessThanOrEqual(geometry.visual.left + 1);
    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.viewportWidth + 1);

    await page.screenshot({
      path: `artifacts/hero-professional-${viewport.width}.png`,
      fullPage: false
    });
  });
}

test('hero facts use professional, verifiable wording in both languages', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);

  const ru = (await page.locator('.hero-facts').innerText()).toUpperCase();
  expect(ru).toContain('2+ ГОДА');
  expect(ru).toContain('РАЗРАБОТКИ В ПРОДАКШЕНЕ');
  expect(ru).toContain('ПОБЕДИТЕЛЬ');
  expect(ru).toContain('УПРАВЛЕНИЕ ЦИФРОВЫМ ПРОДУКТОМ И ИННОВАТИКА');
  expect(ru).not.toContain('PROD');
  expect(ru).not.toContain('WIN');
  expect(ru).not.toContain('СИСТЕМА ВНЕДРЕНА');

  await page.getByRole('button', { name: 'EN' }).click();
  const en = (await page.locator('.hero-facts').innerText()).toUpperCase();
  expect(en).toContain('2+ YEARS');
  expect(en).toContain('PRODUCTION DEVELOPMENT');
  expect(en).toContain('WINNER');
  expect(en).toContain('DIGITAL PRODUCT MANAGEMENT AND INNOVATION');
});
