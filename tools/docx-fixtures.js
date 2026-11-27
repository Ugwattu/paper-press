/* Builds the DOCX fidelity fixtures through the app's own export path.
   Banks for non-Computer subjects are empty by design (the user authors the questions), so those fixtures
   use SYNTHETIC in-memory questions labelled "FIXTURE" – they exist only inside the test process and are never written to banks/. */
const { loadApp } = require('./_app.js');
const FIXTURES = [
  { name: 'computer9-bilingual', course: '9-computer', urdu: true, omr: false, synth: false },
  { name: 'physics11-english', course: '11-physics', urdu: false, omr: false, synth: true },
  { name: 'maths10-formulas', course: '10-maths', urdu: true, omr: false, synth: true, math: true },
  { name: 'computer10-omr', course: '10-computer', urdu: true, omr: true, synth: false }
];
async function buildFixtures(only) {
  const { dom, ev } = loadApp(); const out = {};
  for (const f of FIXTURES) {
    if (only && !only.includes(f.name)) continue;
    const [grade, sid] = [parseInt(f.course, 10), f.course.replace(/^\d+-/, '')];
    if (f.synth) ev(`(()=>{const B=BOOKS['${f.course}'];const math=${!!f.math};const ur=${f.urdu};
      for(const t of ['mcq','short','long'])for(const ch of Object.keys(B.names)){B[t][ch]=[];const n=t==='mcq'?6:t==='short'?6:4;
        for(let i=1;i<=n;i++){const tex=math?' Evaluate \\\\(\\\\frac{a+b}{2}\\\\) and $x^2+y^2=r^2$.':'';
          const o={id:'q-fixture-'+t+'-'+ch+'-'+i,ch:+ch,en:'FIXTURE '+t+' '+ch+'.'+i+' (synthetic, not exam content).'+tex,ur:ur?'فکسچر '+t+' '+ch+'.'+i:'',ex:false,figure:'',figureAlt:'',content:{topics:[],exercises:[]}};
          if(t==='mcq'){o.o=[['Option A','الف'],['Option B','ب'],['Option C','ج'],['Option D','د']];o.of=['','','',''];o.oa=['','','',''];o.a=i%4;}
          if(t==='long')o.src='bank';B[t][ch].push(o);}}})();`);
    ev(`state=JSON.parse(JSON.stringify(DEF));state.grade=${grade};state.sid='${sid}';state.alp=false;state.chapters=Object.keys(BOOKS['${f.course}'].names).map(Number);state.schemeId=offFor('${f.course}').id;state.showUrdu=${f.urdu};state.omr=${f.omr};state.omrPos='front';state.seed=1234;state.klass=BOOKS['${f.course}'].classLabel;state.subject=BOOKS['${f.course}'].subject;state.subjectUr=BOOKS['${f.course}'].subjectUr||'';overrides={};sticky={};applySchemeCounts(true);render();`);
    if (f.math) { /* Real MathJax needs a browser. Here formulas become labelled placeholder PNGs so the DOCX structure (inline image runs) is exercised; glyph rendering is NOT verified. */
      const nc = require('@napi-rs/canvas'), cv = nc.createCanvas(60, 24), g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 60, 24); g.strokeStyle = '#000'; g.strokeRect(1, 1, 58, 22);
      const bytes = new Uint8Array(cv.toBuffer('image/png'));
      dom.window.__fixtureMath = { bytes, widthPt: 30, heightPt: 12, baseSize: 11, display: false };
      ev("ensureMathJax=async()=>({tex2svgPromise:async()=>({querySelector:()=>({})})});mathSvgToPng=async(n,tex,display)=>Object.assign({},window.__fixtureMath,{display:!!display});");
      await ev('preloadMathAssets()');
    }
    out[f.name] = { bytes: await ev('zipPack(buildDocx(true))'), meta: f };
  }
  dom.window.close(); return out;
}
module.exports = { FIXTURES, buildFixtures };
if (require.main === module) {
  const fs = require('fs'), path = require('path'), dir = path.join(__dirname, '..', 'build', 'docx-fixtures'); fs.mkdirSync(dir, { recursive: true });
  buildFixtures().then((r) => { for (const [n, v] of Object.entries(r)) { fs.writeFileSync(path.join(dir, n + '.docx'), Buffer.from(v.bytes)); console.log('wrote', n + '.docx', v.bytes.length, 'bytes'); } }).catch((e) => { console.error(e); process.exit(1); });
}
