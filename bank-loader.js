/* Paper Press bank loader — turns the human-friendly JSON question banks (banks/*.json) into the
   structures the app uses, then starts the app. Works in the browser and in Node (for tests/validation). */
(function (root) {
  'use strict';
  const LETTERS = 'ABCD';
  const fail = (m) => { throw new Error(m); };
  const str = (v) => (v == null ? '' : String(v));

  function convert(j, label) {
    label = label || 'bank';
    if (!j || typeof j !== 'object') fail(label + ': not a JSON object');
    if (!Array.isArray(j.chapters) || !j.chapters.length) fail(label + ': "chapters" must be a non-empty list');
    const raw = {};
    j.chapters.forEach((ch, ci) => {
      const no = Number(ch.number);
      if (!Number.isInteger(no) || no < 1) fail(`${label}: chapter #${ci + 1} needs a whole-number "number"`);
      if (raw[no]) fail(`${label}: chapter number ${no} is used twice`);
      const r = { n: str(ch.name) || 'Chapter ' + no, m: [], s: [], l: [] };
      (ch.mcq || []).forEach((q, i) => {
        const at = `${label} chapter ${no} mcq #${i + 1}`;
        if (!Array.isArray(q.options) || q.options.length !== 4) fail(`${at}: "options" must have exactly 4 entries`);
        const a = typeof q.answer === 'number' ? q.answer : LETTERS.indexOf(str(q.answer).trim().toUpperCase());
        if (!(a >= 0 && a <= 3)) fail(`${at}: "answer" must be "A", "B", "C" or "D"`);
        const row = [str(q.question), str(q.questionUr)];
        q.options.forEach((o) => row.push(str(o && o.en), str(o && o.ur)));
        row.push(a); if (q.alpExcluded) row.push(1);
        r.m.push(row);
      });
      (ch.short || []).forEach((q) => { const row = [str(q.question), str(q.questionUr)]; if (q.alpExcluded) row.push(1); r.s.push(row); });
      (ch.long || []).forEach((q) => { const row = [str(q.question), str(q.questionUr), q.source === 'composed' ? 'c' : 'b']; if (q.alpExcluded) row.push(1); r.l.push(row); });
      raw[no] = r;
    });
    const alp = j.alp || {}, nums = Object.keys(raw).map(Number);
    const meta = {
      subject: str(j.subject), subjectUr: str(j.subjectUr),
      alpCh: (alp.chapters || nums).map(Number), alpEx: (alp.excludedChapters || []).map(Number),
      exRules: (j.exclusionRules || []).map((x, i) => {
        let re; try { re = new RegExp(str(x.pattern), str(x.flags) || 'i'); } catch (e) { fail(`${label}: exclusionRules[${i}] has an invalid pattern (${e.message})`); }
        return { u: Number(x.chapter), name: str(x.name), pp: str(x.pages), re };
      })
    };
    return { raw, meta, classNo: Number(j.class) };
  }

  async function getJSON(url) {
    const r = await fetch(url, { cache: 'no-cache' });
    if (!r.ok) fail(`${url}: HTTP ${r.status}`);
    try { return await r.json(); } catch (e) { fail(`${url} is not valid JSON — ${e.message}`); }
  }

  function showError(e) {
    console.error(e);
    const local = root.location && root.location.protocol === 'file:';
    document.body.innerHTML = '<div style="max-width:640px;margin:12vh auto;padding:0 20px;font:16px/1.5 system-ui,sans-serif;color:#222">' +
      '<h2>Paper Press could not load its question banks</h2><p style="color:#b00020">' + String(e.message || e).replace(/</g, '&lt;') + '</p>' +
      (local ? '<p>You opened the page straight from disk, and browsers block loading JSON that way. Either publish it on GitHub Pages, or run <code>python -m http.server</code> in this folder and open <code>http://localhost:8000</code>.</p>' : '<p>Check <code>banks/manifest.json</code> and the JSON files it lists (run <code>node tools/validate-banks.js</code>).</p>') + '</div>';
  }

  async function boot(version) {
    const q = version ? '?v=' + encodeURIComponent(version) : '';
    try {
      const man = await getJSON('banks/manifest.json' + q);
      if (!man || !Array.isArray(man.banks)) fail('banks/manifest.json needs a "banks" list');
      root.PP_META = {};
      const loaded = await Promise.all(man.banks.map(async (b) => ({ b, c: convert(await getJSON('banks/' + b.file + q), b.file) })));
      loaded.forEach(({ b, c }) => {
        if (c.classNo !== Number(b.class)) fail(`${b.file}: manifest says class ${b.class} but the file says class ${c.classNo}`);
        root['RAW' + c.classNo] = c.raw; root.PP_META[c.classNo] = c.meta;
      });
      if (!root.RAW9 || !root.RAW10) fail('the manifest must list one bank for class 9 and one for class 10');
      await new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'script.js' + q; s.onload = res; s.onerror = () => rej(new Error('script.js failed to load')); document.body.appendChild(s); });
    } catch (e) { showError(e); }
  }

  const api = { convert, boot };
  root.PPBanks = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
