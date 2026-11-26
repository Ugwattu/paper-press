/* Paper Press bank loader — schema-v2 course banks. */
(function (root) {
 'use strict';
 const LETTERS='ABCD', fail=m=>{throw new Error(m);}, str=v=>v==null?'':String(v), obj=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
 const APP_SCRIPTS=['app-core.js','app-schemes.js','app-long.js','app-planning.js','app-paper.js','app-docx.js','app-analysis.js','app-presets.js','app-render.js','app-editors.js','app-interface.js','app-runtime.js'];
 const whole=v=>Number.isInteger(Number(v))&&Number(v)>=0;
 function figureRef(v,at){const x=str(v).trim();if(!x)return'';const n=x.replace(/^figures\//i,'');if(!/^[a-z0-9][a-z0-9._-]*\.(?:png|svg)$/i.test(n))fail(`${at}: figure must be a PNG/SVG filename inside figures/`);return'figures/'+n;}
 function convertLongGroups(groups,course,valid,at){
  if(!Array.isArray(groups)||!groups.length)fail(`${at}: longGroups must be a non-empty list`);
  const allowed=new Set((course.alpChapters||[]).map(Number));
  const checkChapters=(list,field,required)=>{
   if(list==null&&!required)return [];
   if(!Array.isArray(list)||(!list.length&&required))fail(`${at}: ${field} must contain chapter numbers`);
   const out=[...new Set(list.map(Number))];
   if(out.some(c=>!Number.isInteger(c)||!valid.has(c)))fail(`${at}: ${field} refers to a missing chapter`);
   if(allowed.size&&out.some(c=>!allowed.has(c)))fail(`${at}: ${field} includes a chapter outside the course ALP`);
   if(out.length!==list.length)fail(`${at}: ${field} contains duplicate chapters`);
   return out;
  };
  const alpha=i=>String.fromCharCode(97+i);
  const norm=groups.map((g,gi)=>{
   const ga=`${at} longGroups[${gi}]`;
   if(!obj(g)||!str(g.id||`group-${gi+1}`).trim()||!Array.isArray(g.questions)||!g.questions.length)fail(`${ga}: each group needs an id and a non-empty questions list`);
   const attempt=Number(g.attempt);
   if(!Number.isInteger(attempt)||attempt<1||attempt>g.questions.length)fail(`${ga}: attempt must be between 1 and the number of printed questions`);
   const questions=g.questions.map((q,qi)=>{
    const qa=`${ga}.questions[${qi}]`;
    if(!obj(q)||!Array.isArray(q.parts)||!q.parts.length)fail(`${qa}: each long question needs a non-empty parts list`);
    const parts=q.parts.map((part,pi)=>{
     const pa=`${qa}.parts[${pi}]`;
     if(!obj(part))fail(`${pa}: part must be an object`);
     const label=str(part.label||alpha(pi)).trim().toLowerCase(),marks=Number(part.marks),rule=part.chapterRule;
     if(!/^[a-z]$/.test(label))fail(`${pa}: label must be a single letter a-z`);
     if(!Number.isInteger(marks)||marks<1)fail(`${pa}: marks must be a positive whole number`);
     if(!obj(rule)||!['fixed','either','any','different-from-a'].includes(rule.type))fail(`${pa}: chapterRule type must be fixed, either, any or different-from-a`);
     const hasList=rule.chapters!=null,chapters=checkChapters(rule.chapters,`${pa}.chapterRule.chapters`,rule.type==='fixed'||rule.type==='either');
     if(rule.type==='fixed'&&chapters.length!==1)fail(`${pa}: fixed rules require exactly one chapter`);
     if(rule.type==='different-from-a'&&pi===0)fail(`${pa}: different-from-a can only be used after part (a)`);
     if((rule.type==='any'||rule.type==='different-from-a')&&hasList&&!chapters.length)fail(`${pa}: chapterRule.chapters cannot be empty`);
     return{label,marks,chapterRule:{type:rule.type,chapters}};
    });
    if(new Set(parts.map(x=>x.label)).size!==parts.length)fail(`${qa}: part labels must be unique`);
    return{id:str(q.id||`q${qi+1}`),parts,marks:parts.reduce((n,x)=>n+x.marks,0)};
   });
   const marksEach=questions[0].marks,shape=questions[0].parts.map(p=>`${p.label}:${p.marks}`).join('|');
   if(questions.some(q=>q.marks!==marksEach||q.parts.map(p=>`${p.label}:${p.marks}`).join('|')!==shape))fail(`${ga}: all questions in a group must have the same part labels and marks`);
   return{id:str(g.id||`group-${gi+1}`),name:str(g.name||`Long questions ${gi+1}`),attempt,questions,marksEach,totalMarks:attempt*marksEach};
  });
  if(new Set(norm.map(g=>g.id)).size!==norm.length)fail(`${at}: longGroups ids must be unique`);
  return norm;
 }
 function convertPattern(p,course,label,index){
  const at=`${label} patterns[${index}]`,hasGroups=Array.isArray(p&&p.longGroups)&&p.longGroups.length>0,legacyLong=Array.isArray(p&&p.long);
  if(!obj(p)||!str(p.id).trim()||!str(p.name).trim()||!obj(p.mcq)||!Array.isArray(p.short)||(!legacyLong&&!hasGroups))fail(`${at}: invalid pattern structure`);
  if(hasGroups&&legacyLong&&p.long.length)fail(`${at}: use either legacy long slots or longGroups, not both`);
  const valid=new Set(course.chapters.map(c=>Number(c.number)));
  const check=(o,field)=>Object.keys(o).forEach(k=>{if(!valid.has(+k))fail(`${at}: ${field} refers to missing chapter ${k}`);if(!whole(o[k]))fail(`${at}: ${field}[${k}] must be a whole number`);});
  check(p.mcq,'mcq');
  p.short.forEach((x,i)=>{if(!obj(x)||!obj(x.ch))fail(`${at}: short[${i}].ch must be an object`);check(x.ch,`short[${i}].ch`);if(!whole(x.attempt)||+x.attempt>Object.values(x.ch).reduce((a,b)=>a+ +b,0))fail(`${at}: invalid attempt count in short[${i}]`);});
  const legacySlots=legacyLong?p.long:[];
  legacySlots.forEach((a,i)=>{if(!Array.isArray(a)||!a.length||a.some(c=>!valid.has(+c)))fail(`${at}: long[${i}] must reference existing chapters`);});
  const [mcqMark,shortMark]=[p.mcqMark,p.shortMark].map(Number);
  if(![mcqMark,shortMark].every(n=>Number.isInteger(n)&&n>0))fail(`${at}: MCQ and short marks must be positive whole numbers`);
  const longGroups=hasGroups?convertLongGroups(p.longGroups,course,valid,at):[];
  const longAttempt=hasGroups?longGroups.reduce((n,g)=>n+g.attempt,0):Number(p.longAttempt);
  const longMark=hasGroups?0:Number(p.longMark);
  if(!hasGroups&&(!Number.isInteger(longAttempt)||longAttempt<1||!Number.isInteger(longMark)||longMark<1))fail(`${at}: legacy long attempt and marks must be positive whole numbers`);
  const mcq=Object.values(p.mcq).reduce((a,b)=>a+ +b,0), short=p.short.reduce((a,x)=>a+ +x.attempt*shortMark,0), long=hasGroups?longGroups.reduce((n,g)=>n+g.totalMarks,0):longAttempt*longMark, total=mcq*mcqMark+short+long;
  if(p.totalMarks!=null&&+p.totalMarks!==total)fail(`${at}: adds up to ${total}, not totalMarks ${p.totalMarks}`);
  if(p.totalMarks!=null&&+course.marks!==total)fail(`${at}: total ${total} does not match course marks ${course.marks}`);
  return {id:str(p.id),courseId:course.courseId,grade:course.classNo,sid:course.subjectId,factory:true,name:str(p.name),note:str(p.note),mcq:Object.fromEntries(Object.entries(p.mcq).map(([k,v])=>[+k,+v])),mcqMark,
   short:p.short.map(x=>({ch:Object.fromEntries(Object.entries(x.ch).map(([k,v])=>[+k,+v])),attempt:+x.attempt})),shortMark,long:legacySlots.map(a=>a.map(Number)),longGroups,longAttempt,longMark,totalMarks:total};
 }
 function convert(j,label){
  label=label||'course bank';if(!obj(j))fail(`${label}: not a JSON object`);if(+j.schemaVersion!==2)fail(`${label}: schemaVersion must be 2`);
  if(!/^(9|10|11|12)-(computer|physics|chemistry|biology|maths)$/.test(str(j.courseId)))fail(`${label}: invalid courseId`);
  const [classText,sid]=j.courseId.split('-');if(+j.class!==+classText||j.subjectId!==sid)fail(`${label}: courseId, class and subjectId do not match`);
  if(!str(j.classLabel).trim()||!str(j.subject).trim()||!str(j.code).trim())fail(`${label}: classLabel, subject and code are required`);
  if(!['bilingual','english'].includes(j.language))fail(`${label}: language must be bilingual or english`);
  if(!Number.isInteger(+j.marks)||+j.marks<1)fail(`${label}: marks must be a positive whole number`);
  if(!obj(j.times)||!whole(j.times.objective)||+j.times.objective<1||!whole(j.times.subjective)||+j.times.subjective<1||!['stated','inferred'].includes(j.times.basis))fail(`${label}: invalid times; use positive minutes and stated/inferred basis`);
  if(!Array.isArray(j.chapters))fail(`${label}: chapters must be a list; it may be empty until questions are authored`);
  const raw={},nums=[];
  j.chapters.forEach((ch,ci)=>{
   const no=+ch.number;if(!Number.isInteger(no)||no<1||raw[no])fail(`${label}: chapter #${ci+1} has an invalid or duplicate number`);if(!str(ch.name).trim())fail(`${label}: chapter ${no} needs a name`);
   const r={n:str(ch.name),m:[],s:[],l:[]};
   (ch.mcq||[]).forEach((q,i)=>{const at=`${label} chapter ${no} mcq #${i+1}`;if(!Array.isArray(q.options)||q.options.length!==4)fail(`${at}: options must have exactly 4 entries`);const a=typeof q.answer==='number'?q.answer:LETTERS.indexOf(str(q.answer).trim().toUpperCase());if(a<0||a>3)fail(`${at}: answer must be A, B, C or D`);const row=[str(q.question),str(q.questionUr)];q.options.forEach(o=>row.push(str(o&&o.en),str(o&&o.ur)));row.push(a,q.alpExcluded?1:0,figureRef(q.figure,at),str(q.figureAlt));q.options.forEach((o,k)=>row.push(figureRef(o&&o.figure,`${at} option ${k+1}`),str(o&&o.figureAlt)));r.m.push(row);});
   (ch.short||[]).forEach((q,i)=>{const at=`${label} chapter ${no} short #${i+1}`,row=[str(q.question),str(q.questionUr),q.alpExcluded?1:0,figureRef(q.figure,at),str(q.figureAlt)];r.s.push(row);});
   (ch.long||[]).forEach((q,i)=>{const at=`${label} chapter ${no} long #${i+1}`,row=[str(q.question),str(q.questionUr),q.source==='composed'?'c':'b',q.alpExcluded?1:0,figureRef(q.figure,at),str(q.figureAlt)];r.l.push(row);});raw[no]=r;nums.push(no);
  });
  const alp=j.alp||{},alpCh=(alp.chapters||nums).map(Number),alpEx=(alp.excludedChapters||[]).map(Number);
  alpCh.concat(alpEx).forEach(n=>{if(!nums.includes(n))fail(`${label}: ALP references chapter ${n}, which is not in chapters`);});
  const catalog=j.contentCatalog||{},qContent=j.questionContent||{};
  if(!obj(catalog)||!obj(qContent))fail(`${label}: contentCatalog and questionContent must be objects`);
  Object.keys(catalog).forEach(ch=>{if(!nums.includes(+ch))fail(`${label}: contentCatalog refers to missing chapter ${ch}`);});const catalogIds={};nums.forEach(c=>{const cc=catalog[c]||{};catalogIds[c]={topics:new Set(),exercises:new Set()};['topics','exercises'].forEach(k=>{if(cc[k]!==undefined&&!Array.isArray(cc[k]))fail(`${label}: Chapter ${c} ${k} catalog must be a list`);(cc[k]||[]).forEach((it,i)=>{if(!obj(it)||!str(it.id).trim()||!str(it.name).trim())fail(`${label}: Chapter ${c} ${k} item ${i+1} needs id and name`);if(it.alpExcluded!==undefined&&typeof it.alpExcluded!=='boolean')fail(`${label}: Chapter ${c} ${k} item ${i+1} alpExcluded must be boolean`);if(catalogIds[c][k].has(it.id))fail(`${label}: Chapter ${c} ${k} duplicate id ${it.id}`);catalogIds[c][k].add(it.id);});});});
  Object.keys(qContent).forEach(ch=>{
   const c=+ch;if(!nums.includes(c)||!obj(qContent[ch]))fail(`${label}: questionContent refers to invalid chapter ${ch}`);
   ['mcq','short','long'].forEach(t=>{
    const maps=qContent[ch][t]||{};if(!obj(maps))fail(`${label}: questionContent ${ch}.${t} must be an object`);
    Object.keys(maps).forEach(ix=>{
     const i=+ix,chapter=j.chapters.find(x=>+x.number===c),counts={mcq:(chapter.mcq||[]).length,short:(chapter.short||[]).length,long:(chapter.long||[]).length};
     if(!Number.isInteger(i)||i<0||i>=counts[t])fail(`${label}: questionContent ${ch}.${t}.${ix} points to missing question`);
     const tags=maps[ix];if(!obj(tags))fail(`${label}: questionContent ${ch}.${t}.${ix} must be an object`);
     ['topics','exercises'].forEach(k=>{if(tags[k]!==undefined&&!Array.isArray(tags[k]))fail(`${label}: questionContent ${ch}.${t}.${ix}.${k} must be an array`);(tags[k]||[]).forEach(id=>{if(!catalogIds[c][k].has(id))fail(`${label}: questionContent ${ch}.${t}.${ix} references unknown ${k} id ${id}`);});});
    });
   });
  });
  const meta={courseId:j.courseId,classNo:+j.class,classLabel:str(j.classLabel),classUr:str(j.classUr),subjectId:sid,code:str(j.code),subject:str(j.subject),subjectUr:str(j.subjectUr),language:j.language,marks:+j.marks,
   times:{objective:+j.times.objective,subjective:+j.times.subjective,basis:j.times.basis},alpCh,alpEx,alpSummary:str(alp.summary),contentCatalog:j.contentCatalog||{},questionContent:j.questionContent||{},
   exRules:(j.exclusionRules||[]).map((x,i)=>{let re;try{re=new RegExp(str(x.pattern),str(x.flags)||'i');}catch(e){fail(`${label}: exclusionRules[${i}] has invalid pattern (${e.message})`);}if(!nums.includes(+x.chapter))fail(`${label}: exclusionRules[${i}] refers to missing chapter ${x.chapter}`);return{u:+x.chapter,name:str(x.name),pp:str(x.pages),re};})};
  const course={courseId:meta.courseId,classNo:meta.classNo,subjectId:sid,marks:meta.marks,chapters:j.chapters,alpChapters:meta.alpCh};
  const patterns=(j.patterns||[]).map((p,i)=>convertPattern(p,course,label,i));
  if(patterns.length&&!j.chapters.length)fail(`${label}: a course with patterns must define chapters`);
  return{raw,meta,patterns,classNo:meta.classNo,courseId:meta.courseId};
 }
 async function getJSON(url){const r=await fetch(url,{cache:'no-cache'});if(!r.ok)fail(`${url}: HTTP ${r.status}`);try{return await r.json();}catch(e){fail(`${url} is not valid JSON — ${e.message}`);}}
 function showError(e){console.error(e);const local=root.location&&root.location.protocol==='file:';document.body.innerHTML='<div style="max-width:640px;margin:12vh auto;padding:0 20px;font:16px/1.5 system-ui,sans-serif;color:#222"><h2>Paper Press could not load its course banks</h2><p style="color:#b00020">'+String(e.message||e).replace(/</g,'&lt;')+'</p>'+(local?'<p>Run <code>python -m http.server</code> in this folder and open <code>http://localhost:8000</code>.</p>':'<p>Expected <code>banks/manifest.json</code> with 20 course entries and schema-v2 course files.</p>')+'</div>';}
 async function boot(version){const q=version?'?v='+encodeURIComponent(version):'';try{
  const base='banks/',man=await getJSON(base+'manifest.json'+q);if(!man||+man.version!==2||!Array.isArray(man.courses))fail(base+'manifest.json must contain version 2 and a courses list');
  const ids=new Set(),loaded=await Promise.all(man.courses.map(async c=>{if(!c||!str(c.id)||!str(c.file))fail('manifest.json contains a course without id/file');if(ids.has(c.id))fail(`manifest.json lists course ${c.id} twice`);ids.add(c.id);const data=await getJSON(base+c.file+q),converted=convert(data,c.file);if(converted.courseId!==c.id||converted.classNo!==+c.class||data.subjectId!==c.subject)fail(`${c.file}: manifest course details do not match the bank`);return{manifest:c,converted};}));
  root.PP_COURSES=loaded.map(x=>x.converted.meta);root.PP_DATA={};loaded.forEach(x=>root.PP_DATA[x.manifest.id]={raw:x.converted.raw,meta:x.converted.meta,patterns:x.converted.patterns});
  if(root.PP_COURSES.length!==20)fail(`manifest.json should list 20 courses; found ${root.PP_COURSES.length}`);
  for(const file of APP_SCRIPTS){await new Promise((res,rej)=>{const s=document.createElement('script');s.async=false;s.src=file+q;s.onload=res;s.onerror=()=>rej(new Error(file+' failed to load'));document.body.appendChild(s);});}
 }catch(e){showError(e);}}
 const api={convert,convertPattern,boot,scripts:APP_SCRIPTS.slice()};root.PPBanks=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
