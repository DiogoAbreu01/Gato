'use client';
import {useCallback,useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {ArrowRight,ChevronDown,ChevronRight,FileText,GitBranch,LayoutGrid,Plus,RefreshCw,Table2,Star} from 'lucide-react';

type Kind='PAGE'|'SHEET'|'FLOW'|'DATABASE';
type Page={id:string;departmentId:string;title:string;icon:string|null;kind:Kind;parentId:string|null;updatedAt:string;favorite:boolean};
const kinds:{kind:Kind;label:string;icon:typeof FileText;description:string}[]=[
 {kind:'PAGE',label:'Página',icon:FileText,description:'Textos, blocos e checklists'},
 {kind:'DATABASE',label:'Banco de dados',icon:LayoutGrid,description:'Tabela e Kanban'},
 {kind:'SHEET',label:'Planilha',icon:Table2,description:'Células e cálculos'},
 {kind:'FLOW',label:'Fluxograma',icon:GitBranch,description:'Nós e conexões'}
];
function PageGlyph({kind}:{kind:Kind}){const Icon=kinds.find(k=>k.kind===kind)?.icon||FileText;return <Icon size={17}/>;}
export function WorkspaceExplorer({departmentId,departmentName,canWrite}:{departmentId:string;departmentName:string;canWrite:boolean}){
 const router=useRouter();const [pages,setPages]=useState<Page[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [creating,setCreating]=useState(false);const [kind,setKind]=useState<Kind>('PAGE');const [title,setTitle]=useState('');const [parentId,setParentId]=useState('');const [search,setSearch]=useState('');const [busy,setBusy]=useState(false);const [open,setOpen]=useState<Record<string,boolean>>({});
 const load=useCallback(async()=>{setLoading(true);try{const r=await fetch('/api/workspace/pages?departmentId='+encodeURIComponent(departmentId),{cache:'no-store'});const x=await r.json();if(!r.ok)throw Error(x.error||'Não foi possível abrir o espaço');setPages(x.pages||[]);setError('')}catch(e){setError(e instanceof Error?e.message:'Falha ao carregar')}finally{setLoading(false)}},[departmentId]);
 useEffect(()=>{const timer=setTimeout(()=>void load(),0);return()=>clearTimeout(timer)},[load]);
 const visible=useMemo(()=>pages.filter(p=>p.title.toLowerCase().includes(search.toLowerCase())),[pages,search]);
 const roots=useMemo(()=>visible.filter(p=>!p.parentId||!visible.find(x=>x.id===p.parentId)),[visible]);
 function nested(p:Page,depth:number):React.ReactNode{const children=visible.filter(x=>x.parentId===p.id);return <div key={p.id}>
  <div className="workspace-list-row" style={{paddingLeft:14+depth*20}}>
   {children.length>0?<button className="workspace-twist" aria-label={open[p.id]===false?'Expandir':'Recolher'} onClick={()=>setOpen(s=>({...s,[p.id]:s[p.id]===false}))}>{open[p.id]===false?<ChevronRight size={15}/>:<ChevronDown size={15}/>}</button>:<span className="workspace-twist muted"><span className="text-xs">•</span></span>}
   <Link href={'/app/espacos/p/'+p.id} className="flex min-w-0 items-center gap-3 flex-1"><span className="workspace-kind-icon"><PageGlyph kind={p.kind}/></span><span className="font-medium truncate">{p.title}</span>{p.favorite&&<Star size={13} fill="currentColor" className="moon-accent"/>}</Link>
   <span className="muted text-xs hidden sm:block">{kinds.find(k=>k.kind===p.kind)?.label}</span>
   {canWrite&&<button className="btn !p-2 !min-h-8" title="Criar subpágina" onClick={()=>{setParentId(p.id);setCreating(true)}}><Plus size={14}/></button>}
  </div>
  {open[p.id]!==false&&children.map(ch=>nested(ch,depth+1))}
 </div>}
 async function create(){if(!title.trim())return;setBusy(true);setError('');try{const r=await fetch('/api/workspace/pages',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({departmentId,title:title.trim(),kind,parentId:parentId||null})});const x=await r.json();if(!r.ok)throw Error(x.error||'Falha ao criar');setCreating(false);setTitle('');setParentId('');router.push('/app/espacos/p/'+x.page.id);router.refresh()}catch(e){setError(e instanceof Error?e.message:'Falha inesperada')}finally{setBusy(false)}}
 return <section className="space-y-7">
  <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="eyebrow">Espaço / Diretoria</p><h1 className="text-3xl md:text-4xl font-bold tracking-tight">{departmentName}</h1><p className="muted mt-2 text-sm">Páginas, conhecimento e projetos deste espaço, organizados do seu jeito.</p></div>{canWrite&&<button onClick={()=>{setCreating(true);setParentId('')}} className="btn btn-primary"><Plus size={17}/> Nova página</button>}</div>
  <div className="panel p-5"><div className="flex items-center justify-between gap-3 mb-4"><div><h2 className="font-semibold">Biblioteca do espaço</h2><p className="muted text-xs mt-1">{pages.length} itens disponíveis</p></div><button onClick={load} aria-label="Atualizar" className="btn !p-2"><RefreshCw size={17}/></button></div>
   <input className="input mb-3" placeholder="Buscar páginas..." aria-label="Buscar páginas" value={search} onChange={e=>setSearch(e.target.value)}/>
   {loading?<div className="muted p-8 text-center">Carregando páginas...</div>:roots.length?<div className="workspace-tree">{roots.map(p=>nested(p,0))}</div>:<div className="workspace-empty"><span className="text-4xl">☾</span><h3 className="font-semibold mt-3">{search?'Nenhuma página encontrada':'Este espaço é seu para criar'}</h3><p className="muted text-sm mt-1">Documente processos, planeje eventos ou organize o conhecimento da equipe.</p>{canWrite&&!search&&<button className="btn mt-4" onClick={()=>setCreating(true)}><Plus size={16}/> Criar primeiro conteúdo</button>}</div>}
  </div>
  {error&&<div className="panel p-4 text-sm" role="alert" style={{color:'var(--danger)'}}>{error}</div>}
  {creating&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setCreating(false)}}><div className="modal workspace-create-dialog" role="dialog" aria-modal="true"><div className="flex items-center justify-between"><h2 className="text-2xl font-bold">Criar no Gato</h2><button className="btn" onClick={()=>setCreating(false)}>Fechar</button></div><p className="muted text-sm mt-1 mb-7">Escolha como quer organizar a ideia.</p><div className="grid grid-cols-2 gap-3">{kinds.map(k=><button key={k.kind} className={'workspace-template '+(kind===k.kind?'selected':'')} onClick={()=>setKind(k.kind)}><k.icon size={21}/><span className="font-semibold mt-2">{k.label}</span><small className="muted">{k.description}</small></button>)}</div><label className="label mt-6">Nome</label><input autoFocus className="input" value={title} onChange={e=>setTitle(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')void create()}} placeholder="Ex.: Orçamento da recepção"/>
    {parentId&&<p className="muted text-xs mt-2">Será criada como subpágina de {pages.find(p=>p.id===parentId)?.title}.</p>}
    <button className="btn btn-primary w-full mt-6" disabled={busy||!title.trim()} onClick={create}>{busy?'Criando...':'Criar e abrir'} <ArrowRight size={16}/></button>
   </div></div>}
 </section>
}
