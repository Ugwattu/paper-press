"use strict";
/* ══════════ PAPER HISTORY ══════════
   Keeps the last HIST_MAX generated papers (recorded on .docx export, print, and "Save now") so a paper can be regenerated exactly:
   same course, scheme, chapters, seed (Set V-xx), pinned questions and layout settings. Stored in pp.history.v1, included in backups.
   Question TEXT is never copied; only ids, so edits to the bank show up on regeneration and removed questions are reported. */
const HIST_KEY='pp.history.v1',HIST_MAX=20,HIST_BYTES=400000;
/* Uses PPState accessors only (see app-state.js); never touches the shared globals directly. */
const HIST_SKIP=new Set(['logo','presetId','dirty']);
function cleanHistory(arr){
 if(!Array.isArray(arr))return[];const out=[];const str=(v,n)=>typeof v==='string'?v.slice(0,n):'';
 for(const e of arr){if(out.length>=HIST_MAX)break;if(!e||typeof e!=='object')continue;
  const course=str(e.course,60);if(!/^\d{1,2}-[a-z0-9-]+$/.test(course))continue;
  const seed=Math.round(+e.seed);if(!(seed>=1&&seed<=99))continue;
  const chapters=Array.isArray(e.chapters)?e.chapters.map(Number).filter(n=>Number.isInteger(n)&&n>0&&n<1000).slice(0,60):[];
  const pins={};if(e.pins&&typeof e.pins==='object'&&!Array.isArray(e.pins))Object.keys(e.pins).slice(0,400).forEach(k=>{const v=e.pins[k];if(k.length<=120&&(typeof v==='string'&&v.length<=80||Number.isFinite(v)))pins[k]=v;});
  const qids=Array.isArray(e.qids)?e.qids.filter(x=>typeof x==='string'&&x.length<=80).slice(0,400):[];
  const scheme=e.scheme?cleanScheme(e.scheme):null;
  out.push({id:str(e.id,40)||('h'+out.length),at:Number.isFinite(+e.at)?+e.at:0,course,seed,schemeId:str(e.schemeId,120),schemeName:str(e.schemeName,120),scheme,chapters,alp:!!e.alp,pins,qids,cfg:cleanCfg(e.cfg)});}
 return out;}
function histLoad(){return cleanHistory(LS.get(HIST_KEY,[]));}
function histSave(list){let l=list.slice(0,HIST_MAX);while(l.length>1&&JSON.stringify(l).length>HIST_BYTES)l.pop();return LS.set(HIST_KEY,l);}
function histSnapshot(){
 const cfg={};const st=PPState.get(),bt=PPState.built();Object.keys(DEF).forEach(k=>{if(!HIST_SKIP.has(k)&&k in st)cfg[k]=st[k];});
 const sc=allSchemes().find(s=>s.id===st.schemeId&&s.courseId===PPState.course())||null;
 return{id:'h'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),at:Date.now(),course:PPState.course(),seed:st.seed,schemeId:st.schemeId,schemeName:sc?sc.name:'',
  scheme:sc&&sc.custom?JSON.parse(JSON.stringify(sc)):null,chapters:(st.chapters||[]).slice(),alp:!!st.alp,pins:JSON.parse(JSON.stringify(PPState.pins())),
  qids:[...(bt.mcq||[]).map(q=>q.id),...(bt.short||[]).flatMap(p=>p.items.map(q=>q.id)),...(bt.long||[]).map(q=>q.id||(q.parts&&q.parts.map(x=>x.id).join('+'))||'')].filter(Boolean),cfg};}
/* Same paper twice in a row (same course, seed, chapters, scheme, pins, qids) is one entry. */
function histSig(e){return JSON.stringify([e.course,e.seed,e.schemeId,e.chapters,e.alp,e.pins,e.qids]);}
function recordHistory(){
 if(!PPState.built()||!PPState.plan()||!B().hasQuestions)return false;
 const e=histSnapshot(),list=histLoad();if(list.length&&histSig(list[0])===histSig(e))return false;
 histSave([e,...list.filter(x=>histSig(x)!==histSig(e))]);paintHistory();return true;}
function histRegenerate(id){
 const e=histLoad().find(x=>x.id===id);if(!e)return toast('That history entry is gone.','err');
 const book=BOOKS[e.course];if(!book||!book.hasQuestions)return toast('That course is no longer available.','err');
 if(e.scheme&&!allSchemes().some(s=>s.id===e.scheme.id)){customSchemes.push(e.scheme);LS.set('pp.schemes.v7',customSchemes);}
 PPState.patch(JSON.parse(JSON.stringify(e.cfg)));const state=PPState.get();
 const m=e.course.match(/^(\d+)-(.+)$/);state.grade=+m[1];state.sid=m[2];coursePickerGrade=state.grade;
 state.alp=e.alp;state.chapters=e.chapters.filter(c=>book.chapters.includes(c));state.seed=e.seed;state.presetId='';
 state.schemeId=allSchemes().some(s=>s.id===e.schemeId&&s.courseId===e.course)?e.schemeId:((offFor(e.course)||{}).id||'');
 PPState.setPins(JSON.parse(JSON.stringify(e.pins)));PPState.clearSticky();activeSlot=null;
 paintCourseUI();buildChips();render();syncUI();markDirty&&markDirty();
 const nb=PPState.built(),have=new Set([...(nb.mcq||[]).map(q=>q.id),...(nb.short||[]).flatMap(p=>p.items.map(q=>q.id)),...(nb.long||[]).map(q=>q.id||(q.parts&&q.parts.map(x=>x.id).join('+'))||'')]);
 const missing=e.qids.filter(q=>!have.has(q)).length;
 toast(missing?'Regenerated Set V-'+String(e.seed).padStart(2,'0')+' — '+missing+' question(s) differ because the bank or scheme changed since.':'Regenerated Set V-'+String(e.seed).padStart(2,'0')+' exactly.',missing?'warn':'ok');}
function histUsage(){let total=0,hist=0;try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith('pp.')){const n=k.length+(localStorage.getItem(k)||'').length;total+=n;if(k===HIST_KEY)hist=n;}}}catch(e){}return{hist,total};}
const fmtKB=n=>n<1024?n+' B':(n/1024).toFixed(1)+' KB';
function paintHistory(){
 const box=document.getElementById('historyList');if(!box)return;const list=histLoad(),u=histUsage();
 box.innerHTML=list.length?list.map(e=>{const bk=BOOKS[e.course],name=bk?bk.name+' · '+bk.subject:e.course;
  return `<div class="hist-row" data-id="${esc(e.id)}"><div><b>${esc(name)}</b><small>Set V-${String(e.seed).padStart(2,'0')} · ${esc(e.schemeName||'scheme')} · ${e.chapters.length} ch · ${e.qids.length} questions${Object.keys(e.pins).length?' · '+Object.keys(e.pins).length+' pinned':''} · ${e.at?esc(new Date(e.at).toLocaleString()):''}</small></div><span><button class="act" data-hist-go="${esc(e.id)}" aria-label="Regenerate this paper">Regenerate</button><button class="act" data-hist-del="${esc(e.id)}" aria-label="Delete this history entry">✕</button></span></div>`;}).join(''):'<div class="hint">No papers saved yet. A paper is recorded when you export or print it, or press “Save now”.</div>';
 const info=document.getElementById('historyUsage');if(info)info.textContent=`History: ${list.length} of ${HIST_MAX} papers · ${fmtKB(u.hist)} (all Paper Press data on this device: ${fmtKB(u.total)} of roughly 5 MB browser storage)`;
 const clr=document.getElementById('btnHistClear');if(clr)clr.disabled=!list.length;}
function initHistory(){
 const box=document.getElementById('historyList');if(!box)return;
 box.addEventListener('click',e=>{const g=e.target.closest('[data-hist-go]'),d=e.target.closest('[data-hist-del]');
  if(g)histRegenerate(g.dataset.histGo);else if(d){histSave(histLoad().filter(x=>x.id!==d.dataset.histDel));paintHistory();}});
 const save=document.getElementById('btnHistSave');if(save)save.addEventListener('click',()=>{toast(recordHistory()?'Saved to paper history.':'This exact paper is already the latest entry.','info');});
 const clr=document.getElementById('btnHistClear');if(clr)clr.addEventListener('click',()=>{if(!histLoad().length)return;if(!confirm('Delete all saved paper history on this device? This cannot be undone (your presets, schemes and current paper are not touched).'))return;try{localStorage.removeItem(HIST_KEY);}catch(x){}paintHistory();toast('Paper history cleared.','ok');});
 paintHistory();}
