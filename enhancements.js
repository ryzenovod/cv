(() => {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none)').matches;

  function currentLang() {
    return localStorage.getItem('portfolio-lang') || document.documentElement.lang || 'ru';
  }

  function applyLang(lang) {
    if (typeof window.setLang === 'function') window.setLang(lang);
    document.querySelectorAll('.lang-switch button').forEach((button) => {
      button.classList.toggle('on', button.dataset.lang === lang);
      button.setAttribute('aria-pressed', button.dataset.lang === lang ? 'true' : 'false');
    });
  }

  function buildLanguageSwitch() {
    const old = document.getElementById('lang');
    if (!old) return;
    const wrap = document.createElement('div');
    wrap.className = 'lang-switch';
    wrap.setAttribute('aria-label', 'Language');
    wrap.innerHTML = '<button type="button" data-lang="ru">RU</button><span class="slash">/</span><button type="button" data-lang="en">EN</button>';
    old.replaceWith(wrap);
    wrap.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-lang]');
      if (button) applyLang(button.dataset.lang);
    });
    applyLang(currentLang());
  }

  function addIntro() {
    if (prefersReduced) return;
    const intro = document.createElement('div');
    intro.className = 'intro-screen';
    intro.innerHTML = '<div class="intro-mark">EB</div>';
    document.body.prepend(intro);
    requestAnimationFrame(() => setTimeout(() => intro.classList.add('done'), 520));
    setTimeout(() => intro.remove(), 1600);
  }

  function addScrollProgress() {
    const bar = document.createElement('div');
    bar.id = 'scroll-progress';
    document.body.append(bar);
    const update = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.width = `${max > 0 ? (scrollY / max) * 100 : 0}%`;
    };
    addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    update();
  }

  function addPointerGlow() {
    if (isTouch || prefersReduced) return;
    const glow = document.createElement('div');
    glow.className = 'pointer-glow';
    document.body.append(glow);
    addEventListener('pointermove', (event) => {
      glow.style.left = `${event.clientX}px`;
      glow.style.top = `${event.clientY}px`;
      document.body.classList.add('pointer-active');
    }, { passive: true });
    addEventListener('pointerleave', () => document.body.classList.remove('pointer-active'));
  }

  function addHeroActivity() {
    const visual = document.querySelector('.visual');
    if (!visual) return;

    const canvas = document.createElement('canvas');
    canvas.className = 'motion-canvas';
    visual.prepend(canvas);

    const metrics = document.createElement('div');
    metrics.className = 'hero-metrics';
    metrics.innerHTML = `
      <div class="hero-metric"><strong>3</strong><span data-ru="ключевых проекта" data-en="flagship projects">ключевых проекта</span></div>
      <div class="hero-metric"><strong>C1 / C2</strong><span data-ru="английский" data-en="English">английский</span></div>
      <div class="hero-metric"><strong>2026</strong><span data-ru="новый этап" data-en="next chapter">новый этап</span></div>`;
    visual.append(metrics);

    const poster = visual.querySelector('.mainposter');
    if (poster) poster.insertAdjacentHTML('beforeend', '<span class="scanline"></span>');

    const eyebrow = document.querySelector('.eyebrow span:last-child');
    if (eyebrow) eyebrow.insertAdjacentHTML('afterend', '<span aria-hidden="true">/</span><span class="live-rotor">systems</span>');

    if (!prefersReduced) animateNetwork(canvas);
  }

  function animateNetwork(canvas) {
    const context = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    let dpr = 1;
    let points = [];
    let frame = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(2, devicePixelRatio || 1);
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      points = Array.from({ length: width < 500 ? 18 : 30 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - .5) * .22,
        vy: (Math.random() - .5) * .22,
        r: Math.random() * 1.5 + .6
      }));
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);
      points.forEach((point) => {
        point.x += point.vx;
        point.y += point.vy;
        if (point.x < 0 || point.x > width) point.vx *= -1;
        if (point.y < 0 || point.y > height) point.vy *= -1;
      });
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const dx = points[i].x - points[j].x;
          const dy = points[i].y - points[j].y;
          const distance = Math.hypot(dx, dy);
          if (distance < 118) {
            context.strokeStyle = `rgba(238,124,255,${(1 - distance / 118) * .18})`;
            context.lineWidth = .7;
            context.beginPath();
            context.moveTo(points[i].x, points[i].y);
            context.lineTo(points[j].x, points[j].y);
            context.stroke();
          }
        }
      }
      points.forEach((point, index) => {
        context.fillStyle = index % 4 === 0 ? 'rgba(255,79,199,.75)' : 'rgba(129,152,255,.5)';
        context.beginPath();
        context.arc(point.x, point.y, point.r, 0, Math.PI * 2);
        context.fill();
      });
      frame = requestAnimationFrame(draw);
    };

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !frame) draw();
      if (!entry.isIntersecting && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    });
    observer.observe(canvas);
    resize();
    addEventListener('resize', resize);
  }

  function enhanceProjects() {
    const sources = [
      ['assets/medgeo-dashboard.svg', 'Medical geoanalytics dashboard'],
      ['assets/openrisk-dashboard.svg', 'OpenRisk decision dashboard'],
      ['assets/agent-flow.svg', 'Multi-agent system diagram']
    ];
    document.querySelectorAll('.card .art').forEach((art, index) => {
      const source = sources[index];
      if (!source) return;
      art.classList.add('enhanced');
      const image = document.createElement('img');
      image.className = 'project-visual';
      image.src = source[0];
      image.alt = source[1];
      image.loading = 'lazy';
      art.prepend(image);
    });

    if (!isTouch && !prefersReduced) {
      document.querySelectorAll('.card').forEach((card) => {
        card.addEventListener('pointermove', (event) => {
          const rect = card.getBoundingClientRect();
          const rx = ((event.clientY - rect.top) / rect.height - .5) * -3.5;
          const ry = ((event.clientX - rect.left) / rect.width - .5) * 4.5;
          card.style.transform = `perspective(1200px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
        });
        card.addEventListener('pointerleave', () => card.style.transform = '');
      });
    }
  }

  function addVisualSections() {
    const projects = document.getElementById('projects');
    if (!projects) return;
    projects.insertAdjacentHTML('afterend', `
      <section class="shell visual-showcase motion-in" id="visuals">
        <div class="heading"><span class="index">02.5</span><h2 data-ru="Внутри систем" data-en="Inside the systems">Внутри систем</h2></div>
        <div class="visual-grid">
          <article class="visual-tile"><img src="assets/medgeo-dashboard.svg" alt="Medical geoanalytics interface" loading="lazy"><div class="visual-caption"><strong data-ru="Данные становятся картой решений" data-en="Data becomes a map for decisions">Данные становятся картой решений</strong><span>GIS / QUALITY / METRICS</span></div></article>
          <article class="visual-tile"><img src="assets/openrisk-dashboard.svg" alt="Risk decision interface" loading="lazy"><div class="visual-caption"><strong data-ru="Модель объясняет риск" data-en="The model explains risk">Модель объясняет риск</strong><span>PD / EL / XAI</span></div></article>
          <article class="visual-tile"><img src="assets/agent-flow.svg" alt="Multi-agent workflow" loading="lazy"><div class="visual-caption"><strong data-ru="Агенты работают как система" data-en="Agents work as a system">Агенты работают как система</strong><span>ROUTING / RAG / REVIEW</span></div></article>
        </div>
      </section>
      <section class="shell system-map-section motion-in" id="system-map">
        <div class="system-map-card">
          <img src="assets/system-map.svg" alt="Data to decision system map" loading="lazy">
          <div class="system-map-copy">
            <div class="kicker">DATA → DECISION</div>
            <h3 data-ru="Архитектура как часть продукта" data-en="Architecture is part of the product">Архитектура как часть продукта</h3>
            <p data-ru="Проектирую не отдельные экраны, а полный путь данных: импорт, проверка, нормализация, аналитика и понятный управленческий результат." data-en="I design the complete data journey: ingestion, validation, normalization, analytics and a clear management outcome.">Проектирую не отдельные экраны, а полный путь данных: импорт, проверка, нормализация, аналитика и понятный управленческий результат.</p>
          </div>
        </div>
      </section>`);
    applyLang(currentLang());
  }

  function addActionRail() {
    const ids = ['top', 'about', 'projects', 'visuals', 'achievements', 'contact'];
    const rail = document.createElement('nav');
    rail.className = 'action-rail';
    rail.setAttribute('aria-label', 'Page sections');
    rail.innerHTML = ids.map((id) => `<a href="#${id}" aria-label="${id}"></a>`).join('');
    document.body.append(rail);
    const links = [...rail.querySelectorAll('a')];
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          links.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
        }
      });
    }, { rootMargin: '-42% 0px -48%' });
    ids.map((id) => document.getElementById(id)).filter(Boolean).forEach((section) => observer.observe(section));
  }

  function addHits() {
    const footer = document.querySelector('footer');
    if (!footer || footer.querySelector('.hits-badge')) return;
    const hit = document.createElement('a');
    hit.className = 'hits-badge';
    hit.href = 'https://hits.sh/ryzenovod.github.io/cv/';
    hit.target = '_blank';
    hit.rel = 'noreferrer';
    hit.title = 'View statistics';
    hit.innerHTML = '<img alt="Portfolio views" src="https://hits.sh/ryzenovod.github.io/cv.svg?style=flat-square&label=views&color=ff4fc7&labelColor=17121d">';
    footer.insertBefore(hit, footer.lastElementChild);
  }

  function addMotionObserver() {
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    }), { threshold: .12 });
    document.querySelectorAll('.motion-in').forEach((element) => observer.observe(element));
  }

  function startRotor() {
    const words = {
      ru: ['системы', 'данные', 'продукты', 'решения'],
      en: ['systems', 'data', 'products', 'decisions']
    };
    let index = 0;
    setInterval(() => {
      const rotor = document.querySelector('.live-rotor');
      if (!rotor) return;
      const lang = currentLang();
      rotor.animate([{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-7px)' }], { duration: 180, fill: 'forwards' }).finished.then(() => {
        rotor.textContent = words[lang][index++ % words[lang].length];
        rotor.animate([{ opacity: 0, transform: 'translateY(7px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 240, fill: 'forwards' });
      });
    }, 2100);
  }

  addIntro();
  buildLanguageSwitch();
  addScrollProgress();
  addPointerGlow();
  addHeroActivity();
  enhanceProjects();
  addVisualSections();
  addActionRail();
  addHits();
  addMotionObserver();
  startRotor();
})();
