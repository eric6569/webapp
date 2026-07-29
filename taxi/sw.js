// 每次 index.html 有更新並準備部署時，這個版本號要跟著遞增，
// 否則 Service Worker 會一直用舊快取，使用者連上網路也拿不到新版本。
const CACHE_NAME = 'taxi-meter-v1';
const CACHED_URLS = ['./index.html', './manifest.json', './icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CACHED_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(names =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// network-first：有網路一律拿最新的並更新快取；離線時退回快取版本。
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, resClone));
        return res;
      })
      .catch(() => caches.match(e.request).then(cached => cached || caches.match('./index.html')))
  );
});
