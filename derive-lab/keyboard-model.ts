export type ReferenceShortcut={id:string;skill:string;expression:string;label:string};
export const REFERENCE_SHORTCUTS:ReferenceShortcut[]=[
 {id:"square",skill:"power",expression:"2x",label:"2x"},
 {id:"cube",skill:"power",expression:"3x^2",label:"3x²"},
 {id:"inverse",skill:"inverse",expression:"-1/x^2",label:"−1/x²"},
 {id:"sqrt",skill:"sqrt",expression:"1/(2sqrt(x))",label:"1/(2√x)"},
 {id:"exp",skill:"exp",expression:"e^x",label:"eˣ"},
 {id:"ln",skill:"ln",expression:"1/x",label:"1/x"},
 {id:"sin",skill:"sin",expression:"cos(x)",label:"cos(x)"},
 {id:"cos",skill:"cos",expression:"-sin(x)",label:"−sin(x)"}
];
export const earnedShortcuts=(stats:Record<string,{clean:number}>)=>REFERENCE_SHORTCUTS.filter(s=>(stats[s.skill]?.clean||0)>=3);

// Une expression gagnée reste un facteur entier : 5 puis 2x donne 5(2x).
export function insertMath(value:string,from:number,to:number,text:string,expression=false){
 from=Math.max(0,Math.min(from,value.length));to=Math.max(from,Math.min(to,value.length));
 if(text===")"&&from===to&&value[from]===")"&&(value.match(/\(/g)||[]).length===(value.match(/\)/g)||[]).length)return {value,start:from+1,end:from+1};
 if(text.startsWith("^")&&from===to){while(value[from]===")"){from++;to++;}}
 if(value[from]==="□"&&from===to)to++;
 const left=value.slice(0,from),right=value.slice(to);
 if(text==="^(□)"&&!/[\da-z)]\s*$/i.test(left))text="(□)^(□)";
 if(expression&&(/[\da-z).,/]\s*$/i.test(left)||/^\s*[\da-z(]/i.test(right)||(/^[−-]/.test(text)&&/[+*-]\s*$/.test(left))))text="("+text+")";
 const result=left+text+right,hole=text.indexOf("□"),start=from+(hole<0?text.length:hole);
 return {value:result,start,end:start+(hole<0?0:1)};
}

export function nextEntryTarget(values:string[],active:number,start:number,end:number):{field:number;position:number}|null{
 const value=values[active]||"",holes=Array.from(value.matchAll(/□/g),match=>match.index!);
 const selected=(p:number)=>p>=start&&p<=Math.max(start,end-1);
 const after=holes.find(p=>p>=end&&!selected(p));
 if(after!==undefined)return {field:active,position:after};
 for(let offset=1;offset<values.length;offset++){
  const field=(active+offset)%values.length,candidate=values[field]||"",hole=candidate.indexOf("□");
  if(!candidate.trim()||hole>=0)return {field,position:hole<0?0:hole};
 }
 const before=holes.find(p=>!selected(p));
 return before===undefined?null:{field:active,position:before};
}
