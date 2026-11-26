#!/usr/bin/env node
/* Standalone regression tests for the safe inline markup, figure references and schema-v2 figure fields. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const { convert } = require('../bank-loader.js');
const root = path.join(__dirname, '..');
let passed = 0, failed = 0;
const check = (label, ok) => { if (ok) { passed++; console.log('OK ' + label); } else { failed++; console.error('FAIL ' + label); } };
const core = fs.readFileSync(path.join(root, 'app-core.js'), 'utf8');
const coreStart = core.indexOf('const esc=s=>'), coreEnd = core.indexOf('function syncSubject', coreStart);
const context = {};
vm.runInNewContext(core.slice(coreStart, coreEnd) + '\nglobalThis.api={inlineTokens,richHtml,plainRichText,cleanFigureRef,figureHtml};', context);
const api = context.api;

const formatted = api.richHtml('H<sub>2</sub>O + x<sup>2</sup> + <b>bold</b> + <i>italic</i>');
check('subscript and superscript render as semantic tags', formatted.includes('H<sub>2</sub>O') && formatted.includes('x<sup>2</sup>'));
check('bold and italic markup is rendered', formatted.includes('<strong>bold</strong>') && formatted.includes('<em>italic</em>'));
check('isotope shorthand renders mass, atomic number and element', api.richHtml('^{14}_{6}C').includes('<span class="pp-isotope"><sup>14</sup><sub>6</sub><span>C</span></span>'));
check('line break markup renders as br', api.richHtml('first<br>second').includes('first<br>second'));
check('arbitrary HTML is escaped rather than executed', api.richHtml('<img src=x onerror=alert(1)>').includes('&lt;img src=x onerror=alert(1)&gt;'));
check('plain text search strips supported markup', api.plainRichText('H<sub>2</sub>O x<sup>2</sup>').includes('H2O x2'));
check('figure reference accepts a local PNG/SVG filename', api.cleanFigureRef('logic_gate.svg') === 'figures/logic_gate.svg' && api.cleanFigureRef('figures/cell.png') === 'figures/cell.png');
check('figure reference rejects traversal and external URLs', !api.cleanFigureRef('../secret.svg') && !api.cleanFigureRef('https://example.com/a.png'));
check('figure helper escapes alt text and emits local image URL', api.figureHtml('diagram.png', 'A "safe" diagram').includes('src="figures/diagram.png"') && api.figureHtml('diagram.png', 'A "safe" diagram').includes('&quot;safe&quot;'));

const runAt = fs.readFileSync(path.join(root, 'app-docx.js'), 'utf8');
const runStart = runAt.indexOf('function run('), runEnd = runAt.indexOf('\nfunction para(', runStart);
const richStart = runAt.indexOf('function richTokenRuns('), richEnd = runAt.indexOf('\nfunction richTxtP(', richStart);
const docxContext = { state: { enFont: 'Times New Roman', urFont: 'Noto Nastaliq Urdu', enSize: 11, urSize: 11 }, mathImageRun: () => '<w:r>math</w:r>', X: s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') };
vm.runInNewContext(core.slice(coreStart, coreEnd) + '\n' + runAt.slice(runStart, runEnd) + '\n' + runAt.slice(richStart, richEnd) + '\nglobalThis.docx={richRuns};', docxContext);
const docRuns = docxContext.docx.richRuns('H<sub>2</sub>O + x<sup>2</sup> + ^{14}_{6}C + <b>bold</b> + <i>italic</i>');
check('DOCX emits Word subscript and superscript properties', docRuns.includes('w:val="subscript"') && docRuns.includes('w:val="superscript"'));
check('DOCX preserves bold and italic runs', docRuns.includes('<w:b/>') && docRuns.includes('<w:i/>'));
check('DOCX isotope shorthand formats mass and atomic number as superscript/subscript runs', docRuns.includes('>14</w:t>') && docRuns.includes('>6</w:t>') && docRuns.includes('>C</w:t>'));
const mathRun=docxContext.docx.richRuns('Value $x^2$');
check('DOCX rich-run pipeline inserts the prepared formula image inline',mathRun.includes('math')&&mathRun.includes('w:r'));

const bank = JSON.parse(fs.readFileSync(path.join(root, 'banks/9-computer.json'), 'utf8'));
const sample = JSON.parse(JSON.stringify(bank));
sample.chapters[0].mcq[0].figure = 'logic-gate.svg';
sample.chapters[0].mcq[0].figureAlt = 'AND gate';
sample.chapters[0].mcq[0].options[0].figure = 'truth-table.png';
sample.chapters[0].mcq[0].options[0].figureAlt = 'Truth table';
sample.chapters[0].short[0].figure = 'waveform.svg';
sample.chapters[0].long[0].figure = 'circuit.png';
const converted = convert(sample, 'richtext-fixture.json'), mcq = converted.raw[1].m[0];
check('bank converter retains question and option figure references', mcq[12] === 'figures/logic-gate.svg' && mcq[14] === 'figures/truth-table.png');
check('bank converter retains short and long question figures', converted.raw[1].s[0][3] === 'figures/waveform.svg' && converted.raw[1].l[0][4] === 'figures/circuit.png');
let rejected = false;
try { const bad = JSON.parse(JSON.stringify(bank)); bad.chapters[0].short[0].figure = '../outside.png'; convert(bad, 'bad-figure.json'); } catch (e) { rejected = /figure must be a PNG\/SVG filename/.test(e.message); }
check('bank loader rejects unsafe figure paths', rejected);

const docxSource = fs.readFileSync(path.join(root, 'app-docx.js'), 'utf8');
const svgStart = docxSource.indexOf('function validateSvgFigure('), svgEnd = docxSource.indexOf('\nasync function preloadFigureAssets(', svgStart);
const svgContext = {};
vm.runInNewContext(docxSource.slice(svgStart, svgEnd) + '\nglobalThis.validate=validateSvgFigure;', svgContext);
const safeSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4"/></svg>';
check('self-contained SVG figures are accepted', svgContext.validate(safeSvg, 'diagram.svg') === safeSvg);
check('SVG scripts and external references are rejected', [
  '<svg><script>alert(1)</script></svg>',
  '<svg><image href="https://example.com/a.png"/></svg>',
  '<svg><image href="data:image/png;base64,AAA"/></svg>',
  '<svg><rect onload="alert(1)"/></svg>',
  '<!DOCTYPE svg [<!ENTITY x SYSTEM \"file:///etc/passwd\">]><svg>&x;</svg>'
].every(src => { try { svgContext.validate(src, 'unsafe.svg'); return false; } catch (_) { return true; } }));
check('SVG figure size is bounded', (() => { try { svgContext.validate(' '.repeat(2000001), 'large.svg'); return false; } catch (_) { return true; } })());
const imgStart = docxSource.indexOf('function imgXml('), imgEnd = docxSource.indexOf('\nfunction run(', imgStart);
const imgContext = { X: value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') };
vm.runInNewContext(docxSource.slice(imgStart, imgEnd) + '\nglobalThis.img=imgXml;', imgContext);
check('DOCX image figures carry alternative text metadata', imgContext.img({ rid: 'rId3' }, 100, 100, 123, 'diagram', 'Logic gate diagram').includes('descr="Logic gate diagram"'));
(async () => {
  const preloadStart = docxSource.indexOf('async function preloadFigureAssets()'), preloadEnd = docxSource.indexOf('\nfunction figureParagraph(', preloadStart);
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
  const cacheContext = { FIGURE_CACHE: new Map(), built: { mcq: [{ figure: 'figures/test.png', of: ['figures/option.png'] }], short: [], long: [] }, fetch: async () => ({ ok: true, blob: async () => ({ arrayBuffer: async () => png.buffer.slice(png.byteOffset, png.byteOffset + png.byteLength) }) }) };
  vm.runInNewContext(core.slice(coreStart, coreEnd) + '\n' + docxSource.slice(preloadStart, preloadEnd) + '\nglobalThis.preload=preloadFigureAssets;', cacheContext);
  try {
    await cacheContext.preload();
    check('DOCX preloader fetches and caches PNG figure assets', cacheContext.FIGURE_CACHE.has('figures/test.png') && cacheContext.FIGURE_CACHE.get('figures/test.png').width === 1 && cacheContext.FIGURE_CACHE.has('figures/option.png'));
  } catch (e) { check('DOCX preloader fetches and caches PNG figure assets', false); }

check('DOCX export preloads selected figures before building', fs.readFileSync(path.join(root, 'app-interface.js'), 'utf8').includes('await preloadFigureAssets()'));
check('split DOCX keeps combined media relationships from both sheets', docxSource.includes("buildDocxSheet(true,'subjective',true)") && docxSource.includes("const files=subjective.map("));

console.log(`${passed}/${passed + failed} rich-text and figure checks passed`);
  process.exit(failed ? 1 : 0);
})();
