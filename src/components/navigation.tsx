/* eslint-disable react-hooks/set-state-in-effect -- route changes reset the mobile navigation, and theme is restored from persisted UI preference. */
'use client';
import {useEffect,useState} from 'react';
import {usePathname,useRouter} from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {LayoutDashboard,Users,CalendarDays,CheckSquare,Wallet,Megaphone,Gamepad2,Trophy,Layers,FileText,Building2,ShieldAlert,LogOut,SunMoon,UserCog,Menu,X,Search,BookOpen,Star,ChevronRight} from 'lucide-react';
import {NotificationBell} from '@/components/notification-bell';
const entries=[
 {href:'/app',label:'Visão geral',icon:LayoutDashboard,resource:''},
 {href:'/app/members',label:'Gestão de pessoas',icon:Users,resource:'members'},
 {href:'/app/events',label:'Eventos',icon:CalendarDays,resource:'events'},
 {href:'/app/tasks',label:'Tarefas',icon:CheckSquare,resource:'tasks'},
 {href:'/app/calendario',label:'Calendário',icon:CalendarDays,resource:''},
 {href:'/app/transactions',label:'Financeiro',icon:Wallet,resource:'transactions'},
 {href:'/app/publications',label:'Publicidade',icon:Megaphone,resource:'publications'},
 {href:'/app/teams',label:'Equipes eSports',icon:Gamepad2,resource:'teams'},
 {href:'/app/tournaments',label:'Campeonatos',icon:Trophy,resource:'tournaments'},
 {href:'/app/dge',label:'DGE',icon:Layers,resource:'dge'},
 {href:'/app/projects',label:'Projetos',icon:Layers,resource:'projects'},
 {href:'/app/documents',label:'Documentos',icon:FileText,resource:'documents'},
 {href:'/app/occurrences',label:'Ocorrências',icon:ShieldAlert,resource:'occurrences'},
 {href:'/app/departments',label:'Diretorias',icon:Building2,resource:'departments'},
 {href:'/app/usuarios',label:'Usuários e acessos',icon:UserCog,resource:'usuarios'},
 {href:'/app/accounts',label:'Contas',icon:Wallet,resource:'accounts'}
];
type Space={id:string;name:string;key:string};
type PageRef={id:string;title:string;icon:string|null;favorite:boolean};
type Props={name:string;role:string;access:string[];spaces:Space[]};
export function Navigation({name,role,access,spaces}:Props){
 const pathname=usePathname();const router=useRouter();const [mobile,setMobile]=useState(false);const [isLight,setIsLight]=useState(false);const [searchOpen,setSearchOpen]=useState(false);const [query,setQuery]=useState('');const [pages,setPages]=useState<PageRef[]>([]);
 useEffect(()=>{setMobile(false);setSearchOpen(false)},[pathname]);
 useEffect(()=>{const theme=localStorage.getItem('gato-theme');const light=theme==='light';document.documentElement.dataset.theme=light?'light':'dark';setIsLight(light)},[]);
 useEffect(()=>{let alive=true;fetch('/api/workspace/pages',{cache:'no-store'}).then(r=>r.json()).then(x=>{if(alive)setPages(x.pages||[])}).catch(()=>{});return()=>{alive=false}},[pathname]);
 const available=entries.filter(e=>!e.resource||e.resource==='usuarios'&&role==='ADMIN'||access.includes(e.resource));
 const operations=available.filter(e=>['/app','/app/members','/app/events','/app/tasks','/app/calendario'].includes(e.href));
 const other=available.filter(e=>!operations.includes(e)&&!['/app/usuarios','/app/occurrences','/app/departments','/app/accounts'].includes(e.href));
 const admins=available.filter(e=>['/app/usuarios','/app/occurrences','/app/departments','/app/accounts'].includes(e.href));
 function toggleTheme(){const l=!isLight;setIsLight(l);document.documentElement.dataset.theme=l?'light':'dark';localStorage.setItem('gato-theme',l?'light':'dark')}
 async function logout(){await fetch('/api/auth/logout',{method:'POST'});router.push('/login');router.refresh()}
 function items(xs:typeof entries){return xs.map(e=><Link key={e.href} href={e.href} className="navlink" data-active={pathname===e.href}><e.icon size={17} strokeWidth={1.8}/><span>{e.label}</span></Link>)}
 const favorite=pages.filter(p=>p.favorite).slice(0,6);
 return <>
  {mobile&&<button className="mobile-nav-shade" aria-label="Fechar menu" onClick={()=>setMobile(false)}/>}
  <aside className="sidebar" data-open={mobile}>
   <Link className="gato-brand" href="/app"><Image src="/gato-lunar.svg" width={48} height={48} alt="Gatinho lunar de óculos" priority/><div><strong>Gato<span className="moon-accent">.</span></strong><p>Seu universo de ideias</p></div></Link>
   <button className="sidebar-search" onClick={()=>setSearchOpen(true)}><Search size={16}/><span>Buscar no Gato</span><kbd>⌘ K</kbd></button>
   <nav aria-label="Navegação principal" className="sidebar-nav">
    <div className="section-label">Seu workspace</div>
    <Link href="/app/espacos" className="navlink" data-active={pathname==='/app/espacos'}><BookOpen size={17}/><span>Todos os espaços</span></Link>
    {spaces.map(s=><Link href={'/app/espacos/'+s.id} key={s.id} className="navlink space-navlink" data-active={pathname==='/app/espacos/'+s.id}><span className="space-dot">☾</span><span className="truncate">{s.name}</span><ChevronRight size={14} className="ml-auto opacity-50"/></Link>)}
    {favorite.length>0&&<><div className="section-label">Favoritos</div>{favorite.map(p=><Link key={p.id} href={'/app/espacos/p/'+p.id} className="navlink"><Star size={15} fill="currentColor" className="moon-accent"/><span className="truncate">{p.title}</span></Link>)}</>}
    <div className="section-label">Operação</div>{items(operations)}
    {other.length>0&&<><div className="section-label">Diretorias e ferramentas</div>{items(other)}</>}
    {admins.length>0&&<><div className="section-label">Administração</div>{items(admins)}</>}
   </nav>
   <div className="sidebar-bottom"><div className="avatar-initial">{name.charAt(0)}</div><div className="flex-1 min-w-0"><p className="text-sm font-semibold truncate">{name}</p><p className="text-xs muted">{role==='ADMIN'?'Administrador':role==='BOARD'?'Diretoria':'Membro'}</p></div><button onClick={logout} className="btn !p-2" title="Sair" aria-label="Sair"><LogOut size={15}/></button></div>
  </aside>
  <header className="topbar"><div className="flex items-center gap-2 sm:gap-3"><button className="btn !p-2 mobile-menu-btn" aria-label="Abrir menu" onClick={()=>setMobile(!mobile)}>{mobile?<X size={19}/>:<Menu size={19}/>}</button><span className="text-sm font-semibold">Gato <span className="moon-accent">/</span> Workspace</span><span className="topbar-subtitle hidden md:inline">Tudo no seu lugar, sob a mesma lua.</span></div><div className="flex items-center gap-2"><button className="btn !p-2" aria-label="Buscar páginas" onClick={()=>setSearchOpen(true)}><Search size={17}/></button><NotificationBell/><button className="btn !p-2" aria-label="Alternar tema" onClick={toggleTheme}><SunMoon size={17}/></button></div></header>
  {searchOpen&&<div className="workspace-search-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setSearchOpen(false)}}><div role="dialog" aria-modal="true" aria-label="Buscar páginas" className="workspace-search-dialog"><div className="flex items-center gap-3 border-b p-4" style={{borderColor:'var(--edge)'}}><Search className="moon-accent" size={18}/><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Encontre uma página..." className="bg-transparent outline-none flex-1 min-w-0"/><button onClick={()=>setSearchOpen(false)}><X size={18}/></button></div><div className="max-h-96 overflow-y-auto p-3">{pages.filter(p=>p.title.toLowerCase().includes(query.toLowerCase())).slice(0,20).map(p=><Link key={p.id} href={'/app/espacos/p/'+p.id} className="navlink"><span>{p.icon||'📄'}</span><span className="truncate">{p.title}</span></Link>)}{pages.length===0&&<p className="p-5 muted text-sm">Nenhuma página cadastrada ainda.</p>}</div></div></div>}
 </>;
}
