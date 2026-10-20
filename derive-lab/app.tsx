/// <reference types="react" />
type StepKind = "move" | "orbit" | "input" | "rule";
type Step = { kind: StepKind; prompt: string; expected: string; prefix: string; suffix: string; hint: string; choices: string[]; solved: string };
type Exercise = { id: string; expression: string; domain: string; final: string; coefficient?: string; base?: string; steps: Step[] };
type Skill = { id: string; title: string; subtitle: string; level: number; deps: string[] };
type Result = { solved: number; clean: number; history: boolean[] };
type Progress = { version: number; xp: number; stats: Record<string, Result> };
declare const ReactDOM: { createRoot: (container: Element) => { render: (node: React.ReactNode) => void } };
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
function MathText({text}: {text: string}) {
  function render(s: string): React.ReactNode[] {
    const result: React.ReactNode[] = [];
    let buffer="";
    const flush=()=>{if(buffer){result.push(buffer);buffer="";}};
    for(let i=0;i<s.length;i++){
      if(s[i]!=="^"){buffer+=s[i];continue;}
      flush();let exponent="";
      if(s[i+1]==="("){
        let depth=1,j=i+2;
        for(;j<s.length&&depth;j++){if(s[j]==="(")depth++;if(s[j]===")")depth--;}
        if(depth!==0){buffer+="^";continue;}
        exponent=s.slice(i+2,j-1);i=j-1;
      }else{
        const match=s.slice(i+1).match(/^[+-]?\d+|^[a-z]/);
        if(!match){buffer+="^";continue;}
        exponent=match[0];i+=exponent.length;
      }
      result.push(<sup key={"sup-"+i}>{render(exponent)}</sup>);
    }
    flush();return result;
  }
  const display=text.replace(/sqrt/g,"√").replace(/\*/g," · ").replace(/-/g,"−");
  return <span className="math">{render(display)}</span>;
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
 const orbit=(ans,hint,prefix="f'(x) = ",suffix="",wrong=["0","1","x","x^2","2*x","-1/x^2"])=>step("orbit","Choisis la bonne dérivée.",ans,prefix,suffix,hint,wrong);
 const input=(expected,prefix="f'(x) = ",suffix="",hint="Effectue le calcul, puis simplifie.")=>step("input","À toi de simplifier.",expected,prefix,suffix,hint);
 const rule=(ans,hint)=>step("rule","Quelle règle faut-il utiliser ?",ans,"","",hint,["u'+v'","u'v+uv'","(u'v-uv')/v^2","u'×g'(u)"],"Règle : "+ans);
 const move=(k,base)=>step("move","Conserve le coefficient constant.",String(k),"f'(x) = ",`*(${base})'`,"Pour (ku)' = ku', le nombre k reste en facteur.",[]);
 const coeff=(k,p)=>{const base=xp(p),d=p===1?"1":`${p}*${xp(p-1)}`,final=poly(Array.from({length:p},(_,i)=>i===p-1?k*p:0));return {expression:`${k}*${base}`,domain:"sur ℝ",final,coefficient:String(k),base,steps:[move(k,base),orbit(d,`La dérivée de x^${p} est ${p}x^${p-1}.`,`f'(x) = ${k}*`,"",[xp(p),xp(p-1),`${p}*${xp(p)}`,"0","1"]),input(String(k*p),"f'(x) = ",p===1?"":`*${xp(p-1)}`,`Multiplie ${k} par ${p}.`)]};};
 let t;
 if(id==="constant") t={expression:String(b),domain:"sur ℝ",final:"0",steps:[orbit("0","Une constante ne varie pas : sa dérivée est nulle.","f'(x) = ","",["1",String(b),"x","-1"])]};
 if(id==="linear") t={expression:"x",domain:"sur ℝ",final:"1",steps:[orbit("1","La fonction identité a pour dérivée 1.","f'(x) = ","",["0","x","2*x","x^2"])]};
 if(id==="square") {const p=r(2,3);t={expression:xp(p),domain:"sur ℝ",final:`${p}*${xp(p-1)}`,steps:[orbit(`${p}*${xp(p-1)}`,"Fais descendre l'exposant, puis diminue-le de 1.","f'(x) = ","",[xp(p),xp(p-1),`${p}*${xp(p)}`,"0","1"])]};}
 if(id==="coeff")t=coeff(a,2);
 if(id==="negative")t=coeff(-a,r(2,3));
 if(id==="power")t=coeff(a,n);
 if(id==="affine")t={expression:poly([b,a]),domain:"sur ℝ",final:String(a),steps:[rule("u'+v'","On dérive chaque terme d'une somme."),orbit("0","Le terme constant disparaît.","Dérivée de "+b+" = ","",["1",String(b),"x"]),input(String(a),"f'(x) = ","","La dérivée de ax est a.")]};
 if(id==="sum"){const expr=poly([c,b,a,1]),final=poly([b,2*a,3]);t={expression:expr,domain:"sur ℝ",final,steps:[rule("u'+v'","La dérivée d'une somme est la somme des dérivées."),orbit("3*x^2","(x³)' = 3x².","(x^3)' = "),orbit("2*x","(x²)' = 2x.","(x^2)' = "),input(final,"f'(x) = ","",`Dérive terme à terme. Le terme ${c} donne 0.`)]};}
 if(id==="inverse")t={expression:`${a}/x`,domain:"pour x ≠ 0",final:`-${a}/x^2`,coefficient:String(a),base:"1/x",steps:[move(a,"1/x"),orbit("-1/x^2","(1/x)' = -1/x².",`f'(x) = ${a}*`,"",["1/x^2","-1/x","1","0","x"]),input(String(-a),"f'(x) = ","/x^2","Le signe moins vient de la dérivée de 1/x.")]};
 if(id==="sqrt")t={expression:`${a}*sqrt(x)`,domain:"pour x > 0",final:`${a}/(2sqrt(x))`,coefficient:String(a),base:"sqrt(x)",steps:[move(a,"sqrt(x)"),orbit("1/(2sqrt(x))","(√x)' = 1/(2√x).",`f'(x) = ${a}*`,"",["sqrt(x)","1/sqrt(x)","2sqrt(x)","1/(2x)","0"]),input(String(a),"f'(x) = ","/(2sqrt(x))","Le coefficient reste au numérateur.")]};
 if(id==="product"){const u=`(x^2+${b})`,v=`(${a}*x+${c})`,final=poly([a*b,2*c,3*a]);t={expression:`${u}*${v}`,domain:"sur ℝ",final,steps:[rule("u'v+uv'","Deux facteurs dépendent de x : utilise la règle du produit."),orbit("2*x","u = x² + une constante, donc u' = 2x.","u'(x) = "),orbit(String(a),"v est affine : v' est le coefficient de x.","v'(x) = ","",["0","1","x",String(a+1)]),input(final,"f'(x) = ","",`Développe 2x*${v}+${u}*${a}, puis réduis.`)]};}
 if(id==="quotient"){const den=`(x+${c})`,num=poly([b,a]),k=a*c-b;t={expression:`(${num})/${den}`,domain:`pour x ≠ -${c}`,final:`${k}/${den}^2`,steps:[rule("(u'v-uv')/v^2","Pour u/v : (u'v − uv') / v²."),orbit(String(a),"u est affine.","u'(x) = ","",["0","1","x",String(b)]),orbit("1","La dérivée de x+c est 1.","v'(x) = ","",["0","x",String(c),"-1"]),input(String(k),"f'(x) = ",`/${den}^2`,`Au numérateur : ${a}(x+${c})−(${num}). Les termes en x s'annulent.`)]};}
 if(id==="exp")t={expression:`${a}*e^x`,domain:"sur ℝ",final:`${a}*e^x`,coefficient:String(a),base:"e^x",steps:[move(a,"e^x"),orbit("e^x","La fonction exponentielle est sa propre dérivée.",`f'(x) = ${a}*`,"",["x*e^x","e^(x-1)","1/x","1","0"]),input(String(a),"f'(x) = ","*e^x","Le coefficient est conservé.")]};
 if(id==="ln")t={expression:`${a}*ln(x)`,domain:"pour x > 0",final:`${a}/x`,coefficient:String(a),base:"ln(x)",steps:[move(a,"ln(x)"),orbit("1/x","(ln x)' = 1/x.",`f'(x) = ${a}*`,"",["ln(x)","x","-1/x^2","1","0"]),input(String(a),"f'(x) = ","/x","Conserve le coefficient au numérateur.")]};
 const u=`(${a}*x+${b})`,chain=()=>[rule("u'×g'(u)","Dérive la fonction extérieure, puis multiplie par u'."),orbit(String(a),"u est affine : u' = a.","u'(x) = ","",["0","1","x",String(b),String(a+1)])];
 if(id==="exp-affine")t={expression:`e^${u}`,domain:"sur ℝ",final:`${a}*e^${u}`,steps:[...chain(),input(String(a),"f'(x) = ",`*e^${u}`,"(eᵘ)' = u'eᵘ.")]};
 if(id==="ln-affine")t={expression:`ln${u}`,domain:`pour x > -${b}/${a}`,final:`${a}/${u}`,steps:[...chain(),input(String(a),"f'(x) = ",`/${u}`,"(ln u)' = u'/u lorsque u > 0.")]};
 if(id==="chain-power"){const p=r(2,5);t={expression:`${u}^${p}`,domain:"sur ℝ",final:`${p*a}*${u}^${p-1}`,steps:[...chain(),input(String(p*a),"f'(x) = ",`*${u}^${p-1}`,`(u^${p})' = ${p}u'u^${p-1}. Multiplie ${p} par ${a}.`)]};}
 if(id==="chain-inverse")t={expression:`1/${u}`,domain:`pour x ≠ -${b}/${a}`,final:`-${a}/${u}^2`,steps:[...chain(),input(String(-a),"f'(x) = ",`/${u}^2`,"(1/u)' = -u'/u².")]};
 if(id==="chain-sqrt")t={expression:`sqrt${u}`,domain:`pour x > -${b}/${a}`,final:`${a}/(2sqrt${u})`,steps:[...chain(),input(String(a),"f'(x) = ",`/(2sqrt${u})`,"(√u)' = u'/(2√u), lorsque u > 0.")]};
 if(id==="sin")t={expression:`sin${u}`,domain:"sur ℝ",final:`${a}*cos${u}`,steps:[...chain(),orbit(`cos${u}`,"La dérivée de sin est cos.",`f'(x) = ${a}*`,"",[`sin${u}`,`-cos${u}`,`-sin${u}`,"1","0"]),input(String(a),"f'(x) = ",`*cos${u}`,"Multiplie par u'.")]};
 if(id==="cos")t={expression:`cos${u}`,domain:"sur ℝ",final:`-${a}*sin${u}`,steps:[...chain(),orbit(`-sin${u}`,"La dérivée de cos est −sin.",`f'(x) = ${a}*`,"",[`sin${u}`,`cos${u}`,`-cos${u}`,"1","0"]),input(String(-a),"f'(x) = ",`*sin${u}`,"Pense au signe moins.")]};
 if(id==="exp-square"){const q=`(${a}*x^2+${b})`;t={expression:`e^${q}`,domain:"sur ℝ",final:`${2*a}*x*e^${q}`,steps:[rule("u'×g'(u)","L'exponentielle contient une fonction de x."),orbit(`${2*a}*x`,"La dérivée de ax²+b est 2ax.","u'(x) = ","",["2*x",`${a}*x`,String(a),q,"0"]),input(String(2*a),"f'(x) = ",`*x*e^${q}`,"Multiplie le coefficient par 2.")]};}
 if(id==="product-exp"){const p=poly([b,a]),z=poly([a+b,a]);t={expression:`(${p})*e^x`,domain:"sur ℝ",final:`(${z})*e^x`,steps:[rule("u'v+uv'","Applique la règle du produit."),orbit("e^x","(eˣ)' = eˣ.","v'(x) = ","",["1","x*e^x","1/x","0","e^(x-1)"]),input(z,"f'(x) = (",")*e^x",`Après factorisation par eˣ, il reste ${a}+(${p}).`)]};}
 if(id==="synthesis"){t={expression:`x^${n}*ln(x)`,domain:"pour x > 0",final:`x^${n-1}*(${n}*ln(x)+1)`,steps:[rule("u'v+uv'","C'est un produit de deux fonctions de x."),orbit(`${n}*x^${n-1}`,"Applique la règle des puissances.","u'(x) = ","",[`x^${n-1}`,`${n}*x^${n}`,String(n),"0","1"]),orbit("1/x","(ln x)' = 1/x.","v'(x) = ","",["ln(x)","x","-1/x^2","1","0"]),input(t?.final||`x^${n-1}*(${n}*ln(x)+1)`,"f'(x) = ","","Utilise u'v+uv', puis factorise par x^(n−1).")]};}
 return {...t,id};
}


function DeriveLab() {
  const [progress,setProgress]=React.useState<Progress>(readProgress);
  const [exercise,setExercise]=React.useState<Exercise>(()=>makeTask("coeff",true));
  const [index,setIndex]=React.useState(0);
  const [done,setDone]=React.useState(false);
  const [answer,setAnswer]=React.useState("");
  const [picked,setPicked]=React.useState(false);
  const [hadError,setHadError]=React.useState(false);
  const [usedHelp,setUsedHelp]=React.useState(false);
  const [hint,setHint]=React.useState(false);
  const [feedback,setFeedback]=React.useState<{good:boolean;text:string}|null>(null);
  const [view,setView]=React.useState("atelier");
  const [level,setLevel]=React.useState(1);
  const [detail,setDetail]=React.useState<Skill|null>(null);
  const [exploring,setExploring]=React.useState(false);
  const [angle,setAngle]=React.useState(0);
  const [extraKeys,setExtraKeys]=React.useState(false);
  const [storageOk,setStorageOk]=React.useState(true);
  const [light,setLight]=React.useState(false);
  const [resetting,setResetting]=React.useState(false);
  const [earned,setEarned]=React.useState(0);
  const [newUnlocks,setNewUnlocks]=React.useState<string[]>([]);
  const inputRef=React.useRef<HTMLInputElement>(null);
  const accepted=React.useRef(-1);
  const detailRef=React.useRef<HTMLElement>(null);
  const returnFocus=React.useRef<HTMLElement|null>(null);

  const skill=SKILLS.find(s=>s.id===exercise.id)!;
  const current=exercise.steps[index];
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
    if(!done&&current?.kind==="input")inputRef.current?.focus();
  },[index,done,exercise]);

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

  function start(id:string,sandbox=false){
    const next=SKILLS.find(s=>s.id===id)!;
    setExercise(makeTask(id));setIndex(0);setDone(false);setAnswer("");setPicked(false);
    setHadError(false);setUsedHelp(false);setHint(false);setFeedback(null);
    setAngle(0);setEarned(0);setNewUnlocks([]);
    setExploring(sandbox);setView("atelier");setDetail(null);setLevel(next.level);
    accepted.current=-1;
  }

  function chooseSkill(s:Skill){
    if(available(s))start(s.id);else setDetail(s);
  }

  function attempt(value:string,reveal=false){
    if(done||!current||accepted.current===index)return;
    const correct=current.kind==="input"?equivalent(value,current.expected):value===current.expected;
    if(!correct){
      setHadError(true);
      setFeedback({good:false,text:"Pas encore. "+current.hint});return;
    }
    accepted.current=index;
    const dirty=hadError||usedHelp||reveal;
    if(reveal)setUsedHelp(true);
    setAnswer("");setHint(false);setPicked(false);setAngle(0);
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

  function insert(text:string,inside=false){
    if(done||current?.kind!=="input")return;
    const el=inputRef.current;
    const from=el?.selectionStart??answer.length,to=el?.selectionEnd??from;
    setAnswer(answer.slice(0,from)+text+answer.slice(to));
    const caret=from+text.length-(inside?1:0);
    setTimeout(()=>{el?.focus();el?.setSelectionRange(caret,caret);},0);
  }

  function erase(){
    if(done||current?.kind!=="input")return;
    const el=inputRef.current;
    const from=el?.selectionStart??answer.length,to=el?.selectionEnd??from;
    const begin=from===to?Math.max(0,from-1):from;
    setAnswer(answer.slice(0,begin)+answer.slice(to));
    setTimeout(()=>{el?.focus();el?.setSelectionRange(begin,begin);},0);
  }

  function showHint(){setHint(true);setUsedHelp(true);}
  const keyMap:Record<string,[string,boolean?]>={
    "×":["*"],"÷":["/"],"−":["-"],"x²":["x^2"],"xⁿ":["x^()",true],
    "√":["sqrt()",true],"eˣ":["e^()",true],"ln":["ln()",true],
    "sin":["sin()",true],"cos":["cos()",true],"1/x":["1/()",true]
  };
  const keyboardActive=!done&&current?.kind==="input";
  const rate=stat.solved?Math.round(100*stat.clean/stat.solved):0;

  return <div className={"derive"+(light?" light":"")}>
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
        {view==="atelier"&&<>
          {exploring&&<div className="explore-banner">
            <span>Exploration libre · Cet exercice ne compte pas dans la progression.</span>
            <button onClick={()=>setView("parcours")}>Voir le parcours</button>
          </div>}
          <div className="intro">
            <div>
              <div className="eyebrow">Atelier {String(SKILLS.indexOf(skill)+1).padStart(2,"0")} · {skill.level===1?"Fondamentaux":"Approfondissement"}</div>
              <h1>{skill.title}</h1>
              <p className="subtitle">{skill.subtitle}. Une étape après l’autre.</p>
            </div>
            <button className="softbtn" onClick={()=>start(skill.id,exploring)} title="Changer d’exemple"><span>↻</span> Nouvel exemple</button>
          </div>

          <div className="studio">
            <section className="panel board" aria-label="Zone de dérivation">
              <div className="function-area">
                <div className="function-meta">
                  <span className="overline">Fonction à transformer</span>
                  <span className="domain">Dérivable {exercise.domain}</span>
                </div>
                <div className="original">
                  <MathText text="f(x) = "/>
                  {!done&&current.kind==="move"?<>
                    <button className={"coef"+(picked?" selected":"")} draggable
                      aria-label={"Sélectionner le coefficient "+exercise.coefficient}
                      onDragStart={e=>{e.dataTransfer.setData("text/plain",exercise.coefficient!);e.dataTransfer.effectAllowed="move";setPicked(true);}}
                      onClick={()=>{setPicked(true);setFeedback(null);}}>
                      <MathText text={exercise.coefficient!}/>
                    </button>
                    <button className="base" aria-label="Sélectionner la fonction de référence" onClick={()=>attempt(exercise.base!)}>
                      <MathText text={exercise.base!}/>
                    </button>
                  </>:<MathText text={exercise.expression}/>}
                </div>
                <div className="function-note">{!done&&current.kind==="move"?"Le nombre en violet est manipulable.":"Construis la dérivée sur les lignes ci-dessous."}</div>
              </div>

              <div className="steps">
                <div className="stepper" aria-label={"Étape "+(done?exercise.steps.length:index+1)+" sur "+exercise.steps.length}>
                  {exercise.steps.map((_,i)=><span key={i} className={"stepdot "+(done||i<index?"past":i===index?"current":"")}/>)}
                  <span className="stepnumber">{done?exercise.steps.length:index+1} / {exercise.steps.length}</span>
                </div>
                {exercise.steps.slice(0,done?exercise.steps.length:index).map((s,i)=>
                  <div className="pastline" key={i}><span className="tick">✓</span><MathText text={s.solved}/></div>
                )}

                {!done?<>
                  <div className="step-title"><span className="number">{index+1}</span>{current.prompt}</div>
                  <p className="instruction">
                    {current.kind==="move"&&"Glisse le coefficient dans la case, ou touche le coefficient puis la case."}
                    {current.kind==="orbit"&&"La roue propose plusieurs réponses. Touche celle qui convient."}
                    {current.kind==="rule"&&"Observe la structure de la fonction avant de commencer les calculs."}
                    {current.kind==="input"&&"Complète uniquement la case avec le clavier, puis valide."}
                  </p>

                  {current.kind==="move"&&<div className="working">
                    <MathText text={current.prefix}/>
                    <button className={"drop"+(picked?" ready":"")} aria-label="Déposer le coefficient"
                      onDragOver={e=>{e.preventDefault();e.dataTransfer.dropEffect="move";}}
                      onDrop={e=>{e.preventDefault();attempt(e.dataTransfer.getData("text/plain"));}}
                      onClick={()=>{
                        if(picked)attempt(exercise.coefficient!);
                        else setFeedback({good:true,text:"Touche d’abord le coefficient violet sur la première ligne."});
                      }}>{picked?exercise.coefficient:"↓"}</button>
                    <MathText text={current.suffix}/>
                  </div>}

                  {current.kind==="orbit"&&<>
                    <div className="working"><MathText text={current.prefix}/><span className="blank">?</span><MathText text={current.suffix}/></div>
                    <div className="orbit-wrap">
                      <div className="orbit" aria-label="Roue des dérivées">
                        <div className="orbit-center"><span>d/dx</span><small>CHOISIR</small></div>
                        {current.choices.map((choice,i)=>{
                          const theta=(i*360/current.choices.length-90+angle)*Math.PI/180;
                          return <button key={choice} className={"orbit-choice"+(choice.length>10?" long":"")}
                            style={{left:(50+36*Math.cos(theta))+"%",top:(50+36*Math.sin(theta))+"%"}}
                            aria-label={"Choisir "+choice} onClick={()=>attempt(choice)}><MathText text={choice}/></button>;
                        })}
                      </div>
                      <div className="orbit-controls">
                        <button aria-label="Tourner la roue vers la gauche" onClick={()=>setAngle(angle-60)}>↶</button>
                        <span>Tourne la roue, puis choisis</span>
                        <button aria-label="Tourner la roue vers la droite" onClick={()=>setAngle(angle+60)}>↷</button>
                      </div>
                    </div>
                  </>}

                  {current.kind==="rule"&&<div className="rules">
                    {current.choices.map(choice=><button key={choice} className="rule-choice" onClick={()=>attempt(choice)}><MathText text={choice}/></button>)}
                  </div>}

                  {current.kind==="input"&&<>
                    <div className="working">
                      <MathText text={current.prefix}/>
                      <input className="answer" ref={inputRef} value={answer}
                        style={{width:Math.min(300,Math.max(82,answer.length*15+28))}}
                        aria-label="Réponse à compléter" placeholder="…" autoComplete="off" autoCapitalize="off" spellCheck={false} maxLength={180}
                        onChange={e=>{setAnswer(e.target.value);setFeedback(null);}}
                        onKeyDown={e=>{if(e.key==="Enter"&&answer.trim())attempt(answer);}}/>
                      <MathText text={current.suffix.replace(/^\*/,"")}/>
                    </div>
                    {answer&&<div className="input-reading">Lecture : <MathText text={current.prefix+answer+current.suffix}/></div>}
                  </>}

                  {feedback&&<div role="status" className={"feedback"+(feedback.good?" good":"")}>{feedback.text}</div>}
                  {hint&&<div className="hintbox">{current.hint}</div>}
                  <div className="actions">
                    <button className="textbtn" onClick={showHint}>✧ Un indice</button>
                    {current.kind==="input"&&<button className="primary" disabled={!answer.trim()} onClick={()=>attempt(answer)}>Valider <span>↗</span></button>}
                    {hint&&<button className="textbtn" onClick={()=>attempt(current.expected,true)}>Montrer cette étape →</button>}
                  </div>
                </>:<div className="success" role="status">
                  <span className="earned">{exploring?"EXPLORATION":"+ "+earned+" XP"}</span>
                  <h2>Dérivée reconstruite.</h2>
                  <div className="result"><MathText text={"f'(x) = "+exercise.final}/></div>
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
              <div className="panel keyboard">
                <div className="tooltitle">Clavier mathématique <span className="tag">À portée de main</span></div>
                <p className="toolsub">{keyboardActive?"Écris dans la case active.":"Il s’active lorsqu’une case est à compléter."}</p>
                <div className="keys">
                  {["7","8","9","+","−","4","5","6","×","÷","1","2","3","(",")","0",".","x","x²","xⁿ"].map(key=>
                    <button key={key} disabled={!keyboardActive}
                      className={"key "+(key.includes("x")?"variable":["+","−","×","÷"].includes(key)?"operator":"")}
                      onMouseDown={e=>e.preventDefault()}
                      onClick={()=>{const entry:[string,boolean?]=keyMap[key]||[key,false];insert(entry[0],entry[1]);}}>{key}</button>
                  )}
                </div>
                <div className="keytools">
                  <button className="key" disabled={!keyboardActive} onMouseDown={e=>e.preventDefault()} onClick={erase} aria-label="Effacer le caractère précédent">⌫ Effacer</button>
                  <button className="key" disabled={!keyboardActive} onClick={()=>{setAnswer("");inputRef.current?.focus();}}>Vider la case</button>
                </div>
                <button className="morekeys" aria-expanded={extraKeys} onClick={()=>setExtraKeys(!extraKeys)}>{extraKeys?"−":"+"} Fonctions & fractions</button>
                {extraKeys&&<div className="extra">
                  {["1/x","√","eˣ","ln","sin","cos"].map(key=>
                    <button className="key" key={key} disabled={!keyboardActive} onMouseDown={e=>e.preventDefault()}
                      onClick={()=>{const [text,inside]=keyMap[key];insert(text,inside);}}>{key}</button>
                  )}
                </div>}
                <button className="primary validate-key" disabled={!keyboardActive||!answer.trim()} onClick={()=>attempt(answer)}>Valider la réponse <span>↗</span></button>
                <div className="keyboard-note">Le clavier de ton appareil fonctionne aussi.</div>
              </div>

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
                <h3>{s.title}</h3><p>{s.subtitle}</p>
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
        <p>{detail.subtitle}. Pour l’ouvrir dans le parcours, réussis trois exercices sans erreur ni indice dans chacun de ces ateliers :</p>
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
ReactDOM.createRoot(rootElement).render(<DeriveLab/>);
