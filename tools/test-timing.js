#!/usr/bin/env node
/* Objective/Subjective timing logic, all-course defaults, inferred UI badge and integration wiring. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const { convert } = require('../bank-loader.js');
const { readAppSource } = require('./_source.js');
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'banks/manifest.json'), 'utf8'));
const root = path.join(__dirname, '..'), script = readAppSource(), html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const BOOKS = {};
for (const c of manifest.courses) BOOKS[c.id] = { times: convert(JSON.parse(fs.readFileSync(path.join(root, 'banks', c.file), 'utf8'))).meta.times };
const elements = {};
const $ = id => elements[id] || (elements[id] = { value: '', textContent: '', classList: { on: {}, toggle(k, v) { this.on[k] = !!v; }, contains(k) { return !!this.on[k]; } } });
const state = { grade: 9, sid: 'computer', timeObj: 0, timeSubj: 0 };
const B = () => BOOKS[`${state.grade}-${state.sid}`];
const start = script.indexOf('function effectiveTimes('), end = script.indexOf('const uid=', start);
if (start < 0 || end < 0) throw new Error('Timing helper functions were not found in the app modules');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const context = vm.createContext({ state, BOOKS, B, $, Math, Number, String, clamp });
vm.runInContext(script.slice(start, end), context, { filename: 'timing-helpers.js' });
let fails = 0;
const check = (name, got, want) => {
  const a = JSON.stringify(got), b = JSON.stringify(want);
  if (a !== b) { fails++; console.error(`FAIL ${name}: wanted ${b}, got ${a}`); }
  else console.log(`OK ${name}`);
};
const ev = expr => vm.runInContext(expr, context);

check('9 Computer ALP split', ev('[effectiveTimes().objective,effectiveTimes().subjective,effectiveTimes().basis]'), [15, 105, 'stated']);
check('duration formatting', ev('[formatDuration(15),formatDuration(105),formatDuration(120),formatDuration(130)]'), ['15 Min.', '1:45 Hours', '2 Hours', '2:10 Hours']);
check('all 20 courses expose valid positive durations', Object.values(BOOKS).every(b => b.times.objective > 0 && b.times.subjective > 0 && ['stated', 'inferred'].includes(b.times.basis)), true);
check('inferred 10 Chemistry default', ev("(state.grade=10,state.sid='chemistry',[effectiveTimes().objective,effectiveTimes().subjective,effectiveTimes().basis])"), [15, 105, 'inferred']);
ev('paintTimeControls()');
check('inferred UI badge label', $('timeBasis').textContent, 'Inferred ALP default');
check('inferred UI badge style', $('timeBasis').classList.contains('inferred'), true);
check('timing inputs show ALP values', [$('iTimeObj').value, $('iTimeSubj').value], [15, 105]);

state.grade = 9; state.sid = 'computer'; state.timeObj = 25; state.timeSubj = 120;
check('independent overrides combine to 2:25', ev('[effectiveTimes().objective,effectiveTimes().subjective,effectiveTimes().total,paperDuration()]'), [25, 120, 145, '2:25 Hours']);
ev('paintTimeControls()');
check('live summary reflects override total', $('timeSummary').textContent, 'Single-paper duration: 2:25 Hours');

const scope = script.match(/header:\{label:[^\n]+keys:\[([^\]]+)\]/);
check('timings belong to header preset scope', !!scope && scope[1].includes("'timeObj'") && scope[1].includes("'timeSubj'"), true);
check('preview and Word export use the same total formatter', (script.match(/paperDuration\(s(?:,sheetKind)?\)/g) || []).length, 2);
check('Reset restores both ALP defaults', /btnTimeReset'[\s\S]{0,180}state\.timeObj=0;state\.timeSubj=0/.test(script), true);
check('numeric timing inputs exist; old free-text field is gone', html.includes('id="iTimeObj"') && html.includes('id="iTimeSubj"') && !html.includes('id="iTime"'), true);
check('legacy saved free-text duration is removed', script.includes('delete state.time;'), true);

console.log(fails ? `${fails} timing check(s) failed` : 'timing OK — defaults, overrides, format, inferred badge, preset scope and header wiring verified');
process.exit(fails ? 1 : 0);
