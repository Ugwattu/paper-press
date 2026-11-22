"use strict";
/* ══════════ BANKS ══════════ */
if(typeof RAW9==='undefined'||typeof RAW10==='undefined'){document.body.innerHTML='<p style="padding:2em;font:16px sans-serif">The question banks failed to load.</p>';throw new Error('banks.js missing');}
function hydrate(g,raw){
 const B={name:g===9?'9th':'10th',chapters:Object.keys(raw).map(Number),names:{},mcq:{},short:{},long:{}};
 for(const k in raw){const c=+k,r=raw[k];B.names[c]=r.n;
  B.mcq[c]=(r.m||[]).map((a,i)=>({id:`g${g}c${c}m${i}`,ch:c,en:a[0],ur:a[1],o:[[a[2],a[3]],[a[4],a[5]],[a[6],a[7]],[a[8],a[9]]],a:a[10],ex:!!a[11]}));
  B.short[c]=(r.s||[]).map((a,i)=>({id:`g${g}c${c}s${i}`,ch:c,en:a[0],ur:a[1],ex:!!a[2]}));
  B.long[c]=(r.l||[]).map((a,i)=>({id:`g${g}c${c}l${i}`,ch:c,en:a[0],ur:a[1],src:a[2]==='c'?'composed':'bank',ex:!!a[3]}));}
 return B;
}
const BOOKS={9:hydrate(9,RAW9),10:hydrate(10,RAW10)};
[9,10].forEach(g=>{const m=PP_META[g];Object.assign(BOOKS[g],{alpCh:m.alpCh,alpEx:m.alpEx,exRules:m.exRules,subject:m.subject,subjectUr:m.subjectUr});}); /* from banks/*.json */
const ALLCH=[1,2,3,4,5,6,7,8,9];

/* ══════════ OFFICIAL PAIRING SCHEMES ══════════ */
const OFFICIAL=[
 {id:'off9',grade:9,factory:true,name:'BISE ALP 2027 · Official (9th)',note:'Q5 Ch1 · Q6 Ch3 · Q7 Ch6 or Ch9',
  mcq:{1:1,3:1,4:1,5:2,6:1,7:1,8:2,9:1},mcqMark:1,
  short:[{ch:{1:2,4:4},attempt:4},{ch:{3:1,5:2,7:3},attempt:4},{ch:{6:2,8:3,9:1},attempt:4}],shortMark:2,
  long:[[1],[3],[6,9]],longAttempt:2,longMark:8},
 {id:'off10',grade:10,factory:true,name:'BISE ALP 2027 · Official (10th)',note:'Q5 Ch1 · Q6 Ch4 · Q7 Ch6 or Ch8',
  mcq:{1:1,3:2,4:1,5:2,6:1,7:2,8:1},mcqMark:1,
  short:[{ch:{1:2,3:4},attempt:4},{ch:{4:2,5:4},attempt:4},{ch:{6:2,7:2,8:2},attempt:4}],shortMark:2,
  long:[[1],[4],[6,8]],longAttempt:2,longMark:8}
];
const offFor=g=>OFFICIAL.find(s=>s.grade===g);

/* ══════════ STATE ══════════ */
const SCOPES={
 syllabus:{label:'Class, ALP & chapters',keys:['grade','alp','chapters']},
 scheme:{label:'Pairing scheme & long sources',keys:['schemeId','longPick']},
 counts:{label:'Question counts & marks',keys:['mcqCount','mcqMark','shortParts','shortPrinted','shortMark','shortAttempts','longPrinted','longAttempt','longMark']},
 header:{label:'Header, student fields & logo',keys:['institute','title','klass','subject','subjectUr','time','date','sectionVal','showName','showRoll','showSection','showDate','infoPos','footer','logo','logoName','logoH','logoPos']},
 type:{label:'Fonts, sizes & bold',keys:['enFont','enSize','urFont','urSize','lineH','pad','bHeader','bBar','bInstr','bNum','bStem','bOpt','bShort','bLong']},
 omr:{label:'OMR layout & position',keys:['omr','omrRule','omrUrdu','omrPos','omrCols','bubSize','omrPad','omrAlign','omrWidth','omrGapT','omrGapB','omrNewPage']},
 page:{label:'Page, table & layers',keys:['hideLines','borderW','numW','insSplit','insAuto','vAlign','serAlign','optMode','page','margin','shade','zebra','showUrdu']}
};
const ALLSC=Object.keys(SCOPES);
const DEF={grade:9,alp:true,chapters:BOOKS[9].alpCh.slice(),schemeId:'off9',longPick:{},
 mcqCount:10,mcqMark:1,shortParts:3,shortPrinted:6,shortMark:2,shortAttempts:[4,4,4,4],longPrinted:3,longAttempt:2,longMark:8,
 logo:'',logoName:'',logoH:54,logoPos:'center',
 institute:'Government High School, Lahore',title:'Model Question Paper',klass:'9th',subject:BOOKS[9].subject,subjectUr:BOOKS[9].subjectUr,time:'120 Minutes',date:'',sectionVal:'',
 showName:true,showRoll:true,showSection:false,showDate:true,infoPos:'top',footer:true,
 enFont:'Times New Roman',enSize:11,urFont:'Jameel Noori Nastaleeq',urSize:11,lineH:1.35,pad:4,
 bHeader:true,bBar:true,bInstr:true,bNum:true,bStem:true,bOpt:false,bShort:false,bLong:false,
 omr:true,omrRule:true,omrUrdu:true,omrPos:'front',omrCols:4,bubSize:13,omrPad:4,omrAlign:'center',omrWidth:100,omrGapT:6,omrGapB:8,omrNewPage:false,
 hideLines:false,borderW:.75,numW:10,insSplit:58,insAuto:true,vAlign:'top',serAlign:'top',optMode:'auto',page:'a4',margin:24,shade:true,zebra:false,
 showUrdu:true,showKey:false,showTags:false,
 qTools:true,noDup:true,showPins:true,zoom:100,autoFit:true,seed:7,presetId:'',dirty:false};
const CFG_KEYS=new Set([].concat(...Object.values(SCOPES).map(s=>s.keys)));
function cleanCfg(c){const o={};if(!c||typeof c!=='object')return o;CFG_KEYS.forEach(k=>{if(!(k in c)||!(k in DEF))return;const v=c[k],d=DEF[k];
 if(typeof v!==typeof d||Array.isArray(v)!==Array.isArray(d))return;
 if(typeof v==='string'){if(k==='logo'){o[k]=(v===''||(/^data:image\/(png|jpe?g|gif|webp);base64,/.test(v)&&v.length<2e6))?v:'';return;}o[k]=v.slice(0,300);return;}
 if(typeof v==='number'){if(isFinite(v))o[k]=v;return;}o[k]=JSON.parse(JSON.stringify(v));});return o;}
function cleanScheme(s){if(!s||typeof s!=='object'||!BOOKS[s.grade]||!s.mcq||!Array.isArray(s.long)||!Array.isArray(s.short))return null;
 const chs=BOOKS[s.grade].chapters,n=(v,d)=>Number.isFinite(+v)?Math.max(0,Math.min(100,Math.round(+v))):d,
 ob=m=>{const o={};Object.keys(m||{}).forEach(k=>{if(chs.includes(+k))o[+k]=n(m[k],0);});return o;};
 return{id:uid('s'),grade:+s.grade,factory:false,name:String(s.name||'Imported scheme').slice(0,80),note:String(s.note||'').slice(0,200),
  mcq:ob(s.mcq),mcqMark:n(s.mcqMark,1)||1,short:s.short.slice(0,10).map(p=>({ch:ob(p&&p.ch),attempt:n(p&&p.attempt,0)})),shortMark:n(s.shortMark,2)||2,
  long:s.long.slice(0,10).map(a=>(Array.isArray(a)?a:[]).map(Number).filter(c=>chs.includes(c))),longAttempt:n(s.longAttempt,1),longMark:n(s.longMark,8)||8};}
const FACTORY=[
 {id:'f-tpl',name:'Template style · Urdu serials',note:'Both-side serials, no marks column, OMR + header on top, 24pt margins, 11pt.',factory:true,grade:9,scopes:['header','type','omr','page'],cfg:{infoPos:'top',showName:true,showRoll:true,enSize:11,urSize:11,lineH:1.35,pad:4,omr:true,omrPos:'front',omrNewPage:false,omrAlign:'center',omrWidth:100,omrGapT:6,omrGapB:8,omrCols:4,bubSize:13,omrPad:4,omrRule:true,omrUrdu:true,margin:24,numW:10,hideLines:false,shade:true,zebra:false,showUrdu:true}},
 {id:'f-alp9',name:'ALP full paper · 9th · 50',note:'Official BISE scheme: Q5 Ch1, Q6 Ch3, Q7 Ch6/9.',factory:true,grade:9,scopes:ALLSC.slice(),cfg:Object.assign(JSON.parse(JSON.stringify(DEF)),{})},
 {id:'f-alp10',name:'ALP full paper · 10th · 50',note:'Official BISE scheme: Q5 Ch1, Q6 Ch4, Q7 Ch6/8.',factory:true,grade:10,scopes:ALLSC.slice(),cfg:Object.assign(JSON.parse(JSON.stringify(DEF)),{grade:10,chapters:BOOKS[10].alpCh.slice(),schemeId:'off10',klass:'10th'})},
 {id:'f-unit',name:'Short unit test · 20',note:'Quick 45-minute class check.',factory:true,grade:9,scopes:['counts'],cfg:{mcqCount:6,mcqMark:1,shortParts:2,shortPrinted:4,shortMark:2,shortAttempts:[2,2,2,2],longPrinted:1,longAttempt:1,longMark:6,time:'45 Minutes'}},
 {id:'f-nolines',name:'Borderless question paper',note:'All table lines hidden.',factory:true,grade:9,scopes:['page'],cfg:{hideLines:true,shade:true,zebra:false,numW:10,margin:24}},
 {id:'f-omr-end',name:'OMR on separate sheet',note:'Bubble strip on its own final page, 80% width.',factory:true,grade:9,scopes:['omr'],cfg:{omr:true,omrPos:'end',omrNewPage:true,omrAlign:'center',omrWidth:80,omrGapT:0,omrGapB:0,omrCols:4,bubSize:13,omrPad:4,omrRule:true,omrUrdu:true}},
 {id:'f-nastaliq',name:'Large Nastaliq typography',note:'11pt English / 16pt Urdu, bold stems.',factory:true,grade:9,scopes:['type'],cfg:{enSize:11,urSize:16,lineH:1.5,pad:6,bStem:true,bNum:true,bShort:true,bLong:false,bOpt:false,bHeader:true,bBar:true,bInstr:true}}
];
let state=JSON.parse(JSON.stringify(DEF)),customSchemes=[],overrides={},sticky={},plan=null,built=null,slotMap={};
let presets=[],preSel=new Set(),preFilter='all',preQuery='',preSort='new',lastDeleted=null;
let activeSlot=null,drawerMode=null,drawerSlot=null,drawerFilter='all',drawerQuery='',drawerCh='all',drawerEx=false,exporting=false,schDraft=null,schEditId=null;
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function syncSubject(g){const dflt=k=>Object.values(BOOKS).some(b=>b[k]===state[k]);if(dflt('subject'))state.subject=BOOKS[g].subject;if(dflt('subjectUr'))state.subjectUr=BOOKS[g].subjectUr;}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const sum=o=>Object.keys(o).reduce((a,k)=>a+(+o[k]||0),0);
const B=()=>BOOKS[state.grade];
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
function flushState(){clearTimeout(_saveT);_saveT=null;if(window.__ppRestoring)return;const rest=Object.assign({},state),logo=rest.logo;rest.logo='';LS.set('pp.state.v7',rest);
 if(_logoLoaded&&logo!==_lastLogo){_lastLogo=logo;idbSet('logo',logo||'');}}
window.addEventListener('pagehide',flushState);document.addEventListener('visibilitychange',()=>{if(document.hidden)flushState();});
function downscaleLogo(url,max){return new Promise(res=>{const im=new Image();im.onload=()=>{if(!im.width||!im.height)return res(url);const k=Math.min(1,max/Math.max(im.width,im.height));if(k>=1&&url.length<300000)return res(url);
 const c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*k));c.height=Math.max(1,Math.round(im.height*k));c.getContext('2d').drawImage(im,0,0,c.width,c.height);try{res(c.toDataURL('image/png'));}catch(e){res(url);}};im.onerror=()=>res(url);im.src=url;});}
const PAGES={a4:{w:595.3,h:841.9,label:'A4'},letter:{w:612,h:792,label:'Letter'},legal:{w:612,h:1008,label:'Legal'}};
const NE=['ZERO','ONE','TWO','THREE','FOUR','FIVE','SIX','SEVEN','EIGHT','NINE','TEN'];
const NU=['صفر','ایک','دو','تین','چار','پانچ','چھ','سات','آٹھ','نو','دس'];
const ZLABEL={front:'Top of paper',after:'After MCQs',mid:'After short questions',end:'End of paper'};

/* ══════════ SCHEMES ══════════ */
const allSchemes=()=>OFFICIAL.concat(customSchemes);
const gradeSchemes=g=>allSchemes().filter(s=>s.grade===g);
function activeScheme(){return allSchemes().find(s=>s.id===state.schemeId&&s.grade===state.grade)||offFor(state.grade);}
function schemeTotals(s){
 const mcq=sum(s.mcq),parts=s.short.length;
 const printed=s.short.map(p=>sum(p.ch));
 const sh=s.short.reduce((a,p)=>a+p.attempt*s.shortMark,0);
 return{mcq,parts,printed,short:sh,long:s.longAttempt*s.longMark,total:mcq*s.mcqMark+sh+s.longAttempt*s.longMark};
}
function saveSchemes(){LS.set('pp.schemes.v7',customSchemes);}
function applySchemeCounts(silent){
 const s=activeScheme(),t=schemeTotals(s);
 state.mcqCount=t.mcq;state.mcqMark=s.mcqMark;
 state.shortParts=t.parts;state.shortPrinted=Math.max(2,...t.printed);
 state.shortAttempts=s.short.map(p=>p.attempt);while(state.shortAttempts.length<4)state.shortAttempts.push(4);
 state.shortMark=s.shortMark;state.longPrinted=s.long.length;state.longAttempt=s.longAttempt;state.longMark=s.longMark;
 state.longPick={};
 if(!silent){markDirty();render();toast('Counts synced to “'+s.name+'” — '+t.total+' marks','ok');}
}
function useScheme(id){
 const s=allSchemes().find(x=>x.id===id);if(!s)return;
 state.schemeId=s.id;state.longPick={};
 if(s.grade!==state.grade){state.grade=s.grade;state.klass=B().name;syncSubject(s.grade);state.chapters=B().alpCh.slice();overrides={};sticky={};activeSlot=null;buildChips();}
 applySchemeCounts(true);markDirty();render();
 toast('Scheme “'+s.name+'” active','ok');
}
function schemeChapters(s){const set=new Set();Object.keys(s.mcq).forEach(c=>{if(s.mcq[c]>0)set.add(+c)});s.short.forEach(p=>Object.keys(p.ch).forEach(c=>{if(p.ch[c]>0)set.add(+c)}));s.long.forEach(a=>a.forEach(c=>set.add(c)));return[...set].sort((a,b)=>a-b);}

/* ══════════ PLANNING ══════════ */
function activeCh(){const b=B();return state.chapters.filter(c=>b.chapters.includes(c)).filter(c=>!state.alp||!b.alpEx.includes(c)).sort((a,b2)=>a-b2);}
function pool(t,c){const a=(B()[t][c]||[]);return state.alp?a.filter(q=>!q.ex):a.slice();}
function caps(c){return{m:pool('mcq',c).length,s:pool('short',c).length,l:pool('long',c).length};}
function findAny(t,id){const b=B();for(const c of b.chapters){const q=(b[t][c]||[]).find(x=>x.id===id);if(q)return q;}return null;}
function alloc(total,chs,w,cap){const out={};chs.forEach(c=>out[c]=0);if(!chs.length)return{out,placed:0};
 const ws=chs.reduce((a,c)=>a+(w[c]||0),0)||chs.length;let p=0,g=0;
 while(p<total&&g++<900){let best=null,bs=-Infinity;
  for(const c of chs){if(out[c]>=(cap[c]||0))continue;const sc=total*((w[c]||0)||.35)/ws-out[c];if(sc>bs+1e-9){bs=sc;best=c;}}
  if(best===null)break;out[best]++;p++;}
 return{out,placed:p};}
function longSlots(){
 const s=activeScheme(),chs=activeCh();
 return s.long.map((allow,i)=>{
  let av=allow.filter(c=>chs.includes(c)&&caps(c).l>0);
  if(!av.length)av=allow.filter(c=>B().chapters.includes(c)&&caps(c).l>0);
  if(!av.length)av=chs.filter(c=>caps(c).l>0);
  if(!av.length)av=chs.slice();
  return{allow,av};});
}
function makePlan(){
 const b=B(),sch=activeScheme(),chs=activeCh(),cm={},cs={},cl={};
 chs.forEach(c=>{const k=caps(c);cm[c]=k.m;cs[c]=k.s;cl[c]=k.l;});
 const maxM=sum(cm),maxS=sum(cs),maxL=sum(cl);
 state.mcqCount=clamp(state.mcqCount,1,Math.max(1,maxM));
 state.shortParts=clamp(state.shortParts,1,4);
 state.shortPrinted=clamp(state.shortPrinted,2,Math.max(2,Math.min(8,Math.floor(maxS/state.shortParts)||2)));
 state.longPrinted=clamp(state.longPrinted,1,Math.max(1,maxL));
 state.longAttempt=clamp(state.longAttempt,1,state.longPrinted);
 while(state.shortAttempts.length<4)state.shortAttempts.push(state.shortPrinted);
 for(let i=0;i<4;i++)state.shortAttempts[i]=clamp(state.shortAttempts[i],1,state.shortPrinted);
 const wM={};chs.forEach(c=>wM[c]=sch.mcq[c]||0);
 if(!chs.some(c=>wM[c]>0))chs.forEach(c=>wM[c]=1);
 const mA=alloc(state.mcqCount,chs,wM,cm);
 const parts=[];
 for(let p=0;p<state.shortParts;p++){
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
 parts.forEach((pt,i)=>{pt.q=i+2;pt.attempt=clamp(state.shortAttempts[i],1,state.shortPrinted);});
 const slots=longSlots(),r=rng(state.seed*7919+state.grade*104729),lch=[],lslot=[];
 for(let i=0;i<state.longPrinted;i++){
  const sl=slots[i%slots.length]||{allow:chs,av:chs};
  const forced=state.longPick[i];
  const c=(forced&&sl.av.includes(forced))?forced:sl.av[Math.floor(r()*sl.av.length)];
  lch.push(c);lslot.push(i%slots.length);}
 const sT=parts.reduce((a,p)=>a+p.attempt*state.shortMark,0);
 const marks={mcq:mA.placed*state.mcqMark,short:sT,long:state.longAttempt*state.longMark};
 marks.total=marks.mcq+marks.short+marks.long;
 return{chs,cm,cs,cl,maxM,maxS,maxL,mcqAlloc:mA.out,parts,longChs:lch,longSlot:lslot,slots,marks,sch};
}
function build(){
 const slots=[];let mi=0;
 plan.chs.forEach(c=>{for(let i=0;i<(plan.mcqAlloc[c]||0);i++){slots.push({key:'m'+mi,type:'mcq',ch:c,planCh:c,label:'MCQ '+(mi+1)});mi++;}});
 plan.parts.forEach((p,pi)=>{let ii=0;p.group.forEach(c=>{for(let i=0;i<(p.alloc[c]||0);i++){slots.push({key:'s'+pi+'.'+ii,type:'short',ch:c,planCh:c,label:'Q.'+p.q+' ('+(ii+1)+')',part:pi});ii++;}});});
 plan.longChs.forEach((c,i)=>slots.push({key:'l'+i,type:'long',ch:c,planCh:c,label:'Q.'+(2+state.shortParts+i)}));
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
 const mcq=[],short=plan.parts.map(p=>({q:p.q,attempt:p.attempt,items:[],alloc:p.alloc,group:p.group})),long=[];
 slots.forEach(s=>{const q=Object.assign({},byKey[s.key]);q._key=s.key;s.ch=q.ch;
  if(s.type==='mcq')mcq.push(q);else if(s.type==='short')short[s.part].items.push(q);else long.push(q);});
 short.forEach(p=>{if(!p.items.length)p.attempt=0;});
 return{mcq,short,long,slots};
}
function qById(sl){const k=sl.key;
 if(sl.type==='mcq')return built.mcq.find(q=>q._key===k);
 if(sl.type==='long')return built.long.find(q=>q._key===k);
 for(const p of built.short){const f=p.items.find(q=>q._key===k);if(f)return f;}return null;}
function usedElsewhere(key){const s=new Set();built.slots.forEach(sl=>{if(sl.key===key)return;const q=qById(sl);if(q)s.add(q.id);});return s;}
const wordsOf=s=>s.trim().split(/\s+/).filter(Boolean).length;
function layoutFor(m){if(state.optMode!=='auto')return parseInt(state.optMode,10);
 const mx=Math.max.apply(null,m.o.map(o=>wordsOf(o[0])));return mx<=1?4:(mx===2?2:1);}
function serials(){const map={};
 built.mcq.forEach((q,i)=>map[q._key]={no:String(i+1),ur:String(i+1)});
 built.short.forEach(p=>p.items.forEach((q,i)=>map[q._key]={no:String(i+1),ur:String(i+1)}));
 const first=2+state.shortParts;
 built.long.forEach((q,i)=>map[q._key]={no:'Q. No. '+(first+i),ur:'سوال نمبر '+(first+i)});
 return map;}
/* Column grids. "Edges" are % positions where a cell may start or end; every row is built from cells between two edges, so a
   cell simply spans however many narrow columns it needs. That is how the "Q. No." instruction row can split at a different
   place than the stems below it (like the Word template): the English side is a bit wider than half. */
function mkGrid(edges,total,round){
 const e=[...new Set(edges.map(v=>+(+v).toFixed(3)))].sort((a,b)=>a-b);
 const at=v=>{const i=e.findIndex(x=>Math.abs(x-v)<.01);if(i<0)throw new Error('grid edge '+v);return i;};
 const pos=e.map(v=>round?Math.round(total*v/100):total*v/100);
 return{edges:e,cols:pos.slice(1).map((p,i)=>p-pos[i]),sp:(a,b)=>at(b)-at(a),w:(a,b)=>pos[at(b)]-pos[at(a)]};}
let _mc=null;
function textPt(txt,bold,pt,font){try{_mc=_mc||document.createElement('canvas').getContext('2d');_mc.font=`${bold?'bold ':''}${pt}pt \"${font}\",serif`;return _mc.measureText(txt).width*0.75;}catch(e){return 0;}}
/* share of the table width (in %) the English instruction needs to stay on one line: text + cell padding + a little safety */
function fitSplit(s,txt){const need=textPt(txt,s.bInstr,s.enSize,s.enFont)+2*(s.pad+1.5)+9,pct=Math.ceil(need/(PAGES[s.page].w-2*s.margin)*100);return clamp(pct||58,45,76);}
function qEdges(s,bi,enText){
 const nw=s.numW,mid=100-2*nw,q4=mid/4,H=s.insAuto&&enText?fitSplit(s,enText):clamp(+s.insSplit||58,45,76),R=100-nw,B1=nw+mid/2,B2=nw+mid*.53;
 return{nw,q4,H,R,B1,B2,
  mcq:bi?[0,nw,nw+q4,B1,nw+3*q4,H,R,100]:[0,nw,nw+q4,B1,nw+3*q4,R,100],
  two:bi?[0,nw,B2,H,R,100]:[0,nw,100]};}

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
function paperInner(s,mode){
 const screen=(mode==='screen'),bi=s.showUrdu,showKey=screen&&s.showKey,showTags=screen&&s.showTags,SN=serials();
 const mk=plan.marks,F=s.enFont,FS=s.enSize,UF=s.urFont,US=s.urSize,BD=`${s.borderW}pt solid #000000`;
 const cb=s.hideLines?'border:0;':`border:${BD};`,bAttr=s.hideLines?'0':'1';
 const base=`font-family:'${F}',serif;font-size:${FS}pt;line-height:${s.lineH};color:#000;`;
 const VA=s.vAlign==='middle'?'middle':'top',SA=s.serAlign==='top'?'top':'middle';
 const cell=`${cb}padding:${s.pad}pt ${s.pad+1.5}pt;vertical-align:${VA};${base}`;
 const cc=`${cb}padding:${s.pad}pt;vertical-align:${SA};text-align:center;${base}`,ch=`${cb}padding:${s.pad}pt;vertical-align:${VA};text-align:center;${base}`;
 const uc=`${cb}padding:${s.pad}pt ${s.pad+1.5}pt;vertical-align:${VA};direction:rtl;text-align:right;font-family:'${UF}','Noto Nastaliq Urdu',serif;font-size:${US}pt;line-height:${s.lineH+.35};color:#000;`;
 const uNum=`${cb}padding:${s.pad}pt;vertical-align:${SA};text-align:center;direction:rtl;font-family:'${UF}','Noto Nastaliq Urdu',serif;font-size:${US}pt;line-height:${s.lineH+.35};color:#000;`;
 const ui=t=>t?` <span dir="rtl" lang="ur" style="font-family:'${UF}','Noto Nastaliq Urdu',serif;font-size:${US}pt;">${esc(t)}</span>`:'';
 const sh=s.shade?'#e9e4d6':'#ffffff',zb=i=>s.zebra&&i%2===1?'background:#f7f4ea;':'';
 const tg=t=>showTags?`<span style="font-family:Arial,sans-serif;font-size:${Math.max(6,FS-4)}pt;color:#7a6a45;"> [${t}]</span>`:'';
 const pin=q=>(screen&&s.showPins&&overrides[q._key])?'<span class="pinb">📌</span>':'';
 const cross=q=>{if(!screen)return'';const sl=slotMap[q._key];return sl&&sl.ch!==sl.planCh?'<span class="xch">↔Ch'+q.ch+'</span>':'';};
 const T=x=>`<table border="${bAttr}" cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%;${s.hideLines?'':'border:'+BD+';'}${base}${x||''}">`;
 const nw=s.numW,mid=100-2*nw,q4=mid/4;
 const wH=s.bHeader?'bold':'normal',wB=s.bBar?'bold':'normal',wI=s.bInstr?'bold':'normal',wN=s.bNum?'bold':'normal',wS=s.bStem?'bold':'normal',wO=s.bOpt?'bold':'normal',wQ=s.bShort?'bold':'normal',wL=s.bLong?'bold':'normal';
 const dz=z=>screen?`<div class="dropzone" data-zone="${z}"><span>Drop OMR — ${ZLABEL[z]}</span></div>`:'';
 const mcqEn=`Q. No. 1: Choose the Best option and fill the Bubble.  (${built.mcq.length} × ${s.mcqMark} = ${mk.mcq})`;
 let QE=qEdges(s,bi,mcqEn),GM=mkGrid(QE.mcq,100),GT=mkGrid(QE.two,100),g6=GM.cols,g4=GT.cols;
 const cs=(G,a,b)=>{const n=G.sp(a,b);return n>1?` colspan="${n}"`:'';};
 const cg=grid=>`<colgroup>${grid.map(w=>`<col style="width:${w}%">`).join('')}</colgroup>`;
 const ins=(en,ur,G)=>{
  if(!bi)return `<tr><td colspan="${G.sp(0,100)}" style="${cell}background:${sh};font-weight:${wI};">${esc(en)}</td></tr>`;
  return `<tr><td colspan="${G.sp(0,QE.H)}" style="${cell}background:${sh};font-weight:${wI};">${esc(en)}</td><td colspan="${G.sp(QE.H,100)}" style="${uc}background:${sh};font-weight:${wI};">${esc(ur)}</td></tr>`;};
 let h='';
 const logoImg=s.logo?`<img src="${s.logo}" alt="logo" style="height:${s.logoH}pt;width:auto;display:block;">`:'';
 const titleBlock=()=>{let t='';
  if(s.institute.trim())t+=`<div style="${base}font-size:${FS+5}pt;font-weight:${wH};">${esc(s.institute)}</div>`;
  t+=`<div style="${base}font-size:${FS+1}pt;font-weight:${wH};margin-top:1pt;">${esc(s.title)}</div>`;
  if(bi)t+=`<div dir="rtl" lang="ur" style="font-family:'${UF}','Noto Nastaliq Urdu',serif;font-size:${US+1}pt;font-weight:${wH};margin-top:2pt;">${esc(state.subjectUr||'')}${state.subjectUr?' — ':''}${state.grade===9?'جماعت نہم':'جماعت دہم'}</div>`;
  return t;};
 if(logoImg&&s.logoPos==='center')h+=`<div style="text-align:center;margin-bottom:4pt;"><div style="display:inline-block;">${logoImg}</div></div><div style="text-align:center;margin-bottom:5pt;">${titleBlock()}</div>`;
 else if(logoImg){const lc=`<td style="border:0;padding:0;width:${s.logoH+16}pt;vertical-align:middle;">${logoImg}</td>`,tc2=`<td style="border:0;padding:0 6pt;vertical-align:middle;text-align:center;">${titleBlock()}</td>`;
  h+=`<table border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%;margin-bottom:5pt;"><tr>${s.logoPos==='left'?lc+tc2:tc2+lc}</tr></table>`;}
 else h+=`<div style="text-align:center;margin-bottom:5pt;">${titleBlock()}</div>`;
 h+=T('margin-bottom:6pt;')+`<tr><td style="${ch}width:22%;font-weight:${wH};">Class: ${esc(s.klass)}</td><td style="${ch}width:38%;font-weight:${wH};">Subject: ${esc(s.subject)}</td><td style="${ch}width:20%;font-weight:${wH};">Total Marks: ${mk.total}</td><td style="${ch}width:20%;font-weight:${wH};">Time: ${esc(s.time)}</td></tr></table>`;
 const infoRow=()=>{const f=[];
  if(s.showName)f.push(['Name','____________________________']);
  if(s.showRoll)f.push(['Roll No','____________________']);
  if(s.showSection)f.push(['Section',s.sectionVal.trim()?esc(s.sectionVal):'____________']);
  if(s.showDate!==false)f.push(['Date',s.date.trim()?esc(s.date):'________________']);
  if(!f.length)return'';const w=(100/f.length).toFixed(2);
  return T('margin:0 0 6pt;')+`<tr>${f.map(([k,v])=>`<td style="${cell}width:${w}%;font-weight:${wH};">${k}: ${v}</td>`).join('')}</tr></table>`;};
 if(s.infoPos==='top')h+=infoRow();
 const bar=(en,ur)=>{let x=T('margin-bottom:5pt;')+`<tr><td style="${cb}padding:${s.pad+2}pt;background:${sh};text-align:center;${base}font-size:${FS+1.5}pt;font-weight:${wB};letter-spacing:.5pt;">${esc(en)}`;
  if(bi)x+=`<div dir="rtl" lang="ur" style="font-family:'${UF}','Noto Nastaliq Urdu',serif;font-size:${US}pt;font-weight:${wB};letter-spacing:0;margin-top:2pt;">${esc(ur)}</div>`;
  return x+`</td></tr></table>`;};
 h+=dz('front');
 if(s.omr&&s.omrPos==='front')h+=omrHTML(s,showKey,screen);
 h+=bar(`PART-I  ·  OBJECTIVE  (${mk.mcq} Marks)`,'حصہ اول: معروضی سوالات');
 h+=T('margin-bottom:7pt;')+cg(g6);
 h+=ins(mcqEn,'سوال نمبر 1: درست جواب کا انتخاب کریں۔ اور ببل بھریں۔',GM);
 built.mcq.forEach((m,i)=>{
  const lay=layoutFor(m),z=zb(i),sk=screen?` data-slot="${m._key}"`:'',S=SN[m._key];
  let stem=`<tr${sk} style="${z}"><td style="${cc}font-weight:${wN};">${S.no}${pin(m)}${cross(m)}</td>`;
  if(bi)stem+=`<td${cs(GM,QE.nw,QE.B1)} style="${cell}font-weight:${wS};">${esc(m.en)}${tg('Ch '+m.ch)}</td><td${cs(GM,QE.B1,QE.R)} style="${uc}font-weight:${wS};">${esc(m.ur)}</td><td style="${uNum}font-weight:${wN};">${S.ur}</td>`;
  else stem+=`<td${cs(GM,QE.nw,100)} style="${cell}font-weight:${wS};">${esc(m.en)}${tg('Ch '+m.ch)}</td>`;
  h+=stem+'</tr>';
  const op=k=>{const o=m.o[k];if(!o)return{t:'',st:''};const key=showKey&&k===m.a;
   return{t:`${'ABCD'[k]}. ${esc(o[0])}${bi?ui(o[1]):''}${key?` <span style="font-family:Arial,sans-serif;font-size:${FS-2}pt;color:#046a38;font-weight:bold;">&#10003;</span>`:''}`,st:(key?'background:#e6f6ec;':'')+`font-weight:${wO};`};};
  if(lay===4){const o=[0,1,2,3].map(op);
   h+=`<tr${sk} style="${z}"><td style="${cc}"></td>${o.map((x,k)=>`<td${cs(GM,QE.nw+k*QE.q4,QE.nw+(k+1)*QE.q4)} style="${cell}${x.st}">${x.t}</td>`).join('')}<td style="${cc}"></td></tr>`;}
  else if(lay===2){for(let r=0;r<2;r++){const a=op(r*2),b=op(r*2+1);
   h+=`<tr${sk} style="${z}"><td style="${cc}"></td><td${cs(GM,QE.nw,QE.B1)} style="${cell}${a.st}">${a.t}</td><td${cs(GM,QE.B1,QE.R)} style="${cell}${b.st}">${b.t}</td><td style="${cc}"></td></tr>`;}}
  else{for(let k=0;k<4;k++){const a=op(k);
   h+=`<tr${sk} style="${z}"><td style="${cc}"></td><td${cs(GM,QE.nw,QE.R)} style="${cell}${a.st}">${a.t}</td><td style="${cc}"></td></tr>`;}}});
 h+='</table>'+dz('after');
 if(s.omr&&s.omrPos==='after')h+=omrHTML(s,showKey,screen);
 h+=bar(`PART-II  ·  SHORT QUESTIONS  (${mk.short} Marks)`,'حصہ دوم: مختصر سوالات');
 built.short.forEach(p=>{if(!p.items.length)return;
  const all=p.attempt>=p.items.length;
  const en=all?`Q. No. ${p.q}: Answer ALL ${NE[p.items.length]} (${p.items.length}) short questions.  (${p.items.length} × ${s.shortMark} = ${p.items.length*s.shortMark})`
   :`Q. No. ${p.q}: Write short answers to any ${NE[p.attempt]} (${p.attempt}) questions.  (${p.attempt} × ${s.shortMark} = ${p.attempt*s.shortMark})`;
  const ur=all?`سوال نمبر ${p.q}: تمام ${NU[p.items.length]} مختصر سوالات کے جوابات دیں۔`:`سوال نمبر ${p.q}: کوئی سے ${NU[p.attempt]} مختصر سوالات کے جوابات دیں۔`;
  QE=qEdges(s,bi,en);GT=mkGrid(QE.two,100);g4=GT.cols;
  h+=T('margin-bottom:7pt;')+cg(g4)+ins(en,ur,GT);
  p.items.forEach((q,i)=>{const sk=screen?` data-slot="${q._key}"`:'',S=SN[q._key];
   h+=`<tr${sk} style="${zb(i)}"><td style="${cc}font-weight:${wN};">${S.no}${pin(q)}${cross(q)}</td><td${cs(GT,QE.nw,bi?QE.B2:100)} style="${cell}font-weight:${wQ};">${esc(q.en)}${tg('Ch '+q.ch)}</td>`;
   if(bi)h+=`<td${cs(GT,QE.B2,QE.R)} style="${uc}font-weight:${wQ};">${esc(q.ur)}</td><td style="${uNum}font-weight:${wN};">${S.ur}</td>`;
   h+='</tr>';});
  h+='</table>';});
 h+=dz('mid');
 if(s.omr&&s.omrPos==='mid')h+=omrHTML(s,showKey,screen);
 const first=2+state.shortParts,last=first+built.long.length-1;
 h+=bar(`PART-III  ·  DETAILED QUESTIONS  (${mk.long} Marks)`,'حصہ سوم: تفصیلی سوالات');
 const allL=state.longAttempt>=built.long.length;
 const len=allL?`Q. No. ${first}${built.long.length>1?' to '+last:''}: Attempt ALL ${NE[built.long.length]} (${built.long.length}) detailed questions.  (${built.long.length} × ${s.longMark} = ${mk.long})`
  :`Q. No. ${first}${built.long.length>1?' to '+last:''}: Attempt any ${NE[state.longAttempt]} (${state.longAttempt}) detailed questions.  (${state.longAttempt} × ${s.longMark} = ${mk.long})`;
 const lur=allL?`سوال نمبر ${first} تا ${last}: تمام ${NU[built.long.length]} تفصیلی سوالات کے جوابات دیں۔`:`سوال نمبر ${first} تا ${last}: کوئی سے ${NU[state.longAttempt]} تفصیلی سوالات کے جوابات دیں۔`;
 QE=qEdges(s,bi,len);GT=mkGrid(QE.two,100);g4=GT.cols;
 h+=T('margin-bottom:5pt;')+cg(g4)+ins(len,lur,GT);
 built.long.forEach((q,i)=>{const sk=screen?` data-slot="${q._key}"`:'',S=SN[q._key];
  h+=`<tr${sk} style="${zb(i)}"><td style="${cc}font-weight:${wN};">${S.no}${pin(q)}${cross(q)}</td><td${cs(GT,QE.nw,bi?QE.B2:100)} style="${cell}font-weight:${wL};">${esc(q.en)}${tg('Ch '+q.ch)}</td>`;
  if(bi)h+=`<td${cs(GT,QE.B2,QE.R)} style="${uc}font-weight:${wL};">${esc(q.ur)}</td><td style="${uNum}font-weight:${wN};">${S.ur}</td>`;
  h+='</tr>';});
 h+='</table>'+dz('end');
 if(s.omr&&s.omrPos==='end')h+=omrHTML(s,showKey,screen);
 if(s.infoPos==='bottom')h+=infoRow();
 if(s.footer)h+=`<div style="${base}font-size:${FS-2}pt;text-align:center;margin-top:8pt;${s.hideLines?'':'border-top:'+BD+';'}padding-top:4pt;">Paper CS${state.grade}-${s.alp?'ALP':'FULL'} / V-${String(s.seed).padStart(2,'0')} &nbsp;·&nbsp; ${esc(plan.sch.name)} &nbsp;·&nbsp; Examiner: ____________________</div>`;
 return h;
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
  if(s.omrUrdu&&s.showUrdu)h+=`<span dir="rtl" lang="ur" style="font-family:'${s.urFont}','Noto Nastaliq Urdu',serif;font-size:${s.urSize+1}pt;"> &nbsp;(اُمیدوار خود پُر کرے)</span>`;
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
</head><body><div class="Section1">${paperInner(s,'export')}</div></body></html>`;}

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
let media=[],rid=2,mediaMap=new Map(); /* rId1/rId2 belong to styles & settings, so images start at rId3 */
function addMedia(bytes,ext){if(mediaMap.has(bytes))return mediaMap.get(bytes);rid++;const n='image'+rid+'.'+ext,r={rid:'rId'+rid,href:'media/'+n,name:'word/media/'+n,data:bytes};media.push(r);mediaMap.set(bytes,r);return r;} /* the relationship list reads rid/href from these records */
function imgXml(m,cx,cy,id,name){return `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="${id}" name="${X(name)}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${id}" name="${X(name)}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${m.rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;}
function run(t,o){o=o||{};const f=o.font||(o.ur?state.urFont:state.enFont),sz=Math.max(2,Math.round((o.sz||(o.ur?state.urSize:state.enSize))*2));
 let p='<w:rPr>'+`<w:rFonts w:ascii="${X(f)}" w:hAnsi="${X(f)}" w:cs="${X(f)}" w:eastAsia="${X(f)}"/>`;
 if(o.b)p+='<w:b/><w:bCs/>';p+=`<w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/>`;if(o.ur)p+='<w:rtl/><w:lang w:bidi="ur-PK"/>';p+='</w:rPr>';
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
 if(o.bd){const z=Math.max(2,Math.round(state.borderW*8)),e=(k,on)=>on?`<w:${k} w:val="single" w:sz="${z}" w:space="0" w:color="000000"/>`:`<w:${k} w:val="nil"/>`;p+=`<w:tcBorders>${e('top',o.bd.t)}${e('left',o.bd.l)}${e('bottom',o.bd.b)}${e('right',o.bd.r)}</w:tcBorders>`;}
 if(o.noBorder)p+='<w:tcBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/></w:tcBorders>';
 p+='</w:tcPr>';let body=content||'';
 if(!body)body=para('',{exact:1});else if(/<\/w:tbl>$/.test(body))body+=para('',{exact:1});
 return `<w:tc>${p}${body}</w:tc>`;}
function tr(cells){return `<w:tr><w:trPr><w:cantSplit/></w:trPr>${cells.join('')}</w:tr>`;}
function pageBreak(){return '<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="20" w:lineRule="exact"/></w:pPr><w:r><w:br w:type="page"/></w:r></w:p>';}
function buildDocx(raw){
 media=[];rid=2;mediaMap=new Map();
 const s=state,bi=s.showUrdu,mk=plan.marks,pg=PAGES[s.page],SN=serials();
 const W=tw(pg.w),H=tw(pg.h),M=tw(s.margin),CW=W-2*M;
 const mcqEn=`Q. No. 1: Choose the Best option and fill the Bubble.  (${built.mcq.length} × ${s.mcqMark} = ${mk.mcq})`;
 let QE=qEdges(s,bi,mcqEn),GM=mkGrid(QE.mcq,CW,true),GT=mkGrid(QE.two,CW,true),grid6=GM.cols,grid4=GT.cols;
 const CWX=(G,a,b)=>{const n=G.sp(a,b),o={w:G.w(a,b)};if(n>1)o.span=n;return o;},VA=s.vAlign==='middle'?'center':'top',SA=s.serAlign==='top'?'top':'center';
 const shd=s.shade?'E9E4D6':null,zeb=i=>s.zebra&&i%2===1?'F7F4EA':null;
 const Bx=[];const push=x=>Bx.push(x),spacer=pt=>push(para('',{exact:Math.max(1,pt||4)}));
 const titleRuns=()=>{let r='';
  if(s.institute.trim())r+=para(run(s.institute,{b:s.bHeader,sz:s.enSize+5}),{align:'center',after:1,lh:1.1});
  r+=para(run(s.title,{b:s.bHeader,sz:s.enSize+1}),{align:'center',after:1,lh:1.1});
  if(bi)r+=para(run((s.subjectUr?s.subjectUr+' — ':'')+(state.grade===9?'جماعت نہم':'جماعت دہم'),{ur:true,b:s.bHeader,sz:s.urSize+1}),{bidi:true,align:'center',after:2,lh:1.5});
  return r;};
 if(s.logo&&logoPNG){const m=addMedia(logoPNG.bytes,'png'),cy=emu(s.logoH),cx=Math.round(cy*(logoPNG.ratio||1));
  const ip=para(imgXml(m,cx,cy,900,'Institute logo'),{align:'center',after:3,lh:1});
  if(s.logoPos==='center'){push(ip);push(titleRuns());}
  else{const lw=Math.round(cx/635)+240,tw2=CW-lw,lc=tc(ip,{w:lw,valign:'center',noBorder:true}),tcell=tc(titleRuns(),{w:tw2,valign:'center',noBorder:true});
   push(tbl([lw,tw2],[tr(s.logoPos==='left'?[lc,tcell]:[tcell,lc])],{borders:false,pad:0}));}
 }else push(titleRuns());
 spacer(4);
 {const a=Math.round(CW*.22),b2=Math.round(CW*.38),c=Math.round(CW*.20),d=CW-a-b2-c,g=[a,b2,c,d];
  const items=['Class: '+s.klass,'Subject: '+s.subject,'Total Marks: '+mk.total,'Time: '+s.time];
  push(tbl(g,[tr(items.map((t,i)=>tc(txtP(t,{b:s.bHeader,align:'center'}),{w:g[i],valign:VA})))],{borders:!s.hideLines}));}
 const infoTbl=()=>{const f=[];
  if(s.showName)f.push('Name: ____________________________');
  if(s.showRoll)f.push('Roll No: ____________________');
  if(s.showSection)f.push('Section: '+(s.sectionVal.trim()?s.sectionVal:'____________'));
  if(s.showDate!==false)f.push('Date: '+(s.date.trim()?s.date:'________________'));
  if(!f.length)return'';const n=f.length,g=[];let acc=0;
  for(let i=0;i<n;i++){const w=i===n-1?CW-acc:Math.round(CW/n);g.push(w);acc+=w;}
  return tbl(g,[tr(f.map((t,i)=>tc(txtP(t,{b:s.bHeader}),{w:g[i]})))],{borders:!s.hideLines});};
 if(s.infoPos==='top'){spacer(4);push(infoTbl());}
 spacer(5);
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
if(s.omr&&s.omrPos==='front'){omrBlock();spacer(5);}
 bar(`PART-I  ·  OBJECTIVE  (${mk.mcq} Marks)`,'حصہ اول: معروضی سوالات');
 {const rows=[insRow(GM,mcqEn,'سوال نمبر 1: درست جواب کا انتخاب کریں۔ اور ببل بھریں۔')];
  built.mcq.forEach((m,i)=>{const S=SN[m._key],z=zeb(i),cell=(a,b,body,o)=>tc(body,Object.assign(CWX(GM,a,b),{shd:z},o||{}));
   const cells=[cell(0,QE.nw,txtP(S.no,{b:s.bNum,align:'center'}),{valign:SA})];
   if(bi){cells.push(cell(QE.nw,QE.B1,txtP(m.en,{b:s.bStem})));cells.push(cell(QE.B1,QE.R,txtP(m.ur,{ur:true,b:s.bStem})));cells.push(cell(QE.R,100,txtP(S.ur,{ur:true,b:s.bNum,align:'center'}),{valign:SA}));}
   else cells.push(cell(QE.nw,100,txtP(m.en,{b:s.bStem})));
   rows.push(tr(cells));
   const optRuns=k=>{const o=m.o[k];if(!o)return'';let r=run('ABCD'[k]+'. '+o[0],{b:s.bOpt});if(bi&&o[1])r+=run('  '+o[1],{ur:true,b:s.bOpt});return r;};
   const lay=layoutFor(m);
   if(lay===4){const c=[cell(0,QE.nw,'')];for(let k=0;k<4;k++)c.push(cell(QE.nw+k*QE.q4,QE.nw+(k+1)*QE.q4,para(optRuns(k))));c.push(cell(QE.R,100,''));rows.push(tr(c));}
   else if(lay===2){for(let r=0;r<2;r++)rows.push(tr([cell(0,QE.nw,''),cell(QE.nw,QE.B1,para(optRuns(r*2))),cell(QE.B1,QE.R,para(optRuns(r*2+1))),cell(QE.R,100,'')]));}
   else{for(let k=0;k<4;k++)rows.push(tr([cell(0,QE.nw,''),cell(QE.nw,QE.R,para(optRuns(k))),cell(QE.R,100,'')]));}});
  push(tbl(grid6,rows,{borders:!s.hideLines}));}
 spacer(6);
 if(s.omr&&s.omrPos==='after'){omrBlock();spacer(5);}
 bar(`PART-II  ·  SHORT QUESTIONS  (${mk.short} Marks)`,'حصہ دوم: مختصر سوالات');
 built.short.forEach(p=>{if(!p.items.length)return;
  const all=p.attempt>=p.items.length;
  const en=all?`Q. No. ${p.q}: Answer ALL ${NE[p.items.length]} (${p.items.length}) short questions.  (${p.items.length} × ${s.shortMark} = ${p.items.length*s.shortMark})`
   :`Q. No. ${p.q}: Write short answers to any ${NE[p.attempt]} (${p.attempt}) questions.  (${p.attempt} × ${s.shortMark} = ${p.attempt*s.shortMark})`;
  const ur=all?`سوال نمبر ${p.q}: تمام ${NU[p.items.length]} مختصر سوالات کے جوابات دیں۔`:`سوال نمبر ${p.q}: کوئی سے ${NU[p.attempt]} مختصر سوالات کے جوابات دیں۔`;
  QE=qEdges(s,bi,en);GT=mkGrid(QE.two,CW,true);const g=GT.cols,rows=[insRow(GT,en,ur)];
  p.items.forEach((q,i)=>{const S=SN[q._key],z=zeb(i),cell=(a,b,body,o)=>tc(body,Object.assign(CWX(GT,a,b),{shd:z},o||{}));
   const c=[cell(0,QE.nw,txtP(S.no,{b:s.bNum,align:'center'}),{valign:SA}),cell(QE.nw,bi?QE.B2:100,txtP(q.en,{b:s.bShort}))];
   if(bi){c.push(cell(QE.B2,QE.R,txtP(q.ur,{ur:true,b:s.bShort})));c.push(cell(QE.R,100,txtP(S.ur,{ur:true,b:s.bNum,align:'center'}),{valign:SA}));}
   rows.push(tr(c));});
  push(tbl(g,rows,{borders:!s.hideLines}));spacer(6);});
 if(s.omr&&s.omrPos==='mid'){omrBlock();spacer(5);}
 const first=2+state.shortParts,last=first+built.long.length-1;
 bar(`PART-III  ·  DETAILED QUESTIONS  (${mk.long} Marks)`,'حصہ سوم: تفصیلی سوالات');
 {const allL=s.longAttempt>=built.long.length;
  const en=allL?`Q. No. ${first}${built.long.length>1?' to '+last:''}: Attempt ALL ${NE[built.long.length]} (${built.long.length}) detailed questions.  (${built.long.length} × ${s.longMark} = ${mk.long})`
   :`Q. No. ${first}${built.long.length>1?' to '+last:''}: Attempt any ${NE[s.longAttempt]} (${s.longAttempt}) detailed questions.  (${s.longAttempt} × ${s.longMark} = ${mk.long})`;
  const ur=allL?`سوال نمبر ${first} تا ${last}: تمام ${NU[built.long.length]} تفصیلی سوالات کے جوابات دیں۔`:`سوال نمبر ${first} تا ${last}: کوئی سے ${NU[s.longAttempt]} تفصیلی سوالات کے جوابات دیں۔`;
  QE=qEdges(s,bi,en);GT=mkGrid(QE.two,CW,true);const g=GT.cols,rows=[insRow(GT,en,ur)];
  built.long.forEach((q,i)=>{const S=SN[q._key],z=zeb(i),cell=(a,b,body,o)=>tc(body,Object.assign(CWX(GT,a,b),{shd:z},o||{}));
   const c=[cell(0,QE.nw,txtP(S.no,{b:s.bNum,align:'center'}),{valign:SA}),cell(QE.nw,bi?QE.B2:100,txtP(q.en,{b:s.bLong}))];
   if(bi){c.push(cell(QE.B2,QE.R,txtP(q.ur,{ur:true,b:s.bLong})));c.push(cell(QE.R,100,txtP(S.ur,{ur:true,b:s.bNum,align:'center'}),{valign:SA}));}
   rows.push(tr(c));});
  push(tbl(g,rows,{borders:!s.hideLines}));}
 if(s.omr&&s.omrPos==='end'){spacer(5);omrBlock();}
 if(s.infoPos==='bottom'){spacer(6);push(infoTbl());}
 if(s.footer){spacer(8);push(txtP(`Paper CS${state.grade}-${s.alp?'ALP':'FULL'} / V-${String(s.seed).padStart(2,'0')}  ·  ${plan.sch.name}  ·  Examiner: ____________________`,{align:'center',sz:s.enSize-2}));}
 const sect=`<w:sectPr><w:pgSz w:w="${W}" w:h="${H}"/><w:pgMar w:top="${M}" w:right="${M}" w:bottom="${M}" w:left="${M}" w:header="0" w:footer="0" w:gutter="0"/><w:cols w:space="720"/><w:docGrid w:linePitch="360"/></w:sectPr>`;
 const doc=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>${Bx.join('')}${sect}</w:body></w:document>`;
 const styles=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="${X(s.enFont)}" w:hAnsi="${X(s.enFont)}" w:cs="${X(s.enFont)}"/><w:sz w:val="${Math.round(s.enSize*2)}"/><w:szCs w:val="${Math.round(s.enSize*2)}"/><w:lang w:val="en-US" w:bidi="ur-PK"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="${Math.round(s.lineH*240)}" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style></w:styles>`;
 const settings=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:zoom w:percent="100"/><w:defaultTabStop w:val="720"/><w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat></w:settings>`;
 const rels=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>${media.map(m=>`<Relationship Id="${m.rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${m.href}"/>`).join('')}</Relationships>`;
 const ct=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`;
 const rootRels=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`;
 const now=new Date().toISOString().replace(/\.\d+Z$/,'Z');
 const core=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${X(s.title)} — Computer Science ${state.grade}</dc:title><dc:subject>${X(s.subject)}</dc:subject><dc:creator>Paper Press</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created></cp:coreProperties>`;
 const app=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Paper Press</Application><Company>${X(s.institute)}</Company></Properties>`;
 const _files=[{name:'[Content_Types].xml',data:ct},{name:'_rels/.rels',data:rootRels},{name:'docProps/core.xml',data:core},{name:'docProps/app.xml',data:app},{name:'word/document.xml',data:doc},{name:'word/_rels/document.xml.rels',data:rels},{name:'word/styles.xml',data:styles},{name:'word/settings.xml',data:settings}].concat(media.map(m=>({name:m.name,data:m.data})));
  return raw?_files:zipStore(_files);
}

/* ══════════ ANALYSIS ══════════ */
function analyse(){
 const b=B(),sch=plan.sch,all=[];
 built.mcq.forEach(m=>all.push({ch:m.ch,txt:m.en+' '+m.o.map(o=>o[0]).join(' '),ex:m.ex}));
 built.short.forEach(p=>p.items.forEach(q=>all.push({ch:q.ch,txt:q.en,ex:q.ex})));
 built.long.forEach(q=>all.push({ch:q.ch,txt:q.en,ex:q.ex}));
 const hits=b.exRules.map(e=>({e,n:all.filter(a=>e.re.test(a.txt)).length}));
 const exItems=all.filter(a=>a.ex).length,conf=[];
 const am={};built.mcq.forEach(q=>am[q.ch]=(am[q.ch]||0)+1);
 const t=schemeTotals(sch);
 conf.push({label:'MCQ spread matches scheme',ok:state.mcqCount===t.mcq&&Object.keys(sch.mcq).every(c=>(am[c]||0)===(sch.mcq[c]||0)||!plan.chs.includes(+c)),got:state.mcqCount+'/'+t.mcq});
 conf.push({label:'Short parts × printed',ok:state.shortParts===t.parts&&t.printed.every(p=>p===state.shortPrinted),got:state.shortParts+'×'+state.shortPrinted});
 conf.push({label:'Attempt per short part',ok:built.short.every((p,i)=>p.attempt===(sch.short[i%sch.short.length].attempt)),got:built.short.map(p=>p.attempt).join('·')});
 const lok=built.long.length===sch.long.length&&built.long.every((q,i)=>sch.long[i].includes(q.ch));
 conf.push({label:'Long chapters follow scheme',ok:lok,got:built.long.map(q=>q.ch).join('·')});
 conf.push({label:'Paper totals '+t.total+' marks',ok:plan.marks.total===t.total,got:plan.marks.total+''});
 if(state.alp){conf.push({label:'Excluded unit '+b.alpEx.join(', ')+' absent',ok:!all.some(a=>b.alpEx.includes(a.ch)),got:all.some(a=>b.alpEx.includes(a.ch))?'present':'absent'});
  conf.push({label:'Excluded topics withheld',ok:exItems===0,got:exItems+' items'});}
 const crossN=built.slots.filter(s=>s.ch!==s.planCh).length;
 return{all,hits,exItems,conf,confOk:conf.filter(c=>c.ok).length,items:all.length,crossN};
}
const CHK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';
const WRN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l9.5 17H2.5z"/><path d="M12 9v5M12 17.4v.1"/></svg>';
function paintLedger(){
 const a=analyse(),mk=plan.marks,b=B(),sch=plan.sch,np=Object.keys(overrides).length,t=schemeTotals(sch);
 $('tMarks').textContent=mk.total;$('tItems').textContent=a.items;$('tPins').textContent=np;
 $('ledTotal').textContent=mk.total;
 const ts=built.short.reduce((x,p)=>x+p.items.length,0);
 $('ledStruct').textContent=`${built.mcq.length} MCQ · ${ts} short · ${built.long.length} long`;
 $('barA').style.flexGrow=Math.max(1,mk.mcq);$('barA').textContent=mk.mcq;
 $('barB').style.flexGrow=Math.max(1,mk.short);$('barB').textContent=mk.short;
 $('barC').style.flexGrow=Math.max(1,mk.long);$('barC').textContent=mk.long;
 $('schName').textContent=sch.name;
 const first=2+state.shortParts;
 $('schRows').innerHTML=
  `<div class="row"><div class="pip"></div><div class="nm">MCQ weighting</div><div class="ct"><b>${Object.keys(sch.mcq).filter(c=>sch.mcq[c]>0).sort((x,y)=>x-y).map(c=>'C'+c+'×'+sch.mcq[c]).join(' ')}</b></div></div>`
  +sch.short.map((p,i)=>`<div class="row"><div class="pip"></div><div class="nm">Q.${i+2} short</div><div class="ct"><b>${Object.keys(p.ch).filter(c=>p.ch[c]>0).sort((x,y)=>x-y).map(c=>'C'+c+'×'+p.ch[c]).join(' ')}</b> · try ${p.attempt}</div></div>`).join('')
  +sch.long.map((al,i)=>`<div class="row"><div class="pip ${al.length>1?'mag':''}"></div><div class="nm">Q.${first+i} long ${al.length>1?'(either)':'(compulsory)'}</div><div class="ct"><b>Ch ${al.join(' or ')}</b></div></div>`).join('')
  +`<div class="row"><div class="pip off"></div><div class="nm">Scheme total</div><div class="ct"><b>${t.total}</b> marks</div></div>`;
 const am={},as={},al={};
 built.mcq.forEach(q=>am[q.ch]=(am[q.ch]||0)+1);
 built.short.forEach(p=>p.items.forEach(q=>as[q.ch]=(as[q.ch]||0)+1));
 built.long.forEach(q=>al[q.ch]=(al[q.ch]||0)+1);
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
 $('longRows').innerHTML=built.long.map((q,i)=>`<div class="row"><div class="pip"></div><div class="nm">Q.${first+i} · Ch ${q.ch} ${b.names[q.ch]}</div><div class="ct"><b>${state.longMark}</b></div></div>`).join('');
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
 let est=Math.max(1,Math.ceil(($('sheet').offsetHeight||900)/usable));if(state.omr&&state.omrNewPage)est++;
 $('tagPages').textContent=`${pg.label} · ${est} sheet${est>1?'s':''}`;
 $('tagSeed').textContent='Set V-'+String(state.seed).padStart(2,'0');
 $('tagStruct').textContent=`${built.mcq.length} MCQ · ${ts} Short · ${built.long.length} Long`;
 $('tagScheme').textContent=sch.name;
 const imgCount=(state.omr?built.mcq.length*4:0)+(state.logo&&logoPNG?1:0);
 $('srcNote').innerHTML=`<b>.docx ready.</b> ${a.items} questions · ${imgCount} images · Urdu <b>${state.urSize}pt</b>, English <b>${state.enSize}pt</b>.<br><br>Scheme <u>${esc(sch.name)}</u>. Serials on <u>both sides</u>, no marks column. Lines <u>${state.hideLines?'hidden':'visible'}</u>. Margin <b>${state.margin}pt</b>. OMR at <b>${ZLABEL[state.omrPos]}</b>.${a.crossN?` <b>${a.crossN}</b> cross-chapter pick${a.crossN>1?'s':''}.`:''}`;
 $('stampTitle').textContent=good?'SCHEME COMPLIANT':'PAPER READY';
 $('stampSub').textContent=`CLASS ${state.grade} · ${mk.total} MARKS · V-${String(state.seed).padStart(2,'0')}`;
 $('modeBadge').classList.toggle('off',!state.alp);
 $('modeTxt').textContent=state.alp?'ALP On':'Full Book';
 $('gBadge').textContent='Class '+b.name;
}

/* ══════════ PRESETS ══════════ */
const allPresets=()=>FACTORY.concat(presets);
function presetMarks(p){const c=p.cfg;
 const mc=(c.mcqCount!=null?c.mcqCount:state.mcqCount)*(c.mcqMark!=null?c.mcqMark:state.mcqMark);
 const att=c.shortAttempts||state.shortAttempts,parts=c.shortParts!=null?c.shortParts:state.shortParts,sm=c.shortMark!=null?c.shortMark:state.shortMark;
 let sh=0;for(let i=0;i<parts;i++)sh+=(att[i]||0)*sm;
 return mc+sh+(c.longAttempt!=null?c.longAttempt:state.longAttempt)*(c.longMark!=null?c.longMark:state.longMark);}
function savePresets(){LS.set('pp.presets.v7',presets);}
function captureConfig(sc){const cfg={};sc.forEach(s=>SCOPES[s].keys.forEach(k=>{cfg[k]=JSON.parse(JSON.stringify(state[k]));}));return cfg;}
function applyPreset(p){if(!p)return;
 const gBefore=state.grade;
 p.scopes.forEach(s=>SCOPES[s].keys.forEach(k=>{if(p.cfg[k]!==undefined)state[k]=JSON.parse(JSON.stringify(p.cfg[k]));}));
 if(state.grade!==gBefore){overrides={};sticky={};activeSlot=null;}
 if(!BOOKS[state.grade])state.grade=9;
 state.chapters=(state.chapters||[]).filter(c=>BOOKS[state.grade].chapters.includes(c));
 if(!state.chapters.length)state.chapters=BOOKS[state.grade].alpCh.slice();
 if(!allSchemes().some(s=>s.id===state.schemeId&&s.grade===state.grade))state.schemeId=offFor(state.grade).id;
 state.presetId=p.id;state.dirty=false;
 if(state.logo&&!logoPNG)rasterizeLogo(state.logo).then(x=>{logoPNG=x;syncUI();});
 buildChips();render();if(state.autoFit)fitZoom();
 toast('Applied “'+p.name+'”','ok');}
function renderPresets(){
 let list=allPresets().slice();
 if(preFilter==='mine')list=list.filter(p=>!p.factory);
 else if(preFilter==='factory')list=list.filter(p=>p.factory);
 else if(preFilter==='g9')list=list.filter(p=>(p.cfg.grade||p.grade)===9);
 else if(preFilter==='g10')list=list.filter(p=>(p.cfg.grade||p.grade)===10);
 if(preQuery.trim()){const q=preQuery.toLowerCase();list=list.filter(p=>(p.name+' '+(p.note||'')).toLowerCase().includes(q));}
 if(preSort==='name')list.sort((a,b)=>a.name.localeCompare(b.name));
 else if(preSort==='marks')list.sort((a,b)=>presetMarks(b)-presetMarks(a));
 else if(preSort==='grade')list.sort((a,b)=>(a.cfg.grade||a.grade)-(b.cfg.grade||b.grade));
 else list.sort((a,b)=>(b.created||0)-(a.created||0));
 $('preEm').textContent=presets.length+' saved';
 $('preList').innerHTML=list.length?list.map(p=>{const g=p.cfg.grade||p.grade||state.grade,sel=preSel.has(p.id);
  return `<div class="pcard ${state.presetId===p.id?'active':''} ${sel?'sel':''}" data-pid="${p.id}">
   <div class="pr1"><div class="pchk ${sel?'on':''}" data-chk="${p.id}">✓</div><div class="pn">${esc(p.name)}</div><span class="pbadge ${p.factory?'f':'u'}">${p.factory?'Factory':'Mine'}</span><span class="pbadge g${g}">${g}th</span></div>
   <div class="pmeta"><span><b>${presetMarks(p)}</b> marks</span><span>${p.scopes.length}/${ALLSC.length} groups</span></div>
   ${p.note?`<div class="pnote">${esc(p.note)}</div>`:''}
   <div class="pacts"><button class="pab go" data-apply="${p.id}">Apply</button><button class="pab" data-dup="${p.id}">Copy</button><button class="pab" data-edit="${p.id}" ${p.factory?'disabled':''}>Edit</button><button class="pab del" data-del="${p.id}" ${p.factory?'disabled':''}>Delete</button></div>
  </div>`;}).join(''):'<div class="empty">No presets match.<br>Save your current setup to start your library.</div>';
 $('bulkBar').classList.toggle('hidden',preSel.size===0);
 $('bulkTxt').textContent=preSel.size+' selected';}
function deletePresets(ids){
 const removed=presets.filter(p=>ids.includes(p.id));
 if(!removed.length){toast('Factory presets cannot be deleted.','warn');return;}
 lastDeleted=removed.map(p=>({p,i:presets.indexOf(p)}));
 presets=presets.filter(p=>!ids.includes(p.id));ids.forEach(i=>preSel.delete(i));
 if(ids.includes(state.presetId)){state.presetId='';state.dirty=true;}
 savePresets();renderPresets();paintLedger();
 toast(removed.length+' preset'+(removed.length>1?'s':'')+' deleted','mag',{label:'Undo',fn(){
  lastDeleted.sort((a,b)=>a.i-b.i).forEach(({p,i})=>presets.splice(Math.min(i,presets.length),0,p));
  lastDeleted=null;savePresets();renderPresets();paintLedger();toast('Restored','ok');}});}

/* ══════════ RENDER ══════════ */
const sheet=$('sheet'),wrap=$('sheetwrap'),stage=$('stage'),qtools=$('qtools');
function render(){plan=makePlan();built=build();const pg=PAGES[state.page];
 sheet.style.width=(pg.w*96/72)+'px';sheet.style.padding=(state.margin*96/72)+'px';
 sheet.innerHTML=paperInner(state,'screen');
 bindSheet();applyZoom();paintLedger();syncUI();updatePrint();saveState();}
function repaint(){plan=makePlan();built=build();const pg=PAGES[state.page];
 sheet.style.padding=(state.margin*96/72)+'px';sheet.innerHTML=paperInner(state,'screen');
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
 if(drawerQuery.trim()){const q=drawerQuery.toLowerCase();items=items.filter(x=>(x.en+' '+x.ur).toLowerCase().includes(q));}
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
  if(s.type==='mcq')opts=`<div class="popts">${q.o.map((o,k)=>`<div class="popt ${k===q.a?'ok':''}">${'ABCD'[k]}. ${esc(o[0])}${k===q.a?' ✓':''}</div>`).join('')}</div>`;
  return `<div class="qcard ${q._cur?'cur':''} ${q._dis?'dis':''}" data-qid="${q.id}">
   <div class="qtop"><span class="chb ${cross?'other':''}">Ch ${q.ch} · ${esc(b.names[q.ch])}</span></div>
   <div class="en">${esc(q.en)}</div><div class="ur">${esc(q.ur)}</div>${opts}
   <div class="pbadges">${q._cur?'<span class="pbg cur">In this slot</span>':''}${q._dis?'<span class="pbg used">Already on paper</span>':''}${q.ex?'<span class="pbg ex">ALP excluded</span>':''}${overrides[drawerSlot]===q.id?'<span class="pbg cur">Pinned</span>':''}${cross&&!q._cur?'<span class="pbg used">Cross-chapter</span>':''}</div>
  </div>`;}).join(''):'<div class="empty">Nothing matches this view.<br>Widen the chapter filter, clear the search, or allow excluded items.</div>';}
$('dSearch').addEventListener('input',e=>{drawerQuery=e.target.value;renderPicker();});
$('dChap').addEventListener('change',e=>{drawerCh=e.target.value;renderPicker();});
$('dEx').addEventListener('click',()=>{drawerEx=!drawerEx;$('dEx').classList.toggle('on',drawerEx);renderPicker();
 if(drawerEx)toast('ALP-excluded questions visible — picking one is flagged in the blueprint.','warn');});
document.querySelectorAll('#dFilter button').forEach(b=>b.addEventListener('click',()=>{
 drawerFilter=b.dataset.v;document.querySelectorAll('#dFilter button').forEach(x=>x.classList.toggle('on',x===b));renderPicker();}));
$('dList').addEventListener('click',e=>{const c=e.target.closest('.qcard');if(!c||c.classList.contains('dis'))return;
 overrides[drawerSlot]=c.dataset.qid;delete sticky[drawerSlot];markDirty();
 const k=drawerSlot;closeDrawer();repaint();flash(k);
 const s=slotMap[k];toast(s.label+' ← Chapter '+s.ch+(s.ch!==s.planCh?' (cross-chapter)':''),'ok');});

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
  if(p){p.name=name;p.note=note;p.scopes=sc;p.cfg=captureConfig(sc);p.grade=state.grade;p.updated=Date.now();toast('Preset updated','ok');}
  else{const np={id:uid('p'),name,note,factory:false,grade:state.grade,scopes:sc,cfg:captureConfig(sc),created:Date.now(),updated:Date.now()};
   presets.unshift(np);state.presetId=np.id;state.dirty=false;toast('Saved “'+name+'”','ok');}
  savePresets();renderPresets();paintLedger();closeDrawer();});
 openDrawer();setTimeout(()=>$('pfName').focus(),320);}

/* ══════════ SCHEME EDITOR ══════════ */
function openSchemeEditor(id){
 const src=id?allSchemes().find(s=>s.id===id):null;
 schEditId=src&&!src.factory?src.id:null;
 schDraft=src?JSON.parse(JSON.stringify(src)):{id:uid('s'),grade:state.grade,factory:false,name:'',note:'',
  mcq:Object.fromEntries(B().alpCh.map(c=>[c,1])),mcqMark:1,
  short:[{ch:{[B().alpCh[0]]:3,[B().alpCh[1]||B().alpCh[0]]:3},attempt:4},{ch:{},attempt:4},{ch:{},attempt:4}],shortMark:2,
  long:[[B().alpCh[0]],[B().alpCh[1]||B().alpCh[0]],[B().alpCh[2]||B().alpCh[0]]],longAttempt:2,longMark:8};
 if(!src){const chs=B().alpCh;schDraft.short=[{ch:{[chs[0]]:2,[chs[2]||chs[0]]:4},attempt:4},{ch:{[chs[1]]:1,[chs[3]||chs[1]]:2,[chs[5]||chs[1]]:3},attempt:4},{ch:{[chs[4]||chs[0]]:2,[chs[6]||chs[0]]:3,[chs[7]||chs[0]]:1},attempt:4}];}
 schDraft.grade=state.grade;
 drawerMode='scheme';drawerShow('form');
 $('dTitle').innerHTML=(src?(src.factory?'Copy official scheme':'Edit scheme'):'New pairing scheme')+'<small>Class '+state.grade+' · MCQ weighting · short parts · long slots</small>';
 renderSchemeForm();
 $('dFoot').innerHTML=`<button id="sfCancel">Cancel</button><button class="grn" id="sfSaveUse">Save &amp; use</button><button class="pri" id="sfSave">${schEditId?'Update':'Save'}</button>`;
 $('sfCancel').addEventListener('click',closeDrawer);
 $('sfSave').addEventListener('click',()=>saveScheme(false));
 $('sfSaveUse').addEventListener('click',()=>saveScheme(true));
 openDrawer();setTimeout(()=>{const n=$('sfName');if(n)n.focus();},320);}
function renderSchemeForm(){
 const d=schDraft,b=BOOKS[d.grade],chs=b.chapters,t=schemeTotals(d);
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
 else if(act==='addslot'){if(d.long.length>=6){toast('Maximum six long questions.','warn');return;}d.long.push([BOOKS[d.grade].alpCh[0]]);}
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
 d.updated=Date.now();
 if(schEditId){const i=customSchemes.findIndex(s=>s.id===schEditId);
  if(i>-1){d.id=schEditId;customSchemes[i]=JSON.parse(JSON.stringify(d));}
  toast('Scheme “'+d.name+'” updated','ok');}
 else{d.id=uid('s');d.factory=false;d.created=Date.now();customSchemes.unshift(JSON.parse(JSON.stringify(d)));
  toast('Scheme “'+d.name+'” created','ok');}
 saveSchemes();
 const id=d.id;closeDrawer();
 if(andUse)useScheme(id);else{syncUI();paintLedger();}
}

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
 if(state.showUrdu&&!fontInstalled(state.urFont))toast('“'+state.urFont+'” isn’t installed on this device. Word will substitute another font unless it is installed where you open the file.','warn');
 $('busy').classList.add('on');$('topExp').disabled=true;$('btnExp').disabled=true;
 await new Promise(r=>setTimeout(r,60));
 try{
  if(state.logo&&!logoPNG)logoPNG=await rasterizeLogo(state.logo);
  const bytes=await zipPack(buildDocx(true));
  const name=`CS${state.grade}-${state.alp?'ALP':'FULL'}-V${String(state.seed).padStart(2,'0')}-${plan.marks.total}marks.docx`;
  download(bytes,name,'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  stamp('DOCX SAVED',`${(bytes.length/1024).toFixed(0)} KB · ${plan.marks.total} MARKS`);
  toast('Saved '+name,'ok');
 }catch(err){console.error(err);toast('Could not build .docx — try the legacy .doc export.','err');}
 finally{$('busy').classList.remove('on');$('topExp').disabled=false;$('btnExp').disabled=false;exporting=false;}}
function doDoc(){download('\ufeff'+wordHtmlDoc(state),`CS${state.grade}-V${String(state.seed).padStart(2,'0')}.doc`,'application/msword;charset=utf-8');
 stamp('DOC SAVED',`${plan.marks.total} MARKS · LEGACY`);toast('Legacy .doc saved','info');}

/* ══════════ UI SYNC ══════════ */
function buildChips(){
 const b=B();
 $('chGrid').innerHTML=ALLCH.map(c=>{const has=b.chapters.includes(c),k=has?caps(c):{m:0,s:0,l:0};
  return `<div class="chip ${has?'':'lock'}" data-ch="${c}" data-lock="${state.alp&&B().alpEx.includes(c)?'ALP':'—'}"><b>${c}</b><small>${has?b.names[c]:'Not supplied'}</small><span class="cap">${k.m}·${k.s}·${k.l}</span></div>`;}).join('');
 $('chGrid').querySelectorAll('.chip').forEach(el=>el.addEventListener('click',()=>{
  const c=+el.dataset.ch,b2=B();
  if(!b2.chapters.includes(c)){toast('Chapter '+c+' was not supplied for Class '+state.grade+'.','warn');return;}
  if(state.alp&&B().alpEx.includes(c)){toast('Chapter 2 is fully excluded by ALP. Turn ALP off to use it.','warn');return;}
  const i=state.chapters.indexOf(c);
  if(i>-1){if(activeCh().length<=1){toast('Keep at least one chapter in the paper.','warn');return;}state.chapters.splice(i,1);}
  else state.chapters.push(c);
  markDirty();render();}));}
function buildAttempts(){
 $('attGrid').innerHTML=Array.from({length:state.shortParts},(_,i)=>
  `<div class="attrow"><div class="al">Part ${i+1} → <em>${state.shortAttempts[i]*state.shortMark} marks</em></div>
   <div class="stepper" data-att="${i}"><button data-d="-1">−</button><b>${state.shortAttempts[i]}</b><button data-d="1">+</button></div></div>`).join('');}
function buildLongSrc(){
 const first=2+state.shortParts,slots=plan.slots,b=B();
 $('longSrc').innerHTML=Array.from({length:state.longPrinted},(_,i)=>{
  const sl=slots[i%slots.length]||{allow:[],av:[]},cur=plan.longChs[i];
  const opts=sl.allow.length?sl.allow:sl.av;
  return `<div class="attrow"><div class="al">Q.${first+i} <em>${opts.length>1?'either':'fixed'}</em></div>
   <select data-long="${i}" style="width:150px;flex:none;height:28px;font-size:11px" ${opts.length<2?'disabled':''}>
   ${opts.map(c=>`<option value="${c}" ${c===cur?'selected':''}>Ch ${c} — ${esc(b.names[c]||'')}</option>`).join('')}
   </select></div>`;}).join('');
 $('vLongSrc').textContent=plan.longChs.slice(0,state.longPrinted).join(' · ');
 $('longSrc').querySelectorAll('[data-long]').forEach(sel=>sel.addEventListener('change',()=>{
  state.longPick[+sel.dataset.long]=+sel.value;markDirty();render();
  toast('Q.'+(first+ +sel.dataset.long)+' will print from Chapter '+sel.value,'ok');}));}
function syncUI(){
 const b=B(),sch=activeScheme(),t=schemeTotals(sch);
 document.querySelectorAll('#gradeCard button').forEach(x=>x.classList.toggle('on',+x.dataset.g===state.grade));
 $('bookEm').textContent=b.chapters.length+' chapters';
 $('alpCard').classList.toggle('off',!state.alp);$('alpCard').setAttribute('aria-checked',!!state.alp);
 $('alpTitle').textContent=state.alp?'ALP SMART SYLLABUS':'FULL TEXTBOOK';
 $('alpSub').textContent=state.alp?'Class '+state.grade+' exclusions + pairing active':'No exclusions · free chapter choice';
 $('alpDesc').innerHTML=state.alp
  ?(state.grade===9?'Chapter <b>2</b> locked out. Number systems, LARP &amp; debugging, CSS &amp; JavaScript and IPR withheld.':'Chapter <b>2</b> locked out. Process scheduling, visualization tools, linear regression and digital-ethics/legal content withheld.')
  :'Every supplied chapter including <b>2</b> is selectable and the complete bank is in play.';
 $('schSel').innerHTML=gradeSchemes(state.grade).map(s=>`<option value="${s.id}" ${s.id===sch.id?'selected':''}>${esc(s.name)}${s.factory?'':' ★'}</option>`).join('');
 $('schEm').textContent=sch.factory?'official':'custom';
 $('schHint').innerHTML=`<b>${t.mcq}</b> MCQ · <b>${t.parts}</b> short parts × <b>${Math.max(...t.printed)}</b> printed · <b>${sch.long.length}</b> long → <b>${t.total}</b> marks.<br>Long: ${sch.long.map((a,i)=>'Q'+(2+t.parts+i)+' <u>Ch '+a.join(' or ')+'</u>').join(' · ')}`;
 $('schDel').disabled=sch.factory;$('schEdit').textContent=sch.factory?'View / copy':'Edit';
 $('chGrid').querySelectorAll('.chip').forEach(el=>{const c=+el.dataset.ch,has=b.chapters.includes(c),k=has?caps(c):{m:0,s:0,l:0};
  el.classList.toggle('on',has&&state.chapters.includes(c)&&!(state.alp&&B().alpEx.includes(c)));
  el.classList.toggle('lock',!has||(state.alp&&B().alpEx.includes(c)));
  el.dataset.lock=!has?'—':'ALP';el.querySelector('.cap').textContent=`${k.m}·${k.s}·${k.l}`;});
 $('chEm').textContent=plan.chs.length+' / '+b.chapters.length;
 $('rMcq').value=state.mcqCount;$('vMcq').textContent=state.mcqCount;$('sMcq').textContent=state.mcqCount;
 $('selMcqMark').value=String(state.mcqMark);$('mcqEm').textContent=plan.marks.mcq+' marks';
 $('mcqHint').innerHTML=`Scheme wants <b>${t.mcq}</b>. Bank holds <b>${plan.maxM}</b>. Spread: `+plan.chs.map(c=>`C${c}×${plan.mcqAlloc[c]||0}`).join(' · ');
 $('sParts').textContent=state.shortParts;$('sPrint').textContent=state.shortPrinted;
 $('selShortMark').value=String(state.shortMark);
 $('vAtt').textContent=state.shortAttempts.slice(0,state.shortParts).join('·');
 $('shortEm').textContent=plan.marks.short+' marks';
 $('sLongP').textContent=state.longPrinted;$('sLongA').textContent=state.longAttempt;
 $('selLongMark').value=String(state.longMark);$('longEm').textContent=plan.marks.long+' marks';
 $('longHint').innerHTML=`Scheme slots: <u>${sch.long.map(a=>a.join('/')).join(' · ')}</u>. Bank holds <b>${plan.maxL}</b> long questions.`;
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
 $('iTime').value=state.time;$('iSubject').value=state.subject;$('iSubjectUr').value=state.subjectUr||'';$('iDate').value=state.date;$('iSection').value=state.sectionVal;
 $('selEn').value=state.enFont;$('selUr').value=state.urFont;
 $('rEn').value=state.enSize;$('vEn').textContent=state.enSize+' pt';
 $('rUr').value=state.urSize;$('vUr').textContent=state.urSize+' pt';
 $('rLh').value=state.lineH;$('vLh').textContent=state.lineH.toFixed(2);
 $('rPad').value=state.pad;$('vPad').textContent=state.pad+' pt';
 $('rBw').value=state.borderW;$('vBw').textContent=state.borderW+' pt';
 $('rNumW').value=state.numW;$('vNumW').textContent=state.numW+'%';$('rInsSplit').value=state.insSplit;$('rInsSplit').disabled=!!state.insAuto;$('vInsSplit').textContent=state.insAuto?'Auto':state.insSplit+'%';
 document.querySelectorAll('#segVAlign button').forEach(x=>x.classList.toggle('on',x.dataset.v===state.vAlign));document.querySelectorAll('#segSerAlign button').forEach(x=>x.classList.toggle('on',x.dataset.v===state.serAlign));
 $('bwWrap').classList.toggle('hidden',state.hideLines);
 $('lineEm').textContent=state.hideLines?'lines hidden':'lines visible';
 $('rMg').value=state.margin;$('vMg').textContent=state.margin+' pt';
 $('rZm').value=state.zoom;$('vZm').textContent=state.zoom+'%';
 document.querySelectorAll('#segOpt button').forEach(x=>x.classList.toggle('on',x.dataset.v===state.optMode));
 document.querySelectorAll('#segPage button').forEach(x=>x.classList.toggle('on',x.dataset.v===state.page));
 document.querySelectorAll('.rail .tg[data-tg]').forEach(t2=>{t2.classList.toggle('on',!!state[t2.dataset.tg]);t2.setAttribute('aria-checked',!!state[t2.dataset.tg]);});
 $('boldEm').textContent=['bHeader','bBar','bInstr','bNum','bStem','bOpt','bShort','bLong'].filter(k=>state[k]).length+' / 8';
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
document.querySelectorAll('#gradeCard button').forEach(b=>b.addEventListener('click',()=>{
 const g=+b.dataset.g;if(g===state.grade)return;
 state.grade=g;overrides={};sticky={};activeSlot=null;
 state.chapters=BOOKS[g].alpCh.slice();state.klass=BOOKS[g].name;syncSubject(g);
 state.schemeId=offFor(g).id;state.longPick={};
 applySchemeCounts(true);state.presetId='';state.dirty=true;
 buildChips();render();if(state.autoFit)fitZoom();
 toast('Class '+BOOKS[g].name+' — bank, ALP rules and official scheme reloaded','ok');}));
$('alpCard').addEventListener('click',()=>{
 state.alp=!state.alp;
 if(state.alp)state.chapters=state.chapters.filter(c=>!B().alpEx.includes(c));
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
 state.schemeId=offFor(state.grade).id;applySchemeCounts(true);render();
 toast('Scheme “'+removed.name+'” deleted','mag',{label:'Undo',fn(){customSchemes.splice(Math.min(i,customSchemes.length),0,removed);saveSchemes();useScheme(removed.id);toast('Scheme restored','ok');}});});
$('schOfficial').addEventListener('click',()=>useScheme(offFor(state.grade).id));
$('schExport').addEventListener('click',()=>{
 if(!customSchemes.length){toast('No custom schemes to export yet.','warn');return;}
 download(JSON.stringify({app:'PaperPress',kind:'schemes',version:7,schemes:customSchemes},null,2),'paper-press-schemes.json','application/json');
 toast(customSchemes.length+' scheme'+(customSchemes.length>1?'s':'')+' exported','ok');});
$('schImport').addEventListener('click',()=>$('schFile').click());
$('schFile').addEventListener('change',e=>{const f=e.target.files&&e.target.files[0];if(!f)return;
 const r=new FileReader();
 r.onload=()=>{try{const d=JSON.parse(r.result),arr=Array.isArray(d)?d:d.schemes;
  if(!Array.isArray(arr))throw 0;let n=0;
  arr.forEach(s=>{const cs=cleanScheme(s);if(cs){cs.created=Date.now();customSchemes.unshift(cs);n++;}});
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
$('rMcq').addEventListener('input',e=>{state.mcqCount=+e.target.value;markDirty();renderSoon();bump($('vMcq'));});
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
segWire('segOmrAlign','omrAlign');segWire('segOpt','optMode');segWire('segPage','page');segWire('segLogo','logoPos');segWire('segInfo','infoPos');segWire('segVAlign','vAlign');segWire('segSerAlign','serAlign');
document.querySelectorAll('#segOmrCols button').forEach(b=>b.addEventListener('click',()=>{state.omrCols=+b.dataset.v;markDirty();repaint();syncUI();}));
[['rOmrW','omrWidth','vOmrW',v=>v+'%'],['rGapT','omrGapT','vGapT',v=>v+'pt'],['rGapB','omrGapB','vGapB',v=>v+'pt'],
 ['rBub','bubSize','vBub',v=>v+' pt'],['rOmrPad','omrPad','vOmrPad',v=>v+' pt'],
 ['rLogo','logoH','vLogo',v=>v+' pt'],['rEn','enSize','vEn',v=>v+' pt'],['rUr','urSize','vUr',v=>v+' pt'],
 ['rLh','lineH','vLh',v=>v.toFixed(2)],['rPad','pad','vPad',v=>v+' pt'],['rBw','borderW','vBw',v=>v+' pt'],
 ['rNumW','numW','vNumW',v=>v+'%'],['rInsSplit','insSplit','vInsSplit',v=>v+'%'],['rMg','margin','vMg',v=>v+' pt']]
.forEach(([id,k,vid,f])=>{$(id).addEventListener('input',e=>{state[k]=parseFloat(e.target.value);$(vid).textContent=f(state[k]);bump($(vid));markDirty();(k==='margin'?repaint():repaintSoon());if(state.autoFit&&k==='margin')fitZoom();});});
$('rZm').addEventListener('input',e=>{state.zoom=+e.target.value;state.autoFit=false;$('vZm').textContent=state.zoom+'%';bump($('vZm'));applyZoom();});
document.querySelectorAll('.rail .tg[data-tg]').forEach(t=>t.addEventListener('click',()=>{
 const k=t.dataset.tg;state[k]=!state[k];markDirty();
 if(k==='qTools'&&!state.qTools){activeSlot=null;highlight();}
 render();}));
[['iInst','institute'],['iTitle','title'],['iClass','klass'],['iTime','time'],['iSubject','subject'],['iSubjectUr','subjectUr'],['iDate','date'],['iSection','sectionVal']]
.forEach(([id,k])=>$(id).addEventListener('input',e=>{state[k]=e.target.value;markDirty();repaintSoon();}));
$('selEn').addEventListener('change',e=>{state.enFont=e.target.value;markDirty();repaint();if(state.autoFit)fitZoom();});
$('selUr').addEventListener('change',e=>{state.urFont=e.target.value;markDirty();repaint();if(state.autoFit)fitZoom();});
$('sz11').addEventListener('click',()=>{state.enSize=11;state.urSize=11;markDirty();render();toast('English and Urdu both set to 11 pt','ok');});
$('szUr16').addEventListener('click',()=>{state.urSize=16;markDirty();render();toast('Urdu raised to 16 pt','ok');});
$('boldAll').addEventListener('click',()=>{['bHeader','bBar','bInstr','bNum','bStem','bOpt','bShort','bLong'].forEach(k=>state[k]=true);markDirty();render();});
$('boldNone').addEventListener('click',()=>{['bHeader','bBar','bInstr','bNum','bStem','bOpt','bShort','bLong'].forEach(k=>state[k]=false);markDirty();render();});
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
$('btnReset').addEventListener('click',()=>{state=JSON.parse(JSON.stringify(DEF));overrides={};sticky={};activeSlot=null;
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
  const np={id:uid('p'),name:src.name+' (copy)',note:src.note||'',factory:false,grade:src.cfg.grade||src.grade,scopes:src.scopes.slice(),cfg:JSON.parse(JSON.stringify(src.cfg)),created:Date.now(),updated:Date.now()};
  presets.unshift(np);savePresets();renderPresets();toast('Duplicated as “'+np.name+'”','ok');return;}
 const ed=e.target.closest('[data-edit]');if(ed&&!ed.disabled){openPresetForm(ed.dataset.edit);return;}
 const de=e.target.closest('[data-del]');if(de&&!de.disabled){deletePresets([de.dataset.del]);return;}
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
  if(Array.isArray(d.schemes))d.schemes.forEach(s=>{const cs=cleanScheme(s);if(cs)customSchemes.unshift(cs);});
  arr.forEach(p=>{if(!p||!p.name||!p.cfg)return;
   presets.unshift({id:uid('p'),name:String(p.name),note:String(p.note||''),factory:false,grade:p.grade||p.cfg.grade||9,
    scopes:Array.isArray(p.scopes)&&p.scopes.length?p.scopes.filter(s=>SCOPES[s]):ALLSC.slice(),cfg:cleanCfg(p.cfg),created:Date.now(),updated:Date.now()});n++;});
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
let _rq=0,_rf=0;
function _sched(){if(_rf)return;_rf=requestAnimationFrame(()=>{_rf=0;const m=_rq;_rq=0;if(m>=2)render();else if(m)repaint();});}
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
(function(){const GK='pp.groups.v2',gs=[...document.querySelectorAll('.rail .grp')];let open=LS.get(GK,null);
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
/* ══════════ BUG REPORTS (every report carries its own ID + diagnostics) ══════════ */
const APP_BUILD='v14 · 2026-11-21',ISSUES='https://github.com/Ugwattu/paper-press/issues';
function bugReport(){
 const s=state,b=BOOKS[s.grade],id='PP-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,6).toUpperCase();
 const sch=(typeof activeScheme==='function'&&activeScheme())||{},mk=plan&&plan.marks||{};
 const diag=['- App build: '+APP_BUILD,'- Browser: '+navigator.userAgent,'- Screen: '+innerWidth+'×'+innerHeight+' @'+(devicePixelRatio||1)+'x, theme '+document.documentElement.dataset.theme,
  '- Class: '+b.name+' · ALP '+(s.alp?'on':'off')+' · scheme: '+(sch.name||s.schemeId),'- Paper: seed '+s.seed+' · '+built.mcq.length+' MCQ / '+built.short.reduce((n,p)=>n+p.items.length,0)+' short / '+built.long.length+' long · '+(mk.total||'?')+' marks',
  '- Bilingual: '+(s.showUrdu?'yes':'no')+' · OMR: '+(s.omr?'yes ('+s.omrPos+')':'no')+' · page '+s.page+', margin '+s.margin+'pt · fonts '+s.enFont+' / '+s.urFont,
  '- Opened the .docx in: (Word / OnlyOffice / other?)'].join('\n');
 const body='**Report ID:** '+id+'\n\n**What happened?**\n\n\n**What did you expect instead?**\n\n\n**Steps to reproduce**\n1. \n2. \n\n<details><summary>Diagnostics (auto-filled — please keep)</summary>\n\n'+diag+'\n\n</details>\n';
 return{id,diag,body,url:ISSUES+'/new?title='+encodeURIComponent('['+id+'] ')+'&body='+encodeURIComponent(body)};}
(function(){const a=[$('btnBug'),$('bugLink')].filter(Boolean),upd=e=>{try{e.currentTarget.href=bugReport().url;}catch(x){e.currentTarget.href=ISSUES;}};
 a.forEach(el=>['pointerenter','focus','click','auxclick','contextmenu'].forEach(ev=>el.addEventListener(ev,upd)));
 const cp=$('btnCopyDiag');if(cp)cp.addEventListener('click',async()=>{const r=bugReport();try{await navigator.clipboard.writeText('Report ID: '+r.id+'\n'+r.diag);toast('Diagnostics copied ('+r.id+')','ok');}catch(e){toast('Could not copy — your browser blocked clipboard access.','warn');}});
 const bi=$('buildInfo');if(bi)bi.textContent='Build '+APP_BUILD;})();
/* ══════════ BACKUP & RESTORE ══════════
(function(){
 const MAGIC='paper-press-backup',info=$('backupInfo'),stamp=()=>{const t=LS.get('pp.lastBackup',null);info.textContent=t?'Last backup from this device: '+new Date(t).toLocaleString():'No backup made from this device yet.';};
 async function collect(){flushState();const data={};
  try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith('pp.')&&k!=='pp.lastBackup'){try{data[k]=JSON.parse(localStorage.getItem(k));}catch(e){data[k]=localStorage.getItem(k);}}}}catch(e){}
  return{app:MAGIC,version:1,created:new Date().toISOString(),data,logo:state.logo||await idbGet('logo')||''};}
 $('btnBackup').addEventListener('click',async()=>{const j=await collect(),n=Object.keys(j.data).length;
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(j)],{type:'application/json'}));a.download='paper-press-backup-'+new Date().toISOString().slice(0,10)+'.json';
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);LS.set('pp.lastBackup',Date.now());stamp();toast('Backup saved ('+n+' items'+(j.logo?' + logo':'')+')','ok');});
 $('btnRestore').addEventListener('click',()=>$('backupFile').click());
 $('backupFile').addEventListener('change',async e=>{const f=e.target.files&&e.target.files[0];e.target.value='';if(!f)return;
  if(f.size>8e6)return toast('That file is too large to be a Paper Press backup.','err');
  let j;try{j=JSON.parse(await f.text());}catch(x){return toast('That file is not valid JSON.','err');}
  if(!j||j.app!==MAGIC||!j.data||typeof j.data!=='object')return toast('This is not a Paper Press backup file.','err');
  const keys=Object.keys(j.data).filter(k=>/^pp\.[\w.\-]+$/.test(k)&&k!=='pp.lastBackup');
  if(!keys.length)return toast('The backup contains no data.','warn');
  if(!confirm('Restore '+keys.length+' saved items from this backup'+(j.created?' (made '+new Date(j.created).toLocaleString()+')':'')+'?\n\nThis replaces the current paper, presets and schemes on this device.'))return;
  window.__ppRestoring=true;
  try{
   const pr=j.data['pp.presets.v7'];if(Array.isArray(pr))pr.forEach(p=>{if(p&&p.cfg)p.cfg=cleanCfg(p.cfg);});
   const sc=j.data['pp.schemes.v7'];if(Array.isArray(sc))j.data['pp.schemes.v7']=sc.map(cleanScheme).filter(Boolean);
   const st=j.data['pp.state.v7'];if(st&&typeof st==='object'){st.logo='';}
   keys.forEach(k=>localStorage.setItem(k,JSON.stringify(j.data[k])));
   const lg=typeof j.logo==='string'&&/^data:image\/(png|jpe?g|gif|webp);base64,/.test(j.logo)&&j.logo.length<4e6?j.logo:'';
   await idbSet('logo',lg);
  }catch(x){window.__ppRestoring=false;return toast('Could not write the backup into browser storage.','err');}
  toast('Backup restored — reloading…','ok');setTimeout(()=>location.reload(),800);});
 stamp();})();
/* ══════════ KEYBOARD SHORTCUTS ══════════
const SHORTCUTS=[
 ['Ctrl / ⌘ + S','Save as .docx'],['Ctrl / ⌘ + P','Print / PDF'],['Ctrl / ⌘ + Z','Undo'],['Ctrl / ⌘ + Shift + Z','Redo'],
 ['S','Shuffle the paper'],['K','Show / hide answer key'],['B','Bilingual (Urdu column) on / off'],['O','OMR sheet on / off'],
 ['E','Question edit tools on / off'],['T','Chapter tags on / off'],['+  /  −','Zoom in / out'],['0','Zoom 100%'],['F','Fit paper to width'],
 ['[  /  ]','Collapse / expand all settings groups'],['1 – 5','Settings section: Paper · Header · Layout · Edit · Library'],['L','Show / hide the Blueprint panel'],['1 2 3','Settings · Paper · Blueprint (phone layout)'],['?','Show this list'],['Esc','Close panel / dialog']];
(function(){
 const dlg=$('keysDlg');
 $('keysList').innerHTML=SHORTCUTS.map(([k,d])=>`<kbd>${esc(k)}</kbd><span>${esc(d)}</span>`).join('');
 const open=()=>{if(dlg.showModal)dlg.showModal();else dlg.setAttribute('open','');};
 $('btnKeys').addEventListener('click',open);$('keysClose').addEventListener('click',()=>dlg.close?dlg.close():dlg.removeAttribute('open'));
 const flip=(k,label)=>{const el=document.querySelector('.tg[data-tg="'+k+'"]');if(!el)return;el.click();toast(label+(state[k]?' on':' off'),'info');};
 const zoomBy=d=>{state.autoFit=false;state.zoom=clamp(state.zoom+d,40,150);applyZoom();syncUI();saveState();};
 document.addEventListener('keydown',e=>{
  if(e.defaultPrevented)return;const mod=e.ctrlKey||e.metaKey,k=e.key,lk=k.toLowerCase();
  if(mod&&!e.altKey&&!e.shiftKey&&lk==='s'){e.preventDefault();doDocx();return;}
  if(mod&&!e.altKey&&!e.shiftKey&&lk==='p'){e.preventDefault();$('btnPrint').click();return;}
  if(mod||e.altKey||dlg.open)return;
  const t=e.target;if(t&&(t.tagName==='TEXTAREA'||t.tagName==='SELECT'||t.isContentEditable||(t.tagName==='INPUT'&&!['range','checkbox','button'].includes(t.type))))return;
  if(t&&t.getAttribute&&t.getAttribute('role')==='switch'&&k===' ')return;
  const tabs=getComputedStyle($('tabbar')).display!=='none';
  if(lk==='s')doShuffle();else if(lk==='k')$('miniKey').click();else if(lk==='b')flip('showUrdu','Bilingual');else if(lk==='o')flip('omr','OMR sheet');
  else if(lk==='e')flip('qTools','Edit tools');else if(lk==='t')flip('showTags','Chapter tags');else if(k==='+'||k==='=')zoomBy(10);else if(k==='-'||k==='_')zoomBy(-10);
  else if(k==='0')$('btn100').click();else if(lk==='f')$('btnFit').click();else if(k==='[')$('grpNone').click();else if(k===']')$('grpAll').click();
  else if(k==='?')open();else if(lk==='l')$('btnBP').click();else if(k.length===1&&'12345'.includes(k)){if(tabs){if(+k<4)$('tabbar').querySelectorAll('[data-tab]')[+k-1].click();else return;}else window.setPane(['paper','header','layout','edit','library'][+k-1]);}else return;
  e.preventDefault();});
})();
/* ══════════ BOOT ══════════ */
setTheme(LS.get('pp.theme',null)||(window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'));
customSchemes=LS.get('pp.schemes.v7',[]);
presets=LS.get('pp.presets.v7',[]);
const saved=LS.get('pp.state.v7',null);
if(saved&&!LS.get('pp.mig.ser14',false)){saved.serAlign='top';LS.set('pp.mig.ser14',true);}
if(saved&&typeof saved==='object'&&BOOKS[saved.grade]){
 state=Object.assign(JSON.parse(JSON.stringify(DEF)),saved);
 state.chapters=(state.chapters||[]).filter(c=>BOOKS[state.grade].chapters.includes(c));
 if(!state.chapters.length)state.chapters=BOOKS[state.grade].alpCh.slice();
 state.longPick=state.longPick||{};
}
if(!allSchemes().some(s=>s.id===state.schemeId&&s.grade===state.grade))state.schemeId=offFor(state.grade).id;
document.querySelectorAll('#segPreFilter button').forEach(x=>x.classList.toggle('on',x.dataset.v==='all'));
buildChips();render();histPush();
idbGet('logo').then(d=>{_logoLoaded=true;if(d&&!state.logo&&state.logoName){state.logo=d;rasterizeLogo(d).then(p=>{logoPNG=p;render();});}});
if(state.logo)rasterizeLogo(state.logo).then(p=>{logoPNG=p;syncUI();});
requestAnimationFrame(()=>{fitZoom();paintLedger();renderPresets();
 setTimeout(()=>toast('Long scheme: 9th Ch1 · Ch3 · Ch6/9 — 10th Ch1 · Ch4 · Ch6/8. Edit or add your own in Pairing Scheme.','ok'),800);});