/**
 * BB-Bounce Service Worker
 * Enables offline gameplay and faster loading through caching
 */

const CACHE_NAME = 'bb-bounce-v1.2.0';
const OFFLINE_CACHE = 'bb-bounce-offline-v1';

// Assets to cache immediately on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Assets to cache on first use (Network First strategy)
const DYNAMIC_CACHE_URLS = [
  '/api/scores'
];

/**
 * Install Event - Cache core assets
 */
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Precaching core assets');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

/**
 * Activate Event - Clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            // Delete old caches
            return cacheName.startsWith('bb-bounce-') && cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE;
          })
          .map((cacheName) => {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => self.clients.claim()) // Take control immediately
  );
});

/**
 * Fetch Event - Serve from cache when possible
 * Strategy: Cache First for static assets, Network First for API calls
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // API requests: Network First (with cache fallback)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      networkFirstStrategy(request)
    );
    return;
  }

  // Static assets: Cache First (with network fallback)
  event.respondWith(
    cacheFirstStrategy(request)
  );
});

/**
 * Cache First Strategy
 * Try cache first, fall back to network
 * Best for static assets that don't change often
 */
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    console.log('[Service Worker] Serving from cache:', request.url);
    return cachedResponse;
  }

  try {
    console.log('[Service Worker] Fetching from network:', request.url);
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] Fetch failed:', error);

    // Return offline page if available
    const offlineResponse = await caches.match('/offline.html');
    if (offlineResponse) {
      return offlineResponse;
    }

    // Return a basic response
    return new Response('Offline - Please check your connection', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({ 'Content-Type': 'text/plain' })
    });
  }
}

/**
 * Network First Strategy
 * Try network first, fall back to cache
 * Best for dynamic content like API calls
 */
async function networkFirstStrategy(request) {
  try {
    console.log('[Service Worker] Fetching API from network:', request.url);
    const networkResponse = await fetch(request);

    // Cache successful API responses
    if (networkResponse.ok) {
      const cache = await caches.open(OFFLINE_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network failed, trying cache:', request.url);

    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      console.log('[Service Worker] Serving API from cache (offline)');
      return cachedResponse;
    }

    // Return empty leaderboard for offline mode
    return new Response(JSON.stringify({
      scores: [],
      message: 'Offline - leaderboard unavailable'
    }), {
      status: 200,
      headers: new Headers({ 'Content-Type': 'application/json' })
    });
  }
}

/**
 * Background Sync (future enhancement)
 * Queue score submissions when offline
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-scores') {
    console.log('[Service Worker] Background sync triggered');
    // Future: Implement score submission queue
  }
});

/**
 * Push Notifications (future enhancement)
 * Notify users about leaderboard changes
 */
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');
  // Future: Implement push notifications
});

console.log('[Service Worker] Loaded successfully');
