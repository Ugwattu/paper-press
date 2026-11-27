/* Paper Press service worker. Registered as sw.js?v=<APP_BUILD>, so every release gets fresh cache names and the old ones are deleted.
   - shell + fonts + MathJax + icons: precached at install, served cache-first (names are versioned, so they cannot go stale)
   - banks: precached, then stale-while-revalidate (instant offline start, picks up edited banks on the next load)
   Cross-origin requests (the MathJax CDN fallbacks) are never intercepted. */
'use strict';
const BUILD = new URL(self.location.href).searchParams.get('v') || 'dev';
const SHELL_CACHE = 'pp-shell-' + BUILD, BANK_CACHE = 'pp-banks-' + BUILD;
const url = (p) => new URL(p, self.registration.scope).href;

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const res = await fetch(url('precache.json'), { cache: 'reload' });
    if (!res.ok) throw new Error('precache.json unavailable');
    const list = await res.json();
    const shell = await caches.open(SHELL_CACHE), banks = await caches.open(BANK_CACHE);
    await Promise.all([shell.addAll([...list.shell, ...list.assets].map((p) => new Request(url(p), { cache: 'reload' }))), banks.addAll(list.banks.map((p) => new Request(url(p), { cache: 'reload' })))]);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = new Set([SHELL_CACHE, BANK_CACHE]);
    for (const k of await caches.keys()) if (k.startsWith('pp-') && !keep.has(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});

async function staleWhileRevalidate(req) {
  const cache = await caches.open(BANK_CACHE), hit = await cache.match(req, { ignoreSearch: true });
  const refresh = fetch(req).then((res) => { if (res && res.ok) cache.put(new Request(req.url.split('?')[0]), res.clone()); return res; });
  if (hit) { refresh.catch(() => {}); return hit; }
  return refresh;
}
async function cacheFirst(req) {
  const hit = await caches.match(req, { ignoreSearch: true });
  if (hit) return hit;
  const res = await fetch(req);
  if (res && res.ok && req.method === 'GET') (await caches.open(SHELL_CACHE)).put(new Request(req.url.split('?')[0]), res.clone());
  return res;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (u.origin !== self.location.origin) return;
  if (u.pathname.endsWith('/sw.js')) return;
  if (req.mode === 'navigate') { event.respondWith((async () => (await caches.match(url('index.html'), { ignoreSearch: true })) || fetch(req))()); return; }
  if (/\/banks\/[^/]+\.json$/.test(u.pathname)) { event.respondWith(staleWhileRevalidate(req)); return; }
  event.respondWith(cacheFirst(req));
});
