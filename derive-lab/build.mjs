import {build} from "esbuild";
import {mkdir,copyFile,readFile,writeFile} from "node:fs/promises";
await mkdir("dist",{recursive:true});
await build({entryPoints:["app.tsx"],outfile:"dist/app.js",bundle:true,format:"iife",target:"es2020",minify:true});
await copyFile("styles.css","dist/styles.css");
let html=await readFile("index.html","utf8");
html=html.replace('<script src="./bootstrap.js" defer></script>',[
 '<script src="https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.production.min.js" crossorigin="anonymous"></script>',
 '<script src="https://cdn.jsdelivr.net/npm/react-dom@18.3.1/umd/react-dom.production.min.js" crossorigin="anonymous"></script>',
 '<script src="./app.js" defer></script>'
].join("\n  "));
await writeFile("dist/index.html",html);
console.log("Version compilée prête dans dist/ (sans Babel au démarrage).");
