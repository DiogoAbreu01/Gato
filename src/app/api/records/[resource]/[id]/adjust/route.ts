import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {actorFromSession,sameOrigin,bad} from '@/lib/http';
import {can} from '@/lib/rbac';
import {prisma} from '@/lib/prisma';
import {Prisma} from '@prisma/client';
type Context={params:Promise<{resource:string;id:string}>};
const schema=z.object({delta:z.number().int().min(-5).max(5),reason:z.string().trim().min(8).max(1000)});
export async function POST(req:NextRequest,{params}:Context){
  if(!sameOrigin(req))return bad('Origem inválida',403);
  const actor=await actorFromSession();if(!actor)return bad('Login necessário',401);
  const {resource,id}=await params;if(resource!=='occurrences')return bad('Recurso inválido',404);
  const parsed=schema.safeParse(await req.json().catch(()=>null));if(!parsed.success)return bad('Justificativa ou pontos inválidos',422);
  try{
    const occurrence=await prisma.disciplinaryOccurrence.findUnique({where:{id}});
    if(!occurrence || !can(actor,'occurrences','write',occurrence.departmentId))return bad('Registro não encontrado ou acesso negado',403);
    const updated=await prisma.$transaction(async tx=>{
      const sum=await tx.disciplinaryOccurrence.aggregate({where:{memberId:occurrence.memberId,archivedAt:null},_sum:{points:true,adjustmentPoints:true}});
      const next=(sum._sum.points||0)+(sum._sum.adjustmentPoints||0)+parsed.data.delta;
      if(next<0||next>5)throw new Error('LIMIT');
      const rec=await tx.disciplinaryOccurrence.update({where:{id},data:{adjustmentPoints:{increment:parsed.data.delta},reviewedAt:new Date(),version:{increment:1}}});
      await tx.disciplinaryAdjustment.create({data:{occurrenceId:id,deltaPoints:parsed.data.delta,reason:parsed.data.reason,changedById:actor.id}});
      await tx.auditLog.create({data:{userId:actor.id,action:'disciplinary-adjustment',resource,recordId:id,details:{delta:parsed.data.delta}}});
      return rec;
    },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
    return NextResponse.json({record:updated});
  }catch(e){if(e instanceof Error&&e.message==='LIMIT')return bad('Total permitido: 0 a 5 pontos',409);console.error('adjust failed',e);return bad('Não foi possível ajustar',500);}
}
