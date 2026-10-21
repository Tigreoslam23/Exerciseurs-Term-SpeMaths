import * as React from "react";
import {MathText} from "./math-display";

export type AssemblyPair={operation:"product"|"quotient";u:string;v:string;du:string;dv:string};
type Role="u"|"du"|"v"|"dv";
type Target={id:string;role:Role;description:string};
const labels:Record<Role,string>={u:"u",du:"u'",v:"v",dv:"v'"};
const targets:Target[]=[
  {id:"first-du",role:"du",description:"u prime dans le premier terme"},
  {id:"first-v",role:"v",description:"v dans le premier terme"},
  {id:"second-u",role:"u",description:"u dans le second terme"},
  {id:"second-dv",role:"dv",description:"v prime dans le second terme"},
  {id:"denominator-v",role:"v",description:"v au dénominateur"}
];

// La formule appliquée conserve les groupements jusqu'à sa simplification.
export function substitutedRule(pair:AssemblyPair):string{
  const first=`(${pair.du})*(${pair.v})`,second=`(${pair.u})*(${pair.dv})`;
  return pair.operation==="quotient"?`(${first}-${second})/(${pair.v})^2`:`${first}+${second}`;
}

export function RuleAssembly({pair,onComplete,onError}:{pair:AssemblyPair;onComplete:()=>void;onError:()=>void}){
  const [picked,setPicked]=React.useState<Role|null>(null);
  const [placed,setPlaced]=React.useState<Record<string,boolean>>({});
  const [over,setOver]=React.useState<string|null>(null);
  const [ghost,setGhost]=React.useState<{role:Role;x:number;y:number}|null>(null);
  const [message,setMessage]=React.useState<{good:boolean;text:string}|null>(null);
  const root=React.useRef<HTMLDivElement>(null);
  const drag=React.useRef<{role:Role;pointerId:number;startX:number;startY:number;x:number;y:number;moved:boolean}|null>(null);
  const frame=React.useRef<number|null>(null);
  const suppressClick=React.useRef(false);
  const required=pair.operation==="quotient"?targets:targets.slice(0,4);
  const count=required.filter(target=>placed[target.id]).length;
  const ready=count===required.length;

  function cancel(){
    drag.current=null;setGhost(null);setOver(null);
    if(frame.current!==null)cancelAnimationFrame(frame.current);
    frame.current=null;
  }
  React.useEffect(()=>{
    const escape=(event:KeyboardEvent)=>{if(event.key==="Escape"){cancel();setPicked(null);}};
    window.addEventListener("keydown",escape);
    return()=>{window.removeEventListener("keydown",escape);if(frame.current!==null)cancelAnimationFrame(frame.current);};
  },[]);

  function targetAt(x:number,y:number){
    const el=document.elementFromPoint(x,y)?.closest<HTMLElement>("[data-assembly-target]");
    return el&&root.current?.contains(el)?el.dataset.assemblyTarget:null;
  }
  function scrollAtEdge(){
    if(frame.current!==null)return;
    const tick=()=>{
      frame.current=null;
      const active=drag.current;
      if(!active?.moved)return;
      const delta=active.y<65?-12:active.y>window.innerHeight-65?12:0;
      if(!delta)return;
      window.scrollBy(0,delta);setOver(targetAt(active.x,active.y));
      frame.current=requestAnimationFrame(tick);
    };
    frame.current=requestAnimationFrame(tick);
  }
  function place(role:Role,id:string){
    const target=required.find(target=>target.id===id);
    if(!target||placed[id])return;
    if(role!==target.role){
      onError();setMessage({good:false,text:"Cet emplacement attend "+labels[target.role].replace("'","′")+". Tu peux corriger ton dépôt."});return;
    }
    setPlaced(previous=>({...previous,[id]:true}));setPicked(null);
    setMessage({good:true,text:count+1===required.length?"La formule est reconstruite. Tu peux maintenant développer et simplifier.":"Bien placé. Complète les autres emplacements."});
  }
  function source(role:Role){
    return <button className={"uv-fixed assembly-source"+(picked===role?" selected":"")} data-assembly-source={role}
      aria-label={"Sélectionner "+labels[role].replace("'"," prime")+" : "+pair[role]} aria-pressed={picked===role}
      onDragStart={event=>event.preventDefault()}
      onPointerDown={event=>{
        if(!event.isPrimary||event.button!==0)return;
        suppressClick.current=false;setPicked(role);setMessage(null);
        drag.current={role,pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,x:event.clientX,y:event.clientY,moved:false};
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={event=>{
        const active=drag.current;
        if(!active||active.pointerId!==event.pointerId)return;
        active.x=event.clientX;active.y=event.clientY;
        if(Math.hypot(active.x-active.startX,active.y-active.startY)>6)active.moved=true;
        if(active.moved){setGhost({role,x:active.x,y:active.y});setOver(targetAt(active.x,active.y));scrollAtEdge();}
      }}
      onPointerUp={event=>{
        const active=drag.current;
        if(!active||active.pointerId!==event.pointerId)return;
        const destination=active.moved?targetAt(event.clientX,event.clientY):null;
        suppressClick.current=active.moved;cancel();
        if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
        if(destination)place(active.role,destination);
      }}
      onPointerCancel={cancel} onLostPointerCapture={cancel}
      onClick={()=>{if(suppressClick.current){suppressClick.current=false;return;}setPicked(role);setMessage(null);}}>
      <MathText text={pair[role]} compact/><span className="assembly-grip" aria-hidden="true">⠿</span>
    </button>;
  }
  function slot(id:string){
    const target=targets.find(target=>target.id===id)!,filled=placed[id],value=pair[target.role];
    const grouped=/[+-]/.test(value.slice(1))||value.startsWith("-");
    return <button className={"assembly-slot"+(filled?" filled":"")+(picked&&!filled?" ready":"")+(over===id?" over":"")}
      data-assembly-target={id} disabled={filled} aria-label={"Déposer "+target.description}
      onClick={()=>{if(picked)place(picked,id);else setMessage({good:true,text:"Sélectionne une boîte du tableau, puis touche sa place dans la formule."});}}>
      <MathText text={filled?(grouped?"("+value+")":value):labels[target.role]} compact/>
      {!filled&&<span className="assembly-drop-hint">Déposer</span>}
    </button>;
  }
  const first=<span className="assembly-term">{slot("first-du")}<MathText text=" × "/>{slot("first-v")}</span>;
  const second=<span className="assembly-term"><MathText text={pair.operation==="quotient"?" − ":" + "}/>{slot("second-u")}<MathText text=" × "/>{slot("second-dv")}</span>;
  return <div className="rule-assembly" ref={root}>
    <div className="uv-workshop">
      <div className="uv-rule"><span>Règle du {pair.operation==="quotient"?"quotient":"produit"}</span><MathText text={pair.operation==="quotient"?"(u/v)' = (u'v-uv')/v^2":"(uv)' = u'v+uv'"}/></div>
      {([['u','du'],['v','dv']] as Role[][]).map(([role,derivative])=><div className="uv-row" key={role}>
        <div className="uv-function"><MathText text={labels[role]+"(x) = "}/>{source(role)}</div>
        <div className="uv-derivative"><MathText text={labels[derivative]+"(x) = "}/>{source(derivative)}</div>
      </div>)}
      <p className="assembly-help">Glisse les boîtes du tableau dans la formule, ou sélectionne une boîte puis sa destination. Chaque boîte peut servir plusieurs fois.</p>
    </div>
    <div className="assembly-equation" aria-label="Formule à reconstruire">
      <div className="assembly-prefix"><MathText text="f'(x) = "/></div>
      {pair.operation==="quotient"?<div className="assembly-fraction"><div className="assembly-numerator">{first}{second}</div><div className="assembly-denominator">{slot("denominator-v")}<sup>2</sup></div></div>:<div className="assembly-product">{first}{second}</div>}
    </div>
    <div className="assembly-progress" aria-live="polite">{count} / {required.length} emplacements complétés</div>
    {message&&<div role="status" className={"feedback"+(message.good?" good":"")}>{message.text}</div>}
    <div className="apply-under"><button className="primary validate-assembly" disabled={!ready} onClick={onComplete}>Développer et simplifier <span>→</span></button></div>
    {ghost&&<div className="factor-ghost reference" aria-hidden="true" style={{left:Math.max(60,Math.min(window.innerWidth-60,ghost.x)),top:ghost.y}}><MathText text={pair[ghost.role]} compact/></div>}
  </div>;
}
