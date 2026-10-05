// بدون تحديث تلقائي: الكاش اسمه ثابت، فالتطبيق مابيتغيّرش لوحده أبدًا.
// التحديث بيحصل بس لما المستخدم يضغط «تحديث التطبيق الآن» من صفحة البيانات.
const C="todo-app",F=["./","./config.js","./contact.js","./index.html","./download.html","./styles.css","./main.js","./store.js","./ui.js","./timer.js","./views.js","./manifest.webmanifest","./icon-192.png","./icon-512.png","./icon-maskable-512.png","./apple-touch-icon.png","./favicon.svg"];
self.addEventListener("install",e=>e.waitUntil(caches.open(C).then(c=>Promise.all(F.map(u=>c.match(u).then(m=>m||c.add(u)).catch(()=>{}))))));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x))))));
self.addEventListener("fetch",e=>{const r=e.request;if(r.method!=="GET"||!r.url.startsWith("http"))return;
e.respondWith(caches.match(r,{ignoreSearch:true}).then(m=>m||fetch(r).then(x=>{if(x.ok&&new URL(r.url).origin===location.origin){const c=x.clone();caches.open(C).then(k=>k.put(r,c))}return x}).catch(()=>caches.match("./index.html"))))});
