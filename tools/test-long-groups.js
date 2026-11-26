#!/usr/bin/env node
/* Schema regression tests for science-style, part-based long-question groups. */
const {convert}=require('../bank-loader.js');
let errors=0,checks=0;
function check(label,ok){checks++;if(ok)console.log('OK '+label);else{errors++;console.error('FAIL '+label);}}
function bank(pattern){return{
 schemaVersion:2,courseId:'12-physics',class:12,classLabel:'2nd Year',classUr:'',subjectId:'physics',code:'PHY-12',subject:'Physics',subjectUr:'',language:'english',marks:14,
 times:{objective:20,subjective:160,basis:'inferred'},alp:{chapters:[13,14,15,16,17],excludedChapters:[],summary:'test'},exclusionRules:[],
 chapters:[13,14,15,16,17,18].map(n=>({number:n,name:'Chapter '+n,mcq:[],short:[],long:[]})),patterns:[pattern]
};}
function base(){return{
 id:'test',name:'Science split-part test',mcq:{13:1},mcqMark:1,
 short:[{ch:{13:4},attempt:2}],shortMark:2,totalMarks:14,
 longGroups:[{id:'main',name:'Detailed questions',attempt:1,questions:[
  {id:'q5',parts:[
   {label:'a',marks:5,chapterRule:{type:'either',chapters:[13,14]}},
   {label:'b',marks:4,chapterRule:{type:'different-from-a'}}
  ]},
  {id:'q6',parts:[
   {label:'a',marks:5,chapterRule:{type:'fixed',chapters:[15]}},
   {label:'b',marks:4,chapterRule:{type:'any'}}
  ]}
 ]}]
};}
const converted=convert(bank(base()),'long-groups-test.json');
const p=converted.patterns[0],g=p.longGroups[0];
check('part-based long group normalizes two questions and their parts',g.questions.length===2&&g.questions.every(q=>q.parts.length===2));
check('marks are calculated independently for parts and attempts',g.marksEach===9&&g.totalMarks===9&&p.totalMarks===14);
check('either, fixed, any and different-from-a rules are retained',g.questions[0].parts[0].chapterRule.type==='either'&&g.questions[1].parts[0].chapterRule.type==='fixed'&&g.questions[1].parts[1].chapterRule.type==='any'&&g.questions[0].parts[1].chapterRule.type==='different-from-a');
check('any rules can defer their candidates to the active ALP chapter list',g.questions[1].parts[1].chapterRule.chapters.length===0);
check('chapter numbers may be non-sequential textbook numbers',g.questions[1].parts[0].chapterRule.chapters[0]===15&&converted.meta.alpCh.join(',')==='13,14,15,16,17');
check('legacy long fields are safely empty for a group-based pattern',p.long.length===0&&p.longMark===0&&p.longAttempt===1);
function rejects(label,mutate){const j=bank(base());mutate(j.patterns[0]);let ok=false;try{convert(j,'invalid-long-groups-test.json');}catch(e){ok=true;}check(label,ok);}
rejects('rejects different-from-a on part (a)',p=>{p.longGroups[0].questions[0].parts[0].chapterRule={type:'different-from-a'};});
rejects('rejects a fixed rule with multiple chapters',p=>{p.longGroups[0].questions[0].parts[0].chapterRule={type:'fixed',chapters:[13,14]};});
rejects('rejects a missing chapter reference',p=>{p.longGroups[0].questions[0].parts[0].chapterRule={type:'fixed',chapters:[99]};});
rejects('rejects a chapter outside the ALP scope',p=>{p.longGroups[0].questions[0].parts[0].chapterRule={type:'fixed',chapters:[18]};});
rejects('rejects a group attempt greater than printed questions',p=>{p.longGroups[0].attempt=3;});
rejects('rejects inconsistent part marks inside a group',p=>{p.longGroups[0].questions[1].parts[1].marks=5;});
rejects('rejects duplicate part labels',p=>{p.longGroups[0].questions[0].parts[1].label='a';});
rejects('rejects mixing legacy long slots and longGroups',p=>{p.long=[[13]];p.longAttempt=1;p.longMark=9;});
rejects('rejects an incorrect total mark calculation',p=>{p.totalMarks=15;});
console.log(`\n${errors} failure(s) across ${checks} checks`);process.exit(errors?1:0);
