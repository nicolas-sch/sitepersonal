(function () {
  'use strict';

  var SUPPORTED = ['en', 'es', 'pt'];
  var root = document.documentElement;
  var current = 'en';

  /* ---------- helpers ---------- */

  function safeGet(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function safeSet(key, value) {
    try { localStorage.setItem(key, value); } catch (e) {}
  }

  function yearsOfExperience() {
    var parts = window.CAREER_START.split('-');
    var start = new Date(+parts[0], +parts[1] - 1, 1);
    var now = new Date();
    var years = now.getFullYear() - start.getFullYear();
    if (now.getMonth() < start.getMonth()) years -= 1;
    return Math.max(years, 0);
  }

  function t(key) {
    var dict = window.I18N[current];
    var value = dict[key];
    if (value === undefined) value = window.I18N.en[key];
    if (typeof value === 'string') return value.replace(/\{years\}/g, yearsOfExperience());
    return value;
  }

  function formatMonth(iso) {
    var p = iso.split('-');
    var date = new Date(+p[0], +p[1] - 1, 1);
    var text = new Intl.DateTimeFormat(window.LOCALES[current], { month: 'short', year: 'numeric' }).format(date);
    text = text.replace(/\./g, '');
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function dateRange(start, end) {
    return formatMonth(start) + ' – ' + (end ? formatMonth(end) : t('exp.present'));
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function fillList(listId, items, itemClass) {
    var list = document.getElementById(listId);
    list.textContent = '';
    items.forEach(function (text) { list.appendChild(el('li', itemClass, text)); });
  }

  /* ---------- static text ---------- */

  function applyStatic() {
    document.querySelectorAll('[data-i18n]').forEach(function (node) {
      var value = t(node.dataset.i18n);
      if (typeof value === 'string') node.textContent = value;
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function (node) {
      var value = t(node.dataset.i18nHtml);
      if (typeof value === 'string') node.innerHTML = value; // trusted, authored in i18n.js
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (node) {
      node.setAttribute('aria-label', t(node.dataset.i18nAria));
    });
    document.getElementById('hero-lead').textContent = t('hero.lead');
    document.title = t('meta.title');
    var desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', t('meta.desc'));
    var ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', t('meta.title'));
    var ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', t('meta.desc'));
  }

  /* ---------- rendered sections ---------- */

  function renderStats() {
    var list = document.getElementById('stats');
    list.textContent = '';
    var stats = [
      [yearsOfExperience() + '+', t('stats.years')],
      ['2', t('stats.countries')],
      ['3', t('stats.languages')],
      ['2', t('stats.credentials')]
    ];
    stats.forEach(function (s) {
      var li = el('li', 'stat');
      li.appendChild(el('strong', 'stat__num', s[0]));
      li.appendChild(el('span', 'stat__label', s[1]));
      list.appendChild(li);
    });
  }

  function renderTracks() {
    fillList('track-dev', t('track.dev.items'));
    fillList('track-pm', t('track.pm.items'));
  }

  function renderTimeline() {
    var list = document.getElementById('timeline');
    list.textContent = '';
    window.EXPERIENCE.forEach(function (job) {
      var li = el('li', 'job reveal');
      var card = el('article', 'card job__card');

      var head = el('header', 'job__head');
      var titleWrap = el('div');
      titleWrap.appendChild(el('h3', 'job__role', t('role.' + job.role)));
      var company = job.companyKey ? t(job.companyKey) : job.company;
      var companyLine = el('p', 'job__company', company);
      if (job.client) companyLine.appendChild(el('span', 'job__client', ' · ' + job.client));
      titleWrap.appendChild(companyLine);
      head.appendChild(titleWrap);

      var meta = el('div', 'job__meta');
      meta.appendChild(el('span', 'job__dates', dateRange(job.start, job.end)));
      meta.appendChild(el('span', 'job__place', job.city + ', ' + t('country.' + job.country)));
      head.appendChild(meta);
      card.appendChild(head);

      if (!job.end) {
        li.classList.add('job--current');
        card.insertBefore(el('span', 'pill', t('exp.current')), head);
      }

      var bullets = el('ul', 'ticks ticks--sm');
      job.bullets[current].forEach(function (b) { bullets.appendChild(el('li', null, b)); });
      card.appendChild(bullets);

      var tags = el('ul', 'tags');
      job.tech.forEach(function (name) { tags.appendChild(el('li', 'tag', name)); });
      card.appendChild(tags);

      li.appendChild(card);
      list.appendChild(li);
    });
  }

  function renderSkills() {
    var stack = document.getElementById('stack');
    stack.textContent = '';
    window.STACK.forEach(function (group) {
      var card = el('div', 'card stack__group reveal' + (group.accent ? ' stack__group--accent' : ''));
      card.appendChild(el('h3', null, t('skills.group.' + group.key)));
      var tags = el('ul', 'tags');
      group.items.forEach(function (name) { tags.appendChild(el('li', 'tag', name)); });
      card.appendChild(tags);
      stack.appendChild(card);
    });
    fillList('strengths', t('strengths'), 'chip');
  }

  function eduCard(opts) {
    var card = el('article', 'card edu' + (opts.accent ? ' edu--accent' : '') + ' reveal');
    var top = el('div', 'edu__top');
    var icon = el('span', 'edu__icon');
    icon.innerHTML = '<svg class="icon"><use href="#' + (opts.accent ? 'i-award' : 'i-cap') + '"/></svg>';
    top.appendChild(icon);
    if (opts.tag) top.appendChild(el('span', 'pill', opts.tag));
    card.appendChild(top);
    card.appendChild(el('h3', 'edu__title', opts.title));
    card.appendChild(el('p', 'edu__org', opts.org));
    if (opts.meta) card.appendChild(el('p', 'edu__meta', opts.meta));
    if (opts.desc) card.appendChild(el('p', 'edu__desc', opts.desc));
    return card;
  }

  function renderEducation() {
    var grid = document.getElementById('edu-grid');
    grid.textContent = '';

    function group(titleKey, className) {
      var wrap = el('div', 'edu-group ' + className);
      wrap.appendChild(el('h3', 'subhead reveal', t(titleKey)));
      var inner = el('div', 'edu-cards');
      wrap.appendChild(inner);
      grid.appendChild(wrap);
      return inner;
    }

    var pm = group('edu.pm', 'edu-group--pm');
    pm.appendChild(eduCard({
      accent: true,
      title: 'PMI Project Management Ready™ Certification (PMI-RC)',
      org: 'Project Management Institute (PMI)',
      tag: t('edu.pmi.tag'),
      desc: t('edu.pmi.desc')
    }));
    pm.appendChild(eduCard({
      accent: true,
      title: t('edu.scrum.title'),
      org: 'Femxa',
      tag: t('edu.scrum.tag'),
      desc: t('edu.scrum.desc')
    }));

    var academic = group('edu.academic', 'edu-group--academic');
    academic.appendChild(eduCard({
      title: t('edu.degree.title'),
      org: 'Anhanguera Educacional · Porto Alegre',
      meta: formatMonth('2022-01') + ' – ' + t('edu.inProgress')
    }));
    academic.appendChild(eduCard({
      title: t('edu.bootcamp.title'),
      org: 'Rocketseat · São Paulo',
      meta: formatMonth('2019-01') + ' – ' + formatMonth('2019-03'),
      desc: 'HTML, CSS, JS'
    }));
    academic.appendChild(eduCard({
      title: t('edu.bootcamp.title'),
      org: 'Rocketseat · São Paulo',
      meta: formatMonth('2019-04') + ' – ' + formatMonth('2019-09'),
      desc: 'ReactJS, React Native, SQL, MySQL, Node.js'
    }));

    var courses = el('div', 'edu-group edu-group--courses');
    courses.appendChild(el('h3', 'subhead reveal', t('edu.courses')));
    var chips = el('ul', 'chips reveal');
    t('edu.courses.items').forEach(function (c) { chips.appendChild(el('li', 'chip', c)); });
    courses.appendChild(chips);
    grid.appendChild(courses);
  }

  function renderLanguages() {
    var list = document.getElementById('langs');
    list.textContent = '';
    [
      ['lang.es', 'level.native', 100],
      ['lang.pt', 'level.native', 100],
      ['lang.en', 'level.b2', 67]
    ].forEach(function (l) {
      var li = el('li', 'langs__item');
      var head = el('div', 'langs__head');
      head.appendChild(el('strong', null, t(l[0])));
      head.appendChild(el('span', null, t(l[1])));
      var bar = el('div', 'bar');
      var fill = el('span', 'bar__fill');
      fill.style.setProperty('--w', l[2] + '%');
      bar.appendChild(fill);
      li.appendChild(head);
      li.appendChild(bar);
      list.appendChild(li);
    });
  }

  /* ---------- language ---------- */

  function detectLanguage() {
    var fromUrl = new URLSearchParams(location.search).get('lang');
    if (SUPPORTED.indexOf(fromUrl) !== -1) return fromUrl;
    var saved = safeGet('lang');
    if (SUPPORTED.indexOf(saved) !== -1) return saved;
    var nav = (navigator.language || 'en').slice(0, 2).toLowerCase();
    return SUPPORTED.indexOf(nav) !== -1 ? nav : 'en';
  }

  function setLanguage(lang, persist) {
    current = lang;
    root.lang = lang;
    if (persist) {
      safeSet('lang', lang);
      var url = new URL(location.href);
      url.searchParams.set('lang', lang);
      history.replaceState(null, '', url);
    }
    document.querySelectorAll('.lang__btn').forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(btn.dataset.lang === lang));
    });
    applyStatic();
    renderStats();
    renderTracks();
    renderTimeline();
    renderSkills();
    renderEducation();
    renderLanguages();
    observeReveals();
  }

  /* ---------- reveal on scroll ---------- */

  var observer = null;
  function observeReveals() {
    var items = document.querySelectorAll('.reveal:not(.is-visible)');
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      items.forEach(function (n) { n.classList.add('is-visible'); });
      return;
    }
    if (!observer) {
      observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    }
    items.forEach(function (n) { observer.observe(n); });
  }

  /* ---------- UI wiring ---------- */

  function wireUI() {
    document.querySelectorAll('.lang__btn').forEach(function (btn) {
      btn.addEventListener('click', function () { setLanguage(btn.dataset.lang, true); });
    });

    document.getElementById('theme-btn').addEventListener('click', function () {
      var next = root.dataset.theme === 'light' ? 'dark' : 'light';
      root.dataset.theme = next;
      safeSet('theme', next);
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', next === 'light' ? '#f7f8fb' : '#0b0d12');
    });

    document.getElementById('print-btn').addEventListener('click', function () {
      // Reveal everything first so nothing is blank in the printout.
      document.querySelectorAll('.reveal').forEach(function (n) { n.classList.add('is-visible'); });
      window.print();
    });

    var burger = document.getElementById('burger');
    var nav = document.getElementById('nav');
    function closeMenu() {
      nav.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
    }
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
    });
    document.querySelectorAll('#nav-links a').forEach(function (a) { a.addEventListener('click', closeMenu); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

    var onScroll = function () { nav.classList.toggle('is-stuck', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    // Highlight the nav link of the section in view.
    var links = {};
    document.querySelectorAll('#nav-links a').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
    if ('IntersectionObserver' in window) {
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var link = links[entry.target.id];
          if (link && entry.isIntersecting) {
            Object.keys(links).forEach(function (k) { links[k].classList.remove('is-active'); });
            link.classList.add('is-active');
          }
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      Object.keys(links).forEach(function (id) {
        var section = document.getElementById(id);
        if (section) spy.observe(section);
      });
    }

    document.getElementById('year').textContent = new Date().getFullYear();
  }

  wireUI();
  setLanguage(detectLanguage(), false);
})();
