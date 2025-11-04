const CACHE_NAME = 'banduka-pos-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Note: esm.sh URLs are not pre-cached as they can change.
  // The fetch handler will cache them on first use.
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Let browser handle requests for extensions
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // If we have a response in cache, we return it.
      if (cachedResponse) {
        return cachedResponse;
      }

      // If not in cache, we fetch from the network.
      return fetch(event.request).then((networkResponse) => {
          // Check if we received a valid response to cache
          if (!networkResponse || !networkResponse.ok) {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            if (event.request.method === 'GET') {
              cache.put(event.request, responseToCache);
            }
          });
          return networkResponse;
        }).catch(error => {
          console.error('[SW] Fetch failed; returning offline fallback if available.', error);
          // If a navigation request fails, and we have no cache, we serve the main page.
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          // For other failed requests, we can't do much, so let the error propagate.
        });
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});