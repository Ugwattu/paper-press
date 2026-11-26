"use strict";
/* ══════════ BUG REPORTS (every report carries its own ID + diagnostics) ══════════ */
const APP_BUILD='v37 · 2026-11-26',ISSUES='https://github.com/Ugwattu/paper-press/issues';
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
