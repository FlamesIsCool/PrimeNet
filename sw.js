/**
 * PrimeNet Service Worker
 * Enables PWA install and basic offline caching
 */

const CACHE_NAME = 'primenet-v1';
const STATIC_ASSETS = [
  '/index.html',
  '/movies.html',
  '/tv.html',
  '/search.html',
  '/watch.html',
  '/css/style.css',
  '/js/api.js',
  '/js/ui.js',
  '/js/home.js',
  '/js/browse.js',
  '/js/search.js',
  '/js/watch.js',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests for same-origin or static assets
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // For TMDB API requests: network first, no cache (live data needed)
  if (url.hostname === 'api.themoviedb.org') {
    event.respondWith(fetch(event.request));
    return;
  }

  // For TMDB images: cache first for performance
  if (url.hostname === 'image.tmdb.org') {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request).then((response) => {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          });
        })
      )
    );
    return;
  }

  // For local assets: cache first, fall back to network
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
