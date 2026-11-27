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
