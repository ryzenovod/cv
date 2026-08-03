const { test, expect } = require('@playwright/test');

const viewports = [
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1440', width: 1440, height: 1000 }
];

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
