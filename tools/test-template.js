#!/usr/bin/env node
/* Validates that the checked-in authoring template follows the live schema-v2 converter. */
const fs = require('fs');
const path = require('path');
const { convert } = require('../bank-loader.js');
const file = path.join(__dirname, '..', 'banks', '_template.json');
const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
let failures = 0;
const check = (label, ok) => { if (!ok) { failures++; console.error(`FAIL ${label}`); } else console.log(`OK ${label}`); };
let converted = null;
try { converted = convert(raw, 'banks/_template.json'); }
catch (e) { failures++; console.error(`FAIL template conversion: ${e.message}`); }
check('template is schema version 2', raw.schemaVersion === 2);
check('course id, class and subject id agree', raw.courseId === `${raw.class}-${raw.subjectId}`);
check('template converts with the production bank loader', !!converted && converted.courseId === raw.courseId);
check('template timing and language metadata are valid', !!converted && ['bilingual', 'english'].includes(converted.meta.language) && converted.meta.times.objective > 0 && converted.meta.times.subjective > 0);
check('template demonstrates the four-option MCQ shape', raw.chapters[0].mcq[0].options.length === 4 && raw.chapters[0].mcq[0].answer === 'A');
check('template has ALP and exclusion-rule arrays', Array.isArray(raw.alp.chapters) && Array.isArray(raw.alp.excludedChapters) && Array.isArray(raw.exclusionRules));
check('template supports patterns and question sections', Array.isArray(raw.patterns) && ['mcq', 'short', 'long'].every((k) => Array.isArray(raw.chapters[0][k])));
check('template shows optional question and MCQ-option figure fields', raw.chapters[0].mcq[0].figure === '' && raw.chapters[0].mcq[0].options.every((o) => Object.prototype.hasOwnProperty.call(o, 'figure')) && raw.chapters[0].short[0].figure === '' && raw.chapters[0].long[0].figure === '');
check('template documents safe rich text and figure authoring syntax', raw._help.some((x) => x.includes('<sup>') && x.includes('^{mass}_{atomic}')) && raw._help.some((x) => x.includes('figures/')));
check('template documents split-part longGroups rules', raw._help.some((x) => x.includes('longGroups') && x.includes('different-from-a') && x.includes('chapterRule')));
check('template documents inline/display LaTeX and the MathJax dependency',raw._help.some(x=>x.includes('LaTeX')&&x.includes('MathJax')&&x.includes('\\frac')&&x.includes('PNG')));
console.log(failures ? `${failures} template check(s) failed` : 'template OK — authoring example matches schema v2');
process.exit(failures ? 1 : 0);
