'use strict';
const fs=require('fs'),path=require('path'),root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),preview=fs.readFileSync(path.join(root,'app-paper.js'),'utf8'),docx=fs.readFileSync(path.join(root,'app-docx.js'),'utf8'),css=fs.readFileSync(path.join(root,'app.css'),'utf8');
const styles=['classic','banner','ruled','split','centered','minimal','boxed','academy','compact'];
let failures=0;function check(ok,msg){console.log((ok?'PASS ':'FAIL ')+msg);if(!ok)failures++;}
check(styles.every(s=>html.includes(`data-v="${s}"`)),'Header chooser exposes nine named styles');
for(const s of styles.slice(1)){check(preview.includes(`HS==='${s}'`),`${s} has a live preview implementation`);check(docx.includes(`HS==='${s}'`),`${s} has a DOCX export implementation`);}
check(html.includes('hdr-style-grid')&&css.includes('.hdr-style-grid'),'Style picker is presented as a responsive grid');
check(html.includes('app.css?v=40')&&html.includes('paper.css?v=40')&&html.includes('data-boot="40"'),'Cache versions are aligned with build 40');
console.log(`${failures?failures+' failure(s)':'Header styles OK'} — ${styles.length} named styles`);process.exit(failures?1:0);
