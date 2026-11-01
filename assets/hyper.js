/* Прыжок в гиперпространство как в фильмах: звёзды вытягиваются в линии, вспышка,
   синий вихревой туннель, выход с замедлением. Рисуется шейдером поверх страницы. */
(function () {
  'use strict';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cv = null, gl = null, U = {}, ok = null, raf = 0, busy = false;

  var FS = [
    'precision highp float;',
    'uniform vec2 uRes; uniform float uT,uStretch,uTunnel,uFlash,uAlpha;',
    'float h1(float n){return fract(sin(n*12.9898)*43758.5453);}',
    'float h3(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}',
    'float nz(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);',
    ' return mix(mix(mix(h3(i),h3(i+vec3(1.,0.,0.)),f.x),mix(h3(i+vec3(0.,1.,0.)),h3(i+vec3(1.,1.,0.)),f.x),f.y),',
    '            mix(mix(h3(i+vec3(0.,0.,1.)),h3(i+vec3(1.,0.,1.)),f.x),mix(h3(i+vec3(0.,1.,1.)),h3(i+vec3(1.,1.,1.)),f.x),f.y),f.z);}',
    'float fbm(vec3 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*nz(p);p*=2.03;a*=.5;}return v;}',
    /* звёзды: каждая в своём угловом секторе, летит от центра; при разгоне — длинная линия */
    'vec3 stars(vec2 p,float N,float seed,float t){',
    ' float r=length(p),a=atan(p.y,p.x);',
    ' float ai=(a/6.2831853+.5)*N,id=floor(ai),fa=fract(ai)-.5;',
    ' float s1=h1(id+seed),s2=h1(id*1.37+seed+7.),s3=h1(id*.71+seed+3.);',
    ' if(s3<.4)return vec3(0.);',
    ' float rr=fract(s1+t*(.05+uStretch*.9)*(.45+s2));',
    ' rr=.02+rr*rr*1.25;',
    ' float len=.002+uStretch*(.03+rr*.6);',
    ' float al=smoothstep(rr-len,rr,r)*(1.-smoothstep(rr,rr+.003,r));',
    ' float wa=(1.3/uRes.y)/max(r,.001)/6.2831853*N;',
    ' float ac=1.-smoothstep(wa*.5,wa*1.6+.015,abs(fa));',
    ' return mix(vec3(.7,.82,1.),vec3(1.),s2)*al*ac*(.55+.9*s2)*smoothstep(.0,.06,r);}',
    /* туннель: синие вихри и белые полосы, яркое ядро в центре */
    'vec3 tunnel(vec2 p,float t){',
    ' float r=length(p),a=atan(p.y,p.x);',
    ' float z=.42/(r+.03)+t*6.;',
    ' float tw=a+z*.035;',
    ' float n=fbm(vec3(cos(tw)*2.2,sin(tw)*2.2,z*.55));',
    ' float s=fbm(vec3(cos(tw)*9.,sin(tw)*9.,z*.09));',
    ' float st=pow(smoothstep(.45,.95,s),2.)*2.4;',
    ' vec3 c=mix(vec3(.0,.02,.12),vec3(.18,.42,.95),smoothstep(.3,.78,n));',
    ' c+=vec3(.55,.75,1.)*pow(n,4.)*1.4+vec3(.85,.93,1.)*st;',
    ' c+=vec3(.75,.88,1.)*exp(-r*6.5)*1.3;',
    ' c*=1.-smoothstep(.75,1.4,r)*.35;',
    ' return c;}',
    'void main(){',
    ' vec2 p=(gl_FragCoord.xy-.5*uRes)/uRes.y;',
    ' vec3 s=stars(p,380.,0.,uT)+stars(p,960.,17.,uT*1.13)*.75;',
    ' vec3 col=s*(1.-uTunnel*.75);',
    ' if(uTunnel>.001)col+=tunnel(p,uT)*uTunnel;',
    ' col+=vec3(.9,.95,1.)*uFlash;',
    ' gl_FragColor=vec4(col*uAlpha,uAlpha);',
    '}'
  ].join('\n');

  function init() {
    if (ok !== null) return ok;
    ok = false;
    cv = document.createElement('canvas');
    cv.className = 'hyper';
    cv.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cv);
    gl = cv.getContext('webgl', { antialias: false, premultipliedAlpha: true }) || cv.getContext('experimental-webgl');
    if (!gl) return false;
    function sh(t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : (console.warn(gl.getShaderInfoLog(o)), null); }
    var vs = sh(gl.VERTEX_SHADER, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'), fs = sh(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return false;
    var pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr); gl.useProgram(pr);
    var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var l = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, 2, gl.FLOAT, false, 0, 0);
    ['uRes', 'uT', 'uStretch', 'uTunnel', 'uFlash', 'uAlpha'].forEach(function (n) { U[n] = gl.getUniformLocation(pr, n); });
    ok = true;
    return ok;
  }

  /* Звук прыжка: нарастающий свист, удар на входе и гул туннеля. Только если звук включён. */
  function sound() {
    var on = false; try { on = localStorage.getItem('ik-sound') === '1'; } catch (e) {}
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!on || !AC) return;
    var ac = sound.ac || (sound.ac = new AC()); if (ac.state === 'suspended') ac.resume();
    var now = ac.currentTime, len = 3 * ac.sampleRate, buf = ac.createBuffer(1, len, ac.sampleRate), ch = buf.getChannelData(0);
    for (var i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
    var src = ac.createBufferSource(); src.buffer = buf;
    var bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.4;
    bp.frequency.setValueAtTime(180, now); bp.frequency.exponentialRampToValueAtTime(2600, now + .85); bp.frequency.exponentialRampToValueAtTime(420, now + 2.4);
    var g = ac.createGain(); g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(.16, now + .8); g.gain.linearRampToValueAtTime(.07, now + 1.2); g.gain.exponentialRampToValueAtTime(.001, now + 2.6);
    src.connect(bp); bp.connect(g); g.connect(ac.destination); src.start(now); src.stop(now + 2.7);
    var o = ac.createOscillator(), og = ac.createGain(); o.type = 'sine';
    o.frequency.setValueAtTime(90, now + .82); o.frequency.exponentialRampToValueAtTime(32, now + 1.8);
    og.gain.setValueAtTime(0, now + .8); og.gain.linearRampToValueAtTime(.32, now + .86); og.gain.exponentialRampToValueAtTime(.001, now + 2);
    o.connect(og); og.connect(ac.destination); o.start(now + .8); o.stop(now + 2.1);
  }

  function clamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function ease(x) { x = clamp(x); return x * x * (3 - 2 * x); }
  function fit() {
    var s = Math.min(window.devicePixelRatio || 1, 1) * (innerWidth * innerHeight > 2e6 ? .6 : .75);
    cv.width = Math.round(innerWidth * s); cv.height = Math.round(innerHeight * s);
    gl.viewport(0, 0, cv.width, cv.height);
  }

  /* opts.onMid — когда экран полностью закрыт туннелем (тут меняем страницу), opts.onEnd — после выхода. */
  function play(opts) {
    opts = opts || {};
    if (busy) return false;
    if (reduce || !init()) { if (opts.onMid) opts.onMid(); if (opts.onEnd) opts.onEnd(); return true; }
    busy = true;
    fit();
    cv.classList.add('on');
    document.documentElement.classList.add('hyperjump');
    sound();
    var D = opts.short ? 2000 : 2600, mid = D * .5, midDone = false, t0 = performance.now(), seed = Math.random() * 50;
    /* если вкладку свернули посреди прыжка, кадры не рисуются: всё равно доводим прыжок до конца */
    var safety = setTimeout(function () { if (busy) { cancelAnimationFrame(raf); finish(); } }, D + 1500);
    function finish() {
      clearTimeout(safety);
      if (!midDone && opts.onMid) { midDone = true; opts.onMid(); }
      cv.classList.remove('on'); cv.style.transform = '';
      document.documentElement.classList.remove('hyperjump');
      busy = false;
      if (opts.onEnd) opts.onEnd();
    }
    function frame(now) {
      var t = now - t0, k = t / D;
      /* фазы: разгон (линии растут) → вспышка → туннель → выход */
      var alpha = ease(t / 260) * (1 - ease((t - (D - 420)) / 420));
      var stretch = Math.pow(clamp((t - 180) / (D * .33)), 3) * (1 - ease((t - D * .74) / (D * .16)));
      var tunnel = ease((t - D * .31) / (D * .06)) * (1 - ease((t - D * .7) / (D * .08)));
      var f1 = t - D * .345, f2 = t - D * .76;
      var flash = Math.max(f1 > -60 && f1 < 260 ? (f1 < 0 ? 1 + f1 / 60 : 1 - f1 / 260) : 0, f2 > -80 && f2 < 300 ? .55 * (f2 < 0 ? 1 + f2 / 80 : 1 - f2 / 300) : 0);
      var shake = t > D * .3 && t < D * .42 ? (Math.random() - .5) * 8 : 0;
      cv.style.transform = shake ? 'translate(' + shake + 'px,' + (Math.random() - .5) * 6 + 'px) scale(1.02)' : '';
      gl.uniform2f(U.uRes, cv.width, cv.height);
      gl.uniform1f(U.uT, t / 1000 + seed);
      gl.uniform1f(U.uStretch, stretch);
      gl.uniform1f(U.uTunnel, tunnel);
      gl.uniform1f(U.uFlash, clamp(flash));
      gl.uniform1f(U.uAlpha, alpha);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (!midDone && t >= mid) { midDone = true; if (opts.onMid) opts.onMid(); }
      if (k < 1) { raf = requestAnimationFrame(frame); return; }
      finish();
    }
    raf = requestAnimationFrame(frame);
    return true;
  }
  window.Hyper = { play: play, busy: function () { return busy; } };
})();
