"use strict";
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
function paperInnerSheet(s,mode){
 const screen=(mode==='screen'),bi=urduOn(s),showKey=screen&&s.showKey,showTags=screen&&s.showTags,SN=serials();
 const sheetKind=s._sheetKind||'single',allMarks=plan.marks;
 const mk=sheetKind==='objective'?{mcq:allMarks.mcq,short:0,long:0,total:allMarks.mcq}:sheetKind==='subjective'?{mcq:0,short:allMarks.short,long:allMarks.long,total:allMarks.short+allMarks.long}:allMarks;
 const F=s.enFont,FS=s.enSize,UF=s.urFont,US=s.urSize,BD=`${s.borderW}pt solid #000000`;
 const cb=s.hideLines?'border:0;':`border:${BD};`,bAttr=s.hideLines?'0':'1';
 const base=`font-family:'${F}',serif;font-size:${FS}pt;line-height:${s.lineH};color:#000;`;
 const VA='top',SA='top'; /* text and serial numbers are always top-aligned */
 const cell=`${cb}padding:${s.pad}pt ${s.pad+1.5}pt;vertical-align:${VA};${base}`;
 const cc=`${cb}padding:${s.pad}pt;vertical-align:${SA};text-align:center;${base}`,ch=`${cb}padding:${s.pad}pt;vertical-align:${VA};text-align:center;${base}`;
 const uc=`${cb}padding:${s.pad}pt ${s.pad+1.5}pt;vertical-align:${VA};direction:rtl;text-align:right;font-family:'${UF}','Noto Nastaliq Urdu',serif;font-size:${US}pt;line-height:${s.lineH+.35};color:#000;`;
 const uNum=`${cb}padding:${s.pad}pt;vertical-align:${SA};text-align:center;direction:rtl;font-family:'${UF}','Noto Nastaliq Urdu',serif;font-size:${US}pt;line-height:${s.lineH+.35};color:#000;`;
 const ui=t=>t?` <span dir="rtl" lang="ur" style="font-family:'${UF}','Noto Nastaliq Urdu',serif;font-size:${US}pt;">${richHtml(t)}</span>`:'';
 const sh=s.shade?'#e9e4d6':'#ffffff',zb=i=>s.zebra&&i%2===1?'background:#f7f4ea;':'';
 const tg=t=>showTags?`<span style="font-family:Arial,sans-serif;font-size:${Math.max(6,FS-4)}pt;color:#7a6a45;"> [${t}]</span>`:'';
 const pin=q=>(screen&&s.showPins&&overrides[q._key])?'<span class="pinb">📌</span>':'';
 const cross=q=>{if(!screen)return'';const sl=slotMap[q._key];return sl&&sl.ch!==sl.planCh?'<span class="xch">↔Ch'+q.ch+'</span>':'';};
 const T=x=>`<table border="${bAttr}" cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%;${s.hideLines?'':'border:'+BD+';'}${base}${x||''}">`;
 const nw=s.numW,mid=100-2*nw,q4=mid/4;
 const wH=s.bHeader?'bold':'normal',wB=s.bBar?'bold':'normal',wI=s.bInstr?'bold':'normal',wN=s.bNum?'bold':'normal',wS=s.bStem?'bold':'normal',wO='normal',wQ=s.bShort?'bold':'normal',wL=s.bLong?'bold':'normal';
 const dz=z=>screen&&sheetKind!=='subjective'&&built.mcq.length?`<div class="dropzone" data-zone="${z}"><span>Drop OMR — ${ZLABEL[z]}</span></div>`:'';
 const hasM=sheetKind!=='subjective'&&built.mcq.length>0,hasS=sheetKind!=='objective'&&built.short.some(p=>p.items.length>0),hasL=sheetKind!=='objective'&&built.long.length>0,PR=['I','II','III'],PU=['اول','دوم','سوم'];let partNo=0;
 const omrPos=sheetKind==='single'?s.omrPos:(s.omrPos==='front'?'front':'end');
 const mcqEn=`Q. No. 1: Choose the Best option and fill the Bubble.  (${built.mcq.length} × ${s.mcqMark} = ${mk.mcq})`;
 let QE=qEdges(s,bi,mcqEn),GM=mkGrid(QE.mcq,100),GT=mkGrid(QE.two,100),g6=GM.cols,g4=GT.cols;
 const cs=(G,a,b)=>{const n=G.sp(a,b);return n>1?` colspan="${n}"`:'';};
 const cg=grid=>`<colgroup>${grid.map(w=>`<col style="width:${w}%">`).join('')}</colgroup>`;
 const ins=(en,ur,G)=>{
  if(!bi)return `<tr><td colspan="${G.sp(0,100)}" style="${cell}background:${sh};font-weight:${wI};">${esc(en)}</td></tr>`;
  /* Instruction row uses a nested two-cell table. This keeps its English/Urdu split
     independent of the body column grid and prevents phantom empty columns. */
  const split=`<table border="${bAttr}" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;table-layout:fixed;"><tr><td style="width:${QE.H}%;${cell}background:${sh};font-weight:${wI};">${esc(en)}</td><td style="width:${100-QE.H}%;${uc}background:${sh};font-weight:${wI};">${esc(ur)}</td></tr></table>`;
  return `<tr><td colspan="${G.sp(0,100)}" style="padding:0;${cb}">${split}</td></tr>`;};
 let h='';
 if(s.footer)h+=`<div style="${base}font-size:${FS-2}pt;text-align:center;margin-bottom:6pt;${s.hideLines?'':'border-bottom:'+BD+';'}padding-bottom:4pt;">Paper ${B().code}-${s.alp?'ALP':'FULL'} / V-${String(s.seed).padStart(2,'0')}${sheetKind==='single'?'':` / ${sheetKind==='objective'?'Objective':'Subjective'}`} &nbsp;·&nbsp; ${esc(plan.sch.name)} &nbsp;·&nbsp; Examiner: ____________________</div>`;
 const logoImg=s.logo?`<img src="${s.logo}" alt="logo" style="height:${s.logoH}pt;width:auto;display:block;">`:'';
 const titleBlock=()=>{let t='';
  if(s.institute.trim())t+=`<div style="${base}font-size:${FS+5}pt;font-weight:${wH};">${esc(s.institute)}</div>`;
  t+=`<div style="${base}font-size:${FS+1}pt;font-weight:${wH};margin-top:1pt;">${esc(s.title)}</div>`;
  if(bi)t+=`<div dir="rtl" lang="ur" style="font-family:'${UF}','Noto Nastaliq Urdu',serif;font-size:${US+1}pt;font-weight:${wH};margin-top:2pt;">${esc(state.subjectUr||'')}${state.subjectUr?' — ':''}${B().classUr||''}</div>`;
  return t;};
 const lt=mb=>{ /* logo + title block */
  if(logoImg&&s.logoPos==='center')return `<div style="text-align:center;margin-bottom:4pt;"><div style="display:inline-block;">${logoImg}</div></div><div style="text-align:center;margin-bottom:${mb}pt;">${titleBlock()}</div>`;
  if(logoImg){const lc=`<td style="border:0;padding:0;width:${s.logoH+16}pt;vertical-align:middle;">${logoImg}</td>`,tc2=`<td style="border:0;padding:0 6pt;vertical-align:middle;text-align:center;">${titleBlock()}</td>`;
   return `<table border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%;margin-bottom:${mb}pt;"><tr>${s.logoPos==='left'?lc+tc2:tc2+lc}</tr></table>`;}
  return `<div style="text-align:center;margin-bottom:${mb}pt;">${titleBlock()}</div>`;};
 const HS=s.hdrStyle||'classic',metaT=[`Class: ${esc(s.klass)}`,`Subject: ${esc(s.subject)}`,`Total Marks: ${mk.total}`,`Time: ${esc(paperDuration(s,sheetKind))}`],MW=[22,38,20,20],
  RULE=s.hideLines?'0':`${Math.max(1.5,s.borderW*2)}pt solid #000`,mcg=`<colgroup>${MW.map(w=>`<col style="width:${w}%">`).join('')}</colgroup>`,TB='cellspacing="0" cellpadding="0" style="border-collapse:collapse;table-layout:fixed;width:100%;';
 if(HS==='banner'){
  h+=`<table ${TB}margin-bottom:6pt;${s.hideLines?'':'border:'+BD+';'}">${mcg}<tr><td colspan="4" style="${s.hideLines?'':'border-bottom:'+BD+';'}padding:${s.pad+3}pt;background:${sh};text-align:center;">${lt(0)}</td></tr><tr>${metaT.map((t,i)=>`<td style="${s.hideLines||!i?'':'border-left:'+BD+';'}padding:${s.pad}pt ${s.pad+1.5}pt;text-align:center;vertical-align:top;${base}font-weight:${wH};">${t}</td>`).join('')}</tr></table>`;
 }else if(HS==='ruled'){
  h+=lt(5)+`<table ${TB}margin-bottom:6pt;">${mcg}<tr>${metaT.map((t,i)=>`<td style="border-top:${RULE};border-bottom:${RULE};padding:${s.pad+1}pt ${s.pad+1.5}pt;text-align:${['left','center','center','right'][i]};vertical-align:top;${base}font-weight:${wH};">${t}</td>`).join('')}</tr></table>`;
 }else if(HS==='split'){
  const sc=`padding:${s.pad}pt ${s.pad+1.5}pt;vertical-align:top;${base}font-weight:${wH};${s.hideLines?'':'border-bottom:'+RULE+';'}`;
  h+=`<table ${TB}margin-bottom:6pt;"><colgroup><col style="width:28%"><col style="width:44%"><col style="width:28%"></colgroup><tr><td style="${sc}text-align:left;">${metaT[0]}<br>${metaT[1]}</td><td style="${sc}text-align:center;">${lt(2)}</td><td style="${sc}text-align:right;">${metaT[3]}<br>${metaT[2]}</td></tr></table>`;
 }else{
  h+=lt(5)+T('margin-bottom:6pt;')+`<tr><td style="${ch}width:22%;font-weight:${wH};">${metaT[0]}</td><td style="${ch}width:38%;font-weight:${wH};">${metaT[1]}</td><td style="${ch}width:20%;font-weight:${wH};">${metaT[2]}</td><td style="${ch}width:20%;font-weight:${wH};">${metaT[3]}</td></tr></table>`;
 }
 const infoRow=()=>{const f=[];
  if(s.showName)f.push(['Name','____________________________']);
  if(s.showRoll)f.push(['Roll No','____________________']);
  if(s.showSection)f.push(['Section',s.sectionVal.trim()?esc(s.sectionVal):'____________']);
  if(s.showDate!==false)f.push(['Date',s.date.trim()?esc(s.date):'________________']);
  if(!f.length)return'';const w=(100/f.length).toFixed(2);
  return T('margin:0 0 6pt;')+`<tr>${f.map(([k,v])=>`<td style="${cell}width:${w}%;font-weight:${wH};">${k}: ${v}</td>`).join('')}</tr></table>`;};
 const infoSpecHTML=rows=>{
  const edges=[0,100];rows.forEach(r=>{if(r!=='spacer')r.forEach(c=>edges.push(c.a,c.b));});const G=mkGrid(edges,100);
  let x=`<table cellspacing="0" cellpadding="0" style="border-collapse:collapse;table-layout:fixed;width:100%;margin:0 0 6pt;"><colgroup>${G.cols.map(w=>`<col style="width:${w.toFixed(3)}%">`).join('')}</colgroup>`;
  rows.forEach(r=>{if(r==='spacer'){x+=`<tr><td colspan="${G.sp(0,100)}" style="height:7pt;border:0;padding:0;line-height:0;font-size:0;"></td></tr>`;return;}
   x+='<tr>'+r.map(c=>{const n=G.sp(c.a,c.b),cs2=n>1?` colspan="${n}"`:'';
    if(c.k==='gap')return `<td${cs2} style="border:0;"></td>`;
    if(c.k==='box')return `<td${cs2} style="border:${BD};height:${FS+8}pt;padding:0;"></td>`;
    return `<td${cs2} style="${c.k==='line'?'border:0;border-bottom:'+BD+';':'border:0;'}padding:${s.pad+5}pt ${s.pad+1.5}pt ${s.pad}pt;vertical-align:bottom;${base}font-weight:${wH};">${esc(c.t)}</td>`;}).join('')+'</tr>';});
  return x+'</table>';};
 const infoRowAny=()=>{if(s.infoStyle&&s.infoStyle!=='table'){const r=infoSpec(s);return r.length?infoSpecHTML(r):'';}return infoRow();};
 if(s.infoPos==='top')h+=infoRowAny();
 const bar=(en,ur)=>{let x=T('margin-bottom:5pt;')+`<tr><td style="${cb}padding:${s.pad+2}pt;background:${sh};text-align:center;${base}font-size:${FS+1.5}pt;font-weight:${wB};letter-spacing:.5pt;">${esc(en)}`;
  if(bi)x+=`<div dir="rtl" lang="ur" style="font-family:'${UF}','Noto Nastaliq Urdu',serif;font-size:${US}pt;font-weight:${wB};letter-spacing:0;margin-top:2pt;">${esc(ur)}</div>`;
  return x+`</td></tr></table>`;};
 h+=dz('front');
 if(hasM&&sheetKind==='objective'){const noteEn='Four possible answers A, B, C and D are given for each question. Choose the correct answer and fill the corresponding circle on the OMR answer sheet.';
  const noteUr='ہر سوال کے چار ممکنہ جوابات A، B، C اور D دیے گئے ہیں۔ درست جواب منتخب کریں اور جوابی شیٹ پر متعلقہ دائرے کو پُر کریں۔';
  h+=`<div style="${base}${cb}padding:${s.pad+2}pt;margin:0 0 6pt;background:${sh};font-size:${FS-1}pt;"><b>Note:</b> ${noteEn}${bi?`<div dir="rtl" lang="ur" style="${uc}">${noteUr}</div>`:''}</div>`;
 }
 if(s.omr&&hasM&&omrPos==='front')h+=omrHTML(s,showKey,screen);
 if(hasM){const pi=partNo++;h+=bar(`PART-${PR[pi]}  ·  OBJECTIVE  (${mk.mcq} Marks)`,`حصہ ${PU[pi]}: معروضی سوالات`);
 h+=T('margin-bottom:7pt;')+cg(g6);
 h+=ins(mcqEn,'سوال نمبر 1: درست جواب کا انتخاب کریں۔ اور ببل بھریں۔',GM);
 built.mcq.forEach((m,i)=>{
  const lay=layoutFor(m),z=zb(i),sk=screen?` data-slot="${m._key}"`:'',S=SN[m._key];
  let stem=`<tr${sk} style="${z}"><td style="${cc}font-weight:${wN};">${S.no}${pin(m)}${cross(m)}</td>`;
  if(bi)stem+=`<td${cs(GM,QE.nw,QE.B1)} style="${cell}font-weight:${wS};">${richHtml(m.en)}${figureHtml(m.figure,m.figureAlt)}${tg('Ch '+m.ch)}</td><td${cs(GM,QE.B1,QE.R)} style="${uc}font-weight:${wS};">${richHtml(m.ur)}</td><td style="${uNum}font-weight:${wN};">${S.ur}</td>`;
  else stem+=`<td${cs(GM,QE.nw,100)} style="${cell}font-weight:${wS};">${richHtml(m.en)}${figureHtml(m.figure,m.figureAlt)}${tg('Ch '+m.ch)}</td>`;
  h+=stem+'</tr>';
  const op=k=>{const o=m.o[k];if(!o)return{t:'',st:''};const key=showKey&&k===m.a;
   return{t:`${'ABCD'[k]}. ${richHtml(o[0])}${figureHtml(m.of&&m.of[k],m.oa&&m.oa[k],'option')}${bi?ui(o[1]):''}${key?` <span style="font-family:Arial,sans-serif;font-size:${FS-2}pt;color:#046a38;font-weight:bold;">&#10003;</span>`:''}`,st:(key?'background:#e6f6ec;':'')+`font-weight:${wO};`};};
  if(lay===4){const o=[0,1,2,3].map(op);
   h+=`<tr${sk} style="${z}"><td style="${cc}"></td>${o.map((x,k)=>`<td${cs(GM,QE.nw+k*QE.q4,QE.nw+(k+1)*QE.q4)} style="${cell}${x.st}">${x.t}</td>`).join('')}<td style="${cc}"></td></tr>`;}
  else if(lay===2){for(let r=0;r<2;r++){const a=op(r*2),b=op(r*2+1);
   h+=`<tr${sk} style="${z}"><td style="${cc}"></td><td${cs(GM,QE.nw,QE.B1)} style="${cell}${a.st}">${a.t}</td><td${cs(GM,QE.B1,QE.R)} style="${cell}${b.st}">${b.t}</td><td style="${cc}"></td></tr>`;}}
  else{for(let k=0;k<4;k++){const a=op(k);
   h+=`<tr${sk} style="${z}"><td style="${cc}"></td><td${cs(GM,QE.nw,QE.R)} style="${cell}${a.st}">${a.t}</td><td style="${cc}"></td></tr>`;}}});
 h+='</table>';}
 h+=dz('after');
 if(s.omr&&hasM&&omrPos==='after')h+=omrHTML(s,showKey,screen);
 if(hasS){const pi=partNo++;h+=bar(`PART-${PR[pi]}  ·  SHORT QUESTIONS  (${mk.short} Marks)`,`حصہ ${PU[pi]}: مختصر سوالات`);
 built.short.forEach(p=>{if(!p.items.length)return;
  const all=p.attempt>=p.items.length;
  const en=all?`Q. No. ${p.q}: Answer ALL ${NE[p.items.length]} (${p.items.length}) short questions.  (${p.items.length} × ${s.shortMark} = ${p.items.length*s.shortMark})`
   :`Q. No. ${p.q}: Write short answers to any ${NE[p.attempt]} (${p.attempt}) questions.  (${p.attempt} × ${s.shortMark} = ${p.attempt*s.shortMark})`;
  const ur=all?`سوال نمبر ${p.q}: تمام ${NU[p.items.length]} مختصر سوالات کے جوابات دیں۔`:`سوال نمبر ${p.q}: کوئی سے ${NU[p.attempt]} مختصر سوالات کے جوابات دیں۔`;
  QE=qEdges(s,bi,en);GT=mkGrid(QE.two,100);g4=GT.cols;
  h+=T('margin-bottom:7pt;')+cg(g4)+ins(en,ur,GT);
  p.items.forEach((q,i)=>{const sk=screen?` data-slot="${q._key}"`:'',S=SN[q._key];
   h+=`<tr${sk} style="${zb(i)}"><td style="${cc}font-weight:${wN};">${S.no}${pin(q)}${cross(q)}</td><td${cs(GT,QE.nw,bi?QE.B2:100)} style="${cell}font-weight:${wQ};">${richHtml(q.en)}${figureHtml(q.figure,q.figureAlt)}${tg('Ch '+q.ch)}</td>`;
   if(bi)h+=`<td${cs(GT,QE.B2,QE.R)} style="${uc}font-weight:${wQ};">${richHtml(q.ur)}</td><td style="${uNum}font-weight:${wN};">${S.ur}</td>`;
   h+='</tr>';});
  h+='</table>';});}
 h+=dz('mid');
 if(s.omr&&hasM&&omrPos==='mid')h+=omrHTML(s,showKey,screen);
 if(hasL){const first=longQ0(),last=first+built.long.length-1,pi=partNo++;
 h+=bar(`PART-${PR[pi]}  ·  DETAILED QUESTIONS  (${mk.long} Marks)`,`حصہ ${PU[pi]}: تفصیلی سوالات`);
 if(built.longMode==='groups'){
  built.longGroups.forEach(g=>{
   const qs=g.questions,lo=qs[0]?.no||first,hi=qs[qs.length-1]?.no||lo;
   const en=`${g.name}: Q. No. ${lo}${hi!==lo?' to '+hi:''}. Attempt any ${g.attempt} of ${qs.length} detailed questions. Each question carries ${g.marksEach} marks. (${g.attempt} × ${g.marksEach} = ${g.totalMarks})`;
   const ur=`${g.name}: سوال نمبر ${lo} تا ${hi} میں سے کوئی سے ${NU[g.attempt]||g.attempt} سوالات حل کریں۔ ہر سوال ${g.marksEach} نمبر کا ہے۔`;
   QE=qEdges(s,bi,en);GT=mkGrid(QE.two,100);g4=GT.cols;
   h+=`<div style="margin:4pt 0 2pt;font-weight:${wL};">${esc(g.name)}</div>`+T('margin-bottom:5pt;')+cg(g4)+ins(en,ur,GT);
   qs.forEach(q=>{
    const S=SN[q._key],z=zb(q.no),partHTML=(pt)=>`<div class="pp-long-part" ${screen?`data-slot="${pt._key}"`:''} style="margin:0 0 4pt;">${pin(pt)}${cross(pt)}<b>(${esc(pt.label)})</b> ${richHtml(pt.en)}${figureHtml(pt.figure,pt.figureAlt)}${tg('Ch '+pt.ch)} <span style="white-space:nowrap;">(${pt.marks} marks)</span></div>`;
    const partUr=(pt)=>`<div style="margin:0 0 4pt;"><b>(${esc(pt.label)})</b> ${richHtml(pt.ur)} (${pt.marks} نمبر)</div>`;
    h+=`<tr style="${z}"><td style="${cc}font-weight:${wN};">${S.no}</td><td${cs(GT,QE.nw,bi?QE.B2:100)} style="${cell}font-weight:${wL};">${q.parts.map(partHTML).join('')}</td>`;
    if(bi)h+=`<td${cs(GT,QE.B2,QE.R)} style="${uc}font-weight:${wL};">${q.parts.map(partUr).join('')}</td><td style="${uNum}font-weight:${wN};">${S.ur}</td>`;
    h+='</tr>';
   });
   h+='</table>';
  });
 }else{
  const allL=state.longAttempt>=built.long.length;
  const len=allL?`Q. No. ${first}${built.long.length>1?' to '+last:''}: Attempt ALL ${NE[built.long.length]} (${built.long.length}) detailed questions.  (${built.long.length} × ${s.longMark} = ${mk.long})`
   :`Q. No. ${first}${built.long.length>1?' to '+last:''}: Attempt any ${NE[state.longAttempt]} (${state.longAttempt}) detailed questions.  (${state.longAttempt} × ${s.longMark} = ${mk.long})`;
  const lur=allL?`سوال نمبر ${first} تا ${last}: تمام ${NU[built.long.length]} تفصیلی سوالات کے جوابات دیں۔`:`سوال نمبر ${first} تا ${last}: کوئی سے ${NU[state.longAttempt]} تفصیلی سوالات کے جوابات دیں۔`;
  QE=qEdges(s,bi,len);GT=mkGrid(QE.two,100);g4=GT.cols;
  h+=T('margin-bottom:5pt;')+cg(g4)+ins(len,lur,GT);
  built.long.forEach((q,i)=>{const sk=screen?` data-slot="${q._key}"`:'',S=SN[q._key];
   h+=`<tr${sk} style="${zb(i)}"><td style="${cc}font-weight:${wN};">${S.no}${pin(q)}${cross(q)}</td><td${cs(GT,QE.nw,bi?QE.B2:100)} style="${cell}font-weight:${wL};">${richHtml(q.en)}${figureHtml(q.figure,q.figureAlt)}${tg('Ch '+q.ch)}</td>`;
   if(bi)h+=`<td${cs(GT,QE.B2,QE.R)} style="${uc}font-weight:${wL};">${richHtml(q.ur)}</td><td style="${uNum}font-weight:${wN};">${S.ur}</td>`;
   h+='</tr>';});
  h+='</table>';
 }
 }
 h+=dz('end');
 if(s.omr&&hasM&&omrPos==='end')h+=omrHTML(s,showKey,screen);
 if(s.infoPos==='bottom')h+=infoRowAny();
 return h;
}
function paperInner(s,mode,forceBoth=false){
 if(s.sheetMode!=='two')return paperInnerSheet(s,mode);
 const pg=PAGES[s.page],chosen=forceBoth||previewSheet==='both'?['objective','subjective']:previewSheet==='objective'?['objective']:['subjective'];
 return chosen.map((kind,i)=>{
  const part=paperInnerSheet(Object.assign({},s,{_sheetKind:kind}),mode);
  const br='';
  const brBefore=mode==='export'&&i>0?'page-break-before:always;break-before:page;':'';
  return `<div class="pp-sheet-page" data-sheet="${kind}" style="width:100%;min-height:${pg.h}pt;padding:${s.margin}pt;box-sizing:border-box;background:#fff;box-shadow:0 0 0 1px rgba(15,23,42,.08),0 1px 3px rgba(15,23,42,.1),0 18px 50px rgba(15,23,42,.12);margin:0 0 16pt;${br}${brBefore}">${part}</div>`;
 }).join('');
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
  if(s.omrUrdu&&urduOn(s))h+=`<span dir="rtl" lang="ur" style="font-family:'${s.urFont}','Noto Nastaliq Urdu',serif;font-size:${s.urSize+1}pt;"> &nbsp;(اُمیدوار خود پُر کرے)</span>`;
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
</head><body><div class="Section1">${paperInner(s,'export',true)}</div></body></html>`;}

