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

for (const viewport of [
  { width: 320, height: 720 },
  { width: 390, height: 844 },
  { width: 430, height: 932 }
]) {
  test(`hero poster typography fits at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);

    const geometry = await page.evaluate(() => {
      const heroTitle = document.querySelector('.hero h1').getBoundingClientRect();
      const heroCopy = document.querySelector('.hero-copy').getBoundingClientRect();
      const poster = document.querySelector('.hero-poster').getBoundingClientRect();
      const posterTitle = document.querySelector('.poster-title').getBoundingClientRect();
      const titleStyle = getComputedStyle(document.querySelector('.hero h1'));
      return {
        heroTitle: heroTitle.toJSON(),
        heroCopy: heroCopy.toJSON(),
        poster: poster.toJSON(),
        posterTitle: posterTitle.toJSON(),
        textTransform: titleStyle.textTransform,
        scrollWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth
      };
    });

    expect(geometry.heroTitle.left).toBeGreaterThanOrEqual(geometry.heroCopy.left - 1);
    expect(geometry.heroTitle.right).toBeLessThanOrEqual(geometry.heroCopy.right + 1);
    expect(geometry.posterTitle.left).toBeGreaterThanOrEqual(geometry.poster.left - 1);
    expect(geometry.posterTitle.right).toBeLessThanOrEqual(geometry.poster.right + 1);
    expect(geometry.textTransform).toBe('none');
    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.viewportWidth + 1);
  });
}

test('hero facts use specific, verifiable wording in both languages', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);

  const ru = (await page.locator('.hero-facts').innerText()).toUpperCase();
  expect(ru).toContain('РАБОЧИЙ MVP');
  expect(ru).toContain('МЕДГЕО АНАЛИТИКА');
  expect(ru).toContain('2+ ГОДА');
  expect(ru).toContain('ПРИКЛАДНОЙ РАЗРАБОТКИ');
  expect(ru).toContain('ПОБЕДИТЕЛЬ');
  expect(ru).toContain('УПРАВЛЕНИЕ ЦИФРОВЫМ ПРОДУКТОМ И ИННОВАТИКА');

  await page.getByRole('button', { name: 'EN' }).click();
  const en = (await page.locator('.hero-facts').innerText()).toUpperCase();
  expect(en).toContain('PRODUCTION MVP');
  expect(en).toContain('MEDGEO ANALYTICS');
  expect(en).toContain('2+ YEARS');
  expect(en).toContain('APPLIED SOFTWARE DEVELOPMENT');
  expect(en).toContain('WINNER');
  expect(en).toContain('DIGITAL PRODUCT MANAGEMENT AND INNOVATION');
});
