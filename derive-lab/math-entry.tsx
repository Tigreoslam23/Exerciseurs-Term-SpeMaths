import * as React from "react";
import {MathText} from "./math-display";
import {insertMath,nextEntryTarget,type ReferenceShortcut} from "./keyboard-model";
export type EntryHandle={insert:(text:string,expression?:boolean)=>void;erase:()=>void;clear:()=>void;next:()=>void;focus:(position?:number)=>void;selection:()=>[number,number];toggleSign:()=>void};
export const MathEntry=React.forwardRef<EntryHandle,{value:string;label:string;active:boolean;onChange:(value:string)=>void;onActivate:()=>void;onSubmit:()=>void;onNavigate?:()=>boolean;onCursorChange?:(range:[number,number])=>void}>(({value,label,active,onChange,onActivate,onSubmit,onNavigate,onCursorChange},forwarded)=>{
 const input=React.useRef<HTMLInputElement>(null),selection=React.useRef<[number,number]>([value.length,value.length]);
 const remember=(from:number,to:number)=>{if(selection.current[0]!==from||selection.current[1]!==to){selection.current=[from,to];onCursorChange?.([from,to]);}};
 const place=(from:number,to=from)=>{remember(from,to);requestAnimationFrame(()=>{input.current?.focus({preventScroll:true});input.current?.setSelectionRange(from,to);});};
 function insert(text:string,expression=false){
  const edit=insertMath(value,...selection.current,text,expression);if(edit.value.length>240)return;
  onChange(edit.value);place(edit.start,edit.end);
 }
 function erase(){const [from,to]=selection.current;const begin=from===to?Math.max(0,from-1):from;onChange(value.slice(0,begin)+value.slice(to));place(begin);}
 function next(){const target=nextEntryTarget([value],0,...selection.current);if(target)place(target.position,target.position+1);}
 React.useImperativeHandle(forwarded,()=>({insert,erase,next,selection:()=>selection.current,clear:()=>{onChange("");place(0);},focus:(position=value.length)=>place(position,value[position]==="□"?position+1:position),toggleSign:()=>{
  const next=value.startsWith("-(")&&value.endsWith(")")?value.slice(2,-1):value.startsWith("-")?value.slice(1):/[+-]/.test(value.slice(1))?"-("+value+")":"-"+value;
  onChange(next);place(next.length);
 }}));
 const selectSlot=(n:number)=>{let index=-1;for(let i=0;i<=n;i++)index=value.indexOf("□",index+1);onActivate();place(index,index+1);};
 return <span className={"math-entry"+(active?" active":"")+(value?" has-value":"")}>
  <input ref={input} value={value} readOnly inputMode="none" autoComplete="off" spellCheck={false} aria-label={label}
    onFocus={onActivate} onClick={()=>{onActivate();remember(input.current?.selectionStart??value.length,input.current?.selectionEnd??value.length);}}
    onSelect={()=>remember(input.current?.selectionStart??value.length,input.current?.selectionEnd??value.length)}
    onPaste={event=>{event.preventDefault();insert(event.clipboardData.getData("text"));}}
    onKeyDown={event=>{
      if(event.ctrlKey||event.metaKey||event.altKey)return;
      if(event.key==="Enter"){event.preventDefault();onSubmit();}
      else if(event.key==="Backspace"){event.preventDefault();erase();}
      else if(event.key==="Tab"&&!event.shiftKey){if(onNavigate){if(onNavigate())event.preventDefault();}else if(nextEntryTarget([value],0,...selection.current)){event.preventDefault();next();}}
      else if(event.key==="Delete"){event.preventDefault();const [from,to]=selection.current;onChange(value.slice(0,from)+value.slice(from===to?to+1:to));place(from);}
      else if(/^[0-9a-z()+\-*/^.,×−·]$/i.test(event.key)){event.preventDefault();insert(event.key);}
    }}/>
  <span className="math-entry-render"><MathText text={value||" "} compact slot={n=><button type="button" className="fraction-hole" aria-label={label+" : case "+(n+1)} onClick={()=>selectSlot(n)}>□</button>}/></span>
 </span>;
});

function KeyboardIcon({kind}:{kind:"backspace"|"clear"|"next"}){
 return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
  {kind==="backspace"?<><path d="M9 5h12v14H9l-7-7Z"/><path d="m12 9 6 6m0-6-6 6"/></>:kind==="clear"?<><path d="m14 3 7 7a2 2 0 0 1 0 3l-8 8H7l-5-5a2 2 0 0 1 0-3L12 3a1.5 1.5 0 0 1 2 0Z"/><path d="m8 7 9 9M7 21h15"/></>:<><path d="M2 12h11m-4-4 4 4-4 4"/><rect x="17" y="5" width="5" height="14" rx="1.5"/></>}
 </svg>;
}

export function MathKeyboard({entry,onValidate,canValidate,onSign,enabled=true,onNext,canNext=false,onClear,canClear=true,shortcuts=[],newlyUnlocked=[]}:{
 entry:React.RefObject<EntryHandle>;onValidate:()=>void;canValidate:boolean;onSign:()=>void;enabled?:boolean;
 onNext?:()=>void;canNext?:boolean;onClear?:()=>void;canClear?:boolean;shortcuts?:ReferenceShortcut[];newlyUnlocked?:ReferenceShortcut[];
}){
 const [extra,setExtra]=React.useState(false),[bankOpen,setBankOpen]=React.useState(true),[all,setAll]=React.useState(false),[tip,setTip]=React.useState("");
 const hold=React.useRef<ReturnType<typeof setTimeout>|null>(null),held=React.useRef(false);
 React.useEffect(()=>()=>{if(hold.current)clearTimeout(hold.current);},[]);
 const insert=(s:string,expression=false)=>entry.current?.insert(s,expression);
 const keys=["7","8","9","+","−","4","5","6","×","fraction","1","2","3","(",")","0",".","x","x²","power"];
 const values:Record<string,string>={"−":"-","×":"*","fraction":"(□)/(□)","x²":"x^2","power":"^(□)","√":"sqrt(□)","e":"e^(□)","²":"^2","parentheses":"(□)","ln":"ln(□)","sin":"sin(□)","cos":"cos(□)"};
 const action=(kind:"backspace"|"clear"|"next",label:string,short:string,disabled:boolean,run:()=>void)=><button type="button" className={"key keyboard-action "+(kind==="next"?"next-entry":"")+(tip===kind?" show-tip":"")} aria-label={label} title={label} disabled={disabled}
  onPointerDown={event=>{event.preventDefault();held.current=false;setTip("");if(hold.current)clearTimeout(hold.current);hold.current=setTimeout(()=>{held.current=true;setTip(kind);},500);}}
  onPointerUp={()=>{if(hold.current)clearTimeout(hold.current);}}
  onPointerCancel={()=>{if(hold.current)clearTimeout(hold.current);held.current=false;setTip("");}}
  onPointerLeave={()=>{if(hold.current)clearTimeout(hold.current);setTip("");}}
  onBlur={()=>setTip("")}
  onClick={()=>{if(held.current){held.current=false;return;}setTip("");run();}}><KeyboardIcon kind={kind}/><span className="action-label">{short}</span><span className="key-tooltip" aria-hidden="true">{label}</span></button>;
 return <section className="keyboard math-keyboard" aria-label="Clavier mathématique">
  <div className="tooltitle">Clavier mathématique</div>
  <div className="shortcut-bank">
   <button type="button" className="shortcut-bank-toggle" aria-expanded={bankOpen} onClick={()=>setBankOpen(!bankOpen)}><span>Mes raccourcis <small>{shortcuts.length}</small></span><span aria-hidden="true">{bankOpen?"−":"+"}</span></button>
   {newlyUnlocked.length>0&&<p className="shortcut-reward" role="status">Nouveaux raccourcis débloqués : {newlyUnlocked.map(s=>s.label).join(", ")}.</p>}
   {bankOpen&&(shortcuts.length?<><div className="shortcut-keys">{(all?shortcuts:shortcuts.slice(0,6)).map(s=><button className="key reference-key" key={s.id} disabled={!enabled} aria-label={"Insérer le raccourci "+s.label} title={s.label} onPointerDown={e=>e.preventDefault()} onClick={()=>insert(s.expression,true)}><MathText text={s.expression} compact/></button>)}</div>{shortcuts.length>6&&<button className="more-shortcuts" aria-expanded={all} onClick={()=>setAll(!all)}>{all?"Réduire":"Tous mes raccourcis"}</button>}</>:<p className="shortcut-empty">Trois réussites sans erreur ni indice dans une compétence débloquent ses raccourcis.</p>)}
  </div>
  <fieldset disabled={!enabled} aria-label="Touches du clavier mathématique">
   <div className="keys">{keys.map(key=><button className="key" key={key} aria-label={key==="fraction"?"Insérer une fraction":key==="power"?"Ajouter un exposant":undefined} onPointerDown={e=>e.preventDefault()} onClick={()=>insert(values[key]||key)}><MathText text={key==="fraction"?"□/□":key==="x²"?"x^2":key==="power"?"a^□":key}/></button>)}</div>
   <div className="keytools keyboard-actions">
    {action("backspace","Effacer le caractère précédent","Effacer",!canClear,()=>entry.current?.erase())}
    {action("clear","Vider la case","Vider",!canClear,()=>onClear?onClear():entry.current?.clear())}
    {action("next","Case suivante","Suivante",!canNext,()=>onNext?onNext():entry.current?.next())}
   </div>
   <div className="quick-functions construction-keys">{[{key:"√",label:"Insérer une racine carrée",math:"sqrt(□)"},{key:"e",label:"Insérer une exponentielle",math:"e^□"},{key:"parentheses",label:"Insérer des parenthèses",math:"(□)"},{key:"²",label:"Élever au carré",math:"a^2"}].map(({key,label,math})=><button className="key" key={key} aria-label={label} onPointerDown={e=>e.preventDefault()} onClick={()=>insert(values[key])}><MathText text={math}/></button>)}<button className="key sign-key" aria-label="Changer le signe" onPointerDown={e=>e.preventDefault()} onClick={onSign}>+/−</button></div>
   <button className="morekeys" aria-expanded={extra} onClick={()=>setExtra(!extra)}>{extra?"−":"+"} Fonctions</button>
   {extra&&<div className="extra">{["ln","sin","cos"].map(key=><button className="key" key={key} onPointerDown={e=>e.preventDefault()} onClick={()=>insert(values[key])}><MathText text={key}/></button>)}</div>}
   <button className="primary validate-key" disabled={!canValidate} onClick={onValidate}>Valider <span>→</span></button>
  </fieldset>
  {!enabled&&<p className="keyboard-state">Le clavier s’active lorsqu’une dérivée est à compléter.</p>}
  <p className="entry-help">Fraction : numérateur d’abord. La flèche passe à la prochaine case vide.</p>
 </section>;
}
