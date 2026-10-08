/* 夜不收 离线缓存。代码网络优先，图片缓存优先。 */
const VER = 'yebushou-v1';
const SHELL = ['./', './index.html', './site.webmanifest', './favicon.ico', './icon/icon-192.png', './icon/icon-512.png', './icon/icon-180.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VER).then(c => c.addAll(SHELL)));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VER).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); });

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // 模型接口等外部请求不碰
  const isImg = /\.(png|jpg|jpeg|webp|gif|svg|ico|icns)$/i.test(url.pathname);
  if (isImg) {
    e.respondWith(caches.open(VER).then(async c => {
      const hit = await c.match(req);
      const net = fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  e.respondWith(caches.open(VER).then(async c => {
    try {
      const r = await fetch(req);
      if (r.ok) c.put(req, r.clone());
      return r;
    } catch (err) {
      const hit = await c.match(req) || (req.mode === 'navigate' ? await c.match('./index.html') : null);
      if (hit) return hit;
      throw err;
    }
  }));
});
