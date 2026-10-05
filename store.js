// الحالة + الحفظ + الترحيل من النسخ القديمة
const KEY="chapters_app_v4",OLD=["flexible_chapter_todo_v3","flexible_chapter_month_oct_2026_v1"];
export const PALETTE=["#ffffff","#e5e5e5","#d4d4d4","#a3a3a3","#ffffff","#e5e5e5","#d4d4d4","#a3a3a3"];
export const ICONS=["📚","🧪","🧠","📝","🧬","📖"];
export const uid=()=>Math.random().toString(36).slice(2,9);
const SEED=[["الكيمياء الحيوية","Biochemistry","⚗️"],["علم الدم","Hematology","🩸"],["الأجهزة والأدوات المعملية","Medical Devices / TEC","🔬"],["اللغة الإنجليزية","English","📘"],["الطفيليات","Parasitology","🦠"],["الميكروبيولوجي","Microbiology","🧫"]];
const seed=()=>({subjects:SEED.map(([ar,en,icon],i)=>({id:uid(),ar,en,icon,color:PALETTE[i],chapters:[]})),days:{},focus:{}});
const DEMO=/[?&]demo/.test(location.search);
// بيانات تجريبية لصور الهاتف في صفحة التنزيل (?demo) — مابتتحفظش ومابتلمسش بيانات المستخدم
function demo(){const n=new Date(),k=o=>{const d=new Date(n);d.setDate(d.getDate()+o);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`},
 ch=(a,b)=>[...a.map(x=>({id:uid(),name:x,done:true})),...b.map(x=>({id:uid(),name:x,done:false}))],
 T=(...a)=>({tasks:a.map(([text,done])=>({id:uid(),text,done})),done:a.every(x=>x[1])});
 const subjects=[["الكيمياء الحيوية","Biochemistry","⚗",ch(["الكربوهيدرات","البروتينات","الإنزيمات","الدهون"],["الأحماض النووية"]),k(12)],["علم الدم","Hematology","🩸",ch(["مكونات الدم","فصائل الدم"],["الأنيميا","اضطرابات التجلط"]),k(20)],["الميكروبيولوجي","Microbiology","🧫",ch(["البكتيريا"],["الفيروسات","الفطريات","التعقيم"]),""],["الطفيليات","Parasitology","🦠",ch(["الأوليات","الديدان"],["الحشرات"]),""],["اللغة الإنجليزية","English","📘",ch(["Unit 1","Unit 2","Unit 3"],["Unit 4"]),""],["الأجهزة المعملية","Medical Devices","🔬",ch(["الميكروسكوب"],["السنترفيوج","الـ Spectrophotometer"]),""]].map(([ar,en,icon,chapters,exam])=>({ar,en,icon,chapters,exam,auto:false,color:"#ffffff"}));
 const days={[k(0)]:T(["مراجعة فصل الإنزيمات",true],["حل أسئلة علم الدم",true],["ملخص الطفيليات",false],["Unit 4 — كلمات جديدة",false]),[k(-1)]:T(["الأحماض النووية",true],["مراجعة سريعة",true]),[k(-2)]:T(["حل امتحان تجريبي",true]),[k(-3)]:T(["مذاكرة الميكروبيولوجي",true]),[k(-5)]:T(["ملخص الدم",true]),[k(1)]:T(["معمل الميكروبيولوجي",false],["مراجعة الأجهزة",false]),[k(3)]:T(["امتحان تجريبي",false]),[k(6)]:T(["مراجعة الكيمياء الحيوية",false])};
 return{subjects,days,focus:{[k(0)]:50,[k(-1)]:75}}}
const color=c=>/^#[0-9a-f]{3,8}$/i.test(c)?c:"#ffffff";
function normalize(s){
  const days={};
  for(const[k,v]of Object.entries(s.days||{})){if(!v||typeof v!=="object")continue;const t=Array.isArray(v.tasks)?v.tasks.map(x=>({id:x.id||uid(),text:String(x.text||""),done:!!x.done})).filter(x=>x.text):String(v.note||"").split(/\n+/).map(x=>x.trim()).filter(Boolean).map(x=>({id:uid(),text:x,done:!!v.done}));const d={tasks:t,done:t.length?t.every(x=>x.done):!!v.done};if(t.length||d.done)days[k]=d}
  return{focus:Object.fromEntries(Object.entries(s.focus||{}).filter(([k,v])=>/^\d{4}-\d{2}-\d{2}$/.test(k)&&v>0).map(([k,v])=>[k,Math.round(+v)])),subjects:(s.subjects||[]).filter(x=>x&&typeof x.ar==="string").map(x=>({id:x.id||uid(),ar:x.ar,en:String(x.en||""),icon:String(x.icon||"📚"),auto:x.auto!==false,color:color(x.color),exam:/^\d{4}-\d{2}-\d{2}$/.test(x.exam)?x.exam:"",chapters:(x.chapters||[]).map(c=>({id:c.id||uid(),name:String(c.name||"Task"),done:!!c.done}))})),days};
}
const fromOld=md=>Object.fromEntries(Object.entries(md||{}).map(([d,v])=>[`2026-10-${String(d).padStart(2,"0")}`,v]));
function load(){
  if(DEMO)return normalize(demo());
  try{const r=localStorage.getItem(KEY);if(r){const s=JSON.parse(r);if(s&&Array.isArray(s.subjects))return normalize(s)}}catch{}
  try{const sub=JSON.parse(localStorage.getItem(OLD[0]));if(Array.isArray(sub))return normalize({subjects:sub,days:fromOld(JSON.parse(localStorage.getItem(OLD[1])||"{}"))})}catch{}
  return seed();
}
let state=load();const subs=new Set();
export const get=()=>state;
export const subscribe=f=>subs.add(f);
export function update(fn){fn(state);if(!DEMO)try{localStorage.setItem(KEY,JSON.stringify(state))}catch{alert("المتصفح منع الحفظ التلقائي. نزّل نسخة احتياطية.")}subs.forEach(f=>f())}
export function editDay(k,fn){update(s=>{const v=s.days[k]||{tasks:[],done:false};fn(v);if(v.tasks.length)v.done=v.tasks.every(t=>t.done);if(!v.tasks.length&&!v.done)delete s.days[k];else s.days[k]=v})}
export const reset=()=>update(s=>Object.assign(s,seed()));
export const exportJSON=()=>JSON.stringify({version:5,updatedAt:new Date().toISOString(),...state},null,2);
export function importJSON(text){
  const d=JSON.parse(text),items=Array.isArray(d)?d:d.subjects;
  if(!Array.isArray(items)||!items.every(s=>s&&typeof s.ar==="string"&&Array.isArray(s.chapters)))throw new Error("invalid");
  const n=normalize({subjects:items,days:d.days||fromOld(d.monthDays),focus:d.focus});update(s=>Object.assign(s,n));
}
