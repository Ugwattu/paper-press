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
 $('dTitle').innerHTML='Choose any question<small>'+esc(s.label)+' · slot chapter '+s.planCh+' — '+esc(B().names[s.planCh])+'</small>';
 drawerShow('pick');
 $('dSearch').value='';$('dEx').classList.remove('on');
 const b=B();
 $('dChap').innerHTML='<option value="all">All chapters — whole '+esc(b.name)+' book</option><option value="slot">Slot chapter '+s.planCh+' — '+esc(b.names[s.planCh])+'</option>'+b.chapters.map(c=>`<option value="${c}">Ch ${c} — ${esc(b.names[c])}</option>`).join('');
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

