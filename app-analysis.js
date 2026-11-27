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
  return `<tr><td>${c}. ${esc(b.names[c])}</td><td class="${m?'':'zero'}"><b>${m}</b><i>/${k.m}</i></td><td class="${s?'':'zero'}"><s>${s}</s><i>/${k.s}</i></td><td class="${l?'':'zero'}"><u>${l}</u><i>/${k.l}</i></td></tr>`;}).join('')
  +`<tr class="tot"><td>Printed total</td><td>${built.mcq.length}</td><td>${ts}</td><td>${built.long.length}</td></tr>`;
 $('allocEm').textContent=chs.length+' chapters'+(a.crossN?' · '+a.crossN+'↔':'');
 const mx=Math.max(1,...chs.map(c=>am[c]||0));
 $('dist').innerHTML=chs.map(c=>{const v=am[c]||0;return `<div class="dc"><div class="db ${v>=mx&&mx>1?'hi':''}" style="height:${Math.max(5,v/mx*100)}%"><em>${v}</em></div><small>C${c}</small></div>`;}).join('');
 $('spreadEm').textContent=built.mcq.length+' placed';
 $('shortRows').innerHTML=built.short.map(p=>{const g={};p.items.forEach(q=>g[q.ch]=(g[q.ch]||0)+1);
  return `<div class="row"><div class="pip"></div><div class="nm">Q.${p.q} · ${Object.keys(g).sort((x,y)=>x-y).map(c=>'C'+c+'×'+g[c]).join(' + ')}</div><div class="ct">try <b>${p.attempt}</b> = ${p.attempt*state.shortMark}</div></div>`;}).join('');
 $('longRows').innerHTML=built.long.map((q,i)=>q.parts&&q.parts.length?`<div class="row"><div class="pip"></div><div class="nm">Q.${q.no} · ${q.parts.map(p=>`(${esc(p.label)}) Ch ${p.ch} ${esc(b.names[p.ch])}`).join(' · ')}</div><div class="ct"><b>${q.marks} marks</b></div></div>`:`<div class="row"><div class="pip"></div><div class="nm">Q.${first+i} · Ch ${q.ch} ${esc(b.names[q.ch])}</div><div class="ct"><b>${state.longMark}</b></div></div>`).join('');
 $('pinEm').textContent=np;
 const pk=Object.keys(overrides);
 $('pinRows').innerHTML=pk.length?pk.map(k=>{const s=slotMap[k];if(!s)return'';
  return `<div class="row"><div class="pip mag"></div><div class="nm">${esc(s.label)} · Ch ${s.ch}${s.ch!==s.planCh?' ↔':''}</div><button class="xb" data-unpin="${k}">✕</button></div>`;}).join('')
  :'<div class="empty">No pinned questions yet.<br>Click a question on the paper and press 📌.</div>';
 $('confEm').textContent=a.confOk+' / '+a.conf.length;
 $('confRows').innerHTML=a.conf.map(c=>`<div class="row"><div class="pip ${c.ok?'':'warn'}"></div><div class="nm">${esc(c.label)}</div><div class="ct"><b>${c.got}</b></div></div>`).join('')
  +(a.crossN?`<div class="row"><div class="pip warn"></div><div class="nm">Cross-chapter picks</div><div class="ct"><b>${a.crossN}</b></div></div>`:'');
 const good=a.confOk===a.conf.length&&!a.crossN;
 $('ledDot').style.background=good?'var(--green)':'var(--amber)';
 $('ledDot').style.boxShadow='0 0 10px '+(good?'var(--green)':'var(--amber)');
 const th=a.hits.reduce((x,y)=>x+y.n,0);
 $('exEm').textContent=state.alp?(th===0?'clean':th+' hits'):(th+' allowed');
 $('exEm').style.color=state.alp?(th===0?'var(--green)':'var(--red)'):'var(--amber)';
 $('exList').innerHTML=a.hits.map(x=>`<div class="ex ${x.n>0?'hit':''}">${x.n>0?WRN:CHK}<div><b>Unit ${esc(x.e.u)} — ${esc(x.e.name)}</b><span>${esc(x.e.pp)} · ${x.n} ${state.alp?'match':'in play'}</span></div></div>`).join('');
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

