const CACHE_NAME = 'tagly-ai-offline-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/src/style.css',
    '/src/main.js',
    // In production, Vite bundles these to dist/, but we cache the root
    // We'll also cache the API response dynamically.
];

// Install Event
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[ServiceWorker] Pre-caching offline assets');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(
                keyList.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log('[ServiceWorker] Removing old cache', key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch Event (Network First, fallback to cache for data; Cache First for assets)
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // If it's an API request, do Network First, then Cache
    if (url.pathname.startsWith('/api/') || url.hostname.includes('api.')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    const resClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, resClone);
                    });
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Default: Stale While Revalidate for regular assets
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, networkResponse.clone());
                });
                return networkResponse;
            }).catch(() => {
                // Ignored, just use cache
            });
            return cachedResponse || fetchPromise;
        })
    );
});
