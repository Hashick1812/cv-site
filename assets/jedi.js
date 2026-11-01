/* Голограмма джедая на главном экране: объёмная фигура в плаще (WebGL, рэймарчинг),
   жесты под реплики, кивки, помехи как у голограмм из фильмов. Рассказывает, как устроен сайт. */
(function () {
  'use strict';
  var root = document.querySelector('.jedi');
  if (!root) return;
  var d = document.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canvas = root.querySelector('.jedi-canvas');
  var lineEl = root.querySelector('.jedi-line'), nameEl = root.querySelector('.jedi-name');
  var nextBtn = root.querySelector('.jedi-next'), voiceBtn = root.querySelector('.jedi-voice');

  /* ---------- Реплики на трёх языках ---------- */
  var T = {
    ru: {
      name: 'Мастер Нур · голограмма', next: 'Дальше ›', again: 'Ещё раз ↻', voice: 'Голос',
      lines: [
        ['greet', 'Приветствую, путник. Я Мастер Нур, хранитель этого голоархива.'],
        ['open', 'Здесь хранится резюме Ислама Куттыбаева. Он Data Scientist из Алматы и работает в ТОО «Adam Labs».'],
        ['point', 'Каждая планета внизу хранит часть его пути. Наведи на неё, и я расскажу, что там.'],
        ['explain', 'Нажми на планету, и мы прыгнем через гиперпространство. Её поверхность станет фоном, а рядом будет досье.'],
        ['explain', 'В конце пути ждёт бортовой терминал. Говорят, там спрятан приказ 66.'],
        ['bow', 'Да пребудет с тобой Сила.']
      ],
      planets: {
        tatooine: 'Татуин. Отсюда всё начинается: кто такой Ислам и чем он живёт.',
        coruscant: 'Корусант, город, который никогда не спит. Здесь Ислам работает Data Scientist в Adam Labs.',
        hoth: 'Хот. Здесь он вёл исследование в университете SDU: холодные данные, горячие выводы.',
        dagobah: 'Дагоба. Как и мастер Йода, Ислам учит других: математика, статистика, Python.',
        mustafar: 'Мустафар. В огне этой планеты куются его проекты, и весь код открыт на GitHub.',
        ilum: 'Илум, планета кристаллов. Здесь собраны его навыки и инструменты.',
        scarif: 'Скариф хранит архивы. У нас здесь сертификаты и курсы.',
        naboo: 'Набу. Учёба в SDU и языки, на которых он говорит.',
        yavin4: 'Явин IV, база повстанцев. Отсюда можно отправить ему сообщение.'
      },
      o66: 'Приказ 66?! Связь… теряю… сигнал…', back: 'Я вернулся. Джедая так просто не отключишь.'
    },
    en: {
      name: 'Master Nur · hologram', next: 'Next ›', again: 'Again ↻', voice: 'Voice',
      lines: [
        ['greet', 'Greetings, traveller. I am Master Nur, keeper of this holo-archive.'],
        ['open', 'This archive holds the CV of Islam Kuttybaev, a Data Scientist from Almaty working at Adam Labs LLP.'],
        ['point', 'Each planet below holds a part of his journey. Hover over one and I will tell you what is there.'],
        ['explain', 'Click a planet and we will jump through hyperspace. Its surface becomes the background, with a dossier beside it.'],
        ['explain', 'At the end of the route waits the ship terminal. Rumour has it Order 66 is hidden there.'],
        ['bow', 'May the Force be with you.']
      ],
      planets: {
        tatooine: 'Tatooine. Everything starts here: who Islam is and what drives him.',
        coruscant: 'Coruscant, the city that never sleeps. This is where Islam works as a Data Scientist at Adam Labs.',
        hoth: 'Hoth. Here he did research at SDU University: cold data, hot findings.',
        dagobah: 'Dagobah. Like Master Yoda, Islam teaches others: maths, statistics and Python.',
        mustafar: 'Mustafar. His projects are forged in its fire, and all the code is open on GitHub.',
        ilum: 'Ilum, the crystal planet. His skills and tools are gathered here.',
        scarif: 'Scarif keeps the archives. Here: certificates and courses.',
        naboo: 'Naboo. His studies at SDU and the languages he speaks.',
        yavin4: 'Yavin 4, the rebel base. Send him a message from here.'
      },
      o66: 'Order 66?! Signal… losing… connection…', back: 'I am back. You cannot switch off a Jedi that easily.'
    },
    kk: {
      name: 'Нұр шебер · голограмма', next: 'Әрі қарай ›', again: 'Қайтадан ↻', voice: 'Дауыс',
      lines: [
        ['greet', 'Сәлем, саяхатшы. Мен Нұр шебермін, осы голомұрағаттың сақшысымын.'],
        ['open', 'Мұнда Ислам Куттыбаевтың түйіндемесі сақталған. Ол Алматыдан шыққан Data Scientist, «Adam Labs» ЖШС-да жұмыс істейді.'],
        ['point', 'Төмендегі әр планетада оның жолының бір бөлігі бар. Планетаға меңзерді апарсаң, онда не бар екенін айтамын.'],
        ['explain', 'Планетаны бас, сонда гиперкеңістік арқылы секіреміз. Оның беті фонға айналады, қасында досье болады.'],
        ['explain', 'Жолдың соңында борт терминалы күтіп тұр. Онда 66-бұйрық жасырылған дейді.'],
        ['bow', 'Күш сенімен бірге болсын.']
      ],
      planets: {
        tatooine: 'Татуин. Бәрі осыдан басталады: Ислам кім және немен айналысады.',
        coruscant: 'Корусант, ешқашан ұйықтамайтын қала. Мұнда Ислам Adam Labs-та Data Scientist болып жұмыс істейді.',
        hoth: 'Хот. Мұнда ол SDU университетінде зерттеу жүргізді: суық деректер, ыстық қорытындылар.',
        dagobah: 'Дагоба. Йода шебер сияқты, Ислам да басқаларды оқытады: математика, статистика, Python.',
        mustafar: 'Мустафар. Оның жобалары осы планетаның отында соғылады, бүкіл код GitHub-та ашық.',
        ilum: 'Илум, кристалдар планетасы. Мұнда оның дағдылары мен құралдары жиналған.',
        scarif: 'Скариф мұрағаттарды сақтайды. Мұнда сертификаттар мен курстар.',
        naboo: 'Набу. SDU-дағы оқуы және ол сөйлейтін тілдер.',
        yavin4: 'Явин IV, көтерілісшілер базасы. Осы жерден оған хабар жіберуге болады.'
      },
      o66: '66-бұйрық?! Байланыс… үзіліп… барады…', back: 'Мен оралдым. Джедайды оңайлықпен өшіре алмайсың.'
    }
  };
  function lang() { return (window.Site && Site.lang()) || d.lang || 'ru'; }
  function L() { return T[lang()] || T.ru; }

  /* ---------- Позы: суставы рук в координатах фигуры (рост ~1.9, x вправо от зрителя, z к зрителю) ---------- */
  var REST = { a: { e: [-0.27, 1.17, 0.07], w: [-0.09, 1.04, 0.2] }, b: { e: [0.27, 1.17, 0.07], w: [0.09, 1.04, 0.2] } };
  var POSES = {
    rest: REST,
    greet: { a: REST.a, b: { e: [0.42, 1.3, 0.06], w: [0.44, 1.56, 0.12] } },
    open: { a: { e: [-0.33, 1.17, 0.13], w: [-0.44, 1.23, 0.36] }, b: { e: [0.33, 1.17, 0.13], w: [0.44, 1.23, 0.36] } },
    point: { a: { e: [-0.38, 1.28, 0.12], w: [-0.6, 1.18, 0.3] }, b: REST.b },
    explain: { a: REST.a, b: { e: [0.33, 1.18, 0.12], w: [0.4, 1.32, 0.33] } },
    bow: REST
  };
  var cur = JSON.parse(JSON.stringify(REST)), target = 'rest';

  /* ---------- Диалог ---------- */
  var idx = -1, typed = 0, text = '', typing = false, holdUntil = 0, mode = 'intro', hoverId = null, speak = 0, bowT = 0;
  var voiceOn = false, finished = false, silenced = false;
  function say(str, pose) {
    text = str; typed = 0; typing = true; target = pose || 'explain';
    if (pose === 'bow') bowT = performance.now();
    lineEl.textContent = '';
    if (voiceOn) voice(str);
  }
  function next() {
    var lines = L().lines;
    idx++;
    if (idx >= lines.length) { idx = lines.length - 1; finished = true; nextBtn.textContent = L().again; return; }
    finished = idx === lines.length - 1;
    nextBtn.textContent = finished ? L().again : L().next;
    say(lines[idx][1], lines[idx][0]);
  }
  function restart() { idx = -1; finished = false; next(); }
  nextBtn.addEventListener('click', function () {
    mode = 'intro'; hoverId = null;
    if (finished && !typing) return restart();
    if (typing) { typed = text.length; return; }
    next();
  });
  function tick(now, dt) {
    if (typing) {
      typed = Math.min(text.length, typed + dt * 34);
      lineEl.textContent = text.slice(0, Math.floor(typed));
      if (typed >= text.length) { typing = false; holdUntil = now + 2600 + text.length * 38; }
    } else if (mode === 'intro' && !finished && idx >= 0 && now > holdUntil && !silenced) next();
    else if (mode === 'planet' && !hoverId && now > holdUntil) { mode = 'intro'; target = 'rest'; }
    speak += ((typing ? 1 : 0) - speak) * Math.min(1, dt * 6);
  }
  /* Наведение на планету: джедай поворачивается и рассказывает о ней. */
  function planet(id) {
    if (silenced) return;
    var s = L().planets[id];
    if (!s) return;
    hoverId = id; mode = 'planet';
    say(s, 'point');
  }
  function planetOut(id) { if (hoverId === id) { hoverId = null; holdUntil = performance.now() + 2200; } }
  document.querySelectorAll('.dest').forEach(function (b) {
    var id = b.getAttribute('data-target');
    b.addEventListener('mouseenter', function () { planet(id); });
    b.addEventListener('focus', function () { planet(id); });
    b.addEventListener('mouseleave', function () { planetOut(id); });
    b.addEventListener('blur', function () { planetOut(id); });
  });
  document.addEventListener('langchange', function () {
    nameEl.textContent = L().name; voiceBtn.querySelector('span').textContent = L().voice;
    if (mode === 'planet' && hoverId) say(L().planets[hoverId], 'point');
    else if (idx >= 0) { nextBtn.textContent = finished ? L().again : L().next; say(L().lines[idx][1], L().lines[idx][0]); }
  });

  /* Голос: синтез речи браузера, включается только кнопкой. */
  var synth = window.speechSynthesis;
  if (!synth) voiceBtn.hidden = true;
  function voice(str) {
    if (!synth) return;
    synth.cancel();
    var u = new SpeechSynthesisUtterance(str), lg = { ru: 'ru-RU', en: 'en-GB', kk: 'kk-KZ' }[lang()];
    u.lang = lg; u.rate = .92; u.pitch = .72;
    var v = synth.getVoices().filter(function (x) { return x.lang && x.lang.replace('_', '-').indexOf(lg.slice(0, 2)) === 0; });
    if (v.length) u.voice = v[0];
    synth.speak(u);
  }
  voiceBtn.addEventListener('click', function () {
    voiceOn = !voiceOn;
    voiceBtn.setAttribute('aria-pressed', String(voiceOn));
    if (voiceOn) voice(text); else if (synth) synth.cancel();
  });

  /* Приказ 66: голограмма краснеет, сбоит и гаснет, потом возвращается. */
  var o66 = 0;
  new MutationObserver(function () {
    var sith = d.classList.contains('sith');
    if (sith && !silenced) { silenced = true; o66 = performance.now(); say(L().o66, 'open'); }
    else if (!sith && silenced) { silenced = false; o66 = 0; mode = 'intro'; say(L().back, 'greet'); holdUntil = performance.now() + 6000; }
  }).observe(d, { attributes: true, attributeFilter: ['class'] });

  nameEl.textContent = L().name;
  voiceBtn.querySelector('span').textContent = L().voice;
  nextBtn.textContent = L().next;

  /* ---------- WebGL ---------- */
  var gl = canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: true }) ||
           canvas.getContext('experimental-webgl', { antialias: false, alpha: true });
  if (!gl) { root.classList.add('jedi-nogl'); startDialog(); return; }

  var VS = 'attribute vec2 p;varying vec2 vUv;void main(){vUv=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  var FS = [
    'precision highp float;',
    'varying vec2 vUv;',
    'uniform vec2 uRes; uniform float uTime,uYaw,uHY,uHP,uBreath,uGlitch,uFade;',
    'uniform vec3 uEA,uWA,uEB,uWB,uCol;',
    'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
    'float smin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}',
    'mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}',
    'float sdCap(vec3 p,vec3 a,vec3 b,float r){vec3 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);return length(pa-ba*h)-r;}',
    'float sdEll(vec3 p,vec3 r){float k0=length(p/r);float k1=length(p/(r*r));return k0*(k0-1.)/k1;}',
    'float sdRC(vec3 p,vec3 a,vec3 b,float r1,float r2){',
    ' vec3 ba=b-a;float l2=dot(ba,ba);float rr=r1-r2;float a2=l2-rr*rr;float il2=1./l2;',
    ' vec3 pa=p-a;float y=dot(pa,ba);float z=y-l2;vec3 xv=pa*l2-ba*y;float x2=dot(xv,xv);float y2=y*y*l2;float z2=z*z*l2;',
    ' float k=sign(rr)*rr*rr*x2;',
    ' if(sign(z)*a2*z2>k)return sqrt(x2+z2)*il2-r2;',
    ' if(sign(y)*a2*y2<k)return sqrt(x2+y2)*il2-r1;',
    ' return (sqrt(x2*a2*il2)+y*rr)*il2-r1;}',
    /* рука с широким рукавом и кистью */
    'vec2 arm(vec3 q,vec3 s,vec3 e,vec3 w){',
    ' float up=sdRC(q,s,e,.072,.066);',
    ' vec3 dir=normalize(w-e);',
    ' float sl=sdRC(q,e,w,.068,.105);',
    ' sl=max(sl,-sdCap(q,w+dir*.01,w+dir*.2,.075));', /* полый край рукава */
    ' float hand=sdEll(q-(w+dir*.035),vec3(.036,.046,.034));',
    ' float c=smin(up,sl,.03);',
    ' return c<hand?vec2(c,0.):vec2(hand,1.);}',
    'vec2 map(vec3 p){',
    ' vec3 q=p; q.xz=rot(uYaw)*q.xz;',
    ' float sway=.012*sin(uTime*.9); q.x-=sway*q.y*.5;',
    /* подол и туника */
    ' vec3 rp=q; rp.z*=1.22;',
    ' float ang=atan(rp.z,rp.x);',
    ' float fold=.016*sin(ang*11.+q.y*2.2+sin(ang*3.)*1.5)*smoothstep(1.05,.05,q.y);',
    ' float robe=sdRC(rp,vec3(0.,.07,0.),vec3(0.,1.02,0.),.285,.165)+fold;',
    ' vec3 tp=q; tp.z*=1.38;',
    ' float torso=sdRC(tp,vec3(0.,.98,0.),vec3(0.,1.36,0.),.16,.195*uBreath);',
    ' float d=smin(robe,torso,.07);',
    ' d=smin(d,sdCap(q,vec3(-.19,1.415,-.01),vec3(.19,1.415,-.01),.088),.05);',
    /* плащ: оболочка со спины и плеч, спереди разрез */
    ' vec3 cp=q; cp.z=(cp.z+.03)*1.32;',
    ' float cfold=.016*sin(atan(cp.z,cp.x)*8.+q.y*1.5)*smoothstep(1.4,.2,q.y);',
    ' float cl=sdRC(cp,vec3(0.,.04,0.),vec3(0.,1.43,0.),.36,.235)+cfold;',
    ' cl=abs(cl)-.014;',
    ' float wOpen=.07+.2*clamp((1.42-q.y)/1.3,0.,1.);',
    ' cl=max(cl,-max(abs(q.x)-wOpen,-q.z+.02));',
    ' cl=max(cl,-q.y+.015);',
    ' d=min(d,cl);',
    /* пояс и рукоять меча */
    ' vec3 bp=q; bp.z*=1.36; float belt=max(abs(q.y-.99)-.032,length(bp.xz)-.178);',
    ' d=smin(d,belt,.01);',
    ' float hilt=sdCap(q,vec3(.15,.975,.1),vec3(.185,.8,.12),.021);',
    ' vec2 res=vec2(d,0.);',
    ' if(hilt<res.x)res=vec2(hilt,2.);',
    ' if(belt<res.x+.002&&belt<.01)res.y=2.;',
    /* голова под капюшоном, с бородой; поворот вокруг шеи */
    ' vec3 hp=q-vec3(0.,1.52,0.); hp.xz=rot(uHY)*hp.xz; hp.yz=rot(uHP)*hp.yz; hp+=vec3(0.,1.52,0.);',
    ' float neck=sdCap(q,vec3(0.,1.44,0.),vec3(0.,1.6,.01),.046);',
    ' float head=sdEll(hp-vec3(0.,1.665,.018),vec3(.077,.098,.088));',
    ' head=smin(head,sdEll(hp-vec3(0.,1.585,.05),vec3(.062,.07,.05)),.03);',
    ' head=smin(head,sdEll(hp-vec3(0.,1.655,.1),vec3(.014,.024,.02)),.01);',
    ' float skin=min(head,neck);',
    ' if(skin<res.x)res=vec2(skin,1.);',
    ' float hO=sdEll(hp-vec3(0.,1.68,-.022),vec3(.136,.15,.15));',
    ' float hI=sdEll(hp-vec3(0.,1.655,.05),vec3(.1,.124,.13));',
    ' float hood=max(hO,-hI);',
    ' float drape=sdRC(q*vec3(1.,1.,1.28),vec3(0.,1.62,-.05),vec3(0.,1.43,-.02),.112,.215);',
    ' drape=max(drape,-sdEll(hp-vec3(0.,1.6,.09),vec3(.088,.16,.13)));',
    ' hood=smin(hood,drape,.035);',
    ' if(hood<res.x)res=vec2(hood,0.);',
    /* руки */
    ' vec2 aa=arm(q,vec3(-.215,1.41,0.),uEA,uWA); if(aa.x<res.x)res=aa;',
    ' vec2 ab=arm(q,vec3(.215,1.41,0.),uEB,uWB); if(ab.x<res.x)res=ab;',
    ' return res;}',
    'vec3 nrm(vec3 p){vec2 e=vec2(.0015,-.0015);',
    ' return normalize(e.xyy*map(p+e.xyy).x+e.yyx*map(p+e.yyx).x+e.yxy*map(p+e.yxy).x+e.xxx*map(p+e.xxx).x);}',
    'void main(){',
    ' vec2 fc=gl_FragCoord.xy;',
    /* помехи: строки сдвигаются вбок */
    ' float row=floor(fc.y/(uRes.y*.018));',
    ' float g=hash(vec2(row,floor(uTime*14.)));',
    ' float gq=step(1.-uGlitch*.22,g);',
    ' fc.x+=gq*(hash(vec2(row,floor(uTime*31.)))-.5)*uRes.x*.12;',
    ' vec2 uv=(fc-.5*uRes)/uRes.y;',
    ' vec3 ro=vec3(0.,.94,3.7);',
    ' vec3 rd=normalize(vec3(uv.x,uv.y,-1.62));',
    ' float t=0.,mind=1.,tmax=0.; vec2 h=vec2(1.,0.); bool hit=false;',
    /* ограничивающий цилиндр r=.8, y от -.02 до 1.95 */
    ' vec2 oc=ro.xz; vec2 dd=rd.xz; float A=dot(dd,dd),B=dot(oc,dd),C=dot(oc,oc)-.64; float disc=B*B-A*C;',
    ' if(disc>0.){',
    '  float sq=sqrt(disc); t=max((-B-sq)/A,0.); tmax=(-B+sq)/A;',
    '  for(int i=0;i<90;i++){',
    '   vec3 p=ro+rd*t;',
    '   h=map(p); mind=min(mind,h.x);',
    '   if(h.x<.0012){hit=p.y>-.02&&p.y<1.96;break;}',
    '   t+=h.x*.82; if(t>tmax)break;',
    '  }',
    ' }',
    ' vec3 col=vec3(0.);',
    ' if(hit){',
    '  vec3 p=ro+rd*t; vec3 n=nrm(p);',
    '  float fres=pow(1.-clamp(dot(n,-rd),0.,1.),2.2);',
    '  float dif=clamp(dot(n,normalize(vec3(.45,.85,.65))),0.,1.);',
    '  float ao=clamp(.45+map(p+n*.06).x*9.,0.,1.);',
    '  float m=h.y; float base=m>1.5?1.25:(m>.5?.62:.86);',
    /* лицо в тени капюшона */
    '  if(m>.5&&m<1.5&&p.y>1.5)base*=.55+.45*smoothstep(.06,.13,p.z);',
    '  float lines=.85+.15*sin(p.y*260.);',
    '  float i=((.16+.78*dif*ao)*base+1.15*fres)*lines;',
    '  col=uCol*i*1.15+vec3(.85,.95,1.)*pow(max(i-.55,0.),2.)*.55;',
    ' } else col=uCol*exp(-mind*42.)*.28;',
    ' float band=1.+.55*smoothstep(.045,0.,abs(fract(vUv.y*.7-uTime*.13)-.5));',
    ' float fl=.9+.1*sin(uTime*41.)*sin(uTime*17.3)-gq*.25;',
    ' float spk=hash(fc+fract(uTime)*91.);',
    ' col*=band*fl; col+=uCol*step(.993,spk)*.45*uFade*exp(-mind*14.);',
    ' col=clamp(col*uFade,0.,1.);',
    ' gl_FragColor=vec4(col,max(col.r,max(col.g,col.b)));',
    '}'
  ].join('\n');

  function sh(type, src) {
    var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
    return s;
  }
  var vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) { root.classList.add('jedi-nogl'); startDialog(); return; }
  var prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  gl.useProgram(prog);
  var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  var U = {};
  ['uRes', 'uTime', 'uYaw', 'uHY', 'uHP', 'uBreath', 'uGlitch', 'uFade', 'uEA', 'uWA', 'uEB', 'uWB', 'uCol'].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });

  /* Программная отрисовка (без видеокарты) медленная: тогда меньше разрешение и кадров. */
  var soft = false;
  try {
    var ext = gl.getExtension('WEBGL_debug_renderer_info');
    var rn = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : '';
    soft = /swiftshader|llvmpipe|software|basic render/i.test(rn);
  } catch (e) {}
  var scale = soft ? .45 : .9, interval = soft ? 90 : 33, times = [];
  function fit() {
    var r = canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var w = Math.max(2, Math.round(r.width * dpr * scale)), h = Math.max(2, Math.round(r.height * dpr * scale));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, w, h);
  }

  /* Мышь: голограмма слегка поворачивается к курсору. */
  var mx = 0, yaw = 0;
  addEventListener('pointermove', function (e) { mx = (e.clientX / innerWidth - .5) * 2; }, { passive: true });

  var colNow = [.44, .84, 1], visible = true, raf = 0, last = 0, t0 = performance.now(), lastFrame = 0;
  function lerp(a, b, k) { return a + (b - a) * k; }
  function frame(now) {
    raf = visible ? requestAnimationFrame(frame) : 0;
    if (now - last < interval) return;
    var dt = Math.min(.1, (now - (last || now)) / 1000);
    if (last) { times.push(now - last); if (times.length > 24) times.shift(); }
    last = now;
    tick(now, dt);
    render(now, dt);
    adapt();
  }
  function adapt() {
    if (times.length < 24) return;
    var avg = times.reduce(function (a, b) { return a + b; }, 0) / times.length;
    if (avg > interval * 1.6 && scale > .4) { scale = Math.max(.4, scale - .15); fit(); times = []; }
    else if (avg > interval * 1.6 && interval < 90) { interval += 20; times = []; }
  }
  function render(now, dt) {
    var t = (now - t0) / 1000, k = Math.min(1, dt * 5.5);
    var P = POSES[target] || REST;
    ['a', 'b'].forEach(function (s) {
      ['e', 'w'].forEach(function (j) { for (var i = 0; i < 3; i++) cur[s][j][i] = lerp(cur[s][j][i], P[s][j][i], k); });
    });
    /* живость: дыхание, жестикуляция при речи, лёгкое покачивание */
    var g = speak * (target === 'point' ? .012 : .03);
    var wa = cur.a.w.slice(), wb = cur.b.w.slice();
    if (target === 'explain' || target === 'open') { wb[1] += Math.sin(t * 5.2) * g; wb[0] += Math.sin(t * 3.1) * g * .6; }
    if (target === 'open') { wa[1] += Math.sin(t * 4.6 + 1) * g; }
    if (target === 'greet') { wb[0] += Math.sin(t * 7) * .035; }
    if (target === 'point') { wa[1] += Math.sin(t * 2.2) * g; }
    var yawT = mx * .35 + Math.sin(t * .3) * .22 + (target === 'point' ? -.28 : 0);
    if (reduce) yawT = 0;
    yaw = lerp(yaw, yawT, Math.min(1, dt * 2));
    var bow = 0;
    if (target === 'bow' && bowT) { var bt = (now - bowT) / 1000; bow = bt < 3 ? Math.sin(Math.min(1, bt / 1.5) * Math.PI) * .32 : 0; }
    var hp = .05 + Math.sin(t * 6.3) * .045 * speak + Math.sin(t * .7) * .02 + bow;
    var hy = Math.sin(t * .55) * .14 + (target === 'point' ? -.25 : 0) - yaw * .3;
    /* цвет: голубой; при приказе 66 — красный и сильные помехи */
    var sith = d.classList.contains('sith');
    var want = sith ? [1, .26, .22] : [.44, .84, 1];
    for (var i = 0; i < 3; i++) colNow[i] = lerp(colNow[i], want[i], Math.min(1, dt * 3));
    var glitch = .18 + (Math.sin(t * .37) > .96 ? .8 : 0), fade = 1;
    if (o66) {
      var ot = (now - o66) / 1000;
      glitch = 1.6; fade = ot < 1.4 ? 1 - ot / 1.4 * .3 : Math.max(0, 1 - (ot - 1.4) * 1.2) * (Math.random() < .15 ? .3 : .7);
    }
    gl.uniform2f(U.uRes, canvas.width, canvas.height);
    gl.uniform1f(U.uTime, t);
    gl.uniform1f(U.uYaw, yaw);
    gl.uniform1f(U.uHY, hy);
    gl.uniform1f(U.uHP, hp);
    gl.uniform1f(U.uBreath, 1 + Math.sin(t * 1.6) * .018);
    gl.uniform1f(U.uGlitch, reduce ? 0 : glitch);
    gl.uniform1f(U.uFade, fade);
    gl.uniform3fv(U.uEA, cur.a.e); gl.uniform3fv(U.uWA, wa);
    gl.uniform3fv(U.uEB, cur.b.e); gl.uniform3fv(U.uWB, wb);
    gl.uniform3fv(U.uCol, colNow);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    lastFrame = now;
  }

  fit();
  addEventListener('resize', function () { fit(); if (!raf) render(performance.now(), 0); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting && !document.hidden;
      if (visible && !raf) { last = 0; raf = requestAnimationFrame(frame); }
    }).observe(canvas);
  } else raf = requestAnimationFrame(frame);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { visible = false; }
    else if (!raf) { visible = true; last = 0; raf = requestAnimationFrame(frame); }
  });
  if (reduce) { render(performance.now(), 1); }
  startDialog();

  /* Диалог начинается после заставки, когда главный экран виден. */
  function startDialog() {
    var go = function () { setTimeout(function () { if (idx < 0) next(); }, 900); };
    if (window.Site && Site.whenIntroDone) Site.whenIntroDone(go); else go();
    if (!gl || reduce) {
      var simple = function (now) { var dt = .05; tick(now, dt); requestAnimationFrame(simple); };
      if (!gl) requestAnimationFrame(simple);
    }
  }
  window.Jedi = { planet: planet, say: function (s, p) { mode = 'planet'; hoverId = null; holdUntil = performance.now() + 5000; say(s, p); } };
})();
