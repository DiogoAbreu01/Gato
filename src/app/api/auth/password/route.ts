import {cookies} from 'next/headers';
import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {getSession,checkPassword,hashPassword} from '@/lib/auth';
import {sameOrigin,bad} from '@/lib/http';
import {prisma} from '@/lib/prisma';
const schema=z.object({
 currentPassword:z.string().min(1).max(1024),
 newPassword:z.string().min(16).max(128)
}).strict();
export async function POST(req:NextRequest){
 if(!sameOrigin(req))return bad('Origem inválida',403);
 const session=await getSession();
 if(!session)return bad('Login necessário',401);
 const parsed=schema.safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return bad('Senha nova deve ter de 16 a 128 caracteres',422);
 const {currentPassword,newPassword}=parsed.data;
 if(currentPassword===newPassword)return bad('Escolha uma senha diferente da atual',422);
 const valid=await checkPassword(currentPassword,session.user.passwordHash);
 if(!valid)return bad('Senha atual incorreta',403);
 const hash=await hashPassword(newPassword);
 await prisma.$transaction([
  prisma.user.update({where:{id:session.user.id},data:{passwordHash:hash}}),
  prisma.session.updateMany({where:{userId:session.user.id,revokedAt:null},data:{revokedAt:new Date()}}),
  prisma.auditLog.create({data:{userId:session.user.id,resource:'users',recordId:session.user.id,action:'password_changed',details:{method:'self_service'}}})
 ]);
 (await cookies()).delete(process.env.SESSION_COOKIE_NAME||'atletica_session');
 return NextResponse.json({ok:true,message:'Senha atualizada. Entre novamente.'});
}
