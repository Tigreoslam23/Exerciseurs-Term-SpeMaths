import {build} from "esbuild";
import {mkdir,copyFile,readFile,writeFile} from "node:fs/promises";
import {createHash} from "node:crypto";
// Les deux fontes sont embarquées : pas de CDN, y compris hors connexion.
const fonts=[['normal','KaTeX_Main-Regular.woff2'],['italic','KaTeX_Math-Italic.woff2']];
let fontCss='/* Computer Modern / KaTeX — licence : MATH-FONTS-LICENSE.txt */\n';
for(const [style,file] of fonts){
  const data=(await readFile('node_modules/katex/dist/fonts/'+file)).toString('base64');
  fontCss+='@font-face{font-family:"Derive Math";font-style:'+style+';font-weight:400;font-display:swap;src:url(data:font/woff2;base64,'+data+') format("woff2")}\n';
}
await writeFile('math-fonts.css',fontCss);
await build({entryPoints:["app.tsx"],outfile:"app.js",bundle:true,format:"iife",platform:"browser",target:"es2020",minify:true,define:{"process.env.NODE_ENV":'"production"'}});
// Une URL liée au contenu évite de réutiliser un ancien app.js après publication.
const appVersion=createHash("sha256").update(await readFile("app.js")).digest("hex").slice(0,12);
const appUrl="./app.js?v="+appVersion;
let page=(await readFile("index.html","utf8")).replace(/src="\.\/app\.js(?:\?v=[a-z0-9]+)?"/, 'src="'+appUrl+'"');
const assetUrl=async file=>'./'+file+'?v='+createHash('sha256').update(await readFile(file)).digest('hex').slice(0,12);
const styleUrl=await assetUrl('styles.css'),fontUrl=await assetUrl('math-fonts.css');
page=page.replace(/href="\.\/styles\.css(?:\?v=[a-z0-9]+)?"/,'href="'+styleUrl+'"');
if(!page.includes('math-fonts.css'))page=page.replace('<link rel="stylesheet"','<link rel="stylesheet" href="'+fontUrl+'">\n  <link rel="stylesheet"');
else page=page.replace(/href="\.\/math-fonts\.css(?:\?v=[a-z0-9]+)?"/,'href="'+fontUrl+'"');
await writeFile("index.html",page);
const resources=["app.js","styles.css","math-fonts.css","index.html","bootstrap.js","manifest.webmanifest"];
const hash=createHash("sha256");
for(const file of resources)hash.update(await readFile(file));
let workerSource=(await readFile("sw.js","utf8")).replace(/"\.\/app\.js(?:\?v=[a-z0-9]+)?"/,JSON.stringify(appUrl));
workerSource=workerSource.replace(/"\.\/styles\.css(?:\?v=[a-z0-9]+)?"/,JSON.stringify(styleUrl));
if(!workerSource.includes('math-fonts.css'))workerSource=workerSource.replace(JSON.stringify(styleUrl),JSON.stringify(styleUrl)+', '+JSON.stringify(fontUrl));
else workerSource=workerSource.replace(/"\.\/math-fonts\.css(?:\?v=[a-z0-9]+)?"/,JSON.stringify(fontUrl));
hash.update(workerSource.replace(/const CACHE_NAME = "[^\"]+";/,'const CACHE_NAME = "";'));
const version=hash.digest("hex").slice(0,16);
const worker=workerSource.replace(/const CACHE_NAME = "[^"]+";/,'const CACHE_NAME = "derive-lab-'+version+'";');
await writeFile("sw.js",worker);
await mkdir("dist",{recursive:true});
for(const file of [...resources,"MATH-FONTS-LICENSE.txt","sw.js","icon-192.png","icon-512.png","icon-maskable.png","apple-touch-icon.png"])
  await copyFile(file,"dist/"+file);
console.log("Application compilée, autonome et installable. Cache : "+version);
