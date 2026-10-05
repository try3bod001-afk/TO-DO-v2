import{h,ring,sheet,closeSheet,toast,mark,glyph,guessIcon,GLYPH_KEYS,onlineIcon}from"./ui.js";
import*as S from"./store.js";
const pct=(d,a)=>a?Math.round(d/a*100):0;
const cnt=s=>({d:s.chapters.filter(c=>c.done).length,a:s.chapters.length});
const p2=n=>String(n).padStart(2,"0"),key=(y,m,d)=>`${y}-${p2(m+1)}-${p2(d)}`;
const todayKey=()=>{const n=new Date();return key(n.getFullYear(),n.getMonth(),n.getDate())};
const find=(st,id)=>st.subjects.find(x=>x.id===id);
const HUE={"⚗":38,"🩸":0,"🔬":212,"📘":232,"🦠":140,"🧫":280,"🧪":160,"🧠":320,"📝":190,"🧬":262,"📚":174,"📖":200,"🧮":205,"⚛":225,"🌍":150,"🏛":30,"⚖":260,"💻":215,"🎨":330,"🎵":290,"💊":10,"🫀":350,"🦷":195,"💉":170,"🌱":125,"📐":45,"📈":145,"💼":25,"⚡":48,"🕌":165,"💬":200,"🏥":355,"🥗":100,"🩺":185};
const hue=s=>HUE[String(s.icon).replace(/\uFE0F/g,"")]??(s.icon[0]==="@"?[...s.icon].reduce((a,c)=>a+c.charCodeAt(0),0)*37%360:174);
const greet=()=>{const H=new Date().getHours();return H<12?"صباح الخير":H<17?"نهارك سعيد":"مساء الخير"};

export function home(){
  const st=S.get(),t=st.subjects.reduce((a,s)=>{const c=cnt(s);return{d:a.d+c.d,a:a.a+c.a}},{d:0,a:0});
  const day=st.days[todayKey()]||{tasks:[]},days=Object.values(st.days).filter(x=>x.done).length;
  return h("div",{class:"view"},
    h("header",{class:"hero"},ring(pct(t.d,t.a),104,"var(--accent)",10),
      h("div",{class:"grow"},h("small",{class:"muted"},"بسم الله الرحمن الرحيم"),h("h1",{class:"brand"},mark(40),"To Do"),
        h("div",{class:"chips"},h("span",{class:"chip"},`${t.d} من ${t.a} مهمة`),h("span",{class:"chip"},`${days} يوم منجز`),streak(st.days)>1?h("span",{class:"chip"},`${streak(st.days)} يوم ورا بعض`):null,(st.focus||{})[todayKey()]?h("span",{class:"chip"},`${st.focus[todayKey()]} دقيقة تركيز`):null))),
    todayCard(),examCard(),weekCard(),searchBox(),
    h("div",{class:"sec"},h("h2",{},"المواد"),h("button",{class:"btn primary",onclick:addSubject},"＋ مادة")),
    h("section",{class:"grid"},...st.subjects.map(s=>{const{d,a}=cnt(s);
      return h("a",{class:"card subj",style:`--h:${hue(s)}`,href:`#/s/${s.id}` },h("div",{class:"ico"},glyph(s.icon)),
        h("div",{class:"grow"},h("b",{},s.ar),h("div",{class:"en"},s.en),h("small",{class:"muted"},`${d} / ${a}`+(s.exam&&dleft(s.exam)>=0?" · "+examTxt(s):""))),ring(pct(d,a),52,"var(--sc)",5))})),
  );
}
function examCard(){
  const l=S.get().subjects.filter(s=>s.exam&&dleft(s.exam)>=0).sort((a,b)=>a.exam<b.exam?-1:1);if(!l.length)return null;const s=l[0],n=dleft(s.exam);
  return h("a",{class:"card exc",href:`#/s/${s.id}`},h("div",{class:"exn"},h("b",{},n),h("small",{},n===0?"النهاردة":n===1?"يوم":"يوم")),h("div",{class:"grow"},h("small",{class:"muted"},"الامتحان القادم"),h("b",{},s.ar),h("small",{class:"muted"},pace(s))))}
function weekCard(){
  const st=S.get(),n=new Date(),ds=[...Array(7)].map((_,i)=>{const d=new Date(n);d.setDate(n.getDate()-6+i);return d}),K=d=>key(d.getFullYear(),d.getMonth(),d.getDate()),
  vals=ds.map(d=>(st.days[K(d)]?.tasks||[]).filter(t=>t.done).length),mx=Math.max(1,...vals),tot=vals.reduce((a,b)=>a+b,0),foc=ds.reduce((a,d)=>a+((st.focus||{})[K(d)]||0),0);
  return h("section",{class:"card wk"},h("div",{class:"th"},h("b",{},"إنجازك آخر ٧ أيام"),h("small",{class:"muted"},tot?`${tot} مهمة`+(foc?` · ${foc} دقيقة تركيز`:""):"")),
    h("div",{class:"bars"},...ds.map((d,i)=>h("div",{class:"bcol"+(i===6?" now":"")},h("em",{},vals[i]||""),h("i",{style:`height:${Math.max(4,vals[i]/mx*100)}%`}),h("span",{},d.toLocaleDateString("ar-EG-u-nu-latn",{weekday:"short"}))))),
    h("small",{class:"muted"},tot?"كل عمود هو عدد المهام اللي علّمت عليها منجزة في اليوم ده (العمود الغامق = النهاردة).":"لسه مفيش مهام منجزة الأسبوع ده — علّم على أي مهمة وهتظهر هنا."))}
function searchBox(){
  const st=S.get(),inp=h("input",{type:"search",placeholder:"ابحث عن مادة أو مهمة...","aria-label":"بحث في المواد والمهام"}),out=h("div",{class:"srch"}),nm=x=>String(x).toLowerCase().replace(/[\u064B-\u0652\u0640]/g,"").replace(/[أإآ]/g,"ا").replace(/ى/g,"ي").replace(/ة/g,"ه");
  inp.oninput=()=>{const q=nm(inp.value.trim());if(!q){out.replaceChildren();return}const r=[];
    st.subjects.forEach(s=>{if(nm(s.ar+" "+s.en).includes(q))r.push(["مادة",s.ar,`#/s/${s.id}`]);s.chapters.filter(c=>nm(c.name).includes(q)).forEach(c=>r.push([s.ar,c.name+(c.done?" ✓":""),`#/s/${s.id}`]))});
    Object.keys(st.days).sort().reverse().forEach(k=>st.days[k].tasks.filter(t=>nm(t.text).includes(q)).forEach(t=>r.push([dayLabel(k),t.text+(t.done?" ✓":""),`#/cal/${k.slice(0,4)}-${+k.slice(5,7)}`])));
    out.replaceChildren(...(r.length?r.slice(0,30).map(([a,b,l])=>h("a",{class:"sr",href:l},h("small",{class:"muted"},a),h("b",{},b))):[h("p",{class:"muted"},"مفيش نتايج لـ «"+inp.value.trim()+"»")]))};
  return h("section",{class:"card sbox"},inp,out)}
const FILES=["./","./config.js","./contact.js","./index.html","./styles.css","./main.js","./store.js","./ui.js","./timer.js","./views.js","./manifest.webmanifest"];
async function refreshApp(){toast("بنجيب أحدث نسخة...");try{const c=await caches.open("todo-app");await Promise.all(FILES.map(u=>fetch(u,{cache:"reload"}).then(r=>r.ok&&c.put(u,r))));location.reload()}catch{toast("مقدرتش أحدّث — اتأكد من النت وجرّب تاني")}}
const tmr=k=>{const d=new Date(k+"T00:00");d.setDate(d.getDate()+1);return key(d.getFullYear(),d.getMonth(),d.getDate())};
function carry(k){const un=(S.get().days[k]?.tasks||[]).filter(t=>!t.done);if(!un.length)return;S.editDay(k,v=>{v.tasks=v.tasks.filter(t=>t.done)});S.editDay(tmr(k),v=>v.tasks.push(...un));toast(`اترحّلت ${un.length} مهمة لبكرة`)}
function focusSheet(){
  let m=25,end=0,iv=0;const f=s=>p2(Math.floor(s/60))+":"+p2(s%60),out=h("div",{class:"ftime"},f(m*60)),go=h("button",{class:"btn primary"},"ابدأ"),
  stop=()=>{clearInterval(iv);iv=0;go.textContent="ابدأ"},
  tick=()=>{const s=Math.max(0,Math.round((end-Date.now())/1000));out.textContent=f(s);if(!s){stop();out.textContent=f(m*60);const k=todayKey(),n=m;S.update(st=>{st.focus=st.focus||{};st.focus[k]=(st.focus[k]||0)+n});toast(`خلّصت ${n} دقيقة تركيز — برافو`)}},
  ch=h("div",{class:"fchips"},...[15,25,45,60].map(x=>h("button",{type:"button",class:"pick fc"+(x===m?" on":""),onclick:e=>{if(iv)return;m=x;out.textContent=f(m*60);ch.querySelectorAll(".fc").forEach(b=>b.classList.toggle("on",b===e.currentTarget))}},x+" د")));
  go.onclick=()=>{if(iv){stop();out.textContent=f(m*60);return}end=Date.now()+m*6e4;iv=setInterval(tick,500);go.textContent="إيقاف";tick()};
  sheet(h("h3",{},"مؤقّت التركيز"),out,ch,go,h("small",{class:"muted"},"سيب الصفحة مفتوحة لحد ما الوقت يخلص؛ بعدها الدقايق بتتضاف لإجمالي التركيز في الصفحة الرئيسية."))}
function todayCard(){
  const k=todayKey(),v=S.get().days[k]||{tasks:[]},inp=h("input",{id:"qIn",placeholder:"أضف مهمة لليوم...","aria-label":"مهمة جديدة لليوم"}),dn=v.tasks.filter(t=>t.done).length;
  const add=e=>{e.preventDefault();const t=inp.value.trim();if(!t)return;S.editDay(k,d=>d.tasks.push({id:S.uid(),text:t,done:false}));requestAnimationFrame(()=>document.getElementById("qIn")?.focus())};
  return h("section",{class:"card today"},h("div",{class:"th"},h("b",{},"خطة النهاردة"),h("small",{class:"muted"},dayLabel(k)),v.tasks.length?h("span",{class:"chip2"},`${dn} / ${v.tasks.length}`):null,h("button",{class:"btn fbtn",type:"button",onclick:focusSheet},"⏱ تركيز")),
    ...v.tasks.map(t=>taskRow(k,t)),v.tasks.length?null:h("p",{class:"muted"},"مفيش مهام لليوم — اكتب أول مهمة في الخانة اللي تحت واضغط ＋"),
    h("form",{class:"addrow",onsubmit:add},inp,h("button",{class:"btn primary","aria-label":"إضافة"},"＋")),v.tasks.some(t=>!t.done)?h("button",{class:"btn carry",type:"button",onclick:()=>carry(k)},"رحّل غير المنجز لبكرة ←"):null);
}
function addSubject(){
  const ar=h("input",{placeholder:"اسم المادة",required:true}),en=h("input",{placeholder:"Subject name (اختياري)",dir:"ltr"});
  let ic=S.ICONS[S.get().subjects.length%S.ICONS.length],touched=false;
  const pk=h("div",{class:"picks"}),draw=()=>pk.replaceChildren(...GLYPH_KEYS().map(e=>h("button",{type:"button",class:"pick"+(e===ic?" on":""),"aria-label":"أيقونة",onclick:()=>{ic=e;touched=true;draw()}},glyph(e))));
  const auto=()=>{if(touched)return;const g=guessIcon(ar.value,en.value);if(g&&g!==ic){ic=g;draw()}};ar.oninput=en.oninput=auto;draw();
  sheet(h("h3",{},"مادة جديدة"),h("form",{class:"stack",onsubmit:e=>{e.preventDefault();const n=ar.value.trim();if(!n)return;
    const id=S.uid(),e2=en.value.trim();S.update(s=>s.subjects.push({id,ar:n,en:e2,icon:ic,auto:!touched,color:S.PALETTE[s.subjects.length%S.PALETTE.length],chapters:[]}));closeSheet();if(!touched&&!guessIcon(n,e2))onlineIcon(n,e2).then(i=>i&&S.update(s=>{const x=find(s,id);if(x&&x.auto)x.icon=i}))}},ar,en,h("small",{class:"muted"},"الأيقونة بتتختار تلقائيًا من اسم المادة (ولو النت شغال بنبحث عن أنسب واحدة). لو اخترت أيقونة بنفسك هتتثبّت ومش هتتغيّر."),pk,h("button",{class:"btn primary"},"إضافة")));
  ar.focus();
}
export function subject(id){
  const s=find(S.get(),id);
  if(!s)return h("div",{class:"view"},h("p",{class:"muted"},"المادة مش موجودة."),h("a",{class:"btn",href:"#/"},"الرئيسية"));
  const{d,a}=cnt(s),inp=h("input",{id:"addIn",placeholder:"المهمة الجديدة","aria-label":"المهمة"});
  const edit=fn=>S.update(st=>fn(find(st,id)));
  return h("div",{class:"view"},h("a",{class:"back",href:"#/"},"→ كل المواد"),
    h("header",{class:"shead",style:`--h:${hue(s)}`},h("div",{class:"ico"},glyph(s.icon)),h("div",{class:"grow"},h("h1",{},s.ar),h("div",{class:"en"},s.en),h("small",{class:"muted"},`${d} من ${a} خلصت`),s.exam?h("div",{class:"exam"},pace(s)):null),ring(pct(d,a),68,"var(--sc)",7)),
    h("form",{class:"addrow",onsubmit:e=>{e.preventDefault();const v=inp.value.trim();if(!v)return;edit(x=>x.chapters.push({id:S.uid(),name:v,done:false}));requestAnimationFrame(()=>document.getElementById("addIn")?.focus())}},inp,h("button",{class:"btn primary"},"＋ إضافة")),
    s.chapters.length?h("ul",{class:"list"},...s.chapters.map(c=>h("li",{class:"row"+(c.done?" done":"")},
      h("label",{},h("input",{type:"checkbox",checked:c.done,onchange:e=>edit(x=>{x.chapters.find(y=>y.id===c.id).done=e.target.checked})}),h("span",{},c.name)),
      h("button",{class:"icon",title:"تعديل",onclick:()=>editTask(id,c)},"✎"),h("button",{class:"icon",title:"حذف المهمة",onclick:()=>{const i=s.chapters.indexOf(c);edit(x=>{x.chapters.splice(i,1)});toast("اتحذفت المهمة",()=>edit(x=>{x.chapters.splice(i,0,c)}))}},"✕")))):h("p",{class:"empty"},"لسه مفيش مهام في المادة دي — اكتب اسم أول مهمة في الخانة فوق واضغط إضافة."),
    h("button",{class:"btn",onclick:()=>editSubject(s)},"تعديل المادة"),h("button",{class:"btn danger",onclick:()=>{if(confirm("تحذف المادة وكل المهام اللي جواها؟")){S.update(st=>{st.subjects=st.subjects.filter(x=>x.id!==id)});location.hash="#/"}}},"حذف المادة"));
}
export function calendar(ym){
  const n=new Date();let[y,m]=(ym||`${n.getFullYear()}-${n.getMonth()+1}`).split("-").map(Number);m-=1;
  const st=S.get(),first=new Date(y,m,1),off=(first.getDay()+1)%7,len=new Date(y,m+1,0).getDate(),tk=todayKey();
  const go=dm=>{const d=new Date(y,m+dm,1);location.hash=`#/cal/${d.getFullYear()}-${d.getMonth()+1}`};
  const fmt=(o,d=first)=>d.toLocaleDateString("ar-EG-u-nu-latn",o);
  const done=Object.entries(st.days).filter(([k,v])=>k.startsWith(`${y}-${p2(m+1)}-`)&&v.done).length;
  const cells=[...Array(off).fill(null).map(()=>h("i",{class:"cell off"}))];
  for(let d=1;d<=len;d++){const k=key(y,m,d),v=st.days[k]||{};
    cells.push(h("button",{class:"cell"+(v.done?" done":"")+(k===tk?" today":""),onclick:()=>openDay(k,fmt({weekday:"long",day:"numeric",month:"long"},new Date(y,m,d)))},h("b",{},d),v.done?h("em",{},"✓"):v.tasks?.length?h("u",{}):null))}
  return h("div",{class:"view"},h("header",{class:"mhead"},h("button",{class:"icon",onclick:()=>go(-1),"aria-label":"الشهر السابق"},"‹"),h("div",{class:"grow"},h("h1",{},fmt({month:"long",year:"numeric"})),h("small",{class:"muted"},`${done} من ${len} يوم منجز`)),h("button",{class:"icon",onclick:()=>go(1),"aria-label":"الشهر التالي"},"›")),
    h("div",{class:"cal"},...["سبت","أحد","اثنين","ثلاثاء","أربعاء","خميس","جمعة"].map(x=>h("span",{class:"dn"},x)),...cells),
    h("p",{class:"muted hint"},"اضغط على أي يوم في التقويم لفتح مهامه وإضافة مهام جديدة، أو أضف مهمة بتاريخ معيّن من جدول مهام الشهر تحت."),taskTable(y,m));
}
const dayLabel=k=>new Date(k+"T00:00").toLocaleDateString("ar-EG-u-nu-latn",{weekday:"long",day:"numeric",month:"long"});
let pickD="";
function taskRow(k,t){
  return h("div",{class:"tkr"+(t.done?" done":"")},h("label",{},h("input",{type:"checkbox",checked:t.done,onchange:e=>S.editDay(k,d=>{d.tasks.find(x=>x.id===t.id).done=e.target.checked})}),h("span",{},t.text)),
    h("button",{class:"icon",title:"تعديل","aria-label":"تعديل",onclick:()=>editDayTask(k,t)},"✎"),
    h("button",{class:"icon",title:"حذف","aria-label":"حذف",onclick:()=>{const i=S.get().days[k].tasks.findIndex(x=>x.id===t.id);S.editDay(k,d=>{d.tasks.splice(i,1)});toast("اتحذفت المهمة",()=>S.editDay(k,d=>{d.tasks.splice(i,0,t)}))}},"✕"));
}
function editDayTask(k,t){const n=h("input",{value:t.text,required:true});
  sheet(h("h3",{},"تعديل المهمة"),h("form",{class:"stack",onsubmit:e=>{e.preventDefault();const x=n.value.trim();if(!x)return;S.editDay(k,d=>{d.tasks.find(y=>y.id===t.id).text=x});closeSheet()}},n,h("button",{class:"btn primary"},"حفظ")));n.focus()}
function taskTable(y,m){
  const st=S.get(),pre=`${y}-${p2(m+1)}-`,ks=Object.keys(st.days).filter(k=>k.startsWith(pre)&&st.days[k].tasks.length).sort();
  const all=ks.flatMap(k=>st.days[k].tasks),dn=all.filter(t=>t.done).length,tk=todayKey();
  const dIn=h("input",{type:"date",value:pickD.startsWith(pre)?pickD:tk.startsWith(pre)?tk:pre+"01","aria-label":"التاريخ",onchange:()=>{pickD=dIn.value}}),tIn=h("input",{id:"tkIn",placeholder:"مهمة جديدة","aria-label":"المهمة"});
  const add=e=>{e.preventDefault();const t=tIn.value.trim();if(!t||!dIn.value)return;pickD=dIn.value;S.editDay(dIn.value,d=>d.tasks.push({id:S.uid(),text:t,done:false}));requestAnimationFrame(()=>document.getElementById("tkIn")?.focus())};
  return h("section",{class:"tkt"},h("div",{class:"sec"},h("h2",{},"مهام الشهر"),h("small",{class:"muted"},all.length?`${dn} من ${all.length}`:"")),
    h("form",{class:"tkadd",onsubmit:add},dIn,tIn,h("button",{class:"btn primary"},"＋ إضافة")),
    ks.length?h("div",{class:"tkg"},h("div",{class:"tkh"},h("span",{},"اليوم"),h("span",{},"التاريخ"),h("span",{},"المهمة")),
      ...ks.map(k=>{const d=new Date(k+"T00:00"),v=st.days[k],f=o=>d.toLocaleDateString("ar-EG-u-nu-latn",o);
        return h("div",{class:"tkd"+(k===tk?" today":"")+(v.done?" ok":"")},h("b",{class:"c1"},f({weekday:"long"})),h("span",{class:"c2"},f({day:"numeric",month:"short"})),
          h("div",{class:"c3"},...v.tasks.map(t=>taskRow(k,t)),h("button",{class:"btn tkplus",onclick:()=>openDay(k,dayLabel(k))},"＋ مهمة في اليوم ده")))}))
      :h("p",{class:"empty"},"لسه مفيش مهام في الشهر ده — أضف أول واحدة فوق."));
}
function openDay(k,label){
  const list=h("div",{class:"tkl"}),tIn=h("input",{placeholder:"أضف مهمة...","aria-label":"المهمة"}),manual=h("div");
  const draw=()=>{const v=S.get().days[k]||{tasks:[],done:false};list.replaceChildren(...v.tasks.map(t=>taskRow(k,t)));
    manual.replaceChildren(v.tasks.length?h("small",{class:"muted"},`${v.tasks.filter(t=>t.done).length} من ${v.tasks.length} خلصت — اليوم بيتعلّم منجز لما كل المهام تخلص`):h("label",{class:"check"},h("input",{type:"checkbox",checked:v.done,onchange:e=>S.editDay(k,d=>{d.done=e.target.checked})}),h("span",{},"خلصت يومي")))};
  S.subscribe(draw);draw();
  sheet(h("h3",{},label),list,manual,h("form",{class:"addrow",onsubmit:e=>{e.preventDefault();const t=tIn.value.trim();if(!t)return;S.editDay(k,d=>d.tasks.push({id:S.uid(),text:t,done:false}));tIn.value="";tIn.focus()}},tIn,h("button",{class:"btn primary"},"＋")),h("button",{class:"btn",onclick:closeSheet},"تم"));
}

const dleft=k=>Math.round((new Date(k+"T00:00")-new Date(todayKey()+"T00:00"))/864e5);
const examTxt=s=>{const n=dleft(s.exam);return n<0?"الامتحان عدّى":n===0?"الامتحان النهاردة":n===1?"الامتحان بكرة":`الامتحان بعد ${n} يوم`};
const pace=s=>{const n=dleft(s.exam),r=s.chapters.filter(c=>!c.done).length;return examTxt(s)+(n>0&&r?` · محتاج ${Math.ceil(r/n)} مهمة في اليوم`:"")};
const streak=days=>{let n=0;const d=new Date(),k=()=>key(d.getFullYear(),d.getMonth(),d.getDate());if(!days[k()]?.done)d.setDate(d.getDate()-1);while(days[k()]?.done){n++;d.setDate(d.getDate()-1)}return n};
const PICK0=["⚗️","🩸","🔬","📘","🦠","🧫","🧪","🧠","📝","🧬","📚","📖"];
function editTask(id,c){
  const n=h("input",{value:c.name,required:true});
  sheet(h("h3",{},"تعديل المهمة"),h("form",{class:"stack",onsubmit:e=>{e.preventDefault();const v=n.value.trim();if(!v)return;S.update(st=>{find(st,id).chapters.find(y=>y.id===c.id).name=v});closeSheet()}},n,h("button",{class:"btn primary"},"حفظ")));
  n.focus();
}
function editSubject(s){
  const ar=h("input",{value:s.ar,required:true}),en=h("input",{value:s.en,dir:"ltr",placeholder:"Subject name"}),ex=h("input",{type:"date",value:s.exam||""});let ic=s.icon;
  const pk=h("div",{class:"picks"},...GLYPH_KEYS().map(e=>h("button",{type:"button",class:"pick"+(e===ic?" on":""),onclick:ev=>{ic=e;pk.querySelectorAll(".pick").forEach(b=>b.classList.toggle("on",b===ev.currentTarget))}},glyph(e))));
  sheet(h("h3",{},"تعديل المادة"),h("form",{class:"stack",onsubmit:e=>{e.preventDefault();const v=ar.value.trim();if(!v)return;S.update(st=>Object.assign(find(st,s.id),{ar:v,en:en.value.trim(),icon:ic,exam:ex.value,auto:ic===s.icon&&s.auto}));closeSheet()}},ar,en,pk,h("label",{class:"lab"},"موعد الامتحان (اختياري)",ex),h("button",{class:"btn primary"},"حفظ")));
}

const ICN={print:'<path d="M7 9V3h10v6M7 17H5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2"/><rect x="7" y="14" width="10" height="7" rx="1"/>',down:'<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',up:'<path d="M12 16V5M7 9l5-5 5 5M5 20h14"/>',off:'<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8 12h8"/>',reset:'<path d="M4 12a8 8 0 1 0 3-6.2M4 4v4h4"/>',msg:'<path d="M4 5h16v11H10l-5 4v-4H4z"/><path d="M8 9h8M8 12h5"/>'};
const aic=k=>{const e=h("span",{class:"aic"});e.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICN[k]}</svg>`;return e};
const act=(k,t,s,fn,cls="")=>{const link=typeof fn==="string";return h(link?"a":"button",{class:"act "+cls,...(link?{href:fn}:{onclick:fn})},aic(k),h("div",{class:"grow"},h("b",{},t),h("small",{},s)))};
export function dataPage(){
  const fi=h("input",{type:"file",accept:".json,application/json",hidden:true,onchange:e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{S.importJSON(r.result);toast("تم استرجاع بياناتك")}catch{toast("ملف النسخة الاحتياطية غير صالح")}};r.readAsText(f);e.target.value=""}});
  const st=S.get(),nt=st.subjects.reduce((a,s)=>a+s.chapters.length,0),nd=Object.values(st.days).filter(x=>x.done).length;
  const backup=()=>{const u=URL.createObjectURL(new Blob([S.exportJSON()],{type:"application/json"})),a=h("a",{href:u,download:"todo-backup.json"});document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000)};
  return h("div",{class:"view"},h("div",{},h("h1",{},"البيانات"),h("p",{class:"muted"},`${st.subjects.length} مواد · ${nt} مهمة · ${nd} يوم منجز — كل ده محفوظ على جهازك بس`)),
    h("div",{class:"sec"},h("h2",{},"طباعة")),
    h("div",{class:"acts"},act("print","تقرير الشهر للطباعة","ورقة A4 فيها نسبة إنجاز كل مادة، وجدول أيام الشهر، ومساحات فاضية تكتب فيها بالقلم — اطبعها أو احفظها كملف PDF","#/print","feat")),
    h("div",{class:"sec"},h("h2",{},"حفظ واسترجاع بياناتك")),
    h("div",{class:"acts"},act("down","تنزيل نسخة من بياناتك","بيتحمّل ملف todo-backup.json فيه كل موادك ومهامك؛ احتفظ بيه علشان ترجّع بياناتك لو غيّرت الجهاز",backup),act("up","استرجاع من نسخة","اختار ملف todo-backup.json اللي نزّلته قبل كده، وبياناتك هترجع زي ما كانت",()=>fi.click())),
    ...(navigator.serviceWorker?.controller?[h("div",{class:"sec"},h("h2",{},"تحديث التطبيق")),h("div",{class:"acts"},act("reset","تحديث التطبيق الآن","التطبيق مابيتحدّثش لوحده أبدًا؛ اضغط هنا بس لما تعرف إن فيه نسخة جديدة. بياناتك مش بتتأثر",refreshApp))]:[]),
    h("div",{class:"sec"},h("h2",{},"تنظيف وإعادة ضبط")),
    h("div",{class:"acts"},act("off","إلغاء كل العلامات","بتشيل علامة الصح من كل مهام المواد، والمهام نفسها مش بتتحذف",()=>S.update(s=>s.subjects.forEach(x=>x.chapters.forEach(c=>c.done=false)))),act("reset","إعادة ضبط كامل","بيمسح كل موادك ومهامك وجدول الأيام، ويرجّع قائمة المواد الأساسية زي أول مرة",()=>confirm("هترجع القائمة الأساسية وتمسح كل المهام والجدول؟")&&S.reset(),"danger")),fi);
}
const pmark=()=>{const e=h("span",{class:"pm"});e.innerHTML='<svg viewBox="96 72 320 368" width="34" height="40" fill="none" aria-hidden="true"><rect x="122" y="99" width="268" height="316" rx="64" stroke="#0B4F49" stroke-width="16"/><g fill="#0B4F49"><rect x="164" y="154" width="42" height="42" rx="10"/><rect x="164" y="236" width="42" height="42" rx="10"/><rect x="236" y="164" width="112" height="22" rx="11"/><rect x="236" y="246" width="84" height="22" rx="11"/><rect x="236" y="328" width="100" height="22" rx="11"/></g><path d="M174 176l8 8 14-16M174 258l8 8 14-16" stroke="#ffffff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><rect x="168" y="322" width="34" height="34" rx="7" stroke="#0B4F49" stroke-width="8"/></svg>';return e};
export function printPage(ym){
  const n=new Date();let[y,m]=(ym||`${n.getFullYear()}-${n.getMonth()+1}`).split("-").map(Number);m-=1;
  const st=S.get(),len=new Date(y,m+1,0).getDate(),ar=(o,d)=>d.toLocaleDateString("ar-EG-u-nu-latn",o),mon=ar({month:"long",year:"numeric"},new Date(y,m,1));
  const go=dm=>{const d=new Date(y,m+dm,1);location.hash=`#/print/${d.getFullYear()}-${d.getMonth()+1}`};
  const t=st.subjects.reduce((a,s)=>{const c=cnt(s);return{d:a.d+c.d,a:a.a+c.a}},{d:0,a:0}),P=pct(t.d,t.a);
  const doneN=Object.entries(st.days).filter(([k,v])=>k.startsWith(`${y}-${p2(m+1)}-`)&&v.done).length;
  const bx=on=>h("i",{class:"bx"+(on?" on":"")}),lines=k=>h("div",{class:"lines"},...Array.from({length:k},()=>h("i")));
  const th=a=>h("tr",{},...a.map(x=>h("th",{},x))),sec=(ttl,...k)=>h("section",{},h("h2",{},ttl),...k);
  const bar=(p,c="")=>h("div",{class:"bar "+c},h("i",{style:`width:${p}%`})),stat=(v,l)=>h("div",{class:"stat"},h("b",{},v),h("small",{},l));
  const blocks=st.subjects.map(s=>{const c=cnt(s);return{mm:27+Math.ceil(s.chapters.length/2)*5.2,el:h("div",{class:"sub"},h("div",{class:"subh"},h("h3",{},s.ar),bar(pct(c.d,c.a),"sm"),h("small",{},`${c.d} / ${c.a}`)),s.chapters.length?h("ul",{class:"two"},...s.chapters.map(x=>h("li",{},bx(x.done),x.name))):null,h("div",{class:"fld"},"مهام إضافية (بالقلم)",h("i")))}});
  const tp=[];let cur=[],used=0;
  for(let i=0;i<blocks.length;i+=2){const row=blocks.slice(i,i+2),mm=Math.max(...row.map(b=>b.mm));if(cur.length&&used+mm>150){tp.push(cur);cur=[];used=0}cur.push(...row.map(b=>b.el));used+=mm}
  if(cur.length)tp.push(cur);
  const subjRows=st.subjects.map(s=>{const c=cnt(s),p=pct(c.d,c.a);return h("tr",{},h("td",{},s.ar+(s.en?" — "+s.en:"")),h("td",{},`${c.d} / ${c.a}`),h("td",{},h("div",{class:"pcw"},bar(p,"sm"),h("span",{},p+"%"))),h("td",{},s.exam?ar({day:"numeric",month:"short"},new Date(s.exam+"T00:00")):""),h("td",{class:"bl"}))});
  const dayRows=Array.from({length:len},(_,i)=>{const d=new Date(y,m,i+1),v=st.days[key(y,m,i+1)]||{},g=d.getDay();return h("tr",{class:g===5||g===6?"we":""},h("td",{},i+1),h("td",{},ar({weekday:"long"},d)),h("td",{},(v.tasks||[]).map(t=>(t.done?"✓ ":"")+t.text).join(" • ")),h("td",{style:"text-align:center"},bx(v.done)),h("td",{class:"bl"}))});
  const pages=[
    [h("header",{class:"rh"},h("div",{class:"rb"},pmark(),h("div",{},h("b",{},"To Do"),h("small",{},"تقرير المتابعة"))),h("div",{class:"rm"},h("b",{},mon),h("small",{},"تاريخ الطباعة: "+ar({day:"numeric",month:"long",year:"numeric"},n)))),
     h("div",{class:"fld"},"الاسم",h("i"),"الفترة",h("i")),
     h("div",{class:"stats"},stat(`${t.d} / ${t.a}`,"مهام منجزة"),stat(P+"%","نسبة الإنجاز"),stat(`${doneN} / ${len}`,"أيام منجزة في الشهر")),bar(P),
     sec("المواد",h("table",{},th(["المادة","منجز / الكل","التقدم","الامتحان","ملاحظات"]),...subjRows)),
     sec("أهداف الشهر (اكتبها بالقلم)",lines(4))],
    ...tp.map((p,i)=>[sec("تفاصيل المهام"+(tp.length>1?` (${i+1}/${tp.length})`:""),h("div",{class:"subs"},...p))]),
    [sec("جدول "+mon,h("div",{class:"dgrid"},...[dayRows.slice(0,Math.ceil(len/2)),dayRows.slice(Math.ceil(len/2))].map(r=>h("table",{class:"dt"},th(["التاريخ","اليوم","الخطة","منجز","ملاحظات"]),...r))))],
    [sec("ملاحظات حرة",lines(18))]];
  return h("div",{class:"view"},
    h("div",{class:"ctl"},h("a",{class:"back",href:"#/data"},"→ البيانات"),h("div",{class:"mnav"},h("button",{class:"icon",onclick:()=>go(-1),"aria-label":"الشهر السابق"},"‹"),h("b",{},mon),h("button",{class:"icon",onclick:()=>go(1),"aria-label":"الشهر التالي"},"›")),h("small",{class:"muted"},`${pages.length} ورقة A4 عرضية — اضغط «طباعة / PDF»، واختار «حفظ كـ PDF»، ومن الخيارات اختار الاتجاه «أفقي (Landscape)» لو ظهر طولي.`),h("button",{class:"btn",type:"button",onclick:e=>{const on=document.documentElement.classList.toggle("rot");e.currentTarget.textContent=on?"التقرير ملفوف (دوس للإلغاء)":"الورقة طلعت طولي؟ لفّ التقرير"}},document.documentElement.classList.contains("rot")?"التقرير ملفوف (دوس للإلغاء)":"الورقة طلعت طولي؟ لفّ التقرير"),h("button",{class:"btn primary",onclick:()=>window.print()},"طباعة / PDF")),
    ...pages.map((p,k)=>h("article",{class:"paper"},...p,h("small",{class:"pf"},h("span",{},"To Do — "+mon),h("span",{},`ورقة ${k+1} من ${pages.length}`)))));
}
