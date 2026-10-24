import * as React from "react";
import {MathText} from "./math-display";

// Les cartes ne transportent que u et u′ : aucun signe ni carré n’est ajouté.
export function FractionSources({items,picked,onPick,onDrop,onOver}:{items:{label:string;value:string}[];picked:number|null;onPick:(index:number|null)=>void;onDrop:(source:number,target:number)=>void;onOver:(index:number|null)=>void}){
 const root=React.useRef<HTMLDivElement>(null),drag=React.useRef<{source:number;pointer:number;x:number;y:number;startX:number;startY:number;moved:boolean}|null>(null);
 const [ghost,setGhost]=React.useState<{source:number;x:number;y:number}|null>(null),frame=React.useRef<number|null>(null),suppress=React.useRef(false);
 const targetAt=(x:number,y:number)=>{const el=document.elementFromPoint(x,y)?.closest<HTMLElement>('[data-inverse-target]');return el&&el.closest('.learning-board')===root.current?.closest('.learning-board')?Number(el.dataset.inverseTarget):null;};
 const cancel=()=>{drag.current=null;setGhost(null);onOver(null);if(frame.current!==null)cancelAnimationFrame(frame.current);frame.current=null;};
 const scrollAtEdge=()=>{
  if(frame.current!==null)return;
  const tick=()=>{frame.current=null;const d=drag.current;if(!d?.moved)return;const amount=d.y<60?-12:d.y>window.innerHeight-60?12:0;if(!amount)return;window.scrollBy(0,amount);onOver(targetAt(d.x,d.y));frame.current=requestAnimationFrame(tick);};
  frame.current=requestAnimationFrame(tick);
 };
 React.useEffect(()=>{const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'){cancel();onPick(null);}};window.addEventListener('keydown',escape);return()=>{window.removeEventListener('keydown',escape);if(frame.current!==null)cancelAnimationFrame(frame.current);};},[]);
 return <div className={"inverse-source-tray"+(items.some(item=>item.value.length>24)?" long-expressions":"")} ref={root} aria-label="Expressions à placer dans la fraction">
  {items.map((item,i)=><button key={i} type="button" className={"inverse-source"+(picked===i?" selected":"")} data-inverse-source={i} aria-label={"Sélectionner "+item.label.replace("'"," prime")} aria-pressed={picked===i}
   onDragStart={e=>e.preventDefault()}
   onPointerDown={e=>{if(!e.isPrimary||e.button!==0)return;suppress.current=false;onPick(i);drag.current={source:i,pointer:e.pointerId,startX:e.clientX,startY:e.clientY,x:e.clientX,y:e.clientY,moved:false};e.currentTarget.setPointerCapture(e.pointerId);}}
   onPointerMove={e=>{const d=drag.current;if(!d||d.pointer!==e.pointerId)return;d.x=e.clientX;d.y=e.clientY;if(Math.hypot(d.x-d.startX,d.y-d.startY)>6)d.moved=true;if(d.moved){setGhost({source:i,x:d.x,y:d.y});onOver(targetAt(d.x,d.y));scrollAtEdge();}}}
   onPointerUp={e=>{const d=drag.current;if(!d||d.pointer!==e.pointerId)return;const target=d.moved?targetAt(e.clientX,e.clientY):null;suppress.current=d.moved;cancel();if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);if(target!==null)onDrop(i,target);}}
   onPointerCancel={cancel} onLostPointerCapture={cancel}
   onClick={()=>{if(suppress.current){suppress.current=false;return;}onPick(i);}}><MathText text={item.label+" = "+item.value} compact/><span aria-hidden="true" className="assembly-grip">⠿</span></button>)}
  {ghost&&<div className="factor-ghost reference" aria-hidden="true" style={{left:Math.max(60,Math.min(window.innerWidth-60,ghost.x)),top:ghost.y}}><MathText text={items[ghost.source].value} compact/></div>}
 </div>;
}
