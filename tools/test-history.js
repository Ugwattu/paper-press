#!/usr/bin/env node
/* Paper history: record, exact regeneration in a fresh session, cap/dedupe, clear, usage, backup inclusion, hostile data. */
const { loadApp } = require('./_app.js');
let n = 0, fails = 0; const ok = (c, m) => { n++; if (c) console.log('PASS ' + m); else { fails++; console.error('FAIL ' + m); } };
const ids = (ev) => ev('JSON.stringify([...built.mcq.map(q=>q.id),...built.short.flatMap(p=>p.items.map(q=>q.id)),...built.long.map(q=>q.id||(q.parts&&q.parts.map(x=>x.id).join("+"))||"")])');
const dump = (w) => { const o = {}; for (let i = 0; i < w.localStorage.length; i++) { const k = w.localStorage.key(i); o[k] = w.localStorage.getItem(k); } return o; };
const setup = (ev, seed) => ev(`state=JSON.parse(JSON.stringify(DEF));state.grade=10;state.sid='computer';state.alp=true;state.chapters=BOOKS['10-computer'].alpCh.slice(0,4);state.schemeId=offFor('10-computer').id;state.seed=${seed};state.omr=true;state.enSize=12;overrides={};sticky={};applySchemeCounts(true);render();`);

const A = loadApp(); setup(A.ev, 42);
/* pin one MCQ to a question the seed would not pick */
A.ev(`(()=>{const q0=built.mcq[0];const used=new Set(built.mcq.map(q=>q.id));const pool=BOOKS['10-computer'].mcq[q0.ch]||[];const alt=pool.find(q=>!used.has(q.id));if(alt){overrides[built.mcq[0]._key]=alt.id;}render();})()`);
const pinned = A.ev('Object.keys(overrides).length'); ok(pinned === 1, 'test paper has one pinned question');
const wantIds = ids(A.ev);
ok(A.ev('recordHistory()') === true, 'recordHistory stores the paper');
ok(A.ev('recordHistory()') === false, 'recording the identical paper again is de-duplicated');
const stored = JSON.parse(A.dom.window.localStorage.getItem('pp.history.v1'));
ok(stored.length === 1 && stored[0].seed === 42 && stored[0].course === '10-computer' && Object.keys(stored[0].pins).length === 1, 'entry keeps seed, course and pins');
ok(!/"question"|"en":/.test(JSON.stringify(stored)), 'entry stores ids only, never question text');
/* a fresh session regenerates exactly */
const B = loadApp({ storage: dump(A.dom.window) });
B.ev('state.seed=7;state.grade=9;state.sid="computer";overrides={};sticky={};syncSubject(9,"computer");state.chapters=BOOKS["9-computer"].alpCh.slice();state.schemeId=offFor("9-computer").id;state.enSize=10;state.omr=false;applySchemeCounts(true);render();');
ok(ids(B.ev) !== wantIds, 'sanity: other session starts with a different paper');
B.ev(`histRegenerate(histLoad()[0].id)`);
ok(ids(B.ev) === wantIds, 'regeneration reproduces every question id, in order');
ok(B.ev('state.seed') === 42 && B.ev('state.enSize') === 12 && B.ev('state.omr') === true && B.ev('cid()') === '10-computer', 'seed, layout settings and course are restored');
ok(B.ev('Object.keys(overrides).length') === 1, 'pins are restored');
/* cap, delete, clear, usage */
for (let i = 1; i <= 30; i++) { setup(A.ev, i); A.ev('recordHistory()'); }
ok(A.ev('histLoad().length') === 20, 'history is capped at 20 papers');
ok(A.ev('histLoad()[0].seed') === 30, 'newest paper is first');
ok(/History: 20 of 20 papers/.test(A.ev('(paintHistory(),document.getElementById("historyUsage").textContent)')), 'storage use is shown');
A.ev('histSave(histLoad().filter((x,i)=>i>0))'); ok(A.ev('histLoad().length') === 19, 'single entry can be deleted');
A.dom.window.confirm = () => true; A.dom.window.document.getElementById('btnHistClear').click();
ok(A.ev('histLoad().length') === 0 && A.dom.window.localStorage.getItem('pp.history.v1') === null, 'Clear history empties storage');
ok(A.ev('JSON.stringify(Object.keys(state).length>0)') === 'true' && A.ev('state.seed') === 30, 'clearing history leaves the current paper alone');
/* backup includes history */
setup(A.ev, 5); A.ev('recordHistory()');
ok(A.ev('Object.keys(localStorage).includes("pp.history.v1")'), 'history lives under a pp.* key, so backup collects it');
/* hostile / malformed data */
const P = '"><img src=x onerror="window.__pwned=1"><script>window.__pwned=2</script>';
const bad = [{ id: P, at: 1, course: '10-computer', seed: 5, schemeId: P, schemeName: P, chapters: [1, 'x', 1e9], pins: { [P]: P, k: { a: 1 } }, qids: [P, 5], cfg: { enFont: P, omrAlign: P, logo: 'javascript:1' } },
  { course: P, seed: 5 }, { course: '10-computer', seed: 500 }, 'junk', null, ...Array.from({ length: 100 }, (_, i) => ({ course: '10-computer', seed: 1 + (i % 99), id: 'x' + i }))];
const C = loadApp({ storage: { ...dump(A.dom.window), 'pp.history.v1': JSON.stringify(bad) } }); C.dom.window.__pwned = 0;
const cl = JSON.parse(C.ev('JSON.stringify(histLoad())'));
ok(cl.length === 20, 'hostile history is filtered and capped (' + cl.length + ')');
ok(cl.every((e) => /^\d{1,2}-[a-z0-9-]+$/.test(e.course) && e.seed >= 1 && e.seed <= 99), 'invalid courses and seeds are dropped');
ok(!/["<>{};]/.test(cl[0].cfg.enFont || '') && !/javascript:/.test(JSON.stringify(cl[0].cfg.logo || '')) && !('k' in cl[0].pins), 'cfg and pins are sanitised');
C.ev('paintHistory()');
const d = C.dom.window.document, hb = d.getElementById('historyList');
ok(!hb.querySelector('script,img[src="x"],[onerror]') && !C.dom.window.__pwned, 'rendered history list has no live payload');
/* huge entry list stays within the size cap */
const huge = Array.from({ length: 20 }, (_, i) => ({ course: '10-computer', seed: 1 + i, id: 'h' + i, pins: Object.fromEntries(Array.from({ length: 400 }, (_, j) => ['k' + j, 'v'.repeat(80)])), qids: Array(400).fill('q'.repeat(80)) }));
C.ev(`LS.set('pp.history.v1',${JSON.stringify(huge)})`);
C.ev('histSave(histLoad())');ok(C.dom.window.localStorage.getItem('pp.history.v1').length <= 400000, 'stored history is bounded to 400 KB');
console.log(`${n - fails}/${n} history checks passed`); process.exit(fails ? 1 : 0);
