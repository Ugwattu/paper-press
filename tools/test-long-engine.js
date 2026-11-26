#!/usr/bin/env node
/* Pure tests for grouped science long-question chapter allocation. */
const {planLongGroups}=require('../app-long.js');
let failures=0,checks=0;
function check(label,ok){checks++;if(ok)console.log('OK '+label);else{failures++;console.error('FAIL '+label);}}
const groups=[{id:'detailed',name:'Detailed questions',attempt:2,questions:[
 {id:'q5',parts:[{label:'a',marks:5,chapterRule:{type:'either',chapters:[13,14,15]}},{label:'b',marks:3,chapterRule:{type:'different-from-a'}}]},
 {id:'q6',parts:[{label:'a',marks:5,chapterRule:{type:'fixed',chapters:[16]}},{label:'b',marks:3,chapterRule:{type:'any'}}]},
 {id:'q7',parts:[{label:'a',marks:5,chapterRule:{type:'any',chapters:[13,14,17]}},{label:'b',marks:3,chapterRule:{type:'different-from-a',chapters:[14,15,16,17]}}]}
]}];
const opts={activeChapters:[13,14,15,16,17],allChapters:[13,14,15,16,17,18],longCounts:{13:1,14:1,15:1,16:1,17:1},random:()=>0.4,startNo:7};
const result=planLongGroups(groups,opts),g=result[0];
check('planner preserves group attempt count and marks',g.attempt===2&&g.marksEach===8&&g.totalMarks===16);
check('planner numbers long questions from the supplied starting number',g.questions.map(q=>q.no).join(',')==='7,8,9');
check('fixed chapter rule selects its only chapter',g.questions[1].parts[0].chapter===16);
check('either rule selects only from its declared chapter list',[13,14,15].includes(g.questions[0].parts[0].chapter));
check('different-from-a always selects a different chapter',g.questions.every(q=>q.parts[1].chapter!==q.parts[0].chapter));
check('any rule selects from the active ALP chapter list',opts.activeChapters.includes(g.questions[1].parts[1].chapter));
const forced=planLongGroups(groups,{...opts,picks:{'lg0.q0.p0':15,'lg0.q0.p1':13},random:()=>0});
check('user chapter overrides are applied when eligible',forced[0].questions[0].parts[0].chapter===15&&forced[0].questions[0].parts[1].chapter===13);
const noContent=planLongGroups(groups,{...opts,longCounts:{},random:()=>0});
check('empty authored question pools still produce an ALP pattern plan',noContent[0].questions.length===3&&noContent[0].questions[0].parts.length===2);
let rejects=false;try{planLongGroups([{id:'bad',attempt:1,questions:[{id:'x',parts:[{label:'a',marks:4,chapterRule:{type:'fixed',chapters:[99]}}]}]}],opts);}catch(e){rejects=true;}
check('planner fails clearly when a rule has no eligible course chapter',rejects);
console.log(`\n${failures} failure(s) across ${checks} checks`);process.exit(failures?1:0);
