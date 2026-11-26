"use strict";
/* ══════════ SCHEMES ══════════ */
const allSchemes=()=>OFFICIAL.concat(customSchemes);
const courseSchemes=courseId=>allSchemes().filter(s=>s.courseId===courseId);
function activeScheme(){return allSchemes().find(s=>s.id===state.schemeId&&s.courseId===cid())||offFor(cid());}
function schemeTotals(s){
 const mcq=sum(s.mcq),parts=s.short.length;
 const printed=s.short.map(p=>sum(p.ch));
 const sh=s.short.reduce((a,p)=>a+p.attempt*s.shortMark,0),groups=s.longGroups||[],long=groups.length?groups.reduce((n,g)=>n+(g.totalMarks!=null?g.totalMarks:g.attempt*(g.questions[0]||{parts:[]}).parts.reduce((m,p)=>m+p.marks,0)),0):s.longAttempt*s.longMark;
 return{mcq,parts,printed,short:sh,long,longGroups:groups,total:mcq*s.mcqMark+sh+long};
}
function saveSchemes(){LS.set('pp.schemes.v7',customSchemes);}
function applySchemeCounts(silent){
 const s=activeScheme(),t=schemeTotals(s);
 state.mcqCount=t.mcq;state.mcqMark=s.mcqMark;
 state.shortParts=t.parts;state.shortPrinted=Math.max(2,...t.printed);
 state.shortAttempts=s.short.map(p=>p.attempt);while(state.shortAttempts.length<4)state.shortAttempts.push(4);
 state.shortMark=s.shortMark;state.longPrinted=s.longGroups&&s.longGroups.length?s.longGroups.reduce((n,g)=>n+g.questions.length,0):s.long.length;state.longAttempt=s.longGroups&&s.longGroups.length?s.longGroups.reduce((n,g)=>n+g.attempt,0):s.longAttempt;state.longMark=s.longMark;
 state.longPick={};
 if(!silent){markDirty();render();toast('Counts synced to “'+s.name+'” — '+t.total+' marks','ok');}
}
function useScheme(id){
 const s=allSchemes().find(x=>x.id===id);if(!s)return;
 state.schemeId=s.id;state.longPick={};
 if(s.courseId!==cid()){state.grade=s.grade;state.sid=s.sid;state.timeObj=0;state.timeSubj=0;state.klass=B().name;syncSubject(state.grade,state.sid);state.chapters=B().alpCh.slice();overrides={};sticky={};activeSlot=null;buildChips();paintCourseUI();renderPresets();}
 applySchemeCounts(true);markDirty();render();
 toast('Scheme “'+s.name+'” active','ok');
}
function schemeChapters(s){const set=new Set();Object.keys(s.mcq).forEach(c=>{if(s.mcq[c]>0)set.add(+c)});s.short.forEach(p=>Object.keys(p.ch).forEach(c=>{if(p.ch[c]>0)set.add(+c)}));s.long.forEach(a=>a.forEach(c=>set.add(c)));(s.longGroups||[]).forEach(g=>g.questions.forEach(q=>q.parts.forEach(p=>(p.chapterRule.chapters||[]).forEach(c=>set.add(c)))));return[...set].sort((a,b)=>a-b);}

