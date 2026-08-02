(() => {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none)').matches;

  function currentLang() {
    return localStorage.getItem('portfolio-lang') || document.documentElement.lang || 'ru';
  }

  function updateDocumentMeta(lang) {
    const copy = lang === 'ru'
      ? {
          title: 'Егор Белоусов — цифровое здравоохранение, геоаналитика и ИИ',
          description: 'Егор Белоусов — разработчик цифровых продуктов для здравоохранения. Геоаналитика, медицинские данные и ИИ.'
        }
      : {
          title: 'Egor Belousov — digital health, geoanalytics and AI',
          description: 'Egor Belousov builds digital products for healthcare, combining geoanalytics, medical data and AI.'
        };

    document.title = copy.title;
    const description = document.querySelector('meta[name="description"]');
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (description) description.content = copy.description;
    if (ogTitle) ogTitle.content = copy.title;
    if (ogDescription) ogDescription.content = copy.description;
  }

  function applyLang(lang) {
    if (typeof window.setLang === 'function') window.setLang(lang);
    document.querySelectorAll('.lang-switch button').forEach((button) => {
      button.classList.toggle('on', button.dataset.lang === lang);
      button.setAttribute('aria-pressed', button.dataset.lang === lang ? 'true' : 'false');
    });
    updateDocumentMeta(lang);
  }

  function setLocalizedText(selector, ru, en) {
    const node = document.querySelector(selector);
    if (!node) return;
    node.dataset.ru = ru;
    node.dataset.en = en;
    node.textContent = currentLang() === 'en' ? en : ru;
  }

  function polishCopy() {
    setLocalizedText(
      '.eyebrow span:nth-child(2)',
      'Цифровые продукты · здравоохранение · аналитика',
      'Digital products · healthcare · analytics'
    );
    setLocalizedText(
      '.lead',
      'Делаю цифровые продукты для здравоохранения — от геоаналитики и качества данных до ИИ-инструментов.',
      'I build digital products for healthcare — from geoanalytics and data quality to practical AI tools.'
    );
    setLocalizedText(
      '.statement',
      'Я разработчик с бэкграундом в прикладной информатике. Люблю задачи, где нужно разобраться в сложном процессе, привести в порядок данные и довести решение до рабочего внедрения.',
      'I am a developer with a background in applied informatics. I work best on problems that require understanding a complex process, cleaning up the data and shipping a working solution.'
    );

    setLocalizedText('.facts .fact:nth-child(2) small', 'Специализация', 'Specialization');
    setLocalizedText('.facts .fact:nth-child(2) strong', 'Цифровое здравоохранение', 'Digital health');
    setLocalizedText('.facts .fact:nth-child(2) p', 'Медицинская аналитика, GIS и автоматизация', 'Healthcare analytics, GIS and automation');
    setLocalizedText('.facts .fact:nth-child(3) small', 'Опыт', 'Experience');
    setLocalizedText('.facts .fact:nth-child(3) strong', 'Разработка внутри медицинской организации', 'Development inside a healthcare organization');
    setLocalizedText('.facts .fact:nth-child(3) p', 'От требований и архитектуры до продакшена', 'From requirements and architecture to production');

    const firstCard = document.querySelector('.projects .card:nth-child(1)');
    if (firstCard) {
      const label = firstCard.querySelector('.label');
      if (label) label.textContent = 'HEALTHCARE / GIS / ANALYTICS';
    }
    setLocalizedText('.projects .card:nth-child(1) .meta span:last-child', 'Рабочий проект', 'Production project');
    setLocalizedText('.projects .card:nth-child(1) h3', 'МедГео Аналитика', 'MedGeo Analytics');
    setLocalizedText(
      '.projects .card:nth-child(1) .body > p',
      'Карта и аналитика для противотуберкулёзной службы: территориальные показатели, реестр случаев, рецидивы, импорт и контроль качества адресов.',
      'Mapping and analytics for a tuberculosis care service: territorial indicators, case registry, recurrences, imports and address quality control.'
    );
    document.querySelector('.projects .card:nth-child(1) .note')?.remove();

    setLocalizedText(
      '.projects .card:nth-child(2) .body > p',
      'ВКР, собранная как полноценный продукт: скоринг, объяснение факторов риска, ручная проверка, ожидаемые потери и оптимизация портфеля.',
      'A bachelor’s thesis built as a complete product: scoring, risk-factor explanations, manual review, expected losses and portfolio optimization.'
    );
    setLocalizedText(
      '.projects .card:nth-child(3) .body > p',
      'На международном хакатоне мы собрали цепочку агентов: маршрутизация запроса, поиск доказательств, проверка правил и итоговый отчёт.',
      'At an international hackathon, our team built an agent pipeline for routing, evidence retrieval, rule checks and final reporting.'
    );

    setLocalizedText('.focus h2', 'Над чем работаю', 'What I work on');
    const focusWords = [
      ['МедГео Аналитика', 'MedGeo Analytics'],
      ['Геокодирование', 'Geocoding'],
      ['Медицинская статистика', 'Health statistics'],
      ['Продуктовая аналитика', 'Product analytics']
    ];
    document.querySelectorAll('.focus .words span').forEach((node, index) => {
      const pair = focusWords[index];
      if (!pair) return;
      node.dataset.ru = pair[0];
      node.dataset.en = pair[1];
      node.textContent = currentLang() === 'en' ? pair[1] : pair[0];
    });

    setLocalizedText('.contactbox h2', 'Связаться', 'Get in touch');
    setLocalizedText(
      '.contactbox > p',
      'По проектам, работе и сотрудничеству — пишите в Telegram или на почту.',
      'For projects, work or collaboration, message me on Telegram or email.'
    );

    const tickerRu = ['ЗДРАВООХРАНЕНИЕ', 'ГЕОАНАЛИТИКА', 'ИИ-СИСТЕМЫ', 'ПРОДУКТОВОЕ МЫШЛЕНИЕ', 'КАЧЕСТВО ДАННЫХ'];
    const tickerEn = ['HEALTHCARE', 'GEOANALYTICS', 'AI SYSTEMS', 'PRODUCT THINKING', 'DATA QUALITY'];
    document.querySelectorAll('.ticker .track span').forEach((node, index) => {
      const i = index % tickerRu.length;
      node.dataset.ru = tickerRu[i];
      node.dataset.en = tickerEn[i];
      node.textContent = currentLang() === 'en' ? tickerEn[i] : tickerRu[i];
    });

    applyLang(currentLang());
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
    try {
      if (sessionStorage.getItem('portfolio-intro-seen')) return;
      sessionStorage.setItem('portfolio-intro-seen', '1');
    } catch (_) {}

    const intro = document.createElement('div');
    intro.className = 'intro-screen';
    intro.innerHTML = '<div class="intro-mark">EB</div>';
    document.body.prepend(intro);
    requestAnimationFrame(() => setTimeout(() => intro.classList.add('done'), 420));
    setTimeout(() => intro.remove(), 1450);
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
    canvas.setAttribute('aria-hidden', 'true');
    visual.prepend(canvas);

    const metrics = document.createElement('div');
    metrics.className = 'hero-metrics';
    metrics.innerHTML = `
      <div class="hero-metric"><strong>3</strong><span data-ru="основных проекта" data-en="selected projects">основных проекта</span></div>
      <div class="hero-metric"><strong>PROD</strong><span data-ru="рабочая система" data-en="deployed system">рабочая система</span></div>
      <div class="hero-metric"><strong>WIN</strong><span data-ru="Я — профессионал" data-en="I Am a Professional">Я — профессионал</span></div>`;
    visual.append(metrics);

    const poster = visual.querySelector('.mainposter');
    if (poster) poster.insertAdjacentHTML('beforeend', '<span class="scanline"></span>');

    const eyebrow = document.querySelector('.eyebrow span:last-child');
    if (eyebrow) eyebrow.insertAdjacentHTML('afterend', `<span aria-hidden="true">/</span><span class="live-rotor">${currentLang() === 'ru' ? 'геоаналитика' : 'geoanalytics'}</span>`);

    if (!prefersReduced && !isTouch) animateNetwork(canvas);
    else canvas.remove();
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
      points = Array.from({ length: width < 500 ? 14 : 26 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - .5) * .2,
        vy: (Math.random() - .5) * .2,
        r: Math.random() * 1.4 + .6
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
      if (entry.isIntersecting && !frame && !document.hidden) draw();
      if ((!entry.isIntersecting || document.hidden) && frame) {
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
      image.decoding = 'async';
      art.prepend(image);
    });

    if (!isTouch && !prefersReduced) {
      document.querySelectorAll('.card').forEach((card) => {
        card.addEventListener('pointermove', (event) => {
          const rect = card.getBoundingClientRect();
          const rx = ((event.clientY - rect.top) / rect.height - .5) * -2.6;
          const ry = ((event.clientX - rect.left) / rect.width - .5) * 3.4;
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
        <div class="heading"><span class="index">02.5</span><h2 data-ru="Системы в деталях" data-en="Systems in detail">Системы в деталях</h2></div>
        <div class="visual-grid">
          <article class="visual-tile"><img src="assets/medgeo-dashboard.svg" alt="Medical geoanalytics interface" loading="lazy" decoding="async"><div class="visual-caption"><strong data-ru="Карта, показатели, качество адресов" data-en="Maps, metrics and address quality">Карта, показатели, качество адресов</strong><span>GIS / QUALITY / METRICS</span></div></article>
          <article class="visual-tile"><img src="assets/openrisk-dashboard.svg" alt="Risk decision interface" loading="lazy" decoding="async"><div class="visual-caption"><strong data-ru="Скоринг с объяснением факторов" data-en="Scoring with factor explanations">Скоринг с объяснением факторов</strong><span>PD / EL / XAI</span></div></article>
          <article class="visual-tile"><img src="assets/agent-flow.svg" alt="Multi-agent workflow" loading="lazy" decoding="async"><div class="visual-caption"><strong data-ru="Маршрутизация, поиск и проверка" data-en="Routing, retrieval and review">Маршрутизация, поиск и проверка</strong><span>ROUTING / RAG / REVIEW</span></div></article>
        </div>
      </section>
      <section class="shell system-map-section motion-in" id="system-map">
        <div class="system-map-card">
          <img src="assets/system-map.svg" alt="Data to decision system map" loading="lazy" decoding="async">
          <div class="system-map-copy">
            <div class="kicker">DATA → DECISION</div>
            <h3 data-ru="От файла до решения" data-en="From file to decision">От файла до решения</h3>
            <p data-ru="Сначала проверяю и нормализую входные данные, затем считаю показатели и вывожу результат в интерфейс. Так меньше ручной работы и проще находить ошибки." data-en="I validate and normalize the input first, then calculate metrics and present the result in the interface. This reduces manual work and makes errors easier to spot.">Сначала проверяю и нормализую входные данные, затем считаю показатели и вывожу результат в интерфейс. Так меньше ручной работы и проще находить ошибки.</p>
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
    hit.innerHTML = '<img loading="lazy" decoding="async" alt="Portfolio views" src="https://hits.sh/ryzenovod.github.io/cv.svg?style=flat-square&label=views&color=ff4fc7&labelColor=17121d">';
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
      ru: ['геоаналитика', 'медданные', 'архитектура', 'внедрение'],
      en: ['geoanalytics', 'health data', 'architecture', 'delivery']
    };
    let index = 0;
    setInterval(() => {
      const rotor = document.querySelector('.live-rotor');
      if (!rotor || document.hidden) return;
      const lang = currentLang();
      rotor.animate([{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-7px)' }], { duration: 180, fill: 'forwards' }).finished.then(() => {
        rotor.textContent = words[lang][index++ % words[lang].length];
        rotor.animate([{ opacity: 0, transform: 'translateY(7px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 240, fill: 'forwards' });
      });
    }, 2300);
  }

  addIntro();
  polishCopy();
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
