/* Pure bank checks used by validate-banks.js and test-bank-validation.js.
   Every message names the file, and where applicable the chapter and question id. */
const URDU=/[\u0600-\u06FF\u0750-\u077F]/;
const norm=s=>String(s||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().toLowerCase();

/* Resolve an ajv instancePath such as /chapters/2/mcq/5/answer to a readable location. */
function locate(bank,instancePath){
 const parts=instancePath.split('/').slice(1);let at='';
 if(parts[0]==='chapters'&&parts.length>1){const ch=(bank.chapters||[])[+parts[1]];at=` chapter ${ch&&ch.number!=null?ch.number:'#'+(+parts[1]+1)}`;
  if(ch&&parts[2]&&['mcq','short','long'].includes(parts[2])&&parts[3]!==undefined){const q=(ch[parts[2]]||[])[+parts[3]];at+=` ${parts[2]} question ${q&&q.id?q.id:'#'+(+parts[3]+1)}`;}}
 return at;
}

function schemaErrors(validate,data,file,bank){
 if(validate(data))return [];
 return validate.errors.map(e=>`${file}${bank?locate(bank,e.instancePath):''}: schema ${e.instancePath||'/'} ${e.message}${e.params&&e.params.allowedValues?' ('+e.params.allowedValues.join(', ')+')':''}`);
}

/* ctx: {manifest, course, figureExists(name)->bool} */
function checkBank(file,bank,ctx){
 const errors=[],warnings=[],E=m=>errors.push(m),W=m=>warnings.push(m);
 const manifest=ctx.manifest||{},course=ctx.course||{};
 const chapters=Array.isArray(bank.chapters)?bank.chapters:[];
 const bilingual=bank.language==='bilingual';
 const nums=new Set(),ids=new Map();
 chapters.forEach(ch=>{
  if(!Number.isInteger(ch.number)||ch.number<1)E(`${file} chapter ${ch.number}: chapter number must be a positive integer`);
  else if(nums.has(ch.number))E(`${file} chapter ${ch.number}: duplicate chapter number`);
  nums.add(ch.number);
  const texts=new Map();
  ['mcq','short','long'].forEach(type=>(ch[type]||[]).forEach((q,i)=>{
   const at=`${file} chapter ${ch.number} ${type} question ${q.id||'#'+(i+1)}`;
   if(q.id){if(ids.has(q.id))E(`${at}: duplicate question id (also in ${ids.get(q.id)})`);else ids.set(q.id,`chapter ${ch.number} ${type}`);}
   const t=norm(q.question);
   if(t){if(texts.has(t))E(`${at}: duplicate question text within chapter (same as ${texts.get(t)})`);else texts.set(t,q.id||'#'+(i+1));}
   if(q.figure&&ctx.figureExists){const name=String(q.figure).replace(/^figures\//i,'');if(!ctx.figureExists(name))E(`${at}: figure file figures/${name} does not exist`);}
   if(type==='mcq'){
    const opts=Array.isArray(q.options)?q.options:[];
    if(opts.length!==4)E(`${at}: MCQ must have exactly four options (has ${opts.length})`);
    const idx='ABCD'.indexOf(String(q.answer).trim().toUpperCase());
    if(typeof q.answer==='string'&&q.answer.trim().length!==1||idx<0)E(`${at}: MCQ answer key "${q.answer}" is not one of A, B, C, D`);
    else if(opts.length===4&&!(opts[idx]&&(String(opts[idx].en||'').trim()||opts[idx].figure)))E(`${at}: MCQ answer key ${q.answer} points to an empty option`);
    const optTexts=opts.map(o=>norm(o&&o.en)).filter(Boolean);
    if(new Set(optTexts).size!==optTexts.length)W(`${at}: two MCQ options have identical text`);
    if(bilingual&&opts.some(o=>o&&String(o.en||'').trim()&&!String(o.ur||'').trim()))W(`${at}: some options have no Urdu text`);
   }
   if(bilingual){
    if(!String(q.questionUr||'').trim())E(`${at}: bilingual course requires questionUr`);
    else if(!URDU.test(q.questionUr)&&!/^[\d\s\W]*$/.test(q.questionUr))W(`${at}: questionUr contains no Urdu-script characters`);
   }else if(String(q.questionUr||'').trim())E(`${at}: English-only course must not carry questionUr`);
  }));
 });
 /* chapter references */
 if(chapters.length){
  const bad=(list,where)=>(list||[]).forEach(n=>{if(!nums.has(+n))E(`${file}: ${where} references chapter ${n}, which does not exist`);});
  bad(bank.alp&&bank.alp.chapters,'alp.chapters');bad(bank.alp&&bank.alp.excludedChapters,'alp.excludedChapters');
  (bank.exclusionRules||[]).forEach((r,i)=>{if(!nums.has(+r.chapter))E(`${file}: exclusionRules[${i}] references chapter ${r.chapter}, which does not exist`);
   try{new RegExp(r.pattern,r.flags||'');}catch(e){E(`${file}: exclusionRules[${i}] (chapter ${r.chapter}) has an invalid pattern — ${e.message}`);}});
  (bank.patterns||[]).forEach(p=>{bad(Object.keys(p.mcq||{}),`pattern ${p.id} mcq`);
   (p.short||[]).forEach(s=>bad(Object.keys(s.ch||{}),`pattern ${p.id} short`));
   (p.long||[]).forEach(g=>bad(Array.isArray(g)?g:(g&&g.chapters)||[],`pattern ${p.id} long`));});
  const a=new Set((bank.alp&&bank.alp.chapters)||[]);((bank.alp&&bank.alp.excludedChapters)||[]).forEach(n=>{if(a.has(n))E(`${file}: chapter ${n} is both active and excluded in alp`);});
 }
 /* groups */
 const defined=new Set((manifest.groups||[]).map(g=>g.id));
 (course.groups||[]).forEach(g=>{if(!defined.has(g))E(`${file} (course ${course.id}): group id "${g}" is not defined in manifest.json groups`);});
 /* expected vs bank */
 const w=course.expected;
 if(w){
  if(bank.marks!==w.marks)E(`${file}: manifest expected marks ${w.marks} but bank has ${bank.marks}`);
  if(bank.language!==w.language)E(`${file}: manifest expected language ${w.language} but bank has ${bank.language}`);
  const t=bank.times||{};if(t.objective!==w.times.objective||t.subjective!==w.times.subjective||t.basis!==w.times.basis)E(`${file}: manifest expected times ${JSON.stringify(w.times)} but bank has ${JSON.stringify(t)}`);
 }
 return {errors,warnings};
}
function checkManifest(manifest,file='banks/manifest.json'){
 const errors=[];const g=new Set(),seen=new Set();
 (manifest.groups||[]).forEach(x=>{if(g.has(x.id))errors.push(`${file}: duplicate group id ${x.id}`);g.add(x.id);});
 (manifest.courses||[]).forEach(c=>{if(seen.has(c.id))errors.push(`${file}: duplicate course id ${c.id}`);seen.add(c.id);
  (c.groups||[]).forEach(x=>{if(!g.has(x))errors.push(`${file} course ${c.id}: group id "${x}" is not defined`);});});
 return errors;
}
module.exports={checkBank,checkManifest,schemaErrors,locate,URDU};
