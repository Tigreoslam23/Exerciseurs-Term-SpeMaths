import * as React from "react";
import {createRoot} from "react-dom/client";
import {MathText,compactMath} from "./math-display";
import {RuleAssembly,substitutedRule,type AssemblyPair} from "./rule-assembly";
type InstallPromptEvent = Event & {prompt:()=>Promise<void>;userChoice:Promise<{outcome:string}>};
type StepKind = "move" | "pair" | "assemble" | "formula" | "input" | "rule";
type PairRole = "u" | "v";
type Pair = AssemblyPair;
type FactorRole = "k" | PairRole;
type FactorDrag = { role: FactorRole; pointerId: number; startX: number; startY: number; moved: boolean };
type Step = { kind: StepKind; prompt: string; expected: string; prefix: string; suffix: string; hint: string; choices: string[]; solved: string; form?: "expanded" | "number" };
type Exercise = { id: string; expression: string; domain: string; final: string; coefficient?: string; base?: string; pair?: Pair; steps: Step[] };
type Skill = { id: string; title: string; subtitle: string; level: number; deps: string[] };
type Result = { solved: number; clean: number; history: boolean[] };
type Progress = { version: number; xp: number; stats: Record<string, Result> };
const SKILLS: Skill[] = [
  {
    "id": "constant",
    "title": "Les constantes",
    "subtitle": "Ce qui ne varie pas",
    "level": 1,
    "deps": []
  },
  {
    "id": "linear",
    "title": "La fonction identité",
    "subtitle": "Le point de départ : x",
    "level": 1,
    "deps": []
  },
  {
    "id": "square",
    "title": "Carrés & cubes",
    "subtitle": "Faire descendre l’exposant",
    "level": 1,
    "deps": []
  },
  {
    "id": "coeff",
    "title": "Garder le coefficient",
    "subtitle": "Un nombre reste en facteur",
    "level": 1,
    "deps": []
  },
  {
    "id": "negative",
    "title": "Maîtriser les signes",
    "subtitle": "Dériver sans perdre le moins",
    "level": 1,
    "deps": [
      "coeff"
    ]
  },
  {
    "id": "power",
    "title": "Toutes les puissances",
    "subtitle": "Passer de xⁿ à nxⁿ⁻¹",
    "level": 1,
    "deps": [
      "square",
      "coeff"
    ]
  },
  {
    "id": "affine",
    "title": "Les fonctions affines",
    "subtitle": "Le coefficient et la constante",
    "level": 1,
    "deps": [
      "linear"
    ]
  },
  {
    "id": "sum",
    "title": "Assembler une somme",
    "subtitle": "Dériver terme à terme",
    "level": 1,
    "deps": [
      "power",
      "affine"
    ]
  },
  {
    "id": "inverse",
    "title": "La fonction inverse",
    "subtitle": "Attention au signe et au carré",
    "level": 1,
    "deps": [
      "coeff"
    ]
  },
  {
    "id": "sqrt",
    "title": "La racine carrée",
    "subtitle": "Une nouvelle fonction de référence",
    "level": 1,
    "deps": [
      "square"
    ]
  },
  {
    "id": "product",
    "title": "La règle du produit",
    "subtitle": "Construire les deux termes",
    "level": 1,
    "deps": [
      "sum"
    ]
  },
  {
    "id": "quotient",
    "title": "La règle du quotient",
    "subtitle": "Dans le bon ordre",
    "level": 1,
    "deps": [
      "product",
      "inverse"
    ]
  },
  {
    "id": "exp",
    "title": "L’exponentielle",
    "subtitle": "La fonction qui se retrouve",
    "level": 2,
    "deps": [
      "coeff"
    ]
  },
  {
    "id": "ln",
    "title": "Le logarithme",
    "subtitle": "De ln x à 1/x",
    "level": 2,
    "deps": [
      "inverse"
    ]
  },
  {
    "id": "exp-affine",
    "title": "Exponentielle composée",
    "subtitle": "Ne pas oublier la dérivée intérieure",
    "level": 2,
    "deps": [
      "exp",
      "affine"
    ]
  },
  {
    "id": "ln-affine",
    "title": "Logarithme composé",
    "subtitle": "Construire u′/u",
    "level": 2,
    "deps": [
      "ln",
      "affine"
    ]
  },
  {
    "id": "chain-power",
    "title": "Puissances composées",
    "subtitle": "La mécanique de la chaîne",
    "level": 2,
    "deps": [
      "power",
      "affine"
    ]
  },
  {
    "id": "chain-inverse",
    "title": "Inverse composé",
    "subtitle": "Construire −u′/u²",
    "level": 2,
    "deps": [
      "inverse",
      "affine"
    ]
  },
  {
    "id": "chain-sqrt",
    "title": "Racine composée",
    "subtitle": "Une racine et une dérivée intérieure",
    "level": 2,
    "deps": [
      "sqrt",
      "affine"
    ]
  },
  {
    "id": "sin",
    "title": "Le sinus",
    "subtitle": "Le passage vers le cosinus",
    "level": 2,
    "deps": [
      "chain-power"
    ]
  },
  {
    "id": "cos",
    "title": "Le cosinus",
    "subtitle": "Un signe qui change tout",
    "level": 2,
    "deps": [
      "sin"
    ]
  },
  {
    "id": "exp-square",
    "title": "Exponentielle & carré",
    "subtitle": "Une fonction dans une fonction",
    "level": 2,
    "deps": [
      "exp-affine",
      "power"
    ]
  },
  {
    "id": "product-exp",
    "title": "Produit exponentiel",
    "subtitle": "Dériver, puis factoriser",
    "level": 2,
    "deps": [
      "product",
      "exp"
    ]
  },
  {
    "id": "synthesis",
    "title": "La grande synthèse",
    "subtitle": "Puissances, produit et logarithme",
    "level": 2,
    "deps": [
      "product",
      "ln",
      "power"
    ]
  }
];
const MEMO: [string,string][] = [
  [
    "Constante",
    "(c)' = 0"
  ],
  [
    "Identité",
    "(x)' = 1"
  ],
  [
    "Puissance",
    "(x^n)' = n*x^(n-1)"
  ],
  [
    "Coefficient",
    "(k*u)' = k*u'"
  ],
  [
    "Somme",
    "(u+v)' = u'+v'"
  ],
  [
    "Produit",
    "(u*v)' = u'v+uv'"
  ],
  [
    "Quotient",
    "(u/v)' = (u'v-uv')/v^2"
  ],
  [
    "Inverse",
    "(1/x)' = -1/x^2"
  ],
  [
    "Racine",
    "(sqrt(x))' = 1/(2sqrt(x))"
  ],
  [
    "Exponentielle",
    "(e^u)' = u'*e^u"
  ],
  [
    "Logarithme",
    "(ln(u))' = u'/u"
  ],
  [
    "Composition",
    "(g(u))' = u'*g'(u)"
  ],
  [
    "Sinus",
    "(sin(u))' = u'*cos(u)"
  ],
  [
    "Cosinus",
    "(cos(u))' = -u'*sin(u)"
  ]
];
const STORAGE_KEY = "derive-lab-progression-v1";
const EMPTY: Progress = { version: 1, xp: 0, stats: {} };
function readProgress(): Progress {
  try {
    const p = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (p?.version === 1 && Number.isFinite(p.xp) && p.stats && typeof p.stats === "object") {
      const stats: Record<string, Result> = {};
      for (const skill of SKILLS) {
        const s = p.stats[skill.id];
        if (!s || !Number.isInteger(s.solved) || !Number.isInteger(s.clean) || s.solved < 0 || s.clean < 0 || s.clean > s.solved) continue;
        stats[skill.id] = {solved: s.solved, clean: s.clean, history: Array.isArray(s.history) ? s.history.filter(v => typeof v === "boolean").slice(-20) : []};
      }
      return {version:1,xp:Math.max(0,p.xp),stats};
    }
  } catch {}
  return { ...EMPTY, stats: {} };
}

function mathValue(source: string, x: number): number {
 const s=source.replace(/²/g,"^2").replace(/³/g,"^3").replace(/×|·/g,"*").replace(/−/g,"-").replace(/π/g,"pi").replace(/,/g,".").replace(/\s/g,"");
 const tokens=s.match(/(?:\d+(?:\.\d*)?|\.\d+)|[a-z]+|[()+\-*/^]/g)||[];
 if(tokens.join("")!==s||tokens.length>160)throw Error("Expression invalide");
 let pos=0;
 function atom(){const t=tokens[pos++];if(t==="("){const a=add();if(tokens[pos++]!==")")throw Error("Parenthèse");return a;}if(t==="x")return x;if(t==="e")return Math.E;if(t==="pi")return Math.PI;if(["exp","ln","sqrt","sin","cos"].includes(t)){if(tokens[pos++]!=="(")throw Error("Parenthèse");const a=add();if(tokens[pos++]!==")")throw Error("Parenthèse");return({exp:Math.exp,ln:Math.log,sqrt:Math.sqrt,sin:Math.sin,cos:Math.cos})[t](a);}if(t&&/^(?:\d|\.)/.test(t))return Number(t);throw Error("Terme");}
 function power(){let a=atom();if(tokens[pos]==="^"){pos++;a=Math.pow(a,unary());}return a;}
 function unary(){if(tokens[pos]==="-"){pos++;return-unary();}if(tokens[pos]==="+"){pos++;return unary();}return power();}
 function mul(){let a=unary();while(pos<tokens.length){const t=tokens[pos];if(t==="*"||t==="/"){pos++;const b=unary();a=t==="*"?a*b:a/b;}else if(t==="("||t==="x"||t==="e"||t==="pi"||["exp","ln","sqrt","sin","cos"].includes(t)||/^(?:\d|\.)/.test(t)){a*=unary();}else break;}return a;}
 function add(){let a=mul();while(tokens[pos]==="+"||tokens[pos]==="-"){const t=tokens[pos++],b=mul();a=t==="+"?a+b:a-b;}return a;}
 const a=add();if(pos!==tokens.length||!Number.isFinite(a))throw Error("Calcul");return a;
}

function equivalent(a: string, b: string): boolean {
  try {
    return [.29,.71,1.13,1.79,2.43,3.17,4.61,5.23,6.47].every(x=>{
      const u=mathValue(a,x),v=mathValue(b,x);
      return Math.abs(u-v)<=1e-8*Math.max(1,Math.abs(u),Math.abs(v));
    });
  } catch { return false; }
}

function makeTask(id: string, first = false): Exercise {
 const r=(lo=2,hi=7)=>Math.floor(Math.random()*(hi-lo+1))+lo;
 const a=first?4:r(),b=r(),c=r(),n=r(3,6),xp=k=>k===0?"1":k===1?"x":`x^${k}`;
 const poly=(cs)=>cs.map((v,k)=>[v,k]).reverse().filter(([v])=>v!==0).map(([v,k],i)=>(v<0?"-":i?"+":"")+(k===0?Math.abs(v):((Math.abs(v)===1?"":Math.abs(v)+"*")+xp(k)))).join("")||"0";
 const choices=(ans: string,wrong: string[])=>{
 const list=Array.from(new Set([ans,...wrong])).slice(0,6);
 for(let i=list.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[list[i],list[j]]=[list[j],list[i]];}
 return list;
};
 const step=(kind: StepKind,prompt: string,expected: string,prefix: string,suffix: string,hint: string,wrong: string[]=[],solved?: string): Step=>({kind,prompt,expected,prefix,suffix,hint,choices:choices(expected,wrong||[]),solved:solved||prefix+expected+suffix});
 const derivative=(ans:string,hint:string,prefix="f'(x) = ",suffix="")=>step("input","Écris la dérivée.",ans,prefix,suffix,hint);
 const input=(expected,prefix="f'(x) = ",suffix="",hint="Effectue le calcul, puis simplifie.")=>step("input","À toi de simplifier.",expected,prefix,suffix,hint);
 const rule=(ans,hint)=>step("rule","Quelle règle faut-il utiliser ?",ans,"","",hint,["u'+v'","u'v+uv'","(u'v-uv')/v^2","u'×g'(u)"],"Règle : "+ans);
 const exponentialRule=()=>step("formula","Dérive l’exponentielle composée.","exp-formula","","","La dérivée de eᵘ est u′eᵘ. Calcule u′ puis conserve eᵘ.",[],"(e^u)' = u'*e^u");
 const reducedSqrt=(coefficient:number,root:string)=>{
   const divisor=coefficient%2===0?2:1,numerator=String(coefficient/divisor),denominator=(divisor===2?"":"2")+"sqrt"+root;
   const suffix="/("+denominator+")";
   return {numerator,suffix,final:numerator+suffix,hint:divisor===2?"Réduis le coefficient "+coefficient+"/2 avant de compléter le numérateur.":"Le coefficient "+coefficient+"/2 est irréductible."};
 };
 const identifyPair=(operation:"product"|"quotient")=>step("pair","Identifie u et v, puis calcule leurs dérivées.","pair","","",operation==="quotient"?"u est le numérateur et v le dénominateur.":"Dans cet atelier, u est le premier facteur et v le second.",[],operation==="quotient"?"(u/v)' = (u'v-uv')/v^2":"(uv)' = u'v+uv'");
 const move=(k,base)=>step("move","Identifie la forme k × u(x).",String(k),"f'(x) = ",`*(${base})'`,"k est le nombre constant ; u(x) est le facteur qui dépend de x. Puis (ku)' = ku'.",[]);
 const coeff=(k,p)=>{const base=xp(p),d=p===1?"1":`${p}*${xp(p-1)}`,final=poly(Array.from({length:p},(_,i)=>i===p-1?k*p:0));return {expression:`${k}*${base}`,domain:"sur ℝ",final,coefficient:String(k),base,steps:[move(k,base),derivative(d,`La dérivée de x^${p} est ${p}x^${p-1}.`,`f'(x) = ${k}*`,""),input(String(k*p),"f'(x) = ",p===1?"":`*${xp(p-1)}`,`Multiplie ${k} par ${p}.`)]};};
 let t;
 if(id==="constant") t={expression:String(b),domain:"sur ℝ",final:"0",steps:[derivative("0","Une constante ne varie pas : sa dérivée est nulle.","f'(x) = ","")]};
 if(id==="linear") t={expression:"x",domain:"sur ℝ",final:"1",steps:[derivative("1","La fonction identité a pour dérivée 1.","f'(x) = ","")]};
 if(id==="square") {const p=r(2,3);t={expression:xp(p),domain:"sur ℝ",final:`${p}*${xp(p-1)}`,steps:[derivative(`${p}*${xp(p-1)}`,"Fais descendre l'exposant, puis diminue-le de 1.","f'(x) = ","")]};}
 if(id==="coeff")t=coeff(a,2);
 if(id==="negative")t=coeff(-a,r(2,3));
 if(id==="power")t=coeff(a,n);
 if(id==="affine")t={expression:poly([b,a]),domain:"sur ℝ",final:String(a),steps:[rule("u'+v'","On dérive chaque terme d'une somme."),derivative("0","Le terme constant disparaît.","Dérivée de "+b+" = ",""),input(String(a),"f'(x) = ","","La dérivée de ax est a.")]};
 if(id==="sum"){const expr=poly([c,b,a,1]),final=poly([b,2*a,3]);t={expression:expr,domain:"sur ℝ",final,steps:[rule("u'+v'","La dérivée d'une somme est la somme des dérivées."),derivative("3*x^2","(x³)' = 3x².","(x^3)' = "),derivative("2*x","(x²)' = 2x.","(x^2)' = "),input(final,"f'(x) = ","",`Dérive terme à terme. Le terme ${c} donne 0.`)]};}
 if(id==="inverse")t={expression:`${a}/x`,domain:"pour x ≠ 0",final:`-${a}/x^2`,coefficient:String(a),base:"1/x",steps:[move(a,"1/x"),derivative("-1/x^2","(1/x)' = -1/x².",`f'(x) = ${a}*`,""),input(String(-a),"f'(x) = ","/x^2","Le signe moins vient de la dérivée de 1/x.")]};
 if(id==="sqrt"){const reduced=reducedSqrt(a,"(x)");t={expression:`${a}*sqrt(x)`,domain:"pour x > 0",final:reduced.final,coefficient:String(a),base:"sqrt(x)",steps:[move(a,"sqrt(x)"),derivative("1/(2sqrt(x))","(√x)' = 1/(2√x).",`f'(x) = ${a}*`,""),input(reduced.numerator,"f'(x) = ",reduced.suffix,reduced.hint)]};}
 if(id==="product"){const u=`x^2+${b}`,v=`${a}*x+${c}`,final=poly([a*b,2*c,3*a]);t={expression:`(${u})*(${v})`,domain:"sur ℝ",final,pair:{operation:"product",u,v,du:"2*x",dv:String(a)},steps:[identifyPair("product"),step("input","Applique la règle du produit.",`2*x*(${v})+(${u})*${a}`,"f'(x) = ","","Remplace u, v, u′ et v′ dans u′v + uv′."),input(final,"f'(x) = ","","Développe les deux produits, puis regroupe les termes de même degré.")]};}
 if(id==="quotient"){
   const v=`x+${c}`,u=poly([b,a]),k=a*c-b;
   const developed=step("input","Développe le numérateur.",`${a}*x+${a*c}-${a}*x-${b}`,"f'(x) = ",`/(${v})^2`,"Développe le premier produit, puis distribue le signe moins devant le second. Garde les termes en x à cette étape.");
   developed.form="expanded";
   developed.solved=`f'(x) = (${developed.expected})/(${v})^2`;
   const reduced=input(String(k),"f'(x) = ",`/(${v})^2`,"Les termes en x s’annulent. Calcule ensuite la différence des constantes.");
   reduced.prompt="Réduis le numérateur.";reduced.form="number";
   t={expression:`(${u})/(${v})`,domain:`pour x ≠ -${c}`,final:`${k}/(${v})^2`,pair:{operation:"quotient",u,v,du:String(a),dv:"1"},steps:[identifyPair("quotient"),step("assemble","Construis la formule.","assemble","","","Place u′ puis v, u puis v′, et enfin v au dénominateur.",[]),developed,reduced]};
 }

 if(id==="exp")t={expression:`${a}*e^x`,domain:"sur ℝ",final:`${a}*e^x`,coefficient:String(a),base:"e^x",steps:[move(a,"e^x"),derivative("e^x","La fonction exponentielle est sa propre dérivée.",`f'(x) = ${a}*`,""),input(String(a),"f'(x) = ","*e^x","Le coefficient est conservé.")]};
 if(id==="ln")t={expression:`${a}*ln(x)`,domain:"pour x > 0",final:`${a}/x`,coefficient:String(a),base:"ln(x)",steps:[move(a,"ln(x)"),derivative("1/x","(ln x)' = 1/x.",`f'(x) = ${a}*`,""),input(String(a),"f'(x) = ","/x","Conserve le coefficient au numérateur.")]};
 const u=`(${a}*x+${b})`,chain=()=>[rule("u'×g'(u)","Dérive la fonction extérieure, puis multiplie par u'."),derivative(String(a),"u est affine : u' = a.","u'(x) = ","")];
 if(id==="exp-affine")t={expression:`e^${u}`,domain:"sur ℝ",final:`${a}*e^${u}`,steps:[exponentialRule(),derivative(String(a),"u est affine : u′ est le coefficient de x.","u'(x) = "),input(String(a),"f'(x) = ",`*e^${u}`,"(eᵘ)' = u'eᵘ.")]};
 if(id==="ln-affine")t={expression:`ln${u}`,domain:`pour x > -${b}/${a}`,final:`${a}/${u}`,steps:[...chain(),input(String(a),"f'(x) = ",`/${u}`,"(ln u)' = u'/u lorsque u > 0.")]};
 if(id==="chain-power"){const p=r(2,5);t={expression:`${u}^${p}`,domain:"sur ℝ",final:`${p*a}*${u}^${p-1}`,steps:[...chain(),input(String(p*a),"f'(x) = ",`*${u}^${p-1}`,`(u^${p})' = ${p}u'u^${p-1}. Multiplie ${p} par ${a}.`)]};}
 if(id==="chain-inverse")t={expression:`1/${u}`,domain:`pour x ≠ -${b}/${a}`,final:`-${a}/${u}^2`,steps:[...chain(),input(String(-a),"f'(x) = ",`/${u}^2`,"(1/u)' = -u'/u².")]};
 if(id==="chain-sqrt"){const reduced=reducedSqrt(a,u);t={expression:`sqrt${u}`,domain:`pour x > -${b}/${a}`,final:reduced.final,steps:[...chain(),input(reduced.numerator,"f'(x) = ",reduced.suffix,"(√u)' = u'/(2√u). "+reduced.hint)]};}
 if(id==="sin")t={expression:`sin${u}`,domain:"sur ℝ",final:`${a}*cos${u}`,steps:[...chain(),derivative(`cos${u}`,"La dérivée de sin est cos.",`f'(x) = ${a}*`,""),input(String(a),"f'(x) = ",`*cos${u}`,"Multiplie par u'.")]};
 if(id==="cos")t={expression:`cos${u}`,domain:"sur ℝ",final:`-${a}*sin${u}`,steps:[...chain(),derivative(`-sin${u}`,"La dérivée de cos est −sin.",`f'(x) = ${a}*`,""),input(String(-a),"f'(x) = ",`*sin${u}`,"Pense au signe moins.")]};
 if(id==="exp-square"){const q=`(${a}*x^2+${b})`;t={expression:`e^${q}`,domain:"sur ℝ",final:`${2*a}*x*e^${q}`,steps:[exponentialRule(),derivative(`${2*a}*x`,"La dérivée de ax²+b est 2ax.","u'(x) = ",""),input(String(2*a),"f'(x) = ",`*x*e^${q}`,"Multiplie le coefficient par 2.")]};}
 if(id==="product-exp"){const u=poly([b,a]),v="e^x",z=poly([a+b,a]);t={expression:`(${u})*${v}`,domain:"sur ℝ",final:`(${z})*e^x`,pair:{operation:"product",u,v,du:String(a),dv:"e^x"},steps:[identifyPair("product"),step("input","Applique la règle du produit.",`${a}*e^x+(${u})*e^x`,"f'(x) = ","","Remplace chaque élément dans u′v + uv′."),input(z,"f'(x) = (",")*e^x",`Factorise par eˣ, puis réduis ${a}+(${u}).`)]};}
 if(id==="synthesis"){const u=`x^${n}`,v="ln(x)",final=`x^${n-1}*(${n}*ln(x)+1)`;t={expression:`${u}*${v}`,domain:"pour x > 0",final,pair:{operation:"product",u,v,du:`${n}*x^${n-1}`,dv:"1/x"},steps:[identifyPair("product"),step("input","Applique la règle du produit.",`${n}*x^${n-1}*ln(x)+x^${n}*(1/x)`,"f'(x) = ","","Remplace u, v et leurs dérivées dans u′v + uv′."),input(final,"f'(x) = ","","Réduis puis factorise par x^(n−1).") ]};}
 if(t.pair)t.steps[1]=step("assemble","Applique la règle par glisser-déposer.","assemble","","","Place u′ puis v dans le premier terme, u puis v′ dans le second. Pour un quotient, ajoute v au dénominateur, au carré.",[],"f'(x) = "+substitutedRule(t.pair));
 return {...t,id};
}


function DeriveLab() {
  const [progress,setProgress]=React.useState<Progress>(readProgress);
  const [exercise,setExercise]=React.useState<Exercise>(()=>makeTask("coeff",true));
  const [index,setIndex]=React.useState(0);
  const [done,setDone]=React.useState(false);
  const [answer,setAnswer]=React.useState("");
  const [pairActive,setPairActive]=React.useState<PairRole|null>(null);
  const [pairDrafts,setPairDrafts]=React.useState<Record<PairRole,string>>({u:"",v:""});
  const [pairValidated,setPairValidated]=React.useState<Record<PairRole,boolean>>({u:false,v:false});
  const [picked,setPicked]=React.useState<FactorRole|null>(null);
  const [identified,setIdentified]=React.useState<Record<FactorRole,boolean>>({k:false,u:false,v:false});
  const [dragPreview,setDragPreview]=React.useState<{role:FactorRole;x:number;y:number}|null>(null);
  const [overFactor,setOverFactor]=React.useState<FactorRole|null>(null);
  const [hadError,setHadError]=React.useState(false);
  const [usedHelp,setUsedHelp]=React.useState(false);
  const [hint,setHint]=React.useState(false);
  const [feedback,setFeedback]=React.useState<{good:boolean;text:string}|null>(null);
  const [view,setView]=React.useState("atelier");
  const [level,setLevel]=React.useState(1);
  const [detail,setDetail]=React.useState<Skill|null>(null);
  const [exploring,setExploring]=React.useState(false);
  const [extraKeys,setExtraKeys]=React.useState(false);
  const [storageOk,setStorageOk]=React.useState(true);
  const [light,setLight]=React.useState(false);
  const [installPrompt,setInstallPrompt]=React.useState<InstallPromptEvent|null>(null);
  const [installNotice,setInstallNotice]=React.useState("");
  const [installBusy,setInstallBusy]=React.useState(false);
  const [installed,setInstalled]=React.useState(()=>window.matchMedia("(display-mode: standalone)").matches||!!(navigator as any).standalone);
  const [resetting,setResetting]=React.useState(false);
  const [earned,setEarned]=React.useState(0);
  const [newUnlocks,setNewUnlocks]=React.useState<string[]>([]);
  const inputRef=React.useRef<HTMLInputElement>(null);
  const completionRef=React.useRef<HTMLDivElement>(null);
  const accepted=React.useRef(-1);
  const detailRef=React.useRef<HTMLElement>(null);
  const returnFocus=React.useRef<HTMLElement|null>(null);
  const factorDrag=React.useRef<FactorDrag|null>(null);
  const suppressFactorClick=React.useRef(false);
  const factorSlotsRef=React.useRef<HTMLDivElement>(null);

  const skill=SKILLS.find(s=>s.id===exercise.id)!;
  const current=exercise.steps[index];
  const quotient=exercise.pair?.operation==="quotient";
  const stat=progress.stats[skill.id]||{solved:0,clean:0,history:[]};
  const available=(s:Skill,p=progress)=>s.deps.every(id=>(p.stats[id]?.clean||0)>=3);
  const mastered=(s:Skill)=>{
    const q=progress.stats[s.id];
    return !!q&&q.solved>=10&&q.clean/q.solved>=.8;
  };
  const unlockedCount=SKILLS.filter(s=>available(s)).length;
  const masteryCount=SKILLS.filter(mastered).length;
  const totalSolved=Object.values(progress.stats).reduce((n,s)=>n+s.solved,0);

  React.useEffect(()=>{
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(progress));setStorageOk(true);}
    catch{setStorageOk(false);}
  },[progress]);

  React.useEffect(()=>{
    if(!done&&(current?.kind==="input"||(current?.kind==="pair"&&pairActive))){
      inputRef.current?.focus({preventScroll:true});
      if(current.kind==="input")(quotient?completionRef.current?.closest(".steps"):completionRef.current)?.scrollIntoView({block:"start",behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});
      else inputRef.current?.closest(".uv-row")?.scrollIntoView({block:"nearest"});
    }
  },[index,done,exercise,pairActive]);

  React.useEffect(()=>{
    if(!detail)return;
    returnFocus.current=document.activeElement as HTMLElement;
    const focusables=()=>Array.from(detailRef.current?.querySelectorAll<HTMLElement>("button,[href],input,[tabindex='0']")||[]);
    focusables()[0]?.focus();
    const key=(e:KeyboardEvent)=>{
      if(e.key==="Escape"){e.preventDefault();setDetail(null);}
      if(e.key==="Tab"){
        const elements=focusables(),first=elements[0],last=elements[elements.length-1];
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
      }
    };
    window.addEventListener("keydown",key);
    return()=>{window.removeEventListener("keydown",key);returnFocus.current?.focus();};
  },[detail]);

  React.useEffect(()=>{
    const before=(e:Event)=>{e.preventDefault();setInstallPrompt(e as InstallPromptEvent);};
    const complete=()=>{setInstalled(true);setInstallPrompt(null);setInstallNotice("Dérive Lab est installé sur cet appareil.");};
    window.addEventListener("beforeinstallprompt",before);
    window.addEventListener("appinstalled",complete);
    return()=>{window.removeEventListener("beforeinstallprompt",before);window.removeEventListener("appinstalled",complete);};
  },[]);

  async function installApp(){
    if(!installPrompt){
      setInstallNotice(/iPhone|iPad|iPod/.test(navigator.userAgent)
        ?"Ouvre ce lien dans Safari, puis Partager → Sur l’écran d’accueil."
        :"Si l’application est ouverte depuis ChatGPT, choisis d’abord Ouvrir dans Chrome. Dans Chrome, utilise le menu ⋮ → Installer l’application ou Ajouter à l’écran d’accueil. Une première connexion est nécessaire.");
      return;
    }
    setInstallBusy(true);
    try{
      await installPrompt.prompt();
      const choice=await installPrompt.userChoice;
      setInstallNotice(choice.outcome==="accepted"?"Installation demandée. Ton navigateur termine la création de l’application.":"Tu pourras installer l’application plus tard depuis le menu de ton navigateur.");
      setInstallPrompt(null);
    }catch{setInstallNotice("Ouvre ce lien directement dans Chrome, puis réessaie depuis son menu Installer l’application.");}
    finally{setInstallBusy(false);}
  }

  function start(id:string,sandbox=false){
    const next=SKILLS.find(s=>s.id===id)!;
    setExercise(makeTask(id));setIndex(0);setDone(false);setAnswer("");setPicked(null);
    setIdentified({k:false,u:false,v:false});setPairActive(null);setPairDrafts({u:"",v:""});setPairValidated({u:false,v:false});cancelFactorDrag();
    setHadError(false);setUsedHelp(false);setHint(false);setFeedback(null);
    setEarned(0);setNewUnlocks([]);
    setExploring(sandbox);setView("atelier");setDetail(null);setLevel(next.level);
    accepted.current=-1;
  }

  function chooseSkill(s:Skill){
    if(available(s))start(s.id);else setDetail(s);
  }

  function attempt(value:string,reveal=false){
    if(done||!current||accepted.current===index)return;
    if(current.form==="expanded"&&(!/x/i.test(value)||/[()]/.test(value))){
      setHadError(true);setFeedback({good:false,text:"Développe d’abord les deux produits, sans parenthèses, en gardant les termes en x. Tu réduiras à l’étape suivante."});return;
    }
    if(current.form==="number"&&!/^[+−-]?\d+(?:[.,]\d+)?$/.test(value.trim())){
      setHadError(true);setFeedback({good:false,text:"Réduis maintenant les termes en x, puis saisis uniquement le nombre obtenu au numérateur."});return;
    }
    const correct=current.kind==="input"?equivalent(value,current.expected):value===current.expected;
    if(!correct){
      setHadError(true);
      setFeedback({good:false,text:"Pas encore. "+current.hint});return;
    }
    accepted.current=index;
    const dirty=hadError||usedHelp||reveal;
    if(reveal)setUsedHelp(true);
    setAnswer("");setHint(false);setPicked(null);cancelFactorDrag();
    if(index+1<exercise.steps.length){
      setIndex(index+1);
      setFeedback({good:true,text:reveal?"Étape montrée. À toi pour la suite.":"C’est juste. Continue !"});
      return;
    }
    setDone(true);setFeedback(null);
    if(exploring||!available(skill))return;
    const reward=dirty?10:30;
    const old=progress.stats[skill.id]||{solved:0,clean:0,history:[]};
    const next:Progress={
      ...progress,xp:progress.xp+reward,
      stats:{...progress.stats,[skill.id]:{
        solved:old.solved+1,clean:old.clean+(dirty?0:1),
        history:[...old.history,!dirty].slice(-20)
      }}
    };
    setNewUnlocks(SKILLS.filter(s=>!available(s,progress)&&available(s,next)).map(s=>s.title));
    setProgress(next);setEarned(reward);
  }

  function activatePair(role:PairRole){
    if(current.kind!=="pair"||!identified[role]||pairValidated[role]||pairActive===role)return;
    if(pairActive)setPairDrafts(d=>({...d,[pairActive]:answer}));
    setPairActive(role);setAnswer(pairDrafts[role]);setFeedback(null);
  }

  function validateAnswer(){
    if(current.kind!=="pair"){attempt(answer);return;}
    if(!pairActive||!exercise.pair||!answer.trim())return;
    const expected=pairActive==="u"?exercise.pair.du:exercise.pair.dv;
    if(!equivalent(answer,expected)){
      setHadError(true);setFeedback({good:false,text:"Pas encore. Dérive uniquement "+pairActive+"(x), sans appliquer la règle du "+(exercise.pair.operation==="quotient"?"quotient":"produit")+" pour le moment."});return;
    }
    const next={...pairValidated,[pairActive]:true},other:PairRole=pairActive==="u"?"v":"u";
    setPairValidated(next);setPairDrafts(d=>({...d,[pairActive]:answer}));
    const nextActive=identified[other]&&!next[other]?other:null;
    setPairActive(nextActive);setAnswer(nextActive?pairDrafts[nextActive]:"");
    setFeedback({good:true,text:next.u&&next.v?"Les deux dérivées sont validées. Applique maintenant la règle.":"Dérivée validée. Complète l’autre ligne."});
  }

  function factorValue(role:FactorRole){
    return role==="k"?exercise.coefficient!:(exercise.pair?exercise.pair[role]:exercise.base!);
  }

  function pairTable(readonly=false){
    const pair=exercise.pair!;
    return <div className="uv-workshop" ref={readonly?undefined:factorSlotsRef}>
      <div className="uv-rule"><span>Règle du {pair.operation==="quotient"?"quotient":"produit"}</span><MathText text={pair.operation==="quotient"?"(u/v)' = (u'v-uv')/v^2":"(uv)' = u'v+uv'"}/></div>
      {(["u","v"] as PairRole[]).map(role=>{
        const validated=readonly||pairValidated[role],active=!readonly&&pairActive===role,value=active?answer:pairDrafts[role];
        return <div className="uv-row" key={role}>
          <div className="uv-function"><MathText text={role+"(x) = "}/>{readonly?<div className="uv-fixed"><MathText text={pair[role]} compact/></div>:factorSlot(role)}</div>
          <div className={"uv-derivative"+(active?" active":"")}>
            <MathText text={role+"'(x) = "}/>
            {validated?<div className="uv-fixed"><MathText text={role==="u"?pair.du:pair.dv} compact/><span className="tick">✓</span></div>:<span className={"answer-shell"+(value?" typeset":"")}>
              <input className="answer" ref={active?inputRef:undefined} value={value.replace(/\*/g,"×").replace(/-/g,"−")}
                aria-label={"Dérivée de "+role+" à compléter"} aria-describedby="factor-instruction" disabled={!identified[role]}
                readOnly inputMode="none" autoComplete="off" spellCheck={false}
                onFocus={()=>activatePair(role)} onClick={()=>activatePair(role)} onKeyDown={handleAnswerKey}
                onPaste={e=>{e.preventDefault();insert(e.clipboardData.getData("text"));}}/>
              {value&&<span className="answer-render" aria-hidden="true"><MathText text={value} compact/></span>}
            </span>}
          </div>
        </div>;
      })}
    </div>;
  }

  function cancelFactorDrag(){
    factorDrag.current=null;setDragPreview(null);setOverFactor(null);
  }

  function factorAt(x:number,y:number):FactorRole|null{
    const target=document.elementFromPoint(x,y)?.closest<HTMLElement>("[data-factor-slot]");
    return target&&factorSlotsRef.current?.contains(target)?target.dataset.factorSlot as FactorRole:null;
  }

  function placeFactor(role:FactorRole,destination:FactorRole){
    if(identified[destination]||done||!["move","pair"].includes(current.kind))return;
    if(role!==destination){
      setHadError(true);
      setFeedback({good:false,text:exercise.pair?(exercise.pair.operation==="quotient"?"Pour ce quotient, u est le numérateur et v le dénominateur.":"Dans cet atelier, place le premier facteur dans u et le second dans v."):destination==="k"?"k est un nombre constant. Cherche le facteur qui ne dépend pas de x.":"u(x) est la fonction qui dépend de x. Déplace le facteur contenant x."});
      return;
    }
    const next={...identified,[destination]:true};
    setIdentified(next);setPicked(null);
    if(current.kind==="pair"){
      if(!pairActive&&!pairValidated[destination as PairRole]){setPairActive(destination as PairRole);setAnswer(pairDrafts[destination as PairRole]);}
      setFeedback({good:true,text:"Fonction identifiée. Complète sa dérivée en face."});return;
    }
    setFeedback({good:true,text:next.k&&next.u?"Les deux éléments sont identifiés. Tu peux maintenant appliquer la règle.":"Bien placé ! Identifie maintenant l’autre élément."});
  }

  function factorToken(role:FactorRole){
    const placed=identified[role],value=factorValue(role);
    return <button key={role} className={"factor-token "+(role==="k"?"coef":"base")+(picked===role?" selected":"")+(placed?" identified":"")}
      disabled={placed} aria-label={placed?(role==="k"?"Coefficient identifié : k":"Fonction identifiée : "+role+"(x)"):(role==="k"?"Sélectionner le coefficient "+value:exercise.pair?"Sélectionner le "+(role==="u"?"premier":"second")+" élément "+value:"Sélectionner la fonction de référence "+value)}
      aria-pressed={picked===role} aria-describedby="factor-instruction" data-factor-source={role}
      onDragStart={e=>e.preventDefault()}
      onPointerDown={e=>{
        if(!e.isPrimary||e.button!==0)return;
        suppressFactorClick.current=false;setPicked(role);setFeedback(null);
        factorDrag.current={role,pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,moved:false};
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={e=>{
        const drag=factorDrag.current;
        if(!drag||drag.pointerId!==e.pointerId)return;
        if(Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>6)drag.moved=true;
        if(drag.moved){setDragPreview({role,x:e.clientX,y:e.clientY});setOverFactor(factorAt(e.clientX,e.clientY));}
      }}
      onPointerUp={e=>{
        const drag=factorDrag.current;
        if(!drag||drag.pointerId!==e.pointerId)return;
        const destination=drag.moved?factorAt(e.clientX,e.clientY):null;
        suppressFactorClick.current=drag.moved;
        cancelFactorDrag();
        if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
        if(destination)placeFactor(drag.role,destination);
      }}
      onPointerCancel={cancelFactorDrag} onLostPointerCapture={cancelFactorDrag}
      onClick={()=>{
        if(suppressFactorClick.current){suppressFactorClick.current=false;return;}
        setPicked(role);setFeedback(null);
      }}>
      <MathText text={placed?(role==="k"?"k":role+"(x)"):value} compact/>
    </button>;
  }

  function factorSlot(role:FactorRole){
    const placed=identified[role],label=role==="k"?"k":role+"(x)";
    return <div className={"factor-destination"+(placed?" filled":"")} key={role}>
      <button data-factor-slot={role} disabled={placed}
        className={"factor-slot"+(picked&&!placed?" ready":"")+(overFactor===role?" over":"")+(placed?" filled":"")}
        aria-label={"Déposer "+(role==="k"?"le coefficient sur k":"la fonction sur "+role+"(x)")}
        onClick={()=>{
          if(picked)placeFactor(picked,role);
          else setFeedback({good:true,text:"Sélectionne d’abord une boîte dans la fonction, puis dépose-la ici."});
        }}>
        {!placed&&exercise.pair?<span className="uv-placeholder">Glisser ici</span>:<MathText text={placed?factorValue(role):label} compact/>}
        <span className="factor-slot-hint">{placed?"✓ Identifié":"Déposer ici"}</span>
      </button>
      <div className="factor-equality" aria-live="polite">{placed?<><MathText text={label+" = "+factorValue(role)}/></>:role==="k"?"Nombre constant":"Fonction de x"}</div>
    </div>;
  }

  React.useEffect(()=>{
    const cancel=(e:KeyboardEvent)=>{if(e.key==="Escape"){cancelFactorDrag();setPicked(null);}};
    window.addEventListener("keydown",cancel);
    return()=>window.removeEventListener("keydown",cancel);
  },[]);

  React.useEffect(()=>{cancelFactorDrag();setPicked(null);},[view]);

  function insert(text:string,inside=false){
    if(!keyboardActive)return;
    const el=inputRef.current;
    const from=el?.selectionStart??answer.length,to=el?.selectionEnd??from;
    text=text.slice(0,Math.max(0,180-answer.length+(to-from)));
    setFeedback(null);
    setAnswer(answer.slice(0,from)+text+answer.slice(to));
    const caret=from+text.length-(inside?1:0);
    setTimeout(()=>{el?.focus({preventScroll:true});el?.setSelectionRange(caret,caret);},0);
  }

  function erase(){
    if(!keyboardActive)return;
    const el=inputRef.current;
    const from=el?.selectionStart??answer.length,to=el?.selectionEnd??from;
    const begin=from===to?Math.max(0,from-1):from;
    setAnswer(answer.slice(0,begin)+answer.slice(to));
    setTimeout(()=>{el?.focus({preventScroll:true});el?.setSelectionRange(begin,begin);},0);
  }

  function handleAnswerKey(e:React.KeyboardEvent<HTMLInputElement>){
    if(e.ctrlKey||e.metaKey||e.altKey)return;
    if(e.key==="Enter"){e.preventDefault();if(answer.trim())validateAnswer();return;}
    if(e.key==="Backspace"){e.preventDefault();erase();return;}
    if(e.key==="Delete"){
      e.preventDefault();const el=inputRef.current;
      const from=el?.selectionStart??answer.length,to=el?.selectionEnd??from;
      setAnswer(answer.slice(0,from)+answer.slice(from===to?to+1:to));
      setTimeout(()=>el?.setSelectionRange(from,from),0);return;
    }
    if(/^[0-9a-z()+\-*/^.,×−·]$/i.test(e.key)){e.preventDefault();insert(e.key.toLowerCase());}
  }

  function showHint(){setHint(true);setUsedHelp(true);}
  const keyMap:Record<string,[string,boolean?]>={
    "×":["*"],"÷":["/"],"−":["-"],"x²":["x^2"],"xⁿ":["x^()",true],
    "√":["sqrt()",true],"eˣ":["e^()",true],"ln":["ln()",true],
    "sin":["sin()",true],"cos":["cos()",true],"1/x":["1/()",true]
  };
  const keyboardActive=!done&&(current?.kind==="input"||(current?.kind==="pair"&&!!pairActive&&!pairValidated[pairActive]));
  const rate=stat.solved?Math.round(100*stat.clean/stat.solved):0;

  return <div className={"derive"+(light?" light":"")}>
    {dragPreview&&<div className={"factor-ghost "+(dragPreview.role==="k"?"coefficient":"reference")} aria-hidden="true"
      style={{left:Math.max(58,Math.min(window.innerWidth-58,dragPreview.x)),top:dragPreview.y}}>
      <MathText text={factorValue(dragPreview.role)}/>
    </div>}
    <header className="top">
      <button className="brand" onClick={()=>setView("atelier")} aria-label="Revenir à l’atelier">
        <span className="brandmark">∂</span>
        <span className="brandname">DÉRIVE<small>LAB · LYCÉE</small></span>
      </button>
      <nav className="nav" aria-label="Navigation principale">
        {[["atelier","L’atelier"],["parcours","Mon parcours"],["memo","Le mémo"]].map(([id,title])=>
          <button key={id} className={view===id?"active":""} onClick={()=>setView(id)}
            aria-current={view===id?"page":undefined}>{title}</button>
        )}
      </nav>
      <div className="header-right">
        <span className="xp">✧ {progress.xp} XP</span>
        {!installed&&<button className="install-button" onClick={installApp} disabled={installBusy} data-install-ready={!!installPrompt} aria-label="Installer l’application">↓ <span>{installBusy?"Installation…":"Installer"}</span></button>}
        <button className="iconbutton" onClick={()=>setLight(!light)}
          aria-label={light?"Activer le thème sombre":"Activer le thème clair"}>{light?"☾":"☼"}</button>
      </div>
    </header>

    <div className="layout">
      <aside className="sidebar">
        <div className="sidehead"><span className="overline">Les compétences</span><span className="smallcount">{unlockedCount} / 24</span></div>
        <div className="switch">
          <button className={level===1?"on":""} onClick={()=>setLevel(1)}>Première</button>
          <button className={level===2?"on":""} onClick={()=>setLevel(2)}>Terminale</button>
        </div>
        <div className="skillnav">
          {SKILLS.filter(s=>s.level===level).map(s=>{
            const q=progress.stats[s.id],unlocked=available(s),master=mastered(s);
            return <button key={s.id} onClick={()=>chooseSkill(s)}
              className={(s.id===skill.id?"selected ":"")+(!unlocked?"locked ":"")+(master?"completed":"")}>
              <span className="skillnum">{master?"✓":!unlocked?"◇":String(SKILLS.indexOf(s)+1).padStart(2,"0")}</span>
              <span><strong>{s.title}</strong><small>{master?"Maîtrisée":!unlocked?"À débloquer":Math.min(q?.clean||0,3)+" / 3 réussites"}</small></span>
            </button>;
          })}
        </div>
        <div className="sidefoot">
          Trois exercices réussis sans erreur ni indice ouvrent la suite.<br/>
          {storageOk?"Progression conservée sur cet appareil.":"Session temporaire : stockage indisponible."}<br/>
          <button onClick={()=>setResetting(!resetting)}>Recommencer la progression</button>
          {resetting&&<div>Effacer les résultats de cet appareil ?
            <div style={{display:"flex",gap:15}}>
              <button onClick={()=>{setProgress({...EMPTY,stats:{}});setResetting(false);start("coeff");}}>Oui, effacer</button>
              <button onClick={()=>setResetting(false)}>Annuler</button>
            </div>
          </div>}
        </div>
      </aside>

      <main className="main">
        {installNotice&&<div className="install-notice" role="status"><span>{installNotice}</span><button onClick={()=>setInstallNotice("")} aria-label="Fermer le message d’installation">×</button></div>}
        {view==="atelier"&&<>
          {exploring&&<div className="explore-banner">
            <span>Exploration libre · Cet exercice ne compte pas dans la progression.</span>
            <button onClick={()=>setView("parcours")}>Voir le parcours</button>
          </div>}
          <div className="intro">
            <div>
              <div className="eyebrow">Atelier {String(SKILLS.indexOf(skill)+1).padStart(2,"0")} · {skill.level===1?"Fondamentaux":"Approfondissement"}</div>
              <h1>{skill.title}</h1>
              <p className="subtitle">{skill.subtitle.includes("/")?<MathText text={skill.subtitle}/>:skill.subtitle}. Une étape après l’autre.</p>
            </div>
            <button className="softbtn" onClick={()=>start(skill.id,exploring)} title="Changer d’exemple"><span>↻</span> Nouvel exemple</button>
          </div>

          <div className="studio">
            <section className={"panel board"+(quotient?" quotient-board":"")+(quotient&&index>0?" quotient-in-progress":"")} aria-label="Zone de dérivation">
              <div className="function-area">
                <div className="function-meta">
                  <span className="overline">Fonction à transformer</span>
                  <span className="domain">Dérivable <MathText text={exercise.domain}/></span>
                </div>
                <div className={"function-line"+(!done&&current.kind==="move"?" identifying":"")}>
                  <div className="function-expression">                <div className="original">
                  <MathText text="f(x) = "/>
                  {!done&&current.kind==="move"?<>
                    {factorToken("k")}{factorToken("u")}
                  </>:!done&&current.kind==="pair"?<span className={"uv-original "+exercise.pair!.operation}>{exercise.pair!.operation==="quotient"?<span className="math-frac"><span className="math-numerator">{factorToken("u")}</span><span className="math-denominator">{factorToken("v")}</span></span>:<><MathText text="("/>{factorToken("u")}<MathText text=")("/>{factorToken("v")}<MathText text=")"/></>}</span>:<MathText text={exercise.expression} compact/>}
                </div>
                <div className="function-note">{!done&&current.kind==="move"?"Déplace les deux boîtes pour reconnaître k et u(x).":current.kind==="pair"&&!done?"Glisse chaque expression dans u(x) ou v(x), puis complète les dérivées en face.":"Construis la dérivée sur les lignes ci-dessous."}</div></div>
                  {!done&&current.kind==="move"&&<div className="factor-identification">
                    <div className="overline">Reconnaître la forme</div>
                    <div className="factor-form" ref={factorSlotsRef} aria-label="Forme k fois u(x)">
                      {factorSlot("k")}<span className="factor-times">×</span>{factorSlot("u")}
                    </div>

                  </div>}
                </div>
                {!done&&current.kind==="move"&&<div className="apply-under">                    <button className="primary apply-factor-rule" disabled={!identified.k||!identified.u} onClick={()=>attempt(current.expected)}>
                      Appliquer la règle <MathText text="(k*u)' = k*u'"/><span>→</span>
                    </button></div>}
              </div>

              <div className="steps">
                <div className="stepper" aria-label={"Étape "+(done?exercise.steps.length:index+1)+" sur "+exercise.steps.length}>
                  {exercise.steps.map((_,i)=><span key={i} className={"stepdot "+(done||i<index?"past":i===index?"current":"")}/>)}
                  <span className="stepnumber">{done?exercise.steps.length:index+1} / {exercise.steps.length}</span>
                </div>
                {quotient&&<div className="quotient-phases" aria-label="Parcours du quotient">{["Identifier","Construire","Développer","Réduire"].map((label,i)=><span key={label} className={done||i<index?"past":i===index?"current":""}>{label}{(done||i<index)&&" ✓"}</span>)}</div>}
                {quotient&&index>1&&<>
                  <details className="quotient-recap"><summary>Voir u, v et les étapes validées</summary>
                    <div className="quotient-reference">{(["u","du","v","dv"] as const).map(role=><span key={role}><MathText text={({u:"u",du:"u'",v:"v",dv:"v'"})[role]+" = "+exercise.pair![role]} compact/></span>)}</div>
                    {exercise.steps.slice(1,index-1).map((step,i)=><div className="pastline" key={i}><MathText text={step.solved} compact/></div>)}
                  </details>
                  <div className="quotient-previous" aria-label="Calcul précédent"><MathText text={exercise.steps[index-1].solved} compact/></div>
                </>}
                {!quotient&&exercise.steps.slice(0,done?exercise.steps.length:index).map((s,i)=>
                  <React.Fragment key={i}>
                    {s.kind==="move"&&<div className="pastline identification-summary"><span className="tick">✓</span><MathText text={"k = "+exercise.coefficient+" ; u(x) = "+exercise.base}/></div>}
                    {s.kind==="pair"&&current.kind!=="assemble"&&pairTable(true)}
                    {s.kind!=="pair"&&<div className="pastline"><span className="tick">✓</span><MathText text={s.solved} compact={i===exercise.steps.length-1}/></div>}
                  </React.Fragment>
                )}

                {!done?<>
                  <div className="step-title"><span className="number">{index+1}</span>{quotient&&current.kind==="assemble"?"Construis la formule.":current.prompt}</div>
                  <p className="instruction" id="factor-instruction">
                    {current.kind==="move"&&"Glisse chaque boîte de la fonction sur k ou u(x). Tu peux aussi sélectionner une boîte, puis toucher sa destination."}
                    {current.kind==="pair"&&(exercise.pair!.operation==="quotient"?"Place le numérateur dans u et le dénominateur dans v. Saisis ensuite leurs dérivées dans les cases en face.":"Place le premier facteur dans u et le second dans v. Saisis leurs dérivées dans les cases en face.")}
                    {current.kind==="assemble"&&(quotient?"Remplace chaque lettre par sa carte. Le carré reste autour du dénominateur.":"Utilise les quatre boîtes validées pour remplacer les lettres de la formule. Le clavier servira ensuite à développer et simplifier.")}
                    {current.kind==="formula"&&"Calcule u′, puis multiplie par l’exponentielle de u."}
                    {current.kind==="rule"&&"Observe la structure de la fonction avant de commencer les calculs."}
                    {current.kind==="input"&&(quotient?(current.form==="expanded"?"Écris le numérateur développé. Conserve les termes en x pour la prochaine étape.":"Regroupe les termes en x, puis les constantes. Complète le numérateur."):"Complète uniquement la case avec le clavier, puis valide.")}
                  </p>



                  {current.kind==="pair"&&<>
                    {pairTable()}
                  </>}
                  {current.kind==="assemble"&&<RuleAssembly pair={exercise.pair!} onComplete={()=>attempt(current.expected)} onError={()=>{setHadError(true);setFeedback(null);}}/>}
                  {current.kind==="formula"&&<div className="specific-rule"><MathText text={current.solved}/><button className="primary" onClick={()=>attempt(current.expected)}>Utiliser cette règle <span>→</span></button></div>}
                  {current.kind==="rule"&&<div className="rules">
                    {current.choices.map(choice=><button key={choice} className="rule-choice" onClick={()=>attempt(choice)}><MathText text={choice}/></button>)}
                  </div>}

                  {current.kind==="pair"&&<div className="apply-under"><button className="primary apply-pair-rule" disabled={!identified.u||!identified.v||!pairValidated.u||!pairValidated.v} onClick={()=>attempt(current.expected)}>Appliquer la règle du {exercise.pair!.operation==="quotient"?"quotient":"produit"}<span>→</span></button></div>}

                  {(current.kind==="input"||(current.kind==="pair"&&!!pairActive))&&<div className="math-completion" ref={completionRef}>
                    {current.kind==="input"&&<div className="working">
                      <MathText text={current.prefix+"□"+current.suffix} compact={quotient||index===exercise.steps.length-1} slot={
                        <span className={"answer-shell"+(answer?" typeset":"")}>
                          <input className="answer" ref={inputRef} value={answer.replace(/\*/g,"×").replace(/-/g,"−")}
                            style={{width:Math.min(400,Math.max(82,answer.length*15+28))}}
                            aria-label="Réponse à compléter" aria-describedby="math-input-help" placeholder=""
                            readOnly inputMode="none" autoComplete="off" autoCapitalize="off" spellCheck={false}
                            onPaste={e=>{e.preventDefault();insert(e.clipboardData.getData("text"));}}
                            onKeyDown={handleAnswerKey}/>
                          {answer&&<span className="answer-render" aria-hidden="true"><MathText text={answer} compact={quotient||index===exercise.steps.length-1}/></span>}
                        </span>
                      }/>
                    </div>}
                    <p className="input-help" id="math-input-help">Utilise le clavier maths juste en dessous. Touche la case pour placer le curseur.</p>
                    {answer&&!quotient&&<div className="input-reading">Lecture : <MathText text={current.kind==="pair"?pairActive+"'(x) = "+answer:current.prefix+answer+current.suffix} compact={quotient||index===exercise.steps.length-1}/></div>}
                    {feedback&&<div role="status" className={"feedback"+(feedback.good?" good":"")}>{feedback.text.includes("/")?<MathText text={feedback.text}/>:feedback.text.replace(/[·*]/g," × ")}</div>}
                    {hint&&<div className="hintbox"><MathText text={current.hint}/></div>}
                    <section className="keyboard inline-keyboard" aria-label="Clavier mathématique">
                <div className="tooltitle">Clavier mathématique <span className="tag">Sous ta réponse</span></div>
                <p className="toolsub">Compose ta réponse avec les touches ci-dessous.</p>
                <div className="keys">
                  {["7","8","9","+","−","4","5","6","×","÷","1","2","3","(",")","0",".","x","x²","xⁿ"].map(key=>
                    <button key={key} disabled={!keyboardActive}
                      className={"key "+(key.includes("x")?"variable":["+","−","×","÷"].includes(key)?"operator":"")}
                      onPointerDown={e=>e.preventDefault()}
                      onClick={()=>{const entry:[string,boolean?]=keyMap[key]||[key,false];insert(entry[0],entry[1]);}}><MathText text={({"x²":"x^2","xⁿ":"x^n","eˣ":"e^x"} as Record<string,string>)[key]||key}/></button>
                  )}
                </div>
                <div className="keytools">
                  <button className="key" disabled={!keyboardActive} onPointerDown={e=>e.preventDefault()} onClick={erase} aria-label="Effacer le caractère précédent">⌫ Effacer</button>
                  <button className="key" disabled={!keyboardActive} onClick={()=>{setAnswer("");inputRef.current?.focus({preventScroll:true});}}>Vider la case</button>
                </div>
                <button className="morekeys" aria-expanded={extraKeys} onClick={()=>setExtraKeys(!extraKeys)}>{extraKeys?"−":"+"} Fonctions & fractions</button>
                {extraKeys&&<div className="extra">
                  {["1/x","√","eˣ","ln","sin","cos"].map(key=>
                    <button className="key" key={key} disabled={!keyboardActive} onPointerDown={e=>e.preventDefault()}
                      onClick={()=>{const [text,inside]=keyMap[key];insert(text,inside);}}><MathText text={({"x²":"x^2","xⁿ":"x^n","eˣ":"e^x"} as Record<string,string>)[key]||key}/></button>
                  )}
                </div>}
                <button className="primary validate-key" disabled={!keyboardActive||!answer.trim()} onClick={validateAnswer}>{current.kind==="pair"?"Valider "+pairActive+"′(x)":quotient?"Valider le numérateur":"Valider la réponse"} <span>↗</span></button>
                <div className="keyboard-note">Sur ordinateur, le clavier physique fonctionne aussi.</div>
              </section>
                  </div>}

                  {feedback&&current.kind!=="input"&&current.kind!=="assemble"&&!(current.kind==="pair"&&pairActive)&&<div role="status" className={"feedback"+(feedback.good?" good":"")}>{feedback.text.includes("/")?<MathText text={feedback.text}/>:feedback.text.replace(/[·*]/g," × ")}</div>}
                  {hint&&current.kind!=="input"&&!(current.kind==="pair"&&pairActive)&&<div className="hintbox"><MathText text={current.hint}/></div>}
                  <div className="actions">
                    <button className="textbtn" onClick={showHint}>✧ Un indice</button>
                    {hint&&<button className="textbtn" onClick={()=>attempt(current.expected,true)}>Montrer cette étape →</button>}
                  </div>
                </>:<div className="success" role="status">
                  <span className="earned">{exploring?"EXPLORATION":"+ "+earned+" XP"}</span>
                  <h2>Dérivée reconstruite.</h2>
                  <div className="result"><MathText text={"f'(x) = "+exercise.final} compact/></div>
                  <p>{exploring?"Tu peux essayer cet atelier librement. Les déblocages se gagnent dans le parcours.":
                    !hadError&&!usedHelp?"Sans erreur et sans indice. Une réussite de plus vers la suite du parcours.":
                    "Les étapes sont maintenant en place. Essaie la prochaine fonction sans aide."}</p>
                  <div style={{display:"flex",gap:13,flexWrap:"wrap"}}>
                    <button className="primary" onClick={()=>start(skill.id,exploring)}>Fonction suivante <span>→</span></button>
                    <button className="textbtn" onClick={()=>setView("parcours")}>Mon parcours</button>
                  </div>
                  {newUnlocks.length>0&&<div className="unlock-message">✧ Nouveaux ateliers débloqués : {newUnlocks.join(", ")}.</div>}
                </div>}
              </div>
            </section>

            <aside className="right" aria-label="Outils et progression">
              <div className="panel skill-progress">
                <div className="tooltitle">Cette compétence <span className="tag">{mastered(skill)?"Maîtrisée ✓":"En construction"}</span></div>
                <div className="progress-big"><strong>{Math.min(3,stat.clean)}</strong><span>/ 3 pour ouvrir la suite</span></div>
                <div className="segments">{[0,1,2].map(i=><i key={i} className={stat.clean>i?"ok":""}/>)}</div>
                <div className="smalltext">Réussites sans erreur ni indice.<br/>
                  {stat.solved>0?stat.solved+" exercice"+(stat.solved>1?"s":"")+" terminé"+(stat.solved>1?"s":"")+" · "+rate+" % sans aide":
                    "Ton historique commencera à la première fonction terminée."}
                </div>
                {stat.history.length>0&&<div className="history" aria-label="Historique des 20 derniers exercices">
                  {stat.history.map((ok,i)=><span key={i} className={ok?"":"miss"} title={ok?"Réussi sans erreur ni indice":"Terminé avec erreur ou aide"}/>)}
                </div>}
                <p className="smalltext" style={{marginBottom:0}}>Maîtrise : au moins 10 exercices terminés et 80 % de réussites sans erreur ni indice.</p>
              </div>
              <div className="tipcard"><strong>Comprendre avant d’accélérer.</strong><p>Aucun chronomètre. Les points récompensent les fonctions terminées, et les indices restent toujours disponibles.</p></div>
            </aside>
          </div>
        </>}

        {view==="parcours"&&<>
          <div className="eyebrow">24 compétences · Deux niveaux</div>
          <h1>Chaque règle ouvre une porte.</h1>
          <p className="subtitle">Choisis un atelier disponible, ou explore une compétence pour découvrir la suite.</p>
          <div className="overview">
            <div><strong>{unlockedCount}<span> / 24</span></strong><span>ateliers accessibles</span></div>
            <div><strong>{masteryCount}</strong><span>compétences maîtrisées</span></div>
            <div><strong>{totalSolved}</strong><span>fonctions terminées</span></div>
          </div>
          <div className="switch" style={{maxWidth:360,marginBottom:23}}>
            <button className={level===1?"on":""} onClick={()=>setLevel(1)}>Première · Fondamentaux</button>
            <button className={level===2?"on":""} onClick={()=>setLevel(2)}>Terminale · Suite</button>
          </div>
          <div className="pathgrid">
            {SKILLS.filter(s=>s.level===level).map(s=>{
              const q=progress.stats[s.id],unlocked=available(s),master=mastered(s);
              return <button className={"pathcard"+(unlocked?"":" locked")} key={s.id} onClick={()=>chooseSkill(s)}>
                <div className="cardtop"><span>ATELIER {String(SKILLS.indexOf(s)+1).padStart(2,"0")}</span><span>{master?"✓":unlocked?"↗":"◇"}</span></div>
                <h3>{s.title}</h3><p>{s.subtitle.includes("/")?<MathText text={s.subtitle}/>:s.subtitle}</p>
                <span className="pathstatus">{master?"Maîtrisée":unlocked?Math.min(q?.clean||0,3)+" / 3 réussites sans aide · Jouer →":"Voir les prérequis ou explorer →"}</span>
              </button>;
            })}
          </div>
          <p className="footnote">Les niveaux organisent ce parcours de jeu. L’exponentielle et certaines règles peuvent être abordées plus tôt selon la progression de la classe.
            Une compétence ouvre la suite après 3 réussites sans erreur ni indice ; la maîtrise demande au moins 10 exercices et 80 % de réussite sans aide.</p>
        </>}

        {view==="memo"&&<>
          <div className="eyebrow">La boîte à outils</div>
          <h1>Les règles, à portée de main.</h1>
          <p className="subtitle">k et c désignent des constantes ; u et v des fonctions de x.</p>
          <div className="memogrid">
            {MEMO.map(([title,formula])=><div className="memocard" key={title}><small>{title}</small><MathText text={formula}/></div>)}
          </div>
          <p className="footnote">Ces formules s’utilisent là où les fonctions concernées sont dérivables.
            Pour un quotient, le dénominateur doit être non nul ; pour ln u, il faut u &gt; 0 ; pour la formule de dérivation de √u, on travaille avec u &gt; 0.
            La formule des puissances est utilisée ici avec des exposants entiers positifs.</p>
          <button className="primary" style={{marginTop:22}} onClick={()=>setView("atelier")}>Retour à mon exercice <span>→</span></button>
        </>}
        <p className="footnote">{storageOk?"Progression enregistrée dans ce navigateur. Elle n’est pas synchronisée entre les appareils.":"Le stockage est indisponible : tes résultats restent disponibles pendant cette session."}</p>
      </main>
    </div>

    {detail&&<div className="overlay" onClick={()=>setDetail(null)}>
      <section className="dialog" ref={detailRef} role="dialog" aria-modal="true" aria-labelledby="skill-dialog-title" onClick={e=>e.stopPropagation()}>
        <div className="dialoghead"><span className="overline">Compétence à débloquer</span><button className="iconbutton" onClick={()=>setDetail(null)} aria-label="Fermer">×</button></div>
        <h2 id="skill-dialog-title">{detail.title}</h2>
        <p>{detail.subtitle.includes("/")?<MathText text={detail.subtitle}/>:detail.subtitle}. Pour l’ouvrir dans le parcours, réussis trois exercices sans erreur ni indice dans chacun de ces ateliers :</p>
        <div className="dependencies">
          {detail.deps.map(id=>{
            const s=SKILLS.find(q=>q.id===id)!,n=progress.stats[id]?.clean||0;
            return <div className="dependency" key={id}><span>{s.title}</span><span>{n>=3?"✓ Prêt":n+" / 3"}</span></div>;
          })}
        </div>
        <button className="primary" style={{width:"100%"}} onClick={()=>{
          function firstAvailablePrerequisite(s:Skill):Skill|undefined{
            for(const id of s.deps){
              if((progress.stats[id]?.clean||0)>=3)continue;
              const prerequisite=SKILLS.find(q=>q.id===id)!;
              if(available(prerequisite))return prerequisite;
              const deeper=firstAvailablePrerequisite(prerequisite);
              if(deeper)return deeper;
            }
          }
          const next=firstAvailablePrerequisite(detail);
          if(next)start(next.id);
          else{setLevel(detail.level);setView("parcours");setDetail(null);}
        }}>Travailler les prérequis <span>→</span></button>
        <button className="softbtn" style={{width:"100%",marginTop:11}} onClick={()=>start(detail.id,true)}>Explorer cet atelier librement</button>
        <p style={{fontSize:10,marginBottom:0}}>L’exploration permet d’essayer les exercices sans modifier les points ni les déblocages.</p>
      </section>
    </div>}
  </div>;
}

const rootElement=document.getElementById("root");
if(!rootElement)throw new Error("Élément de montage introuvable.");
createRoot(rootElement).render(<DeriveLab/>);


