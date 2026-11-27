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
 omr:{label:'OMR layout & position',keys:['omr','omrRule','omrUrdu','omrPos','omrCols','bubSize','omrPad','omrAlign','omrWidth','omrGapT','omrGapB','omrNewPage','answerKey']},
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
 showUrdu:true,showKey:false,answerKey:false,showTags:false,
 qTools:true,noDup:true,showPins:true,zoom:100,autoFit:true,seed:7,presetId:'',dirty:false};
const CFG_KEYS=new Set([].concat(...Object.values(SCOPES).map(s=>s.keys)));
/* Values that are interpolated into style/attribute context must be plain tokens: strip quote/angle/brace/semicolon characters from font names and validate enums. */
const CFG_ENUMS={omrAlign:['left','center','right'],logoPos:['left','center','right'],omrPos:['front','end'],sheetMode:['single','two']};
function cleanToken(k,v,fallback){if(k==='enFont'||k==='urFont'){const t=String(v).replace(/["'<>{};\\`$&]/g,'').replace(/\s+/g,' ').trim().slice(0,80);return t||fallback;}
 if(CFG_ENUMS[k])return CFG_ENUMS[k].includes(v)?v:fallback;return v;}
function cleanCfg(c){const o={};if(!c||typeof c!=='object')return o;CFG_KEYS.forEach(k=>{if(!(k in c)||!(k in DEF))return;const v=c[k],d=DEF[k];
 if(typeof v!==typeof d||Array.isArray(v)!==Array.isArray(d))return;
 if(typeof v==='string'){if(k==='logo'){o[k]=(v===''||(safeImgSrc(v)&&v.length<2e6))?v:'';return;}o[k]=cleanToken(k,v.slice(0,300),d);return;}
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
/* Only inline raster data URLs may reach an <img src>; anything else (javascript:, http:, svg, malformed) is refused. */
const safeImgSrc=v=>typeof v==='string'&&v.length<3e6&&/^data:image\/(?:png|jpe?g|gif|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(v);
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
  /* Order: the committed local copy, then cdnjs, then jsDelivr. All three are the identical MathJax 3.2.2 file, so one integrity hash covers each; a tampered or changed file is refused. */
  const SRC=['vendor/mathjax-3.2.2-tex-svg.js','https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-svg.js','https://cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/tex-svg.js'],SRI='sha384-KKWa9jJ1MZvssLeOoXG6FiOAZfAgmzsIIfw8BXwI9+kYm0lPCbC6yTQPBC00F1/L';
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

