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

