#!/usr/bin/env node
/* Course-picker group filter: Pre-Medical / Pre-Engineering / ICS / FA come from banks/manifest.json, not from code. */
const { loadApp } = require('./_app.js');
const { ev, dom } = loadApp();
let fail = 0; const check = (n, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) { fail++; console.error(`FAIL ${n}: wanted ${JSON.stringify(want)}, got ${JSON.stringify(got)}`); } };
const doc = dom.window.document;
const subjects = () => [...doc.querySelectorAll('#courseGrid [data-course]')].map(b => b.dataset.course.split('-')[1]).sort();
const chips = () => [...doc.querySelectorAll('#groupBar [data-group]')].map(b => b.dataset.group);
const click = (sel) => doc.querySelector(sel).click();
check('no group bar for class 9', (click('#gradeCard [data-grade="9"]'), doc.getElementById('groupBar').classList.contains('hidden')), true);
check('class 9 shows all five subjects', subjects(), ['biology', 'chemistry', 'computer', 'maths', 'physics']);
click('#gradeCard [data-grade="11"]');
check('class 11 group chips', chips(), ['all', 'pre-medical', 'pre-engineering', 'ics', 'fa']);
click('#groupBar [data-group="pre-medical"]');
check('pre-medical subjects', subjects(), ['biology', 'chemistry', 'physics']);
click('#groupBar [data-group="pre-engineering"]');
check('pre-engineering subjects', subjects(), ['chemistry', 'maths', 'physics']);
click('#groupBar [data-group="ics"]');
check('ICS subjects', subjects(), ['computer', 'maths', 'physics']);
click('#groupBar [data-group="all"]');
check('all subjects again', subjects().length, 5);
click('#groupBar [data-group="fa"]');
click('#gradeCard [data-grade="9"]');
check('switching to class 9 resets a group that does not apply', [subjects().length, doc.getElementById('groupBar').classList.contains('hidden')], [5, true]);
check('every course group id is defined in the manifest', ev('PP_COURSES.every(c=>c.groups.every(g=>PP_GROUPS.some(x=>x.id===g)))'), true);
if (fail) { console.error(`${fail} group check(s) failed`); process.exit(1); }
console.log('groups OK — group chips filter class 11/12 subjects from manifest data');
