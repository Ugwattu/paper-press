"use strict";
/* ══════════ BUG REPORTS (every report carries its own ID + diagnostics) ══════════ */
const APP_BUILD='v30 · 2026-11-26',ISSUES='https://github.com/Ugwattu/paper-press/issues';
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
   const pr=j.data['pp.presets.v7'];if(Array.isArray(pr))pr.forEach(p=>{if(p&&p.cfg)p.cfg=cleanCfg(p.cfg);});
   const sc=j.data['pp.schemes.v7'];if(Array.isArray(sc))j.data['pp.schemes.v7']=sc.map(cleanScheme).filter(Boolean);
   const st=j.data['pp.state.v7'];if(st&&typeof st==='object'){st.logo='';}
   keys.forEach(k=>localStorage.setItem(k,JSON.stringify(j.data[k])));
   const lg=typeof j.logo==='string'&&/^data:image\/(png|jpe?g|gif|webp);base64,/.test(j.logo)&&j.logo.length<4e6?j.logo:'';
   await idbSet('logo',lg);
  }catch(x){window.__ppRestoring=false;return toast('Could not write the backup into browser storage.','err');}
  toast('Backup restored — reloading…','ok');setTimeout(()=>location.reload(),800);});
 stamp();
 const ab=LS.get('pp.autobackup',null),abBtn=$('btnAutoBackup');
 if(ab&&ab.raw&&abBtn){abBtn.classList.remove('hidden');abBtn.textContent='Download the safety copy made before the last update ('+new Date(ab.saved).toLocaleDateString()+')';
  abBtn.addEventListener('click',()=>{const data={};for(const k in ab.raw){try{data[k]=JSON.parse(ab.raw[k]);}catch(e){}}
   const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({app:MAGIC,version:1,created:ab.saved,data,logo:''})],{type:'application/json'}));a.download='paper-press-safety-copy-'+ab.saved.slice(0,10)+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);});}})();
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
 if(raw['pp.state.v7']||raw['pp.presets.v7']||raw['pp.schemes.v7'])LS.set('pp.autobackup',{build:LS.get('pp.build','an earlier version'),saved:new Date().toISOString(),raw});LS.set('pp.build',APP_BUILD);}}catch(e){}
setTheme(LS.get('pp.theme',null)||(window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'));
customSchemes=(LS.get('pp.schemes.v7',[])||[]).map(cleanScheme).filter(Boolean);
presets=LS.get('pp.presets.v7',[]);
/* Legacy presets stored one free-text duration. Drop that obsolete field and inherit the course ALP split. */
let migratedPresetTimes=false;presets.forEach(p=>{if(p&&p.cfg&&Object.prototype.hasOwnProperty.call(p.cfg,'time')){migratedPresetTimes=true;delete p.cfg.time;if(Array.isArray(p.scopes)&&p.scopes.includes('header')){if(p.cfg.timeObj===undefined)p.cfg.timeObj=0;if(p.cfg.timeSubj===undefined)p.cfg.timeSubj=0;}}});
if(migratedPresetTimes)LS.set('pp.presets.v7',presets);
hiddenF=LS.get('pp.hiddenFactory.v1',[]);if(!Array.isArray(hiddenF))hiddenF=[];
const saved=LS.get('pp.state.v7',null);
if(saved&&typeof saved==='object'){
 state=Object.assign(JSON.parse(JSON.stringify(DEF)),saved);
 ['contentSelection','contentCatalogCustom','contentExcludedOverrides','questionTags'].forEach(k=>{if(!state[k]||typeof state[k]!=='object'||Array.isArray(state[k]))state[k]={};});
 delete state.time; /* legacy free-text duration replaced by objective/subjective minutes */
 state.timeObj=Number.isFinite(+state.timeObj)?clamp(Math.round(+state.timeObj),0,600):0;state.timeSubj=Number.isFinite(+state.timeSubj)?clamp(Math.round(+state.timeSubj),0,600):0;
 state.sheetMode=state.sheetMode==='two'?'two':'single';
 if(!state.sid)state.sid='computer';
 if(!BOOKS[cid()]||!B().hasQuestions){state.grade=9;state.sid='computer';}
 state.chapters=(state.chapters||[]).filter(c=>B().chapters.includes(c));
 if(!state.chapters.length)state.chapters=B().alpCh.slice();
 state.longPick=state.longPick||{};
}
if(!allSchemes().some(s=>s.id===state.schemeId&&s.courseId===cid()))state.schemeId=(offFor(cid())||{}).id||'off9';
coursePickerGrade=state.grade;buildCourseUI();
document.querySelectorAll('#segPreFilter button').forEach(x=>x.classList.toggle('on',x.dataset.v==='all'));
buildChips();render();histPush();
idbGet('logo').then(d=>{_logoLoaded=true;_lastLogo=d||'';if(d&&!state.logo&&state.logoName){state.logo=d;rasterizeLogo(d).then(p=>{logoPNG=p;render();});}else saveState();});
if(state.logo)rasterizeLogo(state.logo).then(p=>{logoPNG=p;syncUI();});
requestAnimationFrame(()=>{if(state.autoFit!==false)fitZoom();else applyZoom();paintLedger();renderPresets();
 setTimeout(()=>toast('Long scheme: 9th Ch1 · Ch3 · Ch6/9 — 10th Ch1 · Ch4 · Ch6/8. Edit or add your own in Pairing Scheme.','ok'),800);});