#!/usr/bin/env node
/* Writes precache.json: the exact list of files the service worker caches for offline use. Run by `npm run build`; never edit by hand. */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const ls = (dir, filter) => fs.existsSync(path.join(root, dir)) ? fs.readdirSync(path.join(root, dir)).filter(filter).sort().map((f) => dir + '/' + f) : [];
function build() {
  const rt = fs.readFileSync(path.join(root, 'app-runtime.js'), 'utf8'), m = rt.match(/APP_BUILD='(v\d+)/);
  if (!m) throw new Error('APP_BUILD not found in app-runtime.js');
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'banks', 'manifest.json'), 'utf8'));
  const shell = ['./', 'index.html', 'app.css', 'paper.css', 'app.bundle.js', 'bank-loader.js', 'manifest.webmanifest', 'precache.json'];
  const assets = [...ls('icons', (f) => /\.(png|svg|ico)$/.test(f)), ...ls('fonts', (f) => /\.(woff2|css)$/.test(f)), ...ls('vendor', (f) => /\.js$/.test(f)), ...ls('figures', (f) => /\.(png|jpe?g|svg|webp|gif)$/i.test(f))];
  const banks = ['banks/manifest.json', ...manifest.courses.map((c) => 'banks/' + c.file)];
  return { build: m[1], shell, assets, banks };
}
module.exports = { build };
if (require.main === module) { const j = build(); fs.writeFileSync(path.join(root, 'precache.json'), JSON.stringify(j, null, 1) + '\n'); console.log(`precache.json: ${j.shell.length + j.assets.length + j.banks.length} files for ${j.build}`); }
