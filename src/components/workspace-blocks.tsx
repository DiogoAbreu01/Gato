'use client';
import {useState} from 'react';
import {Plus,Trash2,ArrowDown,ArrowUp,CheckSquare,Heading1,Link2,List,Quote,AlignLeft,Minus} from 'lucide-react';
export type BlockKind='paragraph'|'heading'|'todo'|'bullet'|'quote'|'divider'|'link';
export type WorkspaceBlock={id:string;type:BlockKind;text:string;checked?:boolean};
const kinds:{type:BlockKind;label:string;icon:typeof Plus}[]=[
 {type:'paragraph',label:'Texto',icon:AlignLeft},{type:'heading',label:'Título',icon:Heading1},{type:'todo',label:'Checklist',icon:CheckSquare},
 {type:'bullet',label:'Lista',icon:List},{type:'quote',label:'Citação',icon:Quote},{type:'divider',label:'Divisor',icon:Minus},{type:'link',label:'Link',icon:Link2}
];
export function WorkspaceBlocks({blocks,onChange,readOnly=false}:{blocks:WorkspaceBlock[];onChange:(v:WorkspaceBlock[])=>void;readOnly?:boolean}){
 const [chooser,setChooser]=useState<number|null>(null);
 function add(type:BlockKind,index:number){const b:WorkspaceBlock={id:crypto.randomUUID(),type,text:'',...(type==='todo'?{checked:false}:{})};onChange([...blocks.slice(0,index),b,...blocks.slice(index)]);setChooser(null)}
 function update(id:string,patch:Partial<WorkspaceBlock>){onChange(blocks.map(b=>b.id===id?{...b,...patch}:b))}
 function move(i:number,delta:number){const target=i+delta;if(target<0||target>=blocks.length)return;const a=[...blocks];[a[i],a[target]]=[a[target],a[i]];onChange(a)}
 return <div className="workspace-block-editor">
  {blocks.map((b,i)=><div className="workspace-block-row" key={b.id}><div className="block-actions">{!readOnly&&<><button title="Inserir abaixo" onClick={()=>setChooser(chooser===i+1?null:i+1)}><Plus size={14}/></button><button title="Mover acima" onClick={()=>move(i,-1)} disabled={i===0}><ArrowUp size={13}/></button><button title="Mover abaixo" onClick={()=>move(i,1)} disabled={i===blocks.length-1}><ArrowDown size={13}/></button><button title="Remover bloco" onClick={()=>onChange(blocks.filter(x=>x.id!==b.id))}><Trash2 size={13}/></button></>}</div>
   <div className={'block-inner block-'+b.type}>
    {b.type==='divider'?<hr className="my-4" style={{borderColor:'var(--edge)'}}/>:
     b.type==='link'?<div className="flex items-center gap-3"><Link2 size={17} className="moon-accent"/>{readOnly?<a className="moon-accent underline" href={/^https?:\/\//.test(b.text)?b.text:'#'} target="_blank" rel="noopener noreferrer">{b.text||'Link'}</a>:<input className="block-input w-full" type="url" aria-label="Link" placeholder="https://exemplo.com" value={b.text} onChange={e=>update(b.id,{text:e.target.value})}/>}</div>:
     <div className="flex gap-3 items-start">{b.type==='todo'&&<input aria-label="Concluído" type="checkbox" disabled={readOnly} className="mt-2 accent-[var(--accent)]" checked={!!b.checked} onChange={e=>update(b.id,{checked:e.target.checked})}/>}
       {b.type==='bullet'&&<span className="muted pt-1">•</span>}
       <textarea rows={b.type==='heading'?1:2} disabled={readOnly} className="block-input block-textarea" style={b.type==='todo'&&b.checked?{textDecoration:'line-through',opacity:.6}:{}} placeholder={b.type==='heading'?'Título da seção':b.type==='quote'?'Uma citação ou observação...':b.type==='todo'?'Uma tarefa para concluir...':b.type==='bullet'?'Item de lista...':'Escreva aqui...'} value={b.text} maxLength={12000} onChange={e=>update(b.id,{text:e.target.value})}
       onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!readOnly&&b.type!=='paragraph'){e.preventDefault();add(b.type,i+1)}if(e.key==='/'&&b.text===''){e.preventDefault();setChooser(i+1)}}}/>
     </div>}
   </div>
   {i<blocks.length-1&&chooser===i+1&&<BlockChooser onChoose={kind=>add(kind,i+1)} onClose={()=>setChooser(null)}/>}
  </div>)}
  {!readOnly&&<div className="mt-6"><button className="btn" onClick={()=>setChooser(chooser===blocks.length?null:blocks.length)}><Plus size={16}/> Adicionar bloco</button>{chooser===blocks.length&&<BlockChooser onChoose={type=>add(type,blocks.length)} onClose={()=>setChooser(null)}/>}</div>}
  {!blocks.length&&readOnly&&<p className="muted">Esta página ainda não tem conteúdo.</p>}
 </div>
}
function BlockChooser({onChoose,onClose}:{onChoose:(k:BlockKind)=>void;onClose:()=>void}){return <div className="block-chooser"><div className="flex items-center justify-between px-3 pt-2"><span className="muted text-[11px] font-bold uppercase">Adicionar conteúdo</span><button onClick={onClose} aria-label="Fechar" className="text-xs muted">Fechar</button></div><div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-2">{kinds.map(k=><button className="block-chooser-option" key={k.type} onClick={()=>onChoose(k.type)}><k.icon size={15}/>{k.label}</button>)}</div></div>}
