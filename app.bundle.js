/* === app-core.js === */
"use strict";
/* ══════════ COURSE BANKS ══════════ */
if(!Array.isArray(PP_COURSES)||!PP_DATA){document.body.innerHTML='<p style="padding:2em;font:16px sans-serif">The course banks failed to load.</p>';throw new Error('course banks missing');}
function hydrate(courseId){
 const d=PP_DATA[courseId],m=d.meta,raw=d.raw,B={courseId,grade:m.classNo,sid:m.subjectId,name:m.classLabel,classLabel:m.classLabel,classUr:m.classUr,
  code:m.code,marks:m.marks,times:m.times,language:m.language,lang:m.language,subject:m.subject,subjectUr:m.subjectUr,alpSummary:m.alpSummary,
  chapters:Object.keys(raw).map(Number),names:{},mcq:{},short:{},long:{},alpCh:m.alpCh.slice(),alpEx:m.alpEx.slice(),exRules:m.exRules,patterns:d.patterns.slice(),contentCatalog:m.contentCatalog||{},questionContent:m.questionContent||{}};
 for(const k in raw){const c=+k,r=raw[k];B.names[c]=r.n;
  B.mcq[c]=(r.m||[]).map((a,i)=>({id:a[22]||`legacy-${courseId}-c${c}-m${i}`,ch:c,en:a[0],ur:a[1],o:[[a[2],a[3]],[a[4],a[5]],[a[6],a[7]],[a[8],a[9]]],of:[a[14],a[16],a[18],a[20]],oa:[a[15],a[17],a[19],a[21]],a:a[10],ex:!!a[11],figure:a[12]||'',figureAlt:a[13]||'',content:(B.questionContent[c]&&B.questionContent[c].mcq&&B.questionContent[c].mcq[a[22]])||(B.questionContent[c]&&B.questionContent[c].mcq&&B.questionContent[c].mcq[i])||{topics:[],exercises:[]}}));
  B.short[c]=(r.s||[]).map((a,i)=>({id:a[5]||`legacy-${courseId}-c${c}-s${i}`,ch:c,en:a[0],ur:a[1],ex:!!a[2],figure:a[3]||'',figureAlt:a[4]||'',content:(B.questionContent[c]&&B.questionContent[c].short&&B.questionContent[c].short[a[5]])||(B.questionContent[c]&&B.questionContent[c].short&&B.questionContent[c].short[i])||{topics:[],exercises:[]}}));
  B.long[c]=(r.l||[]).map((a,i)=>({id:a[6]||`legacy-${courseId}-c${c}-l${i}`,ch:c,en:a[0],ur:a[1],src:a[2]==='c'?'composed':'bank',ex:!!a[3],figure:a[4]||'',figureAlt:a[5]||'',content:(B.questionContent[c]&&B.questionContent[c].long&&B.questionContent[c].long[a[6]])||(B.questionContent[c]&&B.questionContent[c].long&&B.questionContent[c].long[i])||{topics:[],exercises:[]}}));}
 B.hasQuestions=B.chapters.some(c=>(B.mcq[c]||[]).length||(B.short[c]||[]).length||(B.long[c]||[]).length);
 B.questionCount=B.chapters.reduce((n,c)=>n+(B.mcq[c]||[]).length+(B.short[c]||[]).length+(B.long[c]||[]).length,0);
 return B;
}
const BOOKS=Object.fromEntries(PP_COURSES.map(c=>[c.courseId,hydrate(c.courseId)]));
const OFFICIAL=Object.values(BOOKS).flatMap(b=>b.patterns);
const DEFAULT_COURSE=PP_COURSES[0]||{courseId:'1-subject',classNo:1,subjectId:'subject'};const DEFAULT_SUBJECT=DEFAULT_COURSE.subjectId;
const cid=()=>`${state.grade}-${state.sid||DEFAULT_SUBJECT}`;
const B=()=>BOOKS[cid()]||BOOKS[DEFAULT_COURSE.courseId]||Object.values(BOOKS)[0];
const isBilingualCourse=()=>B().lang==='bilingual';
const urduOn=(s=state)=>isBilingualCourse()&&!!(s&&s.showUrdu);
const offFor=courseId=>OFFICIAL.find(s=>s.courseId===courseId)||null;
const ALLCH=Array.from(new Set(Object.values(BOOKS).flatMap(b=>b.chapters))).sort((a,b)=>a-b);
const GRADE_LABELS=Object.fromEntries([...new Set(PP_COURSES.map(c=>c.classNo))].map(g=>[g,PP_COURSES.find(c=>c.classNo===g)?.classLabel||String(g)]));
const SUBJECT_LABELS=Object.fromEntries([...new Set(PP_COURSES.map(c=>c.subjectId))].map(sid=>[sid,PP_COURSES.find(c=>c.subjectId===sid)?.subject||sid]));

/* ══════════ STATE ══════════ */
const SCOPES={
 syllabus:{label:'Class, subject, ALP, chapters & content',keys:['grade','sid','alp','chapters','contentSelection']},
 scheme:{label:'Pairing scheme & long sources',keys:['schemeId','longPick']},
 counts:{label:'Question counts & marks',keys:['incMcq','incShort','incLong','mcqCount','mcqMark','shortParts','shortPrinted','shortMark','shortAttempts','longPrinted','longAttempt','longMark']},
 header:{label:'Header, student fields & logo',keys:['institute','title','klass','subject','subjectUr','timeObj','timeSubj','sheetMode','date','sectionVal','showName','showRoll','showSection','showDate','infoPos','hdrStyle','infoStyle','footer','logo','logoName','logoH','logoPos']},
 type:{label:'Fonts, sizes & bold',keys:['enFont','enSize','urFont','urSize','lineH','pad','bHeader','bBar','bInstr','bNum','bStem','bShort','bLong']},
 omr:{label:'OMR layout & position',keys:['omr','omrRule','omrUrdu','omrPos','omrCols','bubSize','omrPad','omrAlign','omrWidth','omrGapT','omrGapB','omrNewPage']},
 page:{label:'Page, table & layers',keys:['hideLines','borderW','numW','insSplit','insAuto','optMode','page','margin','shade','zebra','showUrdu']}
};
const ALLSC=Object.keys(SCOPES);
const FIRST_BOOK=Object.values(BOOKS)[0];const DEF={grade:FIRST_BOOK.grade,sid:FIRST_BOOK.sid,alp:true,chapters:FIRST_BOOK.alpCh.slice(),contentSelection:{},contentCatalogCustom:{},contentExcludedOverrides:{},questionTags:{},schemeId:(offFor(FIRST_BOOK.courseId)||{}).id||'',longPick:{},
 mcqCount:10,mcqMark:1,incMcq:true,incShort:true,incLong:true,shortParts:3,shortPrinted:6,shortMark:2,shortAttempts:[4,4,4,4],longPrinted:3,longAttempt:2,longMark:8,
 logo:'',logoName:'',logoH:54,logoPos:'center',
 institute:'Government High School, Lahore',title:'Model Question Paper',klass:FIRST_BOOK.name,subject:FIRST_BOOK.subject,subjectUr:FIRST_BOOK.subjectUr,timeObj:0,timeSubj:0,sheetMode:'single',date:'',sectionVal:'',
 showName:true,showRoll:true,showSection:false,showDate:true,infoPos:'top',hdrStyle:'classic',infoStyle:'table',footer:true,
 enFont:'Times New Roman',enSize:11,urFont:'Jameel Noori Nastaleeq',urSize:11,lineH:1.35,pad:4,
 bHeader:true,bBar:true,bInstr:true,bNum:true,bStem:true,bShort:false,bLong:false,
 omr:true,omrRule:true,omrUrdu:true,omrPos:'front',omrCols:4,bubSize:13,omrPad:4,omrAlign:'center',omrWidth:100,omrGapT:6,omrGapB:8,omrNewPage:false,
 hideLines:false,borderW:.75,numW:10,insSplit:58,insAuto:true,optMode:'auto',page:'a4',margin:24,shade:true,zebra:false,
 showUrdu:true,showKey:false,showTags:false,
 qTools:true,noDup:true,showPins:true,zoom:100,autoFit:true,seed:7,presetId:'',dirty:false};
const CFG_KEYS=new Set([].concat(...Object.values(SCOPES).map(s=>s.keys)));
function cleanCfg(c){const o={};if(!c||typeof c!=='object')return o;CFG_KEYS.forEach(k=>{if(!(k in c)||!(k in DEF))return;const v=c[k],d=DEF[k];
 if(typeof v!==typeof d||Array.isArray(v)!==Array.isArray(d))return;
 if(typeof v==='string'){if(k==='logo'){o[k]=(v===''||(/^data:image\/(png|jpe?g|gif|webp);base64,/.test(v)&&v.length<2e6))?v:'';return;}o[k]=v.slice(0,300);return;}
 if(typeof v==='number'){if(isFinite(v))o[k]=(k==='timeObj'||k==='timeSubj')?clamp(Math.round(v),0,600):v;return;}o[k]=JSON.parse(JSON.stringify(v));});return o;}
function cleanScheme(s){if(!s||typeof s!=='object'||!s.mcq||(!Array.isArray(s.long)&&!Array.isArray(s.longGroups))||!Array.isArray(s.short))return null;
 const courseId=s.courseId||(Number(s.grade||DEFAULT_COURSE.classNo)+'-'+(s.sid||DEFAULT_SUBJECT)),book=BOOKS[courseId];if(!book)return null;
 const chs=book.chapters,n=(v,d)=>Number.isFinite(+v)?Math.max(0,Math.min(100,Math.round(+v))):d,
 ob=m=>{const o={};Object.keys(m||{}).forEach(k=>{if(chs.includes(+k))o[+k]=n(m[k],0);});return o;};
 const groups=Array.isArray(s.longGroups)?s.longGroups.slice(0,10).map((g,gi)=>{
  const questions=(g.questions||[]).slice(0,10).map((q,qi)=>({id:String(q.id||`q${qi+1}`),parts:(q.parts||[]).slice(0,6).map((part,pi)=>{
   const rule=part.chapterRule||{},chapters=(rule.chapters||[]).map(Number).filter(c=>chs.includes(c));
   return{label:String(part.label||String.fromCharCode(97+pi)).slice(0,1).toLowerCase(),marks:n(part.marks,1)||1,chapterRule:{type:['fixed','either','any','different-from-a'].includes(rule.type)?rule.type:'any',chapters}};
  })}));
  return{id:String(g.id||`group-${gi+1}`),name:String(g.name||`Long questions ${gi+1}`).slice(0,80),attempt:n(g.attempt,1)||1,questions};
 }):[];
 return{id:String(s.id||uid('s')),courseId,grade:book.grade,sid:book.sid,factory:false,name:String(s.name||'Imported scheme').slice(0,80),note:String(s.note||'').slice(0,200),
  mcq:ob(s.mcq),mcqMark:n(s.mcqMark,1)||1,short:s.short.slice(0,10).map(p=>({ch:ob(p&&p.ch),attempt:n(p&&p.attempt,0)})),shortMark:n(s.shortMark,2)||2,
  long:Array.isArray(s.long)?s.long.slice(0,10).map(a=>(Array.isArray(a)?a:[]).map(Number).filter(c=>chs.includes(c))):[],longGroups:groups,longAttempt:n(s.longAttempt,1),longMark:n(s.longMark,8)||8};}
const COURSE_FACTORY=OFFICIAL.map(s=>{
 const b=BOOKS[s.courseId],cfg=JSON.parse(JSON.stringify(DEF));
 const printed=s.short.map(p=>Object.values(p.ch).reduce((n,v)=>n+Number(v||0),0));
 Object.assign(cfg,{grade:b.grade,sid:b.sid,chapters:b.alpCh.slice(),schemeId:s.id,klass:b.classLabel,subject:b.subject,subjectUr:b.subjectUr,
  timeObj:0,timeSubj:0,mcqCount:Object.values(s.mcq).reduce((n,v)=>n+Number(v||0),0),mcqMark:s.mcqMark,
  shortParts:s.short.length,shortPrinted:Math.max(2,...printed),shortMark:s.shortMark,shortAttempts:s.short.map(p=>p.attempt),
  longPrinted:s.longGroups&&s.longGroups.length?s.longGroups.reduce((n,g)=>n+g.questions.length,0):s.long.length,longAttempt:s.longGroups&&s.longGroups.length?s.longGroups.reduce((n,g)=>n+g.attempt,0):s.longAttempt,longMark:s.longMark,alp:true,longPick:{}});
 return{id:`f-alp-${b.courseId}`,name:`ALP full paper · ${GRADE_LABELS[b.grade]} · ${SUBJECT_LABELS[b.sid]} · ${b.marks}`,
  note:s.note,factory:true,grade:b.grade,sid:b.sid,courseId:b.courseId,scopes:ALLSC.slice(),cfg};
});
const FACTORY=[
 {id:'f-tpl',name:'Template style · Urdu serials',note:'Both-side serials, no marks column, OMR + header on top, 24pt margins, 11pt.',factory:true,grade:9,scopes:['header','type','omr','page'],cfg:{infoPos:'top',showName:true,showRoll:true,enSize:11,urSize:11,lineH:1.35,pad:4,omr:true,omrPos:'front',omrNewPage:false,omrAlign:'center',omrWidth:100,omrGapT:6,omrGapB:8,omrCols:4,bubSize:13,omrPad:4,omrRule:true,omrUrdu:true,margin:24,numW:10,hideLines:false,shade:true,zebra:false,showUrdu:true}},
 ...COURSE_FACTORY,
 {id:'f-unit',name:'Short unit test · 20',note:'Compact 20-mark class check; timing remains course-based.',factory:true,grade:9,scopes:['counts'],cfg:{mcqCount:6,mcqMark:1,shortParts:2,shortPrinted:4,shortMark:2,shortAttempts:[2,2,2,2],longPrinted:1,longAttempt:1,longMark:6}},
 {id:'f-nolines',name:'Borderless question paper',note:'All table lines hidden.',factory:true,grade:9,scopes:['page'],cfg:{hideLines:true,shade:true,zebra:false,numW:10,margin:24}},
 {id:'f-omr-end',name:'OMR on separate sheet',note:'Bubble strip on its own final page, 80% width.',factory:true,grade:9,scopes:['omr'],cfg:{omr:true,omrPos:'end',omrNewPage:true,omrAlign:'center',omrWidth:80,omrGapT:0,omrGapB:0,omrCols:4,bubSize:13,omrPad:4,omrRule:true,omrUrdu:true}},
 {id:'f-nastaliq',name:'Large Nastaliq typography',note:'11pt English / 16pt Urdu, bold stems.',factory:true,grade:9,scopes:['type'],cfg:{enSize:11,urSize:16,lineH:1.5,pad:6,bStem:true,bNum:true,bShort:true,bLong:false,bOpt:false,bHeader:true,bBar:true,bInstr:true}}
];
let state=JSON.parse(JSON.stringify(DEF)),customSchemes=[],overrides={},sticky={},plan=null,built=null,slotMap={};
let hiddenF=[],presets=[],preSel=new Set(),preFilter='all',preQuery='',preSort='new',lastDeleted=null;
let activeSlot=null,drawerMode=null,drawerSlot=null,drawerFilter='all',drawerQuery='',drawerCh='all',drawerEx=false,exporting=false,schDraft=null,schEditId=null,previewSheet='both';
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
/* Safe inline authoring syntax: semantic HTML-lite markup, isotope shorthand and restricted TeX math. */
function safeLatex(tex){
 const x=String(tex==null?'':tex).trim();
 if(!x||x.length>4000||/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(x))return false;
 if(/\\(?:require|href|url|class|cssId|style|htmlClass|htmlId|htmlStyle|htmlData|includegraphics|input|include|def|gdef|edef|let|newcommand|renewcommand|write|openout|read|catcode|csname|endcsname|unicode)\b/i.test(x))return false;
 if(/\\begin\s*\{\s*html\s*\}|<\/?[a-z][^>]*>/i.test(x))return false;
 return true;
}
function inlineTokens(value){
 const src=String(value==null?'':value),re=/(<\s*\/?\s*(?:sup|sub|b|strong|i|em)\s*>|<\s*br\s*\/?>|\^\{([^{}]{1,8})\}_\{([^{}]{1,8})\}([A-Z][a-z]?)|\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$(?:\\.|[^$\\\n])+?\$)/gi;
 const out=[],stack=[];let at=0,m;
 const style=()=>({b:stack.some(x=>x==='b'||x==='strong'),i:stack.some(x=>x==='i'||x==='em'),sup:stack.includes('sup'),sub:stack.includes('sub')});
 while((m=re.exec(src))){
  if(m.index>at)out.push({type:'text',text:src.slice(at,m.index),...style()});
  const token=m[0];
  if(token[0]==='^')out.push({type:'isotope',mass:m[2],atomic:m[3],element:m[4]});
  else if(/^<\s*br/i.test(token))out.push({type:'br'});
  else if(token.startsWith('$$')||token.startsWith('\\[')||token.startsWith('\\(')||token[0]==='$'){
   const display=token.startsWith('$$')||token.startsWith('\\['),tex=token.startsWith('$$')?token.slice(2,-2):token.startsWith('\\[')||token.startsWith('\\(')?token.slice(2,-2):token.slice(1,-1);
   if(safeLatex(tex)&&!(token[0]==='$'&&!token.startsWith('$$')&&/^\s|\s$/.test(tex)))out.push({type:'math',tex:tex.trim(),display});
   else out.push({type:'text',text:token,...style()});
  }
  else{const z=token.match(/^<\s*(\/?)\s*(sup|sub|b|strong|i|em)/i),tag=z[2].toLowerCase();if(z[1]){const i=stack.lastIndexOf(tag);if(i>=0)stack.splice(i,1);}else stack.push(tag);}
  at=re.lastIndex;
 }
 if(at<src.length)out.push({type:'text',text:src.slice(at),...style()});
 return out;
}
function richHtml(value){return inlineTokens(value).map(t=>{
 if(t.type==='br')return '<br>';
 if(t.type==='isotope')return `<span class="pp-isotope"><sup>${esc(t.mass)}</sup><sub>${esc(t.atomic)}</sub><span>${esc(t.element)}</span></span>`;
 if(t.type==='math')return t.display?`<div class="pp-math-source pp-math-block">\\[${esc(t.tex)}\\]</div>`:`<span class="pp-math-source pp-math-inline">\\(${esc(t.tex)}\\)</span>`;
 let x=esc(t.text);if(t.sup)x=`<sup>${x}</sup>`;if(t.sub)x=`<sub>${x}</sub>`;if(t.i)x=`<em>${x}</em>`;if(t.b)x=`<strong>${x}</strong>`;return x;
 }).join('');}
function latexPlain(tex){return String(tex||'').replace(/\\(?:begin|end)\s*\{[^}]+\}/g,' ').replace(/\\[a-zA-Z]+\*?/g,' ').replace(/[{}]/g,' ').replace(/\\[,;!]/g,' ').replace(/\s+/g,' ').trim();}
function plainRichText(value){return inlineTokens(value).map(t=>t.type==='text'?t.text:t.type==='br'?' ':t.type==='math'?latexPlain(t.tex):t.mass+t.atomic+t.element).join('');}
let mathJaxPromise=null;const mathTypesetVersion=new WeakMap();
function ensureMathJax(){
 if(window.MathJax&&typeof window.MathJax.typesetPromise==='function'&&typeof window.MathJax.tex2svgPromise==='function')return Promise.resolve(window.MathJax);
 if(mathJaxPromise)return mathJaxPromise;
 window.MathJax={tex:{inlineMath:[['\\(','\\)']],displayMath:[['\\[','\\]']],packages:{'[+]':['ams']}},svg:{fontCache:'none'},options:{enableMenu:false},startup:{typeset:false}};
 mathJaxPromise=new Promise((resolve,reject)=>{
  /* Both hosts serve the identical MathJax 3.2.2 file, so one integrity hash covers either; a tampered or changed file is refused. */
  const SRC=['https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-svg.js','https://cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/tex-svg.js'],SRI='sha384-KKWa9jJ1MZvssLeOoXG6FiOAZfAgmzsIIfw8BXwI9+kYm0lPCbC6yTQPBC00F1/L';
  const tryLoad=i=>{
   if(i>=SRC.length){mathJaxPromise=null;reject(new Error('MathJax could not load. Check your internet connection and try again.'));return;}
   const script=document.createElement('script');script.async=true;script.src=SRC[i];script.integrity=SRI;script.crossOrigin='anonymous';
   script.onload=()=>{const mj=window.MathJax;if(!mj||!mj.startup||!mj.startup.promise){mathJaxPromise=null;reject(new Error('MathJax did not finish starting'));return;}mj.startup.promise.then(()=>resolve(mj),e=>{mathJaxPromise=null;reject(e);});};
   script.onerror=()=>{script.remove();tryLoad(i+1);};
   document.head.appendChild(script);};
  tryLoad(0);
 });
 return mathJaxPromise;
}
async function typesetMathIn(root){
 if(!root||!root.querySelector||!root.querySelector('.pp-math-source'))return;
 const ver=(mathTypesetVersion.get(root)||0)+1;mathTypesetVersion.set(root,ver);
 try{const mj=await ensureMathJax();if(mathTypesetVersion.get(root)!==ver)return;
  if(mj.typesetClear)mj.typesetClear([root]);await mj.typesetPromise([root]);
 }catch(e){console.warn('Math rendering is unavailable; the original LaTeX source remains visible. Check network access or use the app offline.',e);if(!window.__ppMathWarning){window.__ppMathWarning=true;try{toast('MathJax unavailable — LaTeX source is shown until the CDN is reachable.','warn');}catch(_){}}}
}
function cleanFigureRef(value){let x=String(value==null?'':value).trim();if(!x)return'';x=x.replace(/^figures\//i,'');return /^[a-z0-9][a-z0-9._-]*\.(?:png|svg)$/i.test(x)?'figures/'+x:'';}
function figureHtml(ref,alt,kind){const src=cleanFigureRef(ref);if(!src)return'';const cls=kind==='option'?' option':'';return `<div class="pp-figure${cls}"><img src="${src}" alt="${esc(alt||'Question figure')}" loading="lazy"></div>`;}
function syncSubject(g,sid){const next=BOOKS[`${g}-${sid||state.sid||DEFAULT_SUBJECT}`];if(!next)return;const dflt=k=>Object.values(BOOKS).some(b=>b[k]===state[k]);if(dflt('subject'))state.subject=next.subject;if(dflt('subjectUr'))state.subjectUr=next.subjectUr;}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const sum=o=>Object.keys(o).reduce((a,k)=>a+(+o[k]||0),0);
function effectiveTimes(s=state){
 const book=BOOKS[`${s.grade}-${s.sid||DEFAULT_SUBJECT}`]||B(),d=book.times||{objective:15,subjective:105,basis:'stated'};
 const objective=Number(s.timeObj)>0?clamp(Math.round(Number(s.timeObj)),1,600):d.objective;
 const subjective=Number(s.timeSubj)>0?clamp(Math.round(Number(s.timeSubj)),1,600):d.subjective;
 return{objective,subjective,total:objective+subjective,basis:d.basis||'stated'};
}
function formatDuration(minutes){
 const n=Math.max(0,Math.round(Number(minutes)||0));
 if(n<60)return `${n} Min.`;
 const h=Math.floor(n/60),m=n%60;
 return m?`${h}:${String(m).padStart(2,'0')} Hours`:`${h} ${h===1?'Hour':'Hours'}`;
}
function paperDuration(s=state,kind='single'){const t=effectiveTimes(s);return formatDuration(kind==='objective'?t.objective:kind==='subjective'?t.subjective:t.total);}
function paintTimeControls(){
 const t=effectiveTimes();
 if($('iTimeObj'))$('iTimeObj').value=t.objective;
 if($('iTimeSubj'))$('iTimeSubj').value=t.subjective;
 if($('timeSummary'))$('timeSummary').textContent=state.sheetMode==='two'?'Separate sheets: '+formatDuration(t.objective)+' Objective · '+formatDuration(t.subjective)+' Subjective':'Single-paper duration: '+formatDuration(t.total);
 const badge=$('timeBasis');if(badge){const inferred=t.basis==='inferred';badge.textContent=inferred?'Inferred ALP default':'ALP default stated';badge.classList.toggle('inferred',inferred);}
}
const uid=p=>p+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
function rng(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const LS={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch(e){return d;}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true;}catch(e){warnStorage();return false;}}};
let _stW=false;function warnStorage(){if(_stW)return;_stW=true;try{toast('Browser storage is full or blocked — your changes will not be remembered. Export your presets to keep them.','warn');}catch(e){}}
const IDBN='paper-press',IDBS='kv';
function idbOpen(){return new Promise((res,rej)=>{if(!window.indexedDB)return rej();const r=indexedDB.open(IDBN,1);r.onupgradeneeded=()=>r.result.createObjectStore(IDBS);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});}
function idbGet(k){return idbOpen().then(db=>new Promise(res=>{const q=db.transaction(IDBS).objectStore(IDBS).get(k);q.onsuccess=()=>res(q.result||'');q.onerror=()=>res('');})).catch(()=>'');}
function idbSet(k,v){return idbOpen().then(db=>new Promise(res=>{const t=db.transaction(IDBS,'readwrite');t.objectStore(IDBS).put(v,k);t.oncomplete=()=>res(true);t.onerror=()=>res(false);})).catch(()=>false);}
let _saveT=null,_logoLoaded=false,_lastLogo=null,_hT=null,_rest=false;
function saveState(){clearTimeout(_saveT);_saveT=setTimeout(flushState,400);if(!_rest){clearTimeout(_hT);_hT=setTimeout(()=>histPush(),600);}}
function flushState(){clearTimeout(_saveT);_saveT=null;if(window.__ppRestoring)return;const rest=Object.assign({},state),logo=rest.logo||'';
 /* a logo that IndexedDB has not confirmed yet stays inside the saved state, so a reload or a closed tab can never lose it */
 if(logo&&logo!==_lastLogo){LS.set('pp.state.v7',rest);idbSet('logo',logo).then(ok=>{if(ok&&state.logo===logo){_lastLogo=logo;saveState();}});return;}
 rest.logo='';LS.set('pp.state.v7',rest);
 if(!logo&&_logoLoaded&&_lastLogo){_lastLogo='';idbSet('logo','');}}
window.addEventListener('pagehide',flushState);document.addEventListener('visibilitychange',()=>{if(document.hidden)flushState();});
function downscaleLogo(url,max){return new Promise(res=>{const im=new Image();im.onload=()=>{if(!im.width||!im.height)return res(url);const k=Math.min(1,max/Math.max(im.width,im.height));if(k>=1&&url.length<300000)return res(url);
 const c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*k));c.height=Math.max(1,Math.round(im.height*k));c.getContext('2d').drawImage(im,0,0,c.width,c.height);try{res(c.toDataURL('image/png'));}catch(e){res(url);}};im.onerror=()=>res(url);im.src=url;});}
const PAGES={a4:{w:595.3,h:841.9,label:'A4'},letter:{w:612,h:792,label:'Letter'},legal:{w:612,h:1008,label:'Legal'}};
const NE=['ZERO','ONE','TWO','THREE','FOUR','FIVE','SIX','SEVEN','EIGHT','NINE','TEN'];
const NU=['صفر','ایک','دو','تین','چار','پانچ','چھ','سات','آٹھ','نو','دس'];
const ZLABEL={front:'Top of paper',after:'After MCQs',mid:'After short questions',end:'End of paper'};


;
/* === app-schemes.js === */
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


;
/* === app-long.js === */
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

;
/* === app-planning.js === */
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


;
/* === app-paper.js === */
"use strict";
/* ══════════ BUBBLES ══════════ */
const bubCache={};
function bubblePNG(letter,pt,key){
 const ck=letter+'|'+pt+'|'+(key?1:0);if(bubCache[ck])return bubCache[ck];
 const px=Math.max(8,Math.round(pt*96/72)),S=4;
 const cv=document.createElement('canvas');cv.width=px*S;cv.height=px*S;
 const g=cv.getContext('2d');g.scale(S,S);
 g.beginPath();g.arc(px/2,px/2,px/2-1,0,Math.PI*2);
 if(key){g.fillStyle='#e8f7ee';g.fill();}
 g.lineWidth=key?1.6:1.1;g.strokeStyle=key?'#046a38':'#8a8a8a';g.stroke();
 g.fillStyle=key?'#046a38':'#8a8a8a';
 g.font=(key?'bold ':'')+(px*.55).toFixed(1)+'px Arial, Helvetica, sans-serif';
 g.textAlign='center';g.textBaseline='middle';g.fillText(letter,px/2,px/2+px*.04);
 const url=cv.toDataURL('image/png'),bin=atob(url.split(',')[1]),bytes=new Uint8Array(bin.length);
 for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
 return bubCache[ck]={url,bytes,px,pt};
}
let logoPNG=null;
function rasterizeLogo(dataUrl){return new Promise(res=>{const im=new Image();
 im.onload=()=>{const h=260,w=Math.max(1,Math.round(h*(im.naturalWidth/im.naturalHeight||1)));
  const cv=document.createElement('canvas');cv.width=w;cv.height=h;cv.getContext('2d').drawImage(im,0,0,w,h);
  let url;try{url=cv.toDataURL('image/png');}catch(e){res(null);return;}
  const bin=atob(url.split(',')[1]),bytes=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
  res({url,bytes,w,h,ratio:im.naturalWidth/im.naturalHeight||1});};
 im.onerror=()=>res(null);im.src=dataUrl;});}

/* ══════════ PAPER ══════════ */
function paperInnerSheet(s,mode){
 const screen=(mode==='screen'),bi=urduOn(s),showKey=screen&&s.showKey,showTags=screen&&s.showTags,SN=serials();
 const sheetKind=s._sheetKind||'single',allMarks=plan.marks;
 const mk=sheetKind==='objective'?{mcq:allMarks.mcq,short:0,long:0,total:allMarks.mcq}:sheetKind==='subjective'?{mcq:0,short:allMarks.short,long:allMarks.long,total:allMarks.short+allMarks.long}:allMarks;
 const F=s.enFont,FS=s.enSize,UF=s.urFont,US=s.urSize,BD=`${s.borderW}pt solid #000000`;
 const cb=s.hideLines?'border:0;':`border:${BD};`,bAttr=s.hideLines?'0':'1';
 const base=`font-family:'${F}',serif;font-size:${FS}pt;line-height:${s.lineH};color:#000;`;
 const VA='top',SA='top'; /* text and serial numbers are always top-aligned */
 const cell=`${cb}padding:${s.pad}pt ${s.pad+1.5}pt;vertical-align:${VA};${base}`;
 const cc=`${cb}padding:${s.pad}pt;vertical-align:${SA};text-align:center;${base}`,ch=`${cb}padding:${s.pad}pt;vertical-align:${VA};text-align:center;${base}`;
 const uc=`${cb}padding:${s.pad}pt ${s.pad+1.5}pt;vertical-align:${VA};direction:rtl;text-align:right;font-family:'${UF}','Noto Nastaliq Urdu',serif;font-size:${US}pt;line-height:${s.lineH+.35};color:#000;`;
 const uNum=`${cb}padding:${s.pad}pt;vertical-align:${SA};text-align:center;direction:rtl;font-family:'${UF}','Noto Nastaliq Urdu',serif;font-size:${US}pt;line-height:${s.lineH+.35};color:#000;`;
 const ui=t=>t?` <span dir="rtl" lang="ur" style="font-family:'${UF}','Noto Nastaliq Urdu',serif;font-size:${US}pt;">${richHtml(t)}</span>`:'';
 const sh=s.shade?'#e9e4d6':'#ffffff',zb=i=>s.zebra&&i%2===1?'background:#f7f4ea;':'';
 const tg=t=>showTags?`<span style="font-family:Arial,sans-serif;font-size:${Math.max(6,FS-4)}pt;color:#7a6a45;"> [${t}]</span>`:'';
 const pin=q=>(screen&&s.showPins&&overrides[q._key])?'<span class="pinb">📌</span>':'';
 const cross=q=>{if(!screen)return'';const sl=slotMap[q._key];return sl&&sl.ch!==sl.planCh?'<span class="xch">↔Ch'+q.ch+'</span>':'';};
 const T=x=>`<table border="${bAttr}" cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%;${s.hideLines?'':'border:'+BD+';'}${base}${x||''}">`;
 const nw=s.numW,mid=100-2*nw,q4=mid/4;
 const wH=s.bHeader?'bold':'normal',wB=s.bBar?'bold':'normal',wI=s.bInstr?'bold':'normal',wN=s.bNum?'bold':'normal',wS=s.bStem?'bold':'normal',wO='normal',wQ=s.bShort?'bold':'normal',wL=s.bLong?'bold':'normal';
 const dz=z=>screen&&sheetKind!=='subjective'&&built.mcq.length?`<div class="dropzone" data-zone="${z}"><span>Drop OMR — ${ZLABEL[z]}</span></div>`:'';
 const hasM=sheetKind!=='subjective'&&built.mcq.length>0,hasS=sheetKind!=='objective'&&built.short.some(p=>p.items.length>0),hasL=sheetKind!=='objective'&&built.long.length>0,PR=['I','II','III'],PU=['اول','دوم','سوم'];let partNo=0;
 const omrPos=sheetKind==='single'?s.omrPos:(s.omrPos==='front'?'front':'end');
 const mcqEn=`Q. No. 1: Choose the Best option and fill the Bubble.  (${built.mcq.length} × ${s.mcqMark} = ${mk.mcq})`;
 let QE=qEdges(s,bi,mcqEn),GM=mkGrid(QE.mcq,100),GT=mkGrid(QE.two,100),g6=GM.cols,g4=GT.cols;
 const cs=(G,a,b)=>{const n=G.sp(a,b);return n>1?` colspan="${n}"`:'';};
 const cg=grid=>`<colgroup>${grid.map(w=>`<col style="width:${w}%">`).join('')}</colgroup>`;
 const ins=(en,ur,G)=>{
  if(!bi)return `<tr><td colspan="${G.sp(0,100)}" style="${cell}background:${sh};font-weight:${wI};">${esc(en)}</td></tr>`;
  /* Instruction row uses a nested two-cell table. This keeps its English/Urdu split
     independent of the body column grid and prevents phantom empty columns. */
  const split=`<table border="${bAttr}" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;table-layout:fixed;"><tr><td style="width:${QE.H}%;${cell}background:${sh};font-weight:${wI};">${esc(en)}</td><td style="width:${100-QE.H}%;${uc}background:${sh};font-weight:${wI};">${esc(ur)}</td></tr></table>`;
  return `<tr><td colspan="${G.sp(0,100)}" style="padding:0;${cb}">${split}</td></tr>`;};
 let h='';
 if(s.footer)h+=`<div style="${base}font-size:${FS-2}pt;text-align:center;margin-bottom:6pt;${s.hideLines?'':'border-bottom:'+BD+';'}padding-bottom:4pt;">Paper ${B().code}-${s.alp?'ALP':'FULL'} / V-${String(s.seed).padStart(2,'0')}${sheetKind==='single'?'':` / ${sheetKind==='objective'?'Objective':'Subjective'}`} &nbsp;·&nbsp; ${esc(plan.sch.name)} &nbsp;·&nbsp; Examiner: ____________________</div>`;
 const logoImg=s.logo?`<img src="${s.logo}" alt="logo" style="height:${s.logoH}pt;width:auto;display:block;">`:'';
 const titleBlock=()=>{let t='';
  if(s.institute.trim())t+=`<div style="${base}font-size:${FS+5}pt;font-weight:${wH};">${esc(s.institute)}</div>`;
  t+=`<div style="${base}font-size:${FS+1}pt;font-weight:${wH};margin-top:1pt;">${esc(s.title)}</div>`;
  if(bi)t+=`<div dir="rtl" lang="ur" style="font-family:'${UF}','Noto Nastaliq Urdu',serif;font-size:${US+1}pt;font-weight:${wH};margin-top:2pt;">${esc(state.subjectUr||'')}${state.subjectUr?' — ':''}${B().classUr||''}</div>`;
  return t;};
 const lt=mb=>{ /* logo + title block */
  if(logoImg&&s.logoPos==='center')return `<div style="text-align:center;margin-bottom:4pt;"><div style="display:inline-block;">${logoImg}</div></div><div style="text-align:center;margin-bottom:${mb}pt;">${titleBlock()}</div>`;
  if(logoImg){const lc=`<td style="border:0;padding:0;width:${s.logoH+16}pt;vertical-align:middle;">${logoImg}</td>`,tc2=`<td style="border:0;padding:0 6pt;vertical-align:middle;text-align:center;">${titleBlock()}</td>`;
   return `<table border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%;margin-bottom:${mb}pt;"><tr>${s.logoPos==='left'?lc+tc2:tc2+lc}</tr></table>`;}
  return `<div style="text-align:center;margin-bottom:${mb}pt;">${titleBlock()}</div>`;};
 const HS=s.hdrStyle||'classic',metaT=[`Class: ${esc(s.klass)}`,`Subject: ${esc(s.subject)}`,`Total Marks: ${mk.total}`,`Time: ${esc(paperDuration(s,sheetKind))}`],MW=[22,38,20,20],
  RULE=s.hideLines?'0':`${Math.max(1.5,s.borderW*2)}pt solid #000`,mcg=`<colgroup>${MW.map(w=>`<col style="width:${w}%">`).join('')}</colgroup>`,TB='cellspacing="0" cellpadding="0" style="border-collapse:collapse;table-layout:fixed;width:100%;';
 if(HS==='banner'){
  h+=`<table ${TB}margin-bottom:6pt;${s.hideLines?'':'border:'+BD+';'}">${mcg}<tr><td colspan="4" style="${s.hideLines?'':'border-bottom:'+BD+';'}padding:${s.pad+3}pt;background:${sh};text-align:center;">${lt(0)}</td></tr><tr>${metaT.map((t,i)=>`<td style="${s.hideLines||!i?'':'border-left:'+BD+';'}padding:${s.pad}pt ${s.pad+1.5}pt;text-align:center;vertical-align:top;${base}font-weight:${wH};">${t}</td>`).join('')}</tr></table>`;
 }else if(HS==='ruled'){
  h+=lt(5)+`<table ${TB}margin-bottom:6pt;">${mcg}<tr>${metaT.map((t,i)=>`<td style="border-top:${RULE};border-bottom:${RULE};padding:${s.pad+1}pt ${s.pad+1.5}pt;text-align:${['left','center','center','right'][i]};vertical-align:top;${base}font-weight:${wH};">${t}</td>`).join('')}</tr></table>`;
 }else if(HS==='split'){
  const sc=`padding:${s.pad}pt ${s.pad+1.5}pt;vertical-align:top;${base}font-weight:${wH};${s.hideLines?'':'border-bottom:'+RULE+';'}`;
  h+=`<table ${TB}margin-bottom:6pt;"><colgroup><col style="width:28%"><col style="width:44%"><col style="width:28%"></colgroup><tr><td style="${sc}text-align:left;">${metaT[0]}<br>${metaT[1]}</td><td style="${sc}text-align:center;">${lt(2)}</td><td style="${sc}text-align:right;">${metaT[3]}<br>${metaT[2]}</td></tr></table>`;
 }else if(HS==='centered'){
  h+=lt(3)+`<table ${TB}margin-bottom:6pt;">${mcg}<tr>${metaT.map(t=>`<td style="${cell}text-align:center;font-weight:${wH};background:#f5f5f5;">${t}</td>`).join('')}</tr></table>`;
 }else if(HS==='minimal'){
  h+=lt(2)+`<div style="${base}text-align:center;font-size:${FS-1}pt;margin:0 0 7pt;">${metaT.map(esc).join(' &nbsp; · &nbsp; ')}</div>`;
 }else if(HS==='boxed'){
  h+=`<table ${TB}margin-bottom:6pt;"><tr><td style="${cb}padding:${s.pad+4}pt;text-align:center;">${lt(0)}</td></tr></table>`+`<table ${TB}margin-bottom:6pt;">${mcg}<tr>${metaT.map(t=>`<td style="${cell}text-align:center;font-weight:${wH};">${t}</td>`).join('')}</tr></table>`;
 }else if(HS==='academy'){
  h+=`<div style="${base}text-align:center;border-top:${RULE};border-bottom:${RULE};padding:3pt 0;margin-bottom:3pt;">${lt(0)}</div>`+`<table ${TB}margin-bottom:6pt;">${mcg}<tr>${metaT.map(t=>`<td style="${cell}text-align:center;font-weight:${wH};">${t}</td>`).join('')}</tr></table>`;
 }else if(HS==='compact'){
  h+=`<table ${TB}margin-bottom:6pt;"><colgroup><col style="width:64%"><col style="width:36%"></colgroup><tr><td style="${cell}text-align:left;">${lt(0)}</td><td style="${cell}text-align:right;font-weight:${wH};">${metaT.map(t=>`<div>${t}</div>`).join('')}</td></tr></table>`;
 }else{
  h+=lt(5)+T('margin-bottom:6pt;')+`<tr><td style="${ch}width:22%;font-weight:${wH};">${metaT[0]}</td><td style="${ch}width:38%;font-weight:${wH};">${metaT[1]}</td><td style="${ch}width:20%;font-weight:${wH};">${metaT[2]}</td><td style="${ch}width:20%;font-weight:${wH};">${metaT[3]}</td></tr></table>`;
 }
 const infoRow=()=>{const f=[];
  if(s.showName)f.push(['Name','____________________________']);
  if(s.showRoll)f.push(['Roll No','____________________']);
  if(s.showSection)f.push(['Section',s.sectionVal.trim()?esc(s.sectionVal):'____________']);
  if(s.showDate!==false)f.push(['Date',s.date.trim()?esc(s.date):'________________']);
  if(!f.length)return'';const w=(100/f.length).toFixed(2);
  return T('margin:0 0 6pt;')+`<tr>${f.map(([k,v])=>`<td style="${cell}width:${w}%;font-weight:${wH};">${k}: ${v}</td>`).join('')}</tr></table>`;};
 const infoSpecHTML=rows=>{
  const edges=[0,100];rows.forEach(r=>{if(r!=='spacer')r.forEach(c=>edges.push(c.a,c.b));});const G=mkGrid(edges,100);
  let x=`<table cellspacing="0" cellpadding="0" style="border-collapse:collapse;table-layout:fixed;width:100%;margin:0 0 6pt;"><colgroup>${G.cols.map(w=>`<col style="width:${w.toFixed(3)}%">`).join('')}</colgroup>`;
  rows.forEach(r=>{if(r==='spacer'){x+=`<tr><td colspan="${G.sp(0,100)}" style="height:7pt;border:0;padding:0;line-height:0;font-size:0;"></td></tr>`;return;}
   x+='<tr>'+r.map(c=>{const n=G.sp(c.a,c.b),cs2=n>1?` colspan="${n}"`:'';
    if(c.k==='gap')return `<td${cs2} style="border:0;"></td>`;
    if(c.k==='box')return `<td${cs2} style="border:${BD};height:${FS+8}pt;padding:0;"></td>`;
    return `<td${cs2} style="${c.k==='line'?'border:0;border-bottom:'+BD+';':'border:0;'}padding:${s.pad+5}pt ${s.pad+1.5}pt ${s.pad}pt;vertical-align:bottom;${base}font-weight:${wH};">${esc(c.t)}</td>`;}).join('')+'</tr>';});
  return x+'</table>';};
 const infoRowAny=()=>{if(s.infoStyle&&s.infoStyle!=='table'){const r=infoSpec(s);return r.length?infoSpecHTML(r):'';}return infoRow();};
 if(s.infoPos==='top')h+=infoRowAny();
 const bar=(en,ur)=>{let x=T('margin-bottom:5pt;')+`<tr><td style="${cb}padding:${s.pad+2}pt;background:${sh};text-align:center;${base}font-size:${FS+1.5}pt;font-weight:${wB};letter-spacing:.5pt;">${esc(en)}`;
  if(bi)x+=`<div dir="rtl" lang="ur" style="font-family:'${UF}','Noto Nastaliq Urdu',serif;font-size:${US}pt;font-weight:${wB};letter-spacing:0;margin-top:2pt;">${esc(ur)}</div>`;
  return x+`</td></tr></table>`;};
 h+=dz('front');
 if(hasM&&sheetKind==='objective'){const noteEn='Four possible answers A, B, C and D are given for each question. Choose the correct answer and fill the corresponding circle on the OMR answer sheet.';
  const noteUr='ہر سوال کے چار ممکنہ جوابات A، B، C اور D دیے گئے ہیں۔ درست جواب منتخب کریں اور جوابی شیٹ پر متعلقہ دائرے کو پُر کریں۔';
  h+=`<div style="${base}${cb}padding:${s.pad+2}pt;margin:0 0 6pt;background:${sh};font-size:${FS-1}pt;"><b>Note:</b> ${noteEn}${bi?`<div dir="rtl" lang="ur" style="${uc}">${noteUr}</div>`:''}</div>`;
 }
 if(s.omr&&hasM&&omrPos==='front')h+=omrHTML(s,showKey,screen);
 if(hasM){const pi=partNo++;h+=bar(`PART-${PR[pi]}  ·  OBJECTIVE  (${mk.mcq} Marks)`,`حصہ ${PU[pi]}: معروضی سوالات`);
 h+=T('margin-bottom:7pt;')+cg(g6);
 h+=ins(mcqEn,'سوال نمبر 1: درست جواب کا انتخاب کریں۔ اور ببل بھریں۔',GM);
 built.mcq.forEach((m,i)=>{
  const lay=layoutFor(m),z=zb(i),sk=screen?` data-slot="${m._key}"`:'',S=SN[m._key];
  let stem=`<tr${sk} style="${z}"><td style="${cc}font-weight:${wN};">${S.no}${pin(m)}${cross(m)}</td>`;
  if(bi)stem+=`<td${cs(GM,QE.nw,QE.B1)} style="${cell}font-weight:${wS};">${richHtml(m.en)}${figureHtml(m.figure,m.figureAlt)}${tg('Ch '+m.ch)}</td><td${cs(GM,QE.B1,QE.R)} style="${uc}font-weight:${wS};">${richHtml(m.ur)}</td><td style="${uNum}font-weight:${wN};">${S.ur}</td>`;
  else stem+=`<td${cs(GM,QE.nw,100)} style="${cell}font-weight:${wS};">${richHtml(m.en)}${figureHtml(m.figure,m.figureAlt)}${tg('Ch '+m.ch)}</td>`;
  h+=stem+'</tr>';
  const op=k=>{const o=m.o[k];if(!o)return{t:'',st:''};const key=showKey&&k===m.a;
   return{t:`${'ABCD'[k]}. ${richHtml(o[0])}${figureHtml(m.of&&m.of[k],m.oa&&m.oa[k],'option')}${bi?ui(o[1]):''}${key?` <span style="font-family:Arial,sans-serif;font-size:${FS-2}pt;color:#046a38;font-weight:bold;">&#10003;</span>`:''}`,st:(key?'background:#e6f6ec;':'')+`font-weight:${wO};`};};
  if(lay===4){const o=[0,1,2,3].map(op);
   h+=`<tr${sk} style="${z}"><td style="${cc}"></td>${o.map((x,k)=>`<td${cs(GM,QE.nw+k*QE.q4,QE.nw+(k+1)*QE.q4)} style="${cell}${x.st}">${x.t}</td>`).join('')}<td style="${cc}"></td></tr>`;}
  else if(lay===2){for(let r=0;r<2;r++){const a=op(r*2),b=op(r*2+1);
   h+=`<tr${sk} style="${z}"><td style="${cc}"></td><td${cs(GM,QE.nw,QE.B1)} style="${cell}${a.st}">${a.t}</td><td${cs(GM,QE.B1,QE.R)} style="${cell}${b.st}">${b.t}</td><td style="${cc}"></td></tr>`;}}
  else{for(let k=0;k<4;k++){const a=op(k);
   h+=`<tr${sk} style="${z}"><td style="${cc}"></td><td${cs(GM,QE.nw,QE.R)} style="${cell}${a.st}">${a.t}</td><td style="${cc}"></td></tr>`;}}});
 h+='</table>';}
 h+=dz('after');
 if(s.omr&&hasM&&omrPos==='after')h+=omrHTML(s,showKey,screen);
 if(hasS){const pi=partNo++;h+=bar(`PART-${PR[pi]}  ·  SHORT QUESTIONS  (${mk.short} Marks)`,`حصہ ${PU[pi]}: مختصر سوالات`);
 built.short.forEach(p=>{if(!p.items.length)return;
  const all=p.attempt>=p.items.length;
  const en=all?`Q. No. ${p.q}: Answer ALL ${NE[p.items.length]} (${p.items.length}) short questions.  (${p.items.length} × ${s.shortMark} = ${p.items.length*s.shortMark})`
   :`Q. No. ${p.q}: Write short answers to any ${NE[p.attempt]} (${p.attempt}) questions.  (${p.attempt} × ${s.shortMark} = ${p.attempt*s.shortMark})`;
  const ur=all?`سوال نمبر ${p.q}: تمام ${NU[p.items.length]} مختصر سوالات کے جوابات دیں۔`:`سوال نمبر ${p.q}: کوئی سے ${NU[p.attempt]} مختصر سوالات کے جوابات دیں۔`;
  QE=qEdges(s,bi,en);GT=mkGrid(QE.two,100);g4=GT.cols;
  h+=T('margin-bottom:7pt;')+cg(g4)+ins(en,ur,GT);
  p.items.forEach((q,i)=>{const sk=screen?` data-slot="${q._key}"`:'',S=SN[q._key];
   h+=`<tr${sk} style="${zb(i)}"><td style="${cc}font-weight:${wN};">${S.no}${pin(q)}${cross(q)}</td><td${cs(GT,QE.nw,bi?QE.B2:100)} style="${cell}font-weight:${wQ};">${richHtml(q.en)}${figureHtml(q.figure,q.figureAlt)}${tg('Ch '+q.ch)}</td>`;
   if(bi)h+=`<td${cs(GT,QE.B2,QE.R)} style="${uc}font-weight:${wQ};">${richHtml(q.ur)}</td><td style="${uNum}font-weight:${wN};">${S.ur}</td>`;
   h+='</tr>';});
  h+='</table>';});}
 h+=dz('mid');
 if(s.omr&&hasM&&omrPos==='mid')h+=omrHTML(s,showKey,screen);
 if(hasL){const first=longQ0(),last=first+built.long.length-1,pi=partNo++;
 h+=bar(`PART-${PR[pi]}  ·  DETAILED QUESTIONS  (${mk.long} Marks)`,`حصہ ${PU[pi]}: تفصیلی سوالات`);
 if(built.longMode==='groups'){
  built.longGroups.forEach(g=>{
   const qs=g.questions,lo=qs[0]?.no||first,hi=qs[qs.length-1]?.no||lo;
   const en=`${g.name}: Q. No. ${lo}${hi!==lo?' to '+hi:''}. Attempt any ${g.attempt} of ${qs.length} detailed questions. Each question carries ${g.marksEach} marks. (${g.attempt} × ${g.marksEach} = ${g.totalMarks})`;
   const ur=`${g.name}: سوال نمبر ${lo} تا ${hi} میں سے کوئی سے ${NU[g.attempt]||g.attempt} سوالات حل کریں۔ ہر سوال ${g.marksEach} نمبر کا ہے۔`;
   QE=qEdges(s,bi,en);GT=mkGrid(QE.two,100);g4=GT.cols;
   h+=`<div style="margin:4pt 0 2pt;font-weight:${wL};">${esc(g.name)}</div>`+T('margin-bottom:5pt;')+cg(g4)+ins(en,ur,GT);
   qs.forEach(q=>{
    const S=SN[q._key],z=zb(q.no),partHTML=(pt)=>`<div class="pp-long-part" ${screen?`data-slot="${pt._key}"`:''} style="margin:0 0 4pt;">${pin(pt)}${cross(pt)}<b>(${esc(pt.label)})</b> ${richHtml(pt.en)}${figureHtml(pt.figure,pt.figureAlt)}${tg('Ch '+pt.ch)} <span style="white-space:nowrap;">(${pt.marks} marks)</span></div>`;
    const partUr=(pt)=>`<div style="margin:0 0 4pt;"><b>(${esc(pt.label)})</b> ${richHtml(pt.ur)} (${pt.marks} نمبر)</div>`;
    h+=`<tr style="${z}"><td style="${cc}font-weight:${wN};">${S.no}</td><td${cs(GT,QE.nw,bi?QE.B2:100)} style="${cell}font-weight:${wL};">${q.parts.map(partHTML).join('')}</td>`;
    if(bi)h+=`<td${cs(GT,QE.B2,QE.R)} style="${uc}font-weight:${wL};">${q.parts.map(partUr).join('')}</td><td style="${uNum}font-weight:${wN};">${S.ur}</td>`;
    h+='</tr>';
   });
   h+='</table>';
  });
 }else{
  const allL=state.longAttempt>=built.long.length;
  const len=allL?`Q. No. ${first}${built.long.length>1?' to '+last:''}: Attempt ALL ${NE[built.long.length]} (${built.long.length}) detailed questions.  (${built.long.length} × ${s.longMark} = ${mk.long})`
   :`Q. No. ${first}${built.long.length>1?' to '+last:''}: Attempt any ${NE[state.longAttempt]} (${state.longAttempt}) detailed questions.  (${state.longAttempt} × ${s.longMark} = ${mk.long})`;
  const lur=allL?`سوال نمبر ${first} تا ${last}: تمام ${NU[built.long.length]} تفصیلی سوالات کے جوابات دیں۔`:`سوال نمبر ${first} تا ${last}: کوئی سے ${NU[state.longAttempt]} تفصیلی سوالات کے جوابات دیں۔`;
  QE=qEdges(s,bi,len);GT=mkGrid(QE.two,100);g4=GT.cols;
  h+=T('margin-bottom:5pt;')+cg(g4)+ins(len,lur,GT);
  built.long.forEach((q,i)=>{const sk=screen?` data-slot="${q._key}"`:'',S=SN[q._key];
   h+=`<tr${sk} style="${zb(i)}"><td style="${cc}font-weight:${wN};">${S.no}${pin(q)}${cross(q)}</td><td${cs(GT,QE.nw,bi?QE.B2:100)} style="${cell}font-weight:${wL};">${richHtml(q.en)}${figureHtml(q.figure,q.figureAlt)}${tg('Ch '+q.ch)}</td>`;
   if(bi)h+=`<td${cs(GT,QE.B2,QE.R)} style="${uc}font-weight:${wL};">${richHtml(q.ur)}</td><td style="${uNum}font-weight:${wN};">${S.ur}</td>`;
   h+='</tr>';});
  h+='</table>';
 }
 }
 h+=dz('end');
 if(s.omr&&hasM&&omrPos==='end')h+=omrHTML(s,showKey,screen);
 if(s.infoPos==='bottom')h+=infoRowAny();
 return h;
}
function paperInner(s,mode,forceBoth=false){
 if(s.sheetMode!=='two')return paperInnerSheet(s,mode);
 const pg=PAGES[s.page],chosen=forceBoth||previewSheet==='both'?['objective','subjective']:previewSheet==='objective'?['objective']:['subjective'];
 return chosen.map((kind,i)=>{
  const part=paperInnerSheet(Object.assign({},s,{_sheetKind:kind}),mode);
  const br='';
  const brBefore=mode==='export'&&i>0?'page-break-before:always;break-before:page;':'';
  return `<div class="pp-sheet-page" data-sheet="${kind}" style="width:100%;min-height:${pg.h}pt;padding:${s.margin}pt;box-sizing:border-box;background:#fff;box-shadow:0 0 0 1px rgba(15,23,42,.08),0 1px 3px rgba(15,23,42,.1),0 18px 50px rgba(15,23,42,.12);margin:0 0 16pt;${br}${brBefore}">${part}</div>`;
 }).join('');
}
function omrHTML(s,showKey,screen){
 const n=built.mcq.length;if(!n)return'';
 const cols=clamp(parseInt(s.omrCols,10)||4,1,4),rows=Math.ceil(n/cols),FS=s.enSize,BD=`${s.borderW}pt solid #000000`;
 const base=`font-family:'${s.enFont}',serif;font-size:${FS}pt;color:#000;`;
 let h='';
 if(s.omrNewPage)h+='<br clear="all" style="mso-special-character:line-break;page-break-before:always">';
 h+=`<div class="omrwrap" ${screen?'data-omr="1"':''} style="margin:${s.omrGapT}pt 0 ${s.omrGapB}pt 0;text-align:${s.omrAlign};">`;
 if(screen)h+='<div class="omrhandle" id="omrHandle" title="Drag to another position"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 9h14M5 15h14"/></svg>Drag OMR</div>';
   const AR="font-family:Arial,Helvetica,sans-serif;color:#000;",tSz=FS+3,sSz=Math.max(5,FS-5),nSz=Math.max(5,FS-4.5),NUMP=18;
  h+=`<div style="display:inline-block;width:${s.omrWidth}%;text-align:left;">`;
  h+=`<div style="text-align:center;margin:0 0 6pt 0;${AR}line-height:1.25;"><span style="font-size:${tSz}pt;font-weight:bold;">MCQs RESPONSE PART</span><span style="font-size:${sSz}pt;"> (TO BE FILLED BY THE STUDENT)</span>`;
  if(s.omrUrdu&&urduOn(s))h+=`<span dir="rtl" lang="ur" style="font-family:'${s.urFont}','Noto Nastaliq Urdu',serif;font-size:${s.urSize+1}pt;"> &nbsp;(اُمیدوار خود پُر کرے)</span>`;
  h+='</div>';
  if(s.omrRule)h+=`<table cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%;border:${BD};margin-bottom:6pt;${AR}"><tr><td style="border:${BD};padding:${s.pad+2}pt;text-align:center;font-weight:bold;font-size:${FS-2.5}pt;">PLEASE CAREFULLY READ THE&nbsp; QUESTIONS AND FILL THE ANSWER CORRECTLY</td></tr></table>`;
  h+=`<table cellspacing="0" cellpadding="0" style="border-collapse:collapse;table-layout:fixed;width:100%;border:${BD};${AR}"><colgroup>`;
  for(let c=0;c<cols;c++){h+=`<col style="width:${(NUMP/cols).toFixed(3)}%">`;for(let k=0;k<4;k++)h+=`<col style="width:${((100-NUMP)/4/cols).toFixed(3)}%">`;}
  h+='</colgroup>';
  for(let r=0;r<rows;r++){h+='<tr>';
   for(let c=0;c<cols;c++){const idx=c*rows+r+1,sep=c?`border-left:${BD};`:'';
    h+=`<td style="${sep}border-top:0;border-bottom:0;border-right:0;padding:${s.omrPad}pt 0 ${s.omrPad}pt 3pt;font-weight:bold;font-size:${nSz}pt;vertical-align:middle;white-space:nowrap;">${idx<=n?idx+'.':''}</td>`;
    for(let k=0;k<4;k++){
     if(idx>n){h+='<td style="border:0;"></td>';continue;}
     const on=showKey&&built.mcq[idx-1].a===k,bb=bubblePNG('ABCD'[k],s.bubSize,on);
     h+=`<td style="border:0;padding:${s.omrPad}pt 0;text-align:center;vertical-align:middle;line-height:0;font-size:0;"><img src="${bb.url}" width="${bb.px}" height="${bb.px}" style="width:${s.bubSize}pt;height:${s.bubSize}pt;display:inline-block;" alt="${'ABCD'[k]}"></td>`;}}
   h+='</tr>';}
  h+='</table></div></div>';
 return h;
}
function wordHtmlDoc(s){const pg=PAGES[s.page];
 return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><title>${esc(s.title)}</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->
<style>@page Section1{size:${pg.w}pt ${pg.h}pt;margin:${s.margin}pt;}div.Section1{page:Section1;}body{font-family:'${s.enFont}',serif;font-size:${s.enSize}pt;}table{border-collapse:collapse;}p,div{margin:0;}</style>
</head><body><div class="Section1">${paperInner(s,'export',true)}</div></body></html>`;}


;
/* === app-docx.js === */
"use strict";
/* ══════════ ZIP + DOCX ══════════ */
const CRCT=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
function crc32(u8){let c=0xFFFFFFFF;for(let i=0;i<u8.length;i++)c=CRCT[(c^u8[i])&0xFF]^(c>>>8);return(c^0xFFFFFFFF)>>>0;}
const ENC=new TextEncoder();
function zipStore(files){
 const parts=[],central=[];let offset=0;
 const u16=v=>[v&255,(v>>8)&255],u32=v=>[v&255,(v>>8)&255,(v>>16)&255,(v>>>24)&255];
 files.forEach(f=>{const name=ENC.encode(f.name),data=typeof f.data==='string'?ENC.encode(f.data):f.data,crc=crc32(data),pay=f.z||data,meth=f.z?8:0;
  const lh=new Uint8Array([].concat(u32(0x04034b50),u16(20),u16(0x0800),u16(meth),u16(0),u16(0x21),u32(crc),u32(pay.length),u32(data.length),u16(name.length),u16(0)));
  parts.push(lh,name,pay);central.push({name,crc,size:data.length,csize:pay.length,meth,offset});offset+=lh.length+name.length+pay.length;});
 const cdStart=offset,cd=[];
 central.forEach(c=>{cd.push(new Uint8Array([].concat(u32(0x02014b50),u16(20),u16(20),u16(0x0800),u16(c.meth),u16(0),u16(0x21),u32(c.crc),u32(c.csize),u32(c.size),u16(c.name.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(c.offset))),c.name);});
 const cdSize=cd.reduce((a,b)=>a+b.length,0);
 const eo=new Uint8Array([].concat(u32(0x06054b50),u16(0),u16(0),u16(central.length),u16(central.length),u32(cdSize),u32(cdStart),u16(0)));
 const all=parts.concat(cd,[eo]),total=all.reduce((a,b)=>a+b.length,0),out=new Uint8Array(total);let p=0;
 all.forEach(b=>{out.set(b,p);p+=b.length;});return out;
}
async function deflateRaw(u8){const cs=new CompressionStream('deflate-raw'),w=cs.writable.getWriter();w.write(u8);w.close();return new Uint8Array(await new Response(cs.readable).arrayBuffer());}
async function zipPack(files){if(typeof CompressionStream==='undefined')return zipStore(files);
 try{const out=[];for(const f of files){const data=typeof f.data==='string'?ENC.encode(f.data):f.data;let z=null;if(data.length>=200){z=await deflateRaw(data);if(z.length>=data.length)z=null;}out.push({name:f.name,data,z});}return zipStore(out);}
 catch(e){console.warn('deflate unavailable, storing uncompressed',e);return zipStore(files);}}
const X=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const tw=pt=>Math.round(pt*20),emu=pt=>Math.round(pt*12700);
const FIGURE_CACHE=new Map(),MATH_CACHE=new Map();let figureDrawingId=200000,mathDrawingId=400000;
function mathKey(t){return(t.display?'D|':'I|')+t.tex;}
function richTokenRuns(t,o){
 o=o||{};if(t.type==='br')return '<w:r><w:br/></w:r>';
 if(t.type==='isotope')return run(t.mass,Object.assign({},o,{sup:true}))+run(t.atomic,Object.assign({},o,{sub:true}))+run(t.element,o);
 if(t.type==='math')return mathImageRun(t,o);
 return run(t.text,Object.assign({},o,{b:!!o.b||!!t.b,i:!!o.i||!!t.i,sup:!!t.sup,sub:!!t.sub}));
}
function richRuns(value,o){o=o||{};return inlineTokens(value).map(t=>richTokenRuns(t,o)).join('')||run('',o);}
function richTxtP(value,o){
 o=o||{};const tokens=inlineTokens(value);if(!tokens.some(t=>t.type==='math'&&t.display))return para(tokens.map(t=>richTokenRuns(t,o)).join('')||run('',o),o);
 const parts=[];let inline='';
 tokens.forEach(t=>{if(t.type==='math'&&t.display){if(inline){parts.push(para(inline,o));inline='';}parts.push(para(mathImageRun(t,o),{ur:!!o.ur,align:'center',after:2,lh:1.1}));}else inline+=richTokenRuns(t,o);});
 if(inline||!parts.length)parts.push(para(inline||run('',o),o));return parts.join('');
}
function mathImageRun(token,o){
 const item=MATH_CACHE.get(mathKey(token));if(!item)throw new Error('Math formula is not prepared for Word export: '+token.tex);
 o=o||{};const size=Math.max(5,Number(o.sz||(o.ur?state.urSize:state.enSize))||11),scale=size/item.baseSize;
 let w=item.widthPt*scale,h=item.heightPt*scale;const max=token.display?440:280;if(w>max){const k=max/w;w*=k;h*=k;}
 const mm=addMedia(item.bytes,'png'),id=mathDrawingId++;
 return imgXml(mm,emu(w),emu(h),id,'Mathematical formula','LaTeX formula: '+token.tex);
}
async function mathSvgToPng(svg,tex,display){
 if(!svg)throw new Error('MathJax did not produce an SVG for: '+tex);
 const view=String(svg.getAttribute('viewBox')||'').trim().split(/[ ,]+/).map(Number);
 if(view.length!==4||!Number.isFinite(view[2])||!Number.isFinite(view[3])||view[2]<=0||view[3]<=0)throw new Error('MathJax returned invalid formula dimensions: '+tex);
 const baseSize=Math.max(5,Number(state.enSize)||11),widthPt=Math.max(2,view[2]/1000*baseSize),heightPt=Math.max(2,view[3]/1000*baseSize);
 const pxW=Math.max(1,Math.min(2400,Math.ceil(widthPt*96/72*2.5))),pxH=Math.max(1,Math.min(1200,Math.ceil(heightPt*96/72*2.5)));
 const copy=svg.cloneNode(true);copy.setAttribute('xmlns','http://www.w3.org/2000/svg');copy.setAttribute('xmlns:xlink','http://www.w3.org/1999/xlink');copy.setAttribute('color','#000');copy.setAttribute('width',pxW+'px');copy.setAttribute('height',pxH+'px');copy.setAttribute('style','color:#000;');
 const blob=new Blob([new XMLSerializer().serializeToString(copy)],{type:'image/svg+xml;charset=utf-8'}),url=URL.createObjectURL(blob);
 try{const im=await imageFromUrl(url),cv=document.createElement('canvas');cv.width=pxW;cv.height=pxH;const ctx=cv.getContext('2d');if(!ctx)throw new Error('Canvas is unavailable to convert LaTeX for Word export');ctx.clearRect(0,0,pxW,pxH);ctx.drawImage(im,0,0,pxW,pxH);return{bytes:figureBytes(cv.toDataURL('image/png')),widthPt,heightPt,baseSize,display};}
 finally{URL.revokeObjectURL(url);}
}
async function preloadMathAssets(){
 const formulas=new Map(),add=value=>{inlineTokens(value).forEach(t=>{if(t.type==='math')formulas.set(mathKey(t),t);});},addQ=q=>{if(!q)return;add(q.en);add(q.ur);(q.o||[]).forEach(v=>{if(Array.isArray(v)){add(v[0]);add(v[1]);}});};
 (built.mcq||[]).forEach(addQ);(built.short||[]).forEach(p=>(p.items||[]).forEach(addQ));(built.long||[]).forEach(q=>q.parts&&q.parts.length?q.parts.forEach(addQ):addQ(q));
 if(!formulas.size)return;
 const mj=await ensureMathJax();
 for(const [key,t] of formulas){if(MATH_CACHE.has(key))continue;let node;try{node=await mj.tex2svgPromise(t.tex,{display:!!t.display});}catch(e){throw new Error('Could not render LaTeX formula "'+t.tex+'": '+(e.message||e));}
  MATH_CACHE.set(key,await mathSvgToPng(node&&node.querySelector&&node.querySelector('svg'),t.tex,t.display));}
}
function figureBytes(data){const bin=atob(data.split(',')[1]),bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);return bytes;}
function imageFromUrl(url){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('Image could not be decoded'));im.src=url;});}
function validateSvgFigure(source,ref){
 if(source.length>2e6)throw new Error('SVG figure is too large: '+ref);
 const unsafe=/<\s*(?:script|foreignObject|iframe|object|embed)\b|<\s*!\s*(?:DOCTYPE|ENTITY)\b|<\?xml-stylesheet|\son[a-z]+\s*=|\b(?:href|xlink:href)\s*=\s*([\"'])\s*(?:https?:|\/\/|data:|javascript:)|url\(\s*[\"']?\s*(?:https?:|\/\/|data:|javascript:)|@import\b/i;
 if(unsafe.test(source))throw new Error('SVG figure must be self-contained and contain no scripts or external resources: '+ref);
 return source;
}
async function preloadFigureAssets(){
 const refs=new Set(),add=q=>{if(!q)return;if(q.figure)refs.add(cleanFigureRef(q.figure));(q.of||[]).forEach(x=>{if(x)refs.add(cleanFigureRef(x));});};
 built.mcq.forEach(add);built.short.forEach(p=>p.items.forEach(add));built.long.forEach(q=>q.parts&&q.parts.length?q.parts.forEach(add):add(q));refs.delete('');
 for(const ref of refs){if(FIGURE_CACHE.has(ref))continue;const response=await fetch(ref,{cache:'no-cache'});if(!response.ok)throw new Error('Figure file not found: '+ref);const blob=await response.blob(),ext=ref.split('.').pop().toLowerCase();let bytes,width,height;
  if(ext==='png'){bytes=new Uint8Array(await blob.arrayBuffer());if(bytes.length<24||bytes[0]!==137||bytes[1]!==80||bytes[2]!==78||bytes[3]!==71)throw new Error('Invalid PNG figure: '+ref);width=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength).getUint32(16);height=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength).getUint32(20);}
  else{const svg=validateSvgFigure(await blob.text(),ref),safeBlob=new Blob([svg],{type:'image/svg+xml'}),url=URL.createObjectURL(safeBlob);try{const im=await imageFromUrl(url),ratio=(im.naturalWidth||300)/(im.naturalHeight||150);width=Math.min(1600,Math.max(240,im.naturalWidth||600));height=Math.max(1,Math.round(width/ratio));if(height>1600){height=1600;width=Math.round(height*ratio);}const cv=document.createElement('canvas');cv.width=width;cv.height=height;const ctx=cv.getContext('2d');if(!ctx)throw new Error('Canvas is unavailable for SVG conversion');ctx.drawImage(im,0,0,width,height);bytes=figureBytes(cv.toDataURL('image/png'));}finally{URL.revokeObjectURL(url);}}
  if(!width||!height)throw new Error('Figure has invalid dimensions: '+ref);FIGURE_CACHE.set(ref,{bytes,width,height});
 }
}
function figureParagraph(ref,alt,maxWidth){const key=cleanFigureRef(ref);if(!key)return'';const item=FIGURE_CACHE.get(key);if(!item)throw new Error('Figure was not prepared for DOCX export: '+key);let w=Math.min(maxWidth||190,item.width*0.75),h=w*item.height/item.width;if(h>130){h=130;w=h*item.width/item.height;}const mediaItem=addMedia(item.bytes,'png'),id=figureDrawingId++;return para(imgXml(mediaItem,emu(w),emu(h),id,alt||key.split('/').pop(),alt||key.split('/').pop()),{align:'center',exact:h+2,after:2});}
let media=[],rid=2,mediaMap=new Map(); /* rId1/rId2 belong to styles & settings, so images start at rId3 */
function addMedia(bytes,ext){if(mediaMap.has(bytes))return mediaMap.get(bytes);rid++;const n='image'+rid+'.'+ext,r={rid:'rId'+rid,href:'media/'+n,name:'word/media/'+n,data:bytes};media.push(r);mediaMap.set(bytes,r);return r;} /* the relationship list reads rid/href from these records */
function imgXml(m,cx,cy,id,name,descr=""){return `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="${id}" name="${X(name)}"${descr?` descr="${X(descr)}"`:""}/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${id}" name="${X(name)}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${m.rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;}
function run(t,o){o=o||{};const f=o.font||(o.ur?state.urFont:state.enFont),base=o.sz||(o.ur?state.urSize:state.enSize),scale=(o.sup||o.sub)?0.72:1,sz=Math.max(2,Math.round(base*scale*2));
 let p='<w:rPr>'+`<w:rFonts w:ascii="${X(f)}" w:hAnsi="${X(f)}" w:cs="${X(f)}" w:eastAsia="${X(f)}"/>`;
 if(o.b)p+='<w:b/><w:bCs/>';if(o.i)p+='<w:i/><w:iCs/>';if(o.sup||o.sub)p+=`<w:vertAlign w:val="${o.sup?'superscript':'subscript'}"/>`;p+=`<w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/>`;if(o.ur)p+='<w:rtl/><w:lang w:bidi="ur-PK"/>';p+='</w:rPr>';
 return `<w:r>${p}<w:t xml:space="preserve">${X(t)}</w:t></w:r>`;}
function para(inner,o){o=o||{};const src=inner||'';
 const nRun=(src.match(/<w:r>/g)||[]).length,nRtl=(src.match(/<w:rtl\/>/g)||[]).length;
 if(nRun>0&&nRtl===nRun)o=Object.assign({},o,{bidi:true}); /* Urdu-only paragraph = right-to-left */
 /* Line height: the preview uses CSS line-height (a multiple of the font SIZE). Word's "auto" multiplies the font's own
    built-in line height instead (about 1.15 for Times, about 2 for Nastaliq) which adds visible extra space, so every
    paragraph gets an EXACT height computed the same way as the preview. Images are never clipped. */
 let line;
 if(o.exact!=null)line=o.exact;
 else{const lh=o.lh||state.lineH;line=0;
  for(const m of src.matchAll(/<w:r>(?:(?!<\/w:r>)[\s\S])*<\/w:r>/g)){const r=m[0],ex=r.match(/<wp:extent cx="\d+" cy="(\d+)"/),sz=r.match(/<w:sz w:val="(\d+)"/);
   if(ex)line=Math.max(line,ex[1]/12700+1);else if(sz)line=Math.max(line,sz[1]/2*(r.includes('<w:rtl/>')?Math.max(lh+.35,1.5):lh));}
  if(!line)line=state.enSize*lh;}
 line=Math.max(1,line);
 /* Word/OnlyOffice read jc left/right inside a right-to-left paragraph as start/end, so bidi paragraphs carry no jc. Order: bidi, spacing, jc, rPr. */
 let p='<w:pPr>'+(o.bidi?'<w:bidi/>':'')+`<w:spacing w:before="${o.before?tw(o.before):0}" w:after="${o.after?tw(o.after):0}" w:line="${Math.round(line*20)}" w:lineRule="exact"/>`;
 const jc=o.bidi?(o.align==='center'?'center':''):(o.align||'left');if(jc)p+=`<w:jc w:val="${jc}"/>`;
 if(!src)p+='<w:rPr><w:sz w:val="2"/><w:szCs w:val="2"/></w:rPr>';
 p+='</w:pPr>';return `<w:p>${p}${src}</w:p>`;}
function txtP(t,o){return para(run(t,o),o);}
function outerBorders(sz){const e=k=>`<w:${k} w:val="single" w:sz="${sz}" w:space="0" w:color="000000"/>`;return `<w:tblBorders>${e('top')}${e('left')}${e('bottom')}${e('right')}<w:insideH w:val="nil"/><w:insideV w:val="nil"/></w:tblBorders>`;}
function borders(on,sz){if(!on)return '<w:tblBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/><w:insideH w:val="nil"/><w:insideV w:val="nil"/></w:tblBorders>';
 const e=k=>`<w:${k} w:val="single" w:sz="${sz}" w:space="0" w:color="000000"/>`;
 return `<w:tblBorders>${e('top')}${e('left')}${e('bottom')}${e('right')}${e('insideH')}${e('insideV')}</w:tblBorders>`;}
function tbl(grid,rows,o){o=o||{};const total=grid.reduce((a,b)=>a+b,0),sz=Math.max(2,Math.round(state.borderW*8)),m=tw(o.pad!=null?o.pad:state.pad);
 let p='<w:tblPr>'+`<w:tblW w:w="${total}" w:type="dxa"/><w:jc w:val="${o.align||'left'}"/>`+(o.outer?outerBorders(sz):borders(o.borders!==false,sz));
 p+=`<w:tblCellMar><w:top w:w="${m}" w:type="dxa"/><w:left w:w="${m+30}" w:type="dxa"/><w:bottom w:w="${m}" w:type="dxa"/><w:right w:w="${m+30}" w:type="dxa"/></w:tblCellMar><w:tblLayout w:type="fixed"/></w:tblPr>`;
 p+='<w:tblGrid>'+grid.map(w=>`<w:gridCol w:w="${Math.max(1,w)}"/>`).join('')+'</w:tblGrid>';
 return `<w:tbl>${p}${rows.join('')}</w:tbl>`;}
function tc(content,o){o=o||{};let p='<w:tcPr>'+`<w:tcW w:w="${Math.max(1,o.w||1000)}" w:type="dxa"/>`;
 if(o.span&&o.span>1)p+=`<w:gridSpan w:val="${o.span}"/>`;
 p+=`<w:vAlign w:val="${o.valign||'top'}"/>`;
 if(o.shd)p+=`<w:shd w:val="clear" w:color="auto" w:fill="${o.shd}"/>`;
 if(o.bd){const z=Math.max(2,Math.round((o.bdz||state.borderW)*8)),e=(k,on)=>on?`<w:${k} w:val="single" w:sz="${z}" w:space="0" w:color="000000"/>`:`<w:${k} w:val="nil"/>`;p+=`<w:tcBorders>${e('top',o.bd.t)}${e('left',o.bd.l)}${e('bottom',o.bd.b)}${e('right',o.bd.r)}</w:tcBorders>`;}
 if(o.noBorder)p+='<w:tcBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/></w:tcBorders>';
 p+='</w:tcPr>';let body=content||'';
 if(!body)body=para('',{exact:1});else if(/<\/w:tbl>$/.test(body))body+=para('',{exact:1});
 return `<w:tc>${p}${body}</w:tc>`;}
function tr(cells){return `<w:tr><w:trPr><w:cantSplit/></w:trPr>${cells.join('')}</w:tr>`;}
function pageBreak(){return '<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="20" w:lineRule="exact"/></w:pPr><w:r><w:br w:type="page"/></w:r></w:p>';}
function buildDocx(raw){
 if(state.sheetMode!=='two')return buildDocxSheet(raw,'single');
 const objective=buildDocxSheet(true,'objective'),subjective=buildDocxSheet(true,'subjective',true);
 const get=f=>objective.find(x=>x.name===f).data,doc=get('word/document.xml');
 const bodyRe=/<w:body>([\s\S]*?)<w:sectPr[\s\S]*?<\/w:sectPr><\/w:body>/;
 const a=doc.match(bodyRe),b=subjective.find(x=>x.name==='word/document.xml').data.match(bodyRe);
 if(!a||!b)throw new Error('Could not merge the two paper sheets');
 const sect=a[0].match(/<w:sectPr[\s\S]*?<\/w:sectPr>/);if(!sect)throw new Error('Missing Word section properties');
 const merged=doc.replace(bodyRe,`<w:body>${a[1]}${pageBreak()}${b[1]}${sect[0]}</w:body>`);
 const files=subjective.map(x=>x.name==='word/document.xml'?{name:x.name,data:merged}:x);
 return raw?files:zipStore(files);
}
function buildDocxSheet(raw,sheetKind,keepMedia=false){
 if(!keepMedia){media=[];rid=2;mediaMap=new Map();}
 const s=Object.assign({},state,{_sheetKind:sheetKind}),bi=urduOn(s),allMarks=plan.marks;
 const mk=sheetKind==='objective'?{mcq:allMarks.mcq,short:0,long:0,total:allMarks.mcq}:sheetKind==='subjective'?{mcq:0,short:allMarks.short,long:allMarks.long,total:allMarks.short+allMarks.long}:allMarks,pg=PAGES[s.page],SN=serials();
 const W=tw(pg.w),H=tw(pg.h),M=tw(s.margin),CW=W-2*M;
 const hasM=sheetKind!=='subjective'&&built.mcq.length>0,hasS=sheetKind!=='objective'&&built.short.some(p=>p.items.length>0),hasL=sheetKind!=='objective'&&built.long.length>0,PR=['I','II','III'],PU=['اول','دوم','سوم'];let partNo=0;
 const omrPos=sheetKind==='single'?s.omrPos:(s.omrPos==='front'?'front':'end');
 const mcqEn=`Q. No. 1: Choose the Best option and fill the Bubble.  (${built.mcq.length} × ${s.mcqMark} = ${mk.mcq})`;
 let QE=qEdges(s,bi,mcqEn),GM=mkGrid(QE.mcq,CW,true),GT=mkGrid(QE.two,CW,true),grid6=GM.cols,grid4=GT.cols;
 const CWX=(G,a,b)=>{const n=G.sp(a,b),o={w:G.w(a,b)};if(n>1)o.span=n;return o;},VA='top',SA='top';
 const shd=s.shade?'E9E4D6':null,zeb=i=>s.zebra&&i%2===1?'F7F4EA':null;
 const Bx=[];const push=x=>Bx.push(x),spacer=pt=>push(para('',{exact:Math.max(1,pt||4)}));
 if(s.footer){push(txtP(`Paper ${B().code}-${s.alp?'ALP':'FULL'} / V-${String(s.seed).padStart(2,'0')}${sheetKind==='single'?'':` / ${sheetKind==='objective'?'Objective':'Subjective'}`}  ·  ${plan.sch.name}  ·  Examiner: ____________________`,{align:'center',sz:s.enSize-2}));spacer(4);}
 const titleRuns=()=>{let r='';
  if(s.institute.trim())r+=para(run(s.institute,{b:s.bHeader,sz:s.enSize+5}),{align:'center',after:1,lh:1.1});
  r+=para(run(s.title,{b:s.bHeader,sz:s.enSize+1}),{align:'center',after:1,lh:1.1});
  if(bi)r+=para(run((s.subjectUr?s.subjectUr+' — ':'')+(B().classUr||''),{ur:true,b:s.bHeader,sz:s.urSize+1}),{bidi:true,align:'center',after:2,lh:1.5});
  return r;};
 const logoTitleX=(()=>{
  if(s.logo&&logoPNG){const m=addMedia(logoPNG.bytes,'png'),cy=emu(s.logoH),cx=Math.round(cy*(logoPNG.ratio||1));
   const ip=para(imgXml(m,cx,cy,900,'Institute logo'),{align:'center',after:3,lh:1});
   if(s.logoPos==='center')return ip+titleRuns();
   const lw=Math.round(cx/635)+240,tw2=CW-lw,lc=tc(ip,{w:lw,valign:'center',noBorder:true}),tcell=tc(titleRuns(),{w:tw2,valign:'center',noBorder:true});
   return tbl([lw,tw2],[tr(s.logoPos==='left'?[lc,tcell]:[tcell,lc])],{borders:false,pad:0});}
  return titleRuns();})();
 const HS=s.hdrStyle||'classic',metaT=['Class: '+s.klass,'Subject: '+s.subject,'Total Marks: '+mk.total,'Time: '+paperDuration(s,sheetKind)];
 {const a=Math.round(CW*.22),b2=Math.round(CW*.38),c=Math.round(CW*.20),d=CW-a-b2-c,g=[a,b2,c,d],ruleZ=Math.max(1.5,s.borderW*2);
  if(HS==='banner'){
   push(tbl(g,[tr([tc(logoTitleX,{w:CW,span:4,shd:shd})]),tr(metaT.map((t,i)=>tc(txtP(t,{b:s.bHeader,align:'center'}),{w:g[i],valign:VA})))],{borders:!s.hideLines,pad:s.pad+1}));
  }else if(HS==='ruled'){
   push(logoTitleX);spacer(4);
   push(tbl(g,[tr(metaT.map((t,i)=>tc(txtP(t,{b:s.bHeader,align:['left','center','center','right'][i]}),{w:g[i],valign:VA,bd:{t:!s.hideLines,b:!s.hideLines,l:false,r:false},bdz:ruleZ})))],{borders:false,pad:s.pad+1}));
  }else if(HS==='split'){
   const w1=Math.round(CW*.28),w3=w1,w2=CW-w1-w3,bdc={t:false,b:!s.hideLines,l:false,r:false},z={bdz:ruleZ,valign:VA};
   push(tbl([w1,w2,w3],[tr([tc(txtP(metaT[0],{b:s.bHeader})+txtP(metaT[1],{b:s.bHeader}),Object.assign({w:w1,bd:bdc},z)),tc(logoTitleX,Object.assign({w:w2,bd:bdc},z)),tc(txtP(metaT[3],{b:s.bHeader,align:'right'})+txtP(metaT[2],{b:s.bHeader,align:'right'}),Object.assign({w:w3,bd:bdc},z))])],{borders:false,pad:s.pad+1}));
  }else if(HS==='centered'){
   push(logoTitleX);spacer(3);push(tbl([CW/4,CW/4,CW/4,CW-CW*3/4],[tr(metaT.map((t,i)=>tc(txtP(t,{b:s.bHeader,align:'center'}),{w:CW/4,bd:{t:!s.hideLines,b:!s.hideLines,l:!s.hideLines,r:!s.hideLines},valign:VA})))],{borders:!s.hideLines,pad:s.pad+1}));
  }else if(HS==='minimal'){
   push(logoTitleX);spacer(2);push(txtP(metaT.join('   ·   '),{align:'center',sz:s.enSize-1}));spacer(4);
  }else if(HS==='boxed'){
   push(tbl([CW],[tr([tc(logoTitleX,{w:CW,bd:{t:!s.hideLines,l:!s.hideLines,b:!s.hideLines,r:!s.hideLines},pad:s.pad+4})])],{borders:!s.hideLines,pad:s.pad+2}));spacer(3);push(tbl(g,[tr(metaT.map((t,i)=>tc(txtP(t,{b:s.bHeader,align:'center'}),{w:g[i],valign:VA})))],{borders:!s.hideLines,pad:s.pad+1}));
  }else if(HS==='academy'){
   push(tbl([CW],[tr([tc(logoTitleX,{w:CW,bd:{t:!s.hideLines,b:!s.hideLines,l:false,r:false},pad:s.pad+2})])],{borders:false,pad:s.pad+2}));spacer(2);push(tbl([CW/4,CW/4,CW/4,CW-CW*3/4],[tr(metaT.map(t=>tc(txtP(t,{b:s.bHeader,align:'center'}),{w:CW/4,bd:{t:!s.hideLines,b:!s.hideLines,l:false,r:false},valign:VA})))],{borders:false,pad:s.pad+1}));
  }else if(HS==='compact'){
   const w1=Math.round(CW*.64),w2=CW-w1;push(tbl([w1,w2],[tr([tc(logoTitleX,{w:w1,valign:VA,noBorder:true}),tc(metaT.map(t=>txtP(t,{b:s.bHeader,align:'right'})).join(''),{w:w2,valign:VA,noBorder:true})])],{borders:false,pad:s.pad+1}));
  }else{
   push(logoTitleX);spacer(4);
   push(tbl(g,[tr(metaT.map((t,i)=>tc(txtP(t,{b:s.bHeader,align:'center'}),{w:g[i],valign:VA})))],{borders:!s.hideLines}));}}
 const infoSpecDocx=rows=>{
  const edges=[0,100];rows.forEach(r=>{if(r!=='spacer')r.forEach(c=>edges.push(c.a,c.b));});const G=mkGrid(edges,CW,true),none={t:false,l:false,b:false,r:false},all={t:true,l:true,b:true,r:true};
  const trs=rows.map(r=>{if(r==='spacer')return tr([tc(para('',{exact:6}),Object.assign(CWX(G,0,100),{bd:none}))]);
   return tr(r.map(c=>{const o=CWX(G,c.a,c.b);
    if(c.k==='gap')return tc(para('',{exact:1}),Object.assign(o,{bd:none}));
    if(c.k==='box')return tc(para('',{exact:Math.round((s.enSize+8)*10)/10}),Object.assign(o,{bd:all,valign:'center'}));
    return tc(txtP(c.t,{b:s.bHeader}),Object.assign(o,{bd:c.k==='line'?{t:false,l:false,b:true,r:false}:none,valign:'bottom'}));}));});
  return tbl(G.cols,trs,{borders:false,pad:s.pad+3});};
 const infoTblTable=()=>{const f=[];
  if(s.showName)f.push('Name: ____________________________');
  if(s.showRoll)f.push('Roll No: ____________________');
  if(s.showSection)f.push('Section: '+(s.sectionVal.trim()?s.sectionVal:'____________'));
  if(s.showDate!==false)f.push('Date: '+(s.date.trim()?s.date:'________________'));
  if(!f.length)return'';const n=f.length,g=[];let acc=0;
  for(let i=0;i<n;i++){const w=i===n-1?CW-acc:Math.round(CW/n);g.push(w);acc+=w;}
  return tbl(g,[tr(f.map((t,i)=>tc(txtP(t,{b:s.bHeader}),{w:g[i]})))],{borders:!s.hideLines});};
 const infoTbl=()=>{if(s.infoStyle&&s.infoStyle!=='table'){const r=infoSpec(s);return r.length?infoSpecDocx(r):'';}return infoTblTable();};
 if(s.infoPos==='top'){spacer(4);push(infoTbl());}
 spacer(5);
 if(hasM&&sheetKind==='objective'){let note=txtP('Note: Four possible answers A, B, C and D are given for each question. Choose the correct answer and fill the corresponding circle on the OMR answer sheet.',{b:true,sz:s.enSize-1});if(bi)note+=txtP('ہر سوال کے چار ممکنہ جوابات A، B، C اور D دیے گئے ہیں۔ درست جواب منتخب کریں اور جوابی شیٹ پر متعلقہ دائرے کو پُر کریں۔',{ur:true,b:true});push(tbl([CW],[tr([tc(note,{w:CW,shd:shd})])],{borders:!s.hideLines,pad:s.pad+2}));spacer(4);}
 const bar=(en,ur)=>{let c=txtP(en,{b:s.bBar,align:'center',sz:s.enSize+1.5});
  if(bi)c+=txtP(ur,{ur:true,b:s.bBar,align:'center'});
  push(tbl([CW],[tr([tc(c,{w:CW,shd:shd})])],{borders:!s.hideLines,pad:s.pad+2}));spacer(4);};
 const insRow=(G,en,ur)=>{const sd={shd:shd};
  if(!bi)return tr([tc(txtP(en,{b:s.bInstr}),Object.assign(CWX(G,0,100),sd))]);
  return tr([tc(txtP(en,{b:s.bInstr}),Object.assign(CWX(G,0,QE.H),sd)),tc(txtP(ur,{ur:true,b:s.bInstr}),Object.assign(CWX(G,QE.H,100),sd))]);};
   function omrBlock(){
   const n=built.mcq.length;if(!n)return;
   const cols=clamp(parseInt(s.omrCols,10)||4,1,4),rows=Math.ceil(n/cols),innerW=Math.round(CW*s.omrWidth/100),AR='Arial',nSz=Math.max(5,s.enSize-4.5);
   if(s.omrNewPage)push(pageBreak());
   if(s.omrGapT)spacer(s.omrGapT);
   let t=para(run('MCQs RESPONSE PART',{b:true,sz:s.enSize+3,font:AR})+run(' (TO BE FILLED BY THE STUDENT)',{sz:Math.max(5,s.enSize-5),font:AR})+(s.omrUrdu&&bi?run('  (اُمیدوار خود پُر کرے)',{ur:true,sz:s.urSize+1}):''),{align:'center',after:6,lh:1.25});
   if(s.omrRule){t+=tbl([innerW],[tr([tc(txtP('PLEASE CAREFULLY READ THE  QUESTIONS AND FILL THE ANSWER CORRECTLY',{b:true,align:'center',sz:s.enSize-2.5,font:AR}),{w:innerW,valign:'center'})])],{borders:true,pad:s.pad+2,align:s.omrAlign});t+=para('',{exact:6});}
   const blockW=Math.floor(innerW/cols),numW=Math.round(blockW*.18),bubW=Math.floor((blockW-numW)/4),lastW=blockW-numW-3*bubW,grid=[];
   for(let c=0;c<cols;c++)grid.push(numW,bubW,bubW,bubW,lastW);
   const rowsX=[];
   for(let r=0;r<rows;r++){const cells=[];
    for(let c=0;c<cols;c++){const idx=c*rows+r+1,ok=idx<=n;
     cells.push(tc(ok?txtP(idx+'.',{b:true,sz:nSz,font:AR}):'',{w:numW,valign:'center',bd:{t:r===0,b:r===rows-1,l:true,r:false}}));
     for(let k=0;k<4;k++){let body='';
      if(ok){const bp=bubblePNG('ABCD'[k],s.bubSize,false),mm=addMedia(bp.bytes,'png'),cx=emu(s.bubSize);body=para(imgXml(mm,cx,cx,1000+idx*10+k,'Bubble '+'ABCD'[k]),{align:'center'});}
      cells.push(tc(body,{w:k===3?lastW:bubW,valign:'center',bd:{t:r===0,b:r===rows-1,l:false,r:k===3&&c===cols-1}}));}}
    rowsX.push(tr(cells));}
   t+=tbl(grid,rowsX,{outer:true,pad:s.omrPad,align:s.omrAlign});
   push(t);if(s.omrGapB)spacer(s.omrGapB);
  }
if(s.omr&&hasM&&omrPos==='front'){omrBlock();spacer(5);}
 if(hasM){const pi=partNo++;bar(`PART-${PR[pi]}  ·  OBJECTIVE  (${mk.mcq} Marks)`,`حصہ ${PU[pi]}: معروضی سوالات`);
 {const rows=[insRow(GM,mcqEn,'سوال نمبر 1: درست جواب کا انتخاب کریں۔ اور ببل بھریں۔')];
  built.mcq.forEach((m,i)=>{const S=SN[m._key],z=zeb(i),cell=(a,b,body,o)=>tc(body,Object.assign(CWX(GM,a,b),{shd:z},o||{}));
   const cells=[cell(0,QE.nw,txtP(S.no,{b:s.bNum,align:'center'}),{valign:SA})];
   if(bi){cells.push(cell(QE.nw,QE.B1,richTxtP(m.en,{b:s.bStem})+figureParagraph(m.figure,m.figureAlt,190)));cells.push(cell(QE.B1,QE.R,richTxtP(m.ur,{ur:true,b:s.bStem})));cells.push(cell(QE.R,100,txtP(S.ur,{ur:true,b:s.bNum,align:'center'}),{valign:SA}));}
   else cells.push(cell(QE.nw,100,richTxtP(m.en,{b:s.bStem})+figureParagraph(m.figure,m.figureAlt,190)));
   rows.push(tr(cells));
   const optBody=k=>{const o=m.o[k];if(!o)return'';let body=para(richRuns('ABCD'[k]+'. '+o[0],{}));if(bi&&o[1])body+=para(richRuns('  '+o[1],{ur:true}),{bidi:true});body+=figureParagraph(m.of&&m.of[k],m.oa&&m.oa[k],105);return body;};
   const lay=layoutFor(m);
   if(lay===4){const c=[cell(0,QE.nw,'')];for(let k=0;k<4;k++)c.push(cell(QE.nw+k*QE.q4,QE.nw+(k+1)*QE.q4,optBody(k)));c.push(cell(QE.R,100,''));rows.push(tr(c));}
   else if(lay===2){for(let r=0;r<2;r++)rows.push(tr([cell(0,QE.nw,''),cell(QE.nw,QE.B1,optBody(r*2)),cell(QE.B1,QE.R,optBody(r*2+1)),cell(QE.R,100,'')]));}
   else{for(let k=0;k<4;k++)rows.push(tr([cell(0,QE.nw,''),cell(QE.nw,QE.R,optBody(k)),cell(QE.R,100,'')]));}});
  push(tbl(grid6,rows,{borders:!s.hideLines}));}
 spacer(6);}
 if(s.omr&&hasM&&omrPos==='after'){omrBlock();spacer(5);}
 if(hasS){const pi=partNo++;bar(`PART-${PR[pi]}  ·  SHORT QUESTIONS  (${mk.short} Marks)`,`حصہ ${PU[pi]}: مختصر سوالات`);
 built.short.forEach(p=>{if(!p.items.length)return;
  const all=p.attempt>=p.items.length;
  const en=all?`Q. No. ${p.q}: Answer ALL ${NE[p.items.length]} (${p.items.length}) short questions.  (${p.items.length} × ${s.shortMark} = ${p.items.length*s.shortMark})`
   :`Q. No. ${p.q}: Write short answers to any ${NE[p.attempt]} (${p.attempt}) questions.  (${p.attempt} × ${s.shortMark} = ${p.attempt*s.shortMark})`;
  const ur=all?`سوال نمبر ${p.q}: تمام ${NU[p.items.length]} مختصر سوالات کے جوابات دیں۔`:`سوال نمبر ${p.q}: کوئی سے ${NU[p.attempt]} مختصر سوالات کے جوابات دیں۔`;
  QE=qEdges(s,bi,en);GT=mkGrid(QE.two,CW,true);const g=GT.cols,rows=[insRow(GT,en,ur)];
  p.items.forEach((q,i)=>{const S=SN[q._key],z=zeb(i),cell=(a,b,body,o)=>tc(body,Object.assign(CWX(GT,a,b),{shd:z},o||{}));
   const c=[cell(0,QE.nw,txtP(S.no,{b:s.bNum,align:'center'}),{valign:SA}),cell(QE.nw,bi?QE.B2:100,richTxtP(q.en,{b:s.bShort})+figureParagraph(q.figure,q.figureAlt,190))];
   if(bi){c.push(cell(QE.B2,QE.R,richTxtP(q.ur,{ur:true,b:s.bShort})));c.push(cell(QE.R,100,txtP(S.ur,{ur:true,b:s.bNum,align:'center'}),{valign:SA}));}
   rows.push(tr(c));});
  push(tbl(g,rows,{borders:!s.hideLines}));spacer(6);});}
 if(s.omr&&hasM&&omrPos==='mid'){omrBlock();spacer(5);}
 if(hasL){const first=longQ0(),last=first+built.long.length-1,pi=partNo++;
 bar(`PART-${PR[pi]}  ·  DETAILED QUESTIONS  (${mk.long} Marks)`,`حصہ ${PU[pi]}: تفصیلی سوالات`);
 if(built.longMode==='groups'){
  built.longGroups.forEach(g=>{
   const qs=g.questions,lo=qs[0]?.no||first,hi=qs[qs.length-1]?.no||lo;
   const en=`${g.name}: Q. No. ${lo}${hi!==lo?' to '+hi:''}. Attempt any ${g.attempt} of ${qs.length} detailed questions. Each question carries ${g.marksEach} marks. (${g.attempt} × ${g.marksEach} = ${g.totalMarks})`;
   const ur=`${g.name}: سوال نمبر ${lo} تا ${hi} میں سے کوئی سے ${NU[g.attempt]||g.attempt} سوالات حل کریں۔ ہر سوال ${g.marksEach} نمبر کا ہے۔`;
   QE=qEdges(s,bi,en);GT=mkGrid(QE.two,CW,true);const grid=GT.cols,rows=[insRow(GT,en,ur)];
   qs.forEach((q,i)=>{const S=SN[q._key],z=zeb(i),cell=(a,b,body,o)=>tc(body,Object.assign(CWX(GT,a,b),{shd:z},o||{}));
    const enBody=q.parts.map(pt=>richTxtP(`(${pt.label}) `,{b:s.bLong})+richTxtP(pt.en,{b:s.bLong})+figureParagraph(pt.figure,pt.figureAlt,185)+txtP(`Chapter ${pt.ch} · ${pt.marks} marks`,{sz:s.enSize-2})).join('');
    const urBody=q.parts.map(pt=>richTxtP(`(${pt.label}) `,{ur:true,b:s.bLong})+richTxtP(pt.ur,{ur:true,b:s.bLong})+txtP(`باب ${pt.ch} · ${pt.marks} نمبر`,{ur:true,sz:s.enSize-2})).join('');
    const c=[cell(0,QE.nw,txtP(S.no,{b:s.bNum,align:'center'}),{valign:SA}),cell(QE.nw,bi?QE.B2:100,enBody)];
    if(bi){c.push(cell(QE.B2,QE.R,urBody));c.push(cell(QE.R,100,txtP(S.ur,{ur:true,b:s.bNum,align:'center'}),{valign:SA}));}
    rows.push(tr(c));
   });
   push(txtP(g.name,{b:s.bLong,align:'center',after:1}));push(tbl(grid,rows,{borders:!s.hideLines}));spacer(5);
  });
 }else{
  const allL=s.longAttempt>=built.long.length;
  const en=allL?`Q. No. ${first}${built.long.length>1?' to '+last:''}: Attempt ALL ${NE[built.long.length]} (${built.long.length}) detailed questions.  (${built.long.length} × ${s.longMark} = ${mk.long})`
   :`Q. No. ${first}${built.long.length>1?' to '+last:''}: Attempt any ${NE[s.longAttempt]} (${s.longAttempt}) detailed questions.  (${s.longAttempt} × ${s.longMark} = ${mk.long})`;
  const ur=allL?`سوال نمبر ${first} تا ${last}: تمام ${NU[built.long.length]} تفصیلی سوالات کے جوابات دیں۔`:`سوال نمبر ${first} تا ${last}: کوئی سے ${NU[s.longAttempt]} تفصیلی سوالات کے جوابات دیں۔`;
  QE=qEdges(s,bi,en);GT=mkGrid(QE.two,CW,true);const g=GT.cols,rows=[insRow(GT,en,ur)];
  built.long.forEach((q,i)=>{const S=SN[q._key],z=zeb(i),cell=(a,b,body,o)=>tc(body,Object.assign(CWX(GT,a,b),{shd:z},o||{}));
   const c=[cell(0,QE.nw,txtP(S.no,{b:s.bNum,align:'center'}),{valign:SA}),cell(QE.nw,bi?QE.B2:100,richTxtP(q.en,{b:s.bLong})+figureParagraph(q.figure,q.figureAlt,190))];
   if(bi){c.push(cell(QE.B2,QE.R,richTxtP(q.ur,{ur:true,b:s.bLong})));c.push(cell(QE.R,100,txtP(S.ur,{ur:true,b:s.bNum,align:'center'}),{valign:SA}));}
   rows.push(tr(c));});
  push(tbl(g,rows,{borders:!s.hideLines}));
 }
 }
 if(s.omr&&hasM&&omrPos==='end'){spacer(5);omrBlock();}
 if(s.infoPos==='bottom'){spacer(6);push(infoTbl());}
 const sect=`<w:sectPr><w:pgSz w:w="${W}" w:h="${H}"/><w:pgMar w:top="${M}" w:right="${M}" w:bottom="${M}" w:left="${M}" w:header="0" w:footer="0" w:gutter="0"/><w:cols w:space="720"/><w:docGrid w:linePitch="360"/></w:sectPr>`;
 const doc=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>${Bx.join('')}${sect}</w:body></w:document>`;
 const styles=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="${X(s.enFont)}" w:hAnsi="${X(s.enFont)}" w:cs="${X(s.enFont)}"/><w:sz w:val="${Math.round(s.enSize*2)}"/><w:szCs w:val="${Math.round(s.enSize*2)}"/><w:lang w:val="en-US" w:bidi="ur-PK"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="${Math.round(s.lineH*240)}" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style></w:styles>`;
 const settings=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:zoom w:percent="100"/><w:defaultTabStop w:val="720"/><w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat></w:settings>`;
 const rels=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>${media.map(m=>`<Relationship Id="${m.rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${m.href}"/>`).join('')}</Relationships>`;
 const ct=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`;
 const rootRels=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`;
 const now=new Date().toISOString().replace(/\.\d+Z$/,'Z');
 const core=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${X(s.title)} — ${X(B().subject)} ${state.grade}</dc:title><dc:subject>${X(s.subject)}</dc:subject><dc:creator>Paper Press</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created></cp:coreProperties>`;
 const app=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Paper Press</Application><Company>${X(s.institute)}</Company></Properties>`;
 const _files=[{name:'[Content_Types].xml',data:ct},{name:'_rels/.rels',data:rootRels},{name:'docProps/core.xml',data:core},{name:'docProps/app.xml',data:app},{name:'word/document.xml',data:doc},{name:'word/_rels/document.xml.rels',data:rels},{name:'word/styles.xml',data:styles},{name:'word/settings.xml',data:settings}].concat(media.map(m=>({name:m.name,data:m.data})));
  return raw?_files:zipStore(_files);
}


;
/* === app-analysis.js === */
"use strict";
/* ══════════ ANALYSIS ══════════ */
function analyse(){
 const b=B(),sch=plan.sch,all=[];
 built.mcq.forEach(m=>all.push({ch:m.ch,txt:m.en+' '+m.o.map(o=>o[0]).join(' '),ex:m.ex}));
 built.short.forEach(p=>p.items.forEach(q=>all.push({ch:q.ch,txt:q.en,ex:q.ex})));
 built.long.forEach(q=>{if(q.parts&&q.parts.length)q.parts.forEach(p=>all.push({ch:p.ch,txt:p.en,ex:p.ex}));else all.push({ch:q.ch,txt:q.en,ex:q.ex});});
 const hits=b.exRules.map(e=>({e,n:all.filter(a=>e.re.test(a.txt)).length}));
 const exItems=all.filter(a=>a.ex).length,conf=[];
 const am={};built.mcq.forEach(q=>am[q.ch]=(am[q.ch]||0)+1);
 const t=schemeTotals(sch);
 if(secM())conf.push({label:'MCQ spread matches scheme',ok:state.mcqCount===t.mcq&&Object.keys(sch.mcq).every(c=>(am[c]||0)===(sch.mcq[c]||0)||!plan.chs.includes(+c)),got:state.mcqCount+'/'+t.mcq});
 if(secS())conf.push({label:'Short parts × printed',ok:state.shortParts===t.parts&&t.printed.every(p=>p===state.shortPrinted),got:state.shortParts+'×'+state.shortPrinted});
 if(secS())conf.push({label:'Attempt per short part',ok:built.short.every((p,i)=>p.attempt===(sch.short[i%sch.short.length].attempt)),got:built.short.map(p=>p.attempt).join('·')});
 const lok=built.longMode==='groups'?built.longGroups.every(g=>g.questions.every(q=>q.parts.every((p,i)=>p.candidates.includes(p.ch)&&(p.chapterRule.type!=='different-from-a'||p.ch!==q.parts[0].ch)))):built.long.length===sch.long.length&&built.long.every((q,i)=>sch.long[i].includes(q.ch));
 if(secL())conf.push({label:built.longMode==='groups'?'Long parts follow chapter rules':'Long chapters follow scheme',ok:lok,got:built.longMode==='groups'?built.longGroups.flatMap(g=>g.questions.flatMap(q=>q.parts.map(p=>p.label+':'+p.ch))).join(' · '):built.long.map(q=>q.ch).join('·')});
 if(secM()&&secS()&&secL())conf.push({label:'Paper totals '+t.total+' marks',ok:plan.marks.total===t.total,got:plan.marks.total+''});
 if(state.alp){conf.push({label:'Excluded unit '+b.alpEx.join(', ')+' absent',ok:!all.some(a=>b.alpEx.includes(a.ch)),got:all.some(a=>b.alpEx.includes(a.ch))?'present':'absent'});
  conf.push({label:'Excluded topics withheld',ok:exItems===0,got:exItems+' items'});}
 const crossN=built.slots.filter(s=>s.ch!==s.planCh).length;
 return{all,hits,exItems,conf,confOk:conf.filter(c=>c.ok).length,items:all.length,crossN};
}
const CHK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';
const WRN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l9.5 17H2.5z"/><path d="M12 9v5M12 17.4v.1"/></svg>';
function paintSections(){
 const on={m:secM(),s:secS(),l:secL()},mk=plan.marks;
 [['grpMcq',on.m],['grpShort',on.s],['grpLong',on.l]].forEach(([id,v])=>{const e=$(id);if(e)e.classList.toggle('off',!v);});
 $('secM').textContent=on.m?built.mcq.length+' questions · '+mk.mcq+' marks':'off — no MCQ part, no OMR';
 $('secS').textContent=on.s?built.short.reduce((n,p)=>n+p.items.length,0)+' questions in '+built.short.filter(p=>p.items.length).length+' parts · '+mk.short+' marks':'off';
 $('secL').textContent=on.l?built.long.length+' printed · '+(built.longMode==='groups'?plan.longGroups.map(g=>'attempt '+g.attempt+'/'+g.questions.length).join(', '):'attempt '+state.longAttempt)+' · '+mk.long+' marks':'off';
 $('secEm').textContent=[on.m&&'MCQ',on.s&&'Short',on.l&&'Long'].filter(Boolean).join(' + ');
 if(!on.m)$('mcqEm').textContent='off';if(!on.s)$('shortEm').textContent='off';if(!on.l)$('longEm').textContent='off';}
function paintLedger(){paintSections();
 const a=analyse(),mk=plan.marks,b=B(),sch=plan.sch,np=Object.keys(overrides).length,t=schemeTotals(sch);
 $('tMarks').textContent=mk.total;$('tItems').textContent=a.items;$('tPins').textContent=np;
 $('ledTotal').textContent=mk.total;
 const ts=built.short.reduce((x,p)=>x+p.items.length,0);
 $('ledStruct').textContent=`${built.mcq.length} MCQ · ${ts} short · ${built.long.length} long`;
 $('barA').style.flexGrow=Math.max(1,mk.mcq);$('barA').textContent=mk.mcq;
 $('barB').style.flexGrow=Math.max(1,mk.short);$('barB').textContent=mk.short;
 $('barC').style.flexGrow=Math.max(1,mk.long);$('barC').textContent=mk.long;
 $('schName').textContent=sch.name;
 const first=longQ0();
 $('schRows').innerHTML=
  (secM()?`<div class="row"><div class="pip"></div><div class="nm">MCQ weighting</div><div class="ct"><b>${Object.keys(sch.mcq).filter(c=>sch.mcq[c]>0).sort((x,y)=>x-y).map(c=>'C'+c+'×'+sch.mcq[c]).join(' ')}</b></div></div>`:'')
  +(secS()?sch.short.map((p,i)=>`<div class="row"><div class="pip"></div><div class="nm">Q.${shortQ0()+i} short</div><div class="ct"><b>${Object.keys(p.ch).filter(c=>p.ch[c]>0).sort((x,y)=>x-y).map(c=>'C'+c+'×'+p.ch[c]).join(' ')}</b> · try ${p.attempt}</div></div>`).join(''):'')
  +(secL()?(sch.longGroups&&sch.longGroups.length?sch.longGroups.map(g=>`<div class="row"><div class="pip mag"></div><div class="nm">${esc(g.name)} · ${g.questions.length} printed</div><div class="ct">try <b>${g.attempt}</b> · ${g.questions[0].parts.map(p=>`(${p.label}) ${p.marks}m`).join(' + ')}</div></div>`).join(''):sch.long.map((al,i)=>`<div class="row"><div class="pip ${al.length>1?'mag':''}"></div><div class="nm">Q.${first+i} long ${al.length>1?'(either)':'(compulsory)'}</div><div class="ct"><b>Ch ${al.join(' or ')}</b></div></div>`).join('')):'')
  +`<div class="row"><div class="pip off"></div><div class="nm">Scheme total</div><div class="ct"><b>${t.total}</b> marks</div></div>`;
 const am={},as={},al={};
 built.mcq.forEach(q=>am[q.ch]=(am[q.ch]||0)+1);
 built.short.forEach(p=>p.items.forEach(q=>as[q.ch]=(as[q.ch]||0)+1));
 built.long.forEach(q=>{if(q.parts&&q.parts.length)q.parts.forEach(p=>al[p.ch]=(al[p.ch]||0)+1);else al[q.ch]=(al[q.ch]||0)+1;});
 const chs=[...new Set([...plan.chs,...Object.keys(am).map(Number),...Object.keys(as).map(Number),...Object.keys(al).map(Number)])].sort((x,y)=>x-y);
 $('allocBody').innerHTML=chs.map(c=>{const m=am[c]||0,s=as[c]||0,l=al[c]||0,k=caps(c);
  return `<tr><td>${c}. ${b.names[c]}</td><td class="${m?'':'zero'}"><b>${m}</b><i>/${k.m}</i></td><td class="${s?'':'zero'}"><s>${s}</s><i>/${k.s}</i></td><td class="${l?'':'zero'}"><u>${l}</u><i>/${k.l}</i></td></tr>`;}).join('')
  +`<tr class="tot"><td>Printed total</td><td>${built.mcq.length}</td><td>${ts}</td><td>${built.long.length}</td></tr>`;
 $('allocEm').textContent=chs.length+' chapters'+(a.crossN?' · '+a.crossN+'↔':'');
 const mx=Math.max(1,...chs.map(c=>am[c]||0));
 $('dist').innerHTML=chs.map(c=>{const v=am[c]||0;return `<div class="dc"><div class="db ${v>=mx&&mx>1?'hi':''}" style="height:${Math.max(5,v/mx*100)}%"><em>${v}</em></div><small>C${c}</small></div>`;}).join('');
 $('spreadEm').textContent=built.mcq.length+' placed';
 $('shortRows').innerHTML=built.short.map(p=>{const g={};p.items.forEach(q=>g[q.ch]=(g[q.ch]||0)+1);
  return `<div class="row"><div class="pip"></div><div class="nm">Q.${p.q} · ${Object.keys(g).sort((x,y)=>x-y).map(c=>'C'+c+'×'+g[c]).join(' + ')}</div><div class="ct">try <b>${p.attempt}</b> = ${p.attempt*state.shortMark}</div></div>`;}).join('');
 $('longRows').innerHTML=built.long.map((q,i)=>q.parts&&q.parts.length?`<div class="row"><div class="pip"></div><div class="nm">Q.${q.no} · ${q.parts.map(p=>`(${p.label}) Ch ${p.ch} ${b.names[p.ch]}`).join(' · ')}</div><div class="ct"><b>${q.marks} marks</b></div></div>`:`<div class="row"><div class="pip"></div><div class="nm">Q.${first+i} · Ch ${q.ch} ${b.names[q.ch]}</div><div class="ct"><b>${state.longMark}</b></div></div>`).join('');
 $('pinEm').textContent=np;
 const pk=Object.keys(overrides);
 $('pinRows').innerHTML=pk.length?pk.map(k=>{const s=slotMap[k];if(!s)return'';
  return `<div class="row"><div class="pip mag"></div><div class="nm">${s.label} · Ch ${s.ch}${s.ch!==s.planCh?' ↔':''}</div><button class="xb" data-unpin="${k}">✕</button></div>`;}).join('')
  :'<div class="empty">No pinned questions yet.<br>Click a question on the paper and press 📌.</div>';
 $('confEm').textContent=a.confOk+' / '+a.conf.length;
 $('confRows').innerHTML=a.conf.map(c=>`<div class="row"><div class="pip ${c.ok?'':'warn'}"></div><div class="nm">${c.label}</div><div class="ct"><b>${c.got}</b></div></div>`).join('')
  +(a.crossN?`<div class="row"><div class="pip warn"></div><div class="nm">Cross-chapter picks</div><div class="ct"><b>${a.crossN}</b></div></div>`:'');
 const good=a.confOk===a.conf.length&&!a.crossN;
 $('ledDot').style.background=good?'var(--green)':'var(--amber)';
 $('ledDot').style.boxShadow='0 0 10px '+(good?'var(--green)':'var(--amber)');
 const th=a.hits.reduce((x,y)=>x+y.n,0);
 $('exEm').textContent=state.alp?(th===0?'clean':th+' hits'):(th+' allowed');
 $('exEm').style.color=state.alp?(th===0?'var(--green)':'var(--red)'):'var(--amber)';
 $('exList').innerHTML=a.hits.map(x=>`<div class="ex ${x.n>0?'hit':''}">${x.n>0?WRN:CHK}<div><b>Unit ${x.e.u} — ${x.e.name}</b><span>${x.e.pp} · ${x.n} ${state.alp?'match':'in play'}</span></div></div>`).join('');
 const pg=PAGES[state.page],usable=pg.h*96/72-state.margin*2*96/72;
 let est=Math.max(1,Math.ceil(($('sheet').offsetHeight||900)/usable));if(state.omr&&built.mcq.length&&state.omrNewPage)est++;
 $('tagPages').textContent=`${pg.label} · ${est} sheet${est>1?'s':''}`;
 $('tagSeed').textContent='Set V-'+String(state.seed).padStart(2,'0');
 $('tagStruct').textContent=`${built.mcq.length} MCQ · ${ts} Short · ${built.long.length} Long`;
 $('tagScheme').textContent=sch.name;
 const imgCount=(state.omr?built.mcq.length*4:0)+(state.logo&&logoPNG?1:0);
 $('srcNote').innerHTML=`<b>.docx ready.</b> ${a.items} questions · ${imgCount} images · ${urduOn()?'Urdu <b>'+state.urSize+'pt</b>, ':''}English <b>${state.enSize}pt</b>.<br><br>Scheme <u>${esc(sch.name)}</u>. Serials on <u>${urduOn()?'both sides':'one side'}</u>, no marks column. Lines <u>${state.hideLines?'hidden':'visible'}</u>. Margin <b>${state.margin}pt</b>. OMR at <b>${ZLABEL[state.omrPos]}</b>.${a.crossN?` <b>${a.crossN}</b> cross-chapter pick${a.crossN>1?'s':''}.`:''}`;
 $('stampTitle').textContent=good?'SCHEME COMPLIANT':'PAPER READY';
 $('stampSub').textContent=`CLASS ${state.grade} · ${mk.total} MARKS · V-${String(state.seed).padStart(2,'0')}`;
 $('modeBadge').classList.toggle('off',!state.alp);
 $('modeTxt').textContent=state.alp?'ALP On':'Full Book';
 $('gBadge').textContent='Class '+b.name;
}


;
/* === app-presets.js === */
"use strict";
/* ══════════ PRESETS ══════════ */
const saveHidden=()=>LS.set('pp.hiddenFactory.v1',hiddenF);
const allPresets=()=>FACTORY.filter(p=>!hiddenF.includes(p.id)).concat(presets);
function presetMarks(p){const c=p.cfg,on=k=>(c[k]!==undefined?c[k]:state[k])!==false;
 const mc=!on('incMcq')&&(on('incShort')||on('incLong'))?0:(c.mcqCount!=null?c.mcqCount:state.mcqCount)*(c.mcqMark!=null?c.mcqMark:state.mcqMark);
 const att=c.shortAttempts||state.shortAttempts,parts=c.shortParts!=null?c.shortParts:state.shortParts,sm=c.shortMark!=null?c.shortMark:state.shortMark;
 let sh=0;if(on('incShort'))for(let i=0;i<parts;i++)sh+=(att[i]||0)*sm;
 const sid=c.sid||state.sid,grade=c.grade||state.grade,scheme=allSchemes().find(x=>x.id===(c.schemeId||state.schemeId)&&x.courseId===`${grade}-${sid}`),lng=scheme&&scheme.longGroups&&scheme.longGroups.length?scheme.longGroups.reduce((n,g)=>n+(g.totalMarks!=null?g.totalMarks:g.attempt*(g.questions[0]||{parts:[]}).parts.reduce((m,p)=>m+p.marks,0)),0):(c.longAttempt!=null?c.longAttempt:state.longAttempt)*(c.longMark!=null?c.longMark:state.longMark);
 return mc+sh+(on('incLong')?lng:0);}
function savePresets(){LS.set('pp.presets.v7',presets);}
function captureConfig(sc){const cfg={};sc.forEach(s=>SCOPES[s].keys.forEach(k=>{cfg[k]=JSON.parse(JSON.stringify(state[k]));}));return cfg;}
function applyPreset(p){if(!p)return;
 const cBefore=cid();
 p.scopes.forEach(s=>SCOPES[s].keys.forEach(k=>{if(p.cfg[k]!==undefined)state[k]=JSON.parse(JSON.stringify(p.cfg[k]));}));
 if(!BOOKS[cid()]||!B().hasQuestions){state.grade=9;state.sid=DEFAULT_SUBJECT;}
 if(cid()!==cBefore){if(!p.cfg||p.cfg.timeObj===undefined)state.timeObj=0;if(!p.cfg||p.cfg.timeSubj===undefined)state.timeSubj=0;state.klass=B().name;syncSubject(state.grade,state.sid);coursePickerGrade=state.grade;overrides={};sticky={};activeSlot=null;paintCourseUI();}
 state.chapters=(state.chapters||[]).filter(c=>B().chapters.includes(c));
 if(!state.chapters.length)state.chapters=B().alpCh.slice();
 if(!allSchemes().some(s=>s.id===state.schemeId&&s.courseId===cid()))state.schemeId=(offFor(cid())||{}).id||'';
 state.presetId=p.id;state.dirty=false;
 if(state.logo&&!logoPNG)rasterizeLogo(state.logo).then(x=>{logoPNG=x;syncUI();});
 buildChips();render();renderPresets();if(state.autoFit)fitZoom();
 toast('Applied “'+p.name+'”','ok');}
function renderPresets(){
 let list=allPresets().slice();
 if(preFilter==='mine')list=list.filter(p=>!p.factory);
 else if(preFilter==='factory')list=list.filter(p=>p.factory);
 else if(preFilter==='g9')list=list.filter(p=>(p.cfg.grade||p.grade)===9);
 else if(preFilter==='g10')list=list.filter(p=>(p.cfg.grade||p.grade)===10);
 else if(preFilter==='course')list=list.filter(p=>{const g=p.cfg&&p.cfg.grade||p.grade||9,sid=p.cfg&&p.cfg.sid||p.sid;const course=p.courseId||(sid?`${g}-${sid}`:(p.factory?null:`${g}-${DEFAULT_SUBJECT}`));return !course||course===cid();});
 if(preQuery.trim()){const q=preQuery.toLowerCase();list=list.filter(p=>(p.name+' '+(p.note||'')).toLowerCase().includes(q));}
 if(preSort==='name')list.sort((a,b)=>a.name.localeCompare(b.name));
 else if(preSort==='marks')list.sort((a,b)=>presetMarks(b)-presetMarks(a));
 else if(preSort==='grade')list.sort((a,b)=>(a.cfg.grade||a.grade)-(b.cfg.grade||b.grade));
 else list.sort((a,b)=>(b.created||0)-(a.created||0));
 $('preEm').textContent=presets.length+' saved';
 const hf=FACTORY.filter(p=>hiddenF.includes(p.id)).length;$('preRestoreF').classList.toggle('hidden',!hf);$('preRestoreF').textContent='Restore '+hf+' system preset'+(hf>1?'s':'');
 $('preList').innerHTML=list.length?list.map(p=>{const g=p.cfg.grade||p.grade||state.grade,sel=preSel.has(p.id);
  return `<div class="pcard ${state.presetId===p.id?'active':''} ${sel?'sel':''}" data-pid="${p.id}">
   <div class="pr1"><div class="pchk ${sel?'on':''}" data-chk="${p.id}">✓</div><div class="pn">${esc(p.name)}</div><span class="pbadge ${p.factory?'f':'u'}">${p.factory?'Factory':'Mine'}</span><span class="pbadge g${g}">${GRADE_LABELS[g]||g}</span></div>
   <div class="pmeta"><span><b>${presetMarks(p)}</b> marks</span><span>${p.scopes.length}/${ALLSC.length} groups</span></div>
   ${p.note?`<div class="pnote">${esc(p.note)}</div>`:''}
   <div class="pacts"><button class="pab go" data-apply="${p.id}">Apply</button><button class="pab" data-dup="${p.id}">Copy</button><button class="pab" data-edit="${p.id}" ${p.factory?'disabled title="System presets cannot be edited — use Copy"':''}>Edit</button><button class="pab del" data-del="${p.id}" title="${p.factory?'Hide this system preset (you can bring it back)':'Delete'}">${p.factory?'Remove':'Delete'}</button></div>
  </div>`;}).join(''):'<div class="empty">No presets match.<br>Save your current setup to start your library.</div>';
 $('bulkBar').classList.toggle('hidden',preSel.size===0);
 $('bulkTxt').textContent=preSel.size+' selected';}
function deletePresets(ids){
 const mine=presets.filter(p=>ids.includes(p.id)),fac=FACTORY.filter(p=>ids.includes(p.id)&&!hiddenF.includes(p.id));
 if(!mine.length&&!fac.length){toast('Nothing to remove.','warn');return;}
 const undo={mine:mine.map(p=>({p,i:presets.indexOf(p)})),fac:fac.map(p=>p.id)};
 presets=presets.filter(p=>!ids.includes(p.id));hiddenF=hiddenF.concat(undo.fac);ids.forEach(i=>preSel.delete(i));
 if(ids.includes(state.presetId)){state.presetId='';state.dirty=true;}
 savePresets();saveHidden();renderPresets();paintLedger();
 const n=mine.length+fac.length;
 toast(n+' preset'+(n>1?'s':'')+' removed','mag',{label:'Undo',fn(){
  undo.mine.sort((a,b)=>a.i-b.i).forEach(({p,i})=>presets.splice(Math.min(i,presets.length),0,p));hiddenF=hiddenF.filter(id=>!undo.fac.includes(id));
  savePresets();saveHidden();renderPresets();paintLedger();toast('Restored','ok');}});}
$('preRestoreF').addEventListener('click',()=>{hiddenF=[];saveHidden();renderPresets();toast('System presets restored','ok');});

/* ══════════ RENDER ══════════ */
const sheet=$('sheet'),wrap=$('sheetwrap'),stage=$('stage'),qtools=$('qtools');

;
/* === app-render.js === */
"use strict";
function syncSheetFrame(pg){sheet.style.width=(pg.w*96/72)+'px';if(state.sheetMode==='two'){sheet.style.padding='0';sheet.style.background='transparent';sheet.style.boxShadow='none';}else{sheet.style.padding=(state.margin*96/72)+'px';sheet.style.background='';sheet.style.boxShadow='';}}
function render(){plan=makePlan();built=build();const pg=PAGES[state.page];
 syncSheetFrame(pg);
 sheet.innerHTML=paperInner(state,'screen');
 typesetMathIn(sheet);
 bindSheet();applyZoom();paintLedger();syncUI();updatePrint();saveState();}
function repaint(){plan=makePlan();built=build();const pg=PAGES[state.page];
 syncSheetFrame(pg);sheet.innerHTML=paperInner(state,'screen');
 typesetMathIn(sheet);
 bindSheet();applyZoom();paintLedger();updatePrint();saveState();}
function applyZoom(){const z=state.zoom/100;sheet.style.setProperty('--z',`scale(${z})`);
 sheet.style.transform=`scale(${z})`;wrap.style.width=(sheet.offsetWidth*z)+'px';wrap.style.height=(sheet.offsetHeight*z)+'px';positionTools();}
function fitZoom(){if(stage.clientWidth<50)return;const z=clamp(Math.floor((stage.clientWidth-40)/sheet.offsetWidth*100),40,150);
 state.zoom=z;state.autoFit=true;$('rZm').value=z;$('vZm').textContent=z+'%';applyZoom();}
const pStyle=document.createElement('style');document.head.appendChild(pStyle);
function updatePrint(){const pg=PAGES[state.page];pStyle.textContent=`@media print{@page{size:${pg.w}pt ${pg.h}pt;margin:${state.margin}pt;}}`;}
function markDirty(){if(state.presetId)state.dirty=true;}
function bindSheet(){
 sheet.querySelectorAll('[data-slot]').forEach(t=>t.addEventListener('click',e=>{
  if(!state.qTools)return;e.stopPropagation();
  activeSlot=(activeSlot===t.dataset.slot)?null:t.dataset.slot;highlight();}));
 const hd=$('omrHandle');if(hd)hd.addEventListener('pointerdown',startOmrDrag);}
function highlight(){
 sheet.querySelectorAll('tr.qsel').forEach(t=>t.classList.remove('qsel'));
 if(!activeSlot||!state.qTools){qtools.classList.remove('show');return;}
 sheet.querySelectorAll(`[data-slot="${activeSlot}"]`).forEach(r=>r.classList.add('qsel'));
 const s=slotMap[activeSlot];if(!s){qtools.classList.remove('show');return;}
 $('qtl').textContent=s.label+' · Ch '+s.ch+(s.ch!==s.planCh?' ↔':'');
 qtools.querySelector('[data-a=pin]').classList.toggle('act-on',!!overrides[activeSlot]);
 qtools.classList.add('show');positionTools();}
function positionTools(){
 if(!activeSlot||!qtools.classList.contains('show'))return;
 const t=sheet.querySelector(`[data-slot="${activeSlot}"]`);if(!t)return;
 const r=t.getBoundingClientRect(),w=wrap.getBoundingClientRect(),tw2=qtools.offsetWidth||150;
 let x=r.right-w.left-tw2-6,y=r.top-w.top+3;
 x=clamp(x,4,Math.max(4,w.width-tw2-4));y=clamp(y,4,Math.max(4,w.height-38));
 qtools.style.left=x+'px';qtools.style.top=y+'px';}
function randomReplace(key){
 const s=slotMap[key];if(!s)return;const cur=qById(s),other=usedElsewhere(key);
 const cands=pool(s.type,s.planCh).filter(q=>(!cur||q.id!==cur.id)&&(!state.noDup||!other.has(q.id)));
 if(!cands.length){toast('No other '+s.type+' question in Chapter '+s.planCh+'. Use ☰ to browse all chapters.','warn');return;}
 overrides[key]=cands[Math.floor(Math.random()*cands.length)].id;
 delete sticky[key];markDirty();repaint();flash(key);
 toast(s.label+' replaced from Chapter '+s.planCh,'mag');}
function flash(key){requestAnimationFrame(()=>{sheet.querySelectorAll(`[data-slot="${key}"]`).forEach(r=>{r.classList.add('qflash');setTimeout(()=>r.classList.remove('qflash'),1000);});});}
function togglePin(key){
 const s=slotMap[key];if(!s)return;
 if(overrides[key]){sticky[key]=overrides[key];delete overrides[key];toast(s.label+' released','info');}
 else{const q=qById(s);if(!q)return;overrides[key]=q.id;delete sticky[key];toast(s.label+' pinned — survives every shuffle','ok');}
 markDirty();repaint();highlight();}
qtools.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||!activeSlot)return;e.stopPropagation();
 if(b.dataset.a==='rand')randomReplace(activeSlot);
 else if(b.dataset.a==='pin')togglePin(activeSlot);
 else openPicker(activeSlot);});
document.addEventListener('click',e=>{
 if(e.target.closest('.qtools')||e.target.closest('[data-slot]')||e.target.closest('.drawer')||e.target.closest('.rail')||e.target.closest('.ledger'))return;
 if(activeSlot){activeSlot=null;highlight();}});
stage.addEventListener('scroll',()=>requestAnimationFrame(positionTools),{passive:true});

/* ══════════ OMR DRAG ══════════ */
let drag=null;
function startOmrDrag(e){e.preventDefault();e.stopPropagation();
 const ghost=document.createElement('div');ghost.className='dragghost';ghost.textContent='OMR RESPONSE PART';
 document.body.appendChild(ghost);document.body.classList.add('dragging');
 drag={ghost,zone:null};moveGhost(e.clientX,e.clientY);
 window.addEventListener('pointermove',onDragMove);window.addEventListener('pointerup',onDragUp,{once:true});}
function moveGhost(x,y){if(!drag)return;drag.ghost.style.left=x+'px';drag.ghost.style.top=(y-26)+'px';}
function onDragMove(e){if(!drag)return;moveGhost(e.clientX,e.clientY);
 drag.ghost.style.display='none';const el=document.elementFromPoint(e.clientX,e.clientY);drag.ghost.style.display='';
 const z=el&&el.closest?el.closest('.dropzone'):null;
 sheet.querySelectorAll('.dropzone').forEach(d=>d.classList.remove('over'));
 if(z){z.classList.add('over');drag.zone=z.dataset.zone;}else drag.zone=null;}
function onDragUp(){window.removeEventListener('pointermove',onDragMove);
 const z=drag&&drag.zone;if(drag){drag.ghost.remove();drag=null;}
 document.body.classList.remove('dragging');
 sheet.querySelectorAll('.dropzone').forEach(d=>d.classList.remove('over'));
 if(z&&z!==state.omrPos){state.omrPos=z;markDirty();repaint();syncUI();toast('OMR moved to '+ZLABEL[z],'mag');}}

/* ══════════ DRAWER ══════════ */
let _retFocus=null;
function openDrawer(){_retFocus=document.activeElement;const d=$('drawer');d.inert=false;d.classList.add('on');$('scrim').classList.add('on');setTimeout(()=>{const f=d.querySelector('input:not(.hidden),select,textarea,.dlist button,.dfoot button');if(f)f.focus();},80);}
function closeDrawer(){$('drawer').classList.remove('on');$('drawer').inert=true;if(_retFocus&&_retFocus.focus&&document.contains(_retFocus))_retFocus.focus();_retFocus=null;$('scrim').classList.remove('on');drawerMode=null;drawerSlot=null;schDraft=null;schEditId=null;}
$('dClose').addEventListener('click',closeDrawer);
$('scrim').addEventListener('click',closeDrawer);
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if($('drawer').classList.contains('on'))closeDrawer();else if(activeSlot){activeSlot=null;highlight();}}});
function drawerShow(kind){
 $('dSearchWrap').classList.toggle('hidden',kind!=='pick');
 $('dList').classList.toggle('hidden',kind!=='pick');
 $('dForm').classList.toggle('hidden',kind==='pick');}
function openPicker(key){
 const s=slotMap[key];if(!s)return;
 drawerMode='pick';drawerSlot=key;drawerQuery='';drawerFilter='all';drawerCh='all';drawerEx=false;
 $('dTitle').innerHTML='Choose any question<small>'+s.label+' · slot chapter '+s.planCh+' — '+B().names[s.planCh]+'</small>';
 drawerShow('pick');
 $('dSearch').value='';$('dEx').classList.remove('on');
 const b=B();
 $('dChap').innerHTML='<option value="all">All chapters — whole '+b.name+' book</option><option value="slot">Slot chapter '+s.planCh+' — '+esc(b.names[s.planCh])+'</option>'+b.chapters.map(c=>`<option value="${c}">Ch ${c} — ${esc(b.names[c])}</option>`).join('');
 $('dChap').value='all';
 document.querySelectorAll('#dFilter button').forEach(x=>x.classList.toggle('on',x.dataset.v==='all'));
 $('dFoot').innerHTML='<button id="dpRand">Random from shown</button><button class="pri" id="dpPin">'+(overrides[key]?'Release pin':'Pin current')+'</button>';
 $('dpRand').addEventListener('click',()=>{const list=pickerItems().filter(x=>!x._dis);
  if(!list.length){toast('Nothing available in this view.','warn');return;}
  const q=list[Math.floor(Math.random()*list.length)];
  overrides[key]=q.id;delete sticky[key];markDirty();const k=key;closeDrawer();repaint();flash(k);
  toast(slotMap[k].label+' ← Ch '+q.ch+' (random)','mag');});
 $('dpPin').addEventListener('click',()=>{togglePin(key);closeDrawer();});
 renderPicker();openDrawer();setTimeout(()=>$('dSearch').focus(),320);}
function pickerItems(){
 const s=slotMap[drawerSlot],b=B(),cur=qById(s),other=usedElsewhere(drawerSlot),pinned=new Set(Object.values(overrides));
 let chs=drawerCh==='all'?b.chapters.slice():drawerCh==='slot'?[s.planCh]:[+drawerCh];
 let items=[];chs.forEach(c=>{(b[s.type][c]||[]).forEach(q=>{if(q.ex&&!drawerEx)return;items.push(q);});});
 if(drawerQuery.trim()){const q=drawerQuery.toLowerCase();items=items.filter(x=>(x.en+(isBilingualCourse()?' '+x.ur:'' )).toLowerCase().includes(q));}
 if(drawerFilter==='free')items=items.filter(x=>(cur&&x.id===cur.id)||!other.has(x.id));
 if(drawerFilter==='pinned')items=items.filter(x=>pinned.has(x.id));
 return items.map(q=>Object.assign({},q,{_cur:cur&&q.id===cur.id,_dis:!(cur&&q.id===cur.id)&&state.noDup&&other.has(q.id)}));}
function renderPicker(){
 if(drawerMode!=='pick')return;
 const s=slotMap[drawerSlot],b=B(),items=pickerItems(),other=usedElsewhere(drawerSlot);
 const scope=drawerCh==='all'?'whole book':drawerCh==='slot'?('Ch '+s.planCh):('Ch '+drawerCh);
 $('dMeta').innerHTML=`<b>${items.length}</b> in ${scope} · <b>${other.size}</b> used elsewhere${drawerEx?' · <b>excluded shown</b>':''}`;
 $('dList').innerHTML=items.length?items.map(q=>{
  const cross=q.ch!==s.planCh;let opts='';
  if(s.type==='mcq')opts=`<div class="popts">${q.o.map((o,k)=>`<div class="popt ${k===q.a?'ok':''}">${'ABCD'[k]}. ${richHtml(o[0])}${figureHtml(q.of&&q.of[k],q.oa&&q.oa[k],'option')}${k===q.a?' ✓':''}</div>`).join('')}</div>`;
  return `<div class="qcard ${q._cur?'cur':''} ${q._dis?'dis':''}" data-qid="${q.id}">
   <div class="qtop"><span class="chb ${cross?'other':''}">Ch ${q.ch} · ${esc(b.names[q.ch])}</span></div>
   <div class="en">${richHtml(q.en)}${figureHtml(q.figure,q.figureAlt)}</div>${isBilingualCourse()?`<div class="ur">${richHtml(q.ur)}</div>`:''}${opts}
   <div class="pbadges">${q._cur?'<span class="pbg cur">In this slot</span>':''}${q._dis?'<span class="pbg used">Already on paper</span>':''}${q.ex?'<span class="pbg ex">ALP excluded</span>':''}${(questionTags(q).topics||[]).map(id=>'<span class="pbg">Topic: '+esc((contentConfig(q.ch).topics.find(x=>x.id===id)||{name:id}).name)+'</span>').join('')}${(questionTags(q).exercises||[]).map(id=>'<span class="pbg">Exercise: '+esc((contentConfig(q.ch).exercises.find(x=>x.id===id)||{name:id}).name)+'</span>').join('')}${overrides[drawerSlot]===q.id?'<span class="pbg cur">Pinned</span>':''}${cross&&!q._cur?'<span class="pbg used">Cross-chapter</span>':''}</div>
  </div><div class="qtag-tools"><button data-tag-topic="${q.id}" data-tag-ch="${q.ch}">Tag topic</button><button data-tag-exercise="${q.id}" data-tag-ch="${q.ch}">Tag exercise</button></div>`;}).join(''):'<div class="empty">Nothing matches this view.<br>Widen the chapter filter, clear the search, or allow excluded items.</div>';typesetMathIn($('dList'));}
$('dSearch').addEventListener('input',e=>{drawerQuery=e.target.value;renderPicker();});
$('dChap').addEventListener('change',e=>{drawerCh=e.target.value;renderPicker();});
$('dEx').addEventListener('click',()=>{drawerEx=!drawerEx;$('dEx').classList.toggle('on',drawerEx);renderPicker();
 if(drawerEx)toast('ALP-excluded questions visible — picking one is flagged in the blueprint.','warn');});
document.querySelectorAll('#dFilter button').forEach(b=>b.addEventListener('click',()=>{
 drawerFilter=b.dataset.v;document.querySelectorAll('#dFilter button').forEach(x=>x.classList.toggle('on',x===b));renderPicker();}));
$('dList').addEventListener('click',e=>{const topic=e.target.closest('[data-tag-topic]'),exercise=e.target.closest('[data-tag-exercise]');if(topic){assignQuestionTag(topic.dataset.tagTopic,+topic.dataset.tagCh,'topics');renderPicker();return;}if(exercise){assignQuestionTag(exercise.dataset.tagExercise,+exercise.dataset.tagCh,'exercises');renderPicker();return;}const c=e.target.closest('.qcard');if(!c||c.classList.contains('dis'))return;
 overrides[drawerSlot]=c.dataset.qid;delete sticky[drawerSlot];markDirty();
 const k=drawerSlot;closeDrawer();repaint();flash(k);
 const s=slotMap[k];toast(s.label+' ← Chapter '+s.ch+(s.ch!==s.planCh?' (cross-chapter)':''),'ok');});


;
/* === app-editors.js === */
"use strict";
/* ══════════ PRESET FORM ══════════ */
function openPresetForm(id){
 const p=id?presets.find(x=>x.id===id):null;
 drawerMode='preset';drawerShow('form');
 $('dTitle').innerHTML=(p?'Edit preset':'Save current setup')+'<small>Stored in this browser · applies only the groups you tick</small>';
 const scopes=p?p.scopes:ALLSC.slice(),form=$('dForm');
 form.innerHTML=`
  <div class="fld"><label>Preset name</label><input type="text" id="pfName" value="${p?esc(p.name):''}" placeholder="e.g. Monthly test — 9th — April"></div>
  <div class="fld"><label>Note (optional)</label><textarea id="pfNote" placeholder="What is this paper for?">${p?esc(p.note||''):''}</textarea></div>
  <div class="fld"><label>Groups captured</label>
   <div class="scope">${ALLSC.map(k=>`<div class="tg ${scopes.includes(k)?'on':''}" data-sc="${k}"><div><span>${SCOPES[k].label}</span><small>${SCOPES[k].keys.length} settings</small></div><div class="sw"></div></div>`).join('')}</div>
   <div class="quick" style="margin-top:8px"><button class="qb" id="scAll">Select all</button><button class="qb" id="scNone">Clear</button></div></div>
  <div class="fld"><label>Snapshot</label><div class="hint" id="pfSnap"></div></div>`;
 const upd=()=>{const sc=[...form.querySelectorAll('[data-sc].on')].map(e=>e.dataset.sc);
  $('pfSnap').innerHTML=`Class <b>${state.grade}</b> · ${plan.marks.total} marks · scheme <u>${esc(activeScheme().name)}</u> · capturing <s>${sc.length}</s> group${sc.length===1?'':'s'}.`;};
 upd();
 form.querySelectorAll('[data-sc]').forEach(el=>el.addEventListener('click',()=>{el.classList.toggle('on');upd();}));
 $('scAll').addEventListener('click',()=>{form.querySelectorAll('[data-sc]').forEach(e=>e.classList.add('on'));upd();});
 $('scNone').addEventListener('click',()=>{form.querySelectorAll('[data-sc]').forEach(e=>e.classList.remove('on'));upd();});
 $('dFoot').innerHTML=`<button id="pfCancel">Cancel</button><button class="pri" id="pfSave">${p?'Update preset':'Save preset'}</button>`;
 $('pfCancel').addEventListener('click',closeDrawer);
 $('pfSave').addEventListener('click',()=>{
  const name=$('pfName').value.trim();
  if(!name){toast('Give the preset a name first.','warn');$('pfName').focus();return;}
  const sc=[...form.querySelectorAll('[data-sc].on')].map(e=>e.dataset.sc);
  if(!sc.length){toast('Tick at least one group.','warn');return;}
  const note=$('pfNote').value.trim();
  if(p){p.name=name;p.note=note;p.scopes=sc;p.cfg=captureConfig(sc);p.grade=state.grade;p.sid=state.sid;p.courseId=cid();p.updated=Date.now();toast('Preset updated','ok');}
  else{const np={id:uid('p'),name,note,factory:false,grade:state.grade,sid:state.sid,courseId:cid(),scopes:sc,cfg:captureConfig(sc),created:Date.now(),updated:Date.now()};
   presets.unshift(np);state.presetId=np.id;state.dirty=false;toast('Saved “'+name+'”','ok');}
  savePresets();renderPresets();paintLedger();closeDrawer();});
 openDrawer();setTimeout(()=>$('pfName').focus(),320);}

/* ══════════ SCHEME EDITOR ══════════ */
function openSchemeEditor(id){
 const src=id?allSchemes().find(s=>s.id===id):null;
 schEditId=src&&!src.factory?src.id:null;
 schDraft=src?JSON.parse(JSON.stringify(src)):{id:uid('s'),courseId:cid(),grade:state.grade,sid:state.sid,factory:false,name:'',note:'',
  mcq:Object.fromEntries(B().alpCh.map(c=>[c,1])),mcqMark:1,
  short:[{ch:{[B().alpCh[0]]:3,[B().alpCh[1]||B().alpCh[0]]:3},attempt:4},{ch:{},attempt:4},{ch:{},attempt:4}],shortMark:2,
  long:[[B().alpCh[0]],[B().alpCh[1]||B().alpCh[0]],[B().alpCh[2]||B().alpCh[0]]],longAttempt:2,longMark:8};
 if(!src){const chs=B().alpCh;schDraft.short=[{ch:{[chs[0]]:2,[chs[2]||chs[0]]:4},attempt:4},{ch:{[chs[1]]:1,[chs[3]||chs[1]]:2,[chs[5]||chs[1]]:3},attempt:4},{ch:{[chs[4]||chs[0]]:2,[chs[6]||chs[0]]:3,[chs[7]||chs[0]]:1},attempt:4}];}
 schDraft.courseId=cid();schDraft.grade=state.grade;schDraft.sid=state.sid;
 drawerMode='scheme';drawerShow('form');
 $('dTitle').innerHTML=(src?(src.factory?'Copy official scheme':'Edit scheme'):'New pairing scheme')+'<small>Class '+state.grade+' · '+esc(B().subject)+' · MCQ weighting · short parts · long slots</small>';
 renderSchemeForm();
 $('dFoot').innerHTML=`<button id="sfCancel">Cancel</button><button class="grn" id="sfSaveUse">Save &amp; use</button><button class="pri" id="sfSave">${schEditId?'Update':'Save'}</button>`;
 $('sfCancel').addEventListener('click',closeDrawer);
 $('sfSave').addEventListener('click',()=>saveScheme(false));
 $('sfSaveUse').addEventListener('click',()=>saveScheme(true));
 openDrawer();setTimeout(()=>{const n=$('sfName');if(n)n.focus();},320);}
function renderSchemeForm(){
 const d=schDraft,b=BOOKS[d.courseId]||B(),chs=b.chapters,t=schemeTotals(d);
 const stepper=(act,ch,val,extra)=>`<div class="stepper mini"><button data-act="${act}-" ${extra} data-ch="${ch}">−</button><b>${val}</b><button data-act="${act}+" ${extra} data-ch="${ch}">+</button></div>`;
 $('dForm').innerHTML=`
 <div class="fld"><label>Scheme name</label><input type="text" id="sfName" value="${esc(d.name)}" placeholder="e.g. School scheme · 9th · Term 1"></div>
 <div class="fld"><label>Note (optional)</label><input type="text" id="sfNote" value="${esc(d.note||'')}" placeholder="Q5 Ch1 · Q6 Ch3 · Q7 Ch6 or 9"></div>
 <div class="sx"><h5>Part I · MCQ weighting <em>${t.mcq} MCQs</em></h5>
  <div class="sxg">${chs.map(c=>`<div class="sxr"><div class="lb">Ch ${c} · ${esc(b.names[c])}</div>${stepper('mcq',c,d.mcq[c]||0,'')}</div>`).join('')}</div>
  <div class="fld" style="margin:9px 0 0"><label>Marks per MCQ</label><select data-set="mcqMark">${[1,2].map(v=>`<option value="${v}" ${d.mcqMark===v?'selected':''}>${v} mark${v>1?'s':''}</option>`).join('')}</select></div>
 </div>
 <div class="sx"><h5>Part II · Short question parts <em>${t.parts} parts</em></h5>
  ${d.short.map((p,i)=>`<div class="slot"><div class="sh"><b>Q. No. ${i+2}</b><span>${sum(p.ch)} printed · attempt ${p.attempt}</span><button class="xb" data-act="delpart" data-p="${i}">✕</button></div>
   <div class="sxg">${chs.map(c=>`<div class="sxr"><div class="lb">Ch ${c}</div>${stepper('sq',c,p.ch[c]||0,`data-p="${i}"`)}</div>`).join('')}</div>
   <div class="sxr" style="margin-top:6px"><div class="lb">Attempt out of ${sum(p.ch)||0}</div>${stepper('att',0,p.attempt,`data-p="${i}"`)}</div></div>`).join('')}
  <button class="qb" data-act="addpart" style="width:100%">+ Add short part</button>
  <div class="fld" style="margin:9px 0 0"><label>Marks per short answer</label><select data-set="shortMark">${[1,2,3].map(v=>`<option value="${v}" ${d.shortMark===v?'selected':''}>${v} marks</option>`).join('')}</select></div>
 </div>
 <div class="sx"><h5>Part III · Long question slots <em>${d.long.length} printed</em></h5>
  <div class="hint" style="margin-bottom:8px">Select <b>one</b> chapter for a compulsory question, or <s>two or more</s> for an “either / or” question.</div>
  ${d.long.map((allow,i)=>`<div class="slot"><div class="sh"><b>Q. No. ${2+d.short.length+i}</b><span>${allow.length>1?'either '+allow.join(' / '):allow.length?'Ch '+allow[0]+' compulsory':'no chapter selected'}</span><button class="xb" data-act="delslot" data-s="${i}">✕</button></div>
   <div class="cchips">${chs.map(c=>`<button class="cchip ${allow.includes(c)?'on':''}" data-act="longtog" data-s="${i}" data-ch="${c}">Ch ${c}</button>`).join('')}</div></div>`).join('')}
  <button class="qb" data-act="addslot" style="width:100%">+ Add long slot</button>
  <div class="row2" style="margin-top:9px">
   <div class="fld" style="margin:0"><label>Attempt</label><select data-set="longAttempt">${Array.from({length:Math.max(1,d.long.length)},(_,i)=>i+1).map(v=>`<option value="${v}" ${d.longAttempt===v?'selected':''}>${v}</option>`).join('')}</select></div>
   <div class="fld" style="margin:0"><label>Marks each</label><select data-set="longMark">${[4,6,8,10].map(v=>`<option value="${v}" ${d.longMark===v?'selected':''}>${v} marks</option>`).join('')}</select></div>
  </div>
 </div>
 <div class="tot"><div>MCQ <b>${t.mcq*d.mcqMark}</b></div><div>Short <b>${t.short}</b></div><div>Long <b>${t.long}</b></div><div>Paper total <b>${t.total}</b></div></div>`;}
$('dForm').addEventListener('click',e=>{
 if(drawerMode!=='scheme'||!schDraft)return;
 const btn=e.target.closest('[data-act]');if(!btn)return;
 const act=btn.dataset.act,d=schDraft,ch=+btn.dataset.ch,p=+btn.dataset.p,s=+btn.dataset.s;
 const maxCh=8;
 if(act==='mcq+'||act==='mcq-'){d.mcq[ch]=clamp((d.mcq[ch]||0)+(act==='mcq+'?1:-1),0,maxCh);}
 else if(act==='sq+'||act==='sq-'){const o=d.short[p];if(!o)return;o.ch[ch]=clamp((o.ch[ch]||0)+(act==='sq+'?1:-1),0,maxCh);if(!o.ch[ch])delete o.ch[ch];o.attempt=clamp(o.attempt,1,Math.max(1,sum(o.ch)));}
 else if(act==='att+'||act==='att-'){const o=d.short[p];if(!o)return;o.attempt=clamp(o.attempt+(act==='att+'?1:-1),1,Math.max(1,sum(o.ch)));}
 else if(act==='delpart'){if(d.short.length<=1){toast('Keep at least one short part.','warn');return;}d.short.splice(p,1);}
 else if(act==='addpart'){if(d.short.length>=4){toast('Maximum four short parts.','warn');return;}d.short.push({ch:{},attempt:4});}
 else if(act==='longtog'){const a=d.long[s];if(!a)return;const i=a.indexOf(ch);if(i>-1)a.splice(i,1);else a.push(ch);a.sort((x,y)=>x-y);d.longAttempt=clamp(d.longAttempt,1,d.long.length);}
 else if(act==='delslot'){if(d.long.length<=1){toast('Keep at least one long question.','warn');return;}d.long.splice(s,1);d.longAttempt=clamp(d.longAttempt,1,d.long.length);}
 else if(act==='addslot'){if(d.long.length>=6){toast('Maximum six long questions.','warn');return;}d.long.push([(BOOKS[d.courseId]||B()).alpCh[0]]);}
 else return;
 renderSchemeForm();});
$('dForm').addEventListener('change',e=>{
 if(drawerMode!=='scheme'||!schDraft)return;
 const sel=e.target.closest('[data-set]');if(!sel)return;
 schDraft[sel.dataset.set]=+sel.value;
 if(sel.dataset.set==='longAttempt')schDraft.longAttempt=clamp(schDraft.longAttempt,1,schDraft.long.length);
 renderSchemeForm();});
$('dForm').addEventListener('input',e=>{
 if(drawerMode!=='scheme'||!schDraft)return;
 if(e.target.id==='sfName')schDraft.name=e.target.value;
 if(e.target.id==='sfNote')schDraft.note=e.target.value;});
function saveScheme(andUse){
 const d=schDraft;if(!d)return;
 d.name=(d.name||'').trim();
 if(!d.name){toast('Give the scheme a name.','warn');const n=$('sfName');if(n)n.focus();return;}
 if(sum(d.mcq)<1){toast('Give at least one chapter an MCQ weight.','warn');return;}
 if(d.short.some(p=>sum(p.ch)<1)){toast('Every short part needs at least one printed question.','warn');return;}
 if(d.long.some(a=>!a.length)){toast('Every long slot needs at least one chapter.','warn');return;}
 d.longAttempt=clamp(d.longAttempt,1,d.long.length);
 d.short.forEach(p=>p.attempt=clamp(p.attempt,1,sum(p.ch)));
 d.courseId=cid();d.grade=state.grade;d.sid=state.sid;d.updated=Date.now();
 if(schEditId){const i=customSchemes.findIndex(s=>s.id===schEditId);
  if(i>-1){d.id=schEditId;customSchemes[i]=JSON.parse(JSON.stringify(d));}
  toast('Scheme “'+d.name+'” updated','ok');}
 else{d.id=uid('s');d.factory=false;d.created=Date.now();customSchemes.unshift(JSON.parse(JSON.stringify(d)));
  toast('Scheme “'+d.name+'” created','ok');}
 saveSchemes();
 const id=d.id;closeDrawer();
 if(andUse)useScheme(id);else{syncUI();paintLedger();}
}


;
/* === app-interface.js === */
"use strict";
/* ══════════ TOAST / EXPORT ══════════ */
const ICO={ok:CHK,info:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.6v.1"/></svg>',warn:WRN,err:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>',mag:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 3l2.6 5.6 6.4.8-4.7 4.3 1.2 6.3L12 17l-5.5 3 1.2-6.3L3 9.4l6.4-.8z"/></svg>'};
function toast(m,k,action){k=k||'info';const e=document.createElement('div');e.className='toast '+k;
 e.innerHTML=ICO[k]+'<span>'+esc(m)+'</span>';
 if(action){const b=document.createElement('button');b.textContent=action.label;
  b.addEventListener('click',()=>{action.fn();e.classList.add('out');setTimeout(()=>e.remove(),320);});e.appendChild(b);}
 $('toasts').appendChild(e);
 setTimeout(()=>{e.classList.add('out');setTimeout(()=>e.remove(),320);},action?6000:2900);}
function download(bytes,name,mime){const blob=new Blob([bytes],{type:mime}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);}
function stamp(title,sub){$('stampTitle').textContent=title;$('stampSub').textContent=sub;
 const st=$('stamp');st.classList.remove('go');void st.offsetWidth;st.classList.add('go');}
async function doDocx(){
 if(exporting)return;exporting=true;
 if(urduOn()&&!fontInstalled(state.urFont))toast('“'+state.urFont+'” isn’t installed on this device. Word will substitute another font unless it is installed where you open the file.','warn');
 $('busy').classList.add('on');$('topExp').disabled=true;$('btnExp').disabled=true;
 await new Promise(r=>setTimeout(r,60));
 try{
  if(state.logo&&!logoPNG)logoPNG=await rasterizeLogo(state.logo);
  await preloadFigureAssets();
  await preloadMathAssets();
  const bytes=await zipPack(buildDocx(true));
  const name=`${B().code}-${state.alp?'ALP':'FULL'}-V${String(state.seed).padStart(2,'0')}-${plan.marks.total}marks.docx`;
  download(bytes,name,'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  stamp('DOCX SAVED',`${(bytes.length/1024).toFixed(0)} KB · ${plan.marks.total} MARKS`);
  toast('Saved '+name,'ok');
 }catch(err){console.error(err);toast('Could not build .docx — '+(err&&err.message?err.message:'unexpected export error'),'err');}
 finally{$('busy').classList.remove('on');$('topExp').disabled=false;$('btnExp').disabled=false;exporting=false;}}
function doDoc(){if(!confirm('This exports the legacy HTML-based .doc format. It is less reliable than the modern .docx export. Continue?'))return;download('\ufeff'+wordHtmlDoc(state),`${B().code}-V${String(state.seed).padStart(2,'0')}.doc`,'application/msword;charset=utf-8');
 stamp('DOC SAVED',`${plan.marks.total} MARKS · LEGACY`);toast('Legacy .doc saved','info');}

/* ══════════ UI SYNC ══════════ */

function contentItemId(label,prefix){return prefix+'-'+String(label).toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,48);}
function addContentCatalogItem(c,kind,label){const course=cid();state.contentCatalogCustom=state.contentCatalogCustom||{};state.contentCatalogCustom[course]=state.contentCatalogCustom[course]||{};state.contentCatalogCustom[course][c]=state.contentCatalogCustom[course][c]||{topics:[],exercises:[]};const list=state.contentCatalogCustom[course][c][kind],id=contentItemId(label,kind==='topics'?'topic':'exercise');if(!list.some(x=>x.id===id))list.push({id,name:String(label).trim().slice(0,100)});return id;}
function buildContentSelection(){
 const b=B(),course=cid(),openCh=new Set(Array.from($('contentPick').querySelectorAll('details[open]')).map(x=>x.dataset.contentCh)),activeTabs=new Map(Array.from($('contentPick').querySelectorAll('.content-tab.active')).map(x=>[x.dataset.contentCh,x.dataset.contentTab]));
 state.contentSelection=state.contentSelection||{};state.contentSelection[course]=state.contentSelection[course]||{};
 const chapters=b.chapters.map(c=>{
  const topics=contentConfig(c).topics,exercises=contentConfig(c).exercises,sel=state.contentSelection[course][c]||{topics:[],exercises:[],includeUntagged:false};
  state.contentSelection[course][c]=sel;
  const selectedT=(sel.topics||[]).length,selectedE=(sel.exercises||[]).length,selected=selectedT+selectedE,activeTab=activeTabs.get(String(c))||'topics';
  const renderItems=(kind,items)=>items.length?items.map(x=>`<label class="content-item ${state.alp&&x.alpExcluded?'is-excluded':''}"><input type="checkbox" data-content-kind="${kind}" data-content-ch="${c}" data-content-id="${esc(x.id)}" ${sel[kind].includes(x.id)?'checked':''} ${state.alp&&x.alpExcluded?'disabled title="Excluded by ALP"':''}><span class="item-name">${esc(x.name)}</span>${x.alpExcluded?`<span class="alp-pill" title="Excluded in ALP">ALP</span>`:''}<button type="button" class="alp-override" data-content-alp="${kind}" data-content-ch="${c}" data-content-id="${esc(x.id)}" title="Toggle ALP inclusion">${x.alpExcluded?'Allow':'Exclude'}</button></label>`).join(''):'<div class="content-empty">No items added yet. Use “Add” to create your list.</div>';
  return `<details class="content-ch" data-content-ch="${c}" ${openCh.has(String(c))?'open':''}>
   <summary><span class="chapter-summary"><b>Chapter ${c}</b><strong>${esc(b.names[c])}</strong></span><span class="chapter-meta"><span class="selection-count ${selected?'has-selection':''}">${selected?selected+' selected':'Not filtered'}</span><span class="chapter-count">${topics.length} topics · ${exercises.length} exercises</span><span class="chapter-chevron">⌄</span></span></summary>
   <div class="content-body"><div class="content-tabs" role="tablist"><button type="button" class="content-tab ${activeTab==='topics'?'active':''}" data-content-tab="topics" data-content-ch="${c}">Topics <span>${selectedT}/${topics.length}</span></button><button type="button" class="content-tab ${activeTab==='exercises'?'active':''}" data-content-tab="exercises" data-content-ch="${c}">Exercises <span>${selectedE}/${exercises.length}</span></button></div>
    <div class="content-panel ${activeTab==='topics'?'active':''}" data-content-panel="topics" data-content-ch="${c}"><div class="panel-actions"><button class="qb" data-content-all="topics" data-content-ch="${c}">Select all</button><button class="qb" data-content-none="topics" data-content-ch="${c}">Clear</button><button class="qb" data-content-add="topics" data-content-ch="${c}">＋ Add topic</button></div>${renderItems('topics',topics)}</div>
    <div class="content-panel ${activeTab==='exercises'?'active':''}" data-content-panel="exercises" data-content-ch="${c}"><div class="panel-actions"><button class="qb" data-content-all="exercises" data-content-ch="${c}">Select all</button><button class="qb" data-content-none="exercises" data-content-ch="${c}">Clear</button><button class="qb" data-content-add="exercises" data-content-ch="${c}">＋ Add exercise</button></div>${renderItems('exercises',exercises)}</div>
    <div class="content-footer"><label class="untagged-opt"><input type="checkbox" data-content-untagged="${c}" ${sel.includeUntagged===true?'checked':''}><span>Include questions without tags</span></label><button class="qb clear-chapter" data-content-clear="${c}">Reset chapter selection</button></div>
   </div></details>`;
 }).join('');
 $('contentPick').innerHTML=`<div class="content-title"><div class="content-heading"><div class="content-heading-icon">☷</div><div><b>Choose topics & exercises</b><small>Filter a chapter to the exact content you want. Chapters stay selected above.</small></div></div><button class="qb export-tags" data-content-export>Export tags</button></div><div class="content-list">${chapters}</div>`;
 $('contentPick').querySelectorAll('[data-content-tab]').forEach(x=>x.addEventListener('click',()=>{const c=x.dataset.contentCh,kind=x.dataset.contentTab,details=x.closest('details');details.querySelectorAll('[data-content-tab]').forEach(t=>t.classList.toggle('active',t===x));details.querySelectorAll('[data-content-panel]').forEach(panel=>panel.classList.toggle('active',panel.dataset.contentPanel===kind));}));
 $('contentPick').querySelectorAll('[data-content-kind]').forEach(x=>x.addEventListener('change',()=>{const c=+x.dataset.contentCh,sel=state.contentSelection[course][c],arr=sel[x.dataset.contentKind],id=x.dataset.contentId;if(x.checked){if(!arr.includes(id))arr.push(id);}else sel[x.dataset.contentKind]=arr.filter(v=>v!==id);markDirty();render();}));
 $('contentPick').querySelectorAll('[data-content-untagged]').forEach(x=>x.addEventListener('change',()=>{state.contentSelection[course][+x.dataset.contentUntagged].includeUntagged=x.checked;markDirty();render();}));
 $('contentPick').querySelectorAll('[data-content-add]').forEach(x=>x.addEventListener('click',()=>{const label=prompt('Name this '+(x.dataset.contentAdd==='topics'?'topic':'exercise')+' in Chapter '+x.dataset.contentCh);if(!label||!label.trim())return;addContentCatalogItem(+x.dataset.contentCh,x.dataset.contentAdd,label);markDirty();render();}));
 $('contentPick').querySelector('[data-content-export]').addEventListener('click',()=>{const out={courseId:course,contentCatalog:{},questionContent:JSON.parse(JSON.stringify(b.questionContent||{}))};b.chapters.forEach(c=>{const cat=contentConfig(c);if(cat.topics.length||cat.exercises.length)out.contentCatalog[c]={topics:cat.topics,exercises:cat.exercises};});const tags=(state.questionTags||{})[course]||{};Object.keys(tags).forEach(qid=>{const q=[...b.chapters.flatMap(c=>[...(b.mcq[c]||[]),...(b.short[c]||[]),...(b.long[c]||[])])].find(x=>x.id===qid);if(!q)return;const c=String(q.ch),type=(b.mcq[c]||[]).some(x=>x.id===qid)?'mcq':(b.short[c]||[]).some(x=>x.id===qid)?'short':'long';out.questionContent[c]=out.questionContent[c]||{};out.questionContent[c][type]=out.questionContent[c][type]||{};out.questionContent[c][type][qid]=tags[qid];});download(JSON.stringify(out,null,2),course+'-content-tags.json','application/json');toast('Topic/exercise metadata exported for '+course,'ok');});
 $('contentPick').querySelectorAll('[data-content-alp]').forEach(x=>x.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const course=cid(),ch=x.dataset.contentCh,kind=x.dataset.contentAlp,id=x.dataset.contentId;state.contentExcludedOverrides=state.contentExcludedOverrides||{};state.contentExcludedOverrides[course]=state.contentExcludedOverrides[course]||{};state.contentExcludedOverrides[course][ch]=state.contentExcludedOverrides[course][ch]||{topics:{},exercises:{}};const o=state.contentExcludedOverrides[course][ch][kind],cur=contentConfig(+ch)[kind].find(it=>it.id===id);o[id]=!(cur&&cur.alpExcluded);const sel=state.contentSelection[course][ch];if(o[id])sel[kind]=sel[kind].filter(v=>v!==id);markDirty();render();}));
 $('contentPick').querySelectorAll('[data-content-all]').forEach(x=>x.addEventListener('click',()=>{const c=+x.dataset.contentCh,kind=x.dataset.contentAll,cat=contentConfig(c),sel=state.contentSelection[course][c];sel[kind]=cat[kind].filter(it=>!(state.alp&&it.alpExcluded)).map(it=>it.id);markDirty();render();}));
 $('contentPick').querySelectorAll('[data-content-none]').forEach(x=>x.addEventListener('click',()=>{state.contentSelection[course][+x.dataset.contentCh][x.dataset.contentNone]=[];markDirty();render();}));
 $('contentPick').querySelectorAll('[data-content-clear]').forEach(x=>x.addEventListener('click',()=>{state.contentSelection[course][+x.dataset.contentClear]={topics:[],exercises:[],includeUntagged:false};markDirty();render();}));
}
function assignQuestionTag(qid,ch,kind){const cat=contentConfig(+ch)[kind];const choices=cat.map(x=>x.name+' ['+x.id+']').join('\n');let label=prompt('Enter a '+(kind==='topics'?'topic':'exercise')+' name for this question. Existing items: '+(choices||'none'));if(!label||!label.trim())return;const existing=cat.find(x=>x.name.toLowerCase()===label.trim().toLowerCase()),id=existing?existing.id:addContentCatalogItem(+ch,kind,label);state.questionTags=state.questionTags||{};state.questionTags[cid()]=state.questionTags[cid()]||{};state.questionTags[cid()][qid]=state.questionTags[cid()][qid]||{topics:[],exercises:[]};const tags=state.questionTags[cid()][qid][kind];if(!tags.includes(id))tags.push(id);markDirty();buildContentSelection();toast('Question tagged: '+label,'ok');}

function buildChips(){
 const b=B();
 $('chGrid').innerHTML=b.chapters.slice().sort((a,b)=>a-b).map(c=>{const k=caps(c);
  return `<div class="chip" data-ch="${c}" data-lock="${state.alp&&B().alpEx.includes(c)?'ALP':'—'}"><b>${c}</b><small>${b.names[c]}</small><span class="cap">${k.m}·${k.s}·${k.l}</span></div>`;}).join('');
 $('chGrid').querySelectorAll('.chip').forEach(el=>el.addEventListener('click',()=>{
  const c=+el.dataset.ch,b2=B();
  if(!b2.chapters.includes(c)){toast('Chapter '+c+' was not supplied for Class '+state.grade+'.','warn');return;}
  if(state.alp&&B().alpEx.includes(c)){toast('Chapter '+c+' — '+(b2.names[c]||'')+' is fully excluded by ALP. Turn ALP off to use it.','warn');return;}
  const i=state.chapters.indexOf(c);
  if(i>-1){if(activeCh().length<=1){toast('Keep at least one chapter in the paper.','warn');return;}state.chapters.splice(i,1);}
  else state.chapters.push(c);
  markDirty();render();}));}
function buildAttempts(){
 $('attGrid').innerHTML=Array.from({length:state.shortParts},(_,i)=>
  `<div class="attrow"><div class="al">Part ${i+1} → <em>${state.shortAttempts[i]*state.shortMark} marks</em></div>
   <div class="stepper" data-att="${i}"><button data-d="-1">−</button><b>${state.shortAttempts[i]}</b><button data-d="1">+</button></div></div>`).join('');}
function buildLongSrc(){
 const first=longQ0(),b=B();
 if(plan.groupMode){
  $('longSrc').innerHTML=plan.longGroups.map(g=>g.questions.map(q=>q.parts.map(pt=>`<div class="attrow"><div class="al">Q.${q.no} (${pt.label}) <em>${pt.marks} marks · ${pt.candidates.length>1?'choose chapter':'fixed chapter'}</em></div>
   <select data-long-key="${pt.key}" style="width:170px;flex:none;height:28px;font-size:11px" ${pt.candidates.length<2?'disabled':''}>
   ${pt.candidates.map(c=>`<option value="${c}" ${c===pt.chapter?'selected':''}>Ch ${c} — ${esc(b.names[c]||'')}</option>`).join('')}
   </select></div>`).join('')).join('')).join('');
  $('vLongSrc').textContent=plan.longGroups.flatMap(g=>g.questions.flatMap(q=>q.parts.map(p=>`${q.no}(${p.label}): Ch ${p.chapter}`))).join(' · ');
  $('longSrc').querySelectorAll('[data-long-key]').forEach(sel=>sel.addEventListener('change',()=>{
   state.longPick[sel.dataset.longKey]=+sel.value;markDirty();render();toast('Long-question part will print from Chapter '+sel.value,'ok');}));
  return;
 }
 $('longSrc').innerHTML=Array.from({length:state.longPrinted},(_,i)=>{
  const sl=plan.slots[i%plan.slots.length]||{allow:[],av:[]},cur=plan.longChs[i],opts=sl.allow.length?sl.allow:sl.av;
  return `<div class="attrow"><div class="al">Q.${first+i} <em>${opts.length>1?'either':'fixed'}</em></div>
   <select data-long="${i}" style="width:150px;flex:none;height:28px;font-size:11px" ${opts.length<2?'disabled':''}>
   ${opts.map(c=>`<option value="${c}" ${c===cur?'selected':''}>Ch ${c} — ${esc(b.names[c]||'')}</option>`).join('')}
   </select></div>`;}).join('');
 $('vLongSrc').textContent=plan.longChs.slice(0,state.longPrinted).join(' · ');
 $('longSrc').querySelectorAll('[data-long]').forEach(sel=>sel.addEventListener('change',()=>{
  state.longPick[+sel.dataset.long]=+sel.value;markDirty();render();
  toast('Q.'+(first+ +sel.dataset.long)+' will print from Chapter '+sel.value,'ok');}));}
let coursePickerGrade=DEF.grade;const COURSE_GRADES=[...new Set(PP_COURSES.map(c=>c.classNo))].sort((a,b)=>a-b);let coursePickerGroup='all';const GROUPS=(typeof PP_GROUPS!=='undefined'&&Array.isArray(PP_GROUPS))?PP_GROUPS:[];const gradeGroups=grade=>GROUPS.filter(g=>PP_COURSES.some(c=>c.classNo===grade&&(c.groups||[]).includes(g.id)));const COURSE_SUBJECTS=grade=>PP_COURSES.filter(c=>c.classNo===grade&&(coursePickerGroup==='all'||!gradeGroups(grade).some(g=>g.id===coursePickerGroup)||(c.groups||[]).includes(coursePickerGroup))).map(c=>c.subjectId);const COURSE_CLASS_LABEL=g=>PP_COURSES.find(c=>c.classNo===g)?.classLabel||String(g);const SUBJECT_ICON={computer:'CS',maths:'∑',physics:'Φ',chemistry:'⚗',biology:'BIO'};
function buildCourseUI(){
 $('gradeCard').innerHTML=COURSE_GRADES.map(g=>`<button type="button" data-grade="${g}"><span class="grade-number">${g}</span><span class="grade-name">${GRADE_LABELS[g]}</span><span class="grade-check">✓</span></button>`).join('');
 $('gradeCard').addEventListener('click',e=>{const b=e.target.closest('[data-grade]');if(!b)return;coursePickerGrade=+b.dataset.grade;paintCourseUI();});
 $('groupBar').addEventListener('click',e=>{const b=e.target.closest('[data-group]');if(!b)return;coursePickerGroup=b.dataset.group;paintCourseUI();});
 $('courseGrid').addEventListener('click',e=>{const b=e.target.closest('[data-course]');if(!b||b.disabled)return;setCourse(b.dataset.course);});paintCourseUI();
}
function paintCourseUI(){
 if(!$('gradeCard')||!$('courseGrid'))return;
 $('gradeCard').querySelectorAll('[data-grade]').forEach(b=>b.classList.toggle('on',+b.dataset.grade===coursePickerGrade));
 const gg=gradeGroups(coursePickerGrade),bar=$('groupBar');if(coursePickerGroup!=='all'&&!gg.some(g=>g.id===coursePickerGroup))coursePickerGroup='all';
 if(bar){bar.classList.toggle('hidden',!gg.length);bar.innerHTML=gg.length?[{id:'all',label:'All subjects'}].concat(gg).map(g=>`<button type="button" class="chip${g.id===coursePickerGroup?' on':''}" data-group="${esc(g.id)}" aria-pressed="${g.id===coursePickerGroup}">${esc(g.label)}</button>`).join(''):'';}
 $('courseGrid').innerHTML=COURSE_SUBJECTS(coursePickerGrade).map(sid=>{const id=`${coursePickerGrade}-${sid}`,b=BOOKS[id],available=!!(b&&b.hasQuestions),active=id===cid();
  return `<button type="button" data-course="${id}" class="${active?'on':''} ${available?'available':'coming'}" ${available?'':'disabled'}><span class="subject-symbol">${SUBJECT_ICON[sid]||sid.slice(0,2).toUpperCase()}</span><span class="subject-info"><b>${SUBJECT_LABELS[sid]}</b><small>${available?b.questionCount+' questions available':'Question bank coming soon'}</small></span><span class="subject-state">${active?'✓ Selected':available?'Open':'Soon'}</span></button>`;
 }).join('');
 const current=BOOKS[cid()];$('selectedCourse').innerHTML=current?`<span class="selected-check">✓</span><span><small>Current paper course</small><b>${current.name} · ${current.subject}</b></span>`:'';
}
function setCourse(id){
 const b=BOOKS[id];if(!b||!b.hasQuestions){toast('Questions have not been added for this course yet.','info');return;}
 if(id===cid())return;
 state.grade=b.grade;state.sid=b.sid;state.klass=b.classLabel;state.subject=b.subject;state.subjectUr=b.subjectUr;
 state.chapters=b.alpCh.slice();state.schemeId=(offFor(id)||{}).id||'';state.timeObj=0;state.timeSubj=0;state.longPick={};overrides={};sticky={};activeSlot=null;
 coursePickerGrade=b.grade;applySchemeCounts(true);state.presetId='';state.dirty=true;
 paintCourseUI();buildChips();render();renderPresets();if(state.autoFit)fitZoom();
 toast(`${b.name} · ${b.subject} course loaded`,'ok');
}
function syncUI(){
 const b=B(),sch=activeScheme(),t=schemeTotals(sch);buildContentSelection();
 paintCourseUI();
 $('bookEm').textContent=b.questionCount+' questions · '+b.chapters.length+' chapters';
 $('alpCard').classList.toggle('off',!state.alp);$('alpCard').setAttribute('aria-checked',!!state.alp);
 $('alpTitle').textContent=state.alp?'ALP SMART SYLLABUS':'FULL TEXTBOOK';
 $('alpSub').textContent=state.alp?'Class '+state.grade+' · '+SUBJECT_LABELS[state.sid]+' · ALP rules active':'No exclusions · free chapter choice';
 $('alpDesc').textContent=state.alp?(b.alpSummary||'ALP summary has not been added yet.'):'Every supplied chapter is selectable and the complete question bank is in play.';
 $('schSel').innerHTML=courseSchemes(cid()).map(s=>`<option value="${s.id}" ${s.id===sch.id?'selected':''}>${esc(s.name)}${s.factory?'':' ★'}</option>`).join('');
 $('schEm').textContent=sch.factory?'official':'custom';
 $('schHint').innerHTML=`<b>${t.mcq}</b> MCQ · <b>${t.parts}</b> short parts × <b>${Math.max(...t.printed)}</b> printed · <b>${sch.longGroups&&sch.longGroups.length?sch.longGroups.reduce((n,g)=>n+g.questions.length,0):sch.long.length}</b> long → <b>${t.total}</b> marks.<br>Long: ${sch.longGroups&&sch.longGroups.length?sch.longGroups.map(g=>`${esc(g.name)}: ${g.questions.length} printed, attempt ${g.attempt}; parts ${g.questions[0].parts.map(p=>`(${p.label}) ${p.marks} marks`).join(' + ')}`).join(' · '):sch.long.map((a,i)=>'Q'+(2+t.parts+i)+' <u>Ch '+a.join(' or ')+'</u>').join(' · ')}`;
 $('schDel').disabled=sch.factory;$('schEdit').textContent=sch.factory?'View / copy':'Edit';
 buildContentSelection();
 $('chGrid').querySelectorAll('.chip').forEach(el=>{const c=+el.dataset.ch,has=b.chapters.includes(c),k=has?caps(c):{m:0,s:0,l:0};
  el.classList.toggle('on',has&&state.chapters.includes(c)&&!(state.alp&&B().alpEx.includes(c)));
  el.classList.toggle('lock',!has||(state.alp&&B().alpEx.includes(c)));
  el.dataset.lock=!has?'—':'ALP';el.querySelector('.cap').textContent=`${k.m}·${k.s}·${k.l}`;});
 $('chEm').textContent=plan.chs.length+' / '+b.chapters.length;
 $('sMcq').textContent=state.mcqCount;
 $('selMcqMark').value=String(state.mcqMark);$('mcqEm').textContent=plan.marks.mcq+' marks';
 $('mcqHint').innerHTML=`Scheme wants <b>${t.mcq}</b>. Bank holds <b>${plan.maxM}</b>. Spread: `+plan.chs.map(c=>`C${c}×${plan.mcqAlloc[c]||0}`).join(' · ');
 $('sParts').textContent=state.shortParts;$('sPrint').textContent=state.shortPrinted;
 $('selShortMark').value=String(state.shortMark);
 $('vAtt').textContent=state.shortAttempts.slice(0,state.shortParts).join('·');
 $('shortEm').textContent=plan.marks.short+' marks';
 const groupMode=plan.groupMode;
 $('sLongP').textContent=groupMode?sch.longGroups.reduce((n,g)=>n+g.questions.length,0):state.longPrinted;
 $('sLongA').textContent=groupMode?sch.longGroups.reduce((n,g)=>n+g.attempt,0):state.longAttempt;
 $('selLongMark').value=String(state.longMark);$('selLongMark').disabled=groupMode;$('longEm').textContent=plan.marks.long+' marks';
 document.querySelectorAll('[data-step="longPrinted"] button,[data-step="longAttempt"] button').forEach(x=>x.disabled=groupMode);
 $('longHint').innerHTML=groupMode?`<b>ALP part-based pattern.</b> ${sch.longGroups.map(g=>`${esc(g.name)}: attempt ${g.attempt} of ${g.questions.length}; each question is ${g.questions[0].parts.map(p=>`${p.marks} marks`).join(' + ')}.`).join('<br>')}<br>Part chapters can be adjusted below; marks and attempt counts follow the pairing scheme.`:`Scheme slots: <u>${sch.long.map(a=>a.join('/')).join(' · ')}</u>. Bank holds <b>${plan.maxL}</b> long questions.`;
 buildAttempts();buildLongSrc();
 $('omrEm').textContent=state.omr?ZLABEL[state.omrPos]:'off';
 $('omrSub').classList.toggle('hidden',!state.omr);
 document.querySelectorAll('#omap .oz').forEach(z=>z.classList.toggle('on',z.dataset.z===state.omrPos));
 document.querySelectorAll('#segOmrAlign button').forEach(x=>x.classList.toggle('on',x.dataset.v===state.omrAlign));
 document.querySelectorAll('#segOmrCols button').forEach(x=>x.classList.toggle('on',String(x.dataset.v)===String(state.omrCols)));
 $('rOmrW').value=state.omrWidth;$('vOmrW').textContent=state.omrWidth+'%';
 $('rGapT').value=state.omrGapT;$('vGapT').textContent=state.omrGapT+'pt';
 $('rGapB').value=state.omrGapB;$('vGapB').textContent=state.omrGapB+'pt';
 $('rBub').value=state.bubSize;$('vBub').textContent=state.bubSize+' pt';
 $('rOmrPad').value=state.omrPad;$('vOmrPad').textContent=state.omrPad+' pt';
 const np=Object.keys(overrides).length;
 $('pinN').textContent=np;
 $('pinT').textContent=np?np+' question'+(np>1?'s':'')+' locked to your choice.':'Nothing pinned — every slot re-draws on shuffle.';
 $('logoBox').classList.toggle('has',!!state.logo);
 $('logoThumb').classList.toggle('empty',!state.logo);
 $('logoThumb').innerHTML=state.logo?`<img src="${state.logo}" alt="">`:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>';
 $('logoName').textContent=state.logo?(state.logoName||'Institute logo'):'No logo uploaded';
 $('logoMeta').textContent=state.logo?(logoPNG?'Rasterised · embedded in .docx':'Will embed on export'):'PNG · JPG · SVG · embedded in .docx';
 $('rLogo').value=state.logoH;$('vLogo').textContent=state.logoH+' pt';
 document.querySelectorAll('#segLogo button').forEach(x=>x.classList.toggle('on',x.dataset.v===state.logoPos));
 document.querySelectorAll('#segInfo button').forEach(x=>x.classList.toggle('on',x.dataset.v===state.infoPos));$('infoPosWrap').classList.toggle('hidden',!(state.showName||state.showRoll||state.showSection||state.showDate!==false));
 $('iInst').value=state.institute;$('iTitle').value=state.title;$('iClass').value=state.klass;
 const bilingual=isBilingualCourse();
 $('subjectUrWrap').classList.toggle('hidden',!bilingual);
 $('urduTypeControls').classList.toggle('hidden',!bilingual);
 $('omrUrduControl').classList.toggle('hidden',!bilingual);
 $('bilingualToggle').classList.toggle('hidden',!bilingual);
 $('numWidthHint').textContent=bilingual?'English and Urdu serial columns are always the same width. No marks column.':'One serial column. No marks column.';
 $('dSearch').placeholder=bilingual?'Search English or Urdu across the whole book…':'Search English across the whole book…';
 paintTimeControls();$('selSheetMode').value=state.sheetMode||'single';$('sheetTabs').classList.toggle('hidden',state.sheetMode!=='two');document.querySelectorAll('#sheetTabs button').forEach(x=>x.classList.toggle('on',x.dataset.sheet===previewSheet));$('iSubject').value=state.subject;$('iSubjectUr').value=state.subjectUr||'';$('iDate').value=state.date;$('iSection').value=state.sectionVal;
 $('selEn').value=state.enFont;$('selUr').value=state.urFont;
 $('rEn').value=state.enSize;$('vEn').textContent=state.enSize+' pt';
 $('rUr').value=state.urSize;$('vUr').textContent=state.urSize+' pt';
 $('rLh').value=state.lineH;$('vLh').textContent=state.lineH.toFixed(2);
 $('rPad').value=state.pad;$('vPad').textContent=state.pad+' pt';
 $('rBw').value=state.borderW;$('vBw').textContent=state.borderW+' pt';
 $('rNumW').value=state.numW;$('vNumW').textContent=state.numW+'%';$('rInsSplit').value=state.insSplit;$('rInsSplit').disabled=!!state.insAuto;$('vInsSplit').textContent=state.insAuto?'Auto':state.insSplit+'%';
 document.querySelectorAll('#segHdr button').forEach(x=>x.classList.toggle('on',x.dataset.v===(state.hdrStyle||'classic')));document.querySelectorAll('#segInfoStyle button').forEach(x=>x.classList.toggle('on',x.dataset.v===(state.infoStyle||'table')));
 $('bwWrap').classList.toggle('hidden',state.hideLines);
 $('lineEm').textContent=state.hideLines?'lines hidden':'lines visible';
 $('rMg').value=state.margin;$('vMg').textContent=state.margin+' pt';
 $('rZm').value=state.zoom;$('vZm').textContent=state.zoom+'%';
 document.querySelectorAll('#segOpt button').forEach(x=>x.classList.toggle('on',x.dataset.v===state.optMode));
 document.querySelectorAll('#segPage button').forEach(x=>x.classList.toggle('on',x.dataset.v===state.page));
 document.querySelectorAll('.rail .tg[data-tg]').forEach(t2=>{const on=t2.dataset.tg==='showUrdu'?urduOn():!!state[t2.dataset.tg];t2.classList.toggle('on',on);t2.setAttribute('aria-checked',on);});
 $('boldEm').textContent=['bHeader','bBar','bInstr','bNum','bStem','bShort','bLong'].filter(k=>state[k]).length+' / 7';
 $('miniKey').style.color=state.showKey?'var(--green)':'';
 document.querySelectorAll('.rail .stepper[data-step],.rail .stepper[data-att]').forEach(st=>{
  const isAtt=st.dataset.att!==undefined;let v,min,max;
  if(isAtt){v=state.shortAttempts[+st.dataset.att];min=1;max=state.shortPrinted;}
  else{const k=st.dataset.step;
   if(k==='mcqCount'){v=state.mcqCount;min=1;max=plan.maxM;}
   else if(k==='shortParts'){v=state.shortParts;min=1;max=4;}
   else if(k==='shortPrinted'){v=state.shortPrinted;min=2;max=Math.min(8,Math.floor(plan.maxS/state.shortParts));}
   else if(k==='longPrinted'){v=state.longPrinted;min=1;max=plan.maxL;}
   else if(k==='longAttempt'){v=state.longAttempt;min=1;max=state.longPrinted;}
   else return;}
  const bs=st.querySelectorAll('button');bs[0].disabled=v<=min;bs[1].disabled=v>=max;});
 renderPresets();}
function bump(el){if(!el)return;el.classList.remove('pulse');void el.offsetWidth;el.classList.add('pulse');}

/* ══════════ THEME ══════════ */
function setTheme(t){
 document.documentElement.setAttribute('data-theme',t);LS.set('pp.theme',t);
 const dark=t==='dark';
 $('themeIco').innerHTML=dark?'<path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/>':'<circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.4M12 19.6V22M2 12h2.4M19.6 12H22M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M19.1 4.9l-1.7 1.7M6.6 17.4l-1.7 1.7"/>';
 $('themeBtn').title=dark?'Switch to light mode':'Switch to dark mode';
 const meta=document.querySelector('meta[name=theme-color]');if(meta)meta.setAttribute('content',dark?'#05091a':'#f8f4ea');}
$('themeBtn').addEventListener('click',()=>{const cur=document.documentElement.getAttribute('data-theme');
 setTheme(cur==='dark'?'light':'dark');toast(cur==='dark'?'Light mode — the paper stays print-white':'Dark mode restored','ok');});

/* ══════════ WIRING ══════════ */
$('alpCard').addEventListener('click',()=>{
 state.alp=!state.alp;
 if(state.alp){state.chapters=state.chapters.filter(c=>!B().alpEx.includes(c));const cc=(state.contentSelection||{})[cid()]||{};Object.keys(cc).forEach(ch=>{const cat=contentConfig(+ch),sel=cc[ch];sel.topics=(sel.topics||[]).filter(id=>!cat.topics.some(x=>x.id===id&&x.alpExcluded));sel.exercises=(sel.exercises||[]).filter(id=>!cat.exercises.some(x=>x.id===id&&x.alpExcluded));});}
 if(!state.chapters.length)state.chapters=[1];
 markDirty();buildChips();render();
 toast(state.alp?'ALP on — excluded chapters and topics withheld.':'ALP off — full textbook bank unlocked.',state.alp?'ok':'warn');});
$('schSel').addEventListener('change',e=>useScheme(e.target.value));
$('schApply').addEventListener('click',()=>applySchemeCounts(false));
$('schEdit').addEventListener('click',()=>openSchemeEditor(state.schemeId));
$('schNew').addEventListener('click',()=>openSchemeEditor(null));
$('schDup').addEventListener('click',()=>{const s=activeScheme();
 const cp=JSON.parse(JSON.stringify(s));cp.id=uid('s');cp.factory=false;cp.name=s.name+' (copy)';cp.created=Date.now();
 customSchemes.unshift(cp);saveSchemes();useScheme(cp.id);toast('Duplicated as “'+cp.name+'” — edit it freely','ok');});
$('schDel').addEventListener('click',()=>{const s=activeScheme();
 if(s.factory){toast('Official schemes cannot be deleted.','warn');return;}
 const i=customSchemes.findIndex(x=>x.id===s.id);if(i<0)return;
 const removed=customSchemes.splice(i,1)[0];saveSchemes();
 state.schemeId=offFor(cid()).id;applySchemeCounts(true);render();
 toast('Scheme “'+removed.name+'” deleted','mag',{label:'Undo',fn(){customSchemes.splice(Math.min(i,customSchemes.length),0,removed);saveSchemes();useScheme(removed.id);toast('Scheme restored','ok');}});});
$('schOfficial').addEventListener('click',()=>useScheme(offFor(cid()).id));
$('schExport').addEventListener('click',()=>{
 if(!customSchemes.length){toast('No custom schemes to export yet.','warn');return;}
 download(JSON.stringify({app:'PaperPress',kind:'schemes',version:7,schemes:customSchemes},null,2),'paper-press-schemes.json','application/json');
 toast(customSchemes.length+' scheme'+(customSchemes.length>1?'s':'')+' exported','ok');});
$('schImport').addEventListener('click',()=>$('schFile').click());
$('schFile').addEventListener('change',e=>{const f=e.target.files&&e.target.files[0];if(!f)return;
 const r=new FileReader();
 r.onload=()=>{try{const d=JSON.parse(r.result),arr=Array.isArray(d)?d:d.schemes;
  if(!Array.isArray(arr))throw 0;let n=0;
  arr.forEach(s=>{const cs=cleanScheme(s);if(cs){cs.id=uid('s');cs.created=Date.now();customSchemes.unshift(cs);n++;}});
  if(!n)throw 0;saveSchemes();syncUI();toast(n+' scheme'+(n>1?'s':'')+' imported','ok');
 }catch(err){toast('That file is not a Paper Press scheme export.','err');}};
 r.onerror=()=>toast('Could not read that file.','err');r.readAsText(f);e.target.value='';});
document.querySelectorAll('.qb[data-q]').forEach(b=>b.addEventListener('click',()=>{
 const q=b.dataset.q,bk=B();
 if(q==='all')state.chapters=(state.alp?bk.alpCh:bk.chapters).slice();
 else if(q==='alp')state.chapters=bk.alpCh.slice();
 else state.chapters=schemeChapters(activeScheme()).filter(c=>bk.chapters.includes(c)&&!(state.alp&&B().alpEx.includes(c)));
 if(!state.chapters.length)state.chapters=[bk.alpCh[0]];
 markDirty();buildChips();render();}));
$('selMcqMark').addEventListener('change',e=>{state.mcqMark=+e.target.value;markDirty();render();});
$('selShortMark').addEventListener('change',e=>{state.shortMark=+e.target.value;markDirty();render();});
$('selLongMark').addEventListener('change',e=>{state.longMark=+e.target.value;markDirty();render();});
document.addEventListener('click',e=>{
 const btn=e.target.closest('.rail .stepper[data-step] button, .rail .stepper[data-att] button');if(!btn||btn.disabled)return;
 const st=btn.closest('.stepper'),d=+btn.dataset.d;
 if(st.dataset.att!==undefined){const i=+st.dataset.att;state.shortAttempts[i]=clamp(state.shortAttempts[i]+d,1,state.shortPrinted);}
 else{const k=st.dataset.step;
  if(k==='mcqCount')state.mcqCount=clamp(state.mcqCount+d,1,plan.maxM);
  else if(k==='shortParts')state.shortParts=clamp(state.shortParts+d,1,4);
  else if(k==='shortPrinted')state.shortPrinted=clamp(state.shortPrinted+d,2,8);
  else if(k==='longPrinted')state.longPrinted=clamp(state.longPrinted+d,1,plan.maxL);
  else if(k==='longAttempt')state.longAttempt=clamp(state.longAttempt+d,1,state.longPrinted);
  else return;}
 markDirty();render();});
document.querySelectorAll('#omap .oz').forEach(z=>z.addEventListener('click',()=>{
 state.omrPos=z.dataset.z;markDirty();repaint();syncUI();toast('OMR strip moved to '+ZLABEL[state.omrPos],'mag');}));
function segWire(id,key){document.querySelectorAll('#'+id+' button').forEach(b=>b.addEventListener('click',()=>{
 state[key]=b.dataset.v;markDirty();repaint();syncUI();if(state.autoFit)fitZoom();}));}
segWire('segOmrAlign','omrAlign');segWire('segOpt','optMode');segWire('segPage','page');segWire('segLogo','logoPos');segWire('segInfo','infoPos');segWire('segHdr','hdrStyle');segWire('segInfoStyle','infoStyle');
document.querySelectorAll('#segOmrCols button').forEach(b=>b.addEventListener('click',()=>{state.omrCols=+b.dataset.v;markDirty();repaint();syncUI();}));
[['rOmrW','omrWidth','vOmrW',v=>v+'%'],['rGapT','omrGapT','vGapT',v=>v+'pt'],['rGapB','omrGapB','vGapB',v=>v+'pt'],
 ['rBub','bubSize','vBub',v=>v+' pt'],['rOmrPad','omrPad','vOmrPad',v=>v+' pt'],
 ['rLogo','logoH','vLogo',v=>v+' pt'],['rEn','enSize','vEn',v=>v+' pt'],['rUr','urSize','vUr',v=>v+' pt'],
 ['rLh','lineH','vLh',v=>v.toFixed(2)],['rPad','pad','vPad',v=>v+' pt'],['rBw','borderW','vBw',v=>v+' pt'],
 ['rNumW','numW','vNumW',v=>v+'%'],['rInsSplit','insSplit','vInsSplit',v=>v+'%'],['rMg','margin','vMg',v=>v+' pt']]
.forEach(([id,k,vid,f])=>{$(id).addEventListener('input',e=>{state[k]=parseFloat(e.target.value);$(vid).textContent=f(state[k]);bump($(vid));markDirty();repaintSoon();if(state.autoFit&&k==='margin'){_post.add(fitZoom);}});});
$('rZm').addEventListener('input',e=>{state.zoom=+e.target.value;state.autoFit=false;$('vZm').textContent=state.zoom+'%';bump($('vZm'));applyZoom();});
document.querySelectorAll('.rail .tg[data-tg]').forEach(t=>t.addEventListener('click',()=>{
 const k=t.dataset.tg;state[k]=!state[k];markDirty();
 if(k==='qTools'&&!state.qTools){activeSlot=null;highlight();}
 render();}));
[['iInst','institute'],['iTitle','title'],['iClass','klass'],['iSubject','subject'],['iSubjectUr','subjectUr'],['iDate','date'],['iSection','sectionVal']]
.forEach(([id,k])=>$(id).addEventListener('input',e=>{state[k]=e.target.value;markDirty();repaintSoon();}));
[['iTimeObj','timeObj'],['iTimeSubj','timeSubj']].forEach(([id,k])=>{
 $(id).addEventListener('input',e=>{const raw=e.target.value,n=Number(raw);if(raw!==''&&Number.isFinite(n))state[k]=clamp(Math.round(n),1,600);markDirty();paintTimeControls();repaintSoon();});
 $(id).addEventListener('change',e=>{if(e.target.value===''){state[k]=0;paintTimeControls();markDirty();repaint();}});
});
$('btnTimeReset').addEventListener('click',()=>{state.timeObj=0;state.timeSubj=0;markDirty();render();toast('Objective and Subjective timings reset to ALP defaults','ok');});
$('selSheetMode').addEventListener('change',e=>{state.sheetMode=e.target.value==='two'?'two':'single';previewSheet='both';markDirty();render();if(state.autoFit)fitZoom();toast(state.sheetMode==='two'?'Objective and Subjective sheets enabled in one file':'Single-paper mode enabled','ok');});
document.querySelectorAll('#sheetTabs button').forEach(b=>b.addEventListener('click',()=>{previewSheet=b.dataset.sheet;render();}));
$('selEn').addEventListener('change',e=>{state.enFont=e.target.value;markDirty();repaint();if(state.autoFit)fitZoom();});
$('selUr').addEventListener('change',e=>{state.urFont=e.target.value;markDirty();repaint();if(state.autoFit)fitZoom();});
$('boldAll').addEventListener('click',()=>{['bHeader','bBar','bInstr','bNum','bStem','bShort','bLong'].forEach(k=>state[k]=true);markDirty();render();});
$('boldNone').addEventListener('click',()=>{['bHeader','bBar','bInstr','bNum','bStem','bShort','bLong'].forEach(k=>state[k]=false);markDirty();render();});
$('logoPick').addEventListener('click',()=>$('logoFile').click());
$('logoFile').addEventListener('change',e=>{const f=e.target.files&&e.target.files[0];if(!f)return;
 if(f.size>3e6){toast('Image is larger than 3 MB — pick a smaller logo.','warn');e.target.value='';return;}
 const r=new FileReader();
 r.onload=async()=>{state.logo=await downscaleLogo(r.result,520);state.logoName=f.name;logoPNG=await rasterizeLogo(state.logo);markDirty();render();
  toast(logoPNG?'Logo embedded — it travels with the .docx':'Logo added to preview',logoPNG?'ok':'warn');};
 r.onerror=()=>toast('Could not read that image.','err');r.readAsDataURL(f);e.target.value='';});
$('logoClear').addEventListener('click',()=>{if(!state.logo)return;state.logo='';state.logoName='';logoPNG=null;markDirty();render();toast('Logo removed','info');});
$('btnUnpinAll').addEventListener('click',()=>{const n=Object.keys(overrides).length;
 if(!n){toast('Nothing is pinned.','warn');return;}
 Object.keys(overrides).forEach(k=>{sticky[k]=overrides[k];delete overrides[k];});
 markDirty();render();toast(n+' pin'+(n>1?'s':'')+' released','info');});
$('ledger').addEventListener('click',e=>{const b=e.target.closest('[data-unpin]');if(!b)return;
 const k=b.dataset.unpin;sticky[k]=overrides[k];delete overrides[k];markDirty();render();toast('Pin released','info');});
function doShuffle(){state.seed=state.seed%99+1;sticky={};
 sheet.classList.remove('turn');void sheet.offsetWidth;sheet.classList.add('turn');
 setTimeout(()=>{repaint();syncUI();},170);setTimeout(()=>sheet.classList.remove('turn'),640);
 toast('Unpinned questions re-drawn — Set V-'+String(state.seed).padStart(2,'0'),'info');}
$('btnShuffle').addEventListener('click',doShuffle);$('miniShuffle').addEventListener('click',doShuffle);
$('miniKey').addEventListener('click',()=>{state.showKey=!state.showKey;render();});
$('btnExp').addEventListener('click',doDocx);$('topExp').addEventListener('click',doDocx);
$('btnDoc').addEventListener('click',doDoc);
$('btnPrint').addEventListener('click',()=>setTimeout(()=>window.print(),120));
$('btnFit').addEventListener('click',fitZoom);
$('btn100').addEventListener('click',()=>{state.zoom=100;state.autoFit=false;syncUI();applyZoom();});
$('btnReset').addEventListener('click',()=>{const keep={contentCatalogCustom:state.contentCatalogCustom,contentExcludedOverrides:state.contentExcludedOverrides,questionTags:state.questionTags};state=JSON.parse(JSON.stringify(DEF));Object.assign(state,keep);overrides={};sticky={};activeSlot=null;
 buildChips();render();fitZoom();toast('Paper reset — your schemes and presets are untouched.','info');});
$('btnSavePreset').addEventListener('click',()=>openPresetForm(null));
$('preSearch').addEventListener('input',e=>{preQuery=e.target.value;renderPresets();});
$('preSort').addEventListener('change',e=>{preSort=e.target.value;renderPresets();});
document.querySelectorAll('#segPreFilter button').forEach(b=>b.addEventListener('click',()=>{
 preFilter=b.dataset.v;document.querySelectorAll('#segPreFilter button').forEach(x=>x.classList.toggle('on',x===b));renderPresets();}));
$('preList').addEventListener('click',e=>{
 const chk=e.target.closest('[data-chk]');
 if(chk){const id=chk.dataset.chk;if(preSel.has(id))preSel.delete(id);else preSel.add(id);renderPresets();return;}
 const ap=e.target.closest('[data-apply]');if(ap){applyPreset(allPresets().find(p=>p.id===ap.dataset.apply));return;}
 const du=e.target.closest('[data-dup]');
 if(du){const src=allPresets().find(p=>p.id===du.dataset.dup);if(!src)return;
  const np={id:uid('p'),name:src.name+' (copy)',note:src.note||'',factory:false,grade:src.cfg.grade||src.grade,sid:src.cfg.sid||src.sid||DEFAULT_SUBJECT,courseId:src.cfg.grade?`${src.cfg.grade}-${src.cfg.sid||src.sid||DEFAULT_SUBJECT}`:(src.courseId||`${src.grade||9}-${src.sid||DEFAULT_SUBJECT}`),scopes:src.scopes.slice(),cfg:JSON.parse(JSON.stringify(src.cfg)),created:Date.now(),updated:Date.now()};
  presets.unshift(np);savePresets();renderPresets();toast('Duplicated as “'+np.name+'”','ok');return;}
 const ed=e.target.closest('[data-edit]');if(ed&&!ed.disabled){openPresetForm(ed.dataset.edit);return;}
 const de=e.target.closest('[data-del]');if(de){deletePresets([de.dataset.del]);return;}
 const card=e.target.closest('.pcard');if(card)applyPreset(allPresets().find(p=>p.id===card.dataset.pid));});
$('bulkDel').addEventListener('click',()=>deletePresets([...preSel]));
$('bulkClr').addEventListener('click',()=>{preSel.clear();renderPresets();});
$('preExport').addEventListener('click',()=>{if(!presets.length){toast('No personal presets to export yet.','warn');return;}
 download(JSON.stringify({app:'PaperPress',version:7,presets,schemes:customSchemes},null,2),'paper-press-presets.json','application/json');
 toast(presets.length+' preset'+(presets.length>1?'s':'')+' exported','ok');});
$('preImport').addEventListener('click',()=>$('preFile').click());
$('preFile').addEventListener('change',e=>{const f=e.target.files&&e.target.files[0];if(!f)return;
 const r=new FileReader();
 r.onload=()=>{try{const d=JSON.parse(r.result),arr=Array.isArray(d)?d:d.presets;
  if(!Array.isArray(arr))throw 0;let n=0;
  if(Array.isArray(d.schemes))d.schemes.forEach(s=>{const cs=cleanScheme(s);if(cs){cs.id=uid('s');customSchemes.unshift(cs);}});
  arr.forEach(p=>{if(!p||!p.name||!p.cfg)return;
   const cfg=cleanCfg(p.cfg),grade=Number(p.grade||cfg.grade||9),sid=String(p.sid||p.courseId?.split('-')[1]||cfg.sid||DEFAULT_SUBJECT);
   presets.unshift({id:uid('p'),name:String(p.name),note:String(p.note||''),factory:false,grade,sid,courseId:`${grade}-${sid}`,
    scopes:Array.isArray(p.scopes)&&p.scopes.length?p.scopes.filter(s=>SCOPES[s]):ALLSC.slice(),cfg,created:Date.now(),updated:Date.now()});n++;});
  if(!n)throw 0;savePresets();saveSchemes();renderPresets();syncUI();toast(n+' preset'+(n>1?'s':'')+' imported','ok');
 }catch(err){toast('That file is not a Paper Press export.','err');}};
 r.onerror=()=>toast('Could not read that file.','err');r.readAsText(f);e.target.value='';});
let rt=null;
window.addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(()=>{if(state.autoFit)fitZoom();else applyZoom();paintLedger();},130);});
if(window.ResizeObserver)new ResizeObserver(()=>applyZoom()).observe(sheet);

/* ══════════ ACCESSIBILITY ══════════ */
(function(){
 const key=el=>e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();el.click();}};
 document.querySelectorAll('.tg,#alpCard').forEach(t=>{t.setAttribute('role','switch');t.tabIndex=0;const l=t.querySelector('span,b');if(l)t.setAttribute('aria-label',l.textContent.trim());t.addEventListener('keydown',key(t));});
 document.querySelectorAll('button[title]').forEach(b=>{if(!b.getAttribute('aria-label'))b.setAttribute('aria-label',b.title);});
 document.querySelectorAll('.stepper button').forEach(b=>b.setAttribute('aria-label',b.dataset.d==='1'?'Increase':'Decrease'));
 document.querySelectorAll('.ctl').forEach(c=>{const l=c.querySelector('.lab span');if(!l)return;c.querySelectorAll('input,select').forEach(el=>{if(!el.getAttribute('aria-label'))el.setAttribute('aria-label',l.textContent.trim());});});
 const dr=$('drawer');dr.setAttribute('role','dialog');dr.setAttribute('aria-modal','true');dr.setAttribute('aria-labelledby','dTitle');dr.inert=true;
 document.addEventListener('keydown',e=>{if(e.key!=='Tab'||!dr.classList.contains('on'))return;
  const f=[...dr.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]):not(.hidden),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(x=>x.offsetParent!==null);
  if(!f.length)return;const first=f[0],last=f[f.length-1];
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}});
})();
const _fc=document.createElement('canvas').getContext('2d');
function fontInstalled(f){const s='مرحبا Hamburgefonstiv 0123',w=b=>{_fc.font='40px '+b;return _fc.measureText(s).width;};return['monospace','serif','sans-serif'].some(b=>w('"'+f+'",'+b)!==w(b));}
/* ══════════ RENDER BATCHING ══════════ */
let _rq=0,_rf=0;const _post=new Set();
function _sched(){if(_rf)return;_rf=requestAnimationFrame(()=>{_rf=0;const m=_rq;_rq=0;if(m>=2)render();else if(m)repaint();const fns=[..._post];_post.clear();fns.forEach(f=>{try{f();}catch(e){console.error(e);}});});}
function renderSoon(){_rq=2;_sched();}
function repaintSoon(){_rq=Math.max(_rq,1);_sched();}
/* ══════════ UNDO / REDO ══════════ */
const HMAX=60;let hist=[],hi=-1;
const hsnap=()=>{const s=Object.assign({},state);s.logo='';return JSON.stringify({s,o:overrides,k:sticky});};
function histPush(){clearTimeout(_hT);_hT=null;if(_rest)return;const j=hsnap();if(hist[hi]===j)return;hist=hist.slice(0,hi+1);hist.push(j);if(hist.length>HMAX)hist.shift();hi=hist.length-1;histUI();}
function histUI(){const u=$('btnUndo'),r=$('btnRedo');if(u)u.disabled=hi<=0;if(r)r.disabled=hi>=hist.length-1;}
function histGo(d){if(_hT)histPush();const n=hi+d;if(n<0||n>=hist.length)return;hi=n;const o=JSON.parse(hist[hi]);_rest=true;
 try{const logo=state.logo;state=Object.assign(JSON.parse(JSON.stringify(DEF)),o.s,{logo});overrides=o.o||{};sticky=o.k||{};activeSlot=null;buildChips();render();}finally{_rest=false;}
 histUI();toast(d<0?'Undone':'Redone','info');}
$('btnUndo').addEventListener('click',()=>histGo(-1));$('btnRedo').addEventListener('click',()=>histGo(1));
document.addEventListener('keydown',e=>{if(!(e.ctrlKey||e.metaKey)||e.altKey)return;const k=e.key.toLowerCase();if(k!=='z'&&k!=='y')return;const t=e.target;
 if(t&&(t.tagName==='TEXTAREA'||t.isContentEditable||(t.tagName==='INPUT'&&!['range','checkbox','button'].includes(t.type))))return;e.preventDefault();histGo(k==='y'||e.shiftKey?1:-1);});
/* ══════════ COLLAPSIBLE RAIL GROUPS ══════════ */
(function(){const GK='pp.groups.v2',gs=[...document.querySelectorAll('.rail .grp')];let open=LS.get(GK,null)||LS.get('pp.groups.v1',null);
 const nm=g=>[...g.querySelector('h3').childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim();
 if(!open){open={};gs.forEach(g=>open[nm(g)]=!['Bold Emphasis','Type Sizes & Faces','Table & Page','Question Editor'].includes(nm(g)));}
 const apply=(g,on)=>{g.classList.toggle('closed',!on);g.querySelector('h3').setAttribute('aria-expanded',on);open[nm(g)]=on;};
 gs.forEach(g=>{const h=g.querySelector('h3');h.setAttribute('role','button');h.tabIndex=0;
  const tog=()=>{apply(g,g.classList.contains('closed'));LS.set(GK,open);};
  h.addEventListener('click',tog);h.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();tog();}});apply(g,open[nm(g)]!==false);});
 const all=on=>{gs.forEach(g=>apply(g,on));LS.set(GK,open);};
 $('grpAll').addEventListener('click',()=>all(true));$('grpNone').addEventListener('click',()=>all(false));})();
/* ══════════ SETTINGS SECTIONS (icon navigation) & BLUEPRINT PANEL ══════════ */
(function(){const nav=$('nav'),T={paper:'Paper',header:'Header',layout:'Layout',edit:'Edit',library:'Library & output'};
 const set=p=>{if(!T[p])p='paper';document.body.dataset.pane=p;$('paneTitle').textContent=T[p];nav.querySelectorAll('button').forEach(b=>{const on=b.dataset.pane===p;b.classList.toggle('on',on);b.setAttribute('aria-current',on?'page':'false');});LS.set('pp.pane',p);const ps=document.querySelector('#rail .panes');if(ps)ps.scrollTop=0;};
 nav.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>set(b.dataset.pane)));window.setPane=set;set(LS.get('pp.pane','paper'));
 const bp=$('btnBP'),apply=on=>{document.body.classList.toggle('bp-open',on);bp.classList.toggle('on',on);bp.setAttribute('aria-pressed',on);LS.set('pp.bp',on);setTimeout(()=>{if(state.autoFit)fitZoom();},80);};
 bp.addEventListener('click',()=>apply(!document.body.classList.contains('bp-open')));$('btnBPClose').addEventListener('click',()=>apply(false));
 apply(LS.get('pp.bp',window.innerWidth>=1760));})();
/* ══════════ MOBILE TAB BAR ══════════ */
(function(){const tb=$('tabbar');
 const setTab=t=>{document.body.dataset.tab=t;tb.querySelectorAll('[data-tab]').forEach(b=>{const on=b.dataset.tab===t;b.classList.toggle('on',on);b.setAttribute('aria-current',on?'page':'false');});
  window.scrollTo(0,0);if(t==='stage')setTimeout(()=>{if(state.autoFit)fitZoom();else applyZoom();},40);if(t==='ledger')setTimeout(paintLedger,40);};
 tb.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.tab)));
 $('tabSave').addEventListener('click',doDocx);setTab('stage');})();

;
/* === app-runtime.js === */
"use strict";
/* ══════════ BUG REPORTS (every report carries its own ID + diagnostics) ══════════ */
const APP_BUILD='v39 · 2026-11-27',ISSUES='https://github.com/Ugwattu/paper-press/issues';
function bugReport(){
 const s=state,b=B(),id='PP-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,6).toUpperCase();
 const sch=(typeof activeScheme==='function'&&activeScheme())||{},mk=plan&&plan.marks||{};
 const diag=['- App build: '+APP_BUILD,'- Browser: '+navigator.userAgent,'- Screen: '+innerWidth+'×'+innerHeight+' @'+(devicePixelRatio||1)+'x, theme '+document.documentElement.dataset.theme,
  '- Class: '+b.name+' · ALP '+(s.alp?'on':'off')+' · scheme: '+(sch.name||s.schemeId),'- Paper: seed '+s.seed+' · '+built.mcq.length+' MCQ / '+built.short.reduce((n,p)=>n+p.items.length,0)+' short / '+built.long.length+' long · '+(mk.total||'?')+' marks',
  '- Bilingual: '+(urduOn(s)?'yes':'no')+' · OMR: '+(s.omr?'yes ('+s.omrPos+')':'no')+' · page '+s.page+', margin '+s.margin+'pt · fonts '+s.enFont+(urduOn(s)?' / '+s.urFont:''),
  '- Opened the .docx in: (Word / OnlyOffice / other?)'].join('\n');
 const body='**Report ID:** '+id+'\n\n**What happened?**\n\n\n**What did you expect instead?**\n\n\n**Steps to reproduce**\n1. \n2. \n\n<details><summary>Diagnostics (auto-filled — please keep)</summary>\n\n'+diag+'\n\n</details>\n';
 return{id,diag,body,url:ISSUES+'/new?title='+encodeURIComponent('['+id+'] ')+'&body='+encodeURIComponent(body)};}
(function(){const a=[$('btnBug'),$('bugLink')].filter(Boolean),upd=e=>{try{e.currentTarget.href=bugReport().url;}catch(x){e.currentTarget.href=ISSUES;}};
 a.forEach(el=>['pointerenter','focus','click','auxclick','contextmenu'].forEach(ev=>el.addEventListener(ev,upd)));
 const cp=$('btnCopyDiag');if(cp)cp.addEventListener('click',async()=>{const r=bugReport();try{await navigator.clipboard.writeText('Report ID: '+r.id+'\n'+r.diag);toast('Diagnostics copied ('+r.id+')','ok');}catch(e){toast('Could not copy — your browser blocked clipboard access.','warn');}});
 const bi=$('buildInfo');if(bi)bi.textContent='Build '+APP_BUILD;})();
/* ══════════ BACKUP & RESTORE ══════════
*/
(function(){
 const MAGIC='paper-press-backup',info=$('backupInfo'),stamp=()=>{const t=LS.get('pp.lastBackup',null);info.textContent=t?'Last backup from this device: '+new Date(t).toLocaleString():'No backup made from this device yet.';};
 async function collect(){flushState();const data={};
  try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith('pp.')&&!['pp.lastBackup','pp.autobackup','pp.build'].includes(k)){try{data[k]=JSON.parse(localStorage.getItem(k));}catch(e){data[k]=localStorage.getItem(k);}}}}catch(e){}
  return{app:MAGIC,version:1,created:new Date().toISOString(),data,logo:state.logo||await idbGet('logo')||''};}
 $('btnBackup').addEventListener('click',async()=>{const j=await collect(),n=Object.keys(j.data).length;
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(j)],{type:'application/json'}));a.download='paper-press-backup-'+new Date().toISOString().slice(0,10)+'.json';
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);LS.set('pp.lastBackup',Date.now());stamp();toast('Backup saved ('+n+' items'+(j.logo?' + logo':'')+')','ok');});
 $('btnRestore').addEventListener('click',()=>$('backupFile').click());
 $('backupFile').addEventListener('change',async e=>{const f=e.target.files&&e.target.files[0];e.target.value='';if(!f)return;
  if(f.size>8e6)return toast('That file is too large to be a Paper Press backup.','err');
  let j;try{j=JSON.parse(await f.text());}catch(x){return toast('That file is not valid JSON.','err');}
  if(!j||j.app!==MAGIC||!j.data||typeof j.data!=='object')return toast('This is not a Paper Press backup file.','err');
  const keys=Object.keys(j.data).filter(k=>/^pp\.[\w.\-]+$/.test(k)&&!['pp.lastBackup','pp.autobackup','pp.build'].includes(k));
  if(!keys.length)return toast('The backup contains no data.','warn');
  if(!confirm('Restore '+keys.length+' saved items from this backup'+(j.created?' (made '+new Date(j.created).toLocaleString()+')':'')+'?\n\nThis replaces the current paper, presets and schemes on this device.'))return;
  window.__ppRestoring=true;
  try{
   const sanitized={...j.data};const pr=sanitized['pp.presets.v7'];if(Array.isArray(pr))sanitized['pp.presets.v7']=pr.map(p=>p&&p.cfg?({...p,cfg:cleanCfg(p.cfg)}):p).filter(p=>p&&(!p.cfg||Object.keys(p.cfg).length));
   const sc=sanitized['pp.schemes.v7'];if(Array.isArray(sc))sanitized['pp.schemes.v7']=sc.map(cleanScheme).filter(Boolean);
   const st=sanitized['pp.state.v7'];if(st&&typeof st==='object'){const clean=Object.assign({},DEF,cleanCfg(st),{logo:''});['contentSelection','contentCatalogCustom','contentExcludedOverrides','questionTags','longPick'].forEach(k=>{if(st[k]&&typeof st[k]==='object'&&!Array.isArray(st[k]))clean[k]=JSON.parse(JSON.stringify(st[k]));});sanitized['pp.state.v7']=clean;}
   const snapshot={};keys.forEach(k=>snapshot[k]=localStorage.getItem(k));const oldLogo=await idbGet('logo');const lg=typeof j.logo==='string'&&/^data:image\/(png|jpe?g|gif|webp);base64,/.test(j.logo)&&j.logo.length<2e6?j.logo:'';
   try{keys.forEach(k=>localStorage.setItem(k,JSON.stringify(sanitized[k])));if(!await idbSet('logo',lg))throw new Error('IndexedDB logo write failed');}catch(writeErr){keys.forEach(k=>{if(snapshot[k]===null)localStorage.removeItem(k);else localStorage.setItem(k,snapshot[k]);});await idbSet('logo',oldLogo);throw writeErr;}
  }catch(x){window.__ppRestoring=false;return toast('Could not write the backup into browser storage.','err');}
  toast('Backup restored — reloading…','ok');setTimeout(()=>location.reload(),800);});
 stamp();
 const abBtn=$('btnAutoBackup');
 idbGet('autobackup').then(v=>{const ab=(v&&v.raw)?v:LS.get('pp.autobackup',null);if(!(ab&&ab.raw&&abBtn))return;abBtn.classList.remove('hidden');abBtn.textContent='Download the safety copy made before the last update ('+new Date(ab.saved).toLocaleDateString()+')';
  abBtn.addEventListener('click',()=>{const data={};for(const k in ab.raw){try{data[k]=JSON.parse(ab.raw[k]);}catch(e){}}
   const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({app:MAGIC,version:1,created:ab.saved,data,logo:''})],{type:'application/json'}));a.download='paper-press-safety-copy-'+ab.saved.slice(0,10)+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);});});})();
/* ══════════ PAPER SECTIONS: at least one must stay on ══════════ */
(function(){const K=['incMcq','incShort','incLong'];K.forEach(k=>{const el=document.querySelector('.tg[data-tg="'+k+'"]');if(!el)return;
 el.addEventListener('click',e=>{if(state[k]!==false&&K.filter(x=>x!==k).every(x=>state[x]===false)){e.stopImmediatePropagation();toast('At least one section must stay on.','warn');}},true);});})();
/* ══════════ KEYBOARD SHORTCUTS ══════════ */
const SHORTCUTS=[
 ['Ctrl / ⌘ + S','Save as .docx'],['Ctrl / ⌘ + P','Print / PDF'],['Ctrl / ⌘ + Z','Undo'],['Ctrl / ⌘ + Shift + Z','Redo'],
 ['S','Shuffle the paper'],['K','Show / hide answer key'],['B','Bilingual columns (9th/10th only) on / off'],['O','OMR sheet on / off'],
 ['E','Question edit tools on / off'],['T','Chapter tags on / off'],['+  /  −','Zoom in / out'],['0','Zoom 100%'],['F','Fit paper to width'],
 ['[  /  ]','Collapse / expand all settings groups'],['1 – 5','Settings section: Paper · Header · Layout · Edit · Library'],['L','Show / hide the Blueprint panel'],['1 2 3','Settings · Paper · Blueprint (phone layout)'],['?','Show this list'],['Esc','Close panel / dialog']];
(function(){
 const dlg=$('keysDlg');
 $('keysList').innerHTML=SHORTCUTS.map(([k,d])=>`<kbd>${esc(k)}</kbd><span>${esc(d)}</span>`).join('');
 const open=()=>{if(dlg.showModal)dlg.showModal();else dlg.setAttribute('open','');};
 $('btnKeys').addEventListener('click',open);$('keysClose').addEventListener('click',()=>dlg.close?dlg.close():dlg.removeAttribute('open'));
 const flip=(k,label)=>{const el=document.querySelector('.tg[data-tg="'+k+'"]');if(!el)return;el.click();toast(label+(state[k]?' on':' off'),'info');};
 const zoomBy=d=>{state.autoFit=false;state.zoom=clamp(state.zoom+d,40,150);applyZoom();syncUI();saveState();};
 /* Shortcuts use the PHYSICAL key (e.code) so they work with any keyboard layout (Urdu, Arabic, …) and with Caps Lock on. */
 const DIG={Digit1:1,Digit2:2,Digit3:3,Digit4:4,Digit5:5,Numpad1:1,Numpad2:2,Numpad3:3,Numpad4:4,Numpad5:5};
 document.addEventListener('keydown',e=>{
  if(e.defaultPrevented||e.isComposing)return;const mod=e.ctrlKey||e.metaKey,c=e.code||'';
  if(mod&&!e.altKey&&!e.shiftKey&&c==='KeyS'){e.preventDefault();doDocx();return;}
  if(mod&&!e.altKey&&!e.shiftKey&&c==='KeyP'){e.preventDefault();$('btnPrint').click();return;}
  if(mod||e.altKey||dlg.open)return;
  const t=e.target;if(t&&(t.tagName==='TEXTAREA'||t.tagName==='SELECT'||t.isContentEditable||(t.tagName==='INPUT'&&!['range','checkbox','button'].includes(t.type))))return;
  if(t&&t.getAttribute&&t.getAttribute('role')==='switch'&&e.key===' ')return;
  const tabs=getComputedStyle($('tabbar')).display!=='none',n=DIG[c];
  if(c==='KeyS')doShuffle();else if(c==='KeyK')$('miniKey').click();else if(c==='KeyB'){if(isBilingualCourse())flip('showUrdu','Bilingual');else toast('Urdu is not available for this English-only course.','info');}else if(c==='KeyO')flip('omr','OMR sheet');
  else if(c==='KeyE')flip('qTools','Edit tools');else if(c==='KeyT')flip('showTags','Chapter tags');else if(c==='Equal'||c==='NumpadAdd')zoomBy(10);else if(c==='Minus'||c==='NumpadSubtract')zoomBy(-10);
  else if(c==='Digit0'||c==='Numpad0')$('btn100').click();else if(c==='KeyF')$('btnFit').click();else if(c==='BracketLeft')$('grpNone').click();else if(c==='BracketRight')$('grpAll').click();
  else if(c==='KeyL')$('btnBP').click();else if(c==='Slash'&&e.shiftKey||e.key==='?')open();
  else if(n){if(tabs){if(n<4)$('tabbar').querySelectorAll('[data-tab]')[n-1].click();else return;}else window.setPane(['paper','header','layout','edit','library'][n-1]);}else return;
  e.preventDefault();});
})();
/* ══════════ BOOT ══════════ */
/* When a new build opens existing data, keep a raw copy of it first (downloadable from Library → Backup & restore). */
try{if(LS.get('pp.build',null)!==APP_BUILD){const raw={};['pp.state.v7','pp.presets.v7','pp.schemes.v7','pp.theme'].forEach(k=>{const v=localStorage.getItem(k);if(v!==null)raw[k]=v;});
 if(raw['pp.state.v7']||raw['pp.presets.v7']||raw['pp.schemes.v7']){try{if(raw['pp.state.v7']){const st=JSON.parse(raw['pp.state.v7']);st.logo='';raw['pp.state.v7']=JSON.stringify(st);}
  const full={build:LS.get('pp.build','an earlier version'),saved:new Date().toISOString(),raw:Object.assign({},raw)};
  /* The full safety copy lives in IndexedDB (it does not count against the 5 MB localStorage quota). If IndexedDB is unavailable, fall back to a size-capped localStorage copy. */
  const lsCopy=()=>{try{const slim={build:full.build,saved:full.saved,raw:Object.assign({},raw)};let payload=JSON.stringify(slim);if(payload.length>180000){delete slim.raw['pp.presets.v7'];payload=JSON.stringify(slim);}if(payload.length>180000){delete slim.raw['pp.schemes.v7'];payload=JSON.stringify(slim);}
    if(payload.length<=180000)LS.set('pp.autobackup',slim);else LS.set('pp.autobackup',{build:slim.build,saved:slim.saved,raw:{'pp.state.v7':raw['pp.state.v7']}});}catch(e){}};
  if(window.indexedDB)idbSet('autobackup',full).then(ok=>{if(ok){try{localStorage.removeItem('pp.autobackup');}catch(e){}}else lsCopy();});else lsCopy();}catch(e){}}LS.set('pp.build',APP_BUILD);}}catch(e){}
setTheme(LS.get('pp.theme',null)||(window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'));
customSchemes=(LS.get('pp.schemes.v7',[])||[]).map(cleanScheme).filter(Boolean);
presets=LS.get('pp.presets.v7',[]);
/* Legacy presets stored one free-text duration. Drop that obsolete field and inherit the course ALP split. */
let migratedPresetTimes=false;presets.forEach(p=>{if(p&&p.cfg&&Object.prototype.hasOwnProperty.call(p.cfg,'time')){migratedPresetTimes=true;delete p.cfg.time;if(Array.isArray(p.scopes)&&p.scopes.includes('header')){if(p.cfg.timeObj===undefined)p.cfg.timeObj=0;if(p.cfg.timeSubj===undefined)p.cfg.timeSubj=0;}}});
if(migratedPresetTimes)LS.set('pp.presets.v7',presets);
hiddenF=LS.get('pp.hiddenFactory.v1',[]);if(!Array.isArray(hiddenF))hiddenF=[];hiddenF=hiddenF.map(id=>id==='f-alp9'?'f-alp-9-computer':id==='f-alp10'?'f-alp-10-computer':id);LS.set('pp.hiddenFactory.v1',hiddenF);
const saved=LS.get('pp.state.v7',null);
if(saved&&typeof saved==='object'){
 state=Object.assign(JSON.parse(JSON.stringify(DEF)),saved);
 ['contentSelection','contentCatalogCustom','contentExcludedOverrides','questionTags'].forEach(k=>{if(!state[k]||typeof state[k]!=='object'||Array.isArray(state[k]))state[k]={};});
 delete state.time; /* legacy free-text duration replaced by objective/subjective minutes */
 state.timeObj=Number.isFinite(+state.timeObj)?clamp(Math.round(+state.timeObj),0,600):0;state.timeSubj=Number.isFinite(+state.timeSubj)?clamp(Math.round(+state.timeSubj),0,600):0;
 state.sheetMode=state.sheetMode==='two'?'two':'single';
 if(!state.sid)state.sid=DEFAULT_SUBJECT;
 if(!BOOKS[cid()]){state.grade=DEFAULT_COURSE.classNo||9;state.sid=DEFAULT_SUBJECT;}
 state.chapters=(state.chapters||[]).filter(c=>B().chapters.includes(c));
 if(!state.chapters.length)state.chapters=B().alpCh.slice();
 state.longPick=state.longPick||{};
 for(const course in state.questionTags||{}){const book=BOOKS[course];if(!book)continue;const tags=state.questionTags[course]||{},migrated={};for(const oldId in tags){const m=oldId.match(/-c(\d+)-(m|s|l)(\d+)$/);if(!m){migrated[oldId]=tags[oldId];continue;}const ch=+m[1],type={m:'mcq',s:'short',l:'long'}[m[2]],q=(book[type][ch]||[])[+m[3]];if(q)migrated[q.id]=tags[oldId];}state.questionTags[course]=migrated;}
}
if(!allSchemes().some(s=>s.id===state.schemeId&&s.courseId===cid()))state.schemeId=(offFor(cid())||{}).id||'';
coursePickerGrade=state.grade;buildCourseUI();
document.querySelectorAll('#segPreFilter button').forEach(x=>x.classList.toggle('on',x.dataset.v==='all'));
buildChips();render();histPush();
idbGet('logo').then(d=>{_logoLoaded=true;_lastLogo=d||'';if(d&&!state.logo&&state.logoName){state.logo=d;rasterizeLogo(d).then(p=>{logoPNG=p;render();});}else saveState();});
if(state.logo)rasterizeLogo(state.logo).then(p=>{logoPNG=p;syncUI();});
requestAnimationFrame(()=>{if(state.autoFit!==false)fitZoom();else applyZoom();paintLedger();renderPresets();
 setTimeout(()=>toast('Long scheme: 9th Ch1 · Ch3 · Ch6/9 — 10th Ch1 · Ch4 · Ch6/8. Edit or add your own in Pairing Scheme.','ok'),800);});
/* v36 professional onboarding: anchored feature tour with a clear, unblurred spotlight. */
(()=>{
 const tour=[
  {section:'OVERVIEW',feature:'Workspace navigation',title:'Welcome to Paper Press',body:'Paper Press turns organized question banks into printable school exam papers. Work from left to right: choose the course and syllabus, decide which chapters and content are eligible, configure the question mix, then inspect the finished paper and export it. The preview updates as you work.',tip:'The highlighted navigation is where you switch between Paper, Header, Layout, Edit and Library. This tour follows the real controls in your workspace.',target:'#nav'},
  {section:'COURSE SETUP',feature:'Active paper identity',title:'Confirm the active paper',body:'This ACTIVE PAPER card identifies the exact class and subject currently supplying the question bank. The selected course determines which chapters, questions, syllabus rules and pairing schemes are available everywhere else in the app.',tip:'Check this card before changing paper settings. It is the quickest way to confirm that you are building the correct course paper.',target:'#selectedCourse',pane:'paper'},
  {section:'COURSE SETUP',feature:'Grade selector',title:'1 · Choose the class',body:'The grade selector sets the school level for this paper. When you choose a grade, the subject list below changes to show the subjects registered for that grade. The selected grade is visibly marked so the first choice is easy to verify.',tip:'Choose the grade before choosing a subject. Changing the grade changes the available course options.',target:'#gradeCard',pane:'paper'},
  {section:'COURSE SETUP',feature:'Subject and question bank',title:'2 · Choose a subject',body:'Subject cards show which course banks can be used. Available cards show the number of authored questions; unavailable courses are marked as coming soon and cannot be selected yet. Selecting a subject activates its course-specific settings and question bank.',tip:'After choosing a subject, look back at the ACTIVE PAPER card above to verify the class-and-subject combination.',target:'#courseGrid',pane:'paper'},
  {section:'SYLLABUS',feature:'ALP / full textbook mode',title:'3 · Set the syllabus coverage',body:'Use ALP Smart Syllabus to choose the content scope. When ALP is on, the app follows the reduced-syllabus rules and respects marked exclusions. When it is off, the paper can draw from the full textbook. Where supported, individual topic or exercise overrides let you include or exclude specific items.',tip:'Set the syllabus mode before selecting chapters and topics. This keeps the rest of your choices consistent with the intended exam coverage.',target:'#alpCard',pane:'paper'},
  {section:'CONTENT SELECTION',feature:'Chapter filter',title:'4 · Select the chapters',body:'Chapter chips are the first level of content filtering. Only selected chapters are eligible for question generation. The small MCQ, Short and Long indicators show the available question-bank coverage for each chapter. Quick actions can select all chapters, the ALP set or the chapters in the active pairing scheme.',tip:'Start broad with the chapters. The next step lets you narrow selected chapters further by individual topics and exercises.',target:'#chGrid',pane:'paper'},
  {section:'CONTENT SELECTION',feature:'Topics and exercises',title:'5 · Narrow the content inside a chapter',body:'Expand a chapter in the content picker to see its Topics and Exercises tabs. Select individual entries, select all, clear the selection or add a custom label. The counts show how many entries are selected. These filters apply to the question pools, so generated MCQs, short questions and long questions follow the selected content.',tip:'Leaving a chapter’s topics and exercises unfiltered keeps the whole selected chapter eligible. Use these controls only when you need narrower coverage; untagged questions can be included explicitly when the option is available.',target:'#contentPick',pane:'paper'},
  {section:'PAPER STRUCTURE',feature:'Paper section switches',title:'6 · Decide which sections to include',body:'These switches control whether the paper contains MCQs, short questions and long questions. Turning a section off removes it from the generated paper and recalculates numbering, marks and the blueprint. At least one section must remain enabled.',tip:'These switches include or remove whole question sections. The detailed controls below each section determine how many questions are printed.',target:'#grpSections',pane:'paper'},
  {section:'PAPER STRUCTURE',feature:'MCQ configuration',title:'7 · Configure objective questions',body:'The Objective · MCQs group controls the number of multiple-choice questions and the marks assigned to each one. The availability hint reflects your active course, chosen chapters and any topic or exercise filters, helping you avoid requesting more questions than the selected pool contains.',tip:'The number here is how many MCQs will print on the paper. Check the availability hint after changing your content filters.',target:'#grpMcq',pane:'paper'},
  {section:'PAPER STRUCTURE',feature:'Short-question configuration',title:'8 · Configure short questions',body:'The short-question group controls the number of parts, how many questions are printed in each part, marks per answer and how many students must attempt. Printed count and attempt count are different: a part can display more questions than students are required to answer.',tip:'For example, “print 6, attempt 4” means six questions appear and students answer any four. Check the attempt count for every part.',target:'#grpShort',pane:'paper'},
  {section:'PAPER STRUCTURE',feature:'Long-question configuration',title:'9 · Configure long questions',body:'The long-question group controls how many long questions appear, how many must be attempted and the marks for each answer. The active pairing scheme and source controls determine the chapters used for long-question slots, including either/or choices where the scheme supports them.',tip:'Review both the printed count and the attempt instruction. Then confirm that the long-question chapter sources match your required paper pattern.',target:'#grpLong',pane:'paper'},
  {section:'PAPER STRUCTURE',feature:'Pairing scheme',title:'10 · Apply a pairing scheme',body:'A pairing scheme describes the course’s chapter distribution and long-question source pattern. Choose a scheme from the list, then use Apply counts to bring its question counts into the paper configuration. The surrounding controls let you edit, create, duplicate, remove or restore schemes.',tip:'Duplicate an official scheme before making substantial changes. That gives you a custom version while keeping the original available.',target:'#schSel',pane:'paper'},
  {section:'PAPER DESIGN',feature:'Header design',title:'11 · Design the exam header',body:'Open Header to configure the institute name, test title, printed class, student information fields and header style. You can also choose whether the document is a single paper or separates Objective and Subjective sheets. The live preview reflects the selected header design.',tip:'Use the named header styles to change the appearance of the exam heading without changing its question content.',target:'#segHdr',pane:'header'},
  {section:'PAPER DESIGN',feature:'Page layout and typography',title:'12 · Control page layout',body:'Layout contains the document’s reading and page-fit settings: fonts and sizes, page size, margins, columns, line and question spacing, Urdu or bilingual formatting, and available OMR options. These choices affect presentation and readability rather than which questions are selected.',tip:'Keep the preview visible while adjusting layout. More columns can save space, but a long question may be easier to read in fewer columns.',target:'#segOpt',pane:'layout'},
  {section:'QUESTION REVIEW',feature:'Edit and pin questions',title:'13 · Keep the questions you want',body:'The Edit workspace lets you inspect the questions already placed in the generated paper. Pin a question to keep it in its current slot when you shuffle or regenerate. Unpinned slots can be replaced, which lets you improve individual questions without rebuilding the entire paper.',tip:'Pin the questions you want to preserve before shuffling. Unpin them later whenever you want those slots to change again.',target:'#pinN',pane:'edit'},
  {section:'REUSABLE SETUPS',feature:'Save a preset',title:'14 · Save a reusable paper setup',body:'Library lets you save the current configuration as a preset. A preset can preserve the selected course, syllabus mode, chapters, topic and exercise filters, question counts, pairing scheme and design settings, making recurring tests faster to prepare. The Library workspace also provides the available preset management and transfer controls.',tip:'Save a preset after you have finalized a common test format. Give it a name that describes the exam or unit so it is easy to find later.',target:'#btnSavePreset',pane:'library'},
  {section:'FINAL REVIEW',feature:'Live paper preview',title:'15 · Review the actual paper',body:'The preview is the paper being assembled from your current settings. Inspect question wording, order, numbering, part instructions, marks, total marks, header, page breaks and spacing. Zoom and fit controls help you review individual pages and the overall layout.',tip:'Treat preview as your final quality check. Revisit the relevant settings if you spot missing questions, incorrect instructions or awkward page breaks.',target:'#stage',pane:'paper'},
  {section:'FINAL REVIEW',feature:'Word export and print',title:'16 · Export or print your paper',body:'Save .docx creates an editable Microsoft Word document that you can review or adjust before printing. The browser’s Print command can also send the paper to a printer or save it as a PDF. Before sharing, verify the course, syllabus scope, chapters, question counts, marks, timing and page layout.',tip:'You can reopen this walkthrough any time with the Guide button in the top bar. Your paper settings are separate from tutorial completion.',target:'#topExp',pane:'paper'}
 ];
 const completionKey='pp.tutorial.v4';
 let at=0,overlay=null,target=null,previousFocus=null,layoutQueued=false;
 const reducedMotion=()=>window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
 function clearTarget(){if(target){target.classList.remove('tour-spotlight');target=null;}}
 function ensureOverlay(){
  if(overlay)return;
  overlay=document.createElement('div');overlay.className='tour-backdrop';
  overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');
  overlay.setAttribute('aria-label','Paper Press product walkthrough');
  document.body.appendChild(overlay);
  window.addEventListener('scroll',scheduleLayout,true);
  window.addEventListener('resize',scheduleLayout);
  document.addEventListener('keydown',onTourKeydown,true);
 }
 function close(){
  clearTarget();
  if(overlay)overlay.remove();overlay=null;
  window.removeEventListener('scroll',scheduleLayout,true);
  window.removeEventListener('resize',scheduleLayout);
  document.removeEventListener('keydown',onTourKeydown,true);
  localStorage.setItem(completionKey,'done');
  if(previousFocus&&typeof previousFocus.focus==='function')previousFocus.focus({preventScroll:true});
  previousFocus=null;
 }
 function move(delta){const next=at+delta;if(next<0||next>=tour.length)return;at=next;draw();}
 function onTourKeydown(e){
  if(!overlay)return;
  if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();return;}
  if(e.key==='ArrowRight'&&!e.altKey&&!e.ctrlKey&&!e.metaKey){e.preventDefault();move(1);return;}
  if(e.key==='ArrowLeft'&&!e.altKey&&!e.ctrlKey&&!e.metaKey){e.preventDefault();move(-1);return;}
  if(e.key==='Tab'){
   const items=[...overlay.querySelectorAll('button:not(:disabled)')];if(!items.length)return;
   const first=items[0],last=items[items.length-1];
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  }
 }
 function updateSpotlight(){
  if(!overlay)return;
  const shade=overlay.querySelector('.tour-shade');if(!shade)return;
  const w=Math.max(1,window.innerWidth),h=Math.max(1,window.innerHeight);
  let box=null;
  if(target){const r=target.getBoundingClientRect();if(r.width>0&&r.height>0){
   const x=clamp(r.left-9,2,w-2),y=clamp(r.top-9,2,h-2);
   const right=clamp(r.right+9,x+1,w-2),bottom=clamp(r.bottom+9,y+1,h-2);
   box={x,y,width:right-x,height:bottom-y,rx:Math.min(15,(right-x)/5,(bottom-y)/5)};
  }}
  shade.setAttribute('viewBox',`0 0 ${w} ${h}`);shade.setAttribute('width',w);shade.setAttribute('height',h);
  const maskId='paperPressTourMask';
  const hole=box?`<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" rx="${box.rx}" fill="#000"/>`:'';
  const ring=box?`<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" rx="${box.rx}" fill="none" stroke="#fff" stroke-width="5"/><rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" rx="${box.rx}" fill="none" stroke="var(--accent)" stroke-width="2.5"/>`:'';
  shade.innerHTML=`<defs><mask id="${maskId}" maskUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}"><rect x="0" y="0" width="${w}" height="${h}" fill="#fff"/>${hole}</mask></defs><rect x="0" y="0" width="${w}" height="${h}" fill="rgba(13,20,35,.22)" mask="url(#${maskId})"/>${ring}`;
  positionCard(box);
 }
 function positionCard(box){
  const card=overlay&&overlay.querySelector('.tour-card');if(!card)return;
  const w=window.innerWidth,h=window.innerHeight,margin=14,gap=18;
  card.style.width=`${Math.max(200,Math.min(408,w-24))}px`;
  card.style.maxHeight=`${Math.max(220,w<=760?Math.min(h*.62,h-24):h-28)}px`;
  const cr=card.getBoundingClientRect(),cw=cr.width,ch=cr.height;
  if(!box){card.style.left=`${Math.round((w-cw)/2)}px`;card.style.top=`${Math.round((h-ch)/2)}px`;card.dataset.side='center';return;}
  const r=target.getBoundingClientRect();
  const candidates=[
   {side:'right',left:r.right+gap,top:r.top+r.height/2-ch/2},
   {side:'left',left:r.left-gap-cw,top:r.top+r.height/2-ch/2},
   {side:'bottom',left:r.left+r.width/2-cw/2,top:r.bottom+gap},
   {side:'top',left:r.left+r.width/2-cw/2,top:r.top-gap-ch}
  ];
  let best=null;
  for(const c of candidates){
   const left=clamp(c.left,margin,Math.max(margin,w-cw-margin));
   const top=clamp(c.top,margin,Math.max(margin,h-ch-margin));
   const overflow=Math.max(0,margin-c.left)+Math.max(0,c.left+cw-(w-margin))+Math.max(0,margin-c.top)+Math.max(0,c.top+ch-(h-margin));
   const ix=Math.max(0,Math.min(left+cw,r.right)-Math.max(left,r.left));
   const iy=Math.max(0,Math.min(top+ch,r.bottom)-Math.max(top,r.top));
   const overlap=ix*iy;
   const distance=Math.hypot((left+cw/2)-(r.left+r.width/2),(top+ch/2)-(r.top+r.height/2));
   const score=overflow*30+overlap*5+distance*.025;
   if(!best||score<best.score)best={left,top,side:c.side,score};
  }
  card.style.left=`${Math.round(best.left)}px`;card.style.top=`${Math.round(best.top)}px`;card.dataset.side=best.side;
 }
 function scheduleLayout(){if(layoutQueued)return;layoutQueued=true;requestAnimationFrame(()=>{layoutQueued=false;updateSpotlight();});}
 function focusStep(){
  clearTarget();const step=tour[at];
  if(step.pane){const navBtn=document.querySelector(`#nav button[data-pane="${step.pane}"]`);if(navBtn&&!navBtn.classList.contains('on'))navBtn.click();}
  target=step.target?document.querySelector(step.target):null;
  if(target){const group=target.closest('.grp');if(group?.classList.contains('closed'))group.querySelector('h3')?.click();
   if(target.tagName==='DETAILS')target.open=true;
   target.classList.add('tour-spotlight');
   target.scrollIntoView({behavior:reducedMotion()?'auto':'smooth',block:'center',inline:'nearest'});
  }
  scheduleLayout();
 }
 function draw(){
  ensureOverlay();const t=tour[at],progress=Math.round((at+1)/tour.length*100);
  overlay.innerHTML=`<svg class="tour-shade" aria-hidden="true" focusable="false"></svg>
   <section class="tour-card" aria-live="polite" aria-label="${t.feature}">
    <header class="tour-card-head"><div class="tour-brand"><span class="tour-brand-mark">P</span><span><strong>Paper Press</strong><small>PRODUCT WALKTHROUGH</small></span></div><button type="button" class="tour-skip">End tour</button></header>
    <div class="tour-meta"><span class="tour-section">${t.section}</span><span class="tour-count">STEP ${String(at+1).padStart(2,'0')} / ${String(tour.length).padStart(2,'0')}</span></div>
    <div class="tour-progress-track" role="progressbar" aria-label="Tour progress" aria-valuemin="0" aria-valuemax="${tour.length}" aria-valuenow="${at+1}"><span style="width:${progress}%"></span></div>
    <div class="tour-feature-label">HIGHLIGHTED FEATURE · ${t.feature}</div>
    <h2>${t.title}</h2><p>${t.body}</p>
    <aside class="tour-tip"><span class="tour-tip-label">PRACTICAL TIP</span><span>${t.tip}</span></aside>
    <footer class="tour-card-footer"><button type="button" class="tour-prev" ${at===0?'disabled':''}>← Back</button><span class="tour-keyhint">ESC TO EXIT</span><button type="button" class="tour-next">${at===tour.length-1?'Finish tour':'Next feature →'}</button></footer>
   </section>`;
  overlay.querySelector('.tour-skip').addEventListener('click',close);
  overlay.querySelector('.tour-prev').addEventListener('click',()=>move(-1));
  overlay.querySelector('.tour-next').addEventListener('click',()=>at<tour.length-1?move(1):close());
  focusStep();
 }
 function start(){at=0;previousFocus=document.activeElement;draw();requestAnimationFrame(()=>overlay?.querySelector('.tour-next')?.focus({preventScroll:true}));}
 const btn=document.getElementById('btnTutorial');if(btn)btn.addEventListener('click',start);
 if(!localStorage.getItem(completionKey))setTimeout(()=>{if(!overlay)start();},900);
})();
