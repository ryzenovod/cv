const { test, expect } = require('@playwright/test');

for (const viewport of [
  { name: 'mobile-320', width: 320, height: 720 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 1000 }
]) {
  test(`${viewport.name}: first viewport is compact and readable`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);

    const report = await page.evaluate(() => {
      const header = document.querySelector('.site-header').getBoundingClientRect();
      const hero = document.querySelector('.hero').getBoundingClientRect();
      const projects = document.querySelector('#projects').getBoundingClientRect();
      const title = document.querySelector('h1').getBoundingClientRect();
      const image = document.querySelector('.hero-image').getBoundingClientRect();
      const primary = document.querySelector('.button-primary').getBoundingClientRect();
      return {
        scrollY: window.scrollY,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        header: header.toJSON(),
        hero: hero.toJSON(),
        projects: projects.toJSON(),
        title: title.toJSON(),
        image: image.toJSON(),
        primary: primary.toJSON(),
        brand: document.querySelector('.brand').textContent.trim(),
        h1: document.querySelector('h1').textContent.trim()
      };
    });

    expect(report.scrollY).toBe(0);
    expect(report.header.top).toBeGreaterThanOrEqual(0);
    expect(report.hero.top).toBeGreaterThanOrEqual(report.header.bottom - 1);
    expect(report.title.left).toBeGreaterThanOrEqual(0);
    expect(report.title.right).toBeLessThanOrEqual(report.viewport.width + 1);
    expect(report.image.width).toBeGreaterThan(150);
    expect(report.image.height).toBeGreaterThan(120);
    expect(report.primary.width).toBeGreaterThan(120);
    expect(report.brand).toBe('@ryzenovod');
    expect(report.h1).toContain('Егор');
    expect(report.brand).not.toContain('Егор');

    if (viewport.width <= 430) {
      expect(report.hero.bottom).toBeLessThanOrEqual(report.viewport.height + 1);
      expect(report.projects.top).toBeLessThanOrEqual(report.viewport.height + 1);
    }

    await page.screenshot({ path: `artifacts/viewport-${viewport.name}.png`, fullPage: false });
  });
}

test('essential content remains visible without JavaScript', async ({ browser }) => {
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
    sectionCount: document.querySelectorAll('main > section').length,
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth
  }));

  expect(report.heading).toContain('Егор');
  expect(report.revealOpacity.every((value) => Number(value) === 1)).toBe(true);
  expect(report.projectCount).toBe(3);
  expect(report.sectionCount).toBe(6);
  expect(report.scrollWidth).toBeLessThanOrEqual(report.viewportWidth + 1);
  await context.close();
});
