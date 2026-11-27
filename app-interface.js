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
