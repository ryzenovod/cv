(() => {
  'use strict';

  const storageKey = 'portfolio-lang';
  const metadata = {
    ru: {
      title: 'Егор Белоусов — цифровое здравоохранение, геоаналитика и ИИ',
      description: 'Егор Белоусов — разработчик цифровых продуктов для здравоохранения: медицинская геоаналитика, качество данных, GIS и ИИ.'
    },
    en: {
      title: 'Egor Belousov — digital health, geoanalytics and AI',
      description: 'Egor Belousov builds digital health products focused on healthcare geoanalytics, data quality, GIS and AI.'
    }
  };

  function readLanguage() {
    try {
      return localStorage.getItem(storageKey) === 'en' ? 'en' : 'ru';
    } catch {
      return 'ru';
    }
  }

  function applyLanguage(value) {
    const language = value === 'en' ? 'en' : 'ru';
    document.documentElement.lang = language;

    try {
      localStorage.setItem(storageKey, language);
    } catch {
      // Storage is optional; language switching still works without it.
    }

    document.querySelectorAll('[data-ru][data-en]').forEach((node) => {
      node.textContent = node.dataset[language];
    });

    document.querySelectorAll('.lang-switch button[data-lang]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.lang === language));
    });

    const values = metadata[language];
    document.title = values.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', values.description);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', values.title);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', values.description);
  }

  function bindLanguageSwitch() {
    document.querySelector('.lang-switch')?.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-lang]');
      if (button) applyLanguage(button.dataset.lang);
    });
  }

  function bindScrollProgress() {
    const progress = document.getElementById('scroll-progress');
    if (!progress) return;

    let frame = 0;
    const update = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const percentage = scrollable > 0 ? Math.min(100, Math.max(0, window.scrollY / scrollable * 100)) : 0;
      progress.style.width = `${percentage}%`;
      frame = 0;
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    update();
  }

  function revealContent() {
    // Content is never dependent on IntersectionObserver. The class only enables
    // the CSS transition and guarantees visibility if scripts, storage or APIs fail.
    document.querySelectorAll('.reveal').forEach((element) => element.classList.add('visible'));
  }

  applyLanguage(readLanguage());
  bindLanguageSwitch();
  bindScrollProgress();
  revealContent();
})();
