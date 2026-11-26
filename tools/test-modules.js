#!/usr/bin/env node
/* Confirms the ordered classic-script module set, syntax, and shared global lexical compatibility. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { scripts } = require('../bank-loader.js');
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
check('bank loader awaits each module before loading the next', /for\(const file of APP_SCRIPTS\)\{await new Promise/.test(loader) && /s\.async=false/.test(loader));
check('jsdom harness executes each module as a separate script', /for \(const file of scripts\) new vm\.Script\(read\(file\)/.test(fs.readFileSync(path.join(__dirname, '_app.js'), 'utf8')));
check('static feature tests read from the module list', ['test-timing.js', 'test-language.js', 'test-sheets.js'].every((f) => fs.readFileSync(path.join(__dirname, f), 'utf8').includes("require('./_source.js')")));
check('old monolithic script entry point is removed', !fs.existsSync(path.join(root, 'script.js')));

(async () => {
  /* Exercise the real bank loader with real bank JSON and a fake script element loader. */
  const injected = [];
  const fakeDocument = {
    body: { appendChild(script) { injected.push(script.src); setImmediate(() => script.onload && script.onload()); } },
    createElement() { return {}; }
  };
  const fakeWindow = { location: { protocol: 'http:' }, document: fakeDocument };
  const fetch = async (url) => {
    const file = path.join(root, url.split('?')[0]);
    return { ok: fs.existsSync(file), json: async () => JSON.parse(fs.readFileSync(file, 'utf8')) };
  };
  const loaderContext = vm.createContext({ window: fakeWindow, document: fakeDocument, fetch, console });
  vm.runInContext(fs.readFileSync(path.join(root, 'bank-loader.js'), 'utf8'), loaderContext, { filename: 'bank-loader.js' });
  try {
    await fakeWindow.PPBanks.boot('module-test');
    check('real bank loader injects every module in order after bank validation', JSON.stringify(injected) === JSON.stringify(expected.map((file) => `${file}?v=module-test`)));
    check('bank loader exposes all twenty course banks before app scripts', fakeWindow.PP_COURSES.length === 20 && Object.keys(fakeWindow.PP_DATA).length === 20);
  } catch (e) {
    failures++; console.error(`FAIL simulated loader boot: ${e.stack || e}`);
  }
  console.log(failures ? `${failures} module check(s) failed` : 'modules OK — ordered loading, bank-loader sequence, syntax, global scope and harness verified');
  process.exit(failures ? 1 : 0);
})();
