import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {actorFromSession,sameOrigin,bad} from '@/lib/http';
import {hashPassword} from '@/lib/auth';
import {prisma} from '@/lib/prisma';
const assignment=z.object({departmentId:z.string().uuid(),role:z.enum(['DIRECTOR','EDITOR','VIEWER'])});
const schema=z.object({name:z.string().trim().min(2).max(180),globalRole:z.enum(['ADMIN','BOARD','GENERAL']),active:z.boolean(),password:z.string().min(16).max(256).optional(),departments:z.array(assignment).max(7)});
type C={params:Promise<{id:string}>};
export async function PATCH(req:NextRequest,{params}:C){
 if(!sameOrigin(req))return bad('Origem inválida',403);
 const actor=await actorFromSession();if(!actor)return bad('Login necessário',401);if(actor.globalRole!=='ADMIN')return bad('Acesso restrito',403);
 const {id}=await params;
 const parsed=schema.safeParse(await req.json().catch(()=>null));if(!parsed.success)return bad('Dados inválidos',422);
 const {name,globalRole,active,password,departments}=parsed.data;
 const ids=departments.map(d=>d.departmentId);
 if(new Set(ids).size!==ids.length)return bad('Diretorias duplicadas',422);
 if(actor.id===id&&(!active||globalRole!=='ADMIN'))return bad('Não é permitido desativar ou rebaixar a própria conta administrativa',409);
 try{
  const result=await prisma.$transaction(async tx=>{
   if(await tx.department.count({where:{id:{in:ids},active:true}})!==ids.length)throw Error('DEPT');
   const previous=await tx.user.findUnique({where:{id}});if(!previous)throw Error('NOTFOUND');
   const updated=await tx.user.update({where:{id},data:{name,globalRole,active,...password?{passwordHash:await hashPassword(password)}:{},departments:{deleteMany:{},create:departments}}});
   if(password||!active)await tx.session.updateMany({where:{userId:id,revokedAt:null},data:{revokedAt:new Date()}});
   await tx.auditLog.create({data:{userId:actor.id,resource:'users',recordId:id,action:'update',details:{fields:['name','globalRole','active','departments',...(password?['password reset']:[])],previousRole:previous.globalRole}}});
   return {id:updated.id};
  });
  return NextResponse.json({record:result});
 }catch(e){if(e instanceof Error&&e.message==='DEPT')return bad('Diretoria inválida',422);if(e instanceof Error&&e.message==='NOTFOUND')return bad('Usuário não encontrado',404);console.error('edit user failed',e);return bad('Falha ao atualizar usuário',500)}
}
