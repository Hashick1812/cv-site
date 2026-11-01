/* Музыка заставки: оригинальная тема, написана для этого сайта и синтезируется в браузере (Web Audio).
   Свой трек (только с лицензией на использование): укажите путь в TRACK, например 'assets/intro.mp3'. */
(function () {
  'use strict';
  var TRACK = '';
  var AC = window.AudioContext || window.webkitAudioContext;
  var actx = null, noiseBuf = null, reverbBuf = null, music = null;

  function audioCtx() {
    if (!actx) {
      actx = new AC();
      var sr = actx.sampleRate, i, c;
      noiseBuf = actx.createBuffer(1, sr * 3, sr);
      var nd = noiseBuf.getChannelData(0);
      for (i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
      var len = Math.floor(sr * 2.8);
      reverbBuf = actx.createBuffer(2, len, sr);
      for (c = 0; c < 2; c++) {
        var ch = reverbBuf.getChannelData(c);
        for (i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.4);
      }
    }
    if (actx.state === 'suspended') actx.resume();
    return actx;
  }
  function nm(n) {
    if (typeof n === 'number') return n;
    var m = /^([A-G])(b|#)?(\d)$/.exec(n);
    return { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] === 'b' ? -1 : m[2] === '#' ? 1 : 0) + (+m[3] + 1) * 12;
  }
  function hz(n) { return 440 * Math.pow(2, (nm(n) - 69) / 12); }

  function playTheme(offset) {
    var ctx = audioCtx(), now = ctx.currentTime, t0 = now - offset + 0.05, nodes = [];
    var out = ctx.createGain(), comp = ctx.createDynamicsCompressor(), verb = ctx.createConvolver(), wet = ctx.createGain(), bus = ctx.createGain();
    comp.threshold.value = -24; comp.knee.value = 6; comp.ratio.value = 12; comp.attack.value = 0.003; comp.release.value = 0.25;
    verb.buffer = reverbBuf; wet.gain.value = 0.3;
    bus.connect(out); bus.connect(verb); verb.connect(wet); wet.connect(out);
    out.connect(comp); comp.connect(ctx.destination);
    out.gain.setValueAtTime(0.0001, now); out.gain.exponentialRampToValueAtTime(0.5, now + 0.3);
    function at(t) { return t0 + t; }
    function live(t) { return t0 + t >= now - 0.01; }
    function osc(type, f, st, end, dest, det) {
      var o = ctx.createOscillator(); o.type = type; o.frequency.value = f; if (det) o.detune.value = det;
      o.connect(dest); o.start(st); o.stop(end); nodes.push(o); return o;
    }
    /* медь: два расстроенных «пилообразных» голоса + фильтр с атакой + лёгкое вибрато */
    function brass(n, t, dur, vel, bright) {
      if (!live(t)) return;
      var f = hz(n), st = at(t), end = st + dur, g = ctx.createGain(), lp = ctx.createBiquadFilter(), lfo = ctx.createOscillator(), lg = ctx.createGain();
      lp.type = 'lowpass'; lp.Q.value = 1.1;
      lp.frequency.setValueAtTime(f * 1.2, st);
      lp.frequency.linearRampToValueAtTime(Math.min(f * (bright || 6), 5200), st + 0.09);
      lp.frequency.setTargetAtTime(Math.min(f * 3.2, 3200), st + 0.09, 0.25);
      g.gain.setValueAtTime(0, st); g.gain.linearRampToValueAtTime(vel, st + 0.05);
      g.gain.setTargetAtTime(vel * 0.72, st + 0.05, 0.3); g.gain.setTargetAtTime(0, end, 0.08);
      lfo.frequency.value = 5; lg.gain.setValueAtTime(0, st); lg.gain.linearRampToValueAtTime(f * 0.005, st + 0.6);
      lfo.connect(lg); lfo.start(st); lfo.stop(end + 0.6); nodes.push(lfo);
      [-7, 6].forEach(function (det) { lg.connect(osc('sawtooth', f, st, end + 0.6, lp, det).frequency); });
      lp.connect(g); g.connect(bus);
    }
    /* струнные: аккорд из расстроенных голосов с мягкой атакой */
    function strings(ns, t, dur, vel) {
      if (!live(t)) return;
      var st = at(t), end = st + dur, g = ctx.createGain(), lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 1400;
      g.gain.setValueAtTime(0, st); g.gain.linearRampToValueAtTime(vel, st + 0.35); g.gain.setTargetAtTime(0, end - 0.1, 0.25);
      ns.forEach(function (n) { [-9, 0, 9].forEach(function (det) { osc('sawtooth', hz(n), st, end + 1, lp, det); }); });
      lp.connect(g); g.connect(bus);
    }
    function bass(n, t, dur, vel) {
      if (!live(t)) return;
      var st = at(t), lp = ctx.createBiquadFilter(), g = ctx.createGain();
      lp.type = 'lowpass'; lp.frequency.setValueAtTime(1000, st); lp.frequency.exponentialRampToValueAtTime(240, st + dur);
      g.gain.setValueAtTime(0, st); g.gain.linearRampToValueAtTime(vel, st + 0.012); g.gain.exponentialRampToValueAtTime(0.001, st + dur);
      osc('sawtooth', hz(n), st, st + dur + 0.05, lp); lp.connect(g); g.connect(bus);
    }
    /* литавры: тон с «проседанием» высоты + обертон + шумовой удар */
    function timp(n, t, vel) {
      if (!live(t)) return;
      var f = hz(n), st = at(t), g = ctx.createGain(), g2 = ctx.createGain();
      var o = osc('sine', f, st, st + 1.6, g); o.frequency.setValueAtTime(f * 1.5, st); o.frequency.exponentialRampToValueAtTime(f, st + 0.06);
      osc('triangle', f * 2, st, st + 0.9, g2);
      g.gain.setValueAtTime(0, st); g.gain.linearRampToValueAtTime(vel, st + 0.006); g.gain.exponentialRampToValueAtTime(0.001, st + 1.5);
      g2.gain.setValueAtTime(vel * 0.35, st); g2.gain.exponentialRampToValueAtTime(0.001, st + 0.8);
      g.connect(bus); g2.connect(bus);
      var nz = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), ng = ctx.createGain();
      nz.buffer = noiseBuf; bp.type = 'bandpass'; bp.frequency.value = f * 4; bp.Q.value = 1.2;
      ng.gain.setValueAtTime(vel * 0.5, st); ng.gain.exponentialRampToValueAtTime(0.001, st + 0.12);
      nz.connect(bp); bp.connect(ng); ng.connect(bus); nz.start(st); nz.stop(st + 0.2); nodes.push(nz);
    }
    function roll(n, t, dur, v0, v1) { for (var x = 0; x < dur; x += 0.07) timp(n, t + x, v0 + (v1 - v0) * x / dur); }
    function cymbal(t, vel, dur, swell) {
      if (!live(t)) return;
      var st = at(t), nz = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), g = ctx.createGain();
      nz.buffer = noiseBuf; nz.loop = true; hp.type = 'highpass'; hp.frequency.value = 5500;
      if (swell) { g.gain.setValueAtTime(0.0001, st); g.gain.exponentialRampToValueAtTime(vel, st + dur); g.gain.setValueAtTime(0, st + dur + 0.02); }
      else { g.gain.setValueAtTime(vel, st); g.gain.exponentialRampToValueAtTime(0.001, st + dur); }
      nz.connect(hp); hp.connect(g); g.connect(bus); nz.start(st); nz.stop(st + dur + 0.1); nodes.push(nz);
    }

    /* Партитура: тишина под «Не так давно…», удар на появлении логотипа (6 с), марш под бегущий текст. */
    var B = 0.6, BAR = 2.4, T0 = 6;
    function bt(bar, beat) { return T0 + bar * BAR + beat * B; }
    strings(['C2', 'G2'], 3.2, 2.9, 0.05);
    cymbal(3.4, 0.16, 2.6, true);
    roll('G2', 4.9, 1.1, 0.06, 0.32);
    timp('C2', bt(0, 0), 0.75); cymbal(bt(0, 0), 0.22, 3.2);
    ['C3', 'G3', 'C4', 'Eb4', 'G4'].forEach(function (n) { brass(n, bt(0, 0), 3 * B, 0.065, 5); });
    brass('C5', bt(0, 0), 3 * B, 0.15, 7);
    strings(['C2', 'C3', 'G3'], bt(0, 0), BAR, 0.05);
    brass('G4', bt(0, 3), 0.45 * B, 0.12); brass('G4', bt(0, 3.5), 0.45 * B, 0.14);
    var melody = [
      [['C5', 1], ['D5', .5], ['Eb5', .5], ['D5', 1], ['G4', 1]],
      [['Eb5', 1], ['D5', .5], ['C5', .5], ['G4', 2]],
      [['Ab4', 1], ['Bb4', 1], ['C5', 1.5], ['D5', .5]],
      [['Eb5', 1.5], ['F5', .5], ['G5', 2]],
      [['F5', 1], ['Eb5', 1], ['D5', 1], ['Bb4', 1]],
      [['C5', 1], ['G4', 1], ['Ab4', 1], ['F4', 1]],
      [['G4', 1.5], ['B4', .5], ['D5', 1], ['F5', 1]],
      [['C5', 4]]
    ];
    var chords = [['C3', 'Eb3', 'G3'], ['C3', 'Eb3', 'G3'], ['Ab2', 'C3', 'Eb3'], ['Eb3', 'G3', 'Bb3'], ['Bb2', 'D3', 'F3'], ['F2', 'Ab2', 'C3'], ['G2', 'B2', 'D3', 'F3'], ['C3', 'E3', 'G3', 'C4']];
    var roots = ['C2', 'C2', 'Ab1', 'Eb2', 'Bb1', 'F2', 'G1', 'C2'];
    var kettle = ['C2', 'C2', 'Ab1', 'Eb2', 'Bb1', 'F2', 'G1', 'C2'];
    melody.forEach(function (bar, i) {
      var n = i + 1, beat = 0;
      bar.forEach(function (x) {
        brass(x[0], bt(n, beat), x[1] * B * 0.92, 0.15, 6);
        if (n >= 3) brass(nm(x[0]) - 12, bt(n, beat), x[1] * B * 0.92, 0.07, 5);
        beat += x[1];
      });
      strings(chords[i], bt(n, 0), BAR, 0.04);
      if (n < 8) {
        for (var k = 0; k < 8; k++) bass(roots[i], bt(n, k / 2), 0.24, k % 2 ? 0.1 : 0.18);
        timp(kettle[i], bt(n, 0), 0.5); if (n !== 7) timp(kettle[i], bt(n, 2), 0.32);
      }
    });
    roll('G1', bt(7, 2), 2 * B, 0.06, 0.36);
    timp('C2', bt(8, 0), 0.75); cymbal(bt(8, 0), 0.24, 3.4);
    ['C3', 'G3', 'C4', 'E4', 'G4'].forEach(function (n) { brass(n, bt(8, 0), 4 * B, 0.07, 5); });
    brass('G5', bt(8, 0), 4 * B, 0.08, 6);
    strings(['C1', 'C2', 'G2'], bt(8, 0), 2 * BAR, 0.06);
    return { ctx: ctx, out: out, nodes: nodes };
  }


  function start(offset) {
    stop(0.15);
    if (TRACK) {
      var el = new Audio(TRACK);
      el.volume = 0.8;
      el.addEventListener('playing', function () {
        if (offset > 0.5 && offset < (el.duration || 0)) el.currentTime = offset;
      }, { once: true });
      music = { el: el, ok: el.play() };
      return music;
    }
    if (!AC) return null;
    music = playTheme(Math.max(0, offset || 0));
    return music;
  }
  function stop(fade) {
    if (!music) return;
    var m = music; music = null;
    if (m.el) {
      var v = m.el.volume, steps = Math.max(1, Math.round(fade * 20)), i = 0;
      var iv = setInterval(function () { i++; m.el.volume = Math.max(0, v * (1 - i / steps)); if (i >= steps) { clearInterval(iv); m.el.pause(); } }, 50);
      return;
    }
    var t = m.ctx.currentTime;
    m.out.gain.cancelScheduledValues(t);
    m.out.gain.setValueAtTime(m.out.gain.value, t);
    m.out.gain.linearRampToValueAtTime(0, t + fade);
    setTimeout(function () {
      m.nodes.forEach(function (n) { try { n.stop(); } catch (e) {} });
      m.out.disconnect();
    }, fade * 1000 + 120);
  }
  window.IntroMusic = { supported: !!(AC || TRACK), start: start, stop: stop };
})();
