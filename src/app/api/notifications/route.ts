import {NextResponse} from 'next/server';
import {actorFromSession,bad} from '@/lib/http';
import {prisma} from '@/lib/prisma';
export async function GET(){const actor=await actorFromSession();if(!actor)return bad('Login necessário',401);
 const [items,unread]=await Promise.all([prisma.notification.findMany({where:{userId:actor.id},orderBy:{createdAt:'desc'},take:30,select:{id:true,title:true,body:true,href:true,readAt:true,createdAt:true}}),prisma.notification.count({where:{userId:actor.id,readAt:null}})]);
 return NextResponse.json({items,unread});}
