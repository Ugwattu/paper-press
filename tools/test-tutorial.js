const fs=require('fs');
const runtime=fs.readFileSync('app-runtime.js','utf8'),html=fs.readFileSync('index.html','utf8'),css=fs.readFileSync('app.css','utf8');
const steps=['#nav','#selectedCourse','#gradeCard','#courseGrid','#alpCard','#chGrid','#contentPick','#grpSections','#grpMcq','#grpShort','#grpLong','#schSel','#segHdr','#segOpt','#pinN','#btnSavePreset','#stage','#topExp'];
const checks=[
 ['first-run tutorial uses v4 completion key',runtime.includes('pp.tutorial.v4')],
 ['tutorial is replayable from the Guide button',html.includes('id="btnTutorial"')&&runtime.includes("btn.addEventListener('click',start)")],
 ['all 18 screens highlight real interface targets',steps.every(s=>runtime.includes(`target:'${s}'`))],
 ['each step describes its highlighted feature and offers a practical tip',runtime.includes('HIGHLIGHTED FEATURE')&&runtime.includes('t.feature')&&runtime.includes('PRACTICAL TIP')&&runtime.includes('t.tip')],
 ['tour automatically navigates to the correct workspace pane',runtime.includes('step.pane')&&runtime.includes('data-pane=')],
 ['collapsed setting groups are opened before highlighting',runtime.includes("group?.classList.contains('closed')")],
 ['spotlight uses an SVG mask cut-out instead of oversized shadows',runtime.includes('paperPressTourMask')&&runtime.includes('maskUnits="userSpaceOnUse"')&&!css.includes('9999px')],
 ['backdrop has no blur and uses light 22% dimming',!css.includes('backdrop-filter:blur')&&runtime.includes('rgba(13,20,35,.22)')],
 ['explanation card is positioned next to the active feature',runtime.includes('positionCard(box)')&&runtime.includes("card.dataset.side=best.side")],
 ['progress indicator is accessible and updates per step',runtime.includes('role="progressbar"')&&runtime.includes('aria-valuenow=')],
 ['Back, Next, End tour and keyboard controls are available',runtime.includes('tour-prev')&&runtime.includes('tour-next')&&runtime.includes('tour-skip')&&runtime.includes("e.key==='Escape'")],
 ['reduced motion preference is respected',runtime.includes('prefers-reduced-motion: reduce')&&css.includes('prefers-reduced-motion:reduce')],
 ['cache and build versions align to v40',runtime.includes("APP_BUILD='v40")&&html.includes('app.css?v=40')&&html.includes('paper.css?v=40')&&html.includes('bank-loader.js?v=40')&&html.includes('data-boot="40"')]
];
for(const [name,ok] of checks){console.log((ok?'PASS ':'FAIL ')+name);if(!ok)process.exitCode=1;}
console.log(`${checks.filter(x=>x[1]).length}/${checks.length} tutorial checks passed`);
