/* Поверхности планет: фон каждого раздела. Неподвижные слои рисуются один раз в отдельные холсты,
   поверх них анимируются частицы, транспорт, огни. Слои сдвигаются с разной скоростью (параллакс),
   а после прыжка камера «спускается» к поверхности. */
(function () {
  'use strict';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var TAU = Math.PI * 2;

  /* ---------- Инструменты ---------- */
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function wave(r, n) {
    var a = []; for (var i = 0; i < n; i++) a.push([r() * TAU, (0.6 + r()) * (i + 1) * 1.7, 1 / (i + 1)]);
    return function (x) { var s = 0, m = 0; for (var i = 0; i < a.length; i++) { s += Math.sin(x * a[i][1] + a[i][0]) * a[i][2]; m += a[i][2]; } return s / m; };
  }
  function lin(c, x0, y0, x1, y1, stops) { var g = c.createLinearGradient(x0, y0, x1, y1); stops.forEach(function (s) { g.addColorStop(s[0], s[1]); }); return g; }
  function rad(c, x, y, r0, r1, stops) { var g = c.createRadialGradient(x, y, r0, x, y, r1); stops.forEach(function (s) { g.addColorStop(s[0], s[1]); }); return g; }
  function glow(c, x, y, r, col, a) { c.fillStyle = rad(c, x, y, 0, r, [[0, col], [1, 'rgba(0,0,0,0)']]); c.globalAlpha = a == null ? 1 : a; c.fillRect(x - r, y - r, r * 2, r * 2); c.globalAlpha = 1; }
  /* гряда: гладкая (холмы, дюны) или ломаная (горы, скалы) */
  function ridge(c, w, H, y0, amp, f, sc, fill, step) {
    c.beginPath(); c.moveTo(-10, H);
    for (var x = -10; x <= w + 10; x += step || 6) c.lineTo(x, y0 - amp * f(x / w * sc));
    c.lineTo(w + 10, H); c.closePath(); c.fillStyle = fill; c.fill();
  }
  function jag(r, w, y0, amp, seg) {
    var pts = [], x = -20, y = y0 - amp * r();
    while (x < w + 40) { pts.push([x, y]); x += seg * (.4 + r()); y = y0 - amp * Math.pow(r(), .8); }
    return pts;
  }
  function poly(c, pts, H, fill) { c.beginPath(); c.moveTo(pts[0][0], H); pts.forEach(function (p) { c.lineTo(p[0], p[1]); }); c.lineTo(pts[pts.length - 1][0], H); c.closePath(); c.fillStyle = fill; c.fill(); }
  function starsSky(c, w, h, r, n, maxY) { for (var i = 0; i < n; i++) { c.globalAlpha = .2 + r() * .7; c.fillStyle = '#fff'; var s = r() < .1 ? 1.6 : .9; c.fillRect(r() * w, r() * h * maxY, s, s); } c.globalAlpha = 1; }
  function particles(n, r, mk) { var a = []; for (var i = 0; i < n; i++) a.push(mk(r, i)); return a; }

  /* ---------- Сцены ---------- */
  var S = {};

  /* Корусант: город-планета ночью, неон, летающий транспорт, голорекламы */
  S.coruscant = {
    layers: [
      { d: 0, draw: function (c, w, h, r) {
        c.fillStyle = lin(c, 0, 0, 0, h, [[0, '#07031a'], [.35, '#1c0a3a'], [.62, '#5a1650'], [.8, '#c2306a'], [1, '#ff7a59']]); c.fillRect(0, 0, w, h);
        starsSky(c, w, h, r, 90, .3);
        glow(c, w * .5, h * .86, w * .7, 'rgba(255,90,140,.55)'); glow(c, w * .5, h * .72, w * .45, 'rgba(255,150,120,.35)');
        for (var i = 0; i < 6; i++) { c.globalAlpha = .1; c.fillStyle = '#ff9ad0'; c.fillRect(0, h * (.5 + i * .05) + r() * 10, w, 2 + r() * 6); }
        c.globalAlpha = 1;
      } },
      { d: .08, draw: function (c, w, h, r) { city(c, w, h, r, { base: h * .9, n: Math.round(w / 9), wmin: 6, wmax: 22, hmin: .18, hmax: .62, col: '#3a1d55', win: ['#ff9ad5', '#9fe8ff', '#ffd59a'], wp: .07, ws: 2, spire: .5, haze: 'rgba(255,110,170,.18)' }); } },
      { d: .18, fx: traffic(3, .38, .62, 1.2, .7) },
      { d: .3, draw: function (c, w, h, r) { city(c, w, h, r, { base: h * 1.05, n: Math.round(w / 34), wmin: 30, wmax: 80, hmin: .28, hmax: .78, col: '#1d0f33', win: ['#ffcf7a', '#7fe8ff', '#ff7ad1'], wp: .32, ws: 3, neon: true, spire: .35, haze: 'rgba(120,40,160,.25)' }); } },
      { d: .36, fx: billboards() },
      { d: .45, fx: traffic(4, .5, .8, 2.2, 1.3) },
      { d: .62, draw: function (c, w, h, r) {
        nearTower(c, w, h, r, -w * .02, w * .13); nearTower(c, w, h, r, w * .89, w * .13);
        c.fillStyle = lin(c, 0, h * .8, 0, h * 1.25, [[0, 'rgba(10,4,20,0)'], [1, 'rgba(10,4,20,.95)']]); c.fillRect(0, h * .8, w, h * .45);
      } },
      { d: .66, fx: lights() },
      { d: .7, fx: fog('255,120,190', .14, .78) }
    ]
  };
  function city(c, w, h, r, o) {
    for (var i = 0; i < o.n; i++) {
      var bw = o.wmin + r() * (o.wmax - o.wmin), x = r() * (w + bw) - bw, top = h * (1 - o.hmin - r() * (o.hmax - o.hmin));
      c.fillStyle = o.col; c.fillRect(x, top, bw, o.base - top);
      if (o.spire && r() < o.spire) { c.beginPath(); c.moveTo(x + bw * .3, top); c.lineTo(x + bw * .5, top - 30 - r() * 70); c.lineTo(x + bw * .7, top); c.fill(); }
      /* окна */
      var ws = o.ws, gap = ws * 2.2;
      for (var y = top + 6; y < o.base; y += gap) for (var xx = x + 3; xx < x + bw - 3; xx += gap) {
        if (r() < o.wp) { c.fillStyle = o.win[(r() * o.win.length) | 0]; c.globalAlpha = .35 + r() * .6; c.fillRect(xx, y, ws, ws * .8); }
      }
      c.globalAlpha = 1;
      if (o.neon && r() < .45) {
        var col = r() < .5 ? '#ff4fd8' : '#4fe8ff';
        c.fillStyle = col; c.shadowColor = col; c.shadowBlur = 12;
        c.fillRect(r() < .5 ? x : x + bw - 2, top + 10, 2, (o.base - top) * (.3 + r() * .5));
        c.shadowBlur = 0;
      }
    }
    if (o.haze) { c.fillStyle = lin(c, 0, h * .4, 0, h, [[0, 'rgba(0,0,0,0)'], [1, o.haze]]); c.fillRect(0, h * .4, w, h * .9); }
  }
  function nearTower(c, w, h, r, x, bw) {
    c.fillStyle = lin(c, x, 0, x + bw, 0, [[0, '#0a0414'], [.5, '#150a26'], [1, '#0a0414']]); c.fillRect(x, h * .1, bw, h * 1.2);
    c.fillStyle = '#140a24'; c.fillRect(x + bw * .1, h * .05, bw * .8, h * .06);
    for (var k = 0; k < 7; k++) { c.fillStyle = '#1b0f2e'; c.fillRect(x - 8, h * (.18 + k * .14), bw + 16, 6); }
    var col = r() < .5 ? '#ff3fae' : '#3fe0ff';
    c.shadowColor = col; c.shadowBlur = 16; c.fillStyle = col;
    c.fillRect(x + (x < w / 2 ? bw - 3 : 0), h * .15, 3, h * .9);
    c.shadowBlur = 0;
    for (var i = 0; i < 140; i++) { c.fillStyle = r() < .7 ? '#ffcf7a' : '#7fe8ff'; c.globalAlpha = .2 + r() * .5; c.fillRect(x + 8 + r() * (bw - 16), h * (.15 + r() * .9), 3, 2); }
    c.globalAlpha = 1;
  }
  /* потоки летающего транспорта: белые фары в одну сторону, красные огни в другую */
  function traffic(lanes, y0, y1, speed, size) {
    return {
      init: function (w, h, r) {
        var L = [];
        for (var i = 0; i < lanes; i++) {
          var y = h * (y0 + (y1 - y0) * (i + r() * .5) / lanes), dir = i % 2 ? 1 : -1, cars = [];
          for (var k = 0; k < Math.round(w / 40); k++) cars.push({ x: r() * w, v: (40 + r() * 50) * speed, s: (0.6 + r() * .8) * size });
          L.push({ y: y, dir: dir, cars: cars, curve: (r() - .5) * h * .05 });
        }
        return L;
      },
      frame: function (c, w, h, t, L, dt) {
        L.forEach(function (l) {
          l.cars.forEach(function (car) {
            car.x += l.dir * car.v * dt; if (car.x > w + 20) car.x = -20; if (car.x < -20) car.x = w + 20;
            var y = l.y + Math.sin(car.x / w * Math.PI) * l.curve;
            c.fillStyle = l.dir > 0 ? 'rgba(255,240,220,.9)' : 'rgba(255,70,90,.9)';
            c.fillRect(car.x, y, 2.4 * car.s, 1.4 * car.s);
            c.fillStyle = l.dir > 0 ? 'rgba(255,240,220,.18)' : 'rgba(255,70,90,.18)';
            c.fillRect(car.x - l.dir * 14 * car.s, y + .2, 14 * car.s, 1 * car.s);
          });
        });
      }
    };
  }
  /* голорекламы на зданиях: мерцают и иногда сбоят */
  function billboards() {
    var WORDS = ['ADAM LABS', 'DATA SCIENCE', 'PYTHON', 'SQL', 'ML', 'ДАННЫЕ', 'MODELS', 'ISLAM K.'];
    return {
      init: function (w, h, r) {
        var b = [], n = w < 700 ? 3 : 5;
        for (var i = 0; i < n; i++) b.push({ x: w * (.08 + .84 * (i + r() * .6) / n), y: h * (.36 + r() * .2), word: WORDS[(i * 3 + (r() * 3 | 0)) % WORDS.length], col: ['#ff4fd8', '#4fe8ff', '#ffcf5a', '#9a7bff'][i % 4], ph: r() * 10, s: w < 700 ? .7 : 1 });
        return b;
      },
      frame: function (c, w, h, t, B) {
        B.forEach(function (b) {
          var fl = .75 + .25 * Math.sin(t * 9 + b.ph) * Math.sin(t * 3.1 + b.ph);
          if (Math.sin(t * .7 + b.ph) > .97) fl *= Math.random() < .5 ? .2 : 1;
          var fs = 15 * b.s; c.font = '700 ' + fs + 'px Syncopate, Arial Black, sans-serif';
          var tw = c.measureText(b.word).width + 22 * b.s, th = fs + 16 * b.s;
          c.globalAlpha = .16 * fl; c.fillStyle = b.col; c.fillRect(b.x - tw / 2, b.y - th / 2, tw, th);
          c.globalAlpha = .85 * fl; c.strokeStyle = b.col; c.lineWidth = 1; c.strokeRect(b.x - tw / 2, b.y - th / 2, tw, th);
          c.shadowColor = b.col; c.shadowBlur = 14; c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText(b.word, b.x + (Math.random() < .02 ? 3 : 0), b.y + 1);
          c.shadowBlur = 0; c.globalAlpha = 1;
        });
      }
    };
  }
  /* мигающие огни на крышах и прожекторы */
  function lights() {
    return {
      init: function (w, h, r) { return { dots: particles(Math.round(w / 60), r, function (r) { return { x: r() * w, y: h * (.25 + r() * .4), ph: r() * 6 }; }), beams: [{ x: w * .2, ph: 0 }, { x: w * .78, ph: 2 }] }; },
      frame: function (c, w, h, t, s) {
        s.beams.forEach(function (b) {
          var a = -Math.PI / 2 + Math.sin(t * .35 + b.ph) * .5;
          c.save(); c.translate(b.x, h * 1.02); c.rotate(a + Math.PI / 2);
          c.fillStyle = lin(c, 0, 0, 0, -h, [[0, 'rgba(180,220,255,.18)'], [1, 'rgba(180,220,255,0)']]);
          c.beginPath(); c.moveTo(-6, 0); c.lineTo(-w * .08, -h * 1.1); c.lineTo(w * .08, -h * 1.1); c.lineTo(6, 0); c.fill(); c.restore();
        });
        s.dots.forEach(function (p) { if (Math.sin(t * 2.4 + p.ph) > .55) { c.fillStyle = '#ff3b3b'; c.fillRect(p.x, p.y, 3, 3); glow(c, p.x + 1.5, p.y + 1.5, 9, 'rgba(255,60,60,.6)'); } });
      }
    };
  }
  function fog(rgb, a, y) {
    return {
      init: function (w, h, r) { return particles(5, r, function (r) { return { x: r() * w, y: h * (y + r() * .2), rx: w * (.3 + r() * .4), ry: h * (.05 + r() * .07), v: 6 + r() * 12 }; }); },
      frame: function (c, w, h, t, F, dt) {
        F.forEach(function (f) {
          f.x += f.v * dt; if (f.x - f.rx > w) f.x = -f.rx;
          c.save(); c.translate(f.x, f.y); c.scale(1, f.ry / f.rx);
          c.fillStyle = rad(c, 0, 0, 0, f.rx, [[0, 'rgba(' + rgb + ',' + a + ')'], [1, 'rgba(' + rgb + ',0)']]);
          c.fillRect(-f.rx, -f.rx, f.rx * 2, f.rx * 2); c.restore();
        });
      }
    };
  }
  /* общий генератор частиц: снег, пыль, искры, светлячки */
  function motes(o) {
    return {
      init: function (w, h, r) { var n = Math.round(o.n * Math.min(1.4, w * h / 1.3e6)); return particles(n, r, function (r) { return { x: r() * w, y: r() * h, s: o.s[0] + r() * (o.s[1] - o.s[0]), v: o.v[0] + r() * (o.v[1] - o.v[0]), ph: r() * TAU, a: .4 + r() * .6 }; }); },
      frame: function (c, w, h, t, P, dt) {
        c.fillStyle = o.col;
        P.forEach(function (p) {
          p.x += (o.vx + Math.sin(t * o.wob + p.ph) * o.sway) * p.v * dt;
          p.y += o.vy * p.v * dt;
          if (p.y > h + 10) { p.y = -10; p.x = Math.random() * w; } if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
          if (p.x > w + 10) p.x = -10; if (p.x < -10) p.x = w + 10;
          var a = p.a * (o.twinkle ? .5 + .5 * Math.sin(t * o.twinkle + p.ph) : 1);
          c.globalAlpha = a;
          if (o.glow) glow(c, p.x, p.y, p.s * 5, o.glow, a * .8);
          c.globalAlpha = a; c.fillStyle = o.col;
          c.beginPath(); c.arc(p.x, p.y, p.s, 0, TAU); c.fill();
        });
        c.globalAlpha = 1;
      }
    };
  }

  /* Татуин: закат двух солнц над дюнами, ферма с испарителем */
  S.tatooine = {
    layers: [
      { d: 0, draw: function (c, w, h, r) {
        c.fillStyle = lin(c, 0, 0, 0, h, [[0, '#1c2550'], [.35, '#6b4a74'], [.58, '#d27a5c'], [.72, '#f6b86e'], [1, '#f9d79a']]); c.fillRect(0, 0, w, h);
        starsSky(c, w, h, r, 60, .25);
        var sx = w * .7, sy = h * .58;
        glow(c, sx, sy, h * .7, 'rgba(255,190,110,.6)'); glow(c, sx, sy, h * .2, 'rgba(255,230,170,.8)');
        glow(c, sx, sy, h * .09, 'rgba(255,252,235,1)'); c.fillStyle = '#fffdf2'; c.beginPath(); c.arc(sx, sy, h * .04, 0, TAU); c.fill();
        glow(c, sx + h * .17, sy + h * .045, h * .12, 'rgba(255,150,70,.9)'); c.fillStyle = '#ffc27a'; c.beginPath(); c.arc(sx + h * .17, sy + h * .045, h * .027, 0, TAU); c.fill();
      } },
      { d: .1, draw: function (c, w, h, r) {
        var f = wave(r, 4); c.globalAlpha = .55;
        c.beginPath(); c.moveTo(0, h);
        for (var x = 0; x <= w; x += 6) { var v = f(x / w * 3); c.lineTo(x, h * .665 - (v > .15 ? h * .06 : h * .015 * (v + 1))); }
        c.lineTo(w, h); c.fillStyle = '#7a4a4a'; c.fill(); c.globalAlpha = 1;
      } },
      { d: .25, draw: function (c, w, h, r) { ridge(c, w, h * 1.3, h * .72, h * .05, wave(r, 3), 2.2, lin(c, 0, h * .66, 0, h * .9, [[0, '#e7a465'], [1, '#a75f37']])); } },
      { d: .4, draw: function (c, w, h, r) {
        ridge(c, w, h * 1.3, h * .8, h * .06, wave(r, 3), 1.8, lin(c, 0, h * .72, 0, h, [[0, '#d48c52'], [1, '#8a4a28']]));
        /* ферма: купол и испаритель */
        var hx = w * .22, hy = h * .79;
        c.fillStyle = '#b77a4e'; c.beginPath(); c.ellipse(hx, hy, w * .045, h * .035, 0, Math.PI, TAU); c.fill();
        c.fillStyle = '#5a3420'; c.fillRect(hx - w * .008, hy - h * .018, w * .016, h * .018);
        c.fillStyle = '#6b4632'; var vx = hx + w * .08;
        c.fillRect(vx, hy - h * .11, 3, h * .11); c.fillRect(vx - 7, hy - h * .085, 17, 2); c.fillRect(vx - 5, hy - h * .06, 13, 2); c.fillRect(vx - 3, hy - h * .118, 9, 4);
      } },
      { d: .6, draw: function (c, w, h, r) { ridge(c, w, h * 1.3, h * .9, h * .07, wave(r, 3), 1.4, lin(c, 0, h * .82, 0, h * 1.1, [[0, '#b8703f'], [1, '#5e3019']])); } },
      { d: .5, fx: motes({ n: 90, s: [.6, 1.6], v: [30, 90], vx: 1, vy: .05, wob: 1.2, sway: .3, col: 'rgba(255,225,180,1)' }) }
    ]
  };

  /* Хот: ночная ледяная равнина, хребты, метель, огни базы */
  S.hoth = {
    layers: [
      { d: 0, draw: function (c, w, h, r) {
        c.fillStyle = lin(c, 0, 0, 0, h, [[0, '#060d1c'], [.45, '#1b3352'], [.7, '#4c6d8f'], [1, '#8fb0cc']]); c.fillRect(0, 0, w, h);
        starsSky(c, w, h, r, 140, .45);
        glow(c, w * .2, h * .2, h * .12, 'rgba(220,235,255,.9)'); c.fillStyle = '#eef5ff'; c.beginPath(); c.arc(w * .2, h * .2, h * .045, 0, TAU); c.fill();
        c.fillStyle = 'rgba(30,50,80,.25)'; c.beginPath(); c.arc(w * .2 + h * .012, h * .2 - h * .008, h * .04, 0, TAU); c.fill();
      } },
      { d: .1, draw: function (c, w, h, r) { var p = jag(r, w, h * .62, h * .2, w * .07); poly(c, p, h * 1.3, lin(c, 0, h * .4, 0, h * .7, [[0, '#a9c3dc'], [1, '#6f8daa']])); shadeJag(c, p, h, 'rgba(30,50,80,.35)'); } },
      { d: .25, draw: function (c, w, h, r) {
        var p = jag(r, w, h * .72, h * .12, w * .11); poly(c, p, h * 1.3, lin(c, 0, h * .58, 0, h * .8, [[0, '#d7e6f3'], [1, '#8ea9c4']])); shadeJag(c, p, h, 'rgba(40,60,95,.3)');
        /* вход в базу */
        var bx = w * .68, by = h * .74;
        c.fillStyle = '#2a3a52'; c.beginPath(); c.ellipse(bx, by, w * .06, h * .05, 0, Math.PI, TAU); c.fill();
        c.fillStyle = '#ffcf7a'; for (var i = -3; i <= 3; i++) { c.fillRect(bx + i * w * .012, by - 3, 4, 3); }
        glow(c, bx, by - h * .01, w * .07, 'rgba(255,200,120,.35)');
      } },
      { d: .5, draw: function (c, w, h, r) { ridge(c, w, h * 1.3, h * .84, h * .04, wave(r, 3), 2, lin(c, 0, h * .78, 0, h, [[0, '#e8f1fa'], [1, '#9db5cd']])); } },
      { d: .7, draw: function (c, w, h, r) { ridge(c, w, h * 1.3, h * .95, h * .05, wave(r, 2), 1.3, lin(c, 0, h * .88, 0, h * 1.1, [[0, '#cfdeec'], [1, '#7f97b0']])); } },
      { d: .6, fx: motes({ n: 260, s: [.6, 2.4], v: [40, 120], vx: .9, vy: 1, wob: 1.5, sway: .4, col: 'rgba(240,248,255,1)' }) }
    ]
  };
  function shadeJag(c, p, h, col) {
    c.fillStyle = col;
    for (var i = 0; i < p.length - 1; i++) { var a = p[i], b = p[i + 1]; if (b[1] > a[1]) { c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(b[0], h * 1.3); c.lineTo(a[0] + (b[0] - a[0]) * .3, h * 1.3); c.fill(); } }
  }

  /* Дагоба: туманное болото, кривые деревья, хижина с тёплым светом, светлячки */
  S.dagobah = {
    layers: [
      { d: 0, draw: function (c, w, h) { c.fillStyle = lin(c, 0, 0, 0, h, [[0, '#050c09'], [.5, '#1a2c22'], [.75, '#2e4636'], [1, '#13211a']]); c.fillRect(0, 0, w, h); glow(c, w * .6, h * .45, w * .5, 'rgba(120,160,120,.18)'); } },
      { d: .1, draw: function (c, w, h, r) { for (var i = 0; i < 9; i++) tree(c, r() * w, h * .72, h * (.35 + r() * .2), r, 'rgba(40,62,48,.75)', .6); } },
      { d: .18, fx: fog('140,170,140', .16, .55) },
      { d: .3, draw: function (c, w, h, r) {
        for (var i = 0; i < 6; i++) tree(c, r() * w, h * .8, h * (.45 + r() * .25), r, '#16241c', 1);
        /* хижина */
        var hx = w * .3, hy = h * .78;
        c.fillStyle = '#1f2a20'; c.beginPath(); c.ellipse(hx, hy, w * .05, h * .055, 0, Math.PI, TAU); c.fill();
        c.fillStyle = '#ffbf5a'; c.beginPath(); c.ellipse(hx + w * .012, hy - h * .015, w * .008, h * .012, 0, 0, TAU); c.fill();
        glow(c, hx + w * .012, hy - h * .015, w * .05, 'rgba(255,180,80,.45)');
      } },
      { d: .45, draw: function (c, w, h, r) {
        c.fillStyle = lin(c, 0, h * .8, 0, h * 1.3, [[0, '#0f1d17'], [1, '#050a08']]); c.fillRect(0, h * .8, w, h * .5);
        c.globalAlpha = .25; c.strokeStyle = '#6d8f72';
        for (var i = 0; i < 40; i++) { var x = r() * w, y = h * (.82 + r() * .3); c.beginPath(); c.moveTo(x, y); c.lineTo(x + 20 + r() * 50, y); c.stroke(); }
        c.globalAlpha = 1;
      } },
      { d: .7, draw: function (c, w, h, r) { tree(c, w * .05, h * 1.05, h * .95, r, '#08100c', 1.8); tree(c, w * .95, h * 1.05, h * .9, r, '#08100c', 1.6); } },
      { d: .5, fx: motes({ n: 40, s: [1, 2], v: [6, 18], vx: .4, vy: -.2, wob: .8, sway: 1.5, col: 'rgba(220,255,150,1)', glow: 'rgba(200,255,120,.7)', twinkle: 2.5 }) },
      { d: .55, fx: fog('120,150,125', .2, .8) }
    ]
  };
  function tree(c, x, base, H, r, col, thick) {
    c.fillStyle = col; c.strokeStyle = col;
    var tw = 10 * thick + r() * 8 * thick;
    c.beginPath(); c.moveTo(x - tw * 1.8, base); c.quadraticCurveTo(x - tw * .4, base - H * .15, x - tw * .45, base - H * .5);
    c.quadraticCurveTo(x - tw * .2, base - H * .85, x - tw * .1, base - H); c.lineTo(x + tw * .3, base - H);
    c.quadraticCurveTo(x + tw * .6, base - H * .6, x + tw * .5, base - H * .35); c.quadraticCurveTo(x + tw * .5, base - H * .12, x + tw * 2, base); c.fill();
    c.lineWidth = 2 * thick;
    for (var k = 0; k < 5; k++) {
      var by = base - H * (.45 + r() * .5), dir = r() < .5 ? -1 : 1, bl = H * (.15 + r() * .25);
      c.beginPath(); c.moveTo(x, by); c.quadraticCurveTo(x + dir * bl * .5, by - bl * .3, x + dir * bl, by - bl * (.1 + r() * .4)); c.stroke();
      c.globalAlpha = .7; c.lineWidth = 1;
      for (var v = 0; v < 3; v++) { var vx = x + dir * bl * (.3 + r() * .6); c.beginPath(); c.moveTo(vx, by - bl * .2); c.lineTo(vx + (r() - .5) * 6, by + bl * (.3 + r() * .6)); c.stroke(); }
      c.globalAlpha = 1; c.lineWidth = 2 * thick;
    }
  }

  /* Мустафар: вулканы, лавовые реки, пепел и искры */
  S.mustafar = {
    layers: [
      { d: 0, draw: function (c, w, h, r) {
        c.fillStyle = lin(c, 0, 0, 0, h, [[0, '#0a0202'], [.45, '#2a0705'], [.7, '#7a1a06'], [1, '#c2410c']]); c.fillRect(0, 0, w, h);
        for (var i = 0; i < 14; i++) { c.globalAlpha = .35; c.fillStyle = '#120403'; c.beginPath(); c.ellipse(r() * w, h * (.1 + r() * .35), w * (.08 + r() * .15), h * (.03 + r() * .05), 0, 0, TAU); c.fill(); }
        c.globalAlpha = 1;
      } },
      { d: .1, draw: function (c, w, h, r) {
        [[.25, .3], [.72, .26]].forEach(function (v) {
          var vx = w * v[0], top = h * (.62 - v[1]);
          c.fillStyle = '#1a0604'; c.beginPath(); c.moveTo(vx - w * .22, h * .7); c.lineTo(vx - w * .025, top); c.lineTo(vx + w * .025, top); c.lineTo(vx + w * .22, h * .7); c.fill();
          glow(c, vx, top, h * .12, 'rgba(255,120,30,.7)');
          c.strokeStyle = 'rgba(255,110,20,.8)'; c.lineWidth = 2;
          for (var k = 0; k < 3; k++) { c.beginPath(); c.moveTo(vx + (k - 1) * 6, top); c.quadraticCurveTo(vx + (k - 1) * 30 + (r() - .5) * 40, top + h * .15, vx + (k - 1) * 60, h * .68); c.stroke(); }
        });
      } },
      { d: .2, fx: plume() },
      { d: .3, draw: function (c, w, h, r) { var p = jag(r, w, h * .76, h * .1, w * .06); poly(c, p, h * 1.3, '#120403'); } },
      { d: .4, fx: lava() },
      { d: .65, draw: function (c, w, h, r) {
        [[-.02, .22], [.85, .2]].forEach(function (s) {
          var x = w * s[0], bw = w * s[1];
          c.fillStyle = '#060101'; c.beginPath(); c.moveTo(x, h * 1.2); c.lineTo(x + bw * .2, h * .35); c.lineTo(x + bw * .45, h * .28); c.lineTo(x + bw * .6, h * .5); c.lineTo(x + bw, h * 1.2); c.fill();
          c.strokeStyle = 'rgba(255,90,20,.6)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x + bw * .45, h * .28); c.lineTo(x + bw * .6, h * .5); c.lineTo(x + bw, h * 1.2); c.stroke();
        });
      } },
      { d: .6, fx: motes({ n: 110, s: [.8, 2.2], v: [25, 80], vx: .25, vy: -1, wob: 1.8, sway: .6, col: 'rgba(255,170,60,1)', glow: 'rgba(255,90,20,.6)', twinkle: 4 }) }
    ]
  };
  function lava() {
    return {
      init: function (w, h, r) { var f = wave(r, 3); return { f: f, y: h * .86 }; },
      frame: function (c, w, h, t, s) {
        var y = s.y;
        c.beginPath(); c.moveTo(-10, h * 1.3);
        for (var x = -10; x <= w + 10; x += 8) c.lineTo(x, y - h * .03 * s.f(x / w * 2) - h * .02);
        c.lineTo(w + 10, h * 1.3); c.closePath();
        c.fillStyle = lin(c, 0, y - h * .06, 0, h * 1.05, [[0, '#ffd27a'], [.25, '#ff7a1a'], [.7, '#c42d05'], [1, '#4a0a02']]); c.fill();
        c.strokeStyle = 'rgba(255,240,180,.55)'; c.lineWidth = 1.5;
        for (var k = 0; k < 14; k++) {
          var yy = y + h * (.01 + k * .012), off = (t * (30 + k * 6)) % (w * .25);
          c.setLineDash([w * .04, w * .09]); c.lineDashOffset = -off;
          c.beginPath(); c.moveTo(0, yy); c.lineTo(w, yy + Math.sin(k) * 4); c.stroke();
        }
        c.setLineDash([]);
        glow(c, w * .5, y, w * .6, 'rgba(255,90,20,' + (.18 + .06 * Math.sin(t * 1.3)) + ')');
      }
    };
  }
  function plume() {
    return {
      init: function (w, h, r) { return particles(26, r, function (r) { return { t: r() * 10, x: r() }; }); },
      frame: function (c, w, h, t, P, dt) {
        P.forEach(function (p) {
          p.t += dt * .25; if (p.t > 10) p.t = 0;
          var k = p.t / 10, x = w * .72 + (p.x - .5) * 30 + k * w * .12, y = h * .36 - k * h * .4, rr = 20 + k * h * .18;
          c.globalAlpha = (1 - k) * .45; c.fillStyle = rad(c, x, y, 0, rr, [[0, '#3a1410'], [1, 'rgba(30,8,6,0)']]); c.fillRect(x - rr, y - rr, rr * 2, rr * 2);
        });
        c.globalAlpha = 1;
      }
    };
  }

  /* Илум: ледяная пещера с кристаллами кайбер */
  S.ilum = {
    layers: [
      { d: 0, draw: function (c, w, h, r) {
        c.fillStyle = lin(c, 0, 0, 0, h, [[0, '#020611'], [.5, '#06183a'], [1, '#03091a']]); c.fillRect(0, 0, w, h);
        for (var i = 0; i < 5; i++) { var x = w * (.15 + r() * .7); c.fillStyle = lin(c, x, 0, x + w * .05, h, [[0, 'rgba(140,200,255,.18)'], [1, 'rgba(140,200,255,0)']]); c.beginPath(); c.moveTo(x - 20, 0); c.lineTo(x + 30, 0); c.lineTo(x + w * .12, h); c.lineTo(x + w * .02, h); c.fill(); }
      } },
      { d: .15, draw: function (c, w, h, r) { facets(c, w, h, r, 70, ['#0b2a52', '#0f3a6a', '#123f78', '#09204a'], .25); } },
      { d: .3, draw: function (c, w, h, r) {
        ridge(c, w, h * 1.3, h * .74, h * .04, wave(r, 3), 2, lin(c, 0, h * .68, 0, h * 1.1, [[0, '#2a5f93'], [.15, '#0f2d55'], [1, '#040c1c']]));
        for (var k = 0; k < 14; k++) { var x = r() * w, L = h * (.05 + r() * .16), W = L * .12; c.fillStyle = lin(c, x - W, 0, x + W, 0, [[0, '#0d2f5a'], [.5, '#3f86c8'], [1, '#0d2f5a']]); c.globalAlpha = .7; c.beginPath(); c.moveTo(x - W, h * .06); c.lineTo(x, h * .06 + L); c.lineTo(x + W, h * .06); c.fill(); }
        c.globalAlpha = 1;
        crystals(c, w, h, r, 14, .72, 1);
      } },
      { d: .4, fx: pulse() },
      { d: .6, draw: function (c, w, h, r) {
        c.fillStyle = '#020814'; c.beginPath(); c.moveTo(0, 0); c.lineTo(w * .18, 0); c.lineTo(w * .1, h * .3); c.lineTo(w * .14, h * .6); c.lineTo(w * .05, h * 1.2); c.lineTo(0, h * 1.2); c.fill();
        c.beginPath(); c.moveTo(w, 0); c.lineTo(w * .8, 0); c.lineTo(w * .9, h * .35); c.lineTo(w * .84, h * .7); c.lineTo(w * .96, h * 1.2); c.lineTo(w, h * 1.2); c.fill();
        c.beginPath(); c.moveTo(0, 0); c.lineTo(w, 0); c.lineTo(w, h * .08); for (var x = w; x >= 0; x -= w / 14) c.lineTo(x, h * (.05 + r() * .12)); c.closePath(); c.fill();
        crystals(c, w, h, r, 7, 1.0, 1.6);
      } },
      { d: .5, fx: motes({ n: 70, s: [.6, 1.6], v: [4, 14], vx: .3, vy: -.4, wob: .9, sway: 1.2, col: 'rgba(190,240,255,1)', glow: 'rgba(120,210,255,.6)', twinkle: 3 }) }
    ]
  };
  function facets(c, w, h, r, n, cols, a) {
    for (var i = 0; i < n; i++) {
      var x = r() * w, y = r() * h, s = w * (.05 + r() * .12);
      c.fillStyle = cols[(r() * cols.length) | 0]; c.globalAlpha = .5 + r() * .5;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + s * (r() - .2), y + s * (r() - .5)); c.lineTo(x + s * (r() - .5), y + s * (r() + .2)); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(160,220,255,' + a * r() + ')'; c.stroke();
    }
    c.globalAlpha = 1;
  }
  function crystals(c, w, h, r, n, yb, sc) {
    var cols = [['#7fe8ff', '#1d7fd1'], ['#8dffc8', '#16a36c'], ['#c9a2ff', '#6b3fd1'], ['#9fd2ff', '#2a5fd1']];
    for (var i = 0; i < n; i++) {
      var x = r() * w, base = h * (yb + r() * .06), col = cols[(r() * cols.length) | 0];
      for (var k = 0; k < 3 + (r() * 3 | 0); k++) {
        var L = h * (.06 + r() * .14) * sc, W = L * (.12 + r() * .08), ang = (r() - .5) * 1.1;
        c.save(); c.translate(x + (r() - .5) * 30 * sc, base); c.rotate(ang);
        c.fillStyle = lin(c, -W, 0, W, 0, [[0, col[1]], [.5, col[0]], [1, col[1]]]); c.globalAlpha = .85;
        c.beginPath(); c.moveTo(-W, 0); c.lineTo(-W, -L * .8); c.lineTo(0, -L); c.lineTo(W, -L * .8); c.lineTo(W, 0); c.closePath(); c.fill();
        c.globalAlpha = .5; c.strokeStyle = '#e8fbff'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -L); c.stroke();
        c.restore();
      }
      glow(c, x, base - h * .05 * sc, h * .12 * sc, hexA(col[0], .35));
    }
    c.globalAlpha = 1;
  }
  function hexA(hex, a) { var n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')'; }
  function pulse() {
    return {
      init: function (w, h, r) { return particles(7, r, function (r) { return { x: r() * w, y: h * (.55 + r() * .3), c: ['127,232,255', '141,255,200', '201,162,255'][(r() * 3) | 0], ph: r() * TAU, s: h * (.1 + r() * .1) }; }); },
      frame: function (c, w, h, t, P) { P.forEach(function (p) { glow(c, p.x, p.y, p.s, 'rgba(' + p.c + ',' + (.18 + .14 * Math.sin(t * 1.4 + p.ph)) + ')'); }); }
    };
  }

  /* Скариф: тропический закат, лагуна, пальмы, щит над планетой */
  S.scarif = {
    layers: [
      { d: 0, draw: function (c, w, h, r) {
        c.fillStyle = lin(c, 0, 0, 0, h * .66, [[0, '#0b1636'], [.45, '#2e4f86'], [.8, '#e6905a'], [1, '#ffcf8a']]); c.fillRect(0, 0, w, h * .66);
        starsSky(c, w, h, r, 40, .2);
        c.strokeStyle = 'rgba(160,220,255,.25)'; c.lineWidth = 2; c.beginPath(); c.ellipse(w * .5, h * 1.6, w * 1.1, h * 1.35, 0, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
        c.strokeStyle = 'rgba(160,220,255,.1)'; c.lineWidth = 14; c.stroke();
        glow(c, w * .36, h * .64, h * .5, 'rgba(255,190,110,.6)'); c.fillStyle = '#fff1cf'; c.beginPath(); c.arc(w * .36, h * .64, h * .04, 0, TAU); c.fill();
        c.fillStyle = lin(c, 0, h * .66, 0, h, [[0, '#2d7f8c'], [.4, '#13505e'], [1, '#062731']]); c.fillRect(0, h * .66, w, h * .7);
        c.fillStyle = 'rgba(255,210,150,.35)'; for (var i = 0; i < 60; i++) { var y = h * (.67 + r() * .25), s = (y - h * .66) / h; c.fillRect(w * .36 - s * w * .3 * r() - 10, y, 4 + s * 60 * r(), 1.5); }
      } },
      { d: .2, draw: function (c, w, h, r) {
        [[.08, .05], [.62, .04], [.86, .06]].forEach(function (is) { c.fillStyle = '#0d2b2a'; c.beginPath(); c.ellipse(w * is[0], h * .665, w * is[1] * 2, h * .022, 0, Math.PI, TAU); c.fill(); for (var k = 0; k < 4; k++) palm(c, w * is[0] + (k - 1.5) * w * is[1] * .8, h * .66, h * (.06 + r() * .04), r, '#0a2220', 0); });
      } },
      { d: .3, fx: glitter() },
      { d: .6, draw: function (c, w, h) { c.fillStyle = lin(c, 0, h * .88, 0, h * 1.2, [[0, '#a7794c'], [1, '#4b3220']]); c.beginPath(); c.moveTo(0, h * 1.3); c.lineTo(0, h * .9); c.quadraticCurveTo(w * .4, h * .86, w, h * .93); c.lineTo(w, h * 1.3); c.fill(); } },
      { d: .7, fx: palms() }
    ]
  };
  function palm(c, x, base, H, r, col, sway) {
    c.strokeStyle = col; c.fillStyle = col; c.lineWidth = Math.max(1.5, H * .04);
    var tx = x + H * .25 + sway * H * .05, ty = base - H;
    c.beginPath(); c.moveTo(x, base); c.quadraticCurveTo(x + H * .05, base - H * .6, tx, ty); c.stroke();
    for (var k = 0; k < 7; k++) {
      var a = -Math.PI * .95 + k * Math.PI * .15 + sway * .08, L = H * (.45 + (k % 2) * .1);
      c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(tx + Math.cos(a) * L * .6, ty + Math.sin(a) * L * .6 - L * .15, tx + Math.cos(a) * L, ty + Math.sin(a) * L * .6 + L * .25);
      c.lineWidth = Math.max(1, H * .03); c.stroke();
    }
  }
  function palms() {
    return {
      init: function (w, h, r) { return [{ x: w * .02, H: h * .5 }, { x: w * .1, H: h * .38 }, { x: w * .9, H: h * .46 }]; },
      frame: function (c, w, h, t, P) { P.forEach(function (p, i) { palm(c, p.x, h * 1.02, p.H, null, '#071512', Math.sin(t * .8 + i)); }); }
    };
  }
  function glitter() {
    return {
      init: function (w, h, r) { return particles(80, r, function (r) { return { x: w * (.36 + (r() - .5) * .5), y: h * (.67 + r() * .28), ph: r() * TAU }; }); },
      frame: function (c, w, h, t, P) { c.fillStyle = '#fff4d8'; P.forEach(function (p) { var a = Math.max(0, Math.sin(t * 3 + p.ph)); c.globalAlpha = a * .8; c.fillRect(p.x, p.y, 2 + a * 3, 1.2); }); c.globalAlpha = 1; }
    };
  }

  /* Набу: золотой час, водопады со скал, город с куполами, озеро */
  S.naboo = {
    layers: [
      { d: 0, draw: function (c, w, h, r) {
        c.fillStyle = lin(c, 0, 0, 0, h, [[0, '#1d2d55'], [.4, '#5a6f9a'], [.68, '#f0b070'], [1, '#ffd9a0']]); c.fillRect(0, 0, w, h);
        glow(c, w * .78, h * .55, h * .45, 'rgba(255,210,140,.6)');
        c.filter = 'blur(6px)'; for (var i = 0; i < 9; i++) { c.globalAlpha = .3; c.fillStyle = '#ffe2c0'; c.beginPath(); c.ellipse(r() * w, h * (.12 + r() * .32), w * (.08 + r() * .12), h * (.012 + r() * .015), 0, 0, TAU); c.fill(); } c.filter = 'none';
        c.globalAlpha = 1;
      } },
      { d: .1, draw: function (c, w, h, r) { ridge(c, w, h * 1.3, h * .6, h * .1, wave(r, 3), 1.6, 'rgba(70,90,120,.6)'); } },
      { d: .2, draw: function (c, w, h, r) {
        /* скала с городом и водопадами */
        var cx = w * .62, cy = h * .6, cw = w * .44;
        c.fillStyle = lin(c, 0, cy, 0, h * .84, [[0, '#7a6a4e'], [.4, '#4f4535'], [1, '#2b2a24']]);
        c.beginPath(); c.moveTo(cx - cw / 2 - w * .03, h * .84);
        for (var x = 0; x <= 1; x += .05) c.lineTo(cx - cw / 2 + cw * x, cy + Math.sin(x * 9) * 3 + (x < .06 || x > .94 ? h * .04 : 0));
        c.lineTo(cx + cw / 2 + w * .03, h * .84); c.fill();
        c.strokeStyle = 'rgba(30,25,20,.35)'; for (var k = 0; k < 18; k++) { var xx = cx - cw / 2 + r() * cw; c.beginPath(); c.moveTo(xx, cy + 8); c.lineTo(xx + (r() - .5) * 20, h * .82); c.stroke(); }
        var blds = 11;
        for (var k = 0; k < blds; k++) {
          var bw = w * (.022 + r() * .012), bx = cx - cw * .45 + k * cw * .9 / blds, bh = h * (.035 + r() * .05);
          c.fillStyle = lin(c, bx, 0, bx + bw, 0, [[0, '#e3c48c'], [1, '#a88358']]); c.fillRect(bx, cy - bh, bw, bh);
          c.fillStyle = '#7a5c3a'; for (var col = 1; col < 4; col++) c.fillRect(bx + col * bw / 4 - 1, cy - bh + 5, 2, bh - 7);
          c.fillStyle = r() < .5 ? '#6faa8a' : '#e0bd84'; c.beginPath(); c.arc(bx + bw / 2, cy - bh, bw / 2, Math.PI, TAU); c.fill();
        }
        var dx = cx + cw * .05, dw = w * .055, dh = h * .07;
        c.fillStyle = lin(c, dx - dw, 0, dx + dw, 0, [[0, '#d8b77f'], [1, '#9c7a50']]); c.fillRect(dx - dw / 2, cy - dh, dw, dh);
        c.fillStyle = '#6faa8a'; c.beginPath(); c.arc(dx, cy - dh, dw * .62, Math.PI, TAU); c.fill();
        c.fillStyle = '#e8d2a0'; c.fillRect(dx - 1, cy - dh - dw * .62 - 10, 2, 10);
      } },
      { d: .3, fx: falls() },
      { d: .4, draw: function (c, w, h, r) {
        c.fillStyle = lin(c, 0, h * .78, 0, h, [[0, '#d9a56a'], [.3, '#5a7290'], [1, '#22324a']]); c.fillRect(0, h * .8, w, h * .5);
        ridge(c, w, h * .86, h * .82, h * .06, wave(r, 3), 1.5, lin(c, 0, h * .74, 0, h * .86, [[0, '#4f7d3c'], [1, '#2a4a26']]));
      } },
      { d: .6, draw: function (c, w, h, r) { ridge(c, w, h * 1.3, h * 1.0, h * .1, wave(r, 2), 1.2, lin(c, 0, h * .88, 0, h * 1.1, [[0, '#3c6a33'], [1, '#16301a']])); } },
      { d: .5, fx: birds() }
    ]
  };
  function falls() {
    return {
      init: function (w, h, r) { var cx = w * .62; return [cx - w * .19, cx - w * .1, cx - w * .02, cx + w * .12, cx + w * .2].map(function (x) { return { x: x, w: 7 + r() * 10 }; }); },
      frame: function (c, w, h, t, F) {
        var y0 = h * .605, y1 = h * .82;
        F.forEach(function (f, i) {
          c.fillStyle = lin(c, 0, y0, 0, y1, [[0, 'rgba(235,245,255,.85)'], [1, 'rgba(200,225,245,.45)']]); c.fillRect(f.x, y0, f.w, y1 - y0);
          c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 1; c.setLineDash([6, 10]); c.lineDashOffset = -t * 60 - i * 7;
          c.beginPath(); c.moveTo(f.x + f.w * .5, y0); c.lineTo(f.x + f.w * .5, y1); c.stroke(); c.setLineDash([]);
          glow(c, f.x + f.w / 2, y1, 34, 'rgba(255,255,255,.4)');
        });
      }
    };
  }
  function birds() {
    return {
      init: function (w, h, r) { return particles(7, r, function (r) { return { x: r() * w, y: h * (.2 + r() * .25), v: 20 + r() * 25, ph: r() * TAU, s: 4 + r() * 4 }; }); },
      frame: function (c, w, h, t, B, dt) {
        c.strokeStyle = 'rgba(40,40,60,.7)'; c.lineWidth = 1.4;
        B.forEach(function (b) { b.x += b.v * dt; if (b.x > w + 20) b.x = -20; var f = Math.sin(t * 8 + b.ph) * b.s * .6; c.beginPath(); c.moveTo(b.x - b.s, b.y - f); c.lineTo(b.x, b.y); c.lineTo(b.x + b.s, b.y - f); c.stroke(); });
      }
    };
  }

  /* Явин IV: джунгли в тумане, храм массасси, газовый гигант в небе */
  S.yavin4 = {
    layers: [
      { d: 0, draw: function (c, w, h, r) {
        c.fillStyle = lin(c, 0, 0, 0, h, [[0, '#06131a'], [.5, '#1d3c42'], [.75, '#5d8577'], [1, '#9fbf9a']]); c.fillRect(0, 0, w, h);
        starsSky(c, w, h, r, 60, .3);
        var gx = w * .78, gy = h * .3, gr = h * .32;
        c.save(); c.beginPath(); c.arc(gx, gy, gr, 0, TAU); c.clip();
        c.fillStyle = '#d9773a'; c.fillRect(gx - gr, gy - gr, gr * 2, gr * 2);
        for (var i = 0; i < 34; i++) {
          var bc = ['#f0a35a', '#b8562a', '#e88a45', '#9a4422', '#f6c27a'][(r() * 5) | 0], ba = .35 + r() * .45;
          var by = gy - gr + i * gr / 17 + Math.sin(i * 1.7) * 5, bh = gr / 14 + r() * gr / 9;
          c.fillStyle = lin(c, 0, by, 0, by + bh, [[0, hexA(bc, 0)], [.5, hexA(bc, ba)], [1, hexA(bc, 0)]]); c.fillRect(gx - gr, by, gr * 2, bh);
        }
        c.globalAlpha = .5; c.fillStyle = '#c4502a'; c.beginPath(); c.ellipse(gx - gr * .25, gy + gr * .35, gr * .14, gr * .06, 0, 0, TAU); c.fill();
        c.globalAlpha = 1; c.fillStyle = rad(c, gx - gr * .5, gy - gr * .4, gr * .2, gr * 1.3, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(5,15,20,.85)']]); c.fillRect(gx - gr, gy - gr, gr * 2, gr * 2);
        c.restore();
        glow(c, gx, gy, gr * 1.25, 'rgba(255,150,80,.12)');
      } },
      { d: .1, draw: function (c, w, h, r) { canopy(c, w, h, r, h * .66, 'rgba(40,80,70,.7)', 26); } },
      { d: .2, draw: function (c, w, h, r) {
        var tx = w * .3, base = h * .7, tw = w * .2, th = h * .26;
        for (var k = 0; k < 6; k++) { var f = k / 6; c.fillStyle = k % 2 ? '#2b3b33' : '#334539'; c.fillRect(tx - tw * (1 - f * .8) / 2, base - th * (f + 1 / 6), tw * (1 - f * .8), th / 6 + 1); }
        c.fillStyle = '#ffcf7a'; c.fillRect(tx - 5, base - th * .12, 10, 8); glow(c, tx, base - th * .1, 40, 'rgba(255,200,120,.4)');
      } },
      { d: .25, fx: fog('180,210,190', .18, .62) },
      { d: .4, draw: function (c, w, h, r) { canopy(c, w, h, r, h * .78, '#1d3a2a', 18); } },
      { d: .65, draw: function (c, w, h, r) { canopy(c, w, h, r, h * .93, '#0c1d14', 12); } },
      { d: .5, fx: birds() },
      { d: .6, fx: motes({ n: 35, s: [1, 1.8], v: [5, 14], vx: .3, vy: -.2, wob: 1, sway: 1.3, col: 'rgba(230,255,170,1)', glow: 'rgba(200,255,120,.6)', twinkle: 3 }) }
    ]
  };
  function canopy(c, w, h, r, y, col, size) {
    c.fillStyle = col; c.fillRect(0, y, w, h);
    var s = w / size;
    for (var x = -s; x < w + s; x += s * (.5 + r() * .5)) { var rr = s * (.5 + r() * .7); c.beginPath(); c.arc(x, y - r() * rr * .4, rr, 0, TAU); c.fill(); }
  }

  /* ---------- Движок ---------- */
  var items = [];
  function Item(el) {
    var name = el.getAttribute('data-scene'), def = S[name];
    var cv = el.querySelector('canvas');
    if (!def || !cv) return null;
    return { el: el, cv: cv, def: def, built: false, visible: false, near: false, layers: [], arrive: 0, seed: name.length * 977 + name.charCodeAt(0) };
  }
  function build(it) {
    var w = Math.max(320, innerWidth), h = Math.max(400, innerHeight), pad = Math.round(h * .3);
    it.w = w; it.h = h; it.pad = pad;
    it.cv.width = w; it.cv.height = h;
    it.ctx = it.cv.getContext('2d');
    var r = rng(it.seed);
    it.layers = it.def.layers.map(function (L) {
      if (L.draw) {
        var o = document.createElement('canvas'); o.width = w; o.height = h + pad;
        var c = o.getContext('2d'); L.draw(c, w, h + pad * 0, r);
        return { d: L.d, img: o };
      }
      return { d: L.d, fx: L.fx, st: L.fx.init(w, h, r) };
    });
    it.built = true;
  }
  function free(it) { it.layers = []; it.built = false; it.cv.width = it.cv.height = 1; }
  function draw(it, now, dt) {
    var c = it.ctx, w = it.w, h = it.h, t = now / 1000;
    var rect = it.el.getBoundingClientRect();
    var prog = Math.max(0, Math.min(1, -rect.top / Math.max(1, rect.height - innerHeight)));
    var a = it.arrive ? Math.min(1, (now - it.arrive) / 1800) : 1, e = 1 - Math.pow(1 - a, 3);
    c.clearRect(0, 0, w, h);
    for (var i = 0; i < it.layers.length; i++) {
      var L = it.layers[i], off = -prog * it.pad * L.d + (1 - e) * h * .9 * L.d;
      if (L.img) c.drawImage(L.img, 0, off);
      else { c.save(); c.translate(0, off); L.fx.frame(c, w, h, t, L.st, dt); c.restore(); }
    }
    if (a < 1) { c.fillStyle = 'rgba(235,245,255,' + (1 - e) * .5 + ')'; c.fillRect(0, 0, w, h); }
    else it.arrive = 0;
  }
  var raf = 0, last = 0, soft = false;
  function loop(now) {
    raf = 0;
    var dt = Math.min(.1, (now - (last || now)) / 1000);
    if (now - last < (soft ? 120 : 33)) { raf = requestAnimationFrame(loop); return; }
    last = now;
    var any = false;
    items.forEach(function (it) { if (it.visible && it.built) { draw(it, now, reduce ? 0 : dt); any = true; } });
    if (any && !reduce && !document.hidden) raf = requestAnimationFrame(loop);
  }
  function kick() { if (!raf) raf = requestAnimationFrame(loop); }

  function init() {
    try { var t = document.createElement('canvas').getContext('webgl'), ext = t && t.getExtension('WEBGL_debug_renderer_info'); soft = !!(ext && /swiftshader|llvmpipe|software/i.test(t.getParameter(ext.UNMASKED_RENDERER_WEBGL))); } catch (e) {}
    document.querySelectorAll('.surface[data-scene]').forEach(function (el) { var it = Item(el); if (it) items.push(it); });
    if (!items.length) return;
    if ('IntersectionObserver' in window) {
      var near = new IntersectionObserver(function (es) {
        es.forEach(function (en) { var it = items.filter(function (x) { return x.el === en.target; })[0]; if (!it) return; it.near = en.isIntersecting; if (it.near && !it.built) build(it); if (!it.near && it.built) free(it); });
      }, { rootMargin: '120% 0px' });
      var vis = new IntersectionObserver(function (es) {
        es.forEach(function (en) { var it = items.filter(function (x) { return x.el === en.target; })[0]; if (!it) return; it.visible = en.isIntersecting; if (it.visible) { if (!it.built) build(it); kick(); } });
      }, { rootMargin: '0px' });
      items.forEach(function (it) { near.observe(it.el); vis.observe(it.el); });
    } else items.forEach(function (it) { build(it); it.visible = true; });
    addEventListener('scroll', function () { if (reduce || soft) items.forEach(function (it) { if (it.visible && it.built) draw(it, performance.now(), 0); }); kick(); }, { passive: true });
    var rt = 0, lw = innerWidth;
    addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { if (Math.abs(innerWidth - lw) < 2 && Math.abs(innerHeight - (items[0].h || 0)) < 140) return; lw = innerWidth; items.forEach(function (it) { if (it.built) { build(it); draw(it, performance.now(), 0); } }); }, 200); });
    document.addEventListener('visibilitychange', function () { if (!document.hidden) { last = 0; kick(); } });
    kick();
  }
  /* После прыжка: камера опускается к поверхности. */
  function arrive(id) {
    var sec = document.getElementById(id), el = sec && sec.querySelector('.surface');
    var it = items.filter(function (x) { return x.el === el; })[0];
    if (!it || reduce) return;
    if (!it.built) build(it);
    it.visible = true; it.arrive = performance.now(); kick();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.Scenes = { arrive: arrive, list: Object.keys(S) };
})();
