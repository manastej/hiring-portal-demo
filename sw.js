// Service Worker for Manastej Staff PWA
const CACHE_NAME = 'manastej-staff-v11';
const ASSETS_TO_CACHE = [
  '/app',
  '/manifest.json',
  '/assets/workspace-theme.css',
  '/assets/workspace-clock.js',
  '/assets/workspace-logo.png',
  '/assets/sidebar_bottom_lotus.png',
  '/assets/sidebar_lotus_logo.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Network first with cache fallback for dynamic API, cache first for static assets
  if (e.request.url.includes('/api/')) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
  } else {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
  }
});

