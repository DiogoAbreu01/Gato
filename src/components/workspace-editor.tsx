'use client';
import Link from 'next/link';
import {useEffect,useMemo,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import {ArrowLeft,Archive,Check,Cloud,CloudOff,RefreshCcw,Star,Clock3,FileText} from 'lucide-react';
import {WorkspaceBlocks,type WorkspaceBlock} from '@/components/workspace-blocks';
import {WorkspaceSheet,type GridData} from '@/components/workspace-sheet';
import {WorkspaceFlow,type FlowData} from '@/components/workspace-flow';
type Kind='PAGE'|'SHEET'|'DATABASE'|'FLOW';
type Page={id:string;title:string;icon:string|null;kind:Kind;departmentId:string;parentId:string|null;version:number;content:unknown;data:unknown;favorite:boolean;revisions:{id:string;version:number;createdAt:string}[]};
type Draft={title:string;icon:string;content:WorkspaceBlock[];data:Record<string,unknown>};
const isGrid=(v:unknown):v is GridData=>!!v&&typeof v==='object'&&'rows' in v&&'columns' in v;
const isFlow=(v:unknown):v is FlowData=>!!v&&typeof v==='object'&&'nodes' in v&&'edges' in v;
export function WorkspaceEditor({id}:{id:string}){
 const router=useRouter();const [page,setPage]=useState<Page|null>(null);const [canEdit,setCanEdit]=useState(false);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [conflict,setConflict]=useState(false);const [saving,setSaving]=useState(false);const [force,setForce]=useState(0);const savingRef=useRef(false);const handledForce=useRef(0);const [persisted,setPersisted]=useState('');
 const [title,setTitle]=useState('');const [icon,setIcon]=useState('🌙');const [blocks,setBlocks]=useState<WorkspaceBlock[]>([]);const [data,setData]=useState<Record<string,unknown>>({});
 useEffect(()=>{let alive=true;(async()=>{try{const r=await fetch('/api/workspace/pages/'+id,{cache:'no-store'});const x=await r.json();if(!r.ok)throw Error(x.error||'Página não encontrada');if(!alive)return;const p=x.page as Page;const draft:Draft={title:p.title,icon:p.icon||'🌙',content:Array.isArray(p.content)?p.content as WorkspaceBlock[]:[],data:p.data&&typeof p.data==='object'&&!Array.isArray(p.data)?p.data as Record<string,unknown>:{}};
 setPage(p);setCanEdit(x.canEdit);setTitle(draft.title);setIcon(draft.icon);setBlocks(draft.content);setData(draft.data);setPersisted(JSON.stringify(draft));setError('');setConflict(false)}catch(e){if(alive)setError(e instanceof Error?e.message:'Falha ao abrir a página')}finally{if(alive)setLoading(false)}})();return()=>{alive=false}},[id]);
 const draft=useMemo<Draft>(()=>({title,icon,content:blocks,data}),[title,icon,blocks,data]);
 const dirty=!!page&&JSON.stringify(draft)!==persisted;
 useEffect(()=>{if(!page||!canEdit||conflict||!dirty)return;const json=JSON.stringify(draft);const immediate=force!==handledForce.current;const t=setTimeout(async()=>{
  if(savingRef.current)return;
  handledForce.current=force;
  savingRef.current=true;setSaving(true);setError('');
  try{const r=await fetch('/api/workspace/pages/'+page.id,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({...draft,version:page.version})});const x=await r.json();if(!r.ok){if(r.status===409)setConflict(true);throw Error(x.error||'Erro ao salvar')};setPersisted(json);setPage(old=>old?{...old,version:x.page.version,revisions:[{id:'latest',version:x.page.version,createdAt:new Date().toISOString()},...old.revisions].slice(0,8)}:old)}
  catch(e){setError(e instanceof Error?e.message:'Falha de conexão')}finally{savingRef.current=false;setSaving(false)}
 },immediate?0:1300);return()=>clearTimeout(t)
 },[page,canEdit,conflict,dirty,draft,force]);
 useEffect(()=>{const onLeave=(e:BeforeUnloadEvent)=>{if(dirty){e.preventDefault();e.returnValue=''}};window.addEventListener('beforeunload',onLeave);return()=>window.removeEventListener('beforeunload',onLeave)},[dirty]);
 // O Next Link navega sem beforeunload. Bloqueamos links internos e logout enquanto há alterações locais.
 useEffect(()=>{
  if(!dirty)return;
  const guard=(event:MouseEvent)=>{
   const target=event.target instanceof Element?event.target:null;
   const link=target?.closest('a[href]') as HTMLAnchorElement|null;
   const logout=target?.closest('button[title="Sair"]');
   const internalLink=link&&link.origin===window.location.origin&&!link.hasAttribute('download')&&(link.pathname!==window.location.pathname||link.search!==window.location.search);
   if((internalLink||logout)&&!window.confirm('Há alterações não salvas nesta página. Deseja sair mesmo assim?')){event.preventDefault();event.stopImmediatePropagation()}
  };
  document.addEventListener('click',guard,true);
  return()=>document.removeEventListener('click',guard,true);
 },[dirty]);
 async function favorite(){if(!page)return;const r=await fetch('/api/workspace/pages/'+id+'/favorite',{method:'POST'});if(r.ok){const x=await r.json();setPage(p=>p?{...p,favorite:x.favorite}:p)}}
 async function archive(){if(!page||!confirm('Arquivar esta página? O histórico será preservado.'))return;const r=await fetch('/api/workspace/pages/'+id,{method:'DELETE'});const x=await r.json();if(!r.ok){setError(x.error||'Não foi possível arquivar');return}router.push('/app/espacos/'+page.departmentId);router.refresh()}
 const grid=isGrid(data)?data:{columns:['Nome','Status'],rows:[],view:'table' as const};
 const flow=isFlow(data)?data:{nodes:[],edges:[]};
 return <div className="workspace-editor">
  {loading?<div className="panel p-10 muted">Abrindo a página...</div>:!page?<div className="panel p-10" role="alert">{error||'Página não encontrada'}</div>:<>
   <div className="flex items-center flex-wrap justify-between gap-3 mb-9">
    <div className="flex gap-3 items-center"><Link href={'/app/espacos/'+page.departmentId} className="btn !p-2" aria-label="Voltar ao espaço"><ArrowLeft size={18}/></Link><div className="text-xs muted">Espaços / <span className="font-semibold">{page.kind==='PAGE'?'Página':page.kind==='SHEET'?'Planilha':page.kind==='FLOW'?'Fluxograma':'Banco de dados'}</span></div></div>
    <div className="flex items-center gap-2 flex-wrap"><span className="text-xs muted flex items-center gap-1">{saving?<><Cloud size={15}/> Salvando...</>:dirty?<><CloudOff size={15}/> Alterações pendentes</>:<><Check size={15}/> Salvo na Neon</>}</span>
    <button className={'btn !p-2 '+(page.favorite?'moon-accent':'')} title="Favorito" onClick={favorite}><Star size={16} fill={page.favorite?'currentColor':'none'}/></button>
    {canEdit&&<button className="btn btn-primary" disabled={saving||!dirty||conflict} onClick={()=>setForce(x=>x+1)}>Salvar agora</button>}
    {canEdit&&<button className="btn !p-2" title="Arquivar página" onClick={archive}><Archive size={16}/></button>}</div>
   </div>
   {error&&<div className="panel p-4 mb-5 text-sm text-red-500" role="alert">{error}{conflict&&<button className="btn ml-3" onClick={()=>window.location.reload()}><RefreshCcw size={15}/> Recarregar</button>}</div>}
   <div className="workspace-paper">
    <div className="workspace-page-heading"><input className="workspace-icon-input" aria-label="Ícone da página" disabled={!canEdit} value={icon} onChange={e=>setIcon(e.target.value.slice(0,8))} maxLength={8}/><div className="flex-1 min-w-0"><input aria-label="Título da página" placeholder="Sem título" className="workspace-title-input" disabled={!canEdit} value={title} onChange={e=>setTitle(e.target.value)}/><p className="muted text-xs mt-2 flex items-center gap-2"><Clock3 size={13}/> Versão {page.version} · Histórico de alterações protegido</p></div></div>
    <div className="workspace-page-body">
    {page.kind==='PAGE'?<WorkspaceBlocks blocks={blocks} onChange={setBlocks} readOnly={!canEdit}/>:
     page.kind==='FLOW'?<WorkspaceFlow value={flow} onChange={x=>setData(x as unknown as Record<string,unknown>)} readOnly={!canEdit}/>:
     <WorkspaceSheet value={grid} onChange={x=>setData(x as unknown as Record<string,unknown>)} readOnly={!canEdit} database={page.kind==='DATABASE'}/>}
    </div>
   </div>
   <div className="mt-7 pt-5 border-t flex flex-wrap justify-between items-center gap-2" style={{borderColor:'var(--edge)'}}><p className="muted text-xs flex items-center gap-1"><FileText size={13}/> Histórico de versões: {page.revisions.length} alterações recentes</p><p className="muted text-xs">Edição segura por diretoria · Gato Moon</p></div>
  </>}
 </div>;
}
