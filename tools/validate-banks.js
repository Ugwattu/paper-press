#!/usr/bin/env node
/* Validates the schema-v2 manifest and each course bank. */
const fs=require('fs'),path=require('path'),{convert}=require('../bank-loader.js');
const dir=path.join(__dirname,'..','banks'),manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
let errors=0,warns=0,questions=0;const ids=new Set(),seenFiles=new Set();
const defaults={
 '9-computer':[50,15,105,'stated'],'10-computer':[50,15,105,'stated'],
 '9-physics':[60,15,105,'stated'],'10-physics':[60,15,105,'stated'],
 '9-chemistry':[60,15,105,'stated'],'10-chemistry':[60,15,105,'inferred'],
 '9-biology':[60,15,105,'stated'],'10-biology':[60,15,105,'inferred'],
 '9-maths':[75,20,130,'stated'],'10-maths':[75,20,130,'stated'],
 '11-computer':[75,20,130,'stated'],'12-computer':[75,20,130,'inferred'],
 '11-physics':[85,20,160,'stated'],'12-physics':[85,20,160,'inferred'],
 '11-chemistry':[85,20,160,'stated'],'12-chemistry':[85,20,160,'inferred'],
 '11-biology':[85,20,160,'stated'],'12-biology':[85,20,160,'stated'],
 '11-maths':[100,30,150,'stated'],'12-maths':[100,30,150,'inferred']
};
const err=m=>{errors++;console.error('ERROR '+m);},warn=m=>{warns++;console.warn('warn  '+m);};
const checkedSvgs=new Set(),unsafeSvg=/<\s*(?:script|foreignObject|iframe|object|embed)\b|<\s*!\s*(?:DOCTYPE|ENTITY)\b|<\?xml-stylesheet|\son[a-z]+\s*=|\b(?:href|xlink:href)\s*=\s*([\"'])\s*(?:https?:|\/\/|data:|javascript:)|url\(\s*[\"']?\s*(?:https?:|\/\/|data:|javascript:)|@import\b/i;
const figure=(ref,tag)=>{if(ref==null||ref==='')return;if(typeof ref!=='string'){err(`${tag}: figure must be a filename string`);return;}const name=ref.replace(/^figures\//i,'');if(!/^[a-z0-9][a-z0-9._-]*\.(?:png|svg)$/i.test(name)){err(`${tag}: figure must be a PNG/SVG filename inside figures/`);return;}const full=path.join(__dirname,'..','figures',name);if(!fs.existsSync(full)){err(`${tag}: missing figure file figures/${name}`);return;}if(name.toLowerCase().endsWith('.svg')&&!checkedSvgs.has(name)){checkedSvgs.add(name);try{const svg=fs.readFileSync(full,'utf8');if(svg.length>2e6||unsafeSvg.test(svg))err(`${tag}: SVG figures must be under 2 MB, self-contained, and contain no scripts or external resources`);}catch(e){err(`${tag}: could not read SVG figure figures/${name} (${e.message})`);}}};
if(+manifest.version!==2)err('manifest.json version must be 2');
if(!Array.isArray(manifest.courses))err('manifest.json must contain a courses list');
for(const c of manifest.courses||[]){
 const tag=c.file||c.id||'unknown';if(ids.has(c.id))err(`${tag}: duplicate course id ${c.id}`);ids.add(c.id);
 if(seenFiles.has(c.file))err(`${tag}: duplicate course file ${c.file}`);seenFiles.add(c.file);
 const file=path.join(dir,c.file||'');if(!fs.existsSync(file)){err(`${tag}: listed in manifest but file is missing`);continue;}
 let j;try{j=JSON.parse(fs.readFileSync(file,'utf8'));}catch(e){err(`${tag}: invalid JSON — ${e.message}`);continue;}
 let converted;try{converted=convert(j,tag);}catch(e){err(e.message);continue;}
 if(j.courseId!==c.id||+j.class!==+c.class||j.subjectId!==c.subject)err(`${tag}: manifest and course metadata do not match`);
 const wanted=defaults[c.id],actual=[j.marks,j.times.objective,j.times.subjective,j.times.basis];
 if(!wanted||JSON.stringify(actual)!==JSON.stringify(wanted))err(`${tag}: marks/time defaults ${JSON.stringify(actual)} do not match ALP ${JSON.stringify(wanted)}`);
 const lang=+j.class<=10?'bilingual':'english';if(j.language!==lang)err(`${tag}: class ${j.class} must be ${lang}`);
 if(j.language==='english'&&(j.classUr||j.subjectUr))err(`${tag}: English-only course must not contain Urdu labels`);
 const nums=j.chapters.map(ch=>ch.number);let counts={m:0,s:0,l:0},blankUr=0;
 j.chapters.forEach(ch=>{
  (ch.mcq||[]).forEach((q,i)=>{counts.m++;questions++;const at=`${tag} chapter ${ch.number} MCQ #${i+1}`;if(!q.question||!q.question.trim())err(`${at}: empty question`);if(q.options.some(o=>!o.en||!o.en.trim()))err(`${at}: an English option is empty`);if(q.options.some(o=>!o.ur||!o.ur.trim()))blankUr++;figure(q.figure,at);(q.options||[]).forEach((o,k)=>figure(o.figure,`${at} option ${k+1}`));});
  (ch.short||[]).forEach((q,i)=>{counts.s++;questions++;const at=`${tag} chapter ${ch.number} short #${i+1}`;if(!q.question||!q.question.trim())err(`${at}: empty question`);if(!q.questionUr)blankUr++;figure(q.figure,at);});
  (ch.long||[]).forEach((q,i)=>{counts.l++;questions++;const at=`${tag} chapter ${ch.number} long #${i+1}`;if(!q.question||!q.question.trim())err(`${at}: empty question`);if(!q.questionUr)blankUr++;figure(q.figure,at);});
 });
 if(j.language==='english'&&j.subjectUr)warn(`${tag}: English-only course has a subjectUr value`);
 if(!converted.meta.alpSummary&&j.patterns.length)warn(`${tag}: ALP summary is empty`);
 const pat=converted.patterns.length;
 console.log(`${tag}: Class ${j.class} · ${j.subject} · ${j.chapters.length} chapters · ${counts.m} MCQ · ${counts.s} short · ${counts.l} long · ${pat} scheme${pat===1?'':'s'}${j.chapters.length?'':' · no questions yet'} · ${blankUr} blank Urdu cells`);
}
if(ids.size!==20)err(`manifest must list 20 courses; found ${ids.size}`);
for(let grade=9;grade<=12;grade++)for(const sid of ['computer','physics','chemistry','biology','maths'])if(!ids.has(`${grade}-${sid}`))err(`manifest is missing ${grade}-${sid}`);
if(!ids.has('9-computer')||!ids.has('10-computer'))err('Computer banks for classes 9 and 10 must be present');
console.log(`\n${errors} error(s), ${warns} warning(s), ${questions} authored questions`);process.exit(errors?1:0);
