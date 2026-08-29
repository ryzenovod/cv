(() => {
  'use strict';

  const root = document.documentElement;
  const storageKey = 'portfolio-lang';
  const metadata = {
    ru: {
      title: 'Егор Белоусов — разработчик цифровых продуктов',
      description: 'Егор Белоусов — разработчик цифровых продуктов, backend- и data-систем. Python, FastAPI, PostgreSQL, PostGIS, React, Docker и прикладной AI.'
    },
    en: {
      title: 'Egor Belousov — digital product developer',
      description: 'Egor Belousov develops digital products, backend services and data systems with Python, FastAPI, PostgreSQL, PostGIS, React, Docker and applied AI.'
    }
  };

  root.classList.add('js');

  function readLanguage() {
    try {
      return localStorage.getItem(storageKey) === 'en' ? 'en' : 'ru';
    } catch {
      return 'ru';
    }
  }

  function setMeta(selector, value) {
    document.querySelector(selector)?.setAttribute('content', value);
  }

  function applyLanguage(value) {
    const language = value === 'en' ? 'en' : 'ru';
    const values = metadata[language];

    root.lang = language;
    root.dataset.lang = language;

    try {
      localStorage.setItem(storageKey, language);
    } catch {
      // Language switching does not depend on storage access.
    }

    document.querySelectorAll('[data-ru][data-en]').forEach((node) => {
      node.textContent = node.dataset[language];
    });

    document.querySelectorAll('[data-alt-ru][data-alt-en]').forEach((image) => {
      image.alt = image.dataset[`alt${language === 'ru' ? 'Ru' : 'En'}`];
    });

    document.querySelectorAll('.lang-switch button[data-lang]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.lang === language));
    });

    document.title = values.title;
    setMeta('meta[name="description"]', values.description);
    setMeta('meta[property="og:title"]', values.title);
    setMeta('meta[property="og:description"]', values.description);
    setMeta('meta[property="og:locale"]', language === 'ru' ? 'ru_RU' : 'en_US');
    setMeta('meta[name="twitter:title"]', values.title);
    setMeta('meta[name="twitter:description"]', values.description);
  }

  function bindLanguageSwitch() {
    document.querySelector('.lang-switch')?.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-lang]');
      if (button) applyLanguage(button.dataset.lang);
    });
  }

  function bindScrollProgress() {
    const progress = document.getElementById('scroll-progress');
    const contact = document.getElementById('contact');
    const carPattern = document.getElementById('scroll-train-car');
    if (!progress) return;

    let frame = 0;
    const update = () => {
      const scrollable = root.scrollHeight - window.innerHeight;
      const carStripWidth = Math.max(0, window.innerWidth - 65);
      const scrollPadding = Number.parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
      const contactTop = contact ? contact.getBoundingClientRect().top + window.scrollY - scrollPadding : scrollable;
      const completionPoint = Math.min(scrollable, Math.max(1, contactTop));
      const percentage = scrollable > 0 ? Math.min(100, Math.max(0, window.scrollY / completionPoint * 100)) : 0;
      carPattern?.setAttribute('x', String(carStripWidth % 64));
      progress.style.setProperty('--scroll-position', `${percentage}%`);
      frame = 0;
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('load', schedule, { once: true });
    update();
  }

  function bindReveal() {
    const elements = [...document.querySelectorAll('.reveal')];
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      elements.forEach((element) => element.classList.add('visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    elements.forEach((element) => observer.observe(element));
  }

  function bindActiveNavigation() {
    const links = [...document.querySelectorAll('.site-nav a[href^="#"]')];
    const targets = links
      .map((link) => document.querySelector(link.getAttribute('href')))
      .filter(Boolean);

    if (!links.length || !targets.length || !('IntersectionObserver' in window)) return;

    const setActive = (id) => {
      links.forEach((link) => {
        if (link.getAttribute('href') === `#${id}`) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    };

    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActive(visible.target.id);
    }, { rootMargin: '-22% 0px -62% 0px', threshold: [0, 0.15, 0.4] });

    targets.forEach((target) => observer.observe(target));
  }

  function bindProjectPreviews() {
    const dialog = document.getElementById('project-dialog');
    const dialogImage = document.getElementById('project-dialog-image');
    const dialogTitle = document.getElementById('project-dialog-title');
    const previews = [...document.querySelectorAll('.project-preview')];
    if (!dialog || !dialogImage || !dialogTitle || !previews.length) return;

    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)');

    previews.forEach((preview) => {
      const resetTilt = () => {
        preview.style.setProperty('--tilt-x', '0deg');
        preview.style.setProperty('--tilt-y', '0deg');
        preview.style.setProperty('--spot-x', '50%');
        preview.style.setProperty('--spot-y', '50%');
      };

      preview.addEventListener('pointermove', (event) => {
        if (reducedMotion.matches || !finePointer.matches) return;
        const rect = preview.getBoundingClientRect();
        const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
        const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
        preview.style.setProperty('--tilt-x', `${(0.5 - y) * 5}deg`);
        preview.style.setProperty('--tilt-y', `${(x - 0.5) * 6}deg`);
        preview.style.setProperty('--spot-x', `${x * 100}%`);
        preview.style.setProperty('--spot-y', `${y * 100}%`);
      });
      preview.addEventListener('pointerleave', resetTilt);
      preview.addEventListener('blur', resetTilt);

      preview.addEventListener('click', () => {
        const image = preview.querySelector('img');
        const language = root.dataset.lang === 'en' ? 'en' : 'ru';
        if (!image) return;
        dialogTitle.textContent = preview.dataset[`previewTitle${language === 'ru' ? 'Ru' : 'En'}`];
        dialogImage.src = image.currentSrc || image.src;
        dialogImage.alt = image.alt;
        dialog.showModal();
      });
    });

    dialog.querySelector('[data-dialog-close]')?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
  }

  document.getElementById('year').textContent = String(new Date().getFullYear());
  applyLanguage(readLanguage());
  bindLanguageSwitch();
  bindScrollProgress();
  bindReveal();
  bindActiveNavigation();
  bindProjectPreviews();
})();
