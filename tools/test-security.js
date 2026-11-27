#!/usr/bin/env node
/* Malicious-data tests. Free-text fields of a saved state, presets, schemes and a question bank are filled with XSS payloads;
   after boot and every major UI paint, no payload may have become live markup (script, on* attribute, javascript: URL, injected <img>/<svg>/<iframe>),
   nothing may execute, and oversized data must be capped or rejected. */
const fs = require('fs'), path = require('path'), { loadApp } = require('./_app.js');
const base = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'profile-original-app.json'), 'utf8'));
const P = [`"><img src=x onerror="window.__pwned=1">`, `<script>window.__pwned=2</script>`, `<svg onload="window.__pwned=3">`, `<a href="javascript:window.__pwned=4">x</a>`, `' onmouseover='window.__pwned=5`, `</option></select><iframe src="javascript:window.__pwned=6">`].join('');
const BIG = 'A'.repeat(1.2e6); /* three of these must fit jsdom's 5M-char localStorage quota */
let n = 0, fails = 0;
const ok = (c, m) => { n++; if (c) console.log('PASS ' + m); else { fails++; console.error('FAIL ' + m); } };

function pathOf(el) { const out = []; let p = el; while (p && p.tagName && out.length < 5 && p.tagName !== 'BODY') { out.push(p.tagName.toLowerCase() + (p.id ? '#' + p.id : '')); p = p.parentElement; } return out.join('<'); }
function scan(dom, where) {
  const d = dom.window.document, bad = [];
  d.querySelectorAll('script').forEach((s) => { if (/__pwned/.test(s.textContent)) bad.push('script containing payload'); });
  d.querySelectorAll('*').forEach((el) => {
    for (const a of Array.from(el.attributes)) {
      if (/^on/i.test(a.name) && /__pwned/.test(a.value)) bad.push(`<${el.tagName.toLowerCase()} ${a.name}> in ${pathOf(el)}`);
      if (/^(href|src|xlink:href|action|formaction)$/i.test(a.name) && /^\s*javascript:/i.test(a.value)) bad.push(`<${el.tagName.toLowerCase()} ${a.name}=javascript:>`);
    }
    if (/^(iframe|object|embed)$/i.test(el.tagName) && /__pwned|javascript:/i.test(el.outerHTML)) bad.push('injected ' + el.tagName);
    if (el.tagName === 'IMG' && /^x$/.test(el.getAttribute('src') || '')) bad.push('injected <img src=x> in ' + pathOf(el));
    if (/^(iframe|object|embed)$/i.test(el.tagName)) bad.push(el.tagName.toLowerCase() + ' in ' + pathOf(el));
  });
  return bad.length ? where + ': ' + [...new Set(bad)].join(', ') : '';
}
const sweep = (dom, ev, label) => {
  const calls = ['syncUI()', 'render()', 'renderPresets()', 'paintCourseUI&&paintCourseUI()', 'buildContentSelection&&buildContentSelection()', 'buildChips&&buildChips()', 'analyse&&paintSections&&paintLedger&&(analyse(),paintSections(),paintLedger())'];
  for (const c of calls) { try { ev(c); } catch (e) { /* a function needing arguments is exercised elsewhere */ } }
  try { ev('openPresetForm(null)'); } catch (e) { /* ignore */ }
  try { ev('openSchemeEditor(null)'); } catch (e) { /* ignore */ }
  try { ev('openDrawer&&paperSlots&&0'); } catch (e) { /* ignore */ }
  const r = scan(dom, label); return r;
};

/* 1. poisoned saved state / presets / schemes */
{
  const st = JSON.parse(JSON.parse(JSON.stringify(base))['pp.state.v7']);
  Object.assign(st, { institute: P, title: P, klass: P, subject: P, subjectUr: P, date: P, sectionVal: P, footer: P, logoName: P, logo: 'javascript:window.__pwned=7', enFont: P, urFont: P, questionTags: { x: P } });
  const pre = JSON.parse(base['pp.presets.v7']); pre.forEach((p) => { p.name = P; p.note = P; });
  const sch = JSON.parse(base['pp.schemes.v7']); sch.forEach((s) => { s.name = P; s.note = P; });
  const storage = { ...base, 'pp.state.v7': JSON.stringify(st), 'pp.presets.v7': JSON.stringify(pre), 'pp.schemes.v7': JSON.stringify(sch) };
  const { dom, ev } = loadApp({ storage });
  dom.window.__pwned = 0;
  const bad = sweep(dom, ev, 'poisoned profile');
  ok(!bad, 'poisoned state/presets/schemes produce no live markup' + (bad ? ' — ' + bad : ''));
  ok(!dom.window.__pwned, 'nothing executed (window.__pwned unset)');
  const logo = ev('state.logo'); ok(!/^javascript:/i.test(logo || ''), 'javascript: logo is not kept');
  const css = dom.window.document.documentElement.getAttribute('style') || '' + (dom.window.document.getElementById('sheet') ? dom.window.document.getElementById('sheet').getAttribute('style') : '');
  ok(!/__pwned|<script|javascript:/i.test(css), 'font fields did not reach inline style');
}
/* 2. oversized data */
{
  const st = JSON.parse(base['pp.state.v7']); st.institute = BIG; st.title = BIG; st.logo = 'data:image/png;base64,' + BIG;
  const pre = JSON.parse(base['pp.presets.v7']); pre[0].name = BIG;
  let t0 = Date.now(), loaded = true, dom, ev;
  try { ({ dom, ev } = loadApp({ storage: { ...base, 'pp.state.v7': JSON.stringify(st), 'pp.presets.v7': JSON.stringify(pre) } })); } catch (e) { loaded = false; }
  ok(loaded, 'oversized state/preset data does not crash boot');
  if (loaded) {
    const inst = ev('state.institute'), logo = ev('state.logo') || '';
    ok(inst.length <= 2000, `oversized institute is capped or rejected (${inst.length} chars kept)`);
    ok(logo.length < 3e6, `oversized logo is capped or rejected (${logo.length} chars kept)`);
    ok(Date.now() - t0 < 15000, 'oversized data does not hang boot');
  }
}
/* 3. malicious bank content through the loader */
{
  const { convert } = require('../bank-loader.js');
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'banks', '9-computer.json'), 'utf8'));
  raw.subject = P; raw.chapters[0].name = P;
  const q = raw.chapters[0].mcq[0]; q.question = P; q.questionUr = P; q.options.forEach((o) => { o.en = P; o.ur = P; });
  raw.chapters[0].short[0].question = P; raw.chapters[0].long[0].question = P;
  let c; try { c = convert(raw, 'evil.json'); } catch (e) { c = null; }
  ok(c !== null, 'bank loader accepts hostile text as plain data (or rejects it cleanly)');
  if (c) {
    const { dom, ev } = loadApp(); dom.window.__pwned = 0;
    ev(`(()=>{const B=BOOKS['9-computer'];const q=B.mcq[1][0];q.en=${JSON.stringify(P)};q.ur=${JSON.stringify(P)};q.o=q.o.map(()=>[${JSON.stringify(P)},${JSON.stringify(P)}]);B.names[1]=${JSON.stringify(P)};B.short[1][0].en=${JSON.stringify(P)};B.long[1][0].en=${JSON.stringify(P)};B.subject=${JSON.stringify(P)};})()`);
    ev("state=JSON.parse(JSON.stringify(DEF));state.alp=false;state.chapters=[1];state.schemeId=offFor('9-computer').id;applySchemeCounts(true);render();");
    let bad = sweep(dom, ev, 'hostile bank (screen)');
    ok(!bad, 'hostile bank text produces no live markup in the paper/UI' + (bad ? ' — ' + bad : ''));
    ok(!dom.window.__pwned, 'hostile bank text executes nothing');
    const html = ev('(function(){try{return paperInner(state,"print")}catch(e){return ""}})()');
    const pd = new (require('jsdom').JSDOM)(html).window.document;
    ok(!pd.querySelector('script,iframe,object,embed,[onerror],[onload],img[src="x"],a[href^="javascript"]'), 'print markup contains no live payload elements (parsed, not regexp)');
    const docxOk = (async () => { const JSZip = require('jszip'); const z = await JSZip.loadAsync(await ev('zipPack(buildDocx(true))')); const x = await z.file('word/document.xml').async('string'); return !/<script|<iframe/i.test(x) && new dom.window.DOMParser().parseFromString(x, 'application/xml').getElementsByTagName('parsererror').length === 0; })();
    docxOk.then((v) => { ok(v, 'hostile bank text exports as well-formed, escaped DOCX XML'); return backupDone(); }).then(finish);
    return;
  }
}

/* 4. malicious backup file through the real Restore handler */
async function backupDone() {
  const { dom, ev } = loadApp(); const w = dom.window; w.__pwned = 0; w.confirm = () => true; ev('idbSet=async()=>true;idbGet=async()=>"";'); /* jsdom has no IndexedDB; without this the handler rolls back */
  const st = JSON.parse(base['pp.state.v7']); Object.assign(st, { institute: P, enFont: P, omrAlign: P, logo: 'javascript:window.__pwned=9' });
  const pre = JSON.parse(base['pp.presets.v7']); pre[0].name = P; pre[0].cfg = Object.assign({}, pre[0].cfg, { enFont: P, omrAlign: P, logo: 'javascript:1' });
  const sch = JSON.parse(base['pp.schemes.v7']); sch[0].name = P;
  const json = JSON.stringify({ app: 'paper-press-backup', version: 1, created: new Date().toISOString(), data: { 'pp.state.v7': st, 'pp.presets.v7': pre, 'pp.schemes.v7': sch, 'pp.evil': P, 'pp.history.v1': [{ id: P, at: 1, course: '10-computer', seed: 5, schemeName: P, chapters: [1], pins: { a: P }, qids: [P], cfg: { enFont: P, logo: 'javascript:1' } }, { course: P, seed: 1 }] }, logo: 'javascript:window.__pwned=10' });
  const input = w.document.getElementById('backupFile'); Object.defineProperty(input, 'files', { value: [{ size: json.length, text: async () => json }], configurable: true });
  input.dispatchEvent(new w.Event('change')); await new Promise((r) => setTimeout(r, 300));
  const stored = JSON.parse(w.localStorage.getItem('pp.state.v7') || '{}'), presets = JSON.parse(w.localStorage.getItem('pp.presets.v7') || '[]');
  ok(!/^javascript:/i.test(stored.logo || ''), 'backup restore drops a javascript: logo');
  ok(!/["'<>{};]/.test(stored.enFont || '') && ['left', 'center', 'right'].includes(stored.omrAlign), 'backup restore sanitises font and enum fields (' + JSON.stringify(stored.enFont) + ', ' + stored.omrAlign + ')');
  ok(presets.every((p) => !/["'<>{};]/.test((p.cfg || {}).enFont || '') && !/^javascript:/i.test((p.cfg || {}).logo || '')), 'backup restore sanitises preset configs');
  const hist = JSON.parse(w.localStorage.getItem('pp.history.v1') || '[]');
  ok(hist.length === 1 && !/["<>{};]/.test(hist[0].cfg.enFont || '') && !hist[0].cfg.logo, 'backup restore sanitises paper history');
  ok(!w.__pwned, 'restoring a malicious backup executes nothing');
  try { ev('syncUI()'); ev('render()'); ev('renderPresets()'); } catch (e) { /* page reload is not implemented in jsdom */ }
  const bad = scan(dom, 'after restore'); ok(!bad, 'UI after restoring a malicious backup has no live markup' + (bad ? ' — ' + bad : ''));
}
backupDone().then(finish).catch((e) => { console.error(e); fails++; finish(); });
function finish() { console.log(`${n - fails}/${n} security checks passed`); process.exit(fails ? 1 : 0); }
