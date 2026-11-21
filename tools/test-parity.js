#!/usr/bin/env node
/* Loads the real app in jsdom and checks that the on-screen preview and the .docx contain
   the same questions, in the same order, across schemes, ALP on/off, bilingual on/off, seeds and option layouts. */
const { loadApp } = require('./_app.js');
const { ev } = loadApp();
const flat = (s) => String(s).replace(/\s+/g, '');
const unx = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
const docText = () => { const f = ev('buildDocx(true)').find((x) => x.name === 'word/document.xml');
  return flat([...String(f.data).matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)].map((m) => unx(m[1])).join('')); };
/* ordered subsequence check: every needle must appear after the previous one */
function inOrder(hay, needles) { let pos = 0; for (const n of needles) { const i = hay.indexOf(n, pos); if (i < 0) return n; pos = i + n.length; } return null; }
let runs = 0, fails = 0;
for (const grade of [9, 10]) for (const alp of [true, false]) for (const urdu of [true, false]) for (const seed of [3, 11]) for (const opt of ['auto', '2', '1']) {
  const tag = `g${grade} ${alp ? 'ALP' : 'full'} ${urdu ? 'bi' : 'en'} seed${seed} opt:${opt}`;
  try {
    ev(`state=JSON.parse(JSON.stringify(DEF));state.grade=${grade};state.alp=${alp};state.chapters=${alp ? `BOOKS[${grade}].alpCh.slice()` : `BOOKS[${grade}].chapters.slice()`};
      state.schemeId=offFor(${grade}).id;state.showUrdu=${urdu};state.seed=${seed};state.optMode='${opt}';overrides={};sticky={};applySchemeCounts(true);render();`);
    const items = JSON.parse(ev(`JSON.stringify([...built.mcq.map(q=>[q.en,...q.o.map(o=>o[0])]),...built.short.flatMap(p=>p.items).map(q=>[q.en]),...built.long.map(q=>[q.en])])`));
    const needles = items.flat().filter((t) => t && t !== '—').map(flat);
    const screen = flat(ev('sheet.textContent')), docx = docText();
    const a = inOrder(screen, needles), b = inOrder(docx, needles);
    const conf = JSON.parse(ev('JSON.stringify(analyse().conf.filter(c=>!c.ok).map(c=>c.label))'));
    runs++;
    if (a || b || conf.length) { fails++; console.error(`FAIL ${tag}` + (a ? `\n   preview missing/out of order: ${a.slice(0, 60)}` : '') + (b ? `\n   docx missing/out of order: ${b.slice(0, 60)}` : '') + (conf.length ? `\n   scheme conformity: ${conf.join('; ')}` : '')); }
  } catch (e) { fails++; runs++; console.error(`ERROR ${tag}: ${e.message}`); }
}
console.log(`${runs - fails}/${runs} scenarios passed`);
process.exit(fails ? 1 : 0);
