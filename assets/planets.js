/* Планеты и туманность.
   Один WebGL-контекст по очереди рисует все планеты и копирует кадр в их <canvas>,
   поэтому планет на странице может быть сколько угодно, а видеокарта занята только видимыми.

   3D simplex noise: Ian McEwan, Ashima Arts (MIT License), https://github.com/ashima/webgl-noise */
(function () {
  'use strict';

  /* kind: 0 пустыня, 1 город, 2 лёд, 3 болото, 4 лава, 5 кристаллы, 6 океан с островами,
           7 материки и океаны, 8 джунгли, 9 газовый гигант */
  var TYPES = {
    tatooine:  { kind: 0, c1: [.78, .56, .33], c2: [.95, .8, .55], c3: [.5, .32, .2], atm: [1, .82, .55], atmK: .45, rot: .02, tilt: .15, suns: 2 },
    coruscant: { kind: 1, c1: [.36, .35, .38], c2: [.56, .5, .42], c3: [.15, .15, .18], c4: [1, .66, .3], atm: [.6, .62, 1], atmK: .55, cloud: .1, rot: .025, tilt: .4 },
    hoth:      { kind: 2, c1: [.95, .97, 1], c2: [.74, .84, .95], c3: [.4, .55, .72], atm: [.78, .9, 1], atmK: .75, cloud: .35, rot: .015, tilt: .35 },
    dagobah:   { kind: 3, c1: [.12, .14, .08], c2: [.34, .34, .18], c3: [.1, .17, .15], cloudC: [.56, .6, .52], atm: [.6, .7, .52], atmK: .7, cloud: .72, rot: .014, tilt: .2 },
    mustafar:  { kind: 4, c1: [.08, .06, .06], c2: [.22, .13, .1], c4: [1, .45, .1], atm: [1, .4, .15], atmK: .6, rot: .02, tilt: .3, emitAll: 1 },
    ilum:      { kind: 5, c1: [.85, .92, 1], c2: [.5, .62, .8], c3: [.16, .22, .36], c4: [.4, .95, 1], atm: [.5, .85, 1], atmK: .7, cloud: .15, rot: .015, tilt: .5, emitAll: 1 },
    scarif:    { kind: 6, c1: [.25, .55, .28], c2: [.95, .88, .68], c3: [.04, .45, .58], atm: [.5, .88, 1], atmK: .85, cloud: .28, rot: .017, tilt: .3 },
    naboo:     { kind: 7, c1: [.22, .47, .2], c2: [.52, .62, .3], c3: [.08, .27, .56], atm: [.5, .72, 1], atmK: .8, cloud: .4, rot: .016, tilt: .35 },
    yavin4:    { kind: 8, c1: [.3, .55, .18], c2: [.14, .4, .14], c3: [.05, .22, .1], cloudC: [.9, .95, .9], atm: [.62, .9, .66], atmK: .7, cloud: .3, rot: .02, tilt: .25 },
    moon:      { kind: 10, c1: [.62, .6, .58], c2: [.82, .8, .76], c3: [.35, .34, .33], atm: [.8, .8, .85], atmK: .15, rot: .03, tilt: .2 },
    moonice:   { kind: 10, c1: [.66, .74, .82], c2: [.9, .94, 1], c3: [.4, .48, .58], atm: [.75, .85, 1], atmK: .25, rot: .03, tilt: .3 },
    yavin:     { kind: 9, c1: [.8, .38, .18], c2: [.96, .72, .48], c3: [.5, .18, .1], atm: [1, .62, .4], atmK: .45, rot: .008, tilt: .12 }
  };

  var NOISE = [
    'vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}',
    'vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}',
    'vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}',
    'vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}',
    'float snoise(vec3 v){',
    ' const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);',
    ' vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);',
    ' vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);',
    ' vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;',
    ' i=mod289(i);',
    ' vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));',
    ' float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;',
    ' vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);',
    ' vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);',
    ' vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);',
    ' vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));',
    ' vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;',
    ' vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);',
    ' vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));',
    ' p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;',
    ' vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;',
    ' return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));',
    '}',
    'float fbm(vec3 p){float f=0.0,a=0.5;for(int i=0;i<5;i++){f+=a*snoise(p);p=p*2.02+vec3(1.7,9.2,3.1);a*=0.5;}return f;}',
    'float fbm3(vec3 p){float f=0.0,a=0.5;for(int i=0;i<3;i++){f+=a*snoise(p);p=p*2.03+vec3(5.1,1.3,7.7);a*=0.5;}return f;}'
  ].join('\n');

  var VS = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.0,1.0);}';

  var FS_PLANET = [
    'precision highp float;',
    'uniform vec2 uCenter; uniform float uRadius,uGlow,uGlowMax,uZoom;',
    'uniform float uSpin,uTime,uRot,uTilt,uCloud,uAtmK,uSuns,uEmitAll; uniform int uKind;',
    'uniform vec3 uC1,uC2,uC3,uC4,uCloudC,uAtm,uL,uL2,uSeed;',
    NOISE,
    'vec3 surface(vec3 q,float lat,out vec3 emit,out float spec){',
    ' emit=vec3(0.0); spec=0.0; vec3 c=uC1;',
    ' if(uKind==0){',
    '  c=mix(uC1,uC2,smoothstep(-0.35,0.45,fbm(q*1.6)));',
    '  float dunes=0.5+0.5*sin((q.x*0.8+q.z)*34.0+fbm3(q*5.0+2.0)*7.0);',
    '  c*=0.88+0.14*dunes;',
    '  c=mix(c,uC3,smoothstep(0.2,0.6,fbm3(q*3.2+7.0))*0.55);',
    ' } else if(uKind==1){',
    '  float hs=fract(sin(dot(floor(q*46.0),vec3(12.9898,78.233,37.719)))*43758.5453);',
    '  float dist=smoothstep(-0.3,0.4,fbm3(q*1.8+5.0));',
    '  c=mix(uC1,uC2,hs*0.25+smoothstep(-0.4,0.5,fbm3(q*3.0))*0.75);',
    '  c=mix(c*(0.86+0.2*hs),uC3,(1.0-dist)*0.35);',
    '  float dots=smoothstep(0.35,0.8,snoise(q*80.0));',
    '  emit=uC4*(dots*1.25+step(0.62,fract(hs*13.7))*0.35)*(0.25+dist);',
    ' } else if(uKind==2){',
    '  c=mix(uC2,uC1,smoothstep(-0.4,0.4,fbm(q*2.4)));',
    '  c=mix(c,uC3,smoothstep(0.1,0.7,fbm3(q*5.0+3.0))*0.35);',
    '  spec=0.25;',
    ' } else if(uKind==3){',
    '  c=mix(uC1,uC2,smoothstep(-0.3,0.6,fbm(q*2.5)));',
    '  float w=smoothstep(0.1,0.3,fbm3(q*5.0+11.0));',
    '  c=mix(c,uC3,w*0.7); spec=w*0.25;',
    ' } else if(uKind==4){',
    '  c=mix(uC1,uC2,smoothstep(-0.5,0.6,fbm3(q*2.2)));',
    '  float v=pow(1.0-abs(snoise(q*3.5+1.0)),9.0);',
    '  float v2=pow(1.0-abs(snoise(q*9.0+4.0)),14.0)*0.6;',
    '  float lava=clamp(v+v2,0.0,1.0)*smoothstep(-0.35,0.25,fbm3(q*1.4+8.0));',
    '  emit=uC4*lava*2.0; c=mix(c,uC4*0.5,lava*0.4);',
    ' } else if(uKind==5){',
    '  c=mix(uC3,uC2,smoothstep(-0.5,0.3,fbm3(q*2.0)));',
    '  c=mix(c,uC1,smoothstep(0.15,0.6,fbm3(q*3.0+5.0)));',
    '  float v=pow(1.0-abs(snoise(q*3.0)),44.0);',
    '  float v2=pow(1.0-abs(snoise(q*8.0+2.0)),60.0);',
    '  emit=uC4*(v+v2*0.35)*1.15; spec=0.3;',
    ' } else if(uKind==6){',
    '  float h=fbm(q*2.6);',
    '  float land=smoothstep(0.30,0.34,h);',
    '  vec3 ocean=mix(uC3*0.65,uC3*1.35,smoothstep(-0.3,0.32,h));',
    '  vec3 l=mix(uC2,uC1,smoothstep(0.36,0.48,h));',
    '  c=mix(ocean,l,land); spec=1.0-land;',
    ' } else if(uKind==7){',
    '  float h=fbm(q*1.7);',
    '  float land=smoothstep(0.0,0.05,h);',
    '  vec3 ocean=mix(uC3*0.75,uC3*1.2,smoothstep(-0.5,0.0,h));',
    '  vec3 l=mix(uC1,uC2,smoothstep(-0.2,0.6,fbm3(q*5.0+3.0)));',
    '  c=mix(ocean,l,land); c=mix(c,vec3(0.93),smoothstep(0.8,0.9,abs(lat)));',
    '  spec=(1.0-land)*0.8;',
    ' } else if(uKind==8){',
    '  c=mix(uC3,uC2,smoothstep(-0.4,0.5,fbm(q*3.0)));',
    '  c=mix(c,uC1,smoothstep(0.1,0.6,fbm3(q*7.0+2.0))*0.5);',
    '  float rv=pow(1.0-abs(snoise(q*4.0+9.0)),18.0);',
    '  c=mix(c,vec3(0.1,0.24,0.3),rv*0.6); spec=rv*0.4;',
    ' } else if(uKind==10){',
    '  c=mix(uC1,uC2,smoothstep(-0.4,0.5,fbm3(q*2.5)));',
    '  float cr=smoothstep(0.55,0.7,1.0-abs(snoise(q*7.0)));',
    '  c=mix(c,uC3,cr*0.45);',
    ' } else {',
    '  float turb=fbm3(vec3(q.x*1.5,lat*5.0,q.z*1.5));',
    '  c=mix(uC1,uC2,0.5+0.5*sin((lat+turb*0.12)*20.0));',
    '  c=mix(c,uC3,(0.5+0.5*sin((lat+turb*0.2)*7.0+1.0))*0.45);',
    ' }',
    ' return c;',
    '}',
    'void main(){',
    ' vec2 p=(gl_FragCoord.xy-uCenter)/uRadius;',
    ' float r=length(p); vec3 L=normalize(uL); vec4 o=vec4(0.0);',
    ' float aa=1.5/uRadius;',
    ' if(r<1.0){',
    '  vec3 n=vec3(p,sqrt(1.0-r*r));',
    '  float ct=cos(uTilt),st=sin(uTilt);',
    '  vec3 t=vec3(ct*n.x-st*n.y,st*n.x+ct*n.y,n.z);',
    '  float a=uTime*uRot+uSpin,ca=cos(a),sa=sin(a);',
    '  vec3 q=vec3(ca*t.x+sa*t.z,t.y,-sa*t.x+ca*t.z);',
    '  float ndl=dot(n,L);',
    '  if(uSuns>1.5) ndl=max(ndl,dot(n,normalize(uL2))*0.9);',
    '  float day=smoothstep(-0.15,0.3,ndl);',
    '  vec3 emit; float spec;',
    '  vec3 base=surface(q*uZoom+uSeed,t.y,emit,spec);',
    '  float light=0.03+1.1*day*clamp(ndl*0.8+0.25,0.0,1.0);',
    '  vec3 col=base*light;',
    '  if(uCloud>0.0){',
    '   float b=a*1.3,cb=cos(b),sb=sin(b);',
    '   vec3 qc=vec3(cb*t.x+sb*t.z,t.y,-sb*t.x+cb*t.z);',
    '   float cl=smoothstep(0.0,0.6,fbm3(qc*2.3+uSeed+4.0))*uCloud;',
    '   col=mix(col,uCloudC*(0.025+1.05*day*clamp(ndl*0.8+0.25,0.0,1.0)),cl);',
    '   emit*=1.0-cl; spec*=1.0-cl;',
    '  }',
    '  vec3 H=normalize(L+vec3(0.0,0.0,1.0));',
    '  col+=vec3(1.0,0.97,0.9)*spec*pow(max(dot(n,H),0.0),70.0)*0.55*day;',
    '  col+=emit*mix(1.0-day*0.9,1.0,uEmitAll);',
    '  col+=uAtm*pow(1.0-n.z,2.2)*uAtmK*(0.08+0.92*smoothstep(-0.25,0.6,ndl));',
    '  float edge=1.0-smoothstep(1.0-aa,1.0,r);',
    '  o=vec4(col*edge,edge);',
    ' }',
    ' vec2 dir=p/max(r,1e-4);',
    ' float lit=smoothstep(-0.7,0.8,dot(dir,normalize(L.xy+1e-4)));',
    ' float g=exp(-max(r-1.0,0.0)*uGlow)*smoothstep(0.92,1.0,r)*uAtmK*(0.15+0.85*lit)*0.9;',
    ' g*=1.0-smoothstep(1.0+(uGlowMax-1.0)*0.35,1.0+(uGlowMax-1.0)*0.9,r);',
    ' o.rgb+=uAtm*g*(1.0-o.a); o.a+=g*(1.0-o.a);',
    ' gl_FragColor=o;',
    '}'
  ].join('\n');

  var FS_NEBULA = [
    'precision highp float;',
    'uniform vec2 uRes; uniform vec3 uSeed;',
    NOISE,
    'void main(){',
    ' vec2 p=(gl_FragCoord.xy/uRes-0.5)*vec2(uRes.x/uRes.y,1.0)*2.4;',
    ' float n1=fbm(vec3(p*0.75,uSeed.x));',
    ' float n2=fbm(vec3(p*1.4+3.0,uSeed.y));',
    ' float dust=fbm(vec3(p*2.6-2.0,uSeed.z));',
    ' float y=p.y+p.x*0.38-0.15+n1*0.55;',
    ' float band=exp(-y*y*1.6);',
    ' vec3 c=vec3(0.07,0.11,0.30)*smoothstep(-0.3,0.7,n1)',
    '       +vec3(0.30,0.08,0.28)*smoothstep(0.05,0.85,n2)*0.8',
    '       +vec3(0.03,0.24,0.30)*smoothstep(0.1,0.8,n1+n2*0.5)*0.7;',
    ' c*=0.14+band*1.35;',
    ' c*=1.0-smoothstep(0.05,0.55,dust)*0.55*band;',
    ' c+=vec3(0.9,0.85,1.0)*pow(max(fbm(vec3(p*9.0,uSeed.x+3.0)),0.0),5.0)*band*0.6;',
    ' gl_FragColor=vec4(c,1.0);',
    '}'
  ].join('\n');

  var gl = null, glc = null, progP = null, progN = null, buf = null, uP = {}, uN = {};
  var items = [], raf = 0, lastT = 0, t0 = performance.now();
  /* Качество подстраивается под устройство: если кадр рисуется дольше ~14 мс, снижаем разрешение и частоту. */
  var quality = 1, interval = 33, costs = [], still = false;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DPR = Math.min(window.devicePixelRatio || 1, 1.5);

  function shader(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { if (window.console) console.warn(gl.getShaderInfoLog(s)); return null; }
    return s;
  }
  function program(fs) {
    var v = shader(gl.VERTEX_SHADER, VS), f = shader(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return null;
    var p = gl.createProgram();
    gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p);
    return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
  }
  function setup() {
    glc = document.createElement('canvas');
    glc.width = 1024; glc.height = 1024;
    try { gl = glc.getContext('webgl', { alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: true, antialias: false }); } catch (e) { gl = null; }
    if (!gl) return false;
    buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    progP = program(FS_PLANET); progN = program(FS_NEBULA);
    if (!progP || !progN) { gl = null; return false; }
    /* Если браузер рисует WebGL процессором, планеты рисуются один раз и не вращаются. */
    var dbg = gl.getExtension('WEBGL_debug_renderer_info');
    var who = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : '';
    if (/swiftshader|llvmpipe|software|basic render/i.test(who)) { still = true; quality = .7; }
    'uCenter uRadius uGlow uGlowMax uZoom uSpin uTime uRot uTilt uCloud uAtmK uSuns uEmitAll uKind uC1 uC2 uC3 uC4 uCloudC uAtm uL uL2 uSeed'.split(' ').forEach(function (n) { uP[n] = gl.getUniformLocation(progP, n); });
    'uRes uSeed'.split(' ').forEach(function (n) { uN[n] = gl.getUniformLocation(progN, n); });
    return true;
  }
  function use(p) {
    gl.useProgram(p);
    var loc = gl.getAttribLocation(p, 'a');
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  }
  function fit(w, h) {
    var W = Math.max(glc.width, w), H = Math.max(glc.height, h);
    if (W !== glc.width || H !== glc.height) { glc.width = W; glc.height = H; }
  }
  function seedOf(name) {
    var h = 0;
    for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 1000;
    return [h * 0.37 % 17, h * 0.73 % 13, h * 0.11 % 11];
  }
  function vec(s, d) {
    if (!s) return d;
    var v = s.split(',').map(Number);
    return v.length === 3 && v.every(isFinite) ? v : d;
  }

  /* Размер и геометрия: обычная планета — квадрат; data-view="horizon" — край планеты внизу кадра. */
  function measure(it) {
    var r = it.el.getBoundingClientRect();
    var cap = it.horizon ? 1600 : (+it.el.getAttribute('data-max') || 720);
    var scale = Math.min(DPR, cap / Math.max(r.width, 1)) * quality;
    var w = Math.max(2, Math.round(r.width * scale)), h = Math.max(2, Math.round(r.height * scale));
    if (it.el.width !== w || it.el.height !== h) { it.el.width = w; it.el.height = h; }
    it.w = w; it.h = h;
    if (it.horizon) {
      it.radius = w * it.hr;
      it.cx = w * it.hx;
      it.cy = h * it.hy - it.radius; /* верх планеты на высоте hy от низа кадра */
    } else {
      it.radius = Math.min(w, h) / 2 * 0.84;
      it.cx = w / 2; it.cy = h / 2;
    }
    if (gl) fit(w, h);
  }

  function renderGL(it, t) {
    var c = it.cfg;
    gl.viewport(0, 0, it.w, it.h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    use(progP);
    gl.uniform2f(uP.uCenter, it.cx, it.cy);
    gl.uniform1f(uP.uRadius, it.radius);
    gl.uniform1f(uP.uGlow, Math.max(14, it.radius / 30));
    gl.uniform1f(uP.uZoom, it.horizon ? 2.4 : 1);
    gl.uniform1f(uP.uGlowMax, it.horizon ? 4 : Math.min(it.w, it.h) / 2 / it.radius);
    gl.uniform1f(uP.uTime, t);
    gl.uniform1f(uP.uRot, c.rot || .02);
    gl.uniform1f(uP.uTilt, (c.tilt || 0) + it.tiltAdd);
    gl.uniform1f(uP.uSpin, it.spin);
    gl.uniform1f(uP.uCloud, c.cloud || 0);
    gl.uniform1f(uP.uAtmK, c.atmK || .5);
    gl.uniform1f(uP.uSuns, c.suns || 1);
    gl.uniform1f(uP.uEmitAll, c.emitAll || 0);
    gl.uniform1i(uP.uKind, c.kind);
    gl.uniform3fv(uP.uC1, c.c1); gl.uniform3fv(uP.uC2, c.c2 || c.c1); gl.uniform3fv(uP.uC3, c.c3 || c.c1);
    gl.uniform3fv(uP.uC4, c.c4 || [1, 1, 1]); gl.uniform3fv(uP.uCloudC, c.cloudC || [1, 1, 1]);
    gl.uniform3fv(uP.uAtm, c.atm); gl.uniform3fv(uP.uL, it.L); gl.uniform3fv(uP.uL2, it.L2);
    gl.uniform3fv(uP.uSeed, it.seed);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    it.ctx.clearRect(0, 0, it.w, it.h);
    it.ctx.drawImage(glc, 0, glc.height - it.h, it.w, it.h, 0, 0, it.w, it.h);
  }

  /* Запасной вариант без WebGL: шар из градиентов. */
  function render2D(it) {
    var c = it.cfg, x = it.ctx, R = it.radius, cx = it.cx, cy = it.h - it.cy;
    function rgb(v, k) { return 'rgb(' + v.map(function (n) { return Math.round(Math.min(1, n * (k || 1)) * 255); }).join(',') + ')'; }
    x.clearRect(0, 0, it.w, it.h);
    var glow = x.createRadialGradient(cx, cy, R * .95, cx, cy, R * 1.12);
    glow.addColorStop(0, rgb(c.atm, .5)); glow.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = glow; x.beginPath(); x.arc(cx, cy, R * 1.12, 0, 7); x.fill();
    var g = x.createRadialGradient(cx - R * .45, cy - R * .45, R * .1, cx, cy, R);
    g.addColorStop(0, rgb(c.c2 || c.c1, 1.1)); g.addColorStop(.6, rgb(c.c1)); g.addColorStop(1, rgb(c.c3 || c.c1, .35));
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy, R, 0, 7); x.fill();
  }

  function render(it, t) {
    if (!it.w) measure(it);
    if (gl) renderGL(it, t); else render2D(it);
    it.drawn = true;
  }

  function loop(now) {
    if (still) { raf = 0; return; }
    raf = requestAnimationFrame(loop);
    if (now - lastT < interval) return; /* ~30 кадров в секунду достаточно для медленного вращения */
    lastT = now;
    var t = (now - t0) / 1000, s = performance.now(), n = 0;
    for (var i = 0; i < items.length; i++) if (items[i].visible) { render(items[i], t); n++; }
    if (!n || !gl) return;
    costs.push(performance.now() - s);
    if (costs.length < 15) return;
    var avg = costs.reduce(function (a, b) { return a + b; }, 0) / costs.length;
    costs = [];
    if (avg > 14 && quality > .4) {
      quality = Math.max(.4, quality * .8);
      interval = Math.min(90, interval + 10);
      items.forEach(measure);
    } else if (avg > 28) {
      still = true; /* даже на минимальном качестве медленно: оставляем планеты неподвижными */
    }
  }

  function attach(el) {
    var name = el.getAttribute('data-planet'), cfg = TYPES[name];
    if (!cfg || el._planet) return;
    var it = {
      el: el, cfg: cfg, ctx: el.getContext('2d'), seed: seedOf(name), visible: false,
      horizon: el.getAttribute('data-view') === 'horizon',
      hr: +el.getAttribute('data-r') || 1.1, hx: +el.getAttribute('data-cx') || .5, hy: +el.getAttribute('data-top') || .6,
      L: vec(el.getAttribute('data-light'), [-.55, .45, .7]),
      spin: 0, tiltAdd: 0, vel: 0
    };
    var l = it.L, m = Math.sqrt(l[0] * l[0] + l[1] * l[1] + l[2] * l[2]) || 1;
    it.L = [l[0] / m, l[1] / m, l[2] / m];
    it.L2 = vec(el.getAttribute('data-light2'), [it.L[0] - .25, it.L[1] - .2, it.L[2] + .1]);
    el._planet = it;
    items.push(it);
    measure(it);
    if (el.hasAttribute('data-drag')) draggable(it);
    if (reduce) render(it, 3);
  }

  /* Планету можно покрутить мышью или пальцем; после броска она плавно останавливается. */
  function draggable(it) {
    var el = it.el, down = false, lx = 0, ly = 0, lt = 0;
    el.style.touchAction = 'pan-y';
    el.style.cursor = 'grab';
    el.addEventListener('pointerdown', function (e) {
      down = true; lx = e.clientX; ly = e.clientY; lt = performance.now(); it.vel = 0;
      el.setPointerCapture(e.pointerId); el.style.cursor = 'grabbing';
    });
    el.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - lx, dy = e.clientY - ly, now = performance.now();
      it.spin += dx * .012;
      it.tiltAdd = Math.max(-.6, Math.min(.6, it.tiltAdd + dy * .004));
      it.vel = dx * .012 / Math.max(8, now - lt) * 16;
      lx = e.clientX; ly = e.clientY; lt = now;
      if (still || reduce) render(it, (now - t0) / 1000);
    });
    function up() { down = false; el.style.cursor = 'grab'; coast(); }
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    function coast() {
      if (down || Math.abs(it.vel) < .0005) return;
      it.spin += it.vel; it.vel *= .94;
      if (still || reduce) render(it, (performance.now() - t0) / 1000);
      requestAnimationFrame(coast);
    }
  }

  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var it = e.target._planet; if (!it) return;
      it.visible = e.isIntersecting;
      if (it.visible && (reduce || still || !it.drawn)) render(it, reduce ? 3 : (performance.now() - t0) / 1000);
    });
  }, { rootMargin: '120px 0px' }) : null;

  var resizeT = 0;
  function onResize() {
    clearTimeout(resizeT);
    resizeT = setTimeout(function () {
      items.forEach(function (it) { measure(it); if (it.visible || reduce || still) render(it, (performance.now() - t0) / 1000); });
    }, 150);
  }

  window.Planets = {
    types: TYPES,
    init: function (root) {
      if (!glc) setup();
      Array.prototype.forEach.call((root || document).querySelectorAll('canvas[data-planet]'), function (el) {
        attach(el);
        if (io) io.observe(el); else { el._planet.visible = true; }
      });
      if (!raf && !reduce && !still) {
        raf = requestAnimationFrame(loop);
        document.addEventListener('visibilitychange', function () {
          cancelAnimationFrame(raf); raf = 0;
          if (!document.hidden && !still) raf = requestAnimationFrame(loop);
        });
      }
      window.addEventListener('resize', onResize);
      return !!gl;
    },
    /* Туманность рисуется один раз (и заново при смене размера окна) в обычный <canvas>. */
    nebula: function (canvas) {
      if (!glc) setup();
      var ctx = canvas.getContext('2d');
      function draw() {
        var w = Math.min(1280, Math.round(innerWidth / 2)), h = Math.min(800, Math.round(innerHeight / 2));
        canvas.width = w; canvas.height = h;
        if (!gl) {
          var g = ctx.createRadialGradient(w * .7, h * .3, 0, w * .7, h * .3, w * .8);
          g.addColorStop(0, '#1b1f4a'); g.addColorStop(.5, '#0d0f26'); g.addColorStop(1, '#03040a');
          ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
          return;
        }
        fit(w, h);
        gl.viewport(0, 0, w, h);
        use(progN);
        gl.uniform2f(uN.uRes, w, h);
        gl.uniform3f(uN.uSeed, 3.1, 7.7, 1.9);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        ctx.drawImage(glc, 0, glc.height - h, w, h, 0, 0, w, h);
      }
      draw();
      var t = 0, lw = innerWidth;
      window.addEventListener('resize', function () {
        clearTimeout(t);
        t = setTimeout(function () { if (Math.abs(innerWidth - lw) > 80) { lw = innerWidth; draw(); } }, 250);
      });
    }
  };
})();
