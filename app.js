(() => {
  'use strict';

  const storageKey = 'portfolio-lang';
  const copy = {
    ru: {
      title: 'Егор Белоусов — разработчик цифровых продуктов',
      description: 'Егор Белоусов — разработчик цифровых продуктов: медицинская геоаналитика, backend, данные и внедрение.'
    },
    en: {
      title: 'Egor Belousov — digital product developer',
      description: 'Egor Belousov builds digital products focused on healthcare geoanalytics, backend systems, data quality and deployment.'
    }
  };

  const getInitialLanguage = () => {
    try {
      return localStorage.getItem(storageKey) === 'en' ? 'en' : 'ru';
    } catch {
      return 'ru';
    }
  };

  const setLanguage = (value) => {
    const language = value === 'en' ? 'en' : 'ru';
    document.documentElement.lang = language;
    document.documentElement.dataset.lang = language;

    document.querySelectorAll('button[data-lang]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.lang === language));
    });

    document.title = copy[language].title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', copy[language].description);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', copy[language].title);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', copy[language].description);

    try {
      localStorage.setItem(storageKey, language);
    } catch {
      // The switch still works when storage is unavailable.
    }
  };

  document.querySelector('.lang-switch')?.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-lang]');
    if (button) setLanguage(button.dataset.lang);
  });

  setLanguage(getInitialLanguage());
})();
