#!/usr/bin/env node
/* Negative tests for the bank validator: each defect must be reported with file, chapter and question id. */
const fs=require('fs'),path=require('path'),assert=require('assert'),Ajv=require('ajv');
const {checkBank,checkManifest,schemaErrors}=require('./bank-checks.js');
const root=path.join(__dirname,'..'),manifest=JSON.parse(fs.readFileSync(path.join(root,'banks/manifest.json'),'utf8'));
const clone=o=>JSON.parse(JSON.stringify(o));
const course=manifest.courses.find(c=>c.id==='9-computer'),good=JSON.parse(fs.readFileSync(path.join(root,'banks/9-computer.json'),'utf8'));
const ctx={manifest,course,figureExists:n=>fs.existsSync(path.join(root,'figures',n))};
const ajv=new Ajv({allErrors:true,strict:false}),vb=ajv.compile(JSON.parse(fs.readFileSync(path.join(root,'schemas/bank.schema.json'),'utf8')));
let pass=0;const ok=(name,fn)=>{fn();pass++;console.log('PASS '+name);};
const run=b=>({c:checkBank('banks/9-computer.json',b,ctx),s:schemaErrors(vb,b,'banks/9-computer.json',b)});
const ch=b=>b.chapters.find(c=>c.mcq&&c.mcq.length>1);

ok('clean bank has no errors',()=>{const r=run(good);assert.deepStrictEqual(r.c.errors,[]);assert.deepStrictEqual(r.s,[]);});
ok('duplicate question id names file, chapter and id',()=>{const b=clone(good),c=ch(b);c.mcq[1].id=c.mcq[0].id;const e=run(b).c.errors.join('\n');assert(e.includes('banks/9-computer.json')&&e.includes('chapter '+c.number)&&e.includes(c.mcq[0].id)&&/duplicate question id/.test(e));});
ok('duplicate text within a chapter is an error',()=>{const b=clone(good),c=ch(b);c.mcq[1].question=c.mcq[0].question;assert(run(b).c.errors.some(x=>/duplicate question text/.test(x)&&x.includes(c.mcq[1].id)));});
ok('MCQ answer key must be A-D and point at a real option',()=>{let b=clone(good),c=ch(b);c.mcq[0].answer='E';assert(run(b).c.errors.some(x=>/answer key/.test(x)&&x.includes(c.mcq[0].id)));
 b=clone(good);c=ch(b);c.mcq[0].options[1].en='';c.mcq[0].answer='B';assert(run(b).c.errors.some(x=>/empty option/.test(x)));});
ok('MCQ needs exactly four options',()=>{const b=clone(good),c=ch(b);c.mcq[0].options.pop();const r=run(b);assert(r.c.errors.some(x=>/four options/.test(x)&&x.includes(c.mcq[0].id)));assert(r.s.length>0);});
ok('bilingual course requires Urdu text',()=>{const b=clone(good),c=ch(b);c.mcq[0].questionUr='';assert(run(b).c.errors.some(x=>/requires questionUr/.test(x)&&x.includes(c.mcq[0].id)));});
ok('missing figure file is an error',()=>{const b=clone(good),c=ch(b);c.mcq[0].figure='does-not-exist.svg';assert(run(b).c.errors.some(x=>/does-not-exist\.svg/.test(x)&&x.includes(c.mcq[0].id)));});
ok('invalid and unknown chapter numbers are errors',()=>{let b=clone(good);b.chapters[1].number=b.chapters[0].number;assert(run(b).c.errors.some(x=>/duplicate chapter number/.test(x)));
 b=clone(good);b.alp.chapters.push(99);assert(run(b).c.errors.some(x=>/chapter 99/.test(x)));});
ok('undefined group id is an error',()=>{const m=clone(manifest),c=clone(course);c.groups=['nonsense'];assert(checkBank('banks/9-computer.json',good,{...ctx,manifest:m,course:c}).errors.some(x=>/nonsense/.test(x)));
 const m2=clone(manifest);m2.courses[0].groups=['nonsense'];assert(checkManifest(m2).some(x=>/nonsense/.test(x)));});
ok('manifest expected fields must match the bank',()=>{const c=clone(course);c.expected.marks=999;assert(checkBank('banks/9-computer.json',good,{...ctx,course:c}).errors.some(x=>/expected marks 999/.test(x)));});
ok('warnings do not fail the validator',()=>{const {spawnSync}=require('child_process');const r=spawnSync('node',[path.join(__dirname,'validate-banks.js')],{encoding:'utf8'});assert.strictEqual(r.status,0);assert(/warning/.test(r.stdout));});
console.log(`${pass}/${pass} bank-validation checks passed`);
