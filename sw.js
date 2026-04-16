const CACHE_NAME = 'oradores-pro-v3';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icon-512.png'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(
    keys.map(k => k !== CACHE_NAME ? caches.delete(k) : null)
  )));
});

self.addEventListener('fetch', e => {
  // Ultra-passive: try network first, then cache
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
