import * as React from "react";
import {makeLearningPlan,joinTerms,type PlanStep} from "./curriculum";
import {sameMath} from "./math-engine";
import {MathText} from "./math-display";
import {MathEntry,MathKeyboard,type EntryHandle} from "./math-entry";
import {RuleAssembly,substitutedRule} from "./rule-assembly";
import {nextEntryTarget,type ReferenceShortcut} from "./keyboard-model";
import {FractionSources} from "./fraction-sources";

function RuleFormula({text}:{text:string}){
 const [left,right]=text.split(" = ");
 return text.startsWith("(g(ax+b))'")?<span className="affine-rule-equation"><MathText text={left}/><MathText text={"= "+right}/></span>:<MathText text={text}/>;
}

function Identification({step,onComplete,onError}:{step:Extract<PlanStep,{kind:"identify"}>;onComplete:()=>void;onError:()=>void}){
 const [selected,setSelected]=React.useState<number|null>(null),[placed,setPlaced]=React.useState<number[]>([]),[message,setMessage]=React.useState("");
 const [ghost,setGhost]=React.useState<{index:number;x:number;y:number}|null>(null),root=React.useRef<HTMLDivElement>(null);
 const drag=React.useRef<{index:number;pointer:number;x:number;y:number;moved:boolean}|null>(null),suppress=React.useRef(false);
 const targetAt=(x:number,y:number)=>{const el=document.elementFromPoint(x,y)?.closest<HTMLElement>('[data-identify-target]');return el&&root.current?.contains(el)?Number(el.dataset.identifyTarget):null;};
 const place=(source:number,target:number)=>{if(placed.includes(target))return;if(source!==target){onError();setMessage("Ce bloc ne correspond pas à cette fonction. Essaie l’autre emplacement.");return;}setPlaced(p=>[...p,target]);setSelected(null);setMessage("Bien placé.");};
 return <div className="identification-stage" ref={root}>
  <div className="rule-banner"><RuleFormula text={step.formula}/></div>
  {step.rewrite&&<div className="rewrite"><span>On réécrit :</span><MathText text={"f(x) = "+step.rewrite}/></div>}
  <p>Glisse chaque bloc sur son étiquette, ou touche le bloc puis sa destination.</p>
  <div className="identify-sources">{step.items.map((item,i)=><button key={i} data-identify-source={i} disabled={placed.includes(i)} aria-label={"Sélectionner "+item.value} aria-pressed={selected===i} className={"identify-source"+(selected===i?" selected":"")}
    onDragStart={e=>e.preventDefault()} onPointerDown={e=>{if(!e.isPrimary||e.button!==0)return;suppress.current=false;setSelected(i);drag.current={index:i,pointer:e.pointerId,x:e.clientX,y:e.clientY,moved:false};e.currentTarget.setPointerCapture(e.pointerId);}}
    onPointerMove={e=>{const d=drag.current;if(!d||d.pointer!==e.pointerId)return;if(Math.hypot(e.clientX-d.x,e.clientY-d.y)>6)d.moved=true;if(d.moved)setGhost({index:i,x:e.clientX,y:e.clientY});}}
    onPointerUp={e=>{const d=drag.current;if(!d)return;const target=d.moved?targetAt(e.clientX,e.clientY):null;suppress.current=d.moved;drag.current=null;setGhost(null);if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);if(target!==null)place(i,target);}}
    onPointerCancel={()=>{drag.current=null;setGhost(null);}} onLostPointerCapture={()=>{drag.current=null;setGhost(null);}}
    onClick={()=>{if(suppress.current){suppress.current=false;return;}setSelected(i);}}><MathText text={placed.includes(i)?item.label:item.value} compact/></button>)}</div>
  <div className="identify-destinations">{step.items.map((item,i)=><button key={i} data-identify-target={i} disabled={placed.includes(i)} aria-label={"Associer "+item.label} className={placed.includes(i)?"filled":""} onClick={()=>selected!==null?place(selected,i):setMessage("Sélectionne d’abord un bloc.")}><MathText text={item.label+(placed.includes(i)?" = "+item.value:"")} compact/>{placed.includes(i)?<span>✓</span>:<small>Déposer ici</small>}</button>)}</div>
  <div className="identify-status" role="status">{message}</div>
  <button className="primary" disabled={placed.length!==step.items.length} onClick={onComplete}>Calculer les dérivées <span>→</span></button>
  {ghost&&<div className="factor-ghost" style={{left:ghost.x,top:ghost.y}}><MathText text={step.items[ghost.index].value} compact/></div>}
 </div>;
}

export function LearningWorkshop({id,round,earned,exploring,unlocks,onComplete,onNext,shortcuts,newlyUnlocked}:{id:string;round:number;earned:number;exploring:boolean;unlocks:string[];onComplete:(final:string,dirty:boolean)=>void;onNext:()=>void;shortcuts:ReferenceShortcut[];newlyUnlocked:ReferenceShortcut[]}){
 const [plan]=React.useState(()=>makeLearningPlan(id,round)),[phase,setPhase]=React.useState(0),[finished,setFinished]=React.useState(false);
 const [answers,setAnswers]=React.useState<string[]>([]),[signs,setSigns]=React.useState<number[]>([]),[active,setActive]=React.useState(0);
 const [cursor,setCursor]=React.useState<[number,number]>([0,0]);
 const [pickedSource,setPickedSource]=React.useState<number|null>(null),[dragOver,setDragOver]=React.useState<number|null>(null);
 const [feedback,setFeedback]=React.useState("");const [hint,setHint]=React.useState(false),[lastWork,setLastWork]=React.useState("");
 const dirty=React.useRef(false),entries=React.useRef<(EntryHandle|null)[]>([]),stage=plan.steps[phase];
 const activeEntry={get current(){return entries.current[active]||null;}};
 const flagError=()=>{dirty.current=true;};
 const changed=(i:number,value:string)=>{setFeedback("");if(stage.kind==="fill"&&stage.layout==="sum"&&/^[−-]/.test(value)){setSigns(s=>{const next=[...s];next[i]=-1;return next;});value=value.slice(1);}setAnswers(a=>{const next=[...a];next[i]=value;return next;});};
 const actual=(i:number)=>stage.kind==="fill"&&stage.layout==="sum"&&signs[i]===-1?"-("+(answers[i]||"")+")":answers[i]||"";
 function advance(work=""){
  if(work)setLastWork(work);
  if(phase===plan.steps.length-1){setFinished(true);onComplete(plan.final,dirty.current);return;}
  setPhase(phase+1);setAnswers([]);setSigns([]);setActive(0);setCursor([0,0]);setPickedSource(null);setDragOver(null);setFeedback("");setHint(false);entries.current=[];
 }
 function validate(){
  if(stage.kind!=="fill")return;
  for(let i=0;i<stage.fields.length;i++){
   const field=stage.fields[i],value=actual(i),raw=value.replace(/\^\(([+-]?\d+)\)/g,"^$1").replace(/²/g,"^2");
   if(field.form==="expanded"&&(/[()]/.test(raw)||!raw.includes("x"))){flagError();setFeedback("Développe d’abord les produits, sans parenthèses, en conservant les termes en x. Tu réduiras ensuite.");setActive(i);return;}
   if(field.form==="preserve-square"&&!/\)\s*\^2$/.test(raw)){flagError();setFeedback("Conserve u(x) entre parenthèses au carré ; ne développe pas le dénominateur.");setActive(i);return;}
   if(field.form==="reduced-poly"){
    const terms=raw.replace(/[ *]/g,"").match(/[+-]?[^+-]+/g)||[],degrees=terms.map(t=>t.includes("x")?Number(t.split("^")[1]||1):0);
    if(new Set(degrees).size!==degrees.length){flagError();setFeedback("Regroupe les termes de même degré : il doit rester un seul terme par puissance de x.");setActive(i);return;}
   }
   if(!sameMath(value,field.expected)){flagError();setFeedback("Le bloc « "+field.label+" » est à revoir. "+stage.hint);setActive(i);entries.current[i]?.focus(stage.dragSources&&i===0&&!/^[−-]/.test(value)?0:undefined);return;}
  }
  let result=stage.layout==="sum"?joinTerms(stage.fields.map((_,i)=>signs[i]===-1?"-"+answers[i]:answers[i])):stage.layout==="fraction"?`(${answers[0]})/(${answers[1]})`:stage.after?.startsWith("/")?`(${answers[0]})${stage.after}`:answers[0];
  advance(stage.fields.length>1&&!stage.layout?stage.fields.map((field,i)=>field.label.replace(/′/g,"'")+" = "+answers[i]).join(" ; "):(stage.before||"f'(x) = ")+result+(stage.after&&!stage.after.startsWith("/")?stage.after:""));
 }
 React.useEffect(()=>{if(stage.kind==="fill")entries.current[0]?.focus();},[phase]);
 const ready=stage.kind==="fill"&&stage.fields.every((_,i)=>answers[i]?.trim()&&!answers[i].includes("□"));
 const signToggle=(i:number)=>setSigns(s=>{const next=[...s];next[i]=s[i]===-1?1:-1;return next;});
 const target=stage.kind==="fill"?nextEntryTarget(stage.fields.map((_,i)=>answers[i]||""),active,...cursor):null;
 const navigate=()=>{if(!target)return false;setActive(target.field);setCursor([target.position,target.position+((answers[target.field]||"")[target.position]==="□"?1:0)]);entries.current[target.field]?.focus(target.position);return true;};
 const clearActive=()=>{setSigns(s=>{const next=[...s];next[active]=1;return next;});activeEntry.current?.clear();};
 const entry=(i:number)=>stage.kind==="fill"?<MathEntry ref={el=>{entries.current[i]=el;}} value={answers[i]||""} label={stage.fields[i].label} active={active===i} onChange={value=>changed(i,value)} onActivate={()=>{setActive(i);setCursor(entries.current[i]?.selection()||[0,0]);}} onCursorChange={setCursor} onNavigate={navigate} onSubmit={validate}/>:null;
 const placeSource=(source:number,destination:number)=>{
  if(stage.kind!=="fill"||!stage.dragSources?.[source])return;
  if(source!==destination){flagError();setFeedback(destination===0?"Place u′(x) au numérateur.":"Place u(x) au dénominateur.");return;}
  const value="("+stage.dragSources[source].value+")",old=answers[destination]||"";
  const placed=destination===0?(/^[−-]/.test(old)?"-":"")+value:value+(/\)\^(?:2|\(2\))$/.test(old)?"^2":"");
  setPickedSource(null);setActive(destination);entries.current[destination]?.replace(placed,destination===0?0:placed.length);
 };
 const fractionEntry=(i:number)=>stage.kind==="fill"&&stage.dragSources?<span className={"inverse-target"+(pickedSource!==null?" ready":"")+(dragOver===i?" over":"")} data-inverse-target={i} onClick={()=>{if(pickedSource!==null)placeSource(pickedSource,i);}}>
  {entry(i)}{!answers[i]&&<button className="inverse-drop-hint" type="button" aria-label={i===0?"Déposer u prime au numérateur":"Déposer u au dénominateur"} onClick={e=>{e.stopPropagation();if(pickedSource!==null)placeSource(pickedSource,i);else setFeedback("Sélectionne une carte, puis touche sa destination.");}}>Déposer ici</button>}
 </span>:entry(i);
 const context=plan.steps.find((step):step is Extract<PlanStep,{kind:"notice"|"identify"}>=>step.kind==="notice"||step.kind==="identify");
 const headerStage=!finished&&(stage.kind==="notice"||stage.kind==="identify");
 const title=<div className="step-title"><span className="number">{phase+1}</span>{stage.title}</div>;
 return <div className="workshop-layout">
 <section className="panel board learning-board" aria-label="Zone de dérivation">
  <div className="function-area workshop-header">
   <div className="function-overview"><div className="function-meta"><span className="overline">Fonction à dériver</span><span className="domain">{plan.domain}</span></div><div className="original"><MathText text={"f(x) = "+plan.expression} compact/></div><p className="difficulty">{plan.difficulty}</p></div>
   {context&&<div className="header-context" aria-label={headerStage&&stage.kind==="identify"?"Identification de la fonction":"Règle de dérivation"}>
    {headerStage?<> {title}
     {stage.kind==="notice"&&<div className="notice-stage"><div className="rule-banner"><MathText text={stage.formula}/></div><p>{stage.explanation}</p><button className="primary" onClick={()=>advance()}>Utiliser cette règle <span>→</span></button></div>}
     {stage.kind==="identify"&&<Identification key={phase} step={stage} onComplete={()=>advance()} onError={flagError}/>}
    </>:<><div className="overline">{context.kind==="identify"?"Forme identifiée":"La règle"}</div><div className="rule-banner"><RuleFormula text={context.formula}/></div>{context.kind==="identify"&&<div className="identified-summary">{context.items.map((item,i)=><MathText key={i} text={item.label+" = "+item.value} compact/>)}</div>}</>}
   </div>}
  </div>
  <div className="learning-steps">
   <div className="stepper" aria-label={"Étape "+(phase+1)+" sur "+plan.steps.length}>{plan.steps.map((_,i)=><span key={i} className={"stepdot "+(finished||i<phase?"past":i===phase?"current":"")}/>)}<span className="stepnumber">{phase+1} / {plan.steps.length}</span></div>
   {finished?<div className="success" role="status"><span className="earned">{exploring?"EXPLORATION":"+ "+earned+" XP"}</span><h2>Dérivée reconstruite.</h2><div className="result"><MathText text={"f'(x) = "+plan.final} compact/></div><p>{dirty.current?"Reprends un autre exemple pour consolider la méthode.":"Toutes les étapes sont justes. Continue ton parcours."}</p><button className="primary" onClick={onNext}>Fonction suivante <span>→</span></button>{unlocks.length>0&&<p className="unlock-message">Nouveaux ateliers : {unlocks.join(", ")}.</p>}</div>:<>
    {!headerStage&&title}
    {lastWork&&<details className="previous-work"><summary>Voir le calcul précédent</summary><MathText text={lastWork} compact/></details>}
    {stage.kind==="assemble"&&<RuleAssembly key={phase} pair={stage.pair} onComplete={()=>advance("f'(x) = "+substitutedRule(stage.pair))} onError={flagError}/>}
    {stage.kind==="fill"&&<div className="response-layout">
      <div className="response-content">
       {stage.dragSources&&<><FractionSources items={stage.dragSources} picked={pickedSource} onPick={setPickedSource} onDrop={placeSource} onOver={setDragOver}/><p className="inverse-instruction">Glisse les expressions dans la fraction, ou sélectionne une carte puis sa case. Ajoute toi-même le signe moins et le carré avec le clavier.</p></>}
       {stage.layout==="sum"?<>
        <div className="reference-equation"><MathText text={"f'(x) = "+stage.references!.map(s=>"("+s+")'").join(" + ")} compact/></div>
        <div className="sum-response"><MathText text="f'(x) = "/>{stage.fields.map((field,i)=><div className="sum-term" key={i}>
         {id==="sum-pair"&&<span className="sum-field-label"><MathText text={field.label+" = "}/></span>}
         <div className="signed-answer"><button className="sign-switch" aria-label={"Signe du terme "+(i+1)} onClick={()=>signToggle(i)}>{signs[i]===-1?"−":"+"}</button>{entry(i)}</div>
        </div>)}</div>
       </>:stage.layout==="fraction"?<div className="fraction-response"><MathText text={stage.before||"f'(x) = "}/><span className="math-frac editable-fraction"><span className="math-numerator">{fractionEntry(0)}</span><span className="math-denominator">{fractionEntry(1)}</span></span></div>:stage.fields.length>1?<div className="parallel-response">{stage.fields.map((field,i)=><div className="derivative-field" key={i}><div className="derivative-reference"><MathText text={field.label.replace(/′/g,"'")+" = "+(stage.references?.[i]?"("+stage.references[i]+")'":"")} compact/></div>{entry(i)}</div>)}</div>:<div className="single-response"><MathText text={(stage.before||"f'(x) = ")+"□"+(stage.after||"")} compact slot={entry(0)}/></div>}
       <p className="entry-help">Touche la case à compléter, puis utilise le clavier mathématique.</p>
       {feedback&&<div className="feedback" role="status">{feedback}</div>}
       <button className="textbtn" onClick={()=>{dirty.current=true;setHint(!hint);}}>✧ Un indice</button>
       {hint&&<p className="hintbox">{stage.hint}</p>}
      </div>
    </div>}
   </>}
  </div>
 </section>
 <aside className="keyboard-dock"><MathKeyboard entry={activeEntry} enabled={!finished&&stage.kind==="fill"} onValidate={validate} canValidate={!!ready&&!finished} onSign={()=>{if(stage.kind==="fill"&&stage.layout==="sum")signToggle(active);else activeEntry.current?.toggleSign();}} onClear={clearActive} canClear={!!answers[active]||signs[active]===-1} onNext={navigate} canNext={!!target} shortcuts={shortcuts} newlyUnlocked={newlyUnlocked}/></aside>
 </div>;
}
