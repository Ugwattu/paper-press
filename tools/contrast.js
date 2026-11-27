#!/usr/bin/env node
/* WCAG 2.x contrast of the colour tokens in app.css, light and dark. usage: node tools/contrast.js [--json] ; exit 1 if a required pair is below its minimum. */
const fs = require('fs'), path = require('path');
const css = fs.readFileSync(path.join(__dirname, '..', 'app.css'), 'utf8');
const vars = (b) => Object.fromEntries([...b.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8})\b/g)].map((m) => [m[1], m[2]]));
/* later blocks override earlier ones, exactly like the cascade */
const light = {}, dark = {};
for (const m of css.matchAll(/(^:root|^html\[data-theme=dark\])\{([^}]*)\}/gm)) Object.assign(m[1] === ':root' ? light : dark, vars(m[2]));
Object.keys(light).forEach((k) => { if (!(k in dark)) dark[k] = light[k]; });
const rgb = (h) => { h = h.replace('#', ''); if (h.length === 3) h = [...h].map((c) => c + c).join(''); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };
const lum = (h) => { const [r, g, b] = rgb(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
/* required pairs: text tokens on every surface they can sit on (4.5 body text); accent/semantic colours used as text need 4.5 too; borders of controls 3.0 */
const SURF = ['bg', 'surface', 'surface2', 'surface3'], TEXT = [['text', 4.5], ['text2', 4.5], ['text3', 4.5], ['accent', 4.5], ['obj', 4.5], ['short', 4.5], ['long', 4.5], ['danger', 4.5], ['pink', 4.5]];
const rows = []; for (const [name, set] of [['light', light], ['dark', dark]]) {
  for (const [t, min] of TEXT) for (const s of SURF) rows.push({ theme: name, fg: t, bg: s, ratio: ratio(set[t], set[s]), min });
  rows.push({ theme: name, fg: 'surface', bg: 'accent', ratio: ratio(name === 'light' ? '#ffffff' : '#0e1116', set.accent), min: 4.5, note: 'button label on accent fill' });
  rows.push({ theme: name, fg: 'border2', bg: 'surface', ratio: ratio(set.border2, set.surface), min: 1.5, note: 'decorative; informational only' });
}
const bad = rows.filter((r) => r.ratio < r.min - 1e-9);
if (process.argv.includes('--json')) console.log(JSON.stringify(rows, null, 1));
else { rows.filter((r) => r.theme).forEach((r) => { if (r.ratio < r.min) console.log(`FAIL ${r.theme}: ${r.fg} on ${r.bg} = ${r.ratio.toFixed(2)} (needs ${r.min})${r.note ? ' — ' + r.note : ''}`); }); console.log(`${rows.length - bad.length}/${rows.length} pairs meet WCAG AA`); }
process.exit(bad.length ? 1 : 0);
