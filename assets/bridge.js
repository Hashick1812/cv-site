(()=>{
'use strict';
const root=document.documentElement;
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const crew=document.querySelector('.crew-deck');
const officer='<svg viewBox="0 0 40 100" aria-hidden="true"><ellipse cx="22" cy="96" rx="15" ry="3" fill="#000" opacity=".45"/><path class="leg-l" d="M15 48L13 88L10 93H19L23 48" fill="#141e29" stroke="#3d4c5b"/><path class="leg-r" d="M24 48L25 89L24 94H34L30 87L30 48" fill="#1b2631" stroke="#43505d"/><path d="M10 27L7 51L11 66L15 64L13 49L17 33M30 27L35 49L32 65L28 63L29 48L26 33" fill="#34424e" stroke="#66737b"/><path d="M13 24L28 24L32 48L28 55H14L11 48Z" fill="#394954" stroke="#6b7981"/><path d="M14 45H30V50H13Z" fill="#0d151e"/><rect x="21" y="46" width="4" height="3" fill="#b8c3ca"/><rect x="23" y="28" width="5" height="3" fill="#c66b60"/><path d="M17 19H25V26H17Z" fill="#bd9c83"/><ellipse cx="21" cy="14" rx="7" ry="9" fill="#c6ad94"/><path d="M13 12L14 5H27L30 13Z" fill="#394955"/><path d="M12 13H30" stroke="#86959d" stroke-width="2"/></svg>';
for(let i=0;i<4;i++){const member=document.createElement('div');member.className='crew-member';member.style.cssText='--start:'+([0,35,70,90][i])+'%;--travel:'+([120,-90,75,-140][i])+'px;--duration:'+(18+i*4)+'s;--delay:-'+(i*6)+'s;';member.innerHTML=officer;crew.append(member)}
const toggle=document.querySelector('.cv-toggle');
function setCV(on){root.classList.toggle('cv-mode',on);toggle.setAttribute('aria-pressed',String(on));toggle.textContent=on?'Вернуться на мостик':'Краткое CV';window.scrollTo({top:0,behavior:'instant'});window.dispatchEvent(new Event('resize'));try{const u=new URL(location.href);on?u.searchParams.set('cv','1'):u.searchParams.delete('cv');history.replaceState(null,'',u)}catch(e){}}
toggle.addEventListener('click',()=>setCV(!root.classList.contains('cv-mode')));
if(new URLSearchParams(location.search).get('cv')==='1')setCV(true);
const pause=document.createElement('button');pause.type='button';pause.className='motion-toggle';pause.textContent='Приостановить анимацию';pause.setAttribute('aria-pressed','false');document.body.append(pause);
pause.addEventListener('click',()=>{const on=root.classList.toggle('motion-paused');pause.setAttribute('aria-pressed',String(on));pause.textContent=on?'Продолжить анимацию':'Приостановить анимацию';if(window.Planets?.pause)window.Planets.pause(on)});
const overlay=document.createElement('div');overlay.className='jump-screen';overlay.setAttribute('aria-hidden','true');overlay.innerHTML='<canvas></canvas><p>Гипердвигатель · выход на маршрут</p>';document.body.append(overlay);
const canvas=overlay.querySelector('canvas'),ctx=canvas.getContext('2d');
let raf=0;
document.addEventListener('hyperspace',()=>{
 if(reduce)return;cancelAnimationFrame(raf);
 const w=innerWidth,h=innerHeight,dpr=Math.min(devicePixelRatio,1.5);canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
 const points=Array.from({length:w<700?260:600},()=>({a:Math.random()*Math.PI*2,r:Math.random(),speed:.5+Math.random()}));
 const start=performance.now(),cx=w*.5,cy=h*.46;
 function frame(now){const t=(now-start)/2200;if(t>=1){ctx.clearRect(0,0,w,h);return}
 ctx.fillStyle='#020611';ctx.fillRect(0,0,w,h);
 const thrust=t<.24?Math.pow(t/.24,3):t>.78?Math.pow((1-t)/.22,2):1;
 const glow=ctx.createRadialGradient(cx,cy,0,cx,cy,Math.max(w,h)*.8);glow.addColorStop(0,'rgba(190,229,255,'+(.08+thrust*.45)+')');glow.addColorStop(.2,'rgba(42,121,216,'+(thrust*.34)+')');glow.addColorStop(.65,'rgba(13,44,116,'+(thrust*.8)+')');glow.addColorStop(1,'transparent');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
 for(const p of points){const r=((p.r+t*p.speed*2.7)%1);const radius=(.025+r*r)*Math.max(w,h)*.8;const len=2+thrust*(30+r*230);const a=p.a+thrust*.04;const x=cx+Math.cos(a)*radius,y=cy+Math.sin(a)*radius*.75;const tail=Math.max(8,radius-len);ctx.strokeStyle='rgba(190,225,255,'+(.25+r*.65)+')';ctx.lineWidth=.6+r*1.6;ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*tail,cy+Math.sin(a)*tail*.75);ctx.lineTo(x,y);ctx.stroke()}
 // Smooth tunnel exit, no strobing.
 overlay.style.opacity=t>.83?String((1-t)/.17):'1';
 raf=requestAnimationFrame(frame)}
 overlay.style.opacity='1';raf=requestAnimationFrame(frame);
});
document.addEventListener('visibilitychange',()=>{document.querySelectorAll('.crew-member').forEach(x=>x.style.animationPlayState=document.hidden?'paused':'')});

const labels={
en:['Resume view','Back to bridge','Pause motion','Resume motion','Galactic map','Choose a section','GitHub projects','Skills','Contact','Save PDF'],
kk:['Қысқаша түйіндеме','Көпірге оралу','Анимацияны тоқтату','Анимацияны жалғастыру','Галактика картасы','Бөлімді таңдаңыз','GitHub жобалары','Дағдылар','Байланыс','PDF сақтау'],
ru:['Краткое CV','Вернуться на мостик','Приостановить анимацию','Продолжить анимацию','Галактическая карта','Выберите раздел','Проекты на GitHub','Навыки','Связаться','Сохранить PDF']};
function localize(){const l=labels[root.lang]||labels.ru;toggle.textContent=l[root.classList.contains('cv-mode')?1:0];pause.textContent=l[root.classList.contains('motion-paused')?3:2];const title=document.querySelector('.galaxy-title');title.firstChild.textContent=l[4]+' ';title.querySelector('span').textContent=l[5];document.querySelectorAll('.hero-shortcuts a,.hero-pdf').forEach((el,i)=>el.textContent=l[6+i]);}
document.addEventListener('langchange',localize);toggle.addEventListener('click',localize);pause.addEventListener('click',localize);localize();
})();