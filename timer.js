// صفحة المؤقّت: اختيارات جاهزة + وقت مخصص + تنبيه بدون موسيقى (بيب بسيط بنغمة واحدة أو اهتزاز)
import{h,toast}from"./ui.js";
import*as S from"./store.js";
const KEY="todo_timer",PK="todo_timer_prefs",p2=n=>String(n).padStart(2,"0");
const PRESETS=[[5,"٥ دقايق"],[10,"١٠ دقايق"],[30,"٣٠ دقيقة"],[45,"٤٥ دقيقة"],[60,"ساعة"],[120,"ساعتين"]];
const SOUNDS=[["beep","بيب بسيط"],["vibe","اهتزاز فقط"]];
const L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))||d}catch{return d}},W=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
let prefs={sound:"beep",log:true,...L(PK,{})};if(prefs.sound!=="beep"&&prefs.sound!=="vibe")prefs.sound="beep";
let T={total:0,end:0,left:0,run:false};const sv=L(KEY,null);
if(sv&&sv.end>Date.now()){T={total:sv.total,end:sv.end,left:0,run:true}}else if(sv)localStorage.removeItem(KEY);
let sel=T.total?T.total/60:25,ui={},iv=0,ac=null,wl=null,alarm=null;

const fmt=s=>{const H=Math.floor(s/3600),M=Math.floor(s%3600/60);return(H?H+":"+p2(M):p2(M))+":"+p2(s%60)};
const left=()=>T.run?Math.max(0,Math.ceil((T.end-Date.now())/1000)):T.left;

// ===== الصوت: نغمة واحدة ثابتة (مش لحن) =====
function audio(){try{ac=ac||new(window.AudioContext||window.webkitAudioContext)();if(ac.state==="suspended")ac.resume()}catch{}}
function beeps(){if(!ac)return;const t0=ac.currentTime;for(let i=0;i<3;i++){const o=ac.createOscillator(),g=ac.createGain(),t=t0+i*.38;o.type="sine";o.frequency.value=880;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.5,t+.02);g.gain.setValueAtTime(.5,t+.2);g.gain.linearRampToValueAtTime(0,t+.24);o.connect(g).connect(ac.destination);o.start(t);o.stop(t+.26)}}
function ringOnce(){if(prefs.sound==="beep")beeps();if(navigator.vibrate)navigator.vibrate([400,200,400,200,400])}
function stopAlarm(){if(!alarm)return;clearInterval(alarm.iv);alarm.el.remove();alarm=null;if(navigator.vibrate)navigator.vibrate(0)}
function startAlarm(mins){
  stopAlarm();const el=h("div",{class:"alarm",role:"alertdialog"},h("div",{class:"abox"},h("div",{class:"aico"},"⏰"),h("h2",{},"انتهى الوقت"),h("p",{class:"muted"},`خلص مؤقّت ${mins} دقيقة`),h("button",{class:"btn primary",onclick:stopAlarm},"إيقاف")));
  document.body.append(el);audio();ringOnce();let n=0;alarm={el,iv:setInterval(()=>{if(++n>=15)return stopAlarm();ringOnce()},3500)};
  try{if("Notification"in window&&Notification.permission==="granted")navigator.serviceWorker?.ready.then(r=>r.showNotification("To Do",{body:`انتهى مؤقّت ${mins} دقيقة`,tag:"timer",requireInteraction:true})).catch(()=>{})}catch{}
}

// ===== التحكم =====
async function lock(){try{if(navigator.wakeLock&&!wl)wl=await navigator.wakeLock.request("screen"),wl.addEventListener("release",()=>wl=null)}catch{}}
function unlock(){try{wl?.release()}catch{}wl=null}
function save(){T.run?W(KEY,{total:T.total,end:T.end}):localStorage.removeItem(KEY)}
function begin(sec){audio();T={total:sec,end:Date.now()+sec*1e3,left:sec,run:true};save();lock();
  try{if("Notification"in window&&Notification.permission==="default")Notification.requestPermission()}catch{}run()}
function run(){clearInterval(iv);iv=setInterval(tick,250);tick()}
function finish(){clearInterval(iv);iv=0;const m=Math.round(T.total/60);T={total:0,end:0,left:0,run:false};save();unlock();
  if(prefs.log&&m>0)S.update(st=>{st.focus=st.focus||{};const n=new Date(),k=`${n.getFullYear()}-${p2(n.getMonth()+1)}-${p2(n.getDate())}`;st.focus[k]=(st.focus[k]||0)+m});
  paint();startAlarm(m)}
function tick(){if(T.run&&Date.now()>=T.end)return finish();paint()}
function pause(){T.left=left();T.run=false;clearInterval(iv);iv=0;save();unlock();paint()}
function resume(){audio();T.end=Date.now()+T.left*1e3;T.run=true;save();lock();run()}
function reset(){clearInterval(iv);iv=0;T={total:0,end:0,left:0,run:false};save();unlock();paint()}
document.addEventListener("visibilitychange",()=>{if(!document.hidden){if(T.run)tick();if(T.run)lock()}});

// ===== الواجهة =====
const R=96,C=2*Math.PI*R;
function paint(){
  if(!ui.out||!ui.out.isConnected)return;const active=T.total>0,s=active?left():sel*60,tot=active?T.total:sel*60;
  ui.out.textContent=fmt(s);ui.arc.style.strokeDashoffset=C*(1-(active?s/tot:1));
  ui.go.textContent=!active?"ابدأ":T.run?"إيقاف مؤقت":"استكمال";ui.rst.hidden=!active;ui.setup.hidden=active;
  ui.sub.textContent=!active?"اختار مدة أو اكتب وقت مخصص":T.run?"شغّال… سيب الصفحة مفتوحة":"متوقّف مؤقتًا";
  ui.chips.forEach(([m,b])=>b.classList.toggle("on",m===sel))}
export function timerPage(){
  const out=h("div",{class:"ftime ttime"}),sub=h("small",{class:"muted"}),
  svg=h("div",{class:"tring"});svg.innerHTML=`<svg viewBox="0 0 220 220" aria-hidden="true"><circle cx="110" cy="110" r="${R}" fill="none" stroke="var(--line)" stroke-width="10"/><circle id="tarc" cx="110" cy="110" r="${R}" fill="none" stroke="var(--on)" stroke-width="10" stroke-linecap="round" stroke-dasharray="${C}" transform="rotate(-90 110 110)" style="transition:stroke-dashoffset .3s linear"/></svg>`;
  svg.append(h("div",{class:"tin"},out,sub));
  const chips=PRESETS.map(([m,l])=>[m,h("button",{type:"button",class:"pick fc",onclick:()=>{sel=m;cm.value="";paint()}},l)]),
  cm=h("input",{type:"number",inputMode:"numeric",min:1,max:600,placeholder:"دقايق مخصصة","aria-label":"مدة مخصصة بالدقايق",oninput:()=>{const v=Math.round(+cm.value);if(v>=1&&v<=600){sel=v;paint()}}}),
  go=h("button",{class:"btn primary tgo",onclick:()=>{if(!T.total)begin(sel*60);else T.run?pause():resume()}}),
  rst=h("button",{class:"btn",onclick:reset},"إلغاء"),
  snd=h("div",{class:"fchips tsnd"},...SOUNDS.map(([k,l])=>h("button",{type:"button",class:"pick fc"+(prefs.sound===k?" on":""),onclick:e=>{prefs.sound=k;W(PK,prefs);snd.querySelectorAll(".fc").forEach(b=>b.classList.toggle("on",b===e.currentTarget));if(k!=="vibe"){audio();ringOnce()}else if(navigator.vibrate)navigator.vibrate(300)}},l))),
  lg=h("input",{type:"checkbox",checked:prefs.log,onchange:()=>{prefs.log=lg.checked;W(PK,prefs)}}),
  setup=h("div",{class:"stack"},h("div",{class:"fchips tpre"},...chips.map(c=>c[1])),cm);
  ui={out,sub,go,rst,setup,chips,arc:svg.querySelector("#tarc")};
  const v=h("div",{class:"view"},h("div",{},h("h1",{},"المؤقّت"),h("p",{class:"muted"},"اختار المدة واضغط ابدأ؛ لما الوقت يخلص هيظهر تنبيه ويرنّ بيب قصير (أو يهتز الموبايل).")),
    h("section",{class:"card tcard"},svg,setup,h("div",{class:"addrow tctl"},go,rst)),
    h("section",{class:"card tset"},h("b",{},"صوت التنبيه"),snd,h("small",{class:"muted"},"اختار شكل التنبيه عند انتهاء الوقت: بيب قصير أو اهتزاز بس. الاختيار بيتجرّب فورًا. التنبيه بيشتغل لو الصفحة مفتوحة؛ لو الشاشة اتقفلت ممكن الموبايل يوقفه."),
      h("label",{class:"tlog"},lg,h("span",{},"أضف مدة المؤقّت لإجمالي دقايق التركيز المعروضة في الصفحة الرئيسية"))));
  paint();Promise.resolve().then(paint);if(T.run&&!iv)run();return v}
