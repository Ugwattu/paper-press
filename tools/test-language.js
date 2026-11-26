#!/usr/bin/env node
/* English-only enforcement for 1st/2nd year, while retaining the user's bilingual preference in 9th/10th. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const { convert } = require('../bank-loader.js');
const root = path.join(__dirname, '..');
const { readAppSource } = require('./_source.js');
const script = readAppSource();
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'banks/manifest.json'), 'utf8'));
const BOOKS = {};
for (const c of manifest.courses) {
  const converted = convert(JSON.parse(fs.readFileSync(path.join(root, 'banks', c.file), 'utf8')), c.file);
  BOOKS[c.id] = { lang: converted.meta.language };
}
const state = { grade: 9, sid: 'computer', showUrdu: true };
const context = vm.createContext({ state, BOOKS, cid: () => `${state.grade}-${state.sid}`, Boolean });
vm.runInContext(`const B=()=>BOOKS[cid()]||BOOKS['9-computer'];\nconst isBilingualCourse=()=>B().lang==='bilingual';\nconst urduOn=(s=state)=>isBilingualCourse()&&!!(s&&s.showUrdu);`, context);
const check = (name, actual, expected) => {
  if (actual !== expected) { console.error(`FAIL ${name}: got ${actual}, expected ${expected}`); failures++; }
  else console.log(`OK ${name}`);
};
let failures = 0;
const run = code => vm.runInContext(code, context);

check('all 9th/10th courses are marked bilingual', Object.entries(BOOKS).filter(([id]) => /^(9|10)-/.test(id)).every(([, b]) => b.lang === 'bilingual'), true);
check('all 11th/12th courses are marked English-only', Object.entries(BOOKS).filter(([id]) => /^(11|12)-/.test(id)).every(([, b]) => b.lang === 'english'), true);
check('9th course permits Urdu when preference is on', run('urduOn()'), true);
check('9th course respects Urdu preference off', run('(state.showUrdu=false,urduOn())'), false);
check('10th course permits Urdu when preference is on', run('(state.grade=10,state.showUrdu=true,urduOn())'), true);
check('11th course suppresses Urdu even when preference is on', run('(state.grade=11,urduOn())'), false);
check('12th course suppresses Urdu even when preference is on', run('(state.grade=12,urduOn())'), false);
check('bilingual preference is retained while on English-only course', run('(state.grade=11,state.showUrdu)'), true);

const paper = script.slice(script.indexOf('function paperInnerSheet('), script.indexOf('function omrHTML('));
const omr = script.slice(script.indexOf('function omrHTML('), script.indexOf('function wordHtmlDoc('));
const legacyStart = script.indexOf('function wordHtmlDoc('), legacyEnd = script.indexOf('/* ══════════ ZIP + DOCX', legacyStart);
const legacyWord = script.slice(legacyStart, legacyEnd);
const docxStart = script.indexOf('function buildDocx('), docxEnd = script.indexOf('\nfunction analyse()', docxStart);
const docx = script.slice(docxStart, docxEnd);
check('HTML preview uses effective course language', /bi=urduOn\(s\)/.test(paper), true);
check('HTML preview OMR uses effective course language', /s\.omrUrdu&&urduOn\(s\)/.test(omr), true);
check('legacy Word export uses the guarded HTML preview', /paperInner\(s,'export',true\)/.test(legacyWord), true);
check('DOCX export uses effective course language', /bi=urduOn\(s\)/.test(docx), true);
check('no output path reads showUrdu directly', !/s\.showUrdu|state\.showUrdu/.test(paper + omr + legacyWord + docx), true);

for (const id of ['subjectUrWrap', 'urduTypeControls', 'omrUrduControl', 'bilingualToggle'])
  check(`settings wrapper exists: ${id}`, html.includes(`id="${id}"`) && script.includes(`$('${id}').classList.toggle('hidden',!bilingual)`), true);
check('serial width hint changes for English-only courses', html.includes('id="numWidthHint"') && script.includes("'One serial column. No marks column.'"), true);
check('English-only picker hides Urdu question text', /isBilingualCourse\(\)\?`<div class="ur">/.test(script), true);
check('Urdu keyboard shortcut is blocked on English-only courses', /if\(isBilingualCourse\(\)\)flip\('showUrdu','Bilingual'\);else toast\('Urdu is not available/.test(script), true);

console.log(failures ? `${failures} language check(s) failed` : 'language OK — English-only suppression, retained preference, preview/export/UI and picker verified');
process.exit(failures ? 1 : 0);
