#!/usr/bin/env node
/* Regression checks for official ALP banks: Physics, Chemistry and Biology, grades 9–12. */
const fs = require('fs');
const path = require('path');
const { convert } = require('../bank-loader.js');
const { planLongGroups } = require('../app-long.js');

const expected = {
  '9-physics':   { marks:60, mcq:12, shorts:[5,5,5], longAttempt:2, longCount:3, partMarks:'4+5', chapters:9, excluded:[] },
  '9-chemistry': { marks:60, mcq:12, shorts:[5,5,5], longAttempt:2, longCount:3, partMarks:'5+4', chapters:13, excluded:[12,13] },
  '9-biology':   { marks:60, mcq:12, shorts:[5,5,5], longAttempt:2, longCount:3, partMarks:'5+4', chapters:11, excluded:[11] },
  '10-physics':  { marks:60, mcq:12, shorts:[5,5,5], longAttempt:2, longCount:3, partMarks:'4+5', chapters:12, excluded:[] },
  '10-chemistry':{ marks:60, mcq:12, shorts:[5,5,5], longAttempt:2, longCount:3, partMarks:'5+4', chapters:13, excluded:[] },
  '10-biology':  { marks:60, mcq:12, shorts:[5,5,5], longAttempt:2, longCount:3, partMarks:'5+4', chapters:10, excluded:[] },
  '11-physics':  { marks:85, mcq:17, shorts:[8,8,6], longAttempt:3, longCount:5, partMarks:'5+3', chapters:12, excluded:[] },
  '11-chemistry':{ marks:85, mcq:17, shorts:[8,8,6], longAttempt:3, longCount:5, partMarks:'4+4', chapters:14, excluded:[] },
  '11-biology':  { marks:85, mcq:17, shorts:[8,8,6], longAttempt:3, longCount:5, partMarks:'4+4', chapters:12, excluded:[7] },
  '12-physics':  { marks:85, mcq:17, shorts:[8,8,6], longAttempt:3, longCount:5, partMarks:'5+3', chapters:9, excluded:[] },
  '12-chemistry':{ marks:85, mcq:17, shorts:[8,8,6], longAttempt:3, longCount:5, partMarks:'4+4', chapters:17, excluded:[] },
  '12-biology':  { marks:85, mcq:17, shorts:[8,8,6], longAttempt:3, longCount:5, partMarks:'4+4', chapters:13, excluded:[22] },
};
let failures = 0, checks = 0;
function check(label, ok) {
  checks++;
  if (ok) console.log('OK ' + label);
  else { failures++; console.error('FAIL ' + label); }
}
function eq(a,b){ return JSON.stringify(a)===JSON.stringify(b); }

for (const [id, want] of Object.entries(expected)) {
  const filename = path.join(__dirname, '..', 'banks', id + '.json');
  const source = JSON.parse(fs.readFileSync(filename, 'utf8'));
  let converted;
  try { converted = convert(source, id + '.json'); }
  catch (e) { check(id + ' bank converts without schema errors (' + e.message + ')', false); continue; }
  const pattern = converted.patterns[0];
  const chapters = source.chapters.map(c => Number(c.number));
  const active = source.alp.chapters.map(Number);
  const excluded = source.alp.excludedChapters.map(Number);
  const groups = pattern.longGroups;
  check(id + ' has the expected course marks, chapter count and one pattern', source.marks===want.marks && chapters.length===want.chapters && converted.patterns.length===1);
  check(id + ' has the expected objective question count', Object.values(pattern.mcq).reduce((n,v)=>n+v,0)===want.mcq);
  check(id + ' has the expected short-question group attempts', eq(pattern.short.map(x=>x.attempt), want.shorts));
  check(id + ' has the expected long printed/attempt counts', groups.length===1 && groups[0].questions.length===want.longCount && groups[0].attempt===want.longAttempt);
  const marksEach = groups[0].questions[0].parts.reduce((n, part) => n + part.marks, 0);
  check(id + ' has the official total marks after part-weighting', pattern.totalMarks===want.marks && groups[0].totalMarks===want.longAttempt*marksEach);
  check(id + ' records the complete chapter-number set and exclusions', eq(chapters, Array.from({length:want.chapters},(_,i)=>chapters[0]+i)) && eq(excluded.sort((a,b)=>a-b),want.excluded.slice().sort((a,b)=>a-b)) && eq(active.slice().sort((a,b)=>a-b),chapters.filter(n=>!want.excluded.includes(n)).sort((a,b)=>a-b)));
  check(id + ' keeps science question content empty for authoring', source.chapters.every(c => !(c.mcq||[]).length && !(c.short||[]).length && !(c.long||[]).length));
  check(id + ' uses verified chapter titles rather than generic placeholders', source.chapters.every(c => !/^Chapter \d+$/.test(c.name)));
  check(id + ' has the correct course language', source.language === (Number(source.class)>=11?'english':'bilingual'));
  check(id + ' has the intended part marks', groups[0].questions.every(q=>q.parts.map(p=>p.marks).join('+')===want.partMarks));

  const plan = planLongGroups(groups, {
    activeChapters: active,
    allChapters: chapters,
    longCounts: {},
    random: () => 0.37,
    startNo: 5,
  });
  const planned = plan.flatMap(g=>g.questions);
  check(id + ' planner creates every long question and both parts', planned.length===want.longCount && planned.every(q=>q.parts.length===2));
  check(id + ' planner keeps all selected chapters inside active ALP scope', planned.every(q=>q.parts.every(p=>active.includes(p.chapter) && p.candidates.includes(p.chapter))));
  const diffRulesOk = planned.every(q=>q.parts.every((p,i)=>p.chapterRule.type!=='different-from-a' || p.chapter!==q.parts[0].chapter));
  check(id + ' planner obeys every different-from-part-a rule', diffRulesOk);
}

const p12 = JSON.parse(fs.readFileSync(path.join(__dirname,'..','banks','12-physics.json'),'utf8'));
const q7 = p12.patterns[0].longGroups[0].questions.find(q=>q.id==='q7');
const q7plan = planLongGroups([{...p12.patterns[0].longGroups[0],questions:[q7]}], {
  activeChapters:p12.alp.chapters, allChapters:p12.chapters.map(c=>c.number), random:()=>0, longCounts:{}
})[0].questions[0];
check('12-physics Q7 explicitly allows both parts from Chapter 17',q7plan.parts[0].chapter===17&&q7plan.parts[1].chapter===17);
const b12 = JSON.parse(fs.readFileSync(path.join(__dirname,'..','banks','12-biology.json'),'utf8'));
check('12-biology preserves textbook Chapter 22 while excluding it from ALP',b12.chapters.some(c=>c.number===22)&&b12.alp.excludedChapters.includes(22)&&!b12.alp.chapters.includes(22));
const p12c = JSON.parse(fs.readFileSync(path.join(__dirname,'..','banks','12-chemistry.json'),'utf8'));
check('12-chemistry preserves textbook numbering 17–33',eq(p12c.chapters.map(c=>c.number),Array.from({length:17},(_,i)=>17+i)));
check('12-biology full-chapter deletion is also recorded as a bank exclusion rule',b12.exclusionRules.some(x=>x.chapter===22&&x.pattern==='.*'));
console.log(`\n${failures} failure(s) across ${checks} checks`);
process.exit(failures ? 1 : 0);
