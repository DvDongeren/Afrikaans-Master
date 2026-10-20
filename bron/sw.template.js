/* Service worker van Afrikaans Master: offline werken en snel laden.
   Bestanden met een versiecode in de naam worden bewaard; de startpagina wordt eerst online opgehaald. */
const VERSION='__VERSION__';
const CACHE='am-'+VERSION;
const PRECACHE=__PRECACHE__;
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(PRECACHE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{
  const keys=(await caches.keys()).filter(k=>k.startsWith('am-')&&k!==CACHE).sort();
  // bewaar de vorige versie nog even, zodat een open tabblad niet halverwege bestanden mist
  for(const k of keys.slice(0,-1))await caches.delete(k);
  await self.clients.claim()})())});
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==location.origin||u.pathname.startsWith('/__/')||u.pathname==='/config.json')return;
  if(r.mode==='navigate'){e.respondWith((async()=>{try{const n=await fetch(r);if(n.ok&&(u.pathname==='/'||u.pathname==='/index.html')){const c=await caches.open(CACHE);c.put('/',n.clone())}return n}
    catch(err){return (await caches.match(u.pathname==='/privacy.html'?'/privacy.html':'/'))||Response.error()}})());return}
  if(/^\/(assets|data)\//.test(u.pathname)||PRECACHE.includes(u.pathname)){e.respondWith((async()=>{const hit=await caches.match(r);if(hit)return hit;
    const n=await fetch(r);if(n.ok){const c=await caches.open(CACHE);c.put(r,n.clone())}return n})())}});
