const fs=require('fs');
const js=fs.readFileSync('app-runtime.js','utf8'),css=fs.readFileSync('app.css','utf8'),html=fs.readFileSync('index.html','utf8');
const tests=[
 ['tutorial is feature-rich with 18 screens',(js.match(/target:'#/g)||[]).length===18],
 ['spotlight targets all course and paper controls',['#selectedCourse','#gradeCard','#courseGrid','#alpCard','#chGrid','#contentPick','#grpSections','#grpMcq','#grpShort','#grpLong','#schSel','#segHdr','#segOpt','#pinN','#btnSavePreset','#stage','#topExp'].every(x=>js.includes(x))],
 ['each step includes an explanation and practical tip',js.includes('body:')&&js.includes('tip:')&&js.includes('PRACTICAL TIP')],
 ['spotlight uses a mask and clean feature outline',css.includes('.tour-shade')&&css.includes('.tour-spotlight')&&js.includes('maskUnits="userSpaceOnUse"')],
 ['tour can be restarted from the Guide button',js.includes('btnTutorial')&&js.includes("btn.addEventListener('click',start)")&&js.includes('function start()')],
 ['new users receive the v4 walkthrough',js.includes('pp.tutorial.v4')],
 ['Back, Next and End tour controls exist',js.includes('tour-skip')&&js.includes('tour-prev')&&js.includes('tour-next')],
 ['cache/build version aligned to v39',html.includes('app.css?v=39')&&html.includes('paper.css?v=39')&&html.includes('bank-loader.js?v=39')&&html.includes("PPBanks.boot('39')")&&js.includes("APP_BUILD='v39")]
];
for(const [name,ok] of tests){console.log((ok?'PASS ':'FAIL ')+name);if(!ok)process.exitCode=1;}
console.log(`${tests.filter(x=>x[1]).length}/${tests.length} onboarding checks passed`);
