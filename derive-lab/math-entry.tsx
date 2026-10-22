import * as React from "react";
import {MathText} from "./math-display";
export type EntryHandle={insert:(text:string)=>void;erase:()=>void;clear:()=>void;next:()=>void;focus:()=>void;toggleSign:()=>void};
export const MathEntry=React.forwardRef<EntryHandle,{value:string;label:string;active:boolean;onChange:(value:string)=>void;onActivate:()=>void;onSubmit:()=>void}>(({value,label,active,onChange,onActivate,onSubmit},forwarded)=>{
 const input=React.useRef<HTMLInputElement>(null),selection=React.useRef<[number,number]>([value.length,value.length]);
 const place=(from:number,to=from)=>{selection.current=[from,to];requestAnimationFrame(()=>{input.current?.focus({preventScroll:true});input.current?.setSelectionRange(from,to);});};
 function insert(text:string){
  let [from,to]=selection.current;from=Math.min(from,value.length);to=Math.min(to,value.length);
  if(value[from]==="□"&&from===to)to++;
  const next=value.slice(0,from)+text+value.slice(to);if(next.length>240)return;
  onChange(next);const square=text.indexOf("□");place(square<0?from+text.length:from+square,square<0?from+text.length:from+square+1);
 }
 function erase(){const [from,to]=selection.current;const begin=from===to?Math.max(0,from-1):from;onChange(value.slice(0,begin)+value.slice(to));place(begin);}
 function next(){const start=selection.current[1],index=value.indexOf("□",start),target=index<0?value.indexOf("□"):index;if(target>=0)place(target,target+1);else place(value.length);}
 React.useImperativeHandle(forwarded,()=>({insert,erase,next,clear:()=>{onChange("");place(0);},focus:()=>place(value.length),toggleSign:()=>{
  const next=value.startsWith("-(")&&value.endsWith(")")?value.slice(2,-1):value.startsWith("-")?value.slice(1):/[+-]/.test(value.slice(1))?"-("+value+")":"-"+value;
  onChange(next);place(next.length);
 }}));
 const selectSlot=(n:number)=>{let index=-1;for(let i=0;i<=n;i++)index=value.indexOf("□",index+1);onActivate();place(index,index+1);};
 return <span className={"math-entry"+(active?" active":"")+(value?" has-value":"")}>
  <input ref={input} value={value} readOnly inputMode="none" autoComplete="off" spellCheck={false} aria-label={label}
    onFocus={onActivate} onClick={()=>{onActivate();selection.current=[input.current?.selectionStart??value.length,input.current?.selectionEnd??value.length];}}
    onSelect={()=>selection.current=[input.current?.selectionStart??value.length,input.current?.selectionEnd??value.length]}
    onPaste={event=>{event.preventDefault();insert(event.clipboardData.getData("text"));}}
    onKeyDown={event=>{
      if(event.ctrlKey||event.metaKey||event.altKey)return;
      if(event.key==="Enter"){event.preventDefault();onSubmit();}
      else if(event.key==="Backspace"){event.preventDefault();erase();}
      else if(event.key==="Tab"&&value.includes("□")){event.preventDefault();next();}
      else if(event.key==="Delete"){event.preventDefault();const [from,to]=selection.current;onChange(value.slice(0,from)+value.slice(from===to?to+1:to));place(from);}
      else if(/^[0-9a-z()+\-*/^.,×−·]$/i.test(event.key)){event.preventDefault();insert(event.key);}
    }}/>
  <span className="math-entry-render"><MathText text={value||" "} compact slot={n=><button type="button" className="fraction-hole" aria-label={label+" : case "+(n+1)} onClick={()=>selectSlot(n)}>□</button>}/></span>
 </span>;
});
export function MathKeyboard({entry,onValidate,canValidate,onSign}:{entry:React.RefObject<EntryHandle>;onValidate:()=>void;canValidate:boolean;onSign:()=>void}){
 const [extra,setExtra]=React.useState(false);
 const insert=(s:string)=>entry.current?.insert(s);
 const keys=["7","8","9","+","−","4","5","6","×","fraction","1","2","3","(",")","0",".","x","x²","xⁿ"];
 const values:Record<string,string>={"−":"-","×":"*","fraction":"(□)/(□)","x²":"x^2","xⁿ":"x^(□)","√":"sqrt(□)","eˣ":"e^(□)","²":"^2","ln":"ln(□)","sin":"sin(□)","cos":"cos(□)"};
 return <section className="keyboard math-keyboard" aria-label="Clavier mathématique">
  <div className="tooltitle">Clavier mathématique</div>
  <div className="keys">{keys.map(key=><button className="key" key={key} aria-label={key==="fraction"?"Insérer une fraction":undefined} onPointerDown={e=>e.preventDefault()} onClick={()=>insert(values[key]||key)}>
   <MathText text={key==="fraction"?"□/□":key==="x²"?"x^2":key==="xⁿ"?"x^n":key}/>
  </button>)}</div>
  <div className="keytools"><button className="key" aria-label="Changer le signe" onPointerDown={e=>e.preventDefault()} onClick={onSign}>+/−</button><button className="key" onPointerDown={e=>e.preventDefault()} onClick={()=>entry.current?.erase()}>⌫</button><button className="key" onPointerDown={e=>e.preventDefault()} onClick={()=>entry.current?.next()}>Case suivante</button></div>
  <div className="quick-functions">{["√","eˣ","²"].map(key=><button className="key" key={key} aria-label={key==="√"?"Insérer une racine carrée":key==="²"?"Élever au carré":"Insérer une exponentielle"} onPointerDown={e=>e.preventDefault()} onClick={()=>insert(values[key])}><MathText text={key==="√"?"sqrt(□)":key==="eˣ"?"e^x":"a^2"}/></button>)}</div>
  <button className="morekeys" aria-expanded={extra} onClick={()=>setExtra(!extra)}>{extra?"−":"+"} Fonctions</button>
  {extra&&<div className="extra">{["ln","sin","cos"].map(key=><button className="key" key={key} onPointerDown={e=>e.preventDefault()} onClick={()=>insert(values[key])}><MathText text={key}/></button>)}</div>}
  <button className="textbtn" onPointerDown={e=>e.preventDefault()} onClick={()=>entry.current?.clear()}>Vider la case</button>
  <button className="primary validate-key" disabled={!canValidate} onClick={onValidate}>Valider <span>→</span></button>
  <p className="entry-help">Fraction : numérateur d’abord. Touche une case ou « Case suivante » pour continuer.</p>
 </section>;
}
