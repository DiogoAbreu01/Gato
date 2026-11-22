import {NextRequest,NextResponse} from 'next/server';
import {actorFromSession,bad,sameOrigin} from '@/lib/http';
import {prisma} from '@/lib/prisma';
type Context={params:Promise<{id:string}>};
export async function PATCH(req:NextRequest,{params}:Context){if(!sameOrigin(req))return bad('Origem inválida',403);const actor=await actorFromSession();if(!actor)return bad('Login necessário',401);const {id}=await params;const result=await prisma.notification.updateMany({where:{id,userId:actor.id,readAt:null},data:{readAt:new Date()}});return NextResponse.json({ok:true,updated:result.count});}
