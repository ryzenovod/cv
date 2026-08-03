(() => {
  'use strict';

  const responsiveHref = 'responsive.css?v=20260803-city3';
  if (!document.querySelector('link[href*="responsive.css"]')) {
    const responsiveStyles = document.createElement('link');
    responsiveStyles.rel = 'stylesheet';
    responsiveStyles.href = responsiveHref;
    document.head.append(responsiveStyles);
  }

  const cityLabel = document.querySelector('.eyebrow strong');
  if (cityLabel) {
    const separator = cityLabel.previousElementSibling;
    if (separator?.textContent.trim() === '·') separator.remove();
    cityLabel.remove();
  }

  const storageKey = 'portfolio-lang';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const copy = {
    ru: {
      title: 'Егор Белоусов — цифровое здравоохранение, геоаналитика и ИИ',
      description: 'Егор Белоусов — разработчик цифровых продуктов для здравоохранения: медицинская геоаналитика, качество данных, GIS и ИИ.'
    },
    en: {
      title: 'Egor Belousov — digital health, geoanalytics and AI',
      description: 'Egor Belousov builds digital health products focused on healthcare geoanalytics, data quality, GIS and AI.'
    }
  };

  function getLanguage() {
    try {
      return localStorage.getItem(storageKey) === 'en' ? 'en' : 'ru';
    } catch (_) {
      return 'ru';
    }
  }

  function setLanguage(language) {
    const lang = language === 'en' ? 'en' : 'ru';
    document.documentElement.lang = lang;
    try { localStorage.setItem(storageKey, lang); } catch (_) {}

    document.querySelectorAll('[data-ru][data-en]').forEach((node) => {
      node.textContent = node.dataset[lang];
    });

    document.querySelectorAll('.lang-switch button[data-lang]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.lang === lang));
    });

    document.title = copy[lang].title;
    const description = document.querySelector('meta[name="description"]');
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (description) description.content = copy[lang].description;
    if (ogTitle) ogTitle.content = copy[lang].title;
    if (ogDescription) ogDescription.content = copy[lang].description;
  }

  document.querySelector('.lang-switch')?.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-lang]');
    if (button) setLanguage(button.dataset.lang);
  });

  setLanguage(getLanguage());

  const progress = document.getElementById('scroll-progress');
  let ticking = false;
  function updateProgress() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const value = max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0;
    if (progress) progress.style.width = `${value}%`;
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateProgress);
      ticking = true;
    }
  }, { passive: true });
  window.addEventListener('resize', updateProgress);
  updateProgress();

  if (!reducedMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });

    document.querySelectorAll('.reveal').forEach((node) => observer.observe(node));
  } else {
    document.querySelectorAll('.reveal').forEach((node) => node.classList.add('visible'));
  }

  if (window.location.search) {
    history.replaceState(null, '', `${window.location.pathname}${window.location.hash}`);
  }
})();
