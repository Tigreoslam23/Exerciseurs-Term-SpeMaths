const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {build}=require('esbuild');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),out=fs.mkdtempSync(path.join(os.tmpdir(),'derive-tests-'));
const tick=()=>new Promise(resolve=>setTimeout(resolve,20));
(async()=>{
 await build({entryPoints:[path.join(root,'curriculum.ts')],outfile:path.join(out,'plans.cjs'),bundle:true,platform:'node',format:'cjs'});
 await build({entryPoints:[path.join(root,'math-engine.ts')],outfile:path.join(out,'math.cjs'),bundle:true,platform:'node',format:'cjs'});
 const {makeLearningPlan,FIRST_SKILLS}=require(path.join(out,'plans.cjs')),{mathValue,sameMath}=require(path.join(out,'math.cjs'));
 assert.equal(FIRST_SKILLS.length,13);let functions=0;
 for(const skill of FIRST_SKILLS)for(let round=0;round<40;round++){
  const plan=makeLearningPlan(skill.id,round);let checked=0;
  for(const x of [-30,-20,-15,-10.13,-8.17,-2.43,-1.13,.29,.71,1.13,1.79,2.43,4.61,8.17,10.13,15,20,30]){
   try{
    const h=1e-5,actual=(mathValue(plan.expression,x+h)-mathValue(plan.expression,x-h))/(2*h),expected=mathValue(plan.final,x);
    assert.ok(Math.abs(actual-expected)<=2e-4*Math.max(1,Math.abs(expected)),skill.id+' '+plan.expression+' : '+plan.final);
    checked++;
   }catch(error){if(error.code==='ERR_ASSERTION')throw error;}
  }
  assert.ok(checked>=2,plan.expression);assert.ok(sameMath(plan.final,plan.final),'Domaine utilisable : '+plan.expression);
  if(skill.id==='quotient')assert.ok(!sameMath(plan.final,'0'),'Quotient non constant');
  if(skill.id==='power'&&round<9)assert.equal(plan.expression,'x^'+(round+2));
  if(skill.id==='inverse'&&round===0)assert.equal(plan.expression,'2/x');
  functions++;
 }
 let source=fs.readFileSync(path.join(root,'app.tsx'),'utf8').split('const rootElement=document.getElementById("root");')[0];
 await build({stdin:{contents:source+'\nexport {readProgress,SKILLS};',resolveDir:root,loader:'tsx'},outfile:path.join(out,'progress.cjs'),bundle:true,platform:'node',format:'cjs'});
 const {readProgress,SKILLS}=require(path.join(out,'progress.cjs'));
 const old={version:1,xp:180,stats:{constant:{solved:4,clean:3,history:[true,false,true,true]},linear:{solved:3,clean:3,history:[true,true,true]},coeff:{solved:2,clean:1,history:[true,false]},negative:{solved:3,clean:2,history:[true,true,false]}}};
 global.localStorage={getItem:()=>JSON.stringify(old)};const migrated=readProgress();
 assert.equal(migrated.version,2);assert.equal(migrated.xp,180);assert.equal(migrated.stats.basics.solved,7);assert.equal(migrated.stats.coeff.solved,5);
 global.localStorage={getItem:()=>JSON.stringify(migrated)};assert.deepEqual(readProgress(),migrated);delete global.localStorage;
 assert.ok(SKILLS.every(s=>s.deps.every(d=>SKILLS.some(k=>k.id===d))));
 console.log(functions+' fonctions vérifiées ; migration des résultats et prérequis validés.');

 const dom=new JSDOM('<!doctype html><div id="root"></div>',{url:'https://example.test',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window,d=w.document;
 w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});w.HTMLElement.prototype.scrollIntoView=function(){};w.scrollBy=()=>{};w.Math.random=()=>.63;
 const q=s=>d.querySelector(s);
 async function click(el){assert.ok(el,'Élément présent');assert.ok(!el.disabled,'Élément activé : '+el.textContent);el.click();await tick();}
 async function paste(el,text){el.focus();await tick();const event=new w.Event('paste',{bubbles:true,cancelable:true});Object.defineProperty(event,'clipboardData',{value:{getData:()=>text}});el.dispatchEvent(event);await tick();}
 w.eval(fs.readFileSync(path.join(root,'app.js'),'utf8'));await tick();
 // Le bouton info insère bien le panneau dans la liste, sans colonne permanente.
 assert.equal(q('.right'),null);await click(q('.skill-info-button'));assert.ok(q('.selected').parentElement.querySelector('.inline-skill-info'));await click(q('.skill-info-button'));
 const scale=q('.text-scale');await click(scale);assert.match(scale.textContent,/110/);await click(scale);assert.match(scale.textContent,/120/);
 for(const skill of FIRST_SKILLS){
  const nav=[...d.querySelectorAll('.skill-item>button:first-child')].find(b=>b.querySelector('strong')?.textContent===skill.title);await click(nav);
  const explore=[...d.querySelectorAll('button')].find(b=>b.textContent==='Explorer cet atelier librement');if(explore)await click(explore);
  const originalRandom=Math.random;Math.random=()=>.63;const plan=makeLearningPlan(skill.id,0);Math.random=originalRandom;
  for(const step of plan.steps){
   if(step.kind==='notice'){await click(q('.notice-stage .primary'));continue;}
   if(step.kind==='identify'){
    for(let i=0;i<step.items.length;i++){await click(q('[data-identify-source="'+i+'"]'));await click(q('[data-identify-target="'+i+'"]'));}
    await click(q('.identification-stage>.primary'));continue;
   }
   if(step.kind==='assemble'){
    for(const [source,target] of [['du','first-du'],['v','first-v'],['u','second-u'],['dv','second-dv'],...(step.pair.operation==='quotient'?[['v','denominator-v']]:[])]){await click(q('[data-assembly-source="'+source+'"]'));await click(q('[data-assembly-target="'+target+'"]'));}
    await click(q('.validate-assembly'));continue;
   }
   const inputs=[...d.querySelectorAll('.math-entry input')];assert.equal(inputs.length,step.fields.length);
   assert.ok(inputs.every(input=>input.readOnly&&input.inputMode==='none'));
   if(skill.id==='basics'){
    await click(q('[aria-label="Insérer une fraction"]'));assert.equal(inputs[0].value,'(□)/(□)');assert.equal(inputs[0].selectionStart,1);
    await click([...d.querySelectorAll('.keys button')].find(b=>b.textContent.trim()==='6'));assert.equal(inputs[0].value,'(6)/(□)');
    await click([...d.querySelectorAll('button')].find(b=>b.textContent==='Case suivante'));
    await click(q('[aria-label="Insérer une racine carrée"]'));assert.equal(inputs[0].value,'(6)/(sqrt(□))');
    assert.ok(q('.math-entry-render .radicand'));
    await click([...d.querySelectorAll('button')].find(b=>b.textContent==='Vider la case'));
    await click(q('[aria-label="Insérer une fraction"]'));
    await click([...d.querySelectorAll('.keys button')].find(b=>b.textContent.trim()==='6'));
    await click([...d.querySelectorAll('button')].find(b=>b.textContent==='Case suivante'));
    for(const key of ['(','2','x','+','3',')'])await click([...d.querySelectorAll('.keys button')].find(b=>b.textContent.trim()===key));
    await click(q('[aria-label="Élever au carré"]'));
    assert.ok(sameMath(inputs[0].value,'6/(2x+3)^2'),'Saisie d’un dénominateur affine au carré');
    await click([...d.querySelectorAll('button')].find(b=>b.textContent==='Vider la case'));
    await click(q('[aria-label="Changer le signe"]'));assert.equal(inputs[0].value,'-');
    await click(q('[aria-label="Insérer une fraction"]'));assert.equal(inputs[0].value,'-(□)/(□)');
    assert.equal(inputs[0].selectionStart,2,'Le signe ne déplace pas la saisie hors du numérateur');
    await click([...d.querySelectorAll('button')].find(b=>b.textContent==='Vider la case'));
   }
   for(let i=0;i<step.fields.length;i++)await paste(inputs[i],step.fields[i].expected);
   assert.ok(!q('.math-keyboard .validate-key').disabled,'Réponse complète : '+skill.id);
   await click(q('.math-keyboard .validate-key'));
   assert.equal(q('.learning-steps .feedback'),null,'Validation : '+skill.id+' '+step.title+' '+q('.feedback')?.textContent);
  }
  assert.ok(q('.learning-board .success'),'Parcours terminé : '+skill.id);
  assert.ok(q('.learning-board .result [role="math"]'));
 }
 dom.window.close();console.log('Les 13 parcours complets, champs simultanés, fractions, racines, signes et contrôles d’interface sont validés.');
 fs.rmSync(out,{recursive:true,force:true});
})().catch(error=>{console.error(error);process.exitCode=1;});
