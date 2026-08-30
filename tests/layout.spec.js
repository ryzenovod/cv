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
    document.documentElement.style.scrollBehavior = 'auto';
    document.querySelectorAll('.reveal').forEach((element) => element.classList.add('visible'));
    document.querySelectorAll('img[src^="assets/"]').forEach((image) => {
      image.loading = 'eager';
    });

    const step = Math.max(420, Math.floor(window.innerHeight * 0.72));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    window.scrollTo(0, 0);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  await page.waitForFunction(
    () => [...document.querySelectorAll('img[src^="assets/"]')].every((image) => image.complete),
    null,
    { timeout: 10000 }
  );
}

for (const viewport of viewports) {
  test(`${viewport.name}: page fits without overlap`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await preparePage(page);

    const report = await page.evaluate(() => {
      const viewportWidth = window.innerWidth;
      const offenders = [...document.querySelectorAll('body *')]
        .filter((element) => {
          const style = getComputedStyle(element);
          if (element.closest('#scroll-progress') || style.position === 'fixed' || style.display === 'none' || style.visibility === 'hidden') return false;
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && (rect.left < -2 || rect.right > viewportWidth + 2);
        })
        .slice(0, 20)
        .map((element) => ({
          tag: element.tagName,
          className: String(element.className),
          text: element.textContent.trim().slice(0, 90),
          rect: element.getBoundingClientRect().toJSON()
        }));

      const headings = [...document.querySelectorAll('h1,h2,h3')].map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          text: element.textContent.trim(),
          rect: rect.toJSON(),
          fontSize: Number.parseFloat(getComputedStyle(element).fontSize)
        };
      });

      const header = document.querySelector('.site-header').getBoundingClientRect();
      const hero = document.querySelector('.hero').getBoundingClientRect();
      const projects = [...document.querySelectorAll('.project-card')].map((card) => ({
        copy: card.querySelector('.project-copy').getBoundingClientRect().toJSON(),
        media: card.querySelector('.project-media').getBoundingClientRect().toJSON()
      }));

      return {
        viewportWidth,
        scrollWidth: document.documentElement.scrollWidth,
        offenders,
        headings,
        header: header.toJSON(),
        hero: hero.toJSON(),
        headerPosition: getComputedStyle(document.querySelector('.site-header')).position,
        projects
      };
    });

    expect(report.scrollWidth).toBeLessThanOrEqual(report.viewportWidth + 1);
    expect(report.offenders).toEqual([]);
    expect(report.headerPosition).toBe('sticky');
    expect(report.hero.top).toBeGreaterThanOrEqual(report.header.bottom - 1);

    for (const heading of report.headings) {
      expect(heading.rect.left, heading.text).toBeGreaterThanOrEqual(-1);
      expect(heading.rect.right, heading.text).toBeLessThanOrEqual(report.viewportWidth + 1);
      expect(heading.rect.width, heading.text).toBeGreaterThan(18);
      expect(heading.fontSize, heading.text).toBeGreaterThan(12);
    }

    if (viewport.width <= 820) {
      for (const project of report.projects) {
        expect(project.media.top).toBeGreaterThanOrEqual(project.copy.bottom - 1);
      }
    } else {
      for (const project of report.projects) {
        const separated = project.media.left >= project.copy.right - 1 || project.copy.left >= project.media.right - 1;
        expect(separated).toBe(true);
      }
    }

    await page.screenshot({ path: `artifacts/${viewport.name}.png`, fullPage: true });
  });
}

test('copy is factual and the identity is not duplicated', async ({ page }) => {
  await page.setViewportSize({ width: 884, height: 414 });
  await preparePage(page);

  const source = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');
  const visibleText = await page.locator('body').innerText();
  const fullNameMatches = visibleText.match(/Егор\s+Белоусов/giu) || [];

  expect(fullNameMatches).toHaveLength(1);
  await expect(page.locator('.brand')).toHaveText('@ryzenovod');
  await expect(page.locator('h1')).toHaveText(/Егор\s+Белоусов/);
  await expect(page.locator('.metro-map, .metro-scheme, .route-diagram, [data-decoration="metro-map"]')).toHaveCount(0);
  await expect(page.locator('#projects .project-card')).toHaveCount(3);
  await expect(page.locator('#achievements h3').filter({ hasText: 'Я — профессионал' })).toHaveCount(1);
  await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);

  expect(source).not.toMatch(/поступлен|абитуриент|мотивационн(?:ое|ая) письм/iu);
  expect(source).not.toMatch(/metro-grid|MSK \/ SYSTEM MAP|REQUEST → MODEL → BUILD → DEPLOY/iu);
  expect(source).not.toMatch(/СНИЛС|паспорт|диагноз|дата рождения/iu);
  expect(source).not.toMatch(/\b\d{2}\.\d{2}\.\d{4}\b/u);
  expect(source).not.toMatch(/Три проекта, в которых|THREE RESULTS|ТРИ РЕЗУЛЬТАТА|Первое место/iu);
  expect(source).not.toMatch(/>0[1-6] \/ (?:PROJECTS|EXPERIENCE|CAPABILITIES|ACHIEVEMENTS|BACKEND|DATA|FRONTEND|AI|DELIVERY|PRODUCT|CONTACT)/u);
  expect(source).toContain('Remote · VDK');

  const experienceText = await page.locator('#experience').innerText();
  expect(experienceText).not.toMatch(/январ|феврал|март|апрел|ма[йя]|июн|июл|август|сентябр|октябр|ноябр|декабр/iu);
  await expect(page.locator('.footer-status')).toHaveCount(0);
});

test('yaprofi achievement keeps ambassador header and community-leader row', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await preparePage(page);

  const yaprofi = page.locator('#achievements .award-major');
  await expect(yaprofi).toHaveCount(1);
  await expect(yaprofi.locator('> span')).toHaveText('ПОБЕДИТЕЛЬ · ПРИЗЁР · АМБАССАДОР');
  await expect(yaprofi.locator('.award-list > div').last().locator('strong')).toHaveText('Лидер сообщества');
  await expect(yaprofi).not.toContainText('Амбассадор олимпиады');

  await page.getByRole('button', { name: 'EN', exact: true }).click();

  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(yaprofi.locator('> span')).toHaveText('WINNER · PRIZE WINNER · AMBASSADOR');
  await expect(yaprofi.locator('.award-list > div').last().locator('strong')).toHaveText('Community leader');
  await expect(yaprofi).not.toContainText('Olympiad ambassador');
});

for (const viewport of [
  { name: 'narrow-320', width: 320, height: 720 },
  { name: 'iphone-13', width: 390, height: 844 },
  { name: 'iphone-15-pro', width: 393, height: 852 },
  { name: 'large-phone-430', width: 430, height: 932 }
]) {
  test(`${viewport.name}: yaprofi title stays inside its card`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/#achievements');
    await page.evaluate(() => document.fonts.ready);

    const geometry = await page.evaluate(() => {
      const cardElement = document.querySelector('#achievements .award-major');
      const titleElement = document.querySelector('#achievements .award-major h3');
      const card = cardElement.getBoundingClientRect();
      const title = titleElement.getBoundingClientRect();
      const cardStyle = getComputedStyle(cardElement);
      const range = document.createRange();
      range.selectNodeContents(titleElement);
      const lineRects = [...range.getClientRects()]
        .filter((rect) => rect.width > 0 && rect.height > 0)
        .map((rect) => rect.toJSON());

      return {
        viewportWidth: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        titleScrollWidth: titleElement.scrollWidth,
        titleClientWidth: titleElement.clientWidth,
        card: card.toJSON(),
        title: title.toJSON(),
        cardInnerLeft: card.left + Number.parseFloat(cardStyle.paddingLeft),
        cardInnerRight: card.right - Number.parseFloat(cardStyle.paddingRight),
        lineRects
      };
    });

    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.viewportWidth + 1);
    expect(geometry.titleScrollWidth).toBeLessThanOrEqual(geometry.titleClientWidth + 1);
    expect(geometry.title.left).toBeGreaterThanOrEqual(geometry.card.left - 1);
    expect(geometry.title.right).toBeLessThanOrEqual(geometry.card.right + 1);
    for (const lineRect of geometry.lineRects) {
      expect(lineRect.left).toBeGreaterThanOrEqual(geometry.cardInnerLeft - 2);
      expect(lineRect.right).toBeLessThanOrEqual(geometry.cardInnerRight + 2);
    }
    expect(geometry.lineRects.length).toBeLessThanOrEqual(2);
    expect(geometry.title.width).toBeGreaterThan(120);
    expect(geometry.title.height).toBeGreaterThan(32);
  });
}

test('project previews use a red-only accent and open interactively', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await preparePage(page);

  const assetNames = ['medgeo-dashboard.svg', 'openrisk-dashboard.svg', 'agent-flow.svg'];
  for (const assetName of assetNames) {
    const svg = fs.readFileSync(path.resolve(__dirname, '..', 'assets', assetName), 'utf8');
    expect(svg, assetName).toMatch(/#EF3124|#FF5C52|#FF6A60/iu);
    expect(svg, assetName).not.toMatch(/#C8FF38|#8AAE22|green/iu);
  }

  const preview = page.locator('.project-preview').first();
  await expect(preview).toBeVisible();
  await preview.click();
  await expect(page.locator('#project-dialog')).toHaveAttribute('open', '');
  await expect(page.locator('#project-dialog-title')).toHaveText('МедГео Аналитика');
  await expect(page.locator('#project-dialog-image')).toHaveAttribute('src', /medgeo-dashboard\.svg$/);
  await page.keyboard.press('Escape');
  await expect(page.locator('#project-dialog')).not.toHaveAttribute('open', '');
});

test('metro train progress follows the page and glass surfaces are active', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.goto('/');
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });

  const start = await page.locator('.scroll-train').boundingBox();
  const startCars = await page.locator('.scroll-train-cars').boundingBox();
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight * 0.55));
  await page.waitForFunction(() => Number.parseFloat(getComputedStyle(document.getElementById('scroll-progress')).getPropertyValue('--scroll-position')) > 45);
  await page.waitForTimeout(150);
  const middle = await page.locator('.scroll-train').boundingBox();
  const middleCars = await page.locator('.scroll-train-cars').boundingBox();

  expect(start).not.toBeNull();
  expect(middle).not.toBeNull();
  expect(middle.width).toBeGreaterThan(start.width + 300);
  expect(middle.x).toBe(start.x);
  expect(middleCars.x).toBeGreaterThan(startCars.x + 300);
  expect(start.width).toBeGreaterThanOrEqual(63);
  await expect(page.locator('.scroll-train-cars')).toBeVisible();
  await expect(page.locator('.scroll-train-cab')).toBeVisible();
  await expect(page.locator('.scroll-train-livery circle')).toHaveCount(3);
  await expect(page.locator('.scroll-tunnel')).toHaveCount(0);
  await expect(page.locator('.scroll-progress-track, .scroll-progress-fill')).toHaveCount(0);

  for (const scrollRatio of [0, 0.5, 1]) {
    await page.evaluate((ratio) => {
      const maximum = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo(0, maximum * ratio);
    }, scrollRatio);
    await page.waitForTimeout(120);
    const geometry = await page.evaluate(() => {
      const train = document.querySelector('.scroll-train').getBoundingClientRect();
      const cars = document.querySelector('.scroll-train-cars').getBoundingClientRect();
      const cab = document.querySelector('.scroll-train-cab').getBoundingClientRect();
      const header = document.querySelector('.site-header').getBoundingClientRect();
      const brand = document.querySelector('.brand').getBoundingClientRect();
      const language = document.querySelector('.lang-switch').getBoundingClientRect();
      return {
        viewportWidth: window.innerWidth,
        train: train.toJSON(),
        cars: cars.toJSON(),
        cab: cab.toJSON(),
        header: header.toJSON(),
        brand: brand.toJSON(),
        language: language.toJSON()
      };
    });
    expect(geometry.train.bottom).toBeLessThanOrEqual(geometry.header.top);
    expect(geometry.train.bottom).toBeLessThanOrEqual(geometry.brand.top);
    expect(geometry.train.bottom).toBeLessThanOrEqual(geometry.language.top);
    expect(geometry.cab.left - geometry.cars.right).toBeGreaterThanOrEqual(0.5);
    expect(geometry.cab.left - geometry.cars.right).toBeLessThanOrEqual(1.5);
    if (scrollRatio === 1) expect(Math.abs(geometry.train.width - geometry.viewportWidth)).toBeLessThanOrEqual(1);
  }

  await page.goto('/#contact');
  await page.waitForFunction(() => Number.parseFloat(getComputedStyle(document.getElementById('scroll-progress')).getPropertyValue('--scroll-position')) >= 99.5);
  const contactTrain = await page.locator('.scroll-train').boundingBox();
  expect(Math.abs(contactTrain.width - 1200)).toBeLessThanOrEqual(1);
  await expect(page.locator('#scroll-train-car')).toHaveAttribute('x', String((1200 - 65) % 64));

  const glass = await page.locator('.site-header').evaluate((header) => {
    const style = getComputedStyle(header);
    return { backdrop: style.backdropFilter, background: style.backgroundImage };
  });
  expect(glass.backdrop).toContain('blur');
  expect(glass.background).toContain('linear-gradient');
});

test('metro train stays above the complete mobile header', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, document.documentElement.scrollHeight);
  });
  await page.waitForTimeout(150);

  const geometry = await page.evaluate(() => {
    const train = document.querySelector('.scroll-train').getBoundingClientRect();
    const header = document.querySelector('.site-header').getBoundingClientRect();
    const brand = document.querySelector('.brand').getBoundingClientRect();
    const language = document.querySelector('.lang-switch').getBoundingClientRect();
    return {
      train: train.toJSON(),
      header: header.toJSON(),
      brand: brand.toJSON(),
      language: language.toJSON()
    };
  });

  expect(geometry.train.bottom).toBeLessThanOrEqual(geometry.header.top);
  expect(geometry.train.bottom).toBeLessThanOrEqual(geometry.brand.top);
  expect(geometry.train.bottom).toBeLessThanOrEqual(geometry.language.top);
});

test('projects show purpose, contribution and stack', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await preparePage(page);

  const projects = page.locator('.project-card');
  await expect(projects).toHaveCount(3);

  for (let index = 0; index < 3; index += 1) {
    const project = projects.nth(index);
    await expect(project.locator('h3')).toHaveCount(1);
    await expect(project.locator('.project-copy > p')).toHaveCount(1);
    expect(await project.locator('.project-copy > p').innerText()).toMatch(/.{60,}/s);
    expect(await project.locator('.project-points li').count()).toBeGreaterThanOrEqual(2);
    expect(await project.locator('.tags span').count()).toBeGreaterThanOrEqual(4);
    await expect(project.locator('.project-media img')).toHaveCount(1);
  }
});

test('local media load and core sections render', async ({ page }) => {
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

  for (const selector of ['#top', '#projects', '#experience', '#skills', '#achievements', '#contact']) {
    await expect(page.locator(selector), selector).toHaveCount(1);
  }
});

test('language switch updates copy, alt text and metadata', async ({ page }) => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1000 }]) {
    await page.setViewportSize(viewport);
    await preparePage(page);

    await page.getByRole('button', { name: 'EN', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('h1')).toHaveText(/Egor\s+Belousov/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /backend services and data systems/i);
    await expect(page.locator('.project-media img').first()).toHaveAttribute('alt', 'MedGeo Analytics interface');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width + 1);

    await page.getByRole('button', { name: 'RU', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width + 1);
  }
});

test('anchors and external links are safe', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await preparePage(page);

  const report = await page.evaluate(() => {
    const internal = [...document.querySelectorAll('a[href^="#"]')].map((link) => link.getAttribute('href'));
    return {
      missingAnchors: internal.filter((href) => href !== '#' && !document.querySelector(href)),
      unsafeExternal: [...document.querySelectorAll('a[target="_blank"]')]
        .filter((link) => !link.relList.contains('noreferrer'))
        .map((link) => link.href),
      unpairedCopy: document.querySelectorAll('[data-ru]:not([data-en]),[data-en]:not([data-ru])').length,
      unpairedAlt: document.querySelectorAll('[data-alt-ru]:not([data-alt-en]),[data-alt-en]:not([data-alt-ru])').length
    };
  });

  expect(report.missingAnchors).toEqual([]);
  expect(report.unsafeExternal).toEqual([]);
  expect(report.unpairedCopy).toBe(0);
  expect(report.unpairedAlt).toBe(0);
});
