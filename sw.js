// 更新を配信したら CACHE を変更(v2, v3 ...)すると、利用者側のキャッシュが入れ替わります。
const CACHE = 'anzan-drill-v8';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const put = (req, res) => { if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; };

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  const isHtml = req.mode === 'navigate' || url.pathname.endsWith('.html');
  // HTMLはネットワーク優先(更新がすぐ反映される)、オフライン時はキャッシュ。その他はキャッシュ優先。
  e.respondWith(isHtml
    ? fetch(req).then(r => put(req, r)).catch(() => caches.match(req).then(m => m || caches.match('./index.html')))
    : caches.match(req).then(m => m || fetch(req).then(r => put(req, r))));
});
