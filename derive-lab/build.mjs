import {build} from "esbuild";
import {mkdir,copyFile,readFile,writeFile} from "node:fs/promises";
import {createHash} from "node:crypto";
await build({entryPoints:["app.tsx"],outfile:"app.js",bundle:true,format:"iife",platform:"browser",target:"es2020",minify:true,define:{"process.env.NODE_ENV":'"production"'}});
// Une URL liée au contenu évite de réutiliser un ancien app.js après publication.
const appVersion=createHash("sha256").update(await readFile("app.js")).digest("hex").slice(0,12);
const appUrl="./app.js?v="+appVersion;
const page=(await readFile("index.html","utf8")).replace(/src="\.\/app\.js(?:\?v=[a-z0-9]+)?"/, 'src="'+appUrl+'"');
await writeFile("index.html",page);
const resources=["app.js","styles.css","index.html","bootstrap.js","manifest.webmanifest"];
const hash=createHash("sha256");
for(const file of resources)hash.update(await readFile(file));
const workerSource=(await readFile("sw.js","utf8")).replace(/"\.\/app\.js(?:\?v=[a-z0-9]+)?"/,JSON.stringify(appUrl));
hash.update(workerSource.replace(/const CACHE_NAME = "[^\"]+";/,'const CACHE_NAME = "";'));
const version=hash.digest("hex").slice(0,16);
const worker=workerSource.replace(/const CACHE_NAME = "[^"]+";/,'const CACHE_NAME = "derive-lab-'+version+'";');
await writeFile("sw.js",worker);
await mkdir("dist",{recursive:true});
for(const file of [...resources,"sw.js","icon-192.png","icon-512.png","icon-maskable.png","apple-touch-icon.png"])
  await copyFile(file,"dist/"+file);
console.log("Application compilée, autonome et installable. Cache : "+version);
