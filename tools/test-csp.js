#!/usr/bin/env node
/* The Content-Security-Policy meta tag must stay strict and must allow everything the app really loads. */
const fs = require('fs'), path = require('path'), root = path.join(__dirname, '..'), read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
let n = 0, fails = 0; const ok = (c, m) => { n++; if (c) console.log('PASS ' + m); else { fails++; console.error('FAIL ' + m); } };
const html = read('index.html'), m = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/);
ok(!!m, 'index.html carries a CSP meta tag');
const pol = {}; (m ? m[1] : '').split(';').map((s) => s.trim()).filter(Boolean).forEach((d) => { const [k, ...v] = d.split(/\s+/); pol[k] = v; });
ok(html.indexOf('Content-Security-Policy') < html.indexOf('<link') && html.indexOf('Content-Security-Policy') < html.indexOf('<script'), 'CSP is declared before any link or script');
ok(JSON.stringify(pol['script-src']) === JSON.stringify(["'self'", 'https://cdnjs.cloudflare.com', 'https://cdn.jsdelivr.net']), "script-src is 'self' plus the two MathJax fallback CDNs only");
ok(!Object.values(pol).some((v) => v.includes("'unsafe-eval'") || v.includes('*')) && !pol['script-src'].includes("'unsafe-inline'"), "no 'unsafe-eval', no wildcard, no inline script allowed");
ok(pol['object-src'] + '' === "'none'" && pol['base-uri'] + '' === "'self'" && pol['form-action'] + '' === "'none'" && pol['frame-src'] + '' === "'none'", 'object-src none, base-uri self, form-action none, frame-src none');
ok(pol['img-src'].includes('data:') && pol['img-src'].includes('blob:') && pol['font-src'] + '' === "'self'" && pol['connect-src'] + '' === "'self'", 'img-src allows data:/blob: (logo, formula images); fonts and fetches are same-origin');
ok(!/<script(?![^>]*\bsrc=)[^>]*>/i.test(html) && !/\son[a-z]+\s*=\s*["']/i.test(html), 'no inline script blocks or inline event-handler attributes in index.html');
const code = ['app-core.js', 'app-docx.js', 'app-interface.js', 'app-runtime.js', 'app-paper.js', 'bank-loader.js', 'sw.js'].map(read).join('\n');
ok(!/\beval\s*\(|new Function\s*\(|new Worker\s*\(|importScripts\s*\(/.test(code), 'code uses no eval, new Function or Worker');
const origins = new Set([...(html + code).matchAll(/https:\/\/([a-z0-9.-]+)\//gi)].map((x) => x[1]).filter((h) => !/github\.com|anthropic|w3\.org|schemas\.|purl\.org|openxmlformats|ugwattu|google\.com\/search|mathjax\.org/i.test(h)));
const allowed = new Set(['cdnjs.cloudflare.com', 'cdn.jsdelivr.net']); const stray = [...origins].filter((o) => !allowed.has(o));
ok(stray.length === 0, 'every external origin referenced by the code is covered by the policy' + (stray.length ? ' (uncovered: ' + stray.join(', ') + ')' : ''));
console.log(`${n - fails}/${n} CSP checks passed`); process.exit(fails ? 1 : 0);
