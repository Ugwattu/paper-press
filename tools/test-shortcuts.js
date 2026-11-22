#!/usr/bin/env node
/* Keyboard shortcuts must fire (by physical key, so any keyboard layout works) and must stay quiet while typing. */
const { loadApp } = require('./_app.js');
const { dom, ev } = loadApp();
const doc = dom.window.document;
const press = (code, key, extra, target) => (target || doc).dispatchEvent(new dom.window.KeyboardEvent('keydown', Object.assign({ code, key, bubbles: true, cancelable: true }, extra || {})));
let fails = 0;
const expect = (label, before, act, after) => { const b = ev(before); act(); const a = ev(before); if (a === b === (after !== 'changed')) { /* keep going */ } const ok = after === 'changed' ? a !== b : a === b; if (!ok) { fails++; console.error(`FAIL ${label}: ${JSON.stringify(b)} → ${JSON.stringify(a)}`); } };
if (ev('typeof SHORTCUTS') !== 'object') { console.error('FAIL: the shortcuts block is not running (SHORTCUTS undefined)'); process.exit(1); }
expect('B toggles bilingual', 'state.showUrdu', () => press('KeyB', 'b'), 'changed');
expect('Urdu-layout key for B (key is an Urdu letter)', 'state.showUrdu', () => press('KeyB', 'ب'), 'changed');
expect('O toggles OMR', 'state.omr', () => press('KeyO', 'o'), 'changed');
expect('T toggles chapter tags', 'state.showTags', () => press('KeyT', 't'), 'changed');
expect('K toggles answer key', 'state.showKey', () => press('KeyK', 'k'), 'changed');
expect('S shuffles', 'state.seed', () => press('KeyS', 's'), 'changed');
expect('Urdu-layout key for S shuffles', 'state.seed', () => press('KeyS', 'س'), 'changed');
expect('+ zooms in', 'state.zoom', () => press('Equal', '+'), 'changed');
expect('L opens the blueprint', "document.body.classList.contains('bp-open')", () => press('KeyL', 'l'), 'changed');
expect('? opens the shortcut list', "document.getElementById('keysDlg').hasAttribute('open')||document.getElementById('keysDlg').open", () => press('Slash', '?', { shiftKey: true }), 'changed');
ev("document.getElementById('keysDlg').removeAttribute('open')");
const input = doc.getElementById('iTitle');
expect('typing in a text field does not trigger shortcuts', 'state.showUrdu', () => press('KeyB', 'b', {}, input), 'same');
expect('Ctrl+B is left to the browser', 'state.showUrdu', () => press('KeyB', 'b', { ctrlKey: true }), 'same');
console.log(fails ? `${fails} shortcut check(s) failed` : 'shortcuts OK');
process.exit(fails ? 1 : 0);
