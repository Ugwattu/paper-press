#!/usr/bin/env node
/* Static accessibility checks on the booted DOM (a real-browser axe run is in e2e/a11y.spec.js; this catches regressions without a browser). */
const { loadApp } = require('./_app.js');
const { dom, ev } = loadApp(); const d = dom.window.document; let n = 0, fails = 0;
const ok = (c, m) => { n++; if (c) console.log('PASS ' + m); else { fails++; console.error('FAIL ' + m); } };
try { ev('syncUI();render();renderPresets();paintCourseUI();buildChips();'); } catch (e) { /* ignore */ }
const name = (el) => { const t = (el.getAttribute('aria-label') || '').trim(); if (t) return t; const lb = el.getAttribute('aria-labelledby'); if (lb && lb.split(/\s+/).some((i) => ((d.getElementById(i) || {}).textContent || '').trim())) return 'labelledby';
  if (el.id && d.querySelector('label[for="' + el.id + '"]')) return 'label'; if (el.closest('label')) return 'label'; return ((el.textContent || '').trim() || el.getAttribute('title') || el.getAttribute('placeholder') || '').trim(); };
const unnamed = [...d.querySelectorAll('button,[role=button],a[href],input:not([type=hidden]),select,textarea,[role=switch],[role=checkbox],[role=tab]')].filter((e) => !name(e) && e.id !== 'btnAutoBackup').map((e) => e.tagName.toLowerCase() + '#' + e.id);
ok(unnamed.length === 0, 'every control has an accessible name' + (unnamed.length ? ': ' + unnamed.join(', ') : ''));
const icon = [...d.querySelectorAll('button')].filter((b) => !(b.textContent || '').trim() && !b.getAttribute('aria-label') && b.id !== 'btnAutoBackup'); /* hidden; its text is set by JS */
ok(icon.length === 0, 'icon-only buttons carry an aria-label (' + icon.map((b) => b.id || b.className).join(',') + ')');
const toasts = d.getElementById('toasts'); ok(toasts && /status|alert/.test(toasts.getAttribute('role') || '') && !!toasts.getAttribute('aria-live'), 'toasts are a live region');
const dr = d.getElementById('drawer'); ok(dr.getAttribute('role') === 'dialog' && dr.getAttribute('aria-modal') === 'true' && !!dr.getAttribute('aria-labelledby'), 'drawer is a labelled modal dialog');
ok(d.getElementById('keysDlg').tagName === 'DIALOG' && !!d.getElementById('keysDlg').getAttribute('aria-labelledby'), 'shortcuts dialog is a native, labelled <dialog>');
const cards = [...d.querySelectorAll('#courseGrid [data-course]')]; ok(cards.length > 0 && cards.every((c) => c.hasAttribute('aria-pressed')) && cards.some((c) => c.getAttribute('aria-pressed') === 'true'), 'course cards expose selected state via aria-pressed');
ev('coursePickerGrade=11;paintCourseUI();'); const chips = [...d.querySelectorAll('#groupBar [data-group]')]; ok(chips.length > 2 && chips.every((c) => c.hasAttribute('aria-pressed')), 'group chips expose aria-pressed');
const tg = [...d.querySelectorAll('.tg')]; ok(tg.length > 0 && tg.every((t) => t.getAttribute('role') && t.hasAttribute('tabindex')), 'all toggles are keyboard-focusable with a role');
ok(!d.querySelector('img:not([alt])'), 'every image has an alt attribute');
const css = require('fs').readFileSync(require('path').join(__dirname, '..', 'app.css'), 'utf8'); ok(/:focus-visible\{outline:2px solid/.test(css) && /input:focus-visible,select:focus-visible/.test(css), 'focus-visible rings exist for buttons and form fields');
const src = ['app-render.js', 'app-interface.js'].map((f) => require('fs').readFileSync(require('path').join(__dirname, '..', f), 'utf8')).join('\n');
ok(/e\.key==='Escape'/.test(src) && /closeDrawer\(\)/.test(src) && /_retFocus/.test(src) && /e\.key!=='Tab'/.test(src), 'drawer closes on Escape, traps Tab and returns focus');
console.log(`${n - fails}/${n} accessibility checks passed`); process.exit(fails ? 1 : 0);
