import {NextRequest,NextResponse} from 'next/server';
import {Prisma} from '@prisma/client';
import {prisma} from '@/lib/prisma';
import {actorFromSession,bad,sameOrigin} from '@/lib/http';
import {hasWorkspaceAccess,pageUpdateSchema,pageDataValid} from '@/lib/workspace';
type Context={params:Promise<{id:string}>};

export async function GET(_req:NextRequest,{params}:Context){
 const actor=await actorFromSession();if(!actor)return bad('Login necessário',401);
 const {id}=await params;
 const page=await prisma.workspacePage.findUnique({where:{id},include:{favorites:{where:{userId:actor.id}},revisions:{select:{id:true,version:true,createdAt:true},orderBy:{version:'desc'},take:8}}});
 if(!page||page.archivedAt)return bad('Página não encontrada',404);
 if(!hasWorkspaceAccess(actor,page.departmentId,'read'))return bad('Sem permissão',403);
 const {favorites,...safe}=page;
 return NextResponse.json({page:{...safe,favorite:favorites.length>0},canEdit:hasWorkspaceAccess(actor,page.departmentId,'write')});
}

export async function PATCH(req:NextRequest,{params}:Context){
 if(!sameOrigin(req))return bad('Origem inválida',403);
 const actor=await actorFromSession();if(!actor)return bad('Login necessário',401);
 const parsed=pageUpdateSchema.safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return bad('Dados de página inválidos',422,parsed.error.flatten());
 const {id}=await params;
 const page=await prisma.workspacePage.findUnique({where:{id}});
 if(!page||page.archivedAt)return bad('Página não encontrada',404);
 if(!hasWorkspaceAccess(actor,page.departmentId,'write'))return bad('Sem permissão para editar',403);
 const b=parsed.data;
 if(b.data&&!pageDataValid(page.kind,b.data))return bad('Estrutura da página inválida ou muito grande',422);
 if(b.version!==page.version)return bad('A página foi alterada em outra sessão. Recarregue antes de salvar.',409);
 if(!Object.keys(b).some(k=>k!=='version'))return bad('Nenhuma alteração enviada',422);
 const updated=await prisma.$transaction(async tx=>{
  const changed=await tx.workspacePage.updateMany({where:{id,version:b.version,archivedAt:null},data:{
   ...(b.title!==undefined?{title:b.title}:{}),
   ...(b.icon!==undefined?{icon:b.icon}:{}),
   ...(b.content!==undefined?{content:b.content as Prisma.InputJsonValue}:{}),
   ...(b.data!==undefined?{data:b.data as Prisma.InputJsonValue}:{}),
   updatedById:actor.id,version:{increment:1}
  }});
  if(changed.count!==1)return null;
  const p=await tx.workspacePage.findUniqueOrThrow({where:{id}});
  await tx.workspacePageRevision.create({data:{pageId:id,version:p.version,title:p.title,content:p.content as Prisma.InputJsonValue,data:p.data as Prisma.InputJsonValue,changedById:actor.id}});
  await tx.auditLog.create({data:{userId:actor.id,resource:'workspace',recordId:id,action:'update',details:{version:p.version}}});
  return p;
 });
 if(!updated)return bad('A página mudou. Recarregue para evitar sobrescrever alterações.',409);
 return NextResponse.json({page:updated});
}

export async function DELETE(req:NextRequest,{params}:Context){
 if(!sameOrigin(req))return bad('Origem inválida',403);
 const actor=await actorFromSession();if(!actor)return bad('Login necessário',401);
 const {id}=await params;
 const page=await prisma.workspacePage.findUnique({where:{id}});
 if(!page||page.archivedAt)return bad('Página não encontrada',404);
 if(!hasWorkspaceAccess(actor,page.departmentId,'write'))return bad('Sem permissão',403);
 const children=await prisma.workspacePage.count({where:{parentId:id,archivedAt:null}});
 if(children)return bad('Mova ou arquive as subpáginas primeiro',409);
 await prisma.$transaction([
  prisma.workspacePage.update({where:{id},data:{archivedAt:new Date(),updatedById:actor.id}}),
  prisma.auditLog.create({data:{userId:actor.id,resource:'workspace',recordId:id,action:'archive'}})
 ]);
 return NextResponse.json({ok:true});
}
