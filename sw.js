const CACHE_NAME = 'portfolio-v2';
const CORE_ASSETS = [
  './',
  './index.html',
  './portfolio-system.css',
  './portfolio-refinement.css',
  './portfolio-system.js',
  './letter.html',
  './me.html',
  './data.html',
  './product.html',
  './Facebeauty.html',
  './growth.html',
  './content.html',
  './assets/letter.webp',
  './assets/seal.webp'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin || request.destination === 'video') return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
      return response;
    }).catch(() => caches.match(request).then(hit => hit || caches.match('./index.html'))));
    return;
  }

  event.respondWith(caches.match(request).then(hit => {
    const network = fetch(request).then(response => {
      if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
      return response;
    });
    return hit || network;
  }));
});
