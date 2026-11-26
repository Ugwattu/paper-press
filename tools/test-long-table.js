#!/usr/bin/env node
const fs=require('fs');
const src=fs.readFileSync(require('path').join(__dirname,'..','app-paper.js'),'utf8');
const checks=[
 ['grouped long rows span English grid columns', /<td\$\{cs\(GT,QE\.nw,bi\?QE\.B2:100\)\} style=\"\$\{cell\}font-weight:\$\{wL\};\">\$\{q\.parts\.map\(partHTML\)\.join\(''\)\}<\/td>/.test(src)],
 ['grouped long Urdu rows span Urdu grid columns', /<td\$\{cs\(GT,QE\.B2,QE\.R\)\} style=\"\$\{uc\}font-weight:\$\{wL\};\">\$\{q\.parts\.map\(partUr\)\.join\(''\)\}<\/td>/.test(src)],
 ['regular long rows span English grid columns', /<td\$\{cs\(GT,QE\.nw,bi\?QE\.B2:100\)\} style=\"\$\{cell\}font-weight:\$\{wL\};\">\$\{richHtml\(q\.en\)\}/.test(src)],
 ['regular long Urdu rows span Urdu grid columns', /<td\$\{cs\(GT,QE\.B2,QE\.R\)\} style=\"\$\{uc\}font-weight:\$\{wL\};\">\$\{richHtml\(q\.ur\)\}/.test(src)],
 ['grid spans are applied through the shared helper', src.includes('const cs=(G,a,b)=>')]
];
let failed=0;for(const [name,ok] of checks){console.log((ok?'PASS':'FAIL')+' '+name);if(!ok)failed++;}
console.log(`${checks.length-failed}/${checks.length} long-table layout checks passed`);process.exit(failed?1:0);
