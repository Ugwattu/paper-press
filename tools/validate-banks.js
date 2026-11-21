#!/usr/bin/env node
/* Validates banks/manifest.json and every bank file it lists.  Usage: node tools/validate-banks.js
   Errors (exit code 1) = the app would misbehave. Warnings = worth a look (typos, blanks, duplicates). */
const fs = require('fs'), path = require('path'), { convert } = require('../bank-loader.js');
const dir = path.join(__dirname, '..', 'banks');
let errors = 0, warns = 0;
const err = (m) => { errors++; console.error('ERROR ' + m); }, warn = (m) => { warns++; console.warn('warn  ' + m); };
const str = (v) => typeof v === 'string' && v.trim() !== '';
const KEYS = { top: ['schemaVersion', 'class', 'subject', 'subjectUr', 'alp', 'exclusionRules', 'chapters'], chapter: ['number', 'name', 'mcq', 'short', 'long'],
  mcq: ['question', 'questionUr', 'options', 'answer', 'alpExcluded'], short: ['question', 'questionUr', 'alpExcluded'], long: ['question', 'questionUr', 'source', 'alpExcluded'], option: ['en', 'ur'], rule: ['chapter', 'name', 'pages', 'pattern', 'flags'] };
const unknown = (o, allowed, where) => Object.keys(o).filter((k) => !k.startsWith('_') && !allowed.includes(k)).forEach((k) => warn(`${where}: unknown key "${k}" (typo?)`));
const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
const classes = new Set();
for (const b of manifest.banks) {
  const file = path.join(dir, b.file), tag = b.file;
  if (!fs.existsSync(file)) { err(`${tag}: listed in manifest.json but the file does not exist`); continue; }
  let j; try { j = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { err(`${tag}: invalid JSON — ${e.message}`); continue; }
  try { convert(j, tag); } catch (e) { err(e.message); continue; }
  unknown(j, KEYS.top, tag); classes.add(Number(j.class));
  if (Number(j.class) !== Number(b.class)) err(`${tag}: manifest says class ${b.class}, file says ${j.class}`);
  if (!str(j.subject)) err(`${tag}: "subject" is empty`);
  const nums = j.chapters.map((c) => c.number), c = { m: 0, s: 0, l: 0 }; let blankUr = 0;
  ((j.alp && j.alp.chapters) || []).forEach((n) => { if (!nums.includes(n)) err(`${tag}: alp.chapters lists ${n}, which is not a chapter`); });
  ((j.alp && j.alp.excludedChapters) || []).forEach((n) => { if (!nums.includes(n)) err(`${tag}: alp.excludedChapters lists ${n}, which is not a chapter`); });
  (j.exclusionRules || []).forEach((r, i) => { unknown(r, KEYS.rule, `${tag} exclusionRules[${i}]`); if (!nums.includes(r.chapter)) warn(`${tag}: exclusionRules[${i}] refers to chapter ${r.chapter}, which does not exist`); });
  j.chapters.forEach((ch) => { const at = (t, i) => `${tag} ch${ch.number} ${t} #${i + 1}`, seen = new Set(); unknown(ch, KEYS.chapter, `${tag} ch${ch.number}`);
    if (!str(ch.name)) err(`${tag} ch${ch.number}: "name" is empty`);
    (ch.mcq || []).forEach((q, i) => { c.m++; unknown(q, KEYS.mcq, at('mcq', i));
      if (!str(q.question)) err(`${at('mcq', i)}: empty question`);
      q.options.forEach((o, k) => { unknown(o, KEYS.option, at('mcq', i)); if (!str(o.en)) err(`${at('mcq', i)}: option ${'ABCD'[k]} has no English text`); if (!str(o.ur)) blankUr++; });
      const opts = q.options.map((o) => String(o.en).trim().toLowerCase()); if (new Set(opts).size < 4) warn(`${at('mcq', i)}: two options are identical`);
      if (seen.has(q.question)) warn(`${at('mcq', i)}: duplicate question text`); seen.add(q.question); });
    (ch.short || []).forEach((q, i) => { c.s++; unknown(q, KEYS.short, at('short', i)); if (!str(q.question)) err(`${at('short', i)}: empty question`); if (!str(q.questionUr)) blankUr++; });
    (ch.long || []).forEach((q, i) => { c.l++; unknown(q, KEYS.long, at('long', i)); if (!str(q.question)) err(`${at('long', i)}: empty question`); if (q.source && !['bank', 'composed'].includes(q.source)) err(`${at('long', i)}: "source" must be "bank" or "composed"`); if (!str(q.questionUr)) blankUr++; }); });
  console.log(`${tag}: class ${j.class} · ${j.chapters.length} chapters · ${c.m} MCQ · ${c.s} short · ${c.l} long · ${blankUr} blank Urdu cells (info)`);
}
if (!classes.has(9) || !classes.has(10)) err('manifest.json must include a bank for class 9 and class 10');
console.log(`\n${errors} error(s), ${warns} warning(s)`);
process.exit(errors ? 1 : 0);
