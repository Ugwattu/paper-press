#!/usr/bin/env node
/* Answer key: optional section in the SAME file (preview/print HTML and .docx), derived from the generated paper. */
const JSZip = require('jszip'), { loadApp } = require('./_app.js');
const { dom, ev } = loadApp(); let n = 0, fails = 0;
const ok = (c, m) => { n++; if (c) console.log('PASS ' + m); else { fails++; console.error('FAIL ' + m); } };
(async () => {
  for (const mode of ['single', 'two']) {
    ev(`state=JSON.parse(JSON.stringify(DEF));state.grade=9;state.sid='computer';state.alp=true;state.chapters=BOOKS['9-computer'].alpCh.slice();state.schemeId=offFor('9-computer').id;state.omr=true;state.sheetMode='${mode}';state.seed=77;overrides={};sticky={};applySchemeCounts(true);render();`);
    const letters = JSON.parse(ev('JSON.stringify(built.mcq.map(m=>"ABCD"[m.a]))')), N = letters.length;
    ok(N > 0, `${mode}: paper has ${N} MCQs`);
    ok(ev('state.answerKey') === false, `${mode}: answer key is off by default`);
    ok(!/pp-answer-key/.test(ev('paperInner(state,"export",true)')), `${mode}: no key HTML when off`);
    const off = await new JSZip.external.Promise((r) => r()).then(() => ev('zipPack(buildDocx(true))')).then((b) => JSZip.loadAsync(b)).then((z) => z.file('word/document.xml').async('string'));
    ok(!/Answer Key/.test(off), `${mode}: no key in DOCX when off`);
    ev('state.answerKey=true;');
    const html = ev('paperInner(state,"export",true)'), doc = new dom.window.DOMParser().parseFromString(html, 'text/html');
    const cells = [...doc.querySelectorAll('.pp-answer-key td')].map((t) => t.textContent), got = [];
    for (let i = 0; i < cells.length; i += 2) got.push([cells[i], cells[i + 1]]);
    ok(JSON.stringify(got) === JSON.stringify(letters.map((l, i) => [String(i + 1), l])), `${mode}: HTML key lists every MCQ number with its correct letter`);
    ok(/page-break-before:always/.test(html.slice(html.indexOf('pp-answer-key') - 10, html.indexOf('pp-answer-key') + 120)), `${mode}: print/export key starts on a new page`);
    const z = await JSZip.loadAsync(await ev('zipPack(buildDocx(true))')), xml = await z.file('word/document.xml').async('string');
    ok(new dom.window.DOMParser().parseFromString(xml, 'application/xml').getElementsByTagName('parsererror').length === 0, `${mode}: DOCX with key is well-formed XML`);
    const i = xml.indexOf('Answer Key'); ok(i > 0 && xml.lastIndexOf('<w:sectPr') > i, `${mode}: key sits before the final section properties, in the same document.xml`);
    const tail = xml.slice(i), tcs = [...tail.matchAll(/<w:tc>[\s\S]*?<\/w:tc>/g)].map((m) => (m[0].match(/<w:t[^>]*>([^<]*)<\/w:t>/) || [0, ''])[1]).filter((t) => t !== '');
    const g2 = []; for (let k = 0; k < tcs.length; k += 2) g2.push([tcs[k], tcs[k + 1]]);
    ok(JSON.stringify(g2) === JSON.stringify(letters.map((l, k) => [String(k + 1), l])), `${mode}: DOCX key matches the paper's answers`);
    ok(Object.keys(z.files).filter((f) => /\.docx$/i.test(f)).length === 0, `${mode}: still one file (no second document)`);
  }
  ev("state=JSON.parse(JSON.stringify(DEF));");
  ok(ev('cleanCfg({answerKey:true}).answerKey') === true && ev('cleanCfg({answerKey:"x"}).answerKey') === undefined, 'answerKey round-trips through preset/backup sanitising');
  console.log(`${n - fails}/${n} answer-key checks passed`); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
