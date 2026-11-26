const fs=require('fs'),assert=require('assert');const ui=fs.readFileSync('app-interface.js','utf8'),html=fs.readFileSync('index.html','utf8'),css=fs.readFileSync('app.css','utf8');
const checks=[
['class picker clearly labels step 1',html.includes('Choose your class')&&html.includes('Start by selecting a grade')],
['subject picker clearly labels step 2',html.includes('Choose your subject')&&html.includes('Only available banks can be opened')],
['course picker has current-course confirmation',ui.includes('Current paper course')&&ui.includes('selectedCourse')],
['subject tiles show bank availability',ui.includes('Question bank coming soon')&&ui.includes('questions available')],
['subject tile shows selected state',ui.includes('Selected')&&ui.includes('subject-state')],
['grade tiles show numeric class labels',ui.includes('grade-number')&&ui.includes('grade-name')],
['topic and exercise are separated into tabs',ui.includes('data-content-tab="topics"')&&ui.includes('data-content-tab="exercises"')],
['tabs show selection progress counts',ui.includes('${selectedT}/${topics.length}')&&ui.includes('${selectedE}/${exercises.length}')],
['selection items are large row targets',css.includes('.content-item{display:flex')&&css.includes('min-height:35px')],
['chapter cards show selected/filter status',ui.includes('selection-count')&&ui.includes('Not filtered')],
['ALP overrides remain accessible',ui.includes('data-content-alp="${kind}"')&&ui.includes("x.dataset.contentAlp")],
['layout has responsive adjustments',css.includes('@media(max-width:520px)')]
];for(const [name,ok] of checks){console.log((ok?'PASS ':'FAIL ')+name);if(!ok)process.exitCode=1;}console.log(`${checks.filter(x=>x[1]).length}/${checks.length} UI-selection checks passed`);
