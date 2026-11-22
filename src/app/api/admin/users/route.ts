import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {actorFromSession,sameOrigin,bad} from '@/lib/http';
import {hashPassword,normalizeEmail} from '@/lib/auth';
import {prisma} from '@/lib/prisma';

export const runtime='nodejs';
const assignment=z.object({departmentId:z.string().uuid(),role:z.enum(['DIRECTOR','EDITOR','VIEWER'])});
const schema=z.object({name:z.string().trim().min(2).max(180),email:z.string().email().max(254),password:z.string().min(16).max(256),globalRole:z.enum(['ADMIN','BOARD','GENERAL']),departments:z.array(assignment).max(7)});
const forbidden=()=>bad('Acesso exclusivo de administradores',403);
export async function GET(){
 const actor=await actorFromSession();if(!actor)return bad('Login necessário',401);if(actor.globalRole!=='ADMIN')return forbidden();
 const items=await prisma.user.findMany({select:{id:true,name:true,email:true,globalRole:true,active:true,departments:{select:{departmentId:true,role:true}},createdAt:true},orderBy:{name:'asc'},take:500});
 return NextResponse.json({items});
}
export async function POST(req:NextRequest){
 if(!sameOrigin(req))return bad('Origem inválida',403);
 const actor=await actorFromSession();if(!actor)return bad('Login necessário',401);if(actor.globalRole!=='ADMIN')return forbidden();
 const input=schema.safeParse(await req.json().catch(()=>null));if(!input.success)return bad('Dados inválidos: verifique a senha (16+ caracteres) e os vínculos',422);
 const {name,email,password,globalRole,departments}=input.data;
 const ids=departments.map(d=>d.departmentId);
 if(new Set(ids).size!==ids.length)return bad('Diretorias duplicadas',422);
 try{
  const rec=await prisma.$transaction(async tx=>{
   if(await tx.department.count({where:{id:{in:ids},active:true}})!==ids.length)throw Error('DEPT');
   const newUser=await tx.user.create({data:{name,email:normalizeEmail(email),passwordHash:await hashPassword(password),globalRole,departments:{create:departments}}});
   await tx.auditLog.create({data:{userId:actor.id,resource:'users',recordId:newUser.id,action:'create',details:{globalRole,departmentIds:ids}}});
   return {id:newUser.id};
  });
  return NextResponse.json({record:rec},{status:201});
 }catch(e){if(e instanceof Error&&e.message==='DEPT')return bad('Diretoria inexistente',422);if(e instanceof Error&&e.message.includes('Unique constraint'))return bad('Este e-mail já está cadastrado',409);console.error('create user failed',e);return bad('Não foi possível cadastrar',500)}
}
