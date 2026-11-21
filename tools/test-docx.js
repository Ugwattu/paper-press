#!/usr/bin/env node
/* Builds real .docx files through the app's own export path and inspects them like Word would:
   valid zip + CRCs, unique relationship ids, every image resolvable and a real PNG, unique drawing ids,
   Urdu paragraphs right-to-left WITHOUT a left/right jc (Word flips it), schema element order, well-formed XML. */
const JSZip = require('jszip'), { loadApp } = require('./_app.js');
const { dom, ev, realCanvas } = loadApp();
let runs = 0, fails = 0;
const bad = (tag, m) => { fails++; console.error(`FAIL ${tag}: ${m}`); };
(async () => {
  for (const grade of [9, 10]) for (const urdu of [true, false]) for (const pos of ['front', 'end']) for (const compress of [true, false]) {
    const tag = `g${grade} ${urdu ? 'bi' : 'en'} omr:${pos} ${compress ? 'deflate' : 'store'}`; runs++;
    try {
      if (!compress) delete dom.window.CompressionStream; else dom.window.CompressionStream = CompressionStream;
      ev(`state=JSON.parse(JSON.stringify(DEF));state.grade=${grade};state.alp=true;state.chapters=BOOKS[${grade}].alpCh.slice();state.schemeId=offFor(${grade}).id;state.showUrdu=${urdu};state.omr=true;state.omrPos='${pos}';overrides={};sticky={};applySchemeCounts(true);render();`);
      const nMcq = ev('built.mcq.length'), bytes = await ev('zipPack(buildDocx(true))');
      const zip = await JSZip.loadAsync(bytes, { checkCRC32: true });
      const text = async (n) => zip.file(n).async('string'), doc = await text('word/document.xml'), rels = await text('word/_rels/document.xml.rels'), ct = await text('[Content_Types].xml');
      for (const n of [doc, rels, ct]) { const x = new dom.window.DOMParser().parseFromString(n, 'application/xml'); if (x.getElementsByTagName('parsererror').length) bad(tag, 'XML is not well-formed'); }
      const ids = [...rels.matchAll(/<Relationship Id="([^"]+)"[^>]*Target="([^"]+)"/g)];
      if (new Set(ids.map((m) => m[1])).size !== ids.length) bad(tag, 'duplicate relationship ids (Word drops images)');
      const byId = Object.fromEntries(ids.map((m) => [m[1], m[2]]));
      for (const m of doc.matchAll(/r:embed="([^"]+)"/g)) {
        const target = byId[m[1]]; if (!target) { bad(tag, `r:embed ${m[1]} has no relationship`); continue; }
        const f = zip.file('word/' + target); if (!f) { bad(tag, `missing image part ${target}`); continue; }
        const b = await f.async('uint8array'); if (!(b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47)) bad(tag, `${target} is not a PNG`);
        if (b.length < 60) bad(tag, `${target} is suspiciously small`);
      }
      if (!/Extension="png"/.test(ct)) bad(tag, 'png content type missing');
      const dp = [...doc.matchAll(/<wp:docPr id="(\d+)"/g)].map((m) => m[1]); if (new Set(dp).size !== dp.length) bad(tag, 'duplicate drawing ids');
      const bub = (doc.match(/<wp:docPr id="\d+" name="Bubble [ABCD]"/g) || []).length; if (bub !== nMcq * 4) bad(tag, `expected ${nMcq * 4} bubble images, found ${bub}`);
      if (realCanvas) { const parts = Object.keys(zip.files).filter((n) => n.startsWith('word/media/')); if (parts.length > 6) bad(tag, `${parts.length} image parts — identical bubbles should be shared`); }
      let rtl = 0;
      for (const p of doc.match(/<w:p>[\s\S]*?<\/w:p>/g) || []) {
        const ppr = (p.match(/<w:pPr>[\s\S]*?<\/w:pPr>/) || [''])[0], hasRtl = p.includes('<w:rtl/>'), hasBidi = ppr.includes('<w:bidi/>');
        if (hasRtl) { rtl++; const tr = (p.match(/<w:r>(?:(?!<\/w:r>)[\s\S])*<w:t[ >][\s\S]*?<\/w:r>/g) || []); if (tr.length && tr.every((r) => r.includes('<w:rtl/>')) && !hasBidi) bad(tag, 'Urdu-only paragraph without <w:bidi/>'); }
        if (hasBidi && /<w:jc w:val="(left|right)"/.test(ppr)) bad(tag, 'bidi paragraph has jc left/right (Word shows it left-aligned)');
        const ib = ppr.indexOf('<w:bidi/>'), is = ppr.indexOf('<w:spacing'), ij = ppr.indexOf('<w:jc'); if ((ib >= 0 && ib > is) || (ij >= 0 && ij < is)) bad(tag, 'pPr children out of schema order');
      }
      if (urdu && !rtl) bad(tag, 'bilingual paper contains no Urdu paragraphs');
    } catch (e) { bad(tag, e.stack.split('\n').slice(0, 3).join(' | ')); }
  }
  console.log(`${runs - Math.min(fails, runs)}/${runs} docx files passed${realCanvas ? '' : ' (stub canvas)'}`); process.exit(fails ? 1 : 0);
})();
