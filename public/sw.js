/*
 * Apostellō service worker.
 *
 * Deliberately small. Its only job is to make sure the hub and the kiosk still
 * OPEN when the trailer's Wi-Fi drops — the actual offline writes are handled
 * by the IndexedDB outbox in the app, not here.
 *
 * It never touches Supabase or anything but GET, so a queued stamp can never
 * be served a stale response or replayed by the cache.
 */

const VERSION = 'apostello-v1';
const SHELL = `${VERSION}-shell`;
const ASSETS = `${VERSION}-assets`;

const OFFLINE_URL = '/offline';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => cache.addAll([OFFLINE_URL, '/manifest.webmanifest']))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

function isSupabase(url) {
  return url.hostname.endsWith('.supabase.co');
}

function isImmutableAsset(url) {
  return url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/_next/image');
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (isSupabase(url)) return;
  if (url.pathname.startsWith('/api/')) return;

  // Build output is content-hashed, so it is safe to serve from cache forever.
  if (isImmutableAsset(url)) {
    event.respondWith(
      caches.open(ASSETS).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      }),
    );
    return;
  }

  // Pages: always try the network first so staff never see stale numbers, and
  // fall back to the last good copy, then to the offline page.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          if (response.ok) {
            const cache = await caches.open(SHELL);
            cache.put(request, response.clone());
          }
          return response;
        } catch {
          const cache = await caches.open(SHELL);
          return (
            (await cache.match(request)) ??
            (await cache.match(OFFLINE_URL)) ??
            new Response('Offline', { status: 503, headers: { 'content-type': 'text/plain' } })
          );
        }
      })(),
    );
  }
});
