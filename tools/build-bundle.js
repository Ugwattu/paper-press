#!/usr/bin/env node
const fs=require('fs'),path=require('path');
const files=['app-core.js','app-state.js','app-schemes.js','app-long.js','app-planning.js','app-paper.js','app-docx.js','app-analysis.js','app-presets.js','app-history.js','app-render.js','app-editors.js','app-interface.js','app-runtime.js'];
const root=path.join(__dirname,'..');
const out=files.map(f=>`/* === ${f} === */\n`+fs.readFileSync(path.join(root,f),'utf8')).join('\n;\n');
fs.writeFileSync(path.join(root,'app.bundle.js'),out);console.log(`Bundled ${files.length} ordered modules (${out.length} bytes).`);
