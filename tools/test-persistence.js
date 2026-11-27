#!/usr/bin/env node
/* Data must survive updates: load a browser profile that was written by the ORIGINAL version of the app
   (tools/fixtures/profile-original-app.json) into the current code and check nothing is lost or reset. */
const fs = require('fs'), path = require('path'), { loadApp } = require('./_app.js');
const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'profile-original-app.json'), 'utf8'));
const { dom, ev } = loadApp({ storage: fixture });
let fails = 0;
const check = (label, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) { fails++; console.error(`FAIL ${label}: wanted ${JSON.stringify(want)}, got ${JSON.stringify(got)}`); } };
const s = (c) => ev(c);
check('title', s('state.title'), 'Old Title');
check('legacy course defaults to Computer', s('cid()'), '9-computer');
check('legacy custom scheme migrated to course', s('customSchemes[0].courseId'), '9-computer');
check('course-bound ALP factory presets across all manifest courses', s('COURSE_FACTORY.map(p=>p.courseId)'), JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'banks', 'manifest.json'), 'utf8')).courses.map(c=>c.id));
check('institute', s('state.institute'), 'My Old School');
check('MCQ count', s('state.mcqCount'), 12);
check('OMR columns', s('state.omrCols'), 3);
check('margin', s('state.margin'), 30);
check('English font', s('state.enFont'), 'Arial');
check('bilingual flag', s('state.showUrdu'), false);
check('saved zoom', s('state.zoom'), 87);
check('selected scheme', s('state.schemeId'), 'custom-x1');
check('custom scheme kept', s('customSchemes.map(x=>x.name)'), ['My Custom Scheme']);
check('preset kept', s('presets.map(x=>x.name)'), ['My Preset']);
check('theme', dom.window.document.documentElement.dataset.theme, 'dark');
check('logo kept', !!s('state.logo'), true);
check('new options get defaults', s('[state.insAuto,state.hdrStyle,state.infoStyle]'), [true, 'classic', 'table']);
check('legacy free-text time removed', s('state.time'), undefined);
check('legacy preset free-text time migrated away', s("presets[0].cfg.time"), undefined);
check('legacy preset timing inherits course defaults', s('[presets[0].cfg.timeObj,presets[0].cfg.timeSubj]'), [0,0]);
/* after the app has saved again, the stored data must still hold the user's values */
s('flushState()');
const st = JSON.parse(dom.window.localStorage.getItem('pp.state.v7'));
check('stored title after save', st.title, 'Old Title');
check('logo still in storage until IndexedDB confirms it', !!st.logo, true);
check('presets still stored', JSON.parse(dom.window.localStorage.getItem('pp.presets.v7')).length, 1);
check('schemes still stored', JSON.parse(dom.window.localStorage.getItem('pp.schemes.v7')).length, 1);
check('safety copy made for the new build', !!JSON.parse(dom.window.localStorage.getItem('pp.autobackup') || 'null'), true);
/* system presets can be removed, stay removed, and can be brought back */
s("deletePresets(['f-nastaliq'])");
check('system preset removed', s("allPresets().some(p=>p.id==='f-nastaliq')"), false);
check('removal remembered in storage', JSON.parse(dom.window.localStorage.getItem('pp.hiddenFactory.v1') || '[]'), ['f-nastaliq']);
check('user preset untouched by removing a system one', s('presets.length'), 1);
s("document.getElementById('preRestoreF').click()");
check('system presets restored', s("allPresets().some(p=>p.id==='f-nastaliq')"), true);
console.log(fails ? `${fails} persistence check(s) failed` : 'persistence OK — an existing profile loads with every setting, preset, scheme and logo intact');
process.exit(fails ? 1 : 0);
