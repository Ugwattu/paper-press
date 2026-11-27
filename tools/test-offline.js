#!/usr/bin/env node
/* Offline readiness: self-hosted fonts/MathJax, precache list, and the service worker's behaviour (run against a mocked SW global). */
const fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto');
const root = path.join(__dirname, '..'), read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
let n = 0, fails = 0; const ok = (c, m) => { n++; if (c) console.log('PASS ' + m); else { fails++; console.error('FAIL ' + m); } };
const html = read('index.html'), core = read('app-core.js'), pre = JSON.parse(read('precache.json'));

ok(!/fonts\.googleapis|fonts\.gstatic/.test(html + read('app.css') + read('paper.css') + core), 'no Google Fonts references remain');
ok(/<link[^>]+fonts\/fonts\.css/.test(html), 'index.html loads fonts/fonts.css');
const fcss = read('fonts/fonts.css'), faces = fcss.match(/@font-face\{[^}]*\}/g) || [];
ok(faces.length >= 13 && faces.every((f) => /font-display:swap/.test(f)), `${faces.length} @font-face rules, all font-display: swap`);
ok(['Noto Nastaliq Urdu', 'Inter', 'JetBrains Mono'].every((f) => fcss.includes(`'${f}'`)), 'Noto Nastaliq Urdu, Inter and JetBrains Mono are declared');
ok([...fcss.matchAll(/url\(([^)]+\.woff2)\)/g)].every((m) => fs.existsSync(path.join(root, 'fonts', m[1]))), 'every font file referenced by fonts.css exists');
ok(!/<script(?![^>]*\bsrc=)[^>]*>/i.test(html), 'index.html has no inline <script>');

const srcs = core.match(/const SRC=\[([^\]]+)\]/)[1].split(',').map((s) => s.trim().replace(/'/g, ''));
ok(srcs[0].startsWith('vendor/') && /cdnjs/.test(srcs[1]) && /jsdelivr/.test(srcs[2]), 'MathJax load order is local, cdnjs, jsDelivr');
const sri = core.match(/SRI='(sha384-[^']+)'/)[1], mj = fs.readFileSync(path.join(root, srcs[0]));
ok('sha384-' + crypto.createHash('sha384').update(mj).digest('base64') === sri, 'local MathJax file matches the SRI hash used for all three sources');

const { build } = require('./build-precache.js');
ok(JSON.stringify(build()) === JSON.stringify(pre), 'precache.json is up to date (run npm run build)');
const all = [...pre.shell, ...pre.assets, ...pre.banks].filter((p) => p !== './');
ok(all.every((p) => fs.existsSync(path.join(root, p))), `all ${all.length} precached files exist`);
ok(['index.html', 'app.bundle.js', 'app.css', 'bank-loader.js', 'manifest.webmanifest'].every((f) => pre.shell.includes(f)) && pre.banks.includes('banks/manifest.json') && pre.banks.length === 21 && pre.assets.some((a) => a.includes('noto-nastaliq-urdu-arabic-400')) && pre.assets.some((a) => a.startsWith('vendor/mathjax')), 'precache covers shell, bundle, CSS, fonts, MathJax, manifest and every bank');
ok(pre.build === read('app-runtime.js').match(/APP_BUILD='(v\d+)/)[1], 'precache build tag equals APP_BUILD');
const mf = JSON.parse(read('manifest.webmanifest'));
ok(mf.scope === './' && mf.start_url === './' && mf.display === 'standalone' && mf.icons.length >= 2, 'web manifest has scope, start_url, display and icons');
ok(/serviceWorker\.register\('sw\.js\?v='/.test(read('app-runtime.js')), 'runtime registers sw.js with the build tag');

/* ── service worker behaviour with a mocked global ── */
(async () => {
  const ORIGIN = 'https://pp.test', SCOPE = ORIGIN + '/paper-press/';
  const store = new Map(), listeners = {}, served = [], net = { offline: false, fetches: [] };
  const mkCache = (name) => { if (!store.has(name)) store.set(name, new Map()); const m = store.get(name); const key = (r) => (typeof r === 'string' ? r : r.url);
    return { async addAll(reqs) { for (const r of reqs) { const res = await self.fetch(r); if (!res.ok) throw new Error('addAll failed ' + key(r)); m.set(key(r), res.clone()); } },
      async put(r, res) { m.set(key(r), res); }, async match(r, o) { const k = key(r); if (m.has(k)) return m.get(k).clone(); if (o && o.ignoreSearch) { const b = k.split('?')[0]; for (const [kk, v] of m) if (kk.split('?')[0] === b) return v.clone(); } return undefined; } }; };
  const self = { location: new URL(SCOPE + 'sw.js?v=v40'), registration: { scope: SCOPE }, skipWaiting: async () => { self.skipped = true; }, clients: { claim: async () => { self.claimed = true; } },
    addEventListener: (t, f) => { listeners[t] = f; },
    fetch: async (r) => { const u = new URL(typeof r === 'string' ? r : r.url); net.fetches.push(u.pathname); if (net.offline) throw new TypeError('offline'); if (u.origin !== ORIGIN) return new Response('x'); const rel = u.pathname.replace('/paper-press/', ''); const f = path.join(root, rel === '' ? 'index.html' : rel); return fs.existsSync(f) ? new Response(fs.readFileSync(f)) : new Response('nope', { status: 404 }); } };
  const caches = { async open(n) { return mkCache(n); }, async keys() { return [...store.keys()]; }, async delete(n) { return store.delete(n); },
    async match(r, o) { for (const [, m] of store) { const c = mkCache([...store.keys()].find((k) => store.get(k) === m)); const h = await c.match(r, o); if (h) return h; } return undefined; } };
  vm.runInNewContext(read('sw.js'), { self, caches, fetch: self.fetch, URL, Request, Response, console, Promise });
  const run = async (type, extra) => { let p; listeners[type](Object.assign({ waitUntil: (x) => { p = x; }, respondWith: (x) => { p = x; } }, extra)); return p; };
  store.set('pp-shell-v39', new Map()); store.set('pp-banks-v39', new Map()); store.set('other-site-cache', new Map());
  await run('install');
  ok(store.has('pp-shell-v40') && store.has('pp-banks-v40'), 'install creates caches named after the build (pp-shell-v40, pp-banks-v40)');
  ok(store.get('pp-shell-v40').size === pre.shell.length + pre.assets.length && store.get('pp-banks-v40').size === pre.banks.length, 'install precaches the whole shell, assets and every bank');
  ok(self.skipped === true, 'install calls skipWaiting');
  await run('activate');
  ok(!store.has('pp-shell-v39') && !store.has('pp-banks-v39') && store.has('other-site-cache') && store.has('pp-shell-v40'), 'activate deletes old Paper Press caches only');
  ok(self.claimed === true, 'activate claims clients');
  net.offline = true;
  const get = async (p, extra) => run('fetch', { request: Object.assign(new Request(SCOPE + p), extra || {}) });
  ok((await (await get('app.bundle.js?v=40')).text()).length === fs.readFileSync(path.join(root, 'app.bundle.js'), 'utf8').length, 'offline: bundle is served from cache even with a ?v= query');
  ok((await (await get('banks/9-computer.json?v=40')).json()).courseId === '9-computer', 'offline: bank is served from cache');
  ok((await (await get('fonts/inter-latin-400-normal.woff2')).arrayBuffer()).byteLength > 1000, 'offline: fonts are served from cache');
  ok((await (await get('vendor/mathjax-3.2.2-tex-svg.js')).arrayBuffer()).byteLength > 1e6, 'offline: local MathJax is served from cache');
  const navReq = new Request(SCOPE); Object.defineProperty(navReq, 'mode', { value: 'navigate' });
  ok(/<title>/.test(await (await run('fetch', { request: navReq })).text()), 'offline: navigation returns the cached index.html');
  /* stale-while-revalidate */
  net.offline = false; net.fetches.length = 0;
  const cachedBefore = await (await get('banks/10-computer.json?v=40')).text();
  await new Promise((r) => setTimeout(r, 30));
  ok(net.fetches.includes('/paper-press/banks/10-computer.json') && cachedBefore.length > 100, 'banks: cached copy returned immediately and a background refresh was requested');
  /* untouched requests */
  let intercepted = false; listeners.fetch({ request: new Request('https://cdnjs.cloudflare.com/x.js'), respondWith: () => { intercepted = true; } });
  ok(!intercepted, 'cross-origin requests (CDN fallbacks) are not intercepted');
  listeners.fetch({ request: new Request(SCOPE + 'x', { method: 'POST', body: 'a' }), respondWith: () => { intercepted = true; } });
  ok(!intercepted, 'non-GET requests are not intercepted');
  console.log(`${n - fails}/${n} offline checks passed`); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
