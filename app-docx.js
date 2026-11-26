"use strict";
/* ══════════ ZIP + DOCX ══════════ */
const CRCT=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
function crc32(u8){let c=0xFFFFFFFF;for(let i=0;i<u8.length;i++)c=CRCT[(c^u8[i])&0xFF]^(c>>>8);return(c^0xFFFFFFFF)>>>0;}
const ENC=new TextEncoder();
function zipStore(files){
 const parts=[],central=[];let offset=0;
 const u16=v=>[v&255,(v>>8)&255],u32=v=>[v&255,(v>>8)&255,(v>>16)&255,(v>>>24)&255];
 files.forEach(f=>{const name=ENC.encode(f.name),data=typeof f.data==='string'?ENC.encode(f.data):f.data,crc=crc32(data),pay=f.z||data,meth=f.z?8:0;
  const lh=new Uint8Array([].concat(u32(0x04034b50),u16(20),u16(0x0800),u16(meth),u16(0),u16(0x21),u32(crc),u32(pay.length),u32(data.length),u16(name.length),u16(0)));
  parts.push(lh,name,pay);central.push({name,crc,size:data.length,csize:pay.length,meth,offset});offset+=lh.length+name.length+pay.length;});
 const cdStart=offset,cd=[];
 central.forEach(c=>{cd.push(new Uint8Array([].concat(u32(0x02014b50),u16(20),u16(20),u16(0x0800),u16(c.meth),u16(0),u16(0x21),u32(c.crc),u32(c.csize),u32(c.size),u16(c.name.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(c.offset))),c.name);});
 const cdSize=cd.reduce((a,b)=>a+b.length,0);
 const eo=new Uint8Array([].concat(u32(0x06054b50),u16(0),u16(0),u16(central.length),u16(central.length),u32(cdSize),u32(cdStart),u16(0)));
 const all=parts.concat(cd,[eo]),total=all.reduce((a,b)=>a+b.length,0),out=new Uint8Array(total);let p=0;
 all.forEach(b=>{out.set(b,p);p+=b.length;});return out;
}
async function deflateRaw(u8){const cs=new CompressionStream('deflate-raw'),w=cs.writable.getWriter();w.write(u8);w.close();return new Uint8Array(await new Response(cs.readable).arrayBuffer());}
async function zipPack(files){if(typeof CompressionStream==='undefined')return zipStore(files);
 try{const out=[];for(const f of files){const data=typeof f.data==='string'?ENC.encode(f.data):f.data;let z=null;if(data.length>=200){z=await deflateRaw(data);if(z.length>=data.length)z=null;}out.push({name:f.name,data,z});}return zipStore(out);}
 catch(e){console.warn('deflate unavailable, storing uncompressed',e);return zipStore(files);}}
const X=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const tw=pt=>Math.round(pt*20),emu=pt=>Math.round(pt*12700);
const FIGURE_CACHE=new Map(),MATH_CACHE=new Map();let figureDrawingId=200000,mathDrawingId=400000;
function mathKey(t){return(t.display?'D|':'I|')+t.tex;}
function richTokenRuns(t,o){
 o=o||{};if(t.type==='br')return '<w:r><w:br/></w:r>';
 if(t.type==='isotope')return run(t.mass,Object.assign({},o,{sup:true}))+run(t.atomic,Object.assign({},o,{sub:true}))+run(t.element,o);
 if(t.type==='math')return mathImageRun(t,o);
 return run(t.text,Object.assign({},o,{b:!!o.b||!!t.b,i:!!o.i||!!t.i,sup:!!t.sup,sub:!!t.sub}));
}
function richRuns(value,o){o=o||{};return inlineTokens(value).map(t=>richTokenRuns(t,o)).join('')||run('',o);}
function richTxtP(value,o){
 o=o||{};const tokens=inlineTokens(value);if(!tokens.some(t=>t.type==='math'&&t.display))return para(tokens.map(t=>richTokenRuns(t,o)).join('')||run('',o),o);
 const parts=[];let inline='';
 tokens.forEach(t=>{if(t.type==='math'&&t.display){if(inline){parts.push(para(inline,o));inline='';}parts.push(para(mathImageRun(t,o),{ur:!!o.ur,align:'center',after:2,lh:1.1}));}else inline+=richTokenRuns(t,o);});
 if(inline||!parts.length)parts.push(para(inline||run('',o),o));return parts.join('');
}
function mathImageRun(token,o){
 const item=MATH_CACHE.get(mathKey(token));if(!item)throw new Error('Math formula is not prepared for Word export: '+token.tex);
 o=o||{};const size=Math.max(5,Number(o.sz||(o.ur?state.urSize:state.enSize))||11),scale=size/item.baseSize;
 let w=item.widthPt*scale,h=item.heightPt*scale;const max=token.display?440:280;if(w>max){const k=max/w;w*=k;h*=k;}
 const mm=addMedia(item.bytes,'png'),id=mathDrawingId++;
 return imgXml(mm,emu(w),emu(h),id,'Mathematical formula','LaTeX formula: '+token.tex);
}
async function mathSvgToPng(svg,tex,display){
 if(!svg)throw new Error('MathJax did not produce an SVG for: '+tex);
 const view=String(svg.getAttribute('viewBox')||'').trim().split(/[ ,]+/).map(Number);
 if(view.length!==4||!Number.isFinite(view[2])||!Number.isFinite(view[3])||view[2]<=0||view[3]<=0)throw new Error('MathJax returned invalid formula dimensions: '+tex);
 const baseSize=Math.max(5,Number(state.enSize)||11),widthPt=Math.max(2,view[2]/1000*baseSize),heightPt=Math.max(2,view[3]/1000*baseSize);
 const pxW=Math.max(1,Math.min(2400,Math.ceil(widthPt*96/72*2.5))),pxH=Math.max(1,Math.min(1200,Math.ceil(heightPt*96/72*2.5)));
 const copy=svg.cloneNode(true);copy.setAttribute('xmlns','http://www.w3.org/2000/svg');copy.setAttribute('xmlns:xlink','http://www.w3.org/1999/xlink');copy.setAttribute('color','#000');copy.setAttribute('width',pxW+'px');copy.setAttribute('height',pxH+'px');copy.setAttribute('style','color:#000;');
 const blob=new Blob([new XMLSerializer().serializeToString(copy)],{type:'image/svg+xml;charset=utf-8'}),url=URL.createObjectURL(blob);
 try{const im=await imageFromUrl(url),cv=document.createElement('canvas');cv.width=pxW;cv.height=pxH;const ctx=cv.getContext('2d');if(!ctx)throw new Error('Canvas is unavailable to convert LaTeX for Word export');ctx.clearRect(0,0,pxW,pxH);ctx.drawImage(im,0,0,pxW,pxH);return{bytes:figureBytes(cv.toDataURL('image/png')),widthPt,heightPt,baseSize,display};}
 finally{URL.revokeObjectURL(url);}
}
async function preloadMathAssets(){
 const formulas=new Map(),add=value=>{inlineTokens(value).forEach(t=>{if(t.type==='math')formulas.set(mathKey(t),t);});},addQ=q=>{if(!q)return;add(q.en);add(q.ur);(q.o||[]).forEach(v=>{if(Array.isArray(v)){add(v[0]);add(v[1]);}});};
 (built.mcq||[]).forEach(addQ);(built.short||[]).forEach(p=>(p.items||[]).forEach(addQ));(built.long||[]).forEach(q=>q.parts&&q.parts.length?q.parts.forEach(addQ):addQ(q));
 if(!formulas.size)return;
 const mj=await ensureMathJax();
 for(const [key,t] of formulas){if(MATH_CACHE.has(key))continue;let node;try{node=await mj.tex2svgPromise(t.tex,{display:!!t.display});}catch(e){throw new Error('Could not render LaTeX formula "'+t.tex+'": '+(e.message||e));}
  MATH_CACHE.set(key,await mathSvgToPng(node&&node.querySelector&&node.querySelector('svg'),t.tex,t.display));}
}
function figureBytes(data){const bin=atob(data.split(',')[1]),bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);return bytes;}
function imageFromUrl(url){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('Image could not be decoded'));im.src=url;});}
function validateSvgFigure(source,ref){
 if(source.length>2e6)throw new Error('SVG figure is too large: '+ref);
 const unsafe=/<\s*(?:script|foreignObject|iframe|object|embed)\b|<\s*!\s*(?:DOCTYPE|ENTITY)\b|<\?xml-stylesheet|\son[a-z]+\s*=|\b(?:href|xlink:href)\s*=\s*([\"'])\s*(?:https?:|\/\/|data:|javascript:)|url\(\s*[\"']?\s*(?:https?:|\/\/|data:|javascript:)|@import\b/i;
 if(unsafe.test(source))throw new Error('SVG figure must be self-contained and contain no scripts or external resources: '+ref);
 return source;
}
async function preloadFigureAssets(){
 const refs=new Set(),add=q=>{if(!q)return;if(q.figure)refs.add(cleanFigureRef(q.figure));(q.of||[]).forEach(x=>{if(x)refs.add(cleanFigureRef(x));});};
 built.mcq.forEach(add);built.short.forEach(p=>p.items.forEach(add));built.long.forEach(q=>q.parts&&q.parts.length?q.parts.forEach(add):add(q));refs.delete('');
 for(const ref of refs){if(FIGURE_CACHE.has(ref))continue;const response=await fetch(ref,{cache:'no-cache'});if(!response.ok)throw new Error('Figure file not found: '+ref);const blob=await response.blob(),ext=ref.split('.').pop().toLowerCase();let bytes,width,height;
  if(ext==='png'){bytes=new Uint8Array(await blob.arrayBuffer());if(bytes.length<24||bytes[0]!==137||bytes[1]!==80||bytes[2]!==78||bytes[3]!==71)throw new Error('Invalid PNG figure: '+ref);width=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength).getUint32(16);height=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength).getUint32(20);}
  else{const svg=validateSvgFigure(await blob.text(),ref),safeBlob=new Blob([svg],{type:'image/svg+xml'}),url=URL.createObjectURL(safeBlob);try{const im=await imageFromUrl(url),ratio=(im.naturalWidth||300)/(im.naturalHeight||150);width=Math.min(1600,Math.max(240,im.naturalWidth||600));height=Math.max(1,Math.round(width/ratio));if(height>1600){height=1600;width=Math.round(height*ratio);}const cv=document.createElement('canvas');cv.width=width;cv.height=height;const ctx=cv.getContext('2d');if(!ctx)throw new Error('Canvas is unavailable for SVG conversion');ctx.drawImage(im,0,0,width,height);bytes=figureBytes(cv.toDataURL('image/png'));}finally{URL.revokeObjectURL(url);}}
  if(!width||!height)throw new Error('Figure has invalid dimensions: '+ref);FIGURE_CACHE.set(ref,{bytes,width,height});
 }
}
function figureParagraph(ref,alt,maxWidth){const key=cleanFigureRef(ref);if(!key)return'';const item=FIGURE_CACHE.get(key);if(!item)throw new Error('Figure was not prepared for DOCX export: '+key);let w=Math.min(maxWidth||190,item.width*0.75),h=w*item.height/item.width;if(h>130){h=130;w=h*item.width/item.height;}const mediaItem=addMedia(item.bytes,'png'),id=figureDrawingId++;return para(imgXml(mediaItem,emu(w),emu(h),id,alt||key.split('/').pop(),alt||key.split('/').pop()),{align:'center',exact:h+2,after:2});}
let media=[],rid=2,mediaMap=new Map(); /* rId1/rId2 belong to styles & settings, so images start at rId3 */
function addMedia(bytes,ext){if(mediaMap.has(bytes))return mediaMap.get(bytes);rid++;const n='image'+rid+'.'+ext,r={rid:'rId'+rid,href:'media/'+n,name:'word/media/'+n,data:bytes};media.push(r);mediaMap.set(bytes,r);return r;} /* the relationship list reads rid/href from these records */
function imgXml(m,cx,cy,id,name,descr=""){return `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="${id}" name="${X(name)}"${descr?` descr="${X(descr)}"`:""}/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${id}" name="${X(name)}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${m.rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;}
function run(t,o){o=o||{};const f=o.font||(o.ur?state.urFont:state.enFont),base=o.sz||(o.ur?state.urSize:state.enSize),scale=(o.sup||o.sub)?0.72:1,sz=Math.max(2,Math.round(base*scale*2));
 let p='<w:rPr>'+`<w:rFonts w:ascii="${X(f)}" w:hAnsi="${X(f)}" w:cs="${X(f)}" w:eastAsia="${X(f)}"/>`;
 if(o.b)p+='<w:b/><w:bCs/>';if(o.i)p+='<w:i/><w:iCs/>';if(o.sup||o.sub)p+=`<w:vertAlign w:val="${o.sup?'superscript':'subscript'}"/>`;p+=`<w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/>`;if(o.ur)p+='<w:rtl/><w:lang w:bidi="ur-PK"/>';p+='</w:rPr>';
 return `<w:r>${p}<w:t xml:space="preserve">${X(t)}</w:t></w:r>`;}
function para(inner,o){o=o||{};const src=inner||'';
 const nRun=(src.match(/<w:r>/g)||[]).length,nRtl=(src.match(/<w:rtl\/>/g)||[]).length;
 if(nRun>0&&nRtl===nRun)o=Object.assign({},o,{bidi:true}); /* Urdu-only paragraph = right-to-left */
 /* Line height: the preview uses CSS line-height (a multiple of the font SIZE). Word's "auto" multiplies the font's own
    built-in line height instead (about 1.15 for Times, about 2 for Nastaliq) which adds visible extra space, so every
    paragraph gets an EXACT height computed the same way as the preview. Images are never clipped. */
 let line;
 if(o.exact!=null)line=o.exact;
 else{const lh=o.lh||state.lineH;line=0;
  for(const m of src.matchAll(/<w:r>(?:(?!<\/w:r>)[\s\S])*<\/w:r>/g)){const r=m[0],ex=r.match(/<wp:extent cx="\d+" cy="(\d+)"/),sz=r.match(/<w:sz w:val="(\d+)"/);
   if(ex)line=Math.max(line,ex[1]/12700+1);else if(sz)line=Math.max(line,sz[1]/2*(r.includes('<w:rtl/>')?Math.max(lh+.35,1.5):lh));}
  if(!line)line=state.enSize*lh;}
 line=Math.max(1,line);
 /* Word/OnlyOffice read jc left/right inside a right-to-left paragraph as start/end, so bidi paragraphs carry no jc. Order: bidi, spacing, jc, rPr. */
 let p='<w:pPr>'+(o.bidi?'<w:bidi/>':'')+`<w:spacing w:before="${o.before?tw(o.before):0}" w:after="${o.after?tw(o.after):0}" w:line="${Math.round(line*20)}" w:lineRule="exact"/>`;
 const jc=o.bidi?(o.align==='center'?'center':''):(o.align||'left');if(jc)p+=`<w:jc w:val="${jc}"/>`;
 if(!src)p+='<w:rPr><w:sz w:val="2"/><w:szCs w:val="2"/></w:rPr>';
 p+='</w:pPr>';return `<w:p>${p}${src}</w:p>`;}
function txtP(t,o){return para(run(t,o),o);}
function outerBorders(sz){const e=k=>`<w:${k} w:val="single" w:sz="${sz}" w:space="0" w:color="000000"/>`;return `<w:tblBorders>${e('top')}${e('left')}${e('bottom')}${e('right')}<w:insideH w:val="nil"/><w:insideV w:val="nil"/></w:tblBorders>`;}
function borders(on,sz){if(!on)return '<w:tblBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/><w:insideH w:val="nil"/><w:insideV w:val="nil"/></w:tblBorders>';
 const e=k=>`<w:${k} w:val="single" w:sz="${sz}" w:space="0" w:color="000000"/>`;
 return `<w:tblBorders>${e('top')}${e('left')}${e('bottom')}${e('right')}${e('insideH')}${e('insideV')}</w:tblBorders>`;}
function tbl(grid,rows,o){o=o||{};const total=grid.reduce((a,b)=>a+b,0),sz=Math.max(2,Math.round(state.borderW*8)),m=tw(o.pad!=null?o.pad:state.pad);
 let p='<w:tblPr>'+`<w:tblW w:w="${total}" w:type="dxa"/><w:jc w:val="${o.align||'left'}"/>`+(o.outer?outerBorders(sz):borders(o.borders!==false,sz));
 p+=`<w:tblCellMar><w:top w:w="${m}" w:type="dxa"/><w:left w:w="${m+30}" w:type="dxa"/><w:bottom w:w="${m}" w:type="dxa"/><w:right w:w="${m+30}" w:type="dxa"/></w:tblCellMar><w:tblLayout w:type="fixed"/></w:tblPr>`;
 p+='<w:tblGrid>'+grid.map(w=>`<w:gridCol w:w="${Math.max(1,w)}"/>`).join('')+'</w:tblGrid>';
 return `<w:tbl>${p}${rows.join('')}</w:tbl>`;}
function tc(content,o){o=o||{};let p='<w:tcPr>'+`<w:tcW w:w="${Math.max(1,o.w||1000)}" w:type="dxa"/>`;
 if(o.span&&o.span>1)p+=`<w:gridSpan w:val="${o.span}"/>`;
 p+=`<w:vAlign w:val="${o.valign||'top'}"/>`;
 if(o.shd)p+=`<w:shd w:val="clear" w:color="auto" w:fill="${o.shd}"/>`;
 if(o.bd){const z=Math.max(2,Math.round((o.bdz||state.borderW)*8)),e=(k,on)=>on?`<w:${k} w:val="single" w:sz="${z}" w:space="0" w:color="000000"/>`:`<w:${k} w:val="nil"/>`;p+=`<w:tcBorders>${e('top',o.bd.t)}${e('left',o.bd.l)}${e('bottom',o.bd.b)}${e('right',o.bd.r)}</w:tcBorders>`;}
 if(o.noBorder)p+='<w:tcBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/></w:tcBorders>';
 p+='</w:tcPr>';let body=content||'';
 if(!body)body=para('',{exact:1});else if(/<\/w:tbl>$/.test(body))body+=para('',{exact:1});
 return `<w:tc>${p}${body}</w:tc>`;}
function tr(cells){return `<w:tr><w:trPr><w:cantSplit/></w:trPr>${cells.join('')}</w:tr>`;}
function pageBreak(){return '<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="20" w:lineRule="exact"/></w:pPr><w:r><w:br w:type="page"/></w:r></w:p>';}
function buildDocx(raw){
 if(state.sheetMode!=='two')return buildDocxSheet(raw,'single');
 const objective=buildDocxSheet(true,'objective'),subjective=buildDocxSheet(true,'subjective',true);
 const get=f=>objective.find(x=>x.name===f).data,doc=get('word/document.xml');
 const bodyRe=/<w:body>([\s\S]*?)<w:sectPr[\s\S]*?<\/w:sectPr><\/w:body>/;
 const a=doc.match(bodyRe),b=subjective.find(x=>x.name==='word/document.xml').data.match(bodyRe);
 if(!a||!b)throw new Error('Could not merge the two paper sheets');
 const sect=a[0].match(/<w:sectPr[\s\S]*?<\/w:sectPr>/);if(!sect)throw new Error('Missing Word section properties');
 const merged=doc.replace(bodyRe,`<w:body>${a[1]}${pageBreak()}${b[1]}${sect[0]}</w:body>`);
 const files=subjective.map(x=>x.name==='word/document.xml'?{name:x.name,data:merged}:x);
 return raw?files:zipStore(files);
}
function buildDocxSheet(raw,sheetKind,keepMedia=false){
 if(!keepMedia){media=[];rid=2;mediaMap=new Map();}
 const s=Object.assign({},state,{_sheetKind:sheetKind}),bi=urduOn(s),allMarks=plan.marks;
 const mk=sheetKind==='objective'?{mcq:allMarks.mcq,short:0,long:0,total:allMarks.mcq}:sheetKind==='subjective'?{mcq:0,short:allMarks.short,long:allMarks.long,total:allMarks.short+allMarks.long}:allMarks,pg=PAGES[s.page],SN=serials();
 const W=tw(pg.w),H=tw(pg.h),M=tw(s.margin),CW=W-2*M;
 const hasM=sheetKind!=='subjective'&&built.mcq.length>0,hasS=sheetKind!=='objective'&&built.short.some(p=>p.items.length>0),hasL=sheetKind!=='objective'&&built.long.length>0,PR=['I','II','III'],PU=['اول','دوم','سوم'];let partNo=0;
 const omrPos=sheetKind==='single'?s.omrPos:(s.omrPos==='front'?'front':'end');
 const mcqEn=`Q. No. 1: Choose the Best option and fill the Bubble.  (${built.mcq.length} × ${s.mcqMark} = ${mk.mcq})`;
 let QE=qEdges(s,bi,mcqEn),GM=mkGrid(QE.mcq,CW,true),GT=mkGrid(QE.two,CW,true),grid6=GM.cols,grid4=GT.cols;
 const CWX=(G,a,b)=>{const n=G.sp(a,b),o={w:G.w(a,b)};if(n>1)o.span=n;return o;},VA='top',SA='top';
 const shd=s.shade?'E9E4D6':null,zeb=i=>s.zebra&&i%2===1?'F7F4EA':null;
 const Bx=[];const push=x=>Bx.push(x),spacer=pt=>push(para('',{exact:Math.max(1,pt||4)}));
 if(s.footer){push(txtP(`Paper ${B().code}-${s.alp?'ALP':'FULL'} / V-${String(s.seed).padStart(2,'0')}${sheetKind==='single'?'':` / ${sheetKind==='objective'?'Objective':'Subjective'}`}  ·  ${plan.sch.name}  ·  Examiner: ____________________`,{align:'center',sz:s.enSize-2}));spacer(4);}
 const titleRuns=()=>{let r='';
  if(s.institute.trim())r+=para(run(s.institute,{b:s.bHeader,sz:s.enSize+5}),{align:'center',after:1,lh:1.1});
  r+=para(run(s.title,{b:s.bHeader,sz:s.enSize+1}),{align:'center',after:1,lh:1.1});
  if(bi)r+=para(run((s.subjectUr?s.subjectUr+' — ':'')+(B().classUr||''),{ur:true,b:s.bHeader,sz:s.urSize+1}),{bidi:true,align:'center',after:2,lh:1.5});
  return r;};
 const logoTitleX=(()=>{
  if(s.logo&&logoPNG){const m=addMedia(logoPNG.bytes,'png'),cy=emu(s.logoH),cx=Math.round(cy*(logoPNG.ratio||1));
   const ip=para(imgXml(m,cx,cy,900,'Institute logo'),{align:'center',after:3,lh:1});
   if(s.logoPos==='center')return ip+titleRuns();
   const lw=Math.round(cx/635)+240,tw2=CW-lw,lc=tc(ip,{w:lw,valign:'center',noBorder:true}),tcell=tc(titleRuns(),{w:tw2,valign:'center',noBorder:true});
   return tbl([lw,tw2],[tr(s.logoPos==='left'?[lc,tcell]:[tcell,lc])],{borders:false,pad:0});}
  return titleRuns();})();
 const HS=s.hdrStyle||'classic',metaT=['Class: '+s.klass,'Subject: '+s.subject,'Total Marks: '+mk.total,'Time: '+paperDuration(s,sheetKind)];
 {const a=Math.round(CW*.22),b2=Math.round(CW*.38),c=Math.round(CW*.20),d=CW-a-b2-c,g=[a,b2,c,d],ruleZ=Math.max(1.5,s.borderW*2);
  if(HS==='banner'){
   push(tbl(g,[tr([tc(logoTitleX,{w:CW,span:4,shd:shd})]),tr(metaT.map((t,i)=>tc(txtP(t,{b:s.bHeader,align:'center'}),{w:g[i],valign:VA})))],{borders:!s.hideLines,pad:s.pad+1}));
  }else if(HS==='ruled'){
   push(logoTitleX);spacer(4);
   push(tbl(g,[tr(metaT.map((t,i)=>tc(txtP(t,{b:s.bHeader,align:['left','center','center','right'][i]}),{w:g[i],valign:VA,bd:{t:!s.hideLines,b:!s.hideLines,l:false,r:false},bdz:ruleZ})))],{borders:false,pad:s.pad+1}));
  }else if(HS==='split'){
   const w1=Math.round(CW*.28),w3=w1,w2=CW-w1-w3,bdc={t:false,b:!s.hideLines,l:false,r:false},z={bdz:ruleZ,valign:VA};
   push(tbl([w1,w2,w3],[tr([tc(txtP(metaT[0],{b:s.bHeader})+txtP(metaT[1],{b:s.bHeader}),Object.assign({w:w1,bd:bdc},z)),tc(logoTitleX,Object.assign({w:w2,bd:bdc},z)),tc(txtP(metaT[3],{b:s.bHeader,align:'right'})+txtP(metaT[2],{b:s.bHeader,align:'right'}),Object.assign({w:w3,bd:bdc},z))])],{borders:false,pad:s.pad+1}));
  }else if(HS==='centered'){
   push(logoTitleX);spacer(3);push(tbl([CW/4,CW/4,CW/4,CW-CW*3/4],[tr(metaT.map((t,i)=>tc(txtP(t,{b:s.bHeader,align:'center'}),{w:CW/4,bd:{t:!s.hideLines,b:!s.hideLines,l:!s.hideLines,r:!s.hideLines},valign:VA})))],{borders:!s.hideLines,pad:s.pad+1}));
  }else if(HS==='minimal'){
   push(logoTitleX);spacer(2);push(txtP(metaT.join('   ·   '),{align:'center',sz:s.enSize-1}));spacer(4);
  }else if(HS==='boxed'){
   push(tbl([CW],[tr([tc(logoTitleX,{w:CW,bd:{t:!s.hideLines,l:!s.hideLines,b:!s.hideLines,r:!s.hideLines},pad:s.pad+4})])],{borders:!s.hideLines,pad:s.pad+2}));spacer(3);push(tbl(g,[tr(metaT.map((t,i)=>tc(txtP(t,{b:s.bHeader,align:'center'}),{w:g[i],valign:VA})))],{borders:!s.hideLines,pad:s.pad+1}));
  }else if(HS==='academy'){
   push(tbl([CW],[tr([tc(logoTitleX,{w:CW,bd:{t:!s.hideLines,b:!s.hideLines,l:false,r:false},pad:s.pad+2})])],{borders:false,pad:s.pad+2}));spacer(2);push(tbl([CW/4,CW/4,CW/4,CW-CW*3/4],[tr(metaT.map(t=>tc(txtP(t,{b:s.bHeader,align:'center'}),{w:CW/4,bd:{t:!s.hideLines,b:!s.hideLines,l:false,r:false},valign:VA})))],{borders:false,pad:s.pad+1}));
  }else if(HS==='compact'){
   const w1=Math.round(CW*.64),w2=CW-w1;push(tbl([w1,w2],[tr([tc(logoTitleX,{w:w1,valign:VA,noBorder:true}),tc(metaT.map(t=>txtP(t,{b:s.bHeader,align:'right'})).join(''),{w:w2,valign:VA,noBorder:true})])],{borders:false,pad:s.pad+1}));
  }else{
   push(logoTitleX);spacer(4);
   push(tbl(g,[tr(metaT.map((t,i)=>tc(txtP(t,{b:s.bHeader,align:'center'}),{w:g[i],valign:VA})))],{borders:!s.hideLines}));}}
 const infoSpecDocx=rows=>{
  const edges=[0,100];rows.forEach(r=>{if(r!=='spacer')r.forEach(c=>edges.push(c.a,c.b));});const G=mkGrid(edges,CW,true),none={t:false,l:false,b:false,r:false},all={t:true,l:true,b:true,r:true};
  const trs=rows.map(r=>{if(r==='spacer')return tr([tc(para('',{exact:6}),Object.assign(CWX(G,0,100),{bd:none}))]);
   return tr(r.map(c=>{const o=CWX(G,c.a,c.b);
    if(c.k==='gap')return tc(para('',{exact:1}),Object.assign(o,{bd:none}));
    if(c.k==='box')return tc(para('',{exact:Math.round((s.enSize+8)*10)/10}),Object.assign(o,{bd:all,valign:'center'}));
    return tc(txtP(c.t,{b:s.bHeader}),Object.assign(o,{bd:c.k==='line'?{t:false,l:false,b:true,r:false}:none,valign:'bottom'}));}));});
  return tbl(G.cols,trs,{borders:false,pad:s.pad+3});};
 const infoTblTable=()=>{const f=[];
  if(s.showName)f.push('Name: ____________________________');
  if(s.showRoll)f.push('Roll No: ____________________');
  if(s.showSection)f.push('Section: '+(s.sectionVal.trim()?s.sectionVal:'____________'));
  if(s.showDate!==false)f.push('Date: '+(s.date.trim()?s.date:'________________'));
  if(!f.length)return'';const n=f.length,g=[];let acc=0;
  for(let i=0;i<n;i++){const w=i===n-1?CW-acc:Math.round(CW/n);g.push(w);acc+=w;}
  return tbl(g,[tr(f.map((t,i)=>tc(txtP(t,{b:s.bHeader}),{w:g[i]})))],{borders:!s.hideLines});};
 const infoTbl=()=>{if(s.infoStyle&&s.infoStyle!=='table'){const r=infoSpec(s);return r.length?infoSpecDocx(r):'';}return infoTblTable();};
 if(s.infoPos==='top'){spacer(4);push(infoTbl());}
 spacer(5);
 if(hasM&&sheetKind==='objective'){let note=txtP('Note: Four possible answers A, B, C and D are given for each question. Choose the correct answer and fill the corresponding circle on the OMR answer sheet.',{b:true,sz:s.enSize-1});if(bi)note+=txtP('ہر سوال کے چار ممکنہ جوابات A، B، C اور D دیے گئے ہیں۔ درست جواب منتخب کریں اور جوابی شیٹ پر متعلقہ دائرے کو پُر کریں۔',{ur:true,b:true});push(tbl([CW],[tr([tc(note,{w:CW,shd:shd})])],{borders:!s.hideLines,pad:s.pad+2}));spacer(4);}
 const bar=(en,ur)=>{let c=txtP(en,{b:s.bBar,align:'center',sz:s.enSize+1.5});
  if(bi)c+=txtP(ur,{ur:true,b:s.bBar,align:'center'});
  push(tbl([CW],[tr([tc(c,{w:CW,shd:shd})])],{borders:!s.hideLines,pad:s.pad+2}));spacer(4);};
 const insRow=(G,en,ur)=>{const sd={shd:shd};
  if(!bi)return tr([tc(txtP(en,{b:s.bInstr}),Object.assign(CWX(G,0,100),sd))]);
  return tr([tc(txtP(en,{b:s.bInstr}),Object.assign(CWX(G,0,QE.H),sd)),tc(txtP(ur,{ur:true,b:s.bInstr}),Object.assign(CWX(G,QE.H,100),sd))]);};
   function omrBlock(){
   const n=built.mcq.length;if(!n)return;
   const cols=clamp(parseInt(s.omrCols,10)||4,1,4),rows=Math.ceil(n/cols),innerW=Math.round(CW*s.omrWidth/100),AR='Arial',nSz=Math.max(5,s.enSize-4.5);
   if(s.omrNewPage)push(pageBreak());
   if(s.omrGapT)spacer(s.omrGapT);
   let t=para(run('MCQs RESPONSE PART',{b:true,sz:s.enSize+3,font:AR})+run(' (TO BE FILLED BY THE STUDENT)',{sz:Math.max(5,s.enSize-5),font:AR})+(s.omrUrdu&&bi?run('  (اُمیدوار خود پُر کرے)',{ur:true,sz:s.urSize+1}):''),{align:'center',after:6,lh:1.25});
   if(s.omrRule){t+=tbl([innerW],[tr([tc(txtP('PLEASE CAREFULLY READ THE  QUESTIONS AND FILL THE ANSWER CORRECTLY',{b:true,align:'center',sz:s.enSize-2.5,font:AR}),{w:innerW,valign:'center'})])],{borders:true,pad:s.pad+2,align:s.omrAlign});t+=para('',{exact:6});}
   const blockW=Math.floor(innerW/cols),numW=Math.round(blockW*.18),bubW=Math.floor((blockW-numW)/4),lastW=blockW-numW-3*bubW,grid=[];
   for(let c=0;c<cols;c++)grid.push(numW,bubW,bubW,bubW,lastW);
   const rowsX=[];
   for(let r=0;r<rows;r++){const cells=[];
    for(let c=0;c<cols;c++){const idx=c*rows+r+1,ok=idx<=n;
     cells.push(tc(ok?txtP(idx+'.',{b:true,sz:nSz,font:AR}):'',{w:numW,valign:'center',bd:{t:r===0,b:r===rows-1,l:true,r:false}}));
     for(let k=0;k<4;k++){let body='';
      if(ok){const bp=bubblePNG('ABCD'[k],s.bubSize,false),mm=addMedia(bp.bytes,'png'),cx=emu(s.bubSize);body=para(imgXml(mm,cx,cx,1000+idx*10+k,'Bubble '+'ABCD'[k]),{align:'center'});}
      cells.push(tc(body,{w:k===3?lastW:bubW,valign:'center',bd:{t:r===0,b:r===rows-1,l:false,r:k===3&&c===cols-1}}));}}
    rowsX.push(tr(cells));}
   t+=tbl(grid,rowsX,{outer:true,pad:s.omrPad,align:s.omrAlign});
   push(t);if(s.omrGapB)spacer(s.omrGapB);
  }
if(s.omr&&hasM&&omrPos==='front'){omrBlock();spacer(5);}
 if(hasM){const pi=partNo++;bar(`PART-${PR[pi]}  ·  OBJECTIVE  (${mk.mcq} Marks)`,`حصہ ${PU[pi]}: معروضی سوالات`);
 {const rows=[insRow(GM,mcqEn,'سوال نمبر 1: درست جواب کا انتخاب کریں۔ اور ببل بھریں۔')];
  built.mcq.forEach((m,i)=>{const S=SN[m._key],z=zeb(i),cell=(a,b,body,o)=>tc(body,Object.assign(CWX(GM,a,b),{shd:z},o||{}));
   const cells=[cell(0,QE.nw,txtP(S.no,{b:s.bNum,align:'center'}),{valign:SA})];
   if(bi){cells.push(cell(QE.nw,QE.B1,richTxtP(m.en,{b:s.bStem})+figureParagraph(m.figure,m.figureAlt,190)));cells.push(cell(QE.B1,QE.R,richTxtP(m.ur,{ur:true,b:s.bStem})));cells.push(cell(QE.R,100,txtP(S.ur,{ur:true,b:s.bNum,align:'center'}),{valign:SA}));}
   else cells.push(cell(QE.nw,100,richTxtP(m.en,{b:s.bStem})+figureParagraph(m.figure,m.figureAlt,190)));
   rows.push(tr(cells));
   const optBody=k=>{const o=m.o[k];if(!o)return'';let body=para(richRuns('ABCD'[k]+'. '+o[0],{}));if(bi&&o[1])body+=para(richRuns('  '+o[1],{ur:true}),{bidi:true});body+=figureParagraph(m.of&&m.of[k],m.oa&&m.oa[k],105);return body;};
   const lay=layoutFor(m);
   if(lay===4){const c=[cell(0,QE.nw,'')];for(let k=0;k<4;k++)c.push(cell(QE.nw+k*QE.q4,QE.nw+(k+1)*QE.q4,optBody(k)));c.push(cell(QE.R,100,''));rows.push(tr(c));}
   else if(lay===2){for(let r=0;r<2;r++)rows.push(tr([cell(0,QE.nw,''),cell(QE.nw,QE.B1,optBody(r*2)),cell(QE.B1,QE.R,optBody(r*2+1)),cell(QE.R,100,'')]));}
   else{for(let k=0;k<4;k++)rows.push(tr([cell(0,QE.nw,''),cell(QE.nw,QE.R,optBody(k)),cell(QE.R,100,'')]));}});
  push(tbl(grid6,rows,{borders:!s.hideLines}));}
 spacer(6);}
 if(s.omr&&hasM&&omrPos==='after'){omrBlock();spacer(5);}
 if(hasS){const pi=partNo++;bar(`PART-${PR[pi]}  ·  SHORT QUESTIONS  (${mk.short} Marks)`,`حصہ ${PU[pi]}: مختصر سوالات`);
 built.short.forEach(p=>{if(!p.items.length)return;
  const all=p.attempt>=p.items.length;
  const en=all?`Q. No. ${p.q}: Answer ALL ${NE[p.items.length]} (${p.items.length}) short questions.  (${p.items.length} × ${s.shortMark} = ${p.items.length*s.shortMark})`
   :`Q. No. ${p.q}: Write short answers to any ${NE[p.attempt]} (${p.attempt}) questions.  (${p.attempt} × ${s.shortMark} = ${p.attempt*s.shortMark})`;
  const ur=all?`سوال نمبر ${p.q}: تمام ${NU[p.items.length]} مختصر سوالات کے جوابات دیں۔`:`سوال نمبر ${p.q}: کوئی سے ${NU[p.attempt]} مختصر سوالات کے جوابات دیں۔`;
  QE=qEdges(s,bi,en);GT=mkGrid(QE.two,CW,true);const g=GT.cols,rows=[insRow(GT,en,ur)];
  p.items.forEach((q,i)=>{const S=SN[q._key],z=zeb(i),cell=(a,b,body,o)=>tc(body,Object.assign(CWX(GT,a,b),{shd:z},o||{}));
   const c=[cell(0,QE.nw,txtP(S.no,{b:s.bNum,align:'center'}),{valign:SA}),cell(QE.nw,bi?QE.B2:100,richTxtP(q.en,{b:s.bShort})+figureParagraph(q.figure,q.figureAlt,190))];
   if(bi){c.push(cell(QE.B2,QE.R,richTxtP(q.ur,{ur:true,b:s.bShort})));c.push(cell(QE.R,100,txtP(S.ur,{ur:true,b:s.bNum,align:'center'}),{valign:SA}));}
   rows.push(tr(c));});
  push(tbl(g,rows,{borders:!s.hideLines}));spacer(6);});}
 if(s.omr&&hasM&&omrPos==='mid'){omrBlock();spacer(5);}
 if(hasL){const first=longQ0(),last=first+built.long.length-1,pi=partNo++;
 bar(`PART-${PR[pi]}  ·  DETAILED QUESTIONS  (${mk.long} Marks)`,`حصہ ${PU[pi]}: تفصیلی سوالات`);
 if(built.longMode==='groups'){
  built.longGroups.forEach(g=>{
   const qs=g.questions,lo=qs[0]?.no||first,hi=qs[qs.length-1]?.no||lo;
   const en=`${g.name}: Q. No. ${lo}${hi!==lo?' to '+hi:''}. Attempt any ${g.attempt} of ${qs.length} detailed questions. Each question carries ${g.marksEach} marks. (${g.attempt} × ${g.marksEach} = ${g.totalMarks})`;
   const ur=`${g.name}: سوال نمبر ${lo} تا ${hi} میں سے کوئی سے ${NU[g.attempt]||g.attempt} سوالات حل کریں۔ ہر سوال ${g.marksEach} نمبر کا ہے۔`;
   QE=qEdges(s,bi,en);GT=mkGrid(QE.two,CW,true);const grid=GT.cols,rows=[insRow(GT,en,ur)];
   qs.forEach((q,i)=>{const S=SN[q._key],z=zeb(i),cell=(a,b,body,o)=>tc(body,Object.assign(CWX(GT,a,b),{shd:z},o||{}));
    const enBody=q.parts.map(pt=>richTxtP(`(${pt.label}) `,{b:s.bLong})+richTxtP(pt.en,{b:s.bLong})+figureParagraph(pt.figure,pt.figureAlt,185)+txtP(`Chapter ${pt.ch} · ${pt.marks} marks`,{sz:s.enSize-2})).join('');
    const urBody=q.parts.map(pt=>richTxtP(`(${pt.label}) `,{ur:true,b:s.bLong})+richTxtP(pt.ur,{ur:true,b:s.bLong})+txtP(`باب ${pt.ch} · ${pt.marks} نمبر`,{ur:true,sz:s.enSize-2})).join('');
    const c=[cell(0,QE.nw,txtP(S.no,{b:s.bNum,align:'center'}),{valign:SA}),cell(QE.nw,bi?QE.B2:100,enBody)];
    if(bi){c.push(cell(QE.B2,QE.R,urBody));c.push(cell(QE.R,100,txtP(S.ur,{ur:true,b:s.bNum,align:'center'}),{valign:SA}));}
    rows.push(tr(c));
   });
   push(txtP(g.name,{b:s.bLong,align:'center',after:1}));push(tbl(grid,rows,{borders:!s.hideLines}));spacer(5);
  });
 }else{
  const allL=s.longAttempt>=built.long.length;
  const en=allL?`Q. No. ${first}${built.long.length>1?' to '+last:''}: Attempt ALL ${NE[built.long.length]} (${built.long.length}) detailed questions.  (${built.long.length} × ${s.longMark} = ${mk.long})`
   :`Q. No. ${first}${built.long.length>1?' to '+last:''}: Attempt any ${NE[s.longAttempt]} (${s.longAttempt}) detailed questions.  (${s.longAttempt} × ${s.longMark} = ${mk.long})`;
  const ur=allL?`سوال نمبر ${first} تا ${last}: تمام ${NU[built.long.length]} تفصیلی سوالات کے جوابات دیں۔`:`سوال نمبر ${first} تا ${last}: کوئی سے ${NU[s.longAttempt]} تفصیلی سوالات کے جوابات دیں۔`;
  QE=qEdges(s,bi,en);GT=mkGrid(QE.two,CW,true);const g=GT.cols,rows=[insRow(GT,en,ur)];
  built.long.forEach((q,i)=>{const S=SN[q._key],z=zeb(i),cell=(a,b,body,o)=>tc(body,Object.assign(CWX(GT,a,b),{shd:z},o||{}));
   const c=[cell(0,QE.nw,txtP(S.no,{b:s.bNum,align:'center'}),{valign:SA}),cell(QE.nw,bi?QE.B2:100,richTxtP(q.en,{b:s.bLong})+figureParagraph(q.figure,q.figureAlt,190))];
   if(bi){c.push(cell(QE.B2,QE.R,richTxtP(q.ur,{ur:true,b:s.bLong})));c.push(cell(QE.R,100,txtP(S.ur,{ur:true,b:s.bNum,align:'center'}),{valign:SA}));}
   rows.push(tr(c));});
  push(tbl(g,rows,{borders:!s.hideLines}));
 }
 }
 if(s.omr&&hasM&&omrPos==='end'){spacer(5);omrBlock();}
 if(s.infoPos==='bottom'){spacer(6);push(infoTbl());}
 const sect=`<w:sectPr><w:pgSz w:w="${W}" w:h="${H}"/><w:pgMar w:top="${M}" w:right="${M}" w:bottom="${M}" w:left="${M}" w:header="0" w:footer="0" w:gutter="0"/><w:cols w:space="720"/><w:docGrid w:linePitch="360"/></w:sectPr>`;
 const doc=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>${Bx.join('')}${sect}</w:body></w:document>`;
 const styles=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="${X(s.enFont)}" w:hAnsi="${X(s.enFont)}" w:cs="${X(s.enFont)}"/><w:sz w:val="${Math.round(s.enSize*2)}"/><w:szCs w:val="${Math.round(s.enSize*2)}"/><w:lang w:val="en-US" w:bidi="ur-PK"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="${Math.round(s.lineH*240)}" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style></w:styles>`;
 const settings=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:zoom w:percent="100"/><w:defaultTabStop w:val="720"/><w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat></w:settings>`;
 const rels=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>${media.map(m=>`<Relationship Id="${m.rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${m.href}"/>`).join('')}</Relationships>`;
 const ct=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`;
 const rootRels=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`;
 const now=new Date().toISOString().replace(/\.\d+Z$/,'Z');
 const core=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${X(s.title)} — ${X(B().subject)} ${state.grade}</dc:title><dc:subject>${X(s.subject)}</dc:subject><dc:creator>Paper Press</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created></cp:coreProperties>`;
 const app=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Paper Press</Application><Company>${X(s.institute)}</Company></Properties>`;
 const _files=[{name:'[Content_Types].xml',data:ct},{name:'_rels/.rels',data:rootRels},{name:'docProps/core.xml',data:core},{name:'docProps/app.xml',data:app},{name:'word/document.xml',data:doc},{name:'word/_rels/document.xml.rels',data:rels},{name:'word/styles.xml',data:styles},{name:'word/settings.xml',data:settings}].concat(media.map(m=>({name:m.name,data:m.data})));
  return raw?_files:zipStore(_files);
}

