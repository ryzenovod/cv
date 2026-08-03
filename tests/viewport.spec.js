const { test, expect } = require('@playwright/test');

for (const viewport of [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 1000 }
]) {
  test(`${viewport.name}: initial viewport has a clean header and hero`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);

    const report = await page.evaluate(() => {
      const header = document.querySelector('.site-header').getBoundingClientRect();
      const hero = document.querySelector('.hero').getBoundingClientRect();
      const skip = document.querySelector('.skip-link').getBoundingClientRect();
      const active = document.activeElement;
      return {
        scrollY: window.scrollY,
        header: header.toJSON(),
        hero: hero.toJSON(),
        skip: skip.toJSON(),
        activeTag: active?.tagName,
        activeClass: active?.className || ''
      };
    });

    expect(report.scrollY).toBe(0);
    expect(report.header.top).toBeGreaterThanOrEqual(0);
    expect(report.header.top).toBeLessThanOrEqual(1);
    expect(report.hero.top).toBeGreaterThanOrEqual(report.header.bottom - 1);
    expect(report.skip.bottom).toBeLessThanOrEqual(0);
    expect(report.activeClass).not.toContain('skip-link');

    await page.screenshot({ path: `artifacts/viewport-${viewport.name}.png`, fullPage: false });
  });
}

test('essential content remains visible when JavaScript is disabled', async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 }
  });
  const page = await context.newPage();
  await page.goto('/');

  const report = await page.evaluate(() => ({
    heading: document.querySelector('h1')?.textContent.trim(),
    revealOpacity: [...document.querySelectorAll('.reveal')].map((node) => getComputedStyle(node).opacity),
    projectCount: document.querySelectorAll('.project-card').length,
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth
  }));

  expect(report.heading).toContain('Егор');
  expect(report.revealOpacity.every((value) => Number(value) === 1)).toBe(true);
  expect(report.projectCount).toBe(3);
  expect(report.scrollWidth).toBeLessThanOrEqual(report.viewportWidth + 1);
  await page.screenshot({ path: 'artifacts/no-js-mobile.png', fullPage: true });
  await context.close();
});
