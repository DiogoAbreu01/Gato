import { NextRequest,NextResponse } from 'next/server';
import {actorFromSession,bad} from '@/lib/http';
import {can,readFilter} from '@/lib/rbac';
import {prisma} from '@/lib/prisma';
export const runtime='nodejs';
export async function GET(req:NextRequest){
  const actor=await actorFromSession();if(!actor)return bad('Login necessário',401);
  const today=new Date();const start=new Date(req.nextUrl.searchParams.get('start')||new Date(today.getFullYear(),today.getMonth()-1,1).toISOString());
  const end=new Date(req.nextUrl.searchParams.get('end')||new Date(today.getFullYear(),today.getMonth()+3,1).toISOString());
  if(!Number.isFinite(start.getTime())||!Number.isFinite(end.getTime())||end<=start||end.getTime()-start.getTime()>366*86400_000)return bad('Intervalo inválido');
  const [events,tasks,publications,tournaments]=await Promise.all([
    can(actor,'events','read')?prisma.event.findMany({where:{...readFilter(actor,'events'),archivedAt:null,startsAt:{gte:start,lt:end}},select:{id:true,name:true,startsAt:true},take:500}):[],
    can(actor,'tasks','read')?prisma.task.findMany({where:{...readFilter(actor,'tasks'),archivedAt:null,dueAt:{gte:start,lt:end}},select:{id:true,title:true,dueAt:true},take:500}):[],
    can(actor,'publications','read')?prisma.publication.findMany({where:{...readFilter(actor,'publications'),archivedAt:null,scheduledAt:{gte:start,lt:end}},select:{id:true,title:true,scheduledAt:true},take:500}):[],
    can(actor,'tournaments','read')?prisma.tournament.findMany({where:{...readFilter(actor,'tournaments'),archivedAt:null,startsAt:{gte:start,lt:end}},select:{id:true,name:true,startsAt:true},take:500}):[]
  ]);
  const items=[
    ...events.map(e=>({id:e.id,title:e.name,date:e.startsAt,resource:'events',type:'Evento'})),
    ...tasks.map(e=>({id:e.id,title:e.title,date:e.dueAt,resource:'tasks',type:'Tarefa'})),
    ...publications.map(e=>({id:e.id,title:e.title,date:e.scheduledAt,resource:'publications',type:'Publicação'})),
    ...tournaments.map(e=>({id:e.id,title:e.name,date:e.startsAt,resource:'tournaments',type:'Campeonato'}))
  ].sort((a,b)=>new Date(a.date||'').getTime()-new Date(b.date||'').getTime());
  return NextResponse.json({items});
}
