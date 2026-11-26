"use strict";
/* ══════════ GROUPED LONG-QUESTION PLANNER ══════════ */
/* Kept pure so chapter-rule behavior can be tested without a browser/DOM. */
function planLongGroups(groups, options) {
 options=options||{};
 const active=(options.activeChapters||[]).map(Number), all=(options.allChapters||active).map(Number);
 const longCounts=options.longCounts||{}, picks=options.picks||{}, random=typeof options.random==='function'?options.random:Math.random;
 const count=c=>Number(longCounts[c]||0);
 const choose=arr=>arr[Math.min(arr.length-1,Math.floor(random()*arr.length))];
 let nextNo=Number(options.startNo)||5;
 return (groups||[]).map((group,gi)=>{
  const questions=(group.questions||[]).map((question,qi)=>{
   const parts=[];let chapterA=null;
   for(let pi=0;pi<question.parts.length;pi++){
    const part=question.parts[pi],rule=part.chapterRule||{type:'any'},explicit=Array.isArray(rule.chapters)&&rule.chapters.length>0;
    let raw=explicit?rule.chapters.map(Number):active.slice();
    if(rule.type==='any'&&!explicit)raw=active.slice();
    if(rule.type==='different-from-a'&&!explicit)raw=active.slice();
    raw=raw.filter((c,i)=>all.includes(c)&&raw.indexOf(c)===i);
    if(!raw.length)throw new Error(`No chapter from the rule exists in this course for ${group.id}/${question.id} part ${part.label}`);
    if(rule.type==='different-from-a'&&chapterA!=null)raw=raw.filter(c=>c!==chapterA);
    let candidates=raw.filter(c=>active.includes(c));
    /* Fixed/either rules remain usable if a user temporarily unticks every chapter in that rule. */
    if(!candidates.length)candidates=raw.slice();
    if(!candidates.length&&rule.type==='different-from-a')candidates=active.filter(c=>c!==chapterA);
    if(!candidates.length)candidates=all.filter(c=>rule.type!=='different-from-a'||c!==chapterA);
    if(!candidates.length)throw new Error(`No eligible chapter remains for ${group.id}/${question.id} part ${part.label}`);
    const withQuestions=candidates.filter(c=>count(c)>0);
    if(withQuestions.length)candidates=withQuestions;
    const key=`lg${gi}.q${qi}.p${pi}`,forced=Number(picks[key]);
    const chapter=candidates.includes(forced)?forced:choose(candidates);
    if(part.label==='a'||pi===0)chapterA=chapter;
    parts.push({label:part.label,marks:part.marks,chapter,chapterRule:rule,candidates,key});
   }
   return{id:question.id,no:nextNo++,marks:parts.reduce((n,p)=>n+p.marks,0),parts};
  });
  const marksEach=questions[0]?questions[0].marks:Number(group.marksEach)||0,attempt=Math.min(Number(group.attempt)||1,questions.length);
  return{id:group.id,name:group.name,attempt,marksEach,totalMarks:attempt*marksEach,questions};
 });
}
if(typeof window!=='undefined')window.PPLongGroups={plan:planLongGroups};
if(typeof module!=='undefined'&&module.exports)module.exports={planLongGroups};
