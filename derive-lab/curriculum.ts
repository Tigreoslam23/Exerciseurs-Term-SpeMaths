export type Skill={id:string;title:string;subtitle:string;level:number;deps:string[]};
export const FIRST_SKILLS:Skill[]=[
 {id:"basics",title:"Constantes et identité",subtitle:"Les deux dérivées de départ",level:1,deps:[]},
 {id:"affine",title:"Les fonctions linéaires-affines",subtitle:"La dérivée de ax+b est a",level:1,deps:["basics"]},
 {id:"power",title:"Les fonctions puissances",subtitle:"De x² à x¹⁰",level:1,deps:["basics"]},
 {id:"coeff",title:"La forme k × u(x)",subtitle:"Garder le coefficient et son signe",level:1,deps:["power","affine"]},
 {id:"sum-pair",title:"La somme de deux fonctions",subtitle:"Identifier u et v, puis dériver côte à côte",level:1,deps:["coeff"]},
 {id:"inverse",title:"La fonction inverse",subtitle:"De k/x à k fois 1/x",level:1,deps:["coeff"]},
 {id:"sqrt",title:"La fonction racine carrée",subtitle:"Dériver puis réduire la fraction",level:1,deps:["coeff"]},
 {id:"exp",title:"La fonction exponentielle",subtitle:"Une fonction qui se retrouve",level:1,deps:["coeff"]},
 {id:"sum",title:"Les sommes de plusieurs fonctions",subtitle:"Deux à quatre termes, un bloc par dérivée",level:1,deps:["sum-pair","inverse","sqrt","exp"]},
 {id:"product",title:"La règle du produit",subtitle:"Identifier, assembler et simplifier",level:1,deps:["sum"]},
 {id:"quotient",title:"La règle du quotient",subtitle:"Des homographies aux fractions rationnelles",level:1,deps:["product","inverse"]},
 {id:"inverse-u",title:"L’inverse d’une fonction u",subtitle:"Construire −u′/u² sans développer u²",level:1,deps:["quotient","sum"]},
 {id:"affine-compose",title:"La composée affine",subtitle:"Dériver g(ax+b) en conservant ax+b",level:1,deps:["inverse-u","power","sqrt","exp"]}
];
export type Term={expression:string;derivative:string};
export type Field={label:string;expected:string;form?:"expanded"|"preserve-square"|"reduced-poly"};
export type PlanStep=
 |{kind:"notice";title:string;formula:string;explanation:string}
 |{kind:"identify";title:string;formula:string;items:{label:string;value:string}[];rewrite?:string}
 |{kind:"fill";title:string;fields:Field[];layout?:"sum"|"fraction";before?:string;after?:string;references?:string[];dragSources?:{label:string;value:string}[];hint:string}
 |{kind:"assemble";title:string;pair:{operation:"product"|"quotient";u:string;v:string;du:string;dv:string}};
export type LearningPlan={id:string;expression:string;domain:string;final:string;steps:PlanStep[];difficulty:string};
const r=(lo:number,hi:number)=>lo+Math.floor(Math.random()*(hi-lo+1));
const nz=(max=7)=>(Math.random()<.5?-1:1)*r(1,max);
const choose=<T,>(items:T[])=>items[r(0,items.length-1)];
export const joinTerms=(parts:string[])=>parts.filter(p=>p!=="0").map((p,i)=>i&&!p.startsWith("-")?"+"+p:p).join("")||"0";
export function poly(cs:number[]):string{
 return joinTerms(cs.map((v,n)=>v===0?"0":n===0?String(v):(v===1?"":v===-1?"-":v+"*")+"x"+(n===1?"":"^"+n)).reverse());
}
export const dp=(cs:number[])=>cs.slice(1).map((v,i)=>v*(i+1));
const mul=(a:number[],b:number[])=>{const out=Array(a.length+b.length-1).fill(0);a.forEach((v,i)=>b.forEach((w,j)=>out[i+j]+=v*w));return out;};
const sub=(a:number[],b:number[])=>Array.from({length:Math.max(a.length,b.length)},(_,i)=>(a[i]||0)-(b[i]||0));
const polynomial=(degree:number)=>Array.from({length:degree+1},()=>nz(5));
function reference(kind:string,k=1,n=2):Term{
 const scale=(s:string)=>k===1?s:k===-1?"-"+s:k+"*"+s;
 if(kind==="constant")return {expression:String(k),derivative:"0"};
 if(kind==="inverse")return {expression:k+"/x",derivative:-k+"/x^2"};
 if(kind==="sqrt")return {expression:scale("sqrt(x)"),derivative:k%2===0?(k/2)+"/sqrt(x)":k+"/(2sqrt(x))"};
 if(kind==="exp")return {expression:scale("e^x"),derivative:scale("e^x")};
 return {expression:poly(Array.from({length:n+1},(_,i)=>i===n?k:0)),derivative:poly(Array.from({length:n},(_,i)=>i===n-1?k*n:0))};
}
const fill=(title:string,expected:string,hint:string,before="f'(x) = ",after=""):PlanStep=>({kind:"fill",title,fields:[{label:"Dérivée à compléter",expected}],before,after,hint});
const notice=(title:string,formula:string,explanation:string):PlanStep=>({kind:"notice",title,formula,explanation});
const identify=(items:{label:string;value:string}[],formula:string,rewrite?:string):PlanStep=>({kind:"identify",title:"Identifie les éléments de la fonction.",formula,items,rewrite});
const coeffSteps=(k:number,base:string,d:string,final:string,rewrite?:string):PlanStep[]=>[
 identify([{label:"k",value:String(k)},{label:"u(x)",value:base}],"(k*u)' = k*u'",rewrite),
 fill("Dérive la fonction de référence.",d,"Dérive uniquement u(x), puis conserve le coefficient.","u'(x) = "),
 fill("Termine le calcul.",final,"Multiplie par k et réduis les coefficients de la fraction si nécessaire.")
];
export function makeLearningPlan(id:string,round=0):LearningPlan{
 let expression="",domain="sur ℝ",final="",steps:PlanStep[]=[],difficulty="Entraînement";
 if(id==="basics"){
  const identity=round%2===1;expression=identity?"x":String(round===0?4:r(-9,9));final=identity?"1":"0";
  steps=[notice("Les deux fondamentaux.","(c)' = 0 ; (x)' = 1","c est une constante. Dérive la fonction qui est affichée."),fill("Écris la dérivée.",final,identity?"La dérivée de x est 1.":"La dérivée d’une constante est 0.")];
 }
 if(id==="affine"){
  const a=nz(9),b=round%2===0?0:nz(9);expression=poly([b,a]);final=String(a);
  steps=[notice("La règle des fonctions linéaires et affines.","(ax+b)' = a","a et b sont des constantes, avec a non nul. Le terme constant disparaît."),fill("Dérive la fonction.",final,"Repère le coefficient de x : c’est la dérivée.")];
 }
 if(id==="power"){
  const n=round<9?round+2:r(2,10);expression="x^"+n;final=reference("power",1,n).derivative;difficulty="Exposant "+n;
  steps=[notice("La règle des puissances.","(x^n)' = n*x^(n-1)","Fais descendre n, puis diminue l’exposant de 1."),fill("Écris la dérivée.",final,"L’exposant initial est "+n+". Le nouvel exposant est "+(n-1)+".")];
 }
 if(id==="coeff"){
  const k=nz(9),n=round<3?2:r(2,10),base="x^"+n,t=reference("power",k,n);expression=t.expression;final=t.derivative;
  steps=coeffSteps(k,base,reference("power",1,n).derivative,final);difficulty="Coefficient relatif non nul";
 }
 if(id==="inverse"){
  const k=round===0?2:nz(9);expression=k+"/x";final=-k+"/x^2";domain="pour x ≠ 0";
  steps=coeffSteps(k,"1/x","-1/x^2",final,k+"*(1/x)");
 }
 if(id==="sqrt"){
  const k=round===0?2:nz(9);const t=reference("sqrt",k);expression=t.expression;final=t.derivative;domain="pour x > 0";
  steps=coeffSteps(k,"sqrt(x)","1/(2sqrt(x))",final);
 }
 if(id==="exp"){
  const k=round===0?1:nz(9);const t=reference("exp",k);expression=t.expression;final=t.derivative;
  steps=k===1?[notice("La dérivée de l’exponentielle.","(e^x)' = e^x","La fonction exponentielle est sa propre dérivée."),fill("Écris la dérivée.",final,"Conserve e^x.")]:coeffSteps(k,"e^x","e^x",final);
 }
 if(id==="sum-pair"){
  const n=round<3?2:round<6?3:r(2,10),k=round<6?1:nz(7),u=reference("power",k,n);
  const type=round%4,a=nz(7),b=nz(7);
  const v=type===0?reference("constant",b):type===1?reference("power",1,1):{expression:poly([type===2?0:b,a]),derivative:String(a)};
  expression=joinTerms([u.expression,v.expression]);final=joinTerms([u.derivative,v.derivative]);difficulty=round<3?"u(x) = x²":round<6?"u(x) = x³":"u(x) = kxⁿ";
  steps=[identify([{label:"u(x)",value:u.expression},{label:"v(x)",value:v.expression}],"(u+v)' = u'+v'"),{kind:"fill",title:"Complète les deux dérivées.",layout:"sum",fields:[{label:"u′(x)",expected:u.derivative},{label:"v′(x)",expected:v.derivative}],references:[u.expression,v.expression],before:"f'(x) = ",hint:"Dérive chaque fonction séparément. Les deux cases sont disponibles ; utilise + ou − devant chaque résultat."}];
 }
 if(id==="sum"){
  const pool=["linear","square","cube","power","inverse","sqrt","exp"],terms:Term[]=[],count=round<3?2:round<6?3:4;
  for(let i=0;i<count;i++){
   const kind=pool.splice(r(0,pool.length-1),1)[0],k=nz(7),n=kind==="linear"?1:kind==="square"?2:kind==="cube"?3:r(4,10);
   let t=reference(kind,k,n);
   if(kind==="linear"&&round%2===0)t={expression:poly([nz(7),k]),derivative:String(k)};
   terms.push(t);
  }
  expression=joinTerms(terms.map(t=>t.expression));final=joinTerms(terms.map(t=>t.derivative));domain=terms.some(t=>/sqrt/.test(t.expression))?"pour x > 0":terms.some(t=>/\/x/.test(t.expression))?"pour x ≠ 0":"sur ℝ";
  difficulty=count+" fonctions à dériver";
  steps=[notice("La dérivée d’une somme.","(u+v)' = u'+v'","Dérive chaque terme, en conservant son coefficient et son signe."),{kind:"fill",title:"Un bloc pour chaque dérivée.",layout:"sum",fields:terms.map((t,i)=>({label:"Terme "+(i+1),expected:t.derivative})),references:terms.map(t=>t.expression),before:"f'(x) = ",hint:"Chaque bloc correspond exactement au terme au-dessus. Choisis le signe avec le bouton +/− pour éviter les signes juxtaposés."}];
 }
 if(id==="product"||id==="quotient"){
  let p:number[],q:number[];
  if(id==="product"){p=[nz(7),0,1];q=[nz(7),nz(5)];}
  else if(round<5){p=[nz(7),nz(7)];q=[nz(7),nz(5)];if(p[1]*q[0]-p[0]*q[1]===0)p[0]+=p[0]>0?1:-1;}
  else {const degrees=[[3,1],[1,3],[3,2],[2,3]][(round-5)%4];p=polynomial(degrees[0]);q=polynomial(degrees[1]);}
  const u=poly(p),v=poly(q),du=poly(dp(p)),dv=poly(dp(q)),operation=id==="product"?"product":"quotient",formula=operation==="product"?"(u*v)' = u'v+uv'":"(u/v)' = (u'v-uv')/v^2";
  expression=operation==="product"?`(${u})*(${v})`:`(${u})/(${v})`;
  const numerator=operation==="product"?sub(mul(dp(p),q),mul(p,dp(q)).map(v=>-v)):sub(mul(dp(p),q),mul(p,dp(q)));
  final=operation==="product"?poly(numerator):`(${poly(numerator)})/(${v})^2`;
  domain=operation==="product"?"sur ℝ":v.includes("x")?`pour ${v} ≠ 0`:"sur ℝ";
  difficulty=operation==="product"?"Produit de deux polynômes":round<5?"Fonction homographique non constante":"Fraction rationnelle · degré maximal 3";
  steps=[identify([{label:"u(x)",value:u},{label:"v(x)",value:v}],formula),{kind:"fill",title:"Calcule u′ et v′.",fields:[{label:"u′(x)",expected:du},{label:"v′(x)",expected:dv}],references:[u,v],hint:"Calcule chaque dérivée dans sa case."},{kind:"assemble",title:"Applique la règle par glisser-déposer.",pair:{operation,u,v,du,dv}}];
  if(operation==="product")steps.push(fill("Développe et réduis.",final,"Développe les deux produits puis regroupe les termes de même degré."));
  else {
   const expanded=joinTerms([...mul(dp(p),q).map((c,n)=>poly(Array.from({length:n+1},(_,i)=>i===n?c:0))).reverse(),...mul(p,dp(q)).map((c,n)=>poly(Array.from({length:n+1},(_,i)=>i===n?-c:0))).reverse()]);
   steps.push({kind:"fill",title:"Développe le numérateur.",fields:[{label:"Numérateur développé",expected:expanded,form:"expanded"}],before:"f'(x) = ",after:`/(${v})^2`,hint:"Développe les deux produits et distribue le signe moins ; garde les termes de même degré pour l’étape suivante."});
   steps.push({kind:"fill",title:"Réduis le numérateur.",fields:[{label:"Numérateur réduit",expected:poly(numerator),form:"reduced-poly"}],before:"f'(x) = ",after:`/(${v})^2`,references:[expanded],hint:"Regroupe les termes de même degré. Le dénominateur reste au carré, sans être développé."});
  }
 }
 if(id==="inverse-u"){
  let u:Term;
  if(round<5){const cs=polynomial(round+1);u={expression:poly(cs),derivative:poly(dp(cs))};}
  else {const types=["inverse","sqrt","exp"];const ts=Array.from({length:2+round%2},()=>reference(types.splice(r(0,types.length-1),1)[0],nz(5)));u={expression:joinTerms(ts.map(t=>t.expression)),derivative:joinTerms(ts.map(t=>t.derivative))};domain="là où u est dérivable et u(x) ≠ 0 ; x > 0 si une racine intervient";}
  expression=`1/(${u.expression})`;final=`-(${u.derivative})/(${u.expression})^2`;
  if(round<5)domain=`pour ${u.expression} ≠ 0`;
  steps=[identify([{label:"u(x)",value:u.expression}],"(1/u)' = -u'/u^2"),fill("Dérive u.",u.derivative,"Dérive u terme à terme.","u'(x) = "),{kind:"fill",title:"Construis la fraction dérivée.",layout:"fraction",fields:[{label:"Numérateur −u′(x)",expected:`-(${u.derivative})`},{label:"Dénominateur u²(x), non développé",expected:`(${u.expression})^2`,form:"preserve-square"}],dragSources:[{label:"u'(x)",value:u.derivative},{label:"u(x)",value:u.expression}],before:"f'(x) = ",hint:"Dépose u′ au numérateur et u au dénominateur. Ajoute toi-même le signe moins devant u′ et le carré autour de u, sans développer le dénominateur."}];
 }
 if(id==="affine-compose"){
  const a=nz(7),b=nz(7),u=poly([b,a]),kind=["power","inverse","exp","sqrt"][round%4],n=r(2,10);
  const g=reference(kind,1,n);
  expression=kind==="power"?`(${u})^${n}`:kind==="inverse"?`1/(${u})`:kind==="exp"?`e^(${u})`:`sqrt(${u})`;
  final=kind==="power"?`${n*a}*(${u})^${n-1}`:kind==="inverse"?`${-a}/(${u})^2`:kind==="exp"?`${a}*e^(${u})`:a%2===0?`${a/2}/sqrt(${u})`:`${a}/(2sqrt(${u}))`;
  domain=kind==="inverse"?`pour ${u} ≠ 0`:kind==="sqrt"?`pour ${u} > 0`:"sur ℝ";
  steps=[
   {...identify([{label:"a",value:String(a)},{label:"g(x)",value:g.expression}],"(g(ax+b))' = a*g'(ax+b)","g(ax+b)"),title:"Identifie a et la fonction g."},
   {kind:"fill",title:"Calcule la dérivée intérieure.",fields:[{label:"Coefficient a",expected:String(a)}],before:`a = (${u})' = `,hint:"La dérivée de ax+b est a. Repère le coefficient de x dans l’expression intérieure."},
   {kind:"fill",title:"Dérive la fonction de référence g.",fields:[{label:"g′(x)",expected:g.derivative}],before:"g'(x) = ",hint:"Dérive g(x) uniquement, avec la variable x. Tu remplaceras ensuite x par l’expression intérieure."},
   fill("Applique la règle et simplifie.",final,`Dans g′, remplace x par (${u}), puis multiplie par a = ${a}. Réduis le coefficient de la fraction si nécessaire.`)
  ];
 }
 if(!steps.length)throw Error("Compétence inconnue : "+id);
 return {id,expression,domain,final,steps,difficulty};
}
