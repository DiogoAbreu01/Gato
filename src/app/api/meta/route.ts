import {NextResponse} from 'next/server';
import type {Prisma} from '@prisma/client';
import {actorFromSession,bad} from '@/lib/http';
import {can,readFilter,ALL_RESOURCES} from '@/lib/rbac';
import {prisma} from '@/lib/prisma';
export async function GET(){
 const actor=await actorFromSession();if(!actor)return bad('Login necessário',401);
 const [departments,accounts,categories,events,members,users]=await Promise.all([
   prisma.department.findMany({where:{active:true},select:{id:true,name:true},orderBy:{name:'asc'}}),
   can(actor,'transactions','read') ? prisma.financialAccount.findMany({where:{active:true},select:{id:true,name:true}}) : Promise.resolve([]),
   can(actor,'transactions','read') ? prisma.financialCategory.findMany({select:{id:true,name:true}}) : Promise.resolve([]),
   can(actor,'events','read') ? prisma.event.findMany({where:{...readFilter(actor,'events'),archivedAt:null},select:{id:true,name:true},take:500,orderBy:{startsAt:'desc'}}) : Promise.resolve([]),
   can(actor,'members','read') ? prisma.member.findMany({where:{...readFilter(actor,'members'),archivedAt:null} as Prisma.MemberWhereInput,select:{id:true,name:true},take:500}) : Promise.resolve([]),
   actor.globalRole==='ADMIN'||actor.globalRole==='BOARD' ? prisma.user.findMany({where:{active:true},select:{id:true,name:true},take:500}) : prisma.user.findMany({where:{active:true,OR:[{id:actor.id},{departments:{some:{departmentId:{in:actor.departments.map(d=>d.departmentId)}}}}]},select:{id:true,name:true},take:500})
 ]);
 return NextResponse.json({actor,permissions:Object.fromEntries(ALL_RESOURCES.map(resource=>[resource,{read:can(actor,resource,'read'),write:can(actor,resource,'write'),manage:can(actor,resource,'manage')}])),departments,accounts,categories,events,members,users});
}
