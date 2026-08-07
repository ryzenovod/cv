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
}

function overlaps(a, b, tolerance = 1) {
  return !(
    a.right <= b.left + tolerance ||
    b.right <= a.left + tolerance ||
    a.bottom <= b.top + tolerance ||
    b.bottom <= a.top + tolerance
  );
}

for (const viewport of viewports) {
  test(`${viewport.name}: no horizontal overflow and stable layout`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await preparePage(page);

    const report = await page.evaluate(() => {
      const viewportWidth = window.innerWidth;
      const offenders = [...document.querySelectorAll('body *')]
        .filter((element) => {
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

      const heroCopy = document.querySelector('.hero-copy').getBoundingClientRect().toJSON();
      const heroCard = document.querySelector('.hero-card').getBoundingClientRect().toJSON();
      return {
        viewportWidth,
        scrollWidth: document.documentElement.scrollWidth,
        offenders,
        heroCopy,
        heroCard
      };
    });

    expect(report.scrollWidth).toBeLessThanOrEqual(report.viewportWidth + 1);
    expect(report.offenders).toEqual([]);

    if (viewport.width <= 980) {
      expect(report.heroCard.top).toBeGreaterThanOrEqual(report.heroCopy.bottom - 1);
    } else {
      expect(overlaps(report.heroCopy, report.heroCard, 2)).toBe(false);
    }

    await page.screenshot({ path: `artifacts/${viewport.name}.png`, fullPage: true });
  });
}

test('content is employer-first and projects are concrete', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await preparePage(page);

  await expect(page.locator('.project')).toHaveCount(3);
  await expect(page.locator('.project').first()).toContainText('МедГео Аналитика');
  await expect(page.locator('.project').first()).toContainText('импорт CSV/XLSX');
  await expect(page.locator('#skills .skills-grid article')).toHaveCount(6);
  await expect(page.locator('.contact-links a')).toHaveCount(4);
  await expect(page.locator('img')).toHaveCount(0);
});

test('language switch changes the complete interface without overflow', async ({ page }) => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1000 }]) {
    await page.setViewportSize(viewport);
    await preparePage(page);

    await page.getByRole('button', { name: 'EN' }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('h1')).toContainText('Egor');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width + 1);

    await page.getByRole('button', { name: 'RU' }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
    await expect(page.locator('h1')).toContainText('Егор');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width + 1);
  }
});

test('anchors and external-link security are valid', async ({ page }) => {
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
