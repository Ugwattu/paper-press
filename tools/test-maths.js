#!/usr/bin/env node
/* Course-level regression checks for official PECTAA Mathematics pairing schemes, ALP chapters and part-mark rules. */
const fs=require('fs'),path=require('path');
const {convert}=require('../bank-loader.js');
const {planLongGroups}=require('../app-long.js');
const root=path.join(__dirname,'..');let passed=0,failed=0;
const check=(label,ok)=>{if(ok){passed++;console.log('OK '+label);}else{failed++;console.error('FAIL '+label);}};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const expected={
 '9-maths':{marks:75,chapters:13,excluded:[8],mcq:15,mcqWeights:{1:1,2:1,3:2,4:2,5:1,6:2,7:1,9:1,10:1,11:1,12:1,13:1},short:[6,6,6],groups:[{attempt:2,questions:3,parts:'4+4'},{attempt:1,questions:2,parts:'4+4'}]},
 '10-maths':{marks:75,chapters:12,excluded:[],mcq:15,mcqWeights:{1:1,2:1,3:1,4:1,5:1,6:1,7:1,8:1,9:2,10:1,11:2,12:2},short:[6,6,6],groups:[{attempt:2,questions:3,parts:'4+4'},{attempt:1,questions:2,parts:'4+4'}]},
 '11-maths':{marks:100,chapters:14,excluded:[8],mcq:20,mcqWeights:{1:2,2:1,3:1,4:2,5:1,6:2,7:2,9:1,10:2,11:1,12:1,13:2,14:2},short:[8,8,9],groups:[{attempt:3,questions:5,parts:'5+5'}]},
 '12-maths':{marks:100,chapters:11,excluded:[],mcq:20,mcqWeights:{1:2,2:3,3:3,4:1,5:2,6:2,7:2,8:1,9:1,10:2,11:1},short:[8,8,9],groups:[{attempt:3,questions:5,parts:'5+5'}]}
};
for(const [id,w] of Object.entries(expected)){
 const j=JSON.parse(fs.readFileSync(path.join(root,'banks',id+'.json'),'utf8'));let b;
 try{b=convert(j,id+'.json');}catch(e){check(id+' bank converts ('+e.message+')',false);continue;}
 const p=b.patterns[0],chap=j.chapters.map(c=>c.number),group=p.longGroups;
 check(id+' keeps official course metadata and class language',j.marks===w.marks&&j.language===(Number(j.class)>=11?'english':'bilingual'));
 check(id+' defines all textbook chapters with verified chapter titles',chap.length===w.chapters&&j.chapters.every(c=>c.name&&!/^Chapter \d+$/.test(c.name)));
 check(id+' records ALP-active and fully excluded chapter numbers',same(j.alp.excludedChapters.slice().sort((a,b)=>a-b),w.excluded.slice().sort((a,b)=>a-b))&&same(j.alp.chapters.slice().sort((a,b)=>a-b),chap.filter(n=>!w.excluded.includes(n)).sort((a,b)=>a-b)));
 check(id+' uses official objective distribution and total MCQs',Object.values(p.mcq).reduce((n,v)=>n+v,0)===w.mcq&&same(p.mcq,w.mcqWeights));
 check(id+' encodes short-group attempts and marks',same(p.short.map(x=>x.attempt),w.short)&&p.shortMark===2);
 check(id+' encodes long group count, printed questions and attempt choices',group.length===w.groups.length&&group.every((g,i)=>g.attempt===w.groups[i].attempt&&g.questions.length===w.groups[i].questions));
 check(id+' applies exact part marks to every printed long question',group.every((g,i)=>g.questions.every(q=>q.parts.map(x=>x.marks).join('+')===w.groups[i].parts)));
 check(id+' pattern marks sum to the official paper maximum',p.totalMarks===w.marks&&p.totalMarks===w.mcq+(p.short.reduce((n,s)=>n+s.attempt,0)*p.shortMark)+group.reduce((n,g)=>n+g.totalMarks,0));
 check(id+' has chapter-validated fixed/either rules and no fabricated questions',group.every(g=>g.questions.every(q=>q.parts.every(part=>part.chapterRule.type==='fixed'||part.chapterRule.type==='either')&&q.parts.every(part=>(part.chapterRule.chapters||[]).every(ch=>j.alp.chapters.includes(ch)))))&&j.chapters.every(c=>!(c.mcq||[]).length&&!(c.short||[]).length&&!(c.long||[]).length));
 const numbered=planLongGroups(group,{activeChapters:j.alp.chapters,allChapters:chap,longCounts:{},picks:{},random:()=>0.31,startNo:5});
 check(id+' long question plan numbers every question sequentially by group position',numbered.flatMap(g=>g.questions).map(q=>q.no).join(',')===Array.from({length:group.reduce((n,g)=>n+g.questions.length,0)},(_,i)=>i+5).join(','));
}
const g9=JSON.parse(fs.readFileSync(path.join(root,'banks/9-maths.json'),'utf8'));
const g12=JSON.parse(fs.readFileSync(path.join(root,'banks/12-maths.json'),'utf8'));
check('Maths 9 preserves the two independent long-question groups (Part II and Part III)',g9.patterns[0].longGroups.map(g=>g.id).join(',')==='part-ii,part-iii');
check('Maths 9 Q8/Q9 keep the official either-chapter pairings',g9.patterns[0].longGroups[1].questions[0].parts[0].chapterRule.chapters.join(',')==='7,10'&&g9.patterns[0].longGroups[1].questions[1].parts[1].chapterRule.chapters.join(',')==='11,13');
check('Maths 12 records the published duplicate Q-6 label transparently',g12.patterns[0].note.includes('labels the fifth long-question group “Q-6” again'));
check('Maths 12 duration split remains marked inferred',g12.times.objective===30&&g12.times.subjective===150&&g12.times.basis==='inferred');
check('topic-level ALP deletion rules are attached to the correct chapters',Object.entries(expected).every(([id])=>{const j=JSON.parse(fs.readFileSync(path.join(root,'banks',id+'.json'),'utf8'));return j.exclusionRules.every(x=>j.chapters.some(c=>c.number===x.chapter)&&x.pattern&&x.name&&x.pages);}));
console.log(`\n${passed}/${passed+failed} Mathematics checks passed`);process.exit(failed?1:0);
