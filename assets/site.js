(function () {
  'use strict';
  var d = document.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  d.classList.add('reveal');

  /* ---------- Языки (RU — в разметке, KK/EN — в i18n.js) ---------- */
  var DICT = window.I18N || {}, LANGS = ['ru', 'kk', 'en'], curLang = 'ru';
  function norm(h) { return h.replace(/\s+/g, ' ').trim(); }
  function tr(ru, lang) { var e = lang !== 'ru' && DICT[ru]; return (e && e[lang]) || ru; }
  var i18nEls = Array.prototype.map.call(document.querySelectorAll('[data-i18n]'), function (el) { return { el: el, ru: norm(el.innerHTML) }; });
  var i18nAttrs = [];
  document.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
    el.getAttribute('data-i18n-attr').split(',').forEach(function (a) { i18nAttrs.push({ el: el, attr: a, ru: el.getAttribute(a) }); });
  });
  var metaDesc = document.querySelector('meta[name="description"]');
  var ruTitle = document.title, ruDesc = metaDesc ? metaDesc.content : '';
  function setLang(lang, save) {
    if (LANGS.indexOf(lang) < 0) lang = 'ru';
    if (lang !== curLang) {
      i18nEls.forEach(function (x) { x.el.innerHTML = tr(x.ru, lang); });
      i18nAttrs.forEach(function (x) { x.el.setAttribute(x.attr, tr(x.ru, lang)); });
      document.title = tr(ruTitle, lang);
      if (metaDesc) metaDesc.content = tr(ruDesc, lang);
      curLang = lang;
      setTimeout(drawLane, 50);
    }
    d.lang = lang;
    document.querySelectorAll('.lang-switch [data-lang]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === lang));
    });
    if (save) {
      try { localStorage.setItem('ik-lang', lang); } catch (e) {}
      try {
        var u = new URL(location.href);
        if (lang === 'ru') u.searchParams.delete('lang'); else u.searchParams.set('lang', lang);
        history.replaceState(null, '', u);
      } catch (e) {}
    }
    d.classList.remove('i18n-pending');
  }
  setLang(d.lang);
  document.querySelectorAll('.lang-switch [data-lang]').forEach(function (b) {
    b.addEventListener('click', function () { setLang(b.getAttribute('data-lang'), true); });
  });

  /* ---------- Планеты и туманность ---------- */
  if (window.Planets) {
    Planets.nebula(document.getElementById('nebula'));
    Planets.init();
  }

  /* ---------- Звёзды: глубина, мерцание, падающие звёзды, гиперпрыжок, наклон камеры ---------- */
  var cvs = document.getElementById('stars'), ctx = cvs.getContext('2d');
  var W = 0, H = 0, stars = [], warpStart = 0, raf = 0;
  var camY = 0, cam = null, shoots = [], nextShoot = performance.now() + 4000;
  var TINTS = ['#ffffff', '#d6e6ff', '#fff3d6', '#bcd5ff'];
  function build() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cvs.width = Math.round(W * dpr); cvs.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = Math.min(1200, Math.round(W * H / 2100));
    stars = [];
    for (var i = 0; i < n; i++) {
      var z = Math.random();
      stars.push({ x: Math.random() * W, y: Math.random() * H, z: z,
        r: z > .975 ? 1.4 + Math.random() * .9 : .4 + z * 1.05,
        c: TINTS[(Math.random() * TINTS.length) | 0], t: Math.random() * 6.28, s: .4 + Math.random() * 1.6 });
    }
    draw(performance.now());
  }
  function draw(now) {
    ctx.clearRect(0, 0, W, H);
    if (cam) {
      var k = Math.min(1, (now - cam.start) / cam.dur), e = 1 - Math.pow(1 - k, 3);
      camY = cam.from + (cam.to - cam.from) * e;
      if (k >= 1) cam = null;
    }
    var sy = (window.scrollY || 0) + camY, cx = W / 2, cy = H / 2, wf = 0;
    if (warpStart) {
      var p = (now - warpStart) / 1100;
      if (p >= 1) warpStart = 0; else wf = Math.sin(p * Math.PI);
    }
    for (var i = 0; i < stars.length; i++) {
      var st = stars[i];
      var y = (st.y - sy * (.012 + st.z * .07)) % H; if (y < 0) y += H;
      var x = st.x;
      var a = (.2 + .8 * st.z) * (reduce ? 1 : .55 + .45 * Math.sin(now * .001 * st.s + st.t));
      ctx.globalAlpha = Math.min(1, a + wf * .5);
      if (wf > 0) {
        var kk = wf * (.2 + st.z * .9);
        ctx.strokeStyle = st.c; ctx.lineWidth = st.r;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (x - cx) * kk, y + (y - cy) * kk); ctx.stroke();
        continue;
      }
      ctx.fillStyle = st.c;
      if (st.r > 1.4) {
        ctx.beginPath(); ctx.arc(x, y, st.r, 0, 6.283); ctx.fill();
        ctx.globalAlpha = a * .12; ctx.beginPath(); ctx.arc(x, y, st.r * 3.2, 0, 6.283); ctx.fill();
      } else {
        ctx.fillRect(x, y, st.r, st.r);
      }
    }
    if (!reduce) {
      if (now > nextShoot && !wf) {
        var ang = .35 + Math.random() * .5, sp = 9 + Math.random() * 7;
        shoots.push({ x: Math.random() * W * .8 + W * .1, y: Math.random() * H * .45, vx: Math.cos(ang) * sp * (Math.random() < .5 ? -1 : 1), vy: Math.sin(ang) * sp, life: 1 });
        nextShoot = now + 5000 + Math.random() * 9000;
      }
      for (var j = shoots.length - 1; j >= 0; j--) {
        var s = shoots[j];
        s.x += s.vx; s.y += s.vy; s.life -= .022;
        if (s.life <= 0) { shoots.splice(j, 1); continue; }
        var g = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * 9, s.y - s.vy * 9);
        g.addColorStop(0, 'rgba(255,255,255,' + s.life + ')'); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalAlpha = 1; ctx.strokeStyle = g; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * 9, s.y - s.vy * 9); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }
  function loop(now) { draw(now); raf = requestAnimationFrame(loop); }
  function warp() { if (!reduce) warpStart = performance.now(); }
  function tiltCamera(dist, dur) { if (!reduce) cam = { from: camY, to: camY + dist, start: performance.now(), dur: dur }; }
  var lastW = 0, rt = 0;
  addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      if (innerWidth !== lastW || Math.abs(innerHeight - H) > 120) { lastW = innerWidth; build(); }
      drawLane();
    }, 150);
  });
  lastW = innerWidth; build();
  if (!reduce) {
    raf = requestAnimationFrame(loop);
    document.addEventListener('visibilitychange', function () {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(loop);
    });
  } else {
    addEventListener('scroll', function () { requestAnimationFrame(draw); }, { passive: true });
  }

  /* ---------- Заставка ---------- */
  var M = window.IntroMusic || { supported: false, start: function () { return null; }, stop: function () {} };
  var intro = document.getElementById('intro');
  var skipBtn = intro.querySelector('.intro-skip'), soundBtn = intro.querySelector('.intro-sound');
  var lastLine = intro.querySelector('.crawl p:last-child');
  var INTRO_MAX = 45000, introTimer = 0, crawlWatch = 0, introStart = 0, afterIntro = [], soundOn = false;
  try { soundOn = localStorage.getItem('ik-sound') === '1'; } catch (e) {}
  if (!M.supported) soundBtn.hidden = true;
  function isOpen() { return d.classList.contains('intro-open'); }
  function whenIntroDone(fn) { if (isOpen()) afterIntro.push(fn); else fn(); }
  function elapsed() { return (performance.now() - introStart) / 1000; }
  function showSound(on) { soundBtn.setAttribute('aria-pressed', String(on)); }
  function setSound(on) {
    soundOn = on; showSound(on);
    try { localStorage.setItem('ik-sound', on ? '1' : '0'); } catch (e) {}
    if (on && isOpen()) M.start(elapsed()); else M.stop(.4);
  }
  /* Без клика браузер звук не включит: при автозапуске пробуем, а если нельзя — кнопка остаётся выключенной. */
  function tryAutoSound() {
    var m = M.start(elapsed());
    if (!m) return showSound(false);
    if (m.el) { m.ok.then(function () { showSound(true); }, function () { M.stop(0); showSound(false); }); return; }
    setTimeout(function () { var ok = m.ctx.state === 'running'; showSound(ok); if (!ok) M.stop(0); }, 250);
  }
  function arrive() {
    d.classList.remove('arrive');
    void d.offsetWidth;
    d.classList.add('arrive');
  }
  function openIntro(auto) {
    introStart = performance.now();
    showSound(false);
    if (soundOn) { if (auto) tryAutoSound(); else { M.start(0); showSound(true); } }
    if (!auto) window.scrollTo({ top: 0, behavior: 'instant' });
    intro.classList.remove('play', 'leaving');
    d.classList.add('intro-open');
    void intro.offsetWidth;
    intro.classList.add('play');
    clearTimeout(introTimer);
    introTimer = setTimeout(closeIntro, INTRO_MAX);
    /* Заставка заканчивается, когда последний абзац уплыл вглубь экрана — на любой ширине. */
    clearInterval(crawlWatch);
    crawlWatch = setInterval(function () {
      if (lastLine.getBoundingClientRect().bottom < innerHeight * .42) {
        clearInterval(crawlWatch);
        introTimer = setTimeout(closeIntro, 900);
      }
    }, 400);
    setTimeout(function () { skipBtn.focus({ preventScroll: true }); }, 60);
  }
  /* Финал как в фильме: камера опускается от текста к Татуину, сверху проходит разрушитель. */
  function closeIntro() {
    if (!isOpen() || intro.classList.contains('leaving')) return;
    clearTimeout(introTimer);
    clearInterval(crawlWatch);
    try { sessionStorage.setItem('ik-intro', '1'); } catch (e) {}
    intro.classList.add('leaving');
    M.stop(2.4);
    tiltCamera(H * 5, 2600);
    setTimeout(function () {
      d.classList.remove('intro-open');
      intro.classList.remove('play', 'leaving');
      arrive();
      afterIntro.splice(0).forEach(function (fn) { fn(); });
    }, 600);
  }
  soundBtn.addEventListener('click', function (e) { e.stopPropagation(); setSound(!soundOn); });
  intro.addEventListener('click', closeIntro);
  document.addEventListener('keydown', function (e) {
    if (!isOpen()) return;
    var onSound = e.target.closest && e.target.closest('.intro-sound');
    if (e.key === 'Escape' || (!onSound && (e.key === 'Enter' || e.key === ' '))) { e.preventDefault(); closeIntro(); }
  });
  document.querySelectorAll('[data-replay]').forEach(function (b) {
    b.addEventListener('click', function () { if (!reduce) openIntro(false); });
  });
  if (isOpen()) openIntro(true); else arrive();

  /* ---------- Появление блоков ---------- */
  whenIntroDone(function () {
    var els = document.querySelectorAll('[data-reveal]');
    if (!('IntersectionObserver' in window) || reduce) { els.forEach(function (el) { el.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .05 });
    els.forEach(function (el) { io.observe(el); });
  });

  /* ---------- Цвет неба и навигация справа следуют за текущей планетой ---------- */
  var DEFAULT_TINT = '#6f86ff';
  var rail = {};
  document.querySelectorAll('.rail a').forEach(function (a) { rail[a.getAttribute('href').slice(1)] = a; });
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var id = en.target.id, tint = en.target.getAttribute('data-tint') || DEFAULT_TINT;
        d.style.setProperty('--tint', tint);
        Object.keys(rail).forEach(function (k) { rail[k].classList.toggle('on', k === id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('.hero, .map, .world').forEach(function (s) { spy.observe(s); });
  }
  function onScroll() {
    var y = window.scrollY || 0;
    d.classList.toggle('scrolled', y > 40);
    d.classList.toggle('at-top', y < innerHeight * .8);
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- Карта: гиперпространственный путь между планетами ---------- */
  var route = document.querySelector('.route-wrap');
  function drawLane() {
    if (!route) return;
    var svg = route.querySelector('.lane'), path = svg && svg.querySelector('path');
    if (!path || getComputedStyle(svg).display === 'none') return;
    var rb = route.getBoundingClientRect();
    var pts = Array.prototype.map.call(route.querySelectorAll('.stop canvas'), function (c) {
      var b = c.getBoundingClientRect();
      return [b.left - rb.left + b.width / 2, b.top - rb.top + b.height / 2];
    });
    if (pts.length < 2) return;
    svg.setAttribute('viewBox', '0 0 ' + rb.width + ' ' + rb.height);
    var s = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      var c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      var c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      s += ' C' + c1[0].toFixed(1) + ' ' + c1[1].toFixed(1) + ' ' + c2[0].toFixed(1) + ' ' + c2[1].toFixed(1) + ' ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
    }
    path.setAttribute('d', s);
  }
  drawLane();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawLane);

  /* ---------- Прыжок к планете ---------- */
  function jumpTo(id) {
    var el = document.getElementById(id);
    if (!el) return;
    if (reduce) { el.scrollIntoView(); return; }
    warp();
    d.classList.add('jumping');
    setTimeout(function () {
      el.scrollIntoView({ behavior: 'instant', block: 'start' });
      el.querySelectorAll('[data-reveal]').forEach(function (r) { r.classList.add('in'); });
      if (el.getAttribute('data-tint')) d.style.setProperty('--tint', el.getAttribute('data-tint'));
      try { history.replaceState(null, '', location.search + '#' + id); } catch (e) {}
    }, 380);
    setTimeout(function () { d.classList.remove('jumping'); }, 950);
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-jump]');
    if (!a) return;
    e.preventDefault();
    jumpTo(a.getAttribute('href').slice(1));
  });

  /* ---------- Иногда вдалеке пролетает истребитель ---------- */
  var SHIPS = [
    '<svg viewBox="0 0 60 36" fill="currentColor"><path d="M3 2h4l3 16-3 16H3L1 18zM57 2h-4l-3 16 3 16h4l2-16z"/><rect x="9" y="16.6" width="42" height="2.8"/><circle cx="30" cy="18" r="6.6"/><circle cx="30" cy="18" r="2.8" fill="#03040a"/></svg>',
    '<svg viewBox="0 0 60 40" fill="currentColor"><path d="M30 20 2 6 1 8l27 13zM30 20 58 6l1 2-27 13zM30 20 2 34l-1-2 27-13zM30 20l28 14 1-2-27-13z"/><circle cx="30" cy="20" r="4.2"/><g fill="#ff8a6a"><circle cx="12" cy="11.4" r="2.3"/><circle cx="48" cy="11.4" r="2.3"/><circle cx="12" cy="28.6" r="2.3"/><circle cx="48" cy="28.6" r="2.3"/></g></svg>'
  ];
  var sky = document.querySelector('.sky');
  function scheduleFlyby() { setTimeout(flyby, 16000 + Math.random() * 22000); }
  function flyby() {
    if (document.hidden || isOpen() || !sky.animate) return scheduleFlyby();
    var el = document.createElement('div');
    el.className = 'flyby';
    el.innerHTML = SHIPS[Math.random() < .55 ? 0 : 1];
    var ltr = Math.random() < .5, y0 = 10 + Math.random() * 55, y1 = y0 + (Math.random() * 16 - 8);
    el.style.width = (16 + Math.random() * 20).toFixed(0) + 'px';
    sky.appendChild(el);
    var a = el.animate([
      { transform: 'translate(' + (ltr ? -6 : 104) + 'vw,' + y0 + 'vh) scale(1.15)', opacity: 0 },
      { opacity: .6, offset: .15 },
      { opacity: .6, offset: .85 },
      { transform: 'translate(' + (ltr ? 104 : -6) + 'vw,' + y1 + 'vh) scale(.7)', opacity: 0 }
    ], { duration: 9000 + Math.random() * 7000, easing: 'linear' });
    a.onfinish = function () { el.remove(); scheduleFlyby(); };
  }
  if (!reduce) scheduleFlyby();

  /* ---------- Прочее ---------- */
  var start = new Date(2023, 8, 1), end = new Date(2027, 5, 30);
  var pct = Math.max(0, Math.min(100, Math.round((Date.now() - start) / (end - start) * 100)));
  document.querySelectorAll('[data-study]').forEach(function (el) { el.style.setProperty('--pct', pct + '%'); });
  document.querySelectorAll('[data-study-label]').forEach(function (el) { el.textContent = pct + '%'; });
  document.querySelectorAll('[data-print]').forEach(function (b) { b.addEventListener('click', function () { window.print(); }); });
})();
