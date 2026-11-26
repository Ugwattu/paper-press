#!/usr/bin/env node
/* Regression tests for the PECTAA 2026–27 Computer 11/12 bank metadata. */
const fs=require('fs'),path=require('path'),{convert}=require('../bank-loader.js');
const dir=path.join(__dirname,'..','banks');
let errors=0,checks=0;
function check(label,ok){checks++;if(ok)console.log('OK '+label);else{errors++;console.error('FAIL '+label);}}
function load(grade){
 const raw=JSON.parse(fs.readFileSync(path.join(dir,`${grade}-computer.json`),'utf8'));
 return{raw,converted:convert(raw,`${grade}-computer.json`)};
}
function schemeChecks(grade,expected){
 const {raw,converted}=load(grade),p=converted.patterns[0];
 check(`${grade} Computer course is English-only, 75 marks`,raw.language==='english'&&raw.marks===75);
 check(`${grade} Computer has nine named units`,raw.chapters.length===9&&raw.chapters.every((c,i)=>c.number===i+1&&c.name));
 check(`${grade} Computer has no authored questions yet`,raw.chapters.every(c=>!(c.mcq||[]).length&&!(c.short||[]).length&&!(c.long||[]).length));
 check(`${grade} Computer timing is ${expected.basis} 20 + 130 minutes`,raw.times.objective===20&&raw.times.subjective===130&&raw.times.basis===expected.basis);
 check(`${grade} official MCQ distribution totals 15`,Object.values(p.mcq).reduce((a,b)=>a+b,0)===15&&p.mcqMark===1);
 check(`${grade} has three short groups, each prints 9 and attempts 6`,p.short.length===3&&p.short.every(s=>Object.values(s.ch).reduce((a,b)=>a+b,0)===9&&s.attempt===6)&&p.shortMark===2);
 check(`${grade} has five long slots, attempts 3 at 8 marks`,p.long.length===5&&p.longAttempt===3&&p.longMark===8);
 check(`${grade} official pattern totals 75`,p.totalMarks===75&&converted.patterns[0].totalMarks===75);
 check(`${grade} ALP chapter/excluded chapter set matches notification`,JSON.stringify(raw.alp.chapters)===JSON.stringify(expected.alp)&&JSON.stringify(raw.alp.excludedChapters)===JSON.stringify(expected.excluded));
 check(`${grade} topic exclusions are encoded as compiled rules`,raw.exclusionRules.length===expected.rules&&converted.meta.exRules.length===expected.rules&&raw.exclusionRules.every(x=>x.pages&&x.name&&x.pattern));
}
schemeChecks(11,{basis:'stated',alp:[1,2,3,4,5,6,7,8,9],excluded:[],rules:7});
schemeChecks(12,{basis:'inferred',alp:[1,2,3,4,6,7,8,9],excluded:[5],rules:9});
const g11=load(11).raw,g12=load(12).raw;
const interfaceSource=fs.readFileSync(path.join(__dirname,'..','app-interface.js'),'utf8');
check('11th MCQ chapter spread matches PECTAA',JSON.stringify(g11.patterns[0].mcq)==JSON.stringify({'1':3,'2':1,'3':1,'4':1,'5':2,'6':1,'7':2,'8':2,'9':2}));
check('11th short and long chapter allocations match PECTAA',JSON.stringify(g11.patterns[0].short)==JSON.stringify([{ch:{'1':4,'2':3,'8':2},attempt:6},{ch:{'3':3,'6':4,'7':2},attempt:6},{ch:{'4':3,'5':3,'9':3},attempt:6}])&&JSON.stringify(g11.patterns[0].long)==='[[2],[3],[4],[5],[7]]');
check('12th MCQ chapter spread matches PECTAA',JSON.stringify(g12.patterns[0].mcq)==JSON.stringify({'1':2,'2':3,'3':2,'4':2,'6':2,'7':2,'8':1,'9':1}));
check('12th short and long chapter allocations match PECTAA',JSON.stringify(g12.patterns[0].short)==JSON.stringify([{ch:{'1':3,'2':4,'6':2},attempt:6},{ch:{'3':3,'4':6},attempt:6},{ch:{'7':4,'8':2,'9':3},attempt:6}])&&JSON.stringify(g12.patterns[0].long)==='[[1],[3],[6],[8],[9]]');
check('Class 12 Unit 5 is fully excluded and absent from ALP pattern',g12.alp.excludedChapters.includes(5)&&!Object.hasOwn(g12.patterns[0].mcq,'5')&&!g12.patterns[0].long.flat().includes(5));
check('fully excluded chapter warning names the actual chapter dynamically',interfaceSource.includes("toast('Chapter '+c+' — '+(b2.names[c]||'')+' is fully excluded by ALP. Turn ALP off to use it.','warn')")&&!interfaceSource.includes('Chapter 2 is fully excluded by ALP'));
console.log(`\n${errors} failure(s) across ${checks} checks`);process.exit(errors?1:0);
