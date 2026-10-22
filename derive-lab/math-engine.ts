export function mathValue(source: string, x: number): number {
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

export function sameMath(actual:string,expected:string):boolean {
 if(!actual.trim()||actual.includes('□'))return false;
 let tested=0;
 for(const x of [-30,-25,-20,-15,-12.43,-10.19,-9.13,-8.17,-5.71,-3.17,-1.79,-.71,.11,.29,.71,1.13,1.79,2.43,3.17,4.61,5.23,6.47,8.17,9.13,10.19,12.43,15,20,25,30]){
  let target:number;try{target=mathValue(expected,x);}catch{continue;}
  let value:number;try{value=mathValue(actual,x);}catch{return false;}
  if(Math.abs(target-value)>1e-8*Math.max(1,Math.abs(target),Math.abs(value)))return false;
  tested++;
 }
 return tested>=5;
}
