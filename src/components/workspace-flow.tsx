'use client';
import {useState} from 'react';
import {GitBranch,Plus,Trash2,Link2,MousePointer2} from 'lucide-react';
export type FlowNode={id:string;label:string;x:number;y:number;type?:'step'|'decision'|'start'};
export type FlowEdge={id:string;source:string;target:string};
export type FlowData={nodes:FlowNode[];edges:FlowEdge[]};
export function WorkspaceFlow({value,onChange,readOnly=false}:{value:FlowData;onChange:(x:FlowData)=>void;readOnly?:boolean}){
 const nodes=value.nodes||[];const edges=value.edges||[];
 const [text,setText]=useState('');const [source,setSource]=useState('');const [target,setTarget]=useState('');const [selected,setSelected]=useState<string|null>(null);
 const [drag,setDrag]=useState<{id:string;left:number;top:number;clientX:number;clientY:number}|null>(null);
 function add(){if(!text.trim()||nodes.length>=80)return;const node:FlowNode={id:crypto.randomUUID(),label:text.trim().slice(0,120),x:65+(nodes.length%5)*205,y:90+Math.floor(nodes.length/5)*110,type:'step'};onChange({...value,nodes:[...nodes,node]});setText('')}
 function connect(){if(!source||!target||source===target||edges.length>=150||edges.some(e=>e.source===source&&e.target===target))return;onChange({...value,edges:[...edges,{id:crypto.randomUUID(),source,target}]});setSource('');setTarget('')}
 function updateNode(id:string,patch:Partial<FlowNode>){onChange({...value,nodes:nodes.map(n=>n.id===id?{...n,...patch}:n)})}
 function remove(){if(!selected)return;onChange({...value,nodes:nodes.filter(n=>n.id!==selected),edges:edges.filter(e=>e.source!==selected&&e.target!==selected)});setSelected(null)}
 return <div className="space-y-4">
  {!readOnly&&<div className="panel p-4 flex flex-wrap gap-3 items-end">
   <label className="flex-1 min-w-40"><span className="label">Novo bloco</span><input className="input" value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')add()}} maxLength={120} placeholder="Ex.: Aprovar orçamento"/></label>
   <button className="btn btn-primary" disabled={!text.trim()||nodes.length>=80} onClick={add}><Plus size={16}/> Adicionar</button>
   <div className="w-px h-10 bg-[var(--edge)] hidden lg:block"/>
   <label><span className="label">De</span><select className="input !w-36" value={source} onChange={e=>setSource(e.target.value)}><option value="">Origem</option>{nodes.map(n=><option key={n.id} value={n.id}>{n.label}</option>)}</select></label>
   <label><span className="label">Para</span><select className="input !w-36" value={target} onChange={e=>setTarget(e.target.value)}><option value="">Destino</option>{nodes.map(n=><option key={n.id} value={n.id}>{n.label}</option>)}</select></label>
   <button className="btn" onClick={connect} disabled={!source||!target||source===target}><Link2 size={16}/> Conectar</button>
   <button className="btn" disabled={!selected} onClick={remove} title="Excluir nó selecionado"><Trash2 size={16}/></button>
  </div>}
  <div className="flow-scroll"><div className="flow-board">
   <svg aria-hidden="true" className="absolute inset-0 pointer-events-none" width="1100" height="620">
     <defs><marker id="gato-flow-arrow" markerWidth="9" markerHeight="9" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#a4a5e9"/></marker></defs>
     {edges.map(e=>{const a=nodes.find(n=>n.id===e.source),b=nodes.find(n=>n.id===e.target);if(!a||!b)return null;const x1=a.x+176,y1=a.y+35,x2=b.x,y2=b.y+35;return <path key={e.id} d={`M ${x1} ${y1} C ${x1+70} ${y1}, ${x2-70} ${y2}, ${x2} ${y2}`} stroke="#a4a5e9" strokeWidth="2" fill="none" markerEnd="url(#gato-flow-arrow)"/>})}
   </svg>
   {nodes.map(n=><div key={n.id} className={'flow-node '+(selected===n.id?'selected':'')} style={{left:n.x,top:n.y,touchAction:'none'}} onClick={()=>setSelected(n.id)}
    onPointerDown={e=>{if(readOnly)return;e.currentTarget.setPointerCapture(e.pointerId);setDrag({id:n.id,left:n.x,top:n.y,clientX:e.clientX,clientY:e.clientY});setSelected(n.id)}}
    onPointerMove={e=>{if(!drag||drag.id!==n.id||readOnly)return;updateNode(n.id,{x:Math.max(5,Math.min(890,drag.left+e.clientX-drag.clientX)),y:Math.max(5,Math.min(500,drag.top+e.clientY-drag.clientY))})}}
    onPointerUp={()=>setDrag(null)}>
    <div className="flex items-center gap-2"><span className="moon-accent"><GitBranch size={13}/></span><strong className="text-sm break-words">{n.label}</strong></div>
    {!readOnly&&selected===n.id&&<div className="mt-2 flex justify-between items-center"><small className="muted">Arraste para mover</small><button className="text-xs moon-accent" onPointerDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();const s=window.prompt('Nome do bloco',n.label);if(s?.trim())updateNode(n.id,{label:s.trim().slice(0,120)})}}>Renomear</button></div>}
   </div>)}
  </div></div>
  <p className="muted text-xs flex items-center gap-1"><MousePointer2 size={13}/> Arraste os nós para organizar. Crie conexões escolhendo origem e destino. Todas as posições são salvas na página.</p>
 </div>
}
