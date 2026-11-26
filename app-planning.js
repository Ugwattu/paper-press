"use strict";
/* ══════════ PLANNING ══════════ */
function activeCh(){const b=B();return state.chapters.filter(c=>b.chapters.includes(c)).filter(c=>!state.alp||!b.alpEx.includes(c)).sort((a,b2)=>a-b2);}
function contentConfig(c){const course=cid(),b=B(),base=b.contentCatalog[c]||{},custom=(state.contentCatalogCustom&&state.contentCatalogCustom[course]&&state.contentCatalogCustom[course][c])||{},ov=(state.contentExcludedOverrides&&state.contentExcludedOverrides[course]&&state.contentExcludedOverrides[course][c])||{};return{topics:[...(base.topics||[]),...(custom.topics||[])].map(x=>Object.assign({},x,{alpExcluded:ov.topics&&Object.prototype.hasOwnProperty.call(ov.topics,x.id)?!!ov.topics[x.id]:!!x.alpExcluded})),exercises:[...(base.exercises||[]),...(custom.exercises||[])].map(x=>Object.assign({},x,{alpExcluded:ov.exercises&&Object.prototype.hasOwnProperty.call(ov.exercises,x.id)?!!ov.exercises[x.id]:!!x.alpExcluded}))};}
function contentSelection(c){return((state.contentSelection||{})[cid()]||{})[c]||{topics:[],exercises:[],includeUntagged:true};}
function questionTags(q){const base=q.content||{},custom=(((state.questionTags||{})[cid()]||{})[q.id]||{});return{topics:[...new Set([...(base.topics||[]),...(custom.topics||[])])],exercises:[...new Set([...(base.exercises||[]),...(custom.exercises||[])])]};}
function contentMatches(q,c){const sel=contentSelection(c),catalog=contentConfig(c),topics=(sel.topics||[]).filter(id=>!state.alp||!catalog.topics.some(x=>x.id===id&&x.alpExcluded)),exercises=(sel.exercises||[]).filter(id=>!state.alp||!catalog.exercises.some(x=>x.id===id&&x.alpExcluded));if(!topics.length&&!exercises.length)return !(state.alp&&((sel.topics||[]).length||(sel.exercises||[]).length));const tags=questionTags(q),qt=tags.topics||[],qe=tags.exercises||[];if(sel.includeUntagged===true&&!qt.length&&!qe.length)return true;return topics.some(id=>qt.includes(id))||exercises.some(id=>qe.includes(id));}
function pool(t,c){const a=(B()[t][c]||[]);return(state.alp?a.filter(q=>!q.ex):a.slice()).filter(q=>contentMatches(q,c));}
function caps(c){return{m:pool('mcq',c).length,s:pool('short',c).length,l:pool('long',c).length};}
function findAny(t,id){const b=B();for(const c of b.chapters){const q=(b[t][c]||[]).find(x=>x.id===id);if(q)return q;}return null;}
function alloc(total,chs,w,cap){const out={};chs.forEach(c=>out[c]=0);if(!chs.length)return{out,placed:0};
 const ws=chs.reduce((a,c)=>a+(w[c]||0),0)||chs.length;let p=0,g=0;
 while(p<total&&g++<900){let best=null,bs=-Infinity;
  for(const c of chs){if(out[c]>=(cap[c]||0))continue;const sc=total*((w[c]||0)||.35)/ws-out[c];if(sc>bs+1e-9){bs=sc;best=c;}}
  if(best===null)break;out[best]++;p++;}
 return{out,placed:p};}
function groupedLong(s=activeScheme()){return Array.isArray(s.longGroups)&&s.longGroups.length>0;}
function longSlots(){
 const s=activeScheme(),chs=activeCh();
 return s.long.map((allow,i)=>{
  let av=allow.filter(c=>chs.includes(c)&&caps(c).l>0);
  if(!av.length)av=allow.filter(c=>B().chapters.includes(c)&&caps(c).l>0);
  if(!av.length)av=chs.filter(c=>caps(c).l>0);
  if(!av.length)av=chs.slice();
  return{allow,av};});
}
/* Paper sections: any of MCQ / short / long can be switched off (never all three). Numbering follows what is printed. */
const secM=()=>state.incMcq!==false||(state.incShort===false&&state.incLong===false);
const secS=()=>state.incShort!==false,secL=()=>state.incLong!==false;
const shortQ0=()=>1+(secM()?1:0),longQ0=()=>shortQ0()+(secS()?state.shortParts:0);
function makePlan(){
 const b=B(),sch=activeScheme(),chs=activeCh(),cm={},cs={},cl={};
 chs.forEach(c=>{const k=caps(c);cm[c]=k.m;cs[c]=k.s;cl[c]=k.l;});
 const maxM=sum(cm),maxS=sum(cs),maxL=sum(cl),groupMode=groupedLong(sch);
 state.mcqCount=clamp(state.mcqCount,1,Math.max(1,maxM));
 state.shortParts=clamp(state.shortParts,1,4);
 state.shortPrinted=clamp(state.shortPrinted,2,Math.max(2,Math.min(8,Math.floor(maxS/state.shortParts)||2)));
 if(!groupMode){state.longPrinted=clamp(state.longPrinted,1,Math.max(1,maxL));state.longAttempt=clamp(state.longAttempt,1,state.longPrinted);}
 while(state.shortAttempts.length<4)state.shortAttempts.push(state.shortPrinted);
 for(let i=0;i<4;i++)state.shortAttempts[i]=clamp(state.shortAttempts[i],1,state.shortPrinted);
 const wM={};chs.forEach(c=>wM[c]=sch.mcq[c]||0);
 if(!chs.some(c=>wM[c]>0))chs.forEach(c=>wM[c]=1);
 const mA=secM()?alloc(state.mcqCount,chs,wM,cm):{out:{},placed:0};
 const parts=[];
 for(let p=0;p<(secS()?state.shortParts:0);p++){
  const src=sch.short[p%sch.short.length]||{ch:{},attempt:4};
  let group=Object.keys(src.ch).map(Number).filter(c=>chs.includes(c)&&src.ch[c]>0);
  if(!group.length)group=chs.filter((_,i)=>i%state.shortParts===p);
  if(!group.length)group=chs.slice();
  const w={};group.forEach(c=>w[c]=src.ch[c]||1);
  parts.push({group,w});}
 const rem=Object.assign({},cs);let minP=state.shortPrinted;
 parts.forEach(pt=>{const a=alloc(state.shortPrinted,pt.group,pt.w,rem);pt.alloc=a.out;pt.placed=a.placed;
  pt.group.forEach(c=>rem[c]-=a.out[c]);minP=Math.min(minP,a.placed);});
 if(minP<state.shortPrinted&&minP>=2){state.shortPrinted=minP;for(let i=0;i<4;i++)state.shortAttempts[i]=clamp(state.shortAttempts[i],1,minP);return makePlan();}
 parts.forEach((pt,i)=>{pt.q=i+shortQ0();pt.attempt=clamp(state.shortAttempts[i],1,state.shortPrinted);});
 const r=rng(state.seed*7919+state.grade*104729),slots=[],lch=[],lslot=[];
 let longGroups=[];
 if(groupMode){
  longGroups=secL()?PPLongGroups.plan(sch.longGroups,{activeChapters:chs,allChapters:b.chapters,longCounts:cl,picks:state.longPick,random:r,startNo:longQ0()}):[];
  longGroups.forEach((g,gi)=>g.questions.forEach((q,qi)=>q.parts.forEach((pt,pi)=>{
   slots.push({key:pt.key,type:'long',ch:pt.chapter,planCh:pt.chapter,label:`Q.${q.no} (${pt.label})`,groupIndex:gi,questionIndex:qi,partIndex:pi});lch.push(pt.chapter);
  })));
 }else{
  const old=longSlots();
  for(let i=0;i<(secL()?state.longPrinted:0);i++){
   const sl=old[i%old.length]||{allow:chs,av:chs},forced=state.longPick[i];
   const c=(forced&&sl.av.includes(forced))?forced:sl.av[Math.floor(r()*sl.av.length)];
   lch.push(c);lslot.push(i%old.length);slots.push({key:'l'+i,type:'long',ch:c,planCh:c,label:'Q.'+(longQ0()+i),legacyIndex:i});
  }
 }
 const sT=parts.reduce((a,p)=>a+p.attempt*state.shortMark,0),longMarks=groupMode?longGroups.reduce((n,g)=>n+g.totalMarks,0):(secL()?state.longAttempt*state.longMark:0);
 const marks={mcq:mA.placed*state.mcqMark,short:sT,long:longMarks};marks.total=marks.mcq+marks.short+marks.long;
 return{chs,cm,cs,cl,maxM,maxS,maxL,mcqAlloc:mA.out,parts,longChs:lch,longSlot:lslot,slots:groupMode?[]:longSlots(),longGroups,groupMode,marks,sch};
}
function build(){
 const slots=[];let mi=0;
 plan.chs.forEach(c=>{for(let i=0;i<(plan.mcqAlloc[c]||0);i++){slots.push({key:'m'+mi,type:'mcq',ch:c,planCh:c,label:'MCQ '+(mi+1)});mi++;}});
 plan.parts.forEach((p,pi)=>{let ii=0;p.group.forEach(c=>{for(let i=0;i<(p.alloc[c]||0);i++){slots.push({key:'s'+pi+'.'+ii,type:'short',ch:c,planCh:c,label:'Q.'+p.q+' ('+(ii+1)+')',part:pi});ii++;}});});
 if(!plan.groupMode)plan.longChs.forEach((c,i)=>slots.push({key:'l'+i,type:'long',ch:c,planCh:c,label:'Q.'+(longQ0()+i),legacyIndex:i}));
 else plan.longGroups.forEach(g=>g.questions.forEach(q=>q.parts.forEach(p=>slots.push({key:p.key,type:'long',ch:p.chapter,planCh:p.chapter,label:`Q.${q.no} (${p.label})`,groupId:g.id,questionNo:q.no,partLabel:p.label}))));
 const keys=new Set(slots.map(s=>s.key));
 Object.keys(overrides).forEach(k=>{if(!keys.has(k))delete overrides[k];});
 Object.keys(sticky).forEach(k=>{if(!keys.has(k))delete sticky[k];});
 slotMap={};slots.forEach(s=>slotMap[s.key]=s);
 const used=new Set(),byKey={};
 slots.forEach(s=>{const ov=overrides[s.key];if(!ov)return;const q=findAny(s.type,ov);
  if(!q||(state.noDup&&used.has(q.id))){delete overrides[s.key];return;}byKey[s.key]=q;used.add(q.id);});
 slots.forEach(s=>{if(byKey[s.key])return;const st=sticky[s.key];
  if(st){const q=findAny(s.type,st);if(q&&(!state.noDup||!used.has(q.id))){byKey[s.key]=q;used.add(q.id);}}});
 const r=rng(state.seed*2654435761+state.grade*7919);
 slots.forEach(s=>{if(byKey[s.key])return;
  let av=pool(s.type,s.ch).filter(q=>!state.noDup||!used.has(q.id));
  if(!av.length)av=pool(s.type,s.ch).slice();
  if(!av.length){byKey[s.key]={id:'na'+s.key,ch:s.ch,en:'—',ur:'',o:[['—',''],['—',''],['—',''],['—','']],a:0,src:'bank'};return;}
  const q=av[Math.floor(r()*av.length)];byKey[s.key]=q;used.add(q.id);});
 const mcq=[],short=plan.parts.map(p=>({q:p.q,attempt:p.attempt,items:[],alloc:p.alloc,group:p.group})),legacyLong=[];
 slots.forEach(s=>{const q=Object.assign({},byKey[s.key]);q._key=s.key;s.ch=q.ch;
  if(s.type==='mcq')mcq.push(q);else if(s.type==='short')short[s.part].items.push(q);else if(!plan.groupMode)legacyLong.push(q);});
 short.forEach(p=>{if(!p.items.length)p.attempt=0;});
 let long=legacyLong,longGroups=[];
 if(plan.groupMode){
  longGroups=plan.longGroups.map(g=>Object.assign({},g,{questions:g.questions.map(q=>{
   const parts=q.parts.map(p=>Object.assign({},byKey[p.key],{_key:p.key,label:p.label,marks:p.marks,chapterRule:p.chapterRule,planCh:p.chapter,candidates:p.candidates}));
   return Object.assign({},q,{_key:parts[0]?parts[0]._key:'',ch:parts[0]?parts[0].ch:0,parts});
  })}));
  long=longGroups.flatMap(g=>g.questions);
 }
 return{mcq,short,long,longGroups,longMode:plan.groupMode?'groups':'legacy',slots};
}
function qById(sl){const k=sl.key;
 if(sl.type==='mcq')return built.mcq.find(q=>q._key===k);
 if(sl.type==='long')return built.long.find(q=>q._key===k)||built.long.flatMap(q=>q.parts||[]).find(q=>q._key===k);
 for(const p of built.short){const f=p.items.find(q=>q._key===k);if(f)return f;}return null;}
function usedElsewhere(key){const s=new Set();built.slots.forEach(sl=>{if(sl.key===key)return;const q=qById(sl);if(q)s.add(q.id);});return s;}
const wordsOf=s=>plainRichText(s).trim().split(/\s+/).filter(Boolean).length;
function layoutFor(m){if(state.optMode!=='auto')return parseInt(state.optMode,10);
 const mx=Math.max.apply(null,m.o.map(o=>wordsOf(o[0])));return mx<=1?4:(mx===2?2:1);}
function serials(){const map={};
 built.mcq.forEach((q,i)=>map[q._key]={no:String(i+1),ur:String(i+1)});
 built.short.forEach(p=>p.items.forEach((q,i)=>map[q._key]={no:String(i+1),ur:String(i+1)}));
 const first=longQ0();
 built.long.forEach((q,i)=>{const no=q.no||first+i;if(q.parts&&q.parts.length){map[q._key]={no:'Q. No. '+no,ur:'سوال نمبر '+no};q.parts.forEach(p=>map[p._key]={no:'Q. No. '+no+' ('+p.label+')',ur:'سوال نمبر '+no+' ('+p.label+')'});}else map[q._key]={no:'Q. No. '+(first+i),ur:'سوال نمبر '+(first+i)};});
 return map;}
/* Column grids. "Edges" are % positions where a cell may start or end; every row is built from cells between two edges, so a
   cell simply spans however many narrow columns it needs. That is how the "Q. No." instruction row can split at a different
   place than the stems below it (like the Word template): the English side is a bit wider than half. */
function mkGrid(edges,total,round){
 const e=[...new Set(edges.map(v=>+(+v).toFixed(3)))].sort((a,b)=>a-b);
 const at=v=>{const i=e.findIndex(x=>Math.abs(x-v)<.01);if(i<0)throw new Error('grid edge '+v);return i;};
 const pos=e.map(v=>round?Math.round(total*v/100):total*v/100);
 return{edges:e,cols:pos.slice(1).map((p,i)=>p-pos[i]),sp:(a,b)=>at(b)-at(a),w:(a,b)=>pos[at(b)]-pos[at(a)]};}
/* Student-field layouts other than the boxed table. Rows of cells with start/end edges in %, shared by preview and .docx. */
function infoSpec(s){
 const F=[];if(s.showName)F.push({lab:'Name:',pre:''});if(s.showRoll)F.push({lab:'Roll No:',pre:'',roll:true});
 if(s.showSection)F.push({lab:'Section:',pre:(s.sectionVal||'').trim()});if(s.showDate!==false)F.push({lab:'Date:',pre:(s.date||'').trim()});
 if(!F.length)return[];
 const GAP=3,r3=v=>+v.toFixed(3),text=f=>f.pre?f.lab+' '+f.pre:f.lab;
 const place=cells=>{let x=0;return cells.map(c=>{const a=r3(x);x+=c.w;return Object.assign({},c,{a,b:r3(x)});});};
 const lineRow=list=>{const n=list.length,w=(100-GAP*(n-1))/n,c=[];list.forEach((f,i)=>{if(i)c.push({k:'gap',w:GAP});c.push({k:'line',w,t:text(f)});});return place(c);};
 if(s.infoStyle==='stacked'){const rows=[],nm=F.find(f=>f.lab==='Name:'),rest=F.filter(f=>f!==nm);
  if(nm)rows.push(place([{k:'line',w:100,t:text(nm)}]));if(rest.length){if(rows.length)rows.push('spacer');rows.push(lineRow(rest));}return rows;}
 if(s.infoStyle==='boxes'){const BOX=3.2,LAB=15,RW=LAB+6*BOX,others=F.filter(f=>!f.roll).length,n=F.length,w=others?(100-GAP*(n-1)-(F.some(f=>f.roll)?RW:0))/others:0,c=[];
  F.forEach((f,i)=>{if(i)c.push({k:'gap',w:GAP});if(f.roll){c.push({k:'plain',w:LAB,t:'Roll No:'});for(let b=0;b<6;b++)c.push({k:'box',w:BOX});}else c.push({k:'line',w,t:text(f)});});
  return[place(c)];}
 return[lineRow(F)];}
let _mc=null;
function textPt(txt,bold,pt,font){try{_mc=_mc||document.createElement('canvas').getContext('2d');_mc.font=`${bold?'bold ':''}${pt}pt \"${font}\",serif`;return _mc.measureText(txt).width*0.75;}catch(e){return 0;}}
/* share of the table width (in %) the English instruction needs to stay on one line: text + cell padding + a little safety */
function fitSplit(s,txt){const need=textPt(txt,s.bInstr,s.enSize,s.enFont)+2*(s.pad+1.5)+9,pct=Math.ceil(need/(PAGES[s.page].w-2*s.margin)*100);return clamp(pct||58,45,76);}
function qEdges(s,bi,enText){
 const nw=s.numW,mid=100-2*nw,q4=mid/4,H=s.insAuto&&enText?fitSplit(s,enText):clamp(+s.insSplit||58,45,76),R=100-nw,B1=nw+mid/2,B2=nw+mid*.53;
 return{nw,q4,H,R,B1,B2,
  mcq:bi?[0,nw,nw+q4,B1,nw+3*q4,H,R,100]:[0,nw,nw+q4,B1,nw+3*q4,R,100],
  two:bi?[0,nw,B2,H,R,100]:[0,nw,100]};}

