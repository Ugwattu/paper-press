#!/usr/bin/env node
/* End-to-end boot test: serves the folder over HTTP, loads index.html in jsdom, lets bank-loader.js fetch the
   JSON banks and start the app, then checks that a paper was rendered. */
const http = require('http'), fs = require('fs'), path = require('path');
const { JSDOM, ResourceLoader, VirtualConsole } = require('jsdom');
const root = path.join(__dirname, '..'), types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
const server = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0]).replace(/^\/$/, '/index.html'));
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'content-type': types[path.extname(f)] || 'text/plain' }); r.end(d); } }); });
class Local extends ResourceLoader { fetch(url, o) { return url.startsWith('http://127.0.0.1') ? super.fetch(url, o) : null; } }
const PNG1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
const noop = new Proxy(function () {}, { get: (t, k) => (k === 'measureText' ? () => ({ width: 1 }) : noop), apply: () => noop, set: () => true });
server.listen(0, '127.0.0.1', async () => {
  const base = 'http://127.0.0.1:' + server.address().port + '/', errs = [];
  const vc = new VirtualConsole(); vc.on('jsdomError', (e) => errs.push(e.message));
  const dom = await JSDOM.fromURL(base, { runScripts: 'dangerously', resources: new Local(), pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.fetch = (u, o) => fetch(new URL(u, base), o); w.TextEncoder = TextEncoder; w.TextDecoder = TextDecoder;
      w.HTMLCanvasElement.prototype.getContext = () => noop; w.HTMLCanvasElement.prototype.toDataURL = () => PNG1; } });
  const w = dom.window; let ok = false;
  for (let i = 0; i < 60 && !ok; i++) { await new Promise((r) => setTimeout(r, 100)); const s = w.document.getElementById('sheet'); ok = !!(s && s.textContent.length > 500); }
  const title = ok ? w.document.getElementById('tMarks').textContent : '';
  let pickerOK = false;
  if (ok) {
    const grades = w.document.querySelectorAll('#gradeCard [data-grade]'), courses = w.document.querySelectorAll('#courseGrid [data-course]');
    pickerOK = grades.length === 4 && courses.length === 5 && [...courses].filter(b => !b.disabled).length === 1;
    const g10 = w.document.querySelector('#gradeCard [data-grade=\"10\"]');
    if (g10) g10.click();
    const c10 = w.document.querySelector('#courseGrid [data-course=\"10-computer\"]');
    if (c10 && !c10.disabled) { c10.click(); pickerOK = pickerOK && w.document.getElementById('sheet').textContent.includes('Paper CS-10-ALP'); }
    else pickerOK = false;
  }
  server.close();
  if (!ok) { console.error('FAIL: the app did not render a paper after boot.', errs.slice(0, 3).join(' | '), (w.document.body.textContent || '').slice(0, 200)); process.exit(1); }
  if (!pickerOK) { console.error('FAIL: course picker did not expose four grades, the five subject slots, or load Class 10 Computer.'); process.exit(1); }
  console.log(`boot OK — 20-course picker loaded and Class 10 Computer rendered (${title} marks on initial paper)`); process.exit(0);
});
