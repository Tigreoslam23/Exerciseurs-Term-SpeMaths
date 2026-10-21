import {build} from "esbuild";
import {mkdir,copyFile,readFile,writeFile} from "node:fs/promises";
import {createHash} from "node:crypto";
await build({entryPoints:["app.tsx"],outfile:"app.js",bundle:true,format:"iife",platform:"browser",target:"es2020",minify:true,define:{"process.env.NODE_ENV":'"production"'}});
const resources=["app.js","styles.css","index.html","bootstrap.js","manifest.webmanifest"];
const hash=createHash("sha256");
for(const file of resources)hash.update(await readFile(file));
const version=hash.digest("hex").slice(0,16);
const worker=(await readFile("sw.js","utf8")).replace(/const CACHE_NAME = "[^"]+";/,'const CACHE_NAME = "derive-lab-'+version+'";');
await writeFile("sw.js",worker);
await mkdir("dist",{recursive:true});
for(const file of [...resources,"sw.js","icon-192.png","icon-512.png","icon-maskable.png","apple-touch-icon.png"])
  await copyFile(file,"dist/"+file);
console.log("Application compilée, autonome et installable. Cache : "+version);
