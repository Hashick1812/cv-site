/* Бортовой терминал: команды, навигация по планетам и пасхалки. Тексты на трёх языках. */
(function () {
  'use strict';
  var term = document.querySelector('.term');
  if (!term) return;
  var out = term.querySelector('.term-out'), form = term.querySelector('.term-in'), input = term.querySelector('.term-input');
  var d = document.documentElement;
  var S = window.Site || {};

  var T = {
    ru: {
      hello: 'ISLAM-OS v26.11 · бортовой компьютер «Сокол». Все системы в норме.',
      hello2: 'Наберите <b>help</b>, чтобы увидеть команды.',
      help: [
        ['help', 'список команд'], ['about', 'кто я'], ['work', 'где работаю сейчас'], ['skills', 'навыки'],
        ['projects', 'проекты'], ['contact', 'как связаться'], ['goto &lt;планета&gt;', 'прыжок к планете, например <b>goto хот</b>'],
        ['ls', 'список планет'], ['lang ru|kk|en', 'сменить язык'], ['intro', 'показать заставку'],
        ['clear', 'очистить экран'], ['secrets', 'намёк на секреты']
      ],
      unknown: 'Команда «{c}» не найдена. Это не та команда, которую вы ищете. Наберите <b>help</b>.',
      noPlanet: 'Планета «{p}» не найдена в навикомпьютере. Наберите <b>ls</b>.',
      gotoUsage: 'Куда летим? Например: <b>goto корусант</b>',
      jumping: 'Курс на {p}. Прыжок через 3… 2… 1…',
      lang: 'Язык переключён.',
      langUsage: 'Доступно: <b>lang ru</b>, <b>lang kk</b>, <b>lang en</b>',
      secrets: 'Секретных команд больше десяти. Начните с <b>hello there</b>. Говорят, где-то спрятан приказ 66.',
      o66: ['Коммандер Коди: «Будет исполнено, мой лорд».', 'Выполняю приказ 66… Ищу джедаев в резюме…', 'Найдено джедаев: 0. Найден Data Scientist: 1. Оставляем.'],
      o66end: 'Тревога снята. Империя передумала.',
      o67: 'Приказ 67 принят. Всем клонам: шесть… семь! 🙌',
      kenobi: 'Генерал Кеноби!',
      father: 'Нееееееет!',
      force: 'Вы чувствуете Силу… Планеты слегка всплывают.',
      trap: 'ЭТО ЛОВУШКА!',
      kessel: 'Рейс на Кессель меньше чем за 12 парсеков. Да, мы знаем, что парсек — это расстояние.',
      mtfbwy: 'И с вами. Всегда.',
      dodont: 'Делай. Или не делай. Не надо пытаться. А резюме уже сделано.',
      r2: 'Бип-буп-ви-у! 🔊',
      chewie: 'Ррррааааррргх! (Чубакка одобряет это резюме)',
      yoda: 'Хорошее резюме это. Написать ему вы должны. Хм-м.',
      dark: 'Добро пожаловать на тёмную сторону. У нас есть печенье. Вернуться: <b>lightside</b>.',
      light: 'С возвращением на светлую сторону.',
      saber: 'Вжжжууум!',
      hire: 'Отличное решение. Открываю канал связи…',
      sudoHire: 'Пароль не нужен: Ислам уже согласен. Открываю канал связи…',
      rm: 'Звезда Смерти уже пыталась. Не помогло.',
      sudo: 'Недостаточно прав. Вы не джедай.',
      exit: 'Из галактики не выйти. Но можно прокрутить вверх.',
      pwd: '/галактика/не-так-уж-далеко',
      ping: 'pong · ответ с Явина IV за 12 мс',
      secretFile: 'Доступ запрещён. Попробуйте <b>приказ 66</b>.',
      jokes: [
        'Сколько ситхов нужно, чтобы вкрутить лампочку? Двое: не больше и не меньше.',
        'Йода о переобучении: «Всё запомнил ты, ничего не обобщил».',
        'Data Scientist изучил чертежи Звезды Смерти: «Одна маленькая уязвимость, но очень значимая, p &lt; 0.05».'
      ],
      date: 'Сегодня {d}. По галактическому календарю очень давно.',
      aboutHead: 'Ислам Куттыбаев · Data Scientist',
      workHead: 'Работа сейчас:',
      skillsHead: 'Навыки:',
      projectsHead: 'Проекты:',
      contactHead: 'Связь:'
    },
    en: {
      hello: 'ISLAM-OS v26.11 · Falcon onboard computer. All systems nominal.',
      hello2: 'Type <b>help</b> to see the commands.',
      help: [
        ['help', 'list of commands'], ['about', 'who I am'], ['work', 'where I work now'], ['skills', 'skills'],
        ['projects', 'projects'], ['contact', 'how to reach me'], ['goto &lt;planet&gt;', 'jump to a planet, e.g. <b>goto hoth</b>'],
        ['ls', 'list of planets'], ['lang ru|kk|en', 'change language'], ['intro', 'replay the intro'],
        ['clear', 'clear the screen'], ['secrets', 'a hint about secrets']
      ],
      unknown: 'Command “{c}” not found. This is not the command you are looking for. Type <b>help</b>.',
      noPlanet: 'Planet “{p}” is not in the navicomputer. Type <b>ls</b>.',
      gotoUsage: 'Where to? For example: <b>goto coruscant</b>',
      jumping: 'Course set for {p}. Jumping in 3… 2… 1…',
      lang: 'Language switched.',
      langUsage: 'Available: <b>lang ru</b>, <b>lang kk</b>, <b>lang en</b>',
      secrets: 'There are more than ten secret commands. Start with <b>hello there</b>. Rumour has it Order 66 is hidden somewhere.',
      o66: ['Commander Cody: “It will be done, my lord.”', 'Executing Order 66… Searching the CV for Jedi…', 'Jedi found: 0. Data Scientists found: 1. Keeping him.'],
      o66end: 'Alert cancelled. The Empire changed its mind.',
      o67: 'Order 67 received. All clones: six… seven! 🙌',
      kenobi: 'General Kenobi!',
      father: 'Nooooooo!',
      force: 'You feel the Force… The planets begin to float.',
      trap: 'IT’S A TRAP!',
      kessel: 'Made the Kessel Run in less than twelve parsecs. Yes, we know a parsec is a distance.',
      mtfbwy: 'And also with you. Always.',
      dodont: 'Do. Or do not. There is no try. The CV, however, is done.',
      r2: 'Beep-boop-weeoo! 🔊',
      chewie: 'Rrrraaaaarrrgh! (Chewbacca approves this CV)',
      yoda: 'A good CV this is. Write to him, you must. Hmm.',
      dark: 'Welcome to the dark side. We have cookies. To go back: <b>lightside</b>.',
      light: 'Welcome back to the light side.',
      saber: 'Vvvzhuuum!',
      hire: 'Excellent choice. Opening a comm channel…',
      sudoHire: 'No password needed: Islam already agrees. Opening a comm channel…',
      rm: 'The Death Star tried that already. Didn’t work.',
      sudo: 'Permission denied. You are not a Jedi.',
      exit: 'There is no leaving the galaxy. But you can scroll up.',
      pwd: '/galaxy/not-so-far-away',
      ping: 'pong · reply from Yavin IV in 12 ms',
      secretFile: 'Access denied. Try <b>order 66</b>.',
      jokes: [
        'How many Sith does it take to change a light bulb? Two: no more, no less.',
        'Yoda on overfitting: “Memorised everything you have, generalised nothing.”',
        'A data scientist studied the Death Star plans: “One small weakness, but highly significant, p &lt; 0.05.”'
      ],
      date: 'Today is {d}. By the galactic calendar, a long time ago.',
      aboutHead: 'Islam Kuttybaev · Data Scientist',
      workHead: 'Current job:',
      skillsHead: 'Skills:',
      projectsHead: 'Projects:',
      contactHead: 'Contact:'
    },
    kk: {
      hello: 'ISLAM-OS v26.11 · «Сұңқар» борт компьютері. Барлық жүйе қалыпты.',
      hello2: 'Командаларды көру үшін <b>help</b> деп жазыңыз.',
      help: [
        ['help', 'командалар тізімі'], ['about', 'мен кіммін'], ['work', 'қазір қайда жұмыс істеймін'], ['skills', 'дағдылар'],
        ['projects', 'жобалар'], ['contact', 'байланыс'], ['goto &lt;планета&gt;', 'планетаға секіру, мысалы <b>goto хот</b>'],
        ['ls', 'планеталар тізімі'], ['lang ru|kk|en', 'тілді ауыстыру'], ['intro', 'кіріспені көрсету'],
        ['clear', 'экранды тазалау'], ['secrets', 'құпиялар туралы кеңес']
      ],
      unknown: '«{c}» командасы табылмады. Бұл сіз іздеген команда емес. <b>help</b> деп жазыңыз.',
      noPlanet: '«{p}» планетасы навикомпьютерде жоқ. <b>ls</b> деп жазыңыз.',
      gotoUsage: 'Қайда ұшамыз? Мысалы: <b>goto корусант</b>',
      jumping: '{p} бағытына бет алдық. Секіруге 3… 2… 1…',
      lang: 'Тіл ауыстырылды.',
      langUsage: 'Қолжетімді: <b>lang ru</b>, <b>lang kk</b>, <b>lang en</b>',
      secrets: 'Құпия командалар оннан көп. <b>hello there</b> деп бастаңыз. Бір жерде 66-бұйрық жасырылған дейді.',
      o66: ['Коммандер Коди: «Орындалады, мырзам».', '66-бұйрықты орындаймын… Түйіндемеден джедайларды іздеймін…', 'Табылған джедайлар: 0. Табылған Data Scientist: 1. Қалдырамыз.'],
      o66end: 'Дабыл тоқтатылды. Империя ойын өзгертті.',
      o67: '67-бұйрық қабылданды. Барлық клондарға: алты… жеті! 🙌',
      kenobi: 'Генерал Кеноби!',
      father: 'Жоооооқ!',
      force: 'Сіз Күшті сезінесіз… Планеталар сәл көтеріледі.',
      trap: 'БҰЛ ТҰЗАҚ!',
      kessel: 'Кессельге рейс 12 парсектен аз уақытта. Иә, парсек қашықтық екенін білеміз.',
      mtfbwy: 'Сізбен де. Әрқашан.',
      dodont: 'Жаса. Немесе жасама. Тырысу деген жоқ. Ал түйіндеме дайын.',
      r2: 'Бип-буп-ви-у! 🔊',
      chewie: 'Ррррааааррргх! (Чубакка бұл түйіндемені мақұлдайды)',
      yoda: 'Жақсы түйіндеме бұл. Оған жазуың керек. Хм-м.',
      dark: 'Қараңғы тарапқа қош келдіңіз. Бізде печенье бар. Қайту үшін: <b>lightside</b>.',
      light: 'Жарық тарапқа қайта оралдыңыз.',
      saber: 'Вжжжууум!',
      hire: 'Тамаша шешім. Байланыс арнасын ашамын…',
      sudoHire: 'Құпиясөз керек емес: Ислам келісіп қойды. Байланыс арнасын ашамын…',
      rm: 'Өлім Жұлдызы мұны байқап көрген. Көмектеспеді.',
      sudo: 'Құқық жеткіліксіз. Сіз джедай емессіз.',
      exit: 'Галактикадан шығу мүмкін емес. Бірақ жоғары айналдыруға болады.',
      pwd: '/галактика/алыс-емес',
      ping: 'pong · Явин IV-тен жауап 12 мс',
      secretFile: 'Кіруге тыйым салынған. <b>66-бұйрық</b> деп көріңіз.',
      jokes: [
        'Шамды бұрап қою үшін қанша ситх керек? Екеуі: артық та емес, кем де емес.',
        'Йода шамадан тыс оқыту туралы: «Бәрін жаттадың, ештеңені жалпыламадың».',
        'Data Scientist Өлім Жұлдызының сызбаларын зерттеді: «Бір кішкентай осалдық, бірақ өте маңызды, p &lt; 0.05».'
      ],
      date: 'Бүгін {d}. Галактикалық күнтізбе бойынша әлдеқашан.',
      aboutHead: 'Ислам Куттыбаев · Data Scientist',
      workHead: 'Қазіргі жұмыс:',
      skillsHead: 'Дағдылар:',
      projectsHead: 'Жобалар:',
      contactHead: 'Байланыс:'
    }
  };
  function lang() { return (S.lang && S.lang()) || d.lang || 'ru'; }
  function t(k, v) {
    var s = (T[lang()] || T.ru)[k];
    if (s === undefined) s = T.ru[k];
    if (typeof s === 'string' && v) Object.keys(v).forEach(function (n) { s = s.split('{' + n + '}').join(v[n]); });
    return s;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function text(el) { return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; }

  function print(html, cls) {
    var p = document.createElement('div');
    p.className = 'tl' + (cls ? ' ' + cls : '');
    p.innerHTML = html;
    out.appendChild(p);
    out.scrollTop = out.scrollHeight;
    return p;
  }
  function printSeq(lines, cls, gap) {
    lines.forEach(function (l, i) { setTimeout(function () { print(l, cls); }, i * (gap || 350)); });
  }

  /* ---------- Звуки (только после ввода команды, то есть после действия пользователя) ---------- */
  var AC = window.AudioContext || window.webkitAudioContext, ac = null;
  function audio() { if (!AC) return null; if (!ac) ac = new AC(); if (ac.state === 'suspended') ac.resume(); return ac; }
  function tone(type, f0, f1, t0, dur, vol) {
    var c = audio(); if (!c) return;
    var o = c.createOscillator(), g = c.createGain(), st = c.currentTime + t0;
    o.type = type; o.frequency.setValueAtTime(f0, st); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), st + dur);
    g.gain.setValueAtTime(0, st); g.gain.linearRampToValueAtTime(vol, st + .02); g.gain.exponentialRampToValueAtTime(.0005, st + dur);
    o.connect(g); g.connect(c.destination); o.start(st); o.stop(st + dur + .05);
  }
  function beeps() { for (var i = 0; i < 9; i++) { var f = 900 + Math.random() * 1800; tone(Math.random() < .5 ? 'sine' : 'square', f, f * (Math.random() < .5 ? .6 : 1.6), i * .09, .08, .05); } }
  function saberSound() { tone('sawtooth', 70, 110, 0, .35, .08); tone('sawtooth', 95, 90, .3, 1.2, .05); }
  function alarm() { for (var i = 0; i < 6; i++) tone('square', i % 2 ? 440 : 660, i % 2 ? 440 : 660, i * .28, .25, .035); }

  /* ---------- Эффекты пасхалок ---------- */
  function flash(color) {
    var f = document.createElement('div');
    f.className = 'egg-flash'; f.style.setProperty('--fc', color);
    document.body.appendChild(f);
    setTimeout(function () { f.remove(); }, 1200);
  }
  var sithTimer = 0;
  function sith(on, ms) {
    clearTimeout(sithTimer);
    d.classList.toggle('sith', on);
    if (window.Holo) Holo.refresh();
    if (on && ms) sithTimer = setTimeout(function () { d.classList.remove('sith'); print(t('o66end'), 'ok'); if (window.Holo) Holo.refresh(); }, ms);
  }
  function sixSeven() {
    var o = document.createElement('div');
    o.className = 'six-seven';
    o.innerHTML = '<span class="h l">🫴</span><b>6</b><b>7</b><span class="h r">🫴</span>';
    document.body.appendChild(o);
    setTimeout(function () { o.remove(); }, 3600);
  }
  function float() { d.classList.add('force'); setTimeout(function () { d.classList.remove('force'); }, 5200); }
  function saberLine() {
    var p = print('<span class="saber-line"><i></i></span>');
    saberSound();
    return p;
  }

  /* ---------- Данные со страницы: так терминал всегда совпадает с сайтом и его языком ---------- */
  function planets() {
    return Array.prototype.map.call(document.querySelectorAll('.route .stop'), function (b, i) {
      return { id: b.getAttribute('href').slice(1), n: i + 1, name: text(b.querySelector('.stop-name')), what: text(b.querySelector('.stop-what')) };
    });
  }
  var ALIAS = {
    tatooine: ['татуин', 'tatooine'], coruscant: ['корусант', 'coruscant'], hoth: ['хот', 'hoth'], dagobah: ['дагоба', 'dagobah'],
    mustafar: ['мустафар', 'mustafar'], ilum: ['илум', 'ilum'], scarif: ['скариф', 'scarif'], naboo: ['набу', 'naboo'],
    yavin4: ['явин', 'явин4', 'явин iv', 'yavin', 'yavin4', 'yavin iv', 'yavin 4', 'явин 4'],
    terminal: ['терминал', 'terminal']
  };
  function findPlanet(q) {
    q = q.trim().toLowerCase().replace(/\/$/, '');
    var list = planets(), hit = null;
    list.forEach(function (p) {
      if (String(p.n) === q || p.id === q || p.name.toLowerCase() === q || (ALIAS[p.id] || []).indexOf(q) >= 0) hit = p;
    });
    if (!hit && ALIAS.terminal.indexOf(q) >= 0) hit = { id: 'terminal', name: q };
    return hit;
  }

  var C = {
    help: function () {
      print(t('help').map(function (r) { return '<span class="cmd">' + r[0] + '</span><span class="desc">' + r[1] + '</span>'; }).join('<br>'), 'help');
    },
    about: function () {
      var ps = document.querySelectorAll('#tatooine .world-body [data-reveal] > p');
      print('<b>' + t('aboutHead') + '</b>');
      Array.prototype.slice.call(ps, 0, 3).forEach(function (p) { print(esc(text(p))); });
    },
    work: function () {
      var w = document.getElementById('coruscant');
      print('<b>' + t('workHead') + '</b> ' + esc(text(w.querySelector('h3'))) + ' · ' + esc(text(w.querySelector('.meta'))));
      w.querySelectorAll('.list li').forEach(function (li) { print('• ' + esc(text(li))); });
    },
    skills: function () {
      print('<b>' + t('skillsHead') + '</b>');
      var dts = document.querySelectorAll('#ilum .skills dt');
      dts.forEach(function (dt) { print('<span class="cmd">' + esc(text(dt)) + '</span> ' + esc(text(dt.nextElementSibling))); });
    },
    projects: function () {
      print('<b>' + t('projectsHead') + '</b>');
      document.querySelectorAll('#mustafar .projects a').forEach(function (a) {
        print('• <a href="' + a.href + '" target="_blank" rel="noopener">' + esc(text(a.querySelector('.pname'))) + '</a> · ' + esc(text(a.querySelector('.pdesc'))));
      });
    },
    contact: function () {
      print('<b>' + t('contactHead') + '</b>');
      document.querySelectorAll('#yavin4 .channels a').forEach(function (a) {
        print('<span class="cmd">' + esc(text(a.querySelector('.k'))) + '</span> <a href="' + a.getAttribute('href') + '"' + (/^http/.test(a.getAttribute('href')) ? ' target="_blank" rel="noopener"' : '') + '>' + esc(text(a.querySelector('.v'))) + '</a>');
      });
    },
    ls: function () {
      print(planets().map(function (p) { return '<span class="dir">' + p.id + '/</span>'; }).join('  ') + '  resume.txt  secrets.txt');
    },
    goto: function (arg) {
      if (!arg) return print(t('gotoUsage'));
      var p = findPlanet(arg);
      if (!p) return print(t('noPlanet', { p: esc(arg) }), 'err');
      print(t('jumping', { p: esc(p.name) }), 'ok');
      setTimeout(function () { if (S.jumpTo) S.jumpTo(p.id); }, 900);
    },
    lang: function (arg) {
      arg = (arg || '').trim().toLowerCase(); if (arg === 'kz') arg = 'kk';
      if (['ru', 'kk', 'en'].indexOf(arg) < 0) return print(t('langUsage'));
      if (S.setLang) S.setLang(arg);
      print(t('lang'), 'ok');
    },
    intro: function () { if (S.openIntro) S.openIntro(); },
    clear: function () { out.innerHTML = ''; },
    secrets: function () { print(t('secrets')); },
    date: function () {
      var loc = { ru: 'ru-RU', kk: 'kk-KZ', en: 'en-GB' }[lang()];
      print(t('date', { d: new Date().toLocaleDateString(loc, { day: 'numeric', month: 'long', year: 'numeric' }) }));
    },
    pwd: function () { print(t('pwd')); },
    ping: function () { print(t('ping')); },
    joke: function () { var j = t('jokes'); print(j[Math.floor(Math.random() * j.length)]); },
    exit: function () { print(t('exit')); },
    cat: function (arg) {
      arg = (arg || '').trim().toLowerCase();
      if (arg === 'resume.txt') return C.about();
      if (arg === 'secrets.txt') return print(t('secretFile'), 'err');
      print(t('unknown', { c: esc('cat ' + arg) }), 'err');
    }
  };
  var ALIASES = {
    '?': 'help', 'помощь': 'help', 'көмек': 'help', 'whoami': 'about', 'обо мне': 'about', 'кто': 'about',
    'job': 'work', 'работа': 'work', 'навыки': 'skills', 'проекты': 'projects', 'контакты': 'contact', 'связь': 'contact',
    'jump': 'goto', 'cd': 'goto', 'прыжок': 'goto', 'лететь': 'goto', 'cls': 'clear', 'очистить': 'clear',
    'секреты': 'secrets', 'шутка': 'joke', 'анекдот': 'joke', 'quit': 'exit', 'выход': 'exit', 'язык': 'lang', 'заставка': 'intro'
  };

  /* Пасхалки: фраза → действие. */
  var EGGS = [
    [/^(execute\s+)?order\s*66$|^(выполнить\s+)?приказ\s*66$|^66$|^66-бұйрық$|^бұйрық\s*66$/, function () {
      sith(true, 9000); flash('#ff2a2a'); alarm(); printSeq(t('o66'), 'red', 650);
    }],
    [/^(execute\s+)?order\s*67$|^приказ\s*67$|^67$|^67-бұйрық$|^бұйрық\s*67$|^six\s*seven$|^шесть\s*семь$/, function () { print(t('o67'), 'ok'); sixSeven(); }],
    [/^hello\s*there!?$|^привет$|^сәлем$/, function () { print(t('kenobi'), 'ok'); }],
    [/^(luke,?\s*)?i\s*am\s*your\s*father$|^я\s*твой\s*отец$|^мен\s*сенің\s*әкеңмін$/, function () { print(t('father'), 'red'); }],
    [/^use\s*the\s*force$|^используй\s*силу$|^force$|^сила$|^күш$/, function () { print(t('force'), 'ok'); float(); }],
    [/^it'?s\s*a\s*trap!?$|^это\s*ловушка!?$|^бұл\s*тұзақ!?$/, function () { print(t('trap'), 'red'); flash('#ff7a1a'); }],
    [/^kessel(\s*run)?$|^кессель$/, function () { print(t('kessel')); }],
    [/^may\s*the\s*force\s*be\s*with\s*you$|^да\s*пребудет\s*с\s*(тобой|вами)\s*сила$/, function () { print(t('mtfbwy'), 'ok'); }],
    [/^do\s*or\s*do\s*not$|^делай\s*или\s*не\s*делай$/, function () { print(t('dodont')); }],
    [/^r2-?d2$|^r2$|^р2-?д2$/, function () { print(t('r2'), 'ok'); beeps(); }],
    [/^chewie$|^chewbacca$|^чуи$|^чубакка$/, function () { print(t('chewie')); tone('sawtooth', 180, 90, 0, .7, .05); }],
    [/^yoda$|^йода$/, function () { print(t('yoda')); }],
    [/^dark\s*side$|^darkside$|^тёмная\s*сторона$|^темная\s*сторона$/, function () { print(t('dark'), 'red'); sith(true); }],
    [/^light\s*side$|^lightside$|^светлая\s*сторона$/, function () { sith(false); print(t('light'), 'ok'); }],
    [/^lightsaber$|^saber$|^световой\s*меч$|^меч$/, function () { saberLine(); print(t('saber')); }],
    [/^sudo\s+hire(\s+islam)?$/, function () { print(t('sudoHire'), 'ok'); mail(); }],
    [/^hire(\s+islam)?$|^нанять(\s+ислама)?$|^жұмысқа\s*алу$/, function () { print(t('hire'), 'ok'); mail(); }],
    [/^(sudo\s+)?rm\s+-rf\s+\/?\*?$/, function () { print(t('rm'), 'red'); }],
    [/^sudo(\s.*)?$/, function () { print(t('sudo'), 'err'); }]
  ];
  function mail() {
    var a = document.querySelector('#yavin4 .channels a[href^="mailto:"]');
    if (a) setTimeout(function () { location.href = a.getAttribute('href'); }, 1200);
  }

  function run(raw) {
    var line = raw.trim();
    print('<span class="pr">islam@falcon:~$</span> ' + esc(line), 'echo');
    if (!line) return;
    var low = line.toLowerCase().replace(/\s+/g, ' ');
    for (var i = 0; i < EGGS.length; i++) if (EGGS[i][0].test(low)) return EGGS[i][1]();
    var sp = low.indexOf(' '), cmd = sp < 0 ? low : low.slice(0, sp), arg = sp < 0 ? '' : line.slice(sp + 1);
    if (ALIASES[low]) cmd = ALIASES[low], arg = '';
    else if (ALIASES[cmd]) cmd = ALIASES[cmd];
    if (C[cmd]) return C[cmd](arg);
    if (findPlanet(low)) return C.goto(low);
    print(t('unknown', { c: esc(line) }), 'err');
  }

  var hist = [], hi = 0;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = input.value;
    if (v.trim()) { hist.push(v); hi = hist.length; }
    input.value = '';
    run(v);
  });
  var COMPLETE = Object.keys(C).concat(['hello there', 'order 66', 'order 67', 'use the force', 'lightsaber', 'hire']);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowUp') { if (hi > 0) { hi--; input.value = hist[hi]; } e.preventDefault(); }
    else if (e.key === 'ArrowDown') { if (hi < hist.length) { hi++; input.value = hist[hi] || ''; } e.preventDefault(); }
    else if (e.key === 'Tab') {
      var v = input.value.toLowerCase(), m = COMPLETE.filter(function (c) { return c.indexOf(v) === 0; });
      if (v && m.length === 1) { input.value = m[0] + ' '; e.preventDefault(); }
      else if (v && m.length > 1) { print(m.join('  '), 'help'); e.preventDefault(); }
    } else if (e.key === 'Escape') input.blur();
  });
  term.addEventListener('click', function (e) { if (!e.target.closest('a')) input.focus({ preventScroll: true }); });
  /* Кнопки быстрых команд под терминалом: удобно на телефоне, где печатать неудобно. */
  document.querySelectorAll('[data-cmd]').forEach(function (b) {
    b.addEventListener('click', function () { var c = b.getAttribute('data-cmd'); hist.push(c); hi = hist.length; run(c); });
  });

  /* Клавиша ~ (или ё) открывает терминал из любого места. */
  document.addEventListener('keydown', function (e) {
    if (e.target === input || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
    if (d.classList.contains('intro-open')) return;
    if (e.key === '`' || e.key === '~' || e.key === 'ё' || e.key === 'Ё') {
      e.preventDefault();
      document.getElementById('terminal').scrollIntoView({ behavior: S.reduce ? 'auto' : 'smooth', block: 'start' });
      setTimeout(function () { input.focus({ preventScroll: true }); }, 500);
    }
  });

  function greet() { out.innerHTML = ''; print(t('hello'), 'ok'); print(t('hello2')); }
  greet();
  document.addEventListener('langchange', function () { if (out.children.length <= 2) greet(); });
})();
