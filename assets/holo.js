/* Голограммы: объёмные логотипы с помехами, голограмма данных и голокарта навикомпьютера. */
(function () {
  'use strict';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DPR = Math.min(window.devicePixelRatio || 1, 2);

  /* Объём: первый слой логотипа копируется несколько раз со сдвигом по глубине. */
  document.querySelectorAll('.holo-spin[data-layers]').forEach(function (spin) {
    var n = +spin.getAttribute('data-layers') || 5, depth = +spin.getAttribute('data-depth') || 10;
    var src = spin.querySelector('.holo-layer');
    if (!src) return;
    for (var i = 1; i < n; i++) spin.insertBefore(src.cloneNode(true), src);
    spin.querySelectorAll('.holo-layer').forEach(function (l, k) {
      var z = -depth / 2 + depth * k / (n - 1);
      l.style.transform = 'translateZ(' + z.toFixed(1) + 'px)';
      if (k < n - 1) l.style.opacity = (.14 + .36 * k / (n - 1)).toFixed(2);
      else l.classList.add('front');
    });
  });
  /* У каждой голограммы своя фаза мерцания и помех, чтобы они не моргали хором. */
  document.querySelectorAll('.holo').forEach(function (h) {
    h.style.setProperty('--ph', (-Math.random() * 9).toFixed(2) + 's');
  });

  function rgbOf(el) {
    var c = getComputedStyle(el).getPropertyValue('--h').trim() || '#6fd6ff';
    var m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(c);
    return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [111, 214, 255];
  }
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a.toFixed(3) + ')'; }
  function fit(canvas) {
    var r = canvas.getBoundingClientRect();
    canvas.width = Math.max(2, Math.round(r.width * DPR)); canvas.height = Math.max(2, Math.round(r.height * DPR));
    var ctx = canvas.getContext('2d'); ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    return { ctx: ctx, w: r.width, h: r.height };
  }
  var apis = [];
  function animate(canvas, draw) {
    var visible = false, raf = 0, box = fit(canvas), frames = 0, color = rgbOf(canvas);
    function frame(t) {
      if (++frames % 40 === 0) color = rgbOf(canvas);
      draw(box.ctx, box.w, box.h, t, color);
      raf = visible && !reduce ? requestAnimationFrame(frame) : 0;
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting;
        if (visible && !raf) raf = requestAnimationFrame(frame);
      }).observe(canvas);
    } else { visible = true; raf = requestAnimationFrame(frame); }
    addEventListener('resize', function () { box = fit(canvas); if (!raf) draw(box.ctx, box.w, box.h, performance.now(), color); });
    var api = { redraw: function () { color = rgbOf(canvas); if (!raf) draw(box.ctx, box.w, box.h, performance.now(), color); } };
    apis.push(api);
    return api;
  }

  /* Голограмма данных: точки и регрессионная плоскость в медленно вращающемся кубе. */
  document.querySelectorAll('canvas.holo-scatter').forEach(function (canvas) {
    var seed = 11;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    var pts = [];
    for (var i = 0; i < 80; i++) {
      var x = rnd() * 2 - 1, z = rnd() * 2 - 1;
      pts.push([x, .5 * x + .32 * z + (rnd() - .5) * .42, z]);
    }
    var cube = [];
    [-1, 1].forEach(function (a) { [-1, 1].forEach(function (b) {
      cube.push([[-1, a, b], [1, a, b]], [[a, -1, b], [a, 1, b]], [[a, b, -1], [a, b, 1]]);
    }); });
    animate(canvas, function (ctx, w, h, t, c) {
      ctx.clearRect(0, 0, w, h);
      var ang = t * .00032, ca = Math.cos(ang), sa = Math.sin(ang), tx = .42, ct = Math.cos(tx), st = Math.sin(tx);
      var S = Math.min(w, h) * .3;
      function P(p) {
        var x = p[0] * ca - p[2] * sa, z = p[0] * sa + p[2] * ca, y = p[1];
        var y2 = y * ct - z * st, z2 = y * st + z * ct, k = 3.2 / (3.2 + z2);
        return [w / 2 + x * S * k, h * .52 - y2 * S * k, z2, k];
      }
      function line(a, b, alpha, width) {
        var A = P(a), B = P(b);
        ctx.strokeStyle = rgba(c, alpha); ctx.lineWidth = width || 1;
        ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
      }
      cube.forEach(function (e) { line(e[0], e[1], .18); });
      for (var g = -1; g <= 1.001; g += .25) {
        line([g, .5 * g - .32, -1], [g, .5 * g + .32, 1], .32);
        line([-1, -.5 + .32 * g, g], [1, .5 + .32 * g, g], .32);
      }
      var proj = pts.map(function (p) { var q = P(p); q.push(p); return q; }).sort(function (a, b) { return b[2] - a[2]; });
      proj.forEach(function (q) {
        var p = q[4], onPlane = P([p[0], .5 * p[0] + .32 * p[2], p[2]]);
        ctx.strokeStyle = rgba(c, .16); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(onPlane[0], onPlane[1]); ctx.stroke();
        ctx.fillStyle = rgba(c, .55 + .4 * (1 - (q[2] + 1.5) / 3));
        ctx.beginPath(); ctx.arc(q[0], q[1], 1.6 + 1.6 * q[3], 0, 6.283); ctx.fill();
      });
      /* Помехи: иногда полоска изображения сдвигается вбок, как у плохо настроенного голопроектора. */
      if (Math.random() < .035) {
        var gy = Math.random() * h * .9, gh = 3 + Math.random() * 12, dx = (Math.random() - .5) * 26;
        ctx.globalAlpha = .8;
        ctx.drawImage(canvas, 0, gy * DPR, canvas.width, gh * DPR, dx, gy, w, gh);
        ctx.globalAlpha = 1;
      }
    });
  });

  /* Голокарта навикомпьютера: орбиты с планетами, курс от Татуина до выбранной точки. */
  var nav = { sel: null, api: null };
  var mapCanvas = document.querySelector('canvas.holomap');
  if (mapCanvas) {
    var dests = Array.prototype.map.call(document.querySelectorAll('.dest'), function (b, i) {
      return { id: b.getAttribute('data-target'), color: getComputedStyle(b).getPropertyValue('--c').trim() || '#6fd6ff',
               r: .28 + (i % 5) * .15, a: i * 2.39, sp: .00008 + (i % 3) * .00003 };
    });
    nav.api = animate(mapCanvas, function (ctx, w, h, t, c) {
      ctx.clearRect(0, 0, w, h);
      var cx = w / 2, cy = h / 2, R = Math.min(w / 2, h) * .92, flat = .42;
      for (var k = 1; k <= 5; k++) {
        ctx.strokeStyle = rgba(c, .14); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(cx, cy, R * (.13 + k * .15), R * (.13 + k * .15) * flat, 0, 0, 6.283); ctx.stroke();
      }
      ctx.fillStyle = rgba(c, .9); ctx.beginPath(); ctx.arc(cx, cy, 3, 0, 6.283); ctx.fill();
      var pos = {};
      dests.forEach(function (d) {
        var a = d.a + t * d.sp, x = cx + Math.cos(a) * R * d.r, y = cy + Math.sin(a) * R * d.r * flat;
        pos[d.id] = [x, y];
        ctx.fillStyle = d.color; ctx.globalAlpha = d.id === nav.sel ? 1 : .75;
        ctx.beginPath(); ctx.arc(x, y, d.id === nav.sel ? 4.2 : 2.8, 0, 6.283); ctx.fill();
        ctx.globalAlpha = 1;
      });
      var from = pos.tatooine, to = nav.sel && pos[nav.sel];
      if (from) {
        ctx.strokeStyle = rgba(c, .7); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(from[0], from[1], 6 + Math.sin(t * .004) * 1.5, 0, 6.283); ctx.stroke();
      }
      if (from && to && nav.sel !== 'tatooine') {
        ctx.setLineDash([4, 4]); ctx.lineDashOffset = -t * .02;
        ctx.strokeStyle = 'rgba(255,232,31,.85)'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(from[0], from[1]); ctx.lineTo(to[0], to[1]); ctx.stroke();
        ctx.setLineDash([]);
        ctx.strokeStyle = 'rgba(255,232,31,.9)';
        ctx.beginPath(); ctx.arc(to[0], to[1], 8, 0, 6.283); ctx.stroke();
      }
    });
  }

  window.Holo = {
    setNav: function (id) { nav.sel = id; if (nav.api) nav.api.redraw(); },
    /* Перечитать цвет голограмм (например, после приказа 66). */
    refresh: function () { apis.forEach(function (a) { a.redraw(); }); }
  };
})();
