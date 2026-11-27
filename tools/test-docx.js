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
      ev(`state=JSON.parse(JSON.stringify(DEF));state.grade=${grade};state.sid='computer';state.alp=true;state.chapters=BOOKS['${grade}-computer'].alpCh.slice();state.schemeId=offFor('${grade}-computer').id;state.showUrdu=${urdu};state.omr=true;state.omrPos='${pos}';overrides={};sticky={};applySchemeCounts(true);render();`);
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

  /* Objective and Subjective timings are combined consistently in the Word header. */
  {
    const tag = 'split timing header'; runs++;
    try {
      ev("state=JSON.parse(JSON.stringify(DEF));state.grade=9;state.sid='computer';state.timeObj=25;state.timeSubj=120;state.chapters=BOOKS['9-computer'].alpCh.slice();state.schemeId=offFor('9-computer').id;overrides={};sticky={};applySchemeCounts(true);render();");
      const prev = ev('sheet.textContent').replace(/\s+/g, ' ');
      if (!prev.includes('Time: 2:25 Hours')) bad(tag, 'preview does not show the combined Objective + Subjective time');
      const zip = await JSZip.loadAsync(await ev('zipPack(buildDocx(true))'));
      const doc = await zip.file('word/document.xml').async('string');
      const plain = doc.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
      if (!plain.includes('Time: 2:25 Hours')) bad(tag, 'Word header does not show the combined Objective + Subjective time');
    } catch (e) { bad(tag, e.stack.split('\n').slice(0, 3).join(' | ')); }
  }

  /* Rich inline markup and figure images must survive preview, single-sheet and split-sheet DOCX export. */
  {
    const tag = 'rich text + figures in split DOCX'; runs++;
    try {
      ev("state=JSON.parse(JSON.stringify(DEF));state.grade=9;state.sid='computer';state.alp=true;state.chapters=BOOKS['9-computer'].alpCh.slice();state.schemeId=offFor('9-computer').id;state.sheetMode='two';state.omr=false;overrides={};sticky={};applySchemeCounts(true);render();");
      const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
      const bytes = [...png];
      ev(`FIGURE_CACHE.set('figures/test-question.png',{bytes:new Uint8Array(${JSON.stringify(bytes)}),width:800,height:480});
        FIGURE_CACHE.set('figures/test-subjective.png',{bytes:new Uint8Array(${JSON.stringify(bytes)}),width:640,height:480});
        built.mcq[0].en='H<sub>2</sub>O and x<sup>2</sup> with isotope ^{14}_{6}C';built.mcq[0].figure='figures/test-question.png';built.mcq[0].figureAlt='Objective diagram';
        built.mcq[0].of[0]='figures/test-question.png';built.mcq[0].oa[0]='Option diagram';
        built.short.find(p=>p.items.length).items[0].en='The <b>subjective</b> value is CO<sub>2</sub>.';built.short.find(p=>p.items.length).items[0].figure='figures/test-subjective.png';built.short.find(p=>p.items.length).items[0].figureAlt='Subjective diagram';`);
      const preview = ev("paperInner(state,'screen',true)");
      if (!preview.includes('H<sub>2</sub>O') || !preview.includes('pp-figure') || !preview.includes('pp-isotope')) bad(tag, 'preview markup or figures are missing');
      const zip = await JSZip.loadAsync(await ev('zipPack(buildDocx(true))'), { checkCRC32: true });
      const doc = await zip.file('word/document.xml').async('string'), rels = await zip.file('word/_rels/document.xml.rels').async('string');
      if (!doc.includes('w:val="subscript"') || !doc.includes('w:val="superscript"') || !doc.includes('<w:b/>')) bad(tag, 'Word rich-text formatting runs are missing');
      if (!doc.includes('Objective diagram') || !doc.includes('Option diagram') || !doc.includes('Subjective diagram')) bad(tag, 'figure drawings from both sheets are missing');
      const relIds = new Set([...rels.matchAll(/<Relationship Id="([^"]+)"/g)].map(m => m[1]));
      const embeds = [...doc.matchAll(/r:embed="([^"]+)"/g)].map(m => m[1]);
      if (!embeds.length || embeds.some(id => !relIds.has(id))) bad(tag, 'one or more figure/image relationships are missing');
      const mediaFiles = Object.keys(zip.files).filter(n => n.startsWith('word/media/'));
      if (!mediaFiles.length || mediaFiles.some(n => !zip.file(n))) bad(tag, 'figure media parts are absent from the combined DOCX');
      const drawingIds = [...doc.matchAll(/<wp:docPr id="(\d+)"/g)].map(m => m[1]);
      if (new Set(drawingIds).size !== drawingIds.length) bad(tag, 'drawing ids are not unique across the two sheets');
    } catch (e) { bad(tag, e.stack.split('\n').slice(0, 3).join(' | ')); }
  }

  /* layout rules from the Word template + the reported bugs */
  {
    const tag = 'layout rules'; runs++;
    try {
      ev(`state=JSON.parse(JSON.stringify(DEF));state.grade=9;state.sid='computer';state.alp=true;state.chapters=BOOKS['9-computer'].alpCh.slice();state.schemeId=offFor('9-computer').id;state.showUrdu=true;state.omr=false;
        ['bHeader','bBar','bInstr','bNum','bStem','bShort','bLong'].forEach(k=>state[k]=true);overrides={};sticky={};applySchemeCounts(true);render();`);
      const zip = await JSZip.loadAsync(await ev('zipPack(buildDocx(true))')), doc = await zip.file('word/document.xml').async('string');
      const tcs = doc.match(/<w:tc>[\s\S]*?<\/w:tc>/g) || [], width = (t) => +(t.match(/<w:tcW w:w="(\d+)"/) || [0, 0])[1];
      const en = tcs.find((t) => t.includes('Q. No. 1:')), ur = tcs.find((t) => t.includes('سوال نمبر 1:'));
      if (!en || !ur) bad(tag, 'instruction row cells not found'); else if (!(width(en) > width(ur))) bad(tag, `instruction row: English cell (${width(en)}) must be wider than Urdu (${width(ur)}), like the template`);
      const sub = (doc.match(/<w:p>(?:(?!<\/w:p>)[\s\S])*جماعت(?:(?!<\/w:p>)[\s\S])*<\/w:p>/g) || [])[0];
      if (!sub || !/<w:jc w:val="center"\/>/.test(sub)) bad(tag, 'the Urdu subject line in the header must be centered');
      const isUrduOnly = (p) => { const runs = (p.match(/<w:r>(?:(?!<\/w:r>)[\s\S])*<\/w:r>/g) || []).filter((r) => /<w:t[ >]/.test(r)); return runs.length && runs.every((r) => r.includes('<w:rtl/>')); };
      // MCQ option translations are intentionally not bold. Identify Urdu option paragraphs
      // inside cells whose English option text begins A./B./C./D.; exclude those from this check.
      const optionUrdu = new Set();
      for (const cell of doc.match(/<w:tc>[\s\S]*?<\/w:tc>/g) || []) {
        const ps = cell.match(/<w:p>[\s\S]*?<\/w:p>/g) || [];
        if (ps.some((p) => /<w:t[^>]*>[ABCD]\.\s/.test(p))) ps.filter(isUrduOnly).forEach((p) => optionUrdu.add(p));
      }
      const plain = (doc.match(/<w:p>[\s\S]*?<\/w:p>/g) || []).filter((p) => isUrduOnly(p) && !optionUrdu.has(p) && p.includes('<w:rtl/>') && !p.includes('<w:b/>'));
      if (plain.length) bad(tag, `${plain.length} non-option Urdu-only paragraphs are not bold although every bold option is on`);
      const topCells = tcs.filter((t) => /Which software enhances|Data unit in packet/.test(t));
      if (!topCells.length || topCells.some((t) => !/<w:vAlign w:val="top"\/>/.test(t))) bad(tag, 'question text cells must be top-aligned');
    } catch (e) { bad(tag, e.stack.split('\n').slice(0, 3).join(' | ')); }
  }

  /* every header style x student-field style builds a valid file, keeps its content, and puts the paper-code line first */
  for (const hs of ['classic', 'banner', 'ruled', 'split']) for (const is of ['table', 'lines', 'stacked', 'boxes']) for (const urdu of [true, false]) {
    const tag = `header ${hs} / fields ${is} / ${urdu ? 'bi' : 'en'}`; runs++;
    try {
      ev(`state=JSON.parse(JSON.stringify(DEF));state.grade=9;state.sid='computer';state.alp=true;state.chapters=BOOKS['9-computer'].alpCh.slice();state.schemeId=offFor('9-computer').id;state.showUrdu=${urdu};state.omr=false;state.footer=true;
        state.hdrStyle='${hs}';state.infoStyle='${is}';state.showSection=true;state.sectionVal='B';overrides={};sticky={};applySchemeCounts(true);render();`);
      const zip = await JSZip.loadAsync(await ev('zipPack(buildDocx(true))'), { checkCRC32: true }), doc = await zip.file('word/document.xml').async('string');
      if (new dom.window.DOMParser().parseFromString(doc, 'application/xml').getElementsByTagName('parsererror').length) bad(tag, 'document.xml is not well-formed');
      const plainText = doc.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
      for (const need of ['Class: 9th', 'Total Marks:', 'Time:', 'Name:', 'Roll No', 'Section:', 'Date:', 'Government High School']) if (!plainText.includes(need)) bad(tag, `docx is missing "${need}"`);
      if (plainText.indexOf('Paper CS-09-ALP') < 0 || plainText.indexOf('Paper CS-09-ALP') > plainText.indexOf('Government High School')) bad(tag, 'the paper-code line must come first in the .docx');
      const prev = ev('sheet.textContent').replace(/\s+/g, ' ');
      if (prev.indexOf('Paper CS-09-ALP') < 0 || prev.indexOf('Paper CS-09-ALP') > prev.indexOf('Government High School')) bad(tag, 'the paper-code line must come first in the preview');
      for (const need of ['Class: 9th', 'Total Marks:', 'Name:', 'Section:', 'Date:']) if (!prev.includes(need)) bad(tag, `preview is missing "${need}"`);
      if (!/Roll No/.test(prev)) bad(tag, 'preview is missing Roll No');
    } catch (e) { bad(tag, e.stack.split('\n').slice(0, 3).join(' | ')); }
  }
  console.log(`${runs - Math.min(fails, runs)}/${runs} docx files passed${realCanvas ? '' : ' (stub canvas)'}`); process.exit(fails ? 1 : 0);
})();
