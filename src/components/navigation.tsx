'use client';
import {usePathname,useRouter} from 'next/navigation';
import Link from 'next/link';
import {LayoutDashboard,Users,CalendarDays,CheckSquare,Wallet, Megaphone, Gamepad2,Trophy, Layers,FileText,Building2,ShieldAlert, LogOut,SunMoon,UserCog} from 'lucide-react';
import {useState} from 'react';
import {NotificationBell} from '@/components/notification-bell';
const entries=[
 {href:'/app',label:'Visão geral',icon:LayoutDashboard,group:'main'},
 {href:'/app/members',label:'Gestão de pessoas',icon:Users,group:'main'},
 {href:'/app/events',label:'Eventos',icon:CalendarDays,group:'main'},
 {href:'/app/tasks',label:'Tarefas',icon:CheckSquare,group:'main'},
 {href:'/app/calendario',label:'Calendário',icon:CalendarDays,group:'main'},
 {href:'/app/transactions',label:'Financeiro',icon:Wallet,group:'area'},
 {href:'/app/publications',label:'Publicidade',icon:Megaphone,group:'area'},
 {href:'/app/teams',label:'Equipes eSports',icon:Gamepad2,group:'area'},
 {href:'/app/tournaments',label:'Campeonatos',icon:Trophy,group:'area'},
 {href:'/app/dge',label:'DGE',icon:Layers,group:'area'},
 {href:'/app/projects',label:'Projetos',icon:Layers,group:'area'},
 {href:'/app/documents',label:'Documentos',icon:FileText,group:'area'},
 {href:'/app/occurrences',label:'Ocorrências',icon:ShieldAlert,group:'manage'},
 {href:'/app/departments',label:'Diretorias',icon:Building2,group:'manage'},
 {href:'/app/usuarios',label:'Usuários e acessos',icon:UserCog,group:'manage'},
 {href:'/app/accounts',label:'Contas',icon:Wallet,group:'manage'}
];
type Props={name:string;role:string;access:string[]};
export function Navigation({name,role,access}:Props){const pathname=usePathname();const router=useRouter();const [dark,setDark]=useState(false);
 const filtered=entries.filter(e=>e.href==='/app'||e.href==='/app/calendario'||(e.href==='/app/usuarios'?role==='ADMIN':access.includes(e.href.split('/').at(-1)||'')));
 async function logout(){await fetch('/api/auth/logout',{method:'POST'});router.push('/login');router.refresh()}
 function theme(){setDark(!dark);document.documentElement.dataset.theme=dark?'light':'dark'}
 return <><aside className="sidebar"><Link href="/app" className="flex items-center gap-3 px-3 mb-8 mt-1"><div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-black">G</div><div className="min-w-0"><strong className="font-bold tracking-tight">Gato</strong><p className="text-[10px] muted uppercase tracking-wider">Administração</p></div></Link><div className="navgrid flex-col">{filtered.map((e,i)=><div key={e.href}>{(i===0||e.group!==filtered[i-1].group)&&<div className="section-label">{e.group==='main'?'Operação':e.group==='area'?'Diretorias':'Administração'}</div>}<Link href={e.href} className="navlink" data-active={pathname===e.href}><e.icon size={17} strokeWidth={1.8}/>{e.label}</Link></div>)}</div><div className="hidden lg:block mt-10 mx-3 text-xs muted border-t pt-4" style={{borderColor:'var(--edge)'}}>Institucional • v0.1</div></aside><div className="topbar"><div className="flex items-center gap-3"><span className="text-sm font-semibold">Central administrativa</span><span className="text-xs muted hidden sm:inline">/ Área de trabalho</span></div><div className="flex items-center gap-3"><NotificationBell/><button aria-label="Alternar tema" title="Alternar tema" className="btn !p-2" onClick={theme}><SunMoon size={18}/></button><div className="hidden sm:block text-right"><p className="font-semibold text-xs">{name}</p><p className="muted text-xs">{role==='ADMIN'?'Administrador':role==='BOARD'?'Diretoria':'Membro'}</p></div><button className="btn !p-2" aria-label="Sair" title="Sair" onClick={logout}><LogOut size={17}/></button></div></div></>}
