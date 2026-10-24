const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {build}=require('esbuild'),{JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),out=fs.mkdtempSync(path.join(os.tmpdir(),'derive-keyboard-'));
const tick=()=>new Promise(resolve=>setTimeout(resolve,25));
(async()=>{
 await build({entryPoints:[path.join(root,'keyboard-model.ts')],outfile:path.join(out,'keyboard.cjs'),bundle:true,platform:'node',format:'cjs'});
 await build({entryPoints:[path.join(root,'curriculum.ts')],outfile:path.join(out,'plans.cjs'),bundle:true,platform:'node',format:'cjs'});
 const {makeLearningPlan}=require(path.join(out,'plans.cjs'));
 const {insertMath,nextEntryTarget,earnedShortcuts,REFERENCE_SHORTCUTS}=require(path.join(out,'keyboard.cjs'));
 assert.equal(earnedShortcuts({power:{clean:2}}).length,0);
 assert.deepEqual(earnedShortcuts({power:{clean:3}}).map(s=>s.expression),['2x','3x^2']);
 const allStats=Object.fromEntries([...new Set(REFERENCE_SHORTCUTS.map(s=>s.skill))].map(skill=>[skill,{solved:3,clean:3,history:[true,true,true]}]));
 assert.equal(earnedShortcuts(allStats).length,8);
 assert.equal(insertMath('5',1,1,'2x',true).value,'5(2x)');
 assert.equal(insertMath('2x+□',3,4,'-1/x^2',true).value,'2x+(-1/x^2)');
 assert.equal(insertMath('(2x+3)',5,5,'^(□)').value,'(2x+3)^(□)');
 assert.equal(insertMath('',0,0,'^(□)').value,'(□)^(□)');
 assert.equal(insertMath('1/',2,2,'1/x',true).value,'1/(1/x)');
 assert.deepEqual(insertMath('sqrt(x)',6,6,')'),{value:'sqrt(x)',start:7,end:7});
 assert.equal(insertMath('((2x+3)',6,6,')').value,'((2x+3))');
 assert.equal(insertMath('abc',1,2,'1/x',true).value,'a(1/x)c');
 assert.equal(insertMath('4x^(3)',5,5,'-').value,'4x^(3)-','Le signe moins sort de l’exposant');
 assert.equal(insertMath('x^(10)',5,5,'+').value,'x^(10)+','Un exposant à deux chiffres reste possible');
 assert.equal(insertMath('x^(-2)',5,5,'x').value,'x^(-2)x');
 assert.equal(insertMath('x^(1)',4,4,'0').value,'x^(10)');
 assert.equal(insertMath('e^(2)',4,4,'x').value,'e^(2x)','La composée exponentielle reste saisissable');
 assert.deepEqual(nextEntryTarget(['x^(3)'],0,4,4),{field:0,position:5});
 assert.deepEqual(nextEntryTarget(['e^(2x+3)'],0,7,7),{field:0,position:8});
 assert.deepEqual(nextEntryTarget(['(□)/(□)',''],0,1,2),{field:0,position:5});
 assert.deepEqual(nextEntryTarget(['(4)/(□)',''],0,5,6),{field:1,position:0});
 assert.deepEqual(nextEntryTarget(['','2x'],1,2,2),{field:0,position:0});
 assert.equal(nextEntryTarget(['2x','3'],0,2,2),null);
 assert.equal(nextEntryTarget(['(□)'],0,1,2),null);
 const source=fs.readFileSync(path.join(root,'app.js'),'utf8');
 async function setup(stats={},random=.63){
  const dom=new JSDOM('<!doctype html><div id="root"></div>',{url:'https://keyboard.test',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window,d=w.document;
  w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});w.HTMLElement.prototype.scrollIntoView=function(){};w.scrollBy=()=>{};w.Math.random=()=>random;
  w.localStorage.setItem('derive-lab-progression-v1',JSON.stringify({version:2,xp:90,stats}));
  w.eval(source);await tick();
  const q=s=>d.querySelector(s);
  const click=async el=>{assert.ok(el,'Contrôle présent');assert.ok(!el.disabled,'Contrôle actif : '+el.textContent);el.click();await tick();};
  const button=label=>q('[aria-label="'+label+'"]');
  const key=label=>[...d.querySelectorAll('.keys .key')].find(el=>el.getAttribute('aria-label')===label||el.textContent.trim()===({'x²':'x2'}[label]||label));
  const paste=async (el,text)=>{el.focus();await tick();const e=new w.Event('paste',{bubbles:true,cancelable:true});Object.defineProperty(e,'clipboardData',{value:{getData:()=>text}});el.dispatchEvent(e);await tick();};
  const skill=title=>[...d.querySelectorAll('.skill-item>button:first-child')].find(el=>el.querySelector('strong')?.textContent===title);
  return {dom,w,d,q,click,button,key,paste,skill};
 }
 // Construction d’une puissance, insertion de raccourcis et navigation entre deux réponses.
 {
  const {dom,d,q,click,button,key,skill}=await setup({...allStats,basics:{solved:3,clean:3,history:[true,true,true]},coeff:{solved:3,clean:3,history:[true,true,true]},'sum-pair':{solved:3,clean:3,history:[true,true,true]},sum:{solved:3,clean:3,history:[true,true,true]}});
  await click(q('.notice-stage .primary'));
  assert.equal(button('Ajouter un exposant').textContent,'a□','Un seul carré, placé en exposant');
  assert.equal(button('Insérer une exponentielle').textContent,'e□','Un seul carré pour l’exposant de e');
  assert.equal(d.querySelectorAll('.reference-key').length,6);
  await click(q('.more-shortcuts'));assert.equal(d.querySelectorAll('.reference-key').length,8);
  await click(q('.more-shortcuts'));assert.equal(d.querySelectorAll('.reference-key').length,6);
  let input=q('.math-entry input');
  await click(button('Insérer des parenthèses'));assert.equal(input.value,'(□)');assert.equal(input.selectionStart,1);
  for(const k of ['2','x','+','3'])await click(key(k));
  await click(button('Ajouter un exposant'));assert.equal(input.value,'(2x+3)^(□)');assert.equal(input.selectionStart,8);
  await click(key('5'));assert.equal(input.value,'(2x+3)^(5)');assert.ok(!button('Case suivante').disabled);
  await click(button('Case suivante'));assert.equal(input.selectionStart,input.value.length);assert.ok(button('Case suivante').disabled);
  await click(button('Vider la case'));assert.equal(input.value,'');assert.equal(d.activeElement,input);assert.ok(button('Vider la case').disabled);
  for(const k of ['4','x'])await click(key(k));await click(button('Ajouter un exposant'));await click(key('3'));
  for(const k of ['−','2','x²','+','3','x','+','4'])await click(key(k));
  assert.equal(input.value,'4x^(3)-2x^2+3x+4','Les opérations suivantes reprennent à la ligne principale');
  assert.equal(q('.math-entry-render sup').textContent,'3');await click(button('Vider la case'));
  await click(key('5'));await click(button('Insérer le raccourci 2x'));assert.equal(input.value,'5(2x)');
  await click(button('Vider la case'));await click(button('Insérer le raccourci 1/(2√x)'));assert.equal(input.value,'1/(2sqrt(x))');assert.ok(q('.math-entry-render .math-frac'));
  await click(skill('La règle du produit'));
  const explore=[...d.querySelectorAll('button')].find(b=>b.textContent==='Explorer cet atelier librement');if(explore)await click(explore);
  for(const i of [0,1]){await click(q('[data-identify-source="'+i+'"]'));await click(q('[data-identify-target="'+i+'"]'));}
  await click(q('.identification-stage>.primary'));
  const inputs=[...d.querySelectorAll('.math-entry input')];assert.equal(inputs.length,2);
  await click(button('Case suivante'));assert.equal(d.activeElement,inputs[1]);
  await click(key('5'));await click(button('Case suivante'));assert.equal(d.activeElement,inputs[0]);
  await click(button('Insérer le raccourci 2x'));assert.equal(inputs[0].value,'2x');assert.ok(button('Case suivante').disabled);
  await click(button('Vider la case'));assert.equal(inputs[0].value,'');assert.equal(inputs[1].value,'5');assert.equal(d.activeElement,inputs[0]);
  await click(button('Insérer une fraction'));await click(key('4'));await click(button('Case suivante'));await click(key('x²'));
  assert.equal(inputs[0].value,'(4)/(x^2)');assert.ok(button('Case suivante').disabled);
  dom.window.close();
 }
 // Le troisième succès gagne les touches ; la récompense persiste dans la sauvegarde.
 {
  const {dom,w,d,q,click,skill,paste}=await setup({basics:{solved:3,clean:3,history:[true,true,true]},power:{solved:2,clean:2,history:[true,true]}});
  assert.equal(d.querySelectorAll('.reference-key').length,0);
  await click(skill('Les fonctions puissances'));await click(q('.notice-stage .primary'));
  await paste(q('.math-entry input'),'4x^3');await click(q('.validate-key'));
  assert.ok(q('.success'));assert.equal(d.querySelectorAll('.reference-key').length,2);assert.match(q('.shortcut-reward').textContent,/débloqués/);
  const saved=JSON.parse(w.localStorage.getItem('derive-lab-progression-v1'));assert.equal(saved.stats.power.clean,3);
  const restored=await setup(saved.stats);assert.equal(restored.d.querySelectorAll('.reference-key').length,2);restored.dom.window.close();dom.window.close();
 }
 // C12 : réutiliser les expressions, mais saisir soi-même le moins et le carré.
 for(const [round,random] of [[0,.37],[3,.63],[4,.37],[5,.63],[6,.37],[7,.63]]){
  const previousRandom=Math.random;Math.random=()=>random;const plan=makeLearningPlan('inverse-u',round);Math.random=previousRandom;
  const final=plan.steps[2];
  const {dom,d,q,click,button,key,skill,paste}=await setup({'inverse-u':{solved:round,clean:0,history:[]}},random);
  await click(skill('L’inverse d’une fonction u'));
  const explore=[...d.querySelectorAll('button')].find(b=>b.textContent==='Explorer cet atelier librement');if(explore)await click(explore);
  await click(q('[data-identify-source="0"]'));await click(q('[data-identify-target="0"]'));await click(q('.identification-stage>.primary'));
  await paste(q('.math-entry input'),plan.steps[1].fields[0].expected);await click(q('.validate-key'));
  const inputs=[...d.querySelectorAll('.math-entry input')];assert.equal(inputs.length,2);
  assert.equal(d.querySelectorAll('[data-inverse-source]').length,2);
  if(round===0){await click(q('[data-inverse-source="1"]'));await click(q('[data-inverse-target="0"]'));assert.equal(inputs[0].value,'','Un dépôt incorrect ne remplit pas la fraction');}
  for(const i of [0,1]){await click(q('[data-inverse-source="'+i+'"]'));await click(q('[data-inverse-target="'+i+'"]'));}
  assert.equal(inputs[0].value,'('+final.dragSources[0].value+')','Aucun signe moins ajouté automatiquement');
  assert.equal(inputs[1].value,'('+final.dragSources[1].value+')','Aucun carré ajouté automatiquement');
  await click(q('.validate-key'));assert.equal(q('.success'),null,'Le moins manque encore');assert.match(q('.feedback').textContent,/à revoir/);
  inputs[0].focus();await tick();await click(key('−'));await click(q('.validate-key'));assert.equal(q('.success'),null,'Le carré manque encore');assert.match(q('.feedback').textContent,/au carré/);
  inputs[1].focus();await tick();await click(button('Élever au carré'));await click(q('.validate-key'));
  assert.ok(q('.success'),'Fraction complète validée, difficulté '+round);dom.window.close();
 }
 // Le clavier de Terminale utilise les mêmes templates et les mêmes icônes.
 {
  const {dom,d,q,click,button,key,skill}=await setup(allStats);
  await click([...d.querySelectorAll('.switch button')].find(el=>el.textContent==='Terminale'));await click(skill('Le sinus'));
  const explore=[...d.querySelectorAll('button')].find(b=>b.textContent==='Explorer cet atelier librement');if(explore)await click(explore);
  for(let tries=0;tries<4&&!q('.answer');tries++){
   const formula=q('.specific-rule .primary');if(formula){await click(formula);continue;}
   const hint=[...d.querySelectorAll('.actions button')].find(el=>el.textContent.includes('Un indice'));assert.ok(hint);await click(hint);await click([...d.querySelectorAll('.actions button')].find(el=>el.textContent.includes('Montrer cette étape')));
  }
  assert.ok(q('.answer'));await click(button('Insérer des parenthèses'));await click(key('x'));await click(button('Ajouter un exposant'));await click(key('3'));
  assert.equal(q('.answer').value,'(x)^(3)');await click(button('Vider la case'));assert.equal(q('.answer').value,'');assert.ok(q('.keyboard-action svg'));
  dom.window.close();
 }
 fs.rmSync(out,{recursive:true,force:true});console.log('Clavier validé : exposants, parenthèses, raccourcis gagnés/persistés, insertion, icônes, navigation et Terminale.');
})().catch(error=>{console.error(error);process.exitCode=1;});
