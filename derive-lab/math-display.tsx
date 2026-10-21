import * as React from "react";

export type DisplayNode =
  | {type:"atom"|"space"|"operator";text:string}
  | {type:"group";children:DisplayNode[];closed:boolean}
  | {type:"power";base:DisplayNode;exponent:DisplayNode[]}
  | {type:"prime";base:DisplayNode;mark:string}
  | {type:"fraction";numerator:DisplayNode[];denominator:DisplayNode[]};

const factor=(node:DisplayNode|undefined)=>!!node&&node.type!=="space"&&node.type!=="operator";
const ungroup=(nodes:DisplayNode[])=>nodes.length===1&&nodes[0].type==="group"&&nodes[0].closed?nodes[0].children:nodes;

// Parse uniquement la présentation : aucune évaluation ni modification du calcul.
// Les parenthèses, puissances, primes et priorités des divisions sont conservées.
export function parseMathDisplay(source:string):DisplayNode[]{
  const superscripts:Record<string,string>={"⁰":"0","¹":"1","²":"2","³":"3","⁴":"4","⁵":"5","⁶":"6","⁷":"7","⁸":"8","⁹":"9","ⁿ":"n","ᵘ":"u","⁻":"-","⁺":"+"};
  const text=source.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹ⁿᵘ⁻⁺]+/g,s=>"^("+[...s].map(c=>superscripts[c]).join("")+")")
    .replace(/sqrt/g,"√").replace(/[·*]/g," × ").replace(/-/g,"−");
  let pos=0;
  function sequence(group=false):{nodes:DisplayNode[];closed:boolean}{
    const nodes:DisplayNode[]=[];
    let closed=false;
    while(pos<text.length){
      const char=text[pos];
      if(group&&char===")"){pos++;closed=true;break;}
      if(char==="("){
        pos++;const inner=sequence(true);
        nodes.push({type:"group",children:inner.nodes,closed:inner.closed});continue;
      }
      if(char==="^"&&factor(nodes[nodes.length-1])){
        pos++;let exponent:DisplayNode[]=[];
        if(text[pos]==="("){pos++;exponent=sequence(true).nodes;}
        else{
          const match=text.slice(pos).match(/^[−+]?\d+(?:\.\d+)?|^[−+]?[a-z]/i);
          if(match){exponent=[{type:"atom",text:match[0]}];pos+=match[0].length;}
          else exponent=[{type:"atom",text:"□"}];
        }
        nodes.push({type:"power",base:nodes.pop()!,exponent});continue;
      }
      if((char==="'"||char==="′")&&factor(nodes[nodes.length-1])){
        pos++;nodes.push({type:"prime",base:nodes.pop()!,mark:char});continue;
      }
      if(/\s/.test(char)){
        const match=text.slice(pos).match(/^\s+/)![0];
        pos+=match.length;nodes.push({type:"space",text:match});continue;
      }
      if(/[+−×÷/=;:<>≠]/.test(char)){
        pos++;nodes.push({type:"operator",text:char});continue;
      }
      const match=text.slice(pos).match(/^\d+(?:[.,]\d+)?|^[a-zÀ-ÿ]+/i);
      const value=match?match[0]:char;
      pos+=value.length;nodes.push({type:"atom",text:value});
    }

    // Les divisions sont regroupées de gauche à droite. Un dénominateur
    // composé reste délimité par les parenthèses saisies dans la source.
    for(let i=0;i<nodes.length;i++){
      if(nodes[i].type!=="operator"||(nodes[i] as {text:string}).text!=="/")continue;
      let left=i-1;
      while(left>=0&&nodes[left].type==="space")left--;
      let begin=left;
      let numerator:DisplayNode[];
      if(factor(nodes[left])){
        while(begin>0&&factor(nodes[begin-1]))begin--;
        numerator=nodes.slice(begin,left+1);
      }else{begin=i;numerator=[{type:"atom",text:"□"}];}
      let right=i+1;
      while(right<nodes.length&&nodes[right].type==="space")right++;
      const denominator:DisplayNode[]=[];
      if(nodes[right]?.type==="operator"&&["−","+"].includes((nodes[right] as {text:string}).text))denominator.push(nodes[right++]);
      if(factor(nodes[right]))denominator.push(nodes[right++]);
      else denominator.push({type:"atom",text:"□"});
      nodes.splice(begin,right-begin,{type:"fraction",numerator:ungroup(numerator),denominator:ungroup(denominator)});
      i=begin;
    }
    return {nodes,closed};
  }
  return sequence().nodes;
}

const hasFraction=(nodes:DisplayNode[]):boolean=>nodes.some(node=>node.type==="fraction"||
  (node.type==="group"&&hasFraction(node.children))||
  (node.type==="power"&&(hasFraction([node.base])||hasFraction(node.exponent)))||
  (node.type==="prime"&&hasFraction([node.base])));

// La juxtaposition est réservée aux facteurs non ambigus ; 2*3 reste 2 × 3.
export function compactMath(source:string):string{
  return source.replace(/([0-9a-z)²³])\s*[*×·]\s*(?=[a-z(√□])/gi,"$1")
    .replace(/(□)\s*[*×·]\s*(?=[a-z(√])/gi,"$1");
}

export function MathText({text,slot,compact=false}:{text:string;slot?:React.ReactNode;compact?:boolean}){
  const display=compact?compactMath(text):text;
  function render(nodes:DisplayNode[]):React.ReactNode[]{
    if(compact){
      const hidden=new Set<number>();
      nodes.forEach((node,i)=>{
        if(node.type!=="operator"||node.text!=="×")return;
        let left=i-1,right=i+1;
        while(nodes[left]?.type==="space")left--;
        while(nodes[right]?.type==="space")right++;
        const a=nodes[left],b=nodes[right];
        if(!factor(a)||!factor(b))return;
        // La juxtaposition de deux nombres changerait leur valeur.
        if(a.type==="atom"&&b.type==="atom"&&/^[\d.,]+$/.test(a.text)&&/^[\d.,]+$/.test(b.text))return;
        for(let j=left+1;j<right;j++)hidden.add(j);
      });
      nodes=nodes.filter((_,i)=>!hidden.has(i));
    }
    return nodes.map((node,i)=>{
      if(node.type==="fraction")return <span className="math-frac" key={i}>
        <span className="math-numerator">{render(node.numerator)}</span>
        <span className="math-denominator">{render(node.denominator)}</span>
      </span>;
      if(node.type==="group")return <span className={"math-group"+(hasFraction(node.children)?" tall":"")} key={i}>
        <span className="math-delimiter">(</span><span>{render(node.children)}</span>{node.closed&&<span className="math-delimiter">)</span>}
      </span>;
      if(node.type==="power")return <React.Fragment key={i}>{render([node.base])}<sup>{render(node.exponent)}</sup></React.Fragment>;
      if(node.type==="prime")return <span className="math-primed" key={i}>{render([node.base])}<sup className="math-prime">′</sup></span>;
      if(node.type==="atom"&&node.text==="□"&&slot)return <React.Fragment key={i}>{slot}</React.Fragment>;
      return <span key={i} className={node.type==="atom"&&/^[a-z]+$/i.test(node.text)&&/^[fxuvkndge]+$/.test(node.text)?"math-identifier":"math-literal"}>{node.text}</span>;
    });
  }
  return <span className="math" role={slot?undefined:"math"} aria-label={slot?undefined:display}>{render(parseMathDisplay(text))}</span>;
}
