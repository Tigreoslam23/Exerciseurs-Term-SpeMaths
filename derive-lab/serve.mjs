import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {resolve,extname,sep} from "node:path";
const root=process.cwd(), port=5173;
const mime={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".tsx":"text/plain; charset=utf-8",".css":"text/css; charset=utf-8",".json":"application/json; charset=utf-8",".webmanifest":"application/manifest+json; charset=utf-8",".png":"image/png"};
createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
  const file=resolve(root,"."+pathname+(pathname.endsWith("/")?"index.html":""));
  if(!file.startsWith(root+sep)){res.writeHead(403);res.end("Accès refusé");return;}
  const bytes=await readFile(file);
  res.writeHead(200,{"Content-Type":mime[extname(file)]||"application/octet-stream","Cache-Control":"no-cache"});
  res.end(bytes);
 }catch{res.writeHead(404);res.end("Fichier introuvable");}
}).listen(port,"127.0.0.1",()=>console.log("Dérive Lab : http://localhost:"+port));

