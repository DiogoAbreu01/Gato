'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {Bell} from 'lucide-react';
type Item={id:string;title:string;body:string|null;href:string|null;readAt:string|null};
export function NotificationBell(){const [open,setOpen]=useState(false);const [items,setItems]=useState<Item[]>([]);const [unread,setUnread]=useState(0);
 function refresh(){fetch('/api/notifications').then(r=>r.json()).then(x=>{if(x.items){setItems(x.items);setUnread(x.unread)}}).catch(()=>{})}
 useEffect(()=>{refresh()},[]);
 async function read(id:string){await fetch(`/api/notifications/${id}`,{method:'PATCH'});refresh();setOpen(false)}
 return <div className="relative"><button className="btn !p-2 relative" aria-label="Notificações" aria-expanded={open} onClick={()=>{if(!open)refresh();setOpen(!open)}}><Bell size={18}/>{unread>0&&<span className="absolute -right-1 -top-1 min-w-5 h-5 px-1 text-[10px] rounded-full flex items-center justify-center bg-red-500 text-white">{unread>99?'99+':unread}</span>}</button>{open&&<div className="panel absolute z-30 right-0 top-12 w-80 max-w-[90vw] shadow-xl p-4"><h3 className="font-bold mb-3">Notificações</h3>{items.length?items.map(i=><div key={i.id} className="py-3 border-t" style={{borderColor:'var(--edge)'}}><p className="font-semibold text-sm">{i.title}</p><p className="muted text-xs my-1">{i.body}</p>{i.href?.startsWith('/app/')?<Link onClick={()=>void read(i.id)} className="text-xs font-bold" style={{color:'var(--accent)'}} href={i.href}>Abrir registro</Link>:<button className="text-xs underline" onClick={()=>void read(i.id)}>Marcar como lida</button>}</div>):<p className="muted text-sm">Nenhuma notificação.</p>}</div>}</div>
}
