#!/usr/bin/env node
/* Standalone tests for safe LaTeX tokenization, live-preview markup and Word formula-image wiring. */
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.join(__dirname,'..');let passed=0,failed=0;
const check=(label,ok)=>{if(ok){passed++;console.log('OK '+label);}else{failed++;console.error('FAIL '+label);}};
const core=fs.readFileSync(path.join(root,'app-core.js'),'utf8'),a=core.indexOf('const esc=s=>'),b=core.indexOf('function cleanFigureRef',a),ctx={};
vm.runInNewContext(core.slice(a,b)+'\nglobalThis.api={safeLatex,inlineTokens,richHtml,plainRichText};',ctx);
const api=ctx.api;
const inline=api.inlineTokens('Energy $E=mc^2$ and \\(\\frac{a}{b}\\).');
check('inline dollar and parenthesis delimiters are tokenized',inline.filter(t=>t.type==='math').length===2&&inline.filter(t=>t.type==='math').every(t=>t.display===false));
const display=api.inlineTokens('Area: \\[A=\\int_0^1 f(x)\\,dx\\] and $$x^2+y^2=z^2$$');
check('bracket and double-dollar display delimiters are tokenized as display math',display.filter(t=>t.type==='math').length===2&&display.filter(t=>t.type==='math').every(t=>t.display===true));
check('AMS aligned environments remain available',api.safeLatex('\\begin{aligned}a&=b\\\\c&=d\\end{aligned}'));
check('fractions, roots, sums and integrals are accepted',[
  '\\frac{a}{b}','\\sqrt{x}','\\sum_{i=1}^n i','\\int_0^1 x^2\\,dx','\\begin{cases}x&x>0\\\\0&x=0\\end{cases}'
].every(api.safeLatex));
check('unsafe MathJax extension, link, external include and macro-definition commands are rejected',[
  '\\require{html}','\\href{javascript:alert(1)}{x}','\\includegraphics{https://x/y.png}','\\input{/etc/passwd}','\\newcommand{\\x}{bad}'
].every(x=>!api.safeLatex(x)));
check('malformed or oversized TeX is rejected',!api.safeLatex('   ')&&!api.safeLatex('x'.repeat(4001)));
const html=api.richHtml('Inline $x^2$ then \\[\\frac{1}{2}\\]');
check('preview markup uses MathJax inline and display delimiters with escaped source',html.includes('pp-math-inline')&&html.includes('pp-math-block')&&html.includes('\\(x^2\\)')&&html.includes('\\[\\frac{1}{2}\\]'));
check('TeX text cannot inject markup into preview HTML',api.richHtml('$\\text{<img src=x onerror=alert(1)>}$').includes('$\\text{&lt;img src=x onerror=alert(1)&gt;}$'));
check('unsafe TeX stays inert escaped source',api.richHtml('$\\href{javascript:alert(1)}{x}$').includes('\\href{javascript:alert(1)}'));
check('plain-text question search keeps readable math content',api.plainRichText('Find $x^2+\\sqrt{y}$').includes('x^2')&&api.plainRichText('\\(\\frac{a}{b}\\)').includes('a b'));

const docx=fs.readFileSync(path.join(root,'app-docx.js'),'utf8'),iface=fs.readFileSync(path.join(root,'app-interface.js'),'utf8'),render=fs.readFileSync(path.join(root,'app-render.js'),'utf8');
check('DOCX has a MathJax SVG-to-PNG preloader',docx.includes('async function preloadMathAssets()')&&docx.includes('async function mathSvgToPng(')&&docx.includes("new Blob([new XMLSerializer().serializeToString(copy)]"));
check('DOCX embeds formulas inline and on centered display paragraphs',docx.includes('function mathImageRun(')&&docx.includes("align:'center',after:2,lh:1.1")&&docx.includes("imgXml(mm,emu(w),emu(h)"));
check('DOCX scans MCQ options, short, long and split-part formulas',docx.includes('(q.o||[]).forEach')&&docx.includes('(built.short||[]).forEach')&&docx.includes('(built.long||[]).forEach'));
check('export preloads LaTeX and reports formula-conversion errors',iface.includes('await preloadMathAssets()')&&iface.includes("err.message?err.message"));
check('live preview and question picker are scheduled for MathJax typesetting',render.includes('typesetMathIn(sheet)')&&render.includes("typesetMathIn($('dList'))"));
check('MathJax loads from the configured v3 SVG output CDN only on demand',core.includes('https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-svg.js')&&core.includes('function ensureMathJax()')&&core.includes('script.crossOrigin=\'anonymous\''));
console.log(`\n${passed}/${passed+failed} LaTeX checks passed`);process.exit(failed?1:0);
