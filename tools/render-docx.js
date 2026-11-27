#!/usr/bin/env node
/* DOCX visual regression: fixtures -> LibreOffice headless PDF -> pdftoppm PNG -> pixelmatch vs tools/baselines/docx.
   usage: node tools/render-docx.js            compare (exit 1 on drift)
          node tools/render-docx.js --update   deliberately replace the baselines
   LibreOffice is NOT Word: this catches regressions in OUR output, it does not prove Word/OnlyOffice rendering. */
const fs = require('fs'), path = require('path'), { spawnSync } = require('child_process');
const { PNG } = require('pngjs'), pixelmatch = require('pixelmatch'), { buildFixtures } = require('./docx-fixtures.js');
const root = path.join(__dirname, '..'), work = path.join(root, 'build', 'docx-render'), base = path.join(__dirname, 'baselines', 'docx');
const update = process.argv.includes('--update'), DPI = 60, PIXEL_THRESHOLD = 0.25, MAX_DIFF_RATIO = 0.02;
const run = (cmd, args, env) => { const r = spawnSync(cmd, args, { encoding: 'utf8', env: { ...process.env, ...env }, timeout: 300000 }); if (r.error || r.status !== 0) throw new Error(`${cmd} failed: ${(r.error && r.error.message) || r.stderr || r.stdout}`); return r; };
(async () => {
  fs.rmSync(work, { recursive: true, force: true }); fs.mkdirSync(work, { recursive: true }); fs.mkdirSync(base, { recursive: true });
  const fx = await buildFixtures(), docx = [];
  for (const [n, v] of Object.entries(fx)) { const f = path.join(work, n + '.docx'); fs.writeFileSync(f, Buffer.from(v.bytes)); docx.push(f); }
  const home = path.join(work, 'home'); fs.mkdirSync(home, { recursive: true });
  run('soffice', ['-env:UserInstallation=file://' + path.join(work, 'lo-profile'), '--headless', '--convert-to', 'pdf', '--outdir', work, ...docx], { HOME: home });
  let failed = 0, checked = 0;
  for (const n of Object.keys(fx)) {
    const pdf = path.join(work, n + '.pdf'); run('pdftoppm', ['-r', String(DPI), '-png', pdf, path.join(work, n)]);
    const pages = fs.readdirSync(work).filter((f) => f.startsWith(n + '-') && f.endsWith('.png')).sort();
    if (update) { fs.readdirSync(base).filter((f) => f.startsWith(n + '-')).forEach((f) => fs.unlinkSync(path.join(base, f))); pages.forEach((p) => fs.copyFileSync(path.join(work, p), path.join(base, p))); console.log(`updated ${n}: ${pages.length} page(s)`); continue; }
    const want = fs.readdirSync(base).filter((f) => f.startsWith(n + '-') && f.endsWith('.png')).sort();
    if (!want.length) { console.error(`FAIL ${n}: no baseline (run npm run docx:baselines and commit tools/baselines/docx)`); failed++; continue; }
    if (want.length !== pages.length) { console.error(`FAIL ${n}: page count ${pages.length} differs from baseline ${want.length}`); failed++; continue; }
    pages.forEach((p, i) => {
      checked++; const a = PNG.sync.read(fs.readFileSync(path.join(base, want[i]))), b = PNG.sync.read(fs.readFileSync(path.join(work, p)));
      if (a.width !== b.width || a.height !== b.height) { console.error(`FAIL ${p}: size ${b.width}x${b.height} vs baseline ${a.width}x${a.height}`); failed++; return; }
      const diff = new PNG({ width: a.width, height: a.height }), d = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: PIXEL_THRESHOLD }), ratio = d / (a.width * a.height);
      if (ratio > MAX_DIFF_RATIO) { fs.writeFileSync(path.join(work, 'DIFF-' + p), PNG.sync.write(diff)); console.error(`FAIL ${p}: ${(ratio * 100).toFixed(2)}% pixels differ (limit ${MAX_DIFF_RATIO * 100}%)`); failed++; }
      else console.log(`PASS ${p}: ${(ratio * 100).toFixed(3)}% differ`);
    });
  }
  if (!update) console.log(`${checked - failed}/${checked} page(s) within tolerance`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e.message); process.exit(1); });
