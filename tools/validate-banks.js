#!/usr/bin/env node
/* Validates the schema-v2 manifest and each course bank. */
const fs=require('fs'),path=require('path'),{convert}=require('../bank-loader.js');
const dir=path.join(__dirname,'..','banks'),manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
let errors=0,warns=0,questions=0;const ids=new Set(),seenFiles=new Set();

const err=m=>{errors++;console.error('ERROR '+m);},warn=m=>{warns++;console.warn('warn  '+m);};
const checkedSvgs=new Set(),unsafeSvg=/<\s*(?:script|foreignObject|iframe|object|embed)\b|<\s*!\s*(?:DOCTYPE|ENTITY)\b|<\?xml-stylesheet|\son[a-z]+\s*=|\b(?:href|xlink:href)\s*=\s*([\"'])\s*(?:https?:|\/\/|data:|javascript:)|url\(\s*[\"']?\s*(?:https?:|\/\/|data:|javascript:)|@import\b/i;
const figure=(ref,tag)=>{if(ref==null||ref==='')return;if(typeof ref!=='string'){err(`${tag}: figure must be a filename string`);return;}const name=ref.replace(/^figures\//i,'');if(!/^[a-z0-9][a-z0-9._-]*\.(?:png|svg)$/i.test(name)){err(`${tag}: figure must be a PNG/SVG filename inside figures/`);return;}const full=path.join(__dirname,'..','figures',name);if(!fs.existsSync(full)){err(`${tag}: missing figure file figures/${name}`);return;}if(name.toLowerCase().endsWith('.svg')&&!checkedSvgs.has(name)){checkedSvgs.add(name);try{const svg=fs.readFileSync(full,'utf8');if(svg.length>2e6||unsafeSvg.test(svg))err(`${tag}: SVG figures must be under 2 MB, self-contained, and contain no scripts or external resources`);}catch(e){err(`${tag}: could not read SVG figure figures/${name} (${e.message})`);}}};
if(+manifest.version!==2)err('manifest.json version must be 2');
if(!Array.isArray(manifest.courses))err('manifest.json must contain a courses list');
for(const c of manifest.courses||[]){
 const tag=c.file||c.id||'unknown';if(ids.has(c.id))err(`${tag}: duplicate course id ${c.id}`);ids.add(c.id);
 seenFiles.add(c.file); // shared bank file references are permitted by the manifest
 const file=path.join(dir,c.file||'');if(!fs.existsSync(file)){err(`${tag}: listed in manifest but file is missing`);continue;}
 let j;try{j=JSON.parse(fs.readFileSync(file,'utf8'));}catch(e){err(`${tag}: invalid JSON — ${e.message}`);continue;}
 let converted;try{converted=convert(j,tag);}catch(e){err(e.message);continue;}
 if(j.courseId!==c.id||+j.class!==+c.class||j.subjectId!==c.subject)err(`${tag}: manifest and course metadata do not match`);
 const wanted=c.expected,actual={marks:j.marks,times:j.times,language:j.language};
 if(wanted&&JSON.stringify(actual)!==JSON.stringify(wanted))err(`${tag}: bank marks/time/language do not match manifest expected values`);
 const lang=wanted&&wanted.language;if(lang&&j.language!==lang)err(`${tag}: language should be ${lang} per manifest`);
 if(j.language==='english'&&(j.classUr||j.subjectUr))err(`${tag}: English-only course must not contain Urdu labels`);
 const nums=j.chapters.map(ch=>ch.number);let counts={m:0,s:0,l:0},blankUr=0;const qids=new Set();
 j.chapters.forEach(ch=>{
  (ch.mcq||[]).forEach((q,i)=>{counts.m++;questions++;const at=`${tag} chapter ${ch.number} MCQ #${i+1}`;if(!q.id||typeof q.id!=='string')err(`${at}: stable id field is required`);if(q.id&&qids.has(q.id))err(`${at}: duplicate question id ${q.id}`);if(q.id)qids.add(q.id);if(!q.question||!q.question.trim())err(`${at}: empty question`);if(q.options.some(o=>!o.en||!o.en.trim()))err(`${at}: an English option is empty`);if(q.options.some(o=>!o.ur||!o.ur.trim()))blankUr++;figure(q.figure,at);(q.options||[]).forEach((o,k)=>figure(o.figure,`${at} option ${k+1}`));});
  (ch.short||[]).forEach((q,i)=>{counts.s++;questions++;const at=`${tag} chapter ${ch.number} short #${i+1}`;if(!q.id||typeof q.id!=='string')err(`${at}: stable id field is required`);if(q.id&&qids.has(q.id))err(`${at}: duplicate question id ${q.id}`);if(q.id)qids.add(q.id);if(!q.question||!q.question.trim())err(`${at}: empty question`);if(!q.questionUr)blankUr++;figure(q.figure,at);});
  (ch.long||[]).forEach((q,i)=>{counts.l++;questions++;const at=`${tag} chapter ${ch.number} long #${i+1}`;if(!q.id||typeof q.id!=='string')err(`${at}: stable id field is required`);if(q.id&&qids.has(q.id))err(`${at}: duplicate question id ${q.id}`);if(q.id)qids.add(q.id);if(!q.question||!q.question.trim())err(`${at}: empty question`);if(!q.questionUr)blankUr++;figure(q.figure,at);});
 });
 if(j.language==='english'&&j.subjectUr)warn(`${tag}: English-only course has a subjectUr value`);
 if(!converted.meta.alpSummary&&j.patterns.length)warn(`${tag}: ALP summary is empty`);
 const pat=converted.patterns.length;
 console.log(`${tag}: Class ${j.class} · ${j.subject} · ${j.chapters.length} chapters · ${counts.m} MCQ · ${counts.s} short · ${counts.l} long · ${pat} scheme${pat===1?'':'s'}${j.chapters.length?'':' · no questions yet'} · ${blankUr} blank Urdu cells`);
}
if(!ids.size)err('manifest must list at least one course');
if(manifest.courses.some(c=>!c.id||!c.file||!Number.isInteger(+c.class)||!c.subject))err('Manifest course entries require id, file, class and subject');
console.log(`\n${errors} error(s), ${warns} warning(s), ${questions} authored questions`);process.exit(errors?1:0);
