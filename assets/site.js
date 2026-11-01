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
    var changed = lang !== curLang;
    if (changed) {
      i18nEls.forEach(function (x) { x.el.innerHTML = tr(x.ru, lang); });
      i18nAttrs.forEach(function (x) { x.el.setAttribute(x.attr, tr(x.ru, lang)); });
      document.title = tr(ruTitle, lang);
      if (metaDesc) metaDesc.content = tr(ruDesc, lang);
      curLang = lang;
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
    if (changed) document.dispatchEvent(new CustomEvent('langchange', { detail: lang }));
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

  /* ---------- Звёзды: мы летим вперёд, в гиперпространстве они растягиваются в линии ---------- */
  var cvs = document.getElementById('stars'), ctx = cvs.getContext('2d');
  var W = 0, H = 0, stars = [], raf = 0, last = performance.now();
  var warpStart = 0, camY = 0, cam = null, shoots = [], nextShoot = performance.now() + 4000;
  var TINTS = ['#ffffff', '#d6e6ff', '#fff3d6', '#bcd5ff'];
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function spawn(s, far) {
    s.x = rnd(-1.15, 1.15); s.y = rnd(-1.15, 1.15); s.z = far ? rnd(.85, 1) : rnd(.04, 1);
    s.c = TINTS[(Math.random() * TINTS.length) | 0]; s.t = rnd(0, 6.28); s.s = rnd(.4, 2);
    s.r = Math.random() < .03 ? rnd(1.3, 2.1) : rnd(.35, 1.05);
    return s;
  }
  function build() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cvs.width = Math.round(W * dpr); cvs.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = Math.min(1100, Math.round(W * H / 2100));
    stars = [];
    for (var i = 0; i < n; i++) stars.push(spawn({}, false));
    draw(performance.now());
  }
  function draw(now) {
    var dt = Math.min(.05, (now - last) / 1000); last = now;
    ctx.clearRect(0, 0, W, H);
    if (cam) {
      var k = Math.min(1, (now - cam.start) / cam.dur), e = 1 - Math.pow(1 - k, 3);
      camY = cam.from + (cam.to - cam.from) * e;
      if (k >= 1) cam = null;
    }
    var v = reduce ? 0 : (d.classList.contains('at-top') ? .022 : .007), wf = 0;
    if (warpStart) {
      var p = (now - warpStart) / 1500;
      if (p >= 1) warpStart = 0;
      else { wf = Math.pow(Math.sin(p * Math.PI), 2); v += wf * 2.4; }
    }
    var cx = W / 2, cy = H * .44, f = Math.max(W, H) * .5, sy = (window.scrollY || 0) + camY;
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i], z0 = s.z;
      s.z -= v * dt;
      if (s.z <= .03) { spawn(s, true); continue; }
      var px = cx + s.x / s.z * f, py = cy + s.y / s.z * f - sy * (.015 + (1 - s.z) * .06);
      py = ((py % H) + H) % H;
      if (px < -20 || px > W + 20) { spawn(s, true); continue; }
      var depth = 1 - s.z, r = s.r * (.6 + depth * 1.3);
      var a = (.2 + .8 * depth) * (reduce ? 1 : .6 + .4 * Math.sin(now * .001 * s.s + s.t));
      ctx.globalAlpha = Math.min(1, a + wf * .6);
      if (wf > .05) {
        var zb = Math.min(1, z0 + v * dt * 7), qx = cx + s.x / zb * f, qy = py - (s.y / s.z - s.y / zb) * f;
        ctx.strokeStyle = wf > .4 ? '#d9ecff' : s.c; ctx.lineWidth = Math.max(.6, r);
        ctx.beginPath(); ctx.moveTo(qx, qy); ctx.lineTo(px, py); ctx.stroke();
        continue;
      }
      ctx.fillStyle = s.c;
      if (r > 1.6) {
        ctx.beginPath(); ctx.arc(px, py, r, 0, 6.283); ctx.fill();
        ctx.globalAlpha = a * .12; ctx.beginPath(); ctx.arc(px, py, r * 3, 0, 6.283); ctx.fill();
      } else ctx.fillRect(px, py, r, r);
    }
    if (!reduce && !wf) {
      if (now > nextShoot) {
        var ang = .35 + Math.random() * .5, sp = 9 + Math.random() * 7;
        shoots.push({ x: rnd(W * .1, W * .9), y: rnd(0, H * .45), vx: Math.cos(ang) * sp * (Math.random() < .5 ? -1 : 1), vy: Math.sin(ang) * sp, life: 1 });
        nextShoot = now + 5000 + Math.random() * 9000;
      }
      for (var j = shoots.length - 1; j >= 0; j--) {
        var m = shoots[j];
        m.x += m.vx; m.y += m.vy; m.life -= .022;
        if (m.life <= 0) { shoots.splice(j, 1); continue; }
        var g = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * 9, m.y - m.vy * 9);
        g.addColorStop(0, 'rgba(255,255,255,' + m.life + ')'); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalAlpha = 1; ctx.strokeStyle = g; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x - m.vx * 9, m.y - m.vy * 9); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }
  function loop(now) { if(!d.classList.contains('motion-paused')) draw(now); else last=now; raf = requestAnimationFrame(loop); }
  function warp() { if (!reduce) warpStart = performance.now(); }
  function tiltCamera(dist, dur) { if (!reduce) cam = { from: camY, to: camY + dist, start: performance.now(), dur: dur }; }
  var lastW = 0, rt = 0;
  addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () { if (innerWidth !== lastW || Math.abs(innerHeight - H) > 120) { lastW = innerWidth; build(); } }, 150);
  });
  lastW = innerWidth; build();
  if (!reduce) {
    raf = requestAnimationFrame(loop);
    document.addEventListener('visibilitychange', function () {
      cancelAnimationFrame(raf);
      if (!document.hidden) { last = performance.now(); raf = requestAnimationFrame(loop); }
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
  function arrive() { d.classList.remove('arrive'); void d.offsetWidth; d.classList.add('arrive'); }
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
    clearInterval(crawlWatch);
    crawlWatch = setInterval(function () {
      if (lastLine.getBoundingClientRect().bottom < innerHeight * .42) {
        clearInterval(crawlWatch);
        introTimer = setTimeout(closeIntro, 900);
      }
    }, 400);
    setTimeout(function () { skipBtn.focus({ preventScroll: true }); }, 60);
  }
  /* Финал: камера опускается от текста к кабине, приборы включаются. */
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
        var id = en.target.id;
        d.style.setProperty('--tint', en.target.getAttribute('data-tint') || DEFAULT_TINT);
        Object.keys(rail).forEach(function (k) { rail[k].classList.toggle('on', k === id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('.cockpit, .world').forEach(function (s) { spy.observe(s); });
  }
  function onScroll() {
    var y = window.scrollY || 0;
    d.classList.toggle('scrolled', y > 40);
    d.classList.toggle('at-top', y < innerHeight * .8);
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- Прыжок в гиперпространство ---------- */
  var jumping = false;
  function jumpTo(id) {
    var el = document.getElementById(id);
    if (!el || jumping) return;
    if (reduce || d.classList.contains('cv-mode') || d.classList.contains('motion-paused')) { el.scrollIntoView({behavior:'instant'}); return; }
    jumping = true;
    warp();
    d.classList.add('jumping');
    document.dispatchEvent(new CustomEvent('hyperspace', {detail:id}));
    setTimeout(function () {
      el.scrollIntoView({ behavior: 'instant', block: 'start' });
      el.querySelectorAll('[data-reveal]').forEach(function (r) { r.classList.add('in'); });
      if (el.getAttribute('data-tint')) d.style.setProperty('--tint', el.getAttribute('data-tint'));
      try { history.replaceState(null, '', location.search + '#' + id); } catch (e) {}
    }, 1250);
    setTimeout(function () { d.classList.remove('jumping'); jumping = false; }, 2200);
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-jump]');
    if (!a) return;
    e.preventDefault();
    jumpTo(a.getAttribute('href').slice(1));
  });

  /* ---------- Кабина: выбор пункта назначения ---------- */
  var dests = Array.prototype.slice.call(document.querySelectorAll('.dest'));
  var navTo = document.querySelector('.nav-sel'), navWhat = document.querySelector('.nav-sel-what');
  var jumpBtn = document.querySelector('.jump-btn'), cockpit = document.querySelector('.cockpit');
  var selected = null;
  function renderNav() {
    var b = selected && document.querySelector('.dest[data-target="' + selected + '"]');
    cockpit.classList.toggle('has-dest', !!b);
    navTo.innerHTML = b ? b.querySelector('.dest-name').innerHTML : '';
    navWhat.innerHTML = b ? b.querySelector('.dest-what').innerHTML : '';
    jumpBtn.disabled = !b;
    dests.forEach(function (x) { x.classList.toggle('sel', x === b); x.setAttribute('aria-pressed', String(x === b)); });
    if (window.Holo) Holo.setNav(selected);
  }
  dests.forEach(function (b) {
    b.addEventListener('click', function () {
      var id = b.getAttribute('data-target');
      if (selected === id) return jumpTo(id); /* второй клик по выбранной планете — сразу прыжок */
      selected = id; renderNav();
    });
  });
  jumpBtn.addEventListener('click', function () { if (selected) jumpTo(selected); });
  document.addEventListener('langchange', renderNav);
  renderNav();

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

  /* Для терминала и пасхалок. */
  window.Site = {
    jumpTo: jumpTo, setLang: function (l) { setLang(l, true); }, lang: function () { return curLang; },
    openIntro: function () { if (!reduce) openIntro(false); }, warp: warp, reduce: reduce
  };
})();
