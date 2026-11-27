/* Test helper: loads the real app (index.html + JSON banks + app modules) inside jsdom. */
const { JSDOM, VirtualConsole } = require('jsdom'), vm = require('vm'), fs = require('fs'), path = require('path');
const { convert, scripts } = require('../bank-loader.js');
const root = path.join(__dirname, '..'), read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
function loadApp(opts) {
  opts = opts || {};
  const html = read('index.html').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<link[^>]*>/g, '');
  const dom = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true, url: 'http://localhost/', virtualConsole: new VirtualConsole() });
  const w = dom.window; w.TextEncoder = TextEncoder; w.TextDecoder = TextDecoder; w.CompressionStream = CompressionStream; w.Response = Response;
  let nc = null; try { nc = require('@napi-rs/canvas'); } catch (e) { /* optional: real PNGs */ }
  const PNG1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  const noop = new Proxy(function () {}, { get: (t, k) => (k === 'measureText' ? () => ({ width: 1 }) : noop), apply: () => noop, set: () => true });
  const P = w.HTMLCanvasElement.prototype;
  if (nc) { P.getContext = function (t) { this.__c = nc.createCanvas(this.width || 1, this.height || 1); return this.__c.getContext(t); }; P.toDataURL = function (t) { return this.__c.toDataURL(t || 'image/png'); }; }
  else { P.getContext = () => noop; P.toDataURL = () => PNG1; }
  if (opts.storage) for (const k of Object.keys(opts.storage)) w.localStorage.setItem(k, opts.storage[k]); /* an existing browser profile */
  const manifest = JSON.parse(read('banks/manifest.json'));
  w.PP_COURSES = []; w.PP_DATA = {}; w.PP_GROUPS = manifest.groups || [];
  manifest.courses.forEach((b) => { const c = convert(JSON.parse(read('banks/' + b.file)), b.file); w.PP_COURSES.push(Object.assign({}, c.meta, { groups: b.groups || [] })); w.PP_DATA[b.id] = { raw: c.raw, meta: c.meta, patterns: c.patterns }; });
  const ctx = dom.getInternalVMContext();
  for (const file of scripts) new vm.Script(read(file), { filename: file }).runInContext(ctx);
  return { dom, ev: (code) => vm.runInContext(code, ctx), realCanvas: !!nc };
}
module.exports = { loadApp };
