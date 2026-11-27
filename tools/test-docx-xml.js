#!/usr/bin/env node
/* XML-level fidelity assertions on the four fixture papers (no Word/LibreOffice needed).
   Urdu: RTL runs, <w:bidi/> paragraphs with no left/right jc (Word mirrors jc for bidi, so "no jc" = right-aligned).
   OMR: bubble images present. Tables: tblW == gridCol sum == every row's tcW sum (gridSpan-aware). */
const JSZip = require('jszip'), { buildFixtures } = require('./docx-fixtures.js');
let n = 0, fails = 0;
const ok = (c, m) => { n++; if (c) console.log('PASS ' + m); else { fails++; console.error('FAIL ' + m); } };
(async () => {
  const fx = await buildFixtures();
  for (const [name, { bytes, meta }] of Object.entries(fx)) {
    const zip = await JSZip.loadAsync(bytes, { checkCRC32: true }), doc = await zip.file('word/document.xml').async('string');
    const paras = doc.match(/<w:p>[\s\S]*?<\/w:p>|<w:p [\s\S]*?<\/w:p>/g) || [];
    const rtlParas = paras.filter((p) => p.includes('<w:rtl/>'));
    if (meta.urdu) {
      ok(rtlParas.length > 10, `${name}: Urdu paragraphs exist (${rtlParas.length})`);
      /* A centred mixed-direction line (e.g. the English OMR heading with an Urdu fragment) is deliberately LTR + centre, so centred paragraphs are exempt. */
      const notBidi = rtlParas.filter((p) => !/<w:jc w:val="center"\/>/.test(p) && !/<w:pPr>(?:(?!<\/w:pPr>)[\s\S])*<w:bidi\/>/.test(p));
      ok(notBidi.length === 0, `${name}: every Urdu paragraph is <w:bidi/> unless centred mixed-direction (${notBidi.length} are not)`);
      const wrongJc = rtlParas.filter((p) => /<w:jc w:val="(left|right)"\/>/.test(p));
      ok(wrongJc.length === 0, `${name}: no Urdu paragraph carries an explicit left/right jc (Word would mirror it)`);
      ok(/<w:lang w:bidi="ur-PK"\/>/.test(doc), `${name}: Urdu runs are tagged ur-PK`);
    } else ok(rtlParas.length === 0, `${name}: English-only paper contains no RTL runs`);
    const bubbles = (doc.match(/name="Bubble [ABCD]"/g) || []).length;
    ok(meta.omr ? bubbles > 0 && bubbles % 4 === 0 : bubbles === 0, `${name}: OMR bubbles ${meta.omr ? 'present (' + bubbles + ')' : 'absent'}`);
    if (meta.math) ok((doc.match(/<w:drawing>/g) || []).length > 20, `${name}: formulas are embedded as inline drawings`);
    const tables = doc.match(/<w:tbl>[\s\S]*?<\/w:tbl>/g) || []; let bad = 0;
    for (const t of tables) {
      if (/<w:tbl>/.test(t.slice(7))) continue; /* skip tables that contain nested tables */
      const tblW = +(t.match(/<w:tblW w:w="(\d+)"/) || [])[1], grid = [...t.matchAll(/<w:gridCol w:w="(\d+)"/g)].map((m) => +m[1]), gsum = grid.reduce((a, b) => a + b, 0);
      if (!tblW || Math.abs(tblW - gsum) > 2) { bad++; continue; }
      for (const row of t.match(/<w:tr[ >][\s\S]*?<\/w:tr>/g) || []) {
        let span = 0, w = 0;
        for (const c of row.match(/<w:tc>[\s\S]*?<\/w:tcPr>/g) || []) { w += +(c.match(/<w:tcW w:w="(\d+)"/) || [])[1] || 0; span += +(c.match(/<w:gridSpan w:val="(\d+)"/) || [0, 1])[1]; }
        if (Math.abs(w - tblW) > grid.length * 2 && w) bad++;
      }
    }
    ok(tables.length > 0 && bad === 0, `${name}: ${tables.length} tables, widths consistent (tblW = gridCol sum = row tcW sum; ${bad} inconsistent)`);
  }
  console.log(`${n - fails}/${n} docx XML fidelity checks passed`); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
