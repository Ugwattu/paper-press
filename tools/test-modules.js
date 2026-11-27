#!/usr/bin/env node
/* Confirms the ordered classic-script module set, syntax, and shared global lexical compatibility. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { scripts, bundle } = require('../bank-loader.js');
const root = path.join(__dirname, '..');
const expected = [
  'app-core.js', 'app-schemes.js', 'app-long.js', 'app-planning.js', 'app-paper.js', 'app-docx.js',
  'app-analysis.js', 'app-presets.js', 'app-render.js', 'app-editors.js', 'app-interface.js', 'app-runtime.js'
];
let failures = 0;
const check = (label, ok) => { if (!ok) { failures++; console.error(`FAIL ${label}`); } else console.log(`OK ${label}`); };
const source = scripts.map((file) => fs.readFileSync(path.join(root, file), 'utf8'));
check('loader exports the twelve app modules in dependency order', JSON.stringify(scripts) === JSON.stringify(expected));
check('each app module exists and starts in strict mode', source.every((s, i) => s.length > 0 && (i === 0 ? /^"use strict";/.test(s) : /^"use strict";/.test(s))));
let syntaxOK = true;
for (let i = 0; i < scripts.length; i++) {
  try { new vm.Script(source[i], { filename: scripts[i] }); }
  catch (e) { syntaxOK = false; console.error(`  ${scripts[i]}: ${e.message}`); }
}
check('each classic-script module parses independently', syntaxOK);
let sharedOK = true;
try { new vm.Script(source.join('\n'), { filename: 'combined-app-modules.js' }); }
catch (e) { sharedOK = false; console.error(`  combined modules: ${e.message}`); }
check('modules have no duplicate global lexical declarations', sharedOK);
const loader = fs.readFileSync(path.join(root, 'bank-loader.js'), 'utf8');
check('loader injects one app bundle and parallelizes bank loads', loader.includes('APP_BUNDLE') && loader.includes('app.bundle.js') && loader.includes('Promise.all(man.courses.map') && loader.includes("cache:'default'"));
check('jsdom harness executes each module as a separate script', /for \(const file of scripts\) new vm\.Script\(read\(file\)/.test(fs.readFileSync(path.join(__dirname, '_app.js'), 'utf8')));
check('static feature tests read from the module list', ['test-timing.js', 'test-language.js', 'test-sheets.js'].every((f) => fs.readFileSync(path.join(__dirname, f), 'utf8').includes("require('./_source.js')")));
check('generated app bundle exactly matches ordered module sources', fs.readFileSync(path.join(root,bundle),'utf8')===source.map((s,i)=>`/* === ${scripts[i]} === */\n`+s).join('\n;\n'));
check('old monolithic script entry point is removed', !fs.existsSync(path.join(root, 'script.js')));

(async () => {
  /* Exercise the real bank loader with real bank JSON and a fake script element loader. */
  const injected = [];
  const fakeDocument = {
    body: { appendChild(script) { injected.push(script.src); setImmediate(() => script.onload && script.onload()); } },
    createElement() { return {}; }
  };
  const fakeWindow = { location: { protocol: 'http:' }, document: fakeDocument };
  let manifestOverride=null;
  const fetch = async (url) => {
    const file = path.join(root, url.split('?')[0]);
    return { ok: fs.existsSync(file)||url.includes('manifest.json'), json: async () => manifestOverride&&url.includes('manifest.json')?manifestOverride:JSON.parse(fs.readFileSync(file, 'utf8')) };
  };
  const loaderContext = vm.createContext({ window: fakeWindow, document: fakeDocument, fetch, console });
  vm.runInContext(fs.readFileSync(path.join(root, 'bank-loader.js'), 'utf8'), loaderContext, { filename: 'bank-loader.js' });
  try {
    await fakeWindow.PPBanks.boot('module-test');
    check('real bank loader injects bundled app after bank validation', JSON.stringify(injected) === JSON.stringify([`${bundle}?v=module-test`]));
    check('bank loader exposes all manifest banks before app bundle', fakeWindow.PP_COURSES.length === JSON.parse(fs.readFileSync(path.join(root,'banks/manifest.json'))).courses.length && Object.keys(fakeWindow.PP_DATA).length === fakeWindow.PP_COURSES.length);
  } catch (e) {
    failures++; console.error(`FAIL simulated loader boot: ${e.stack || e}`);
  }

  const originalManifest=JSON.parse(fs.readFileSync(path.join(root,'banks/manifest.json')));
  manifestOverride={version:2,courses:[originalManifest.courses.find(c=>c.id==='9-computer'),{id:'10-computer',class:10,subject:'computer',file:'9-computer.json',bankCourseId:'9-computer',overrides:{classLabel:'10th',marks:50,times:{objective:15,subjective:105,basis:'stated'}}}]};
  const aliasInjected=[],aliasDoc={body:{appendChild(script){aliasInjected.push(script.src);setImmediate(()=>script.onload&&script.onload());}},createElement(){return{};}};
  const aliasWindow={location:{protocol:'http:'},document:aliasDoc};const aliasCtx=vm.createContext({window:aliasWindow,document:aliasDoc,fetch,console});vm.runInContext(fs.readFileSync(path.join(root,'bank-loader.js'),'utf8'),aliasCtx);
  try{await aliasWindow.PPBanks.boot('shared-test');check('manifest shared-bank alias reuses source questions without copying file',aliasWindow.PP_DATA['10-computer'].raw===aliasWindow.PP_DATA['9-computer'].raw&&aliasWindow.PP_COURSES.find(c=>c.courseId==='10-computer').classNo===10);}
  catch(e){failures++;console.error(`FAIL shared bank alias test: ${e.stack||e}`);}
  manifestOverride={version:2,courses:[originalManifest.courses.find(c=>c.id==='9-computer'),{id:'10-computer',class:10,subject:'computer',file:'missing-bank.json'}]};
  const isolatedDoc={body:{appendChild(script){setImmediate(()=>script.onload&&script.onload());}},createElement(){return{};}};const isolatedWindow={location:{protocol:'http:'},document:isolatedDoc};const isolatedCtx=vm.createContext({window:isolatedWindow,document:isolatedDoc,fetch,console});vm.runInContext(fs.readFileSync(path.join(root,'bank-loader.js'),'utf8'),isolatedCtx);
  try{await isolatedWindow.PPBanks.boot('isolation-test');check('malformed/missing course bank is isolated from valid courses',isolatedWindow.PP_COURSES.length===1&&isolatedWindow.PP_BANK_ERRORS.length===1);}
  catch(e){failures++;console.error(`FAIL bank isolation test: ${e.stack||e}`);}
  console.log(failures ? `${failures} module check(s) failed` : 'modules OK — ordered loading, bank-loader sequence, syntax, global scope and harness verified');
  process.exit(failures ? 1 : 0);
})();
