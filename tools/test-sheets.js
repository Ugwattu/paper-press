#!/usr/bin/env node
/* Split-sheet mode: settings, preview partitions, per-sheet headers/times/marks, OMR scope and DOCX merge. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const { readAppSource } = require('./_source.js');
const script = readAppSource();
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', 'paper.css'), 'utf8');
let fails = 0;
const check = (name, ok) => { if (!ok) { fails++; console.error(`FAIL ${name}`); } else console.log(`OK ${name}`); };

check('single paper remains the default', /sheetMode:'single'/.test(script));
check('sheet mode is part of the Header preset scope', /header:\{label:[^\n]+keys:\[[^\]]*'sheetMode'/.test(script));
check('UI offers only Single paper and two sheets in one file', /id="selSheetMode"[\s\S]*?value="single"[\s\S]*?value="two"/.test(html) && !/two separate files/i.test(html));
check('preview exposes Both / Objective / Subjective tabs', ['both', 'objective', 'subjective'].every(v => new RegExp(`data-sheet="${v}"`).test(html)));
check('preview generates one or two separately framed pages', /function paperInner\(s,mode,forceBoth=false\)/.test(script) && /paperInnerSheet\(Object\.assign\(\{\},s,\{_sheetKind:kind\}\),mode\)/.test(script) && /class="pp-sheet-page" data-sheet="\$\{kind\}"/.test(script));
check('objective sheet contains only MCQs', /hasM=sheetKind!=='subjective'&&built\.mcq\.length>0/.test(script) && /hasS=sheetKind!=='objective'/.test(script) && /hasL=sheetKind!=='objective'/.test(script));
check('subjective header uses its own duration and marks', /paperDuration\(s,sheetKind\)/.test(script) && /short:allMarks\.short,long:allMarks\.long,total:allMarks\.short\+allMarks\.long/.test(script));
check('objective header uses objective duration and marks', /mcq:allMarks\.mcq,short:0,long:0,total:allMarks\.mcq/.test(script) && /kind==='objective'\?t\.objective/.test(script));
check('both split paper codes get their required suffix', /sheetKind==='objective'\?'Objective':'Subjective'/.test(script));
check('Objective note is limited to Objective sheet and bilingual when applicable', /hasM&&sheetKind==='objective'[\s\S]*?Four possible answers A, B, C and D/.test(script) && /bi\?`<div dir=\"rtl\" lang=\"ur\"[^`]*?noteUr/.test(script));
check('OMR is restricted to Objective and non-front positions go to its end', /sheetKind==='single'\?s\.omrPos:\(s\.omrPos==='front'\?'front':'end'\)/.test(script) && /if\(s\.omr&&hasM&&omrPos==='end'\)/.test(script));
check('each previewed sheet repeats student fields', /paperInnerSheet\(Object\.assign/.test(script) && /infoPos==='top'/.test(script));
check('legacy Word export includes Both even if a preview tab is selected', /paperInner\(s,'export',true\)/.test(script));
check('two DOCX bodies merge into one document with a page break', /const objective=buildDocxSheet\(true,'objective'\),subjective=buildDocxSheet\(true,'subjective',true\)/.test(script) && /a\[1\]\}\$\{pageBreak\(\)\}\$\{b\[1\]\}/.test(script));
check('print preview preserves the boundary between sheets', /\.pp-sheet-page:not\(:last-child\)\{page-break-after:always;break-after:page\}/.test(css));

// Exercise the actual DOCX merge wrapper with controlled sheet XML, without jsdom or ZIP packages.
const start = script.indexOf('function pageBreak()'), end = script.indexOf('function buildDocxSheet(', start);
if (start < 0 || end < 0) throw new Error('DOCX merge functions not found');
const stub = vm.createContext({
  state: { sheetMode: 'two' },
  buildDocxSheet: (_raw, kind) => [
    { name: 'word/document.xml', data: `<w:document><w:body><w:p>${kind}</w:p><w:sectPr><w:pgSz/></w:sectPr></w:body></w:document>` },
    { name: 'word/_rels/document.xml.rels', data: '<Relationships/>' },
    { name: 'word/media/image3.png', data: new Uint8Array([1, 2, 3]) }
  ],
  zipStore: files => files
});
vm.runInContext(script.slice(start, end), stub);
const merged = vm.runInContext('buildDocx(true)', stub);
const doc = merged.find(f => f.name === 'word/document.xml').data;
check('DOCX merge returns one package file list', Array.isArray(merged) && merged.filter(f => f.name === 'word/document.xml').length === 1);
check('DOCX merge keeps both sheet bodies in Objective-then-Subjective order', doc.indexOf('<w:p>objective</w:p>') >= 0 && doc.indexOf('<w:p>objective</w:p>') < doc.indexOf('<w:p>subjective</w:p>'));
check('DOCX merge inserts exactly one inter-sheet page break', (doc.match(/w:type="page"/g) || []).length === 1);
check('DOCX merge retains the first sheet section properties and image parts', doc.includes('<w:sectPr><w:pgSz/></w:sectPr>') && merged.some(f => f.name === 'word/media/image3.png') && merged.some(f => f.name === 'word/_rels/document.xml.rels'));
const sheetCss=fs.readFileSync('app.css','utf8');
check('Paper format has an explicit native dropdown indicator', /#selSheetMode\{[^}]*appearance:auto;[^}]*-webkit-appearance:menulist;[^}]*background-image:none!important;[^}]*cursor:pointer/s.test(sheetCss));

console.log(fails ? `${fails} split-sheet check(s) failed` : 'split-sheet structure and DOCX merge OK');
process.exit(fails ? 1 : 0);

