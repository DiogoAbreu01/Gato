import {NextRequest,NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {actorFromSession,bad,sameOrigin} from '@/lib/http';
import {pageCreateSchema,defaultPageData,hasWorkspaceAccess} from '@/lib/workspace';

export async function GET(req:NextRequest){
 const actor=await actorFromSession();if(!actor)return bad('Login necessário',401);
 const departmentId=req.nextUrl.searchParams.get('departmentId');
 if(departmentId&&!hasWorkspaceAccess(actor,departmentId,'read'))return bad('Sem acesso a este espaço',403);
 const allowed=actor.globalRole==='ADMIN'||actor.globalRole==='BOARD'?null:actor.departments.map(x=>x.departmentId);
 const pages=await prisma.workspacePage.findMany({
  where:{archivedAt:null,departmentId:departmentId||{in:allowed??undefined}},
  select:{id:true,title:true,icon:true,kind:true,parentId:true,departmentId:true,version:true,updatedAt:true,
   favorites:{where:{userId:actor.id},select:{userId:true}}},
  orderBy:[{updatedAt:'desc'}],take:500
 });
 return NextResponse.json({pages:pages.map(({favorites,...p})=>({...p,favorite:favorites.length>0}))});
}
export async function POST(req:NextRequest){
 if(!sameOrigin(req))return bad('Origem inválida',403);
 const actor=await actorFromSession();if(!actor)return bad('Login necessário',401);
 const parsed=pageCreateSchema.safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return bad('Dados inválidos',422,parsed.error.flatten());
 const body=parsed.data;
 if(!hasWorkspaceAccess(actor,body.departmentId,'write'))return bad('Sem permissão para criar páginas',403);
 if(body.parentId){
  const parent=await prisma.workspacePage.findUnique({where:{id:body.parentId},select:{departmentId:true,archivedAt:true}});
  if(!parent||parent.archivedAt||parent.departmentId!==body.departmentId)return bad('Subpágina deve pertencer à mesma área',422);
 }
 const page=await prisma.$transaction(async tx=>{
  const p=await tx.workspacePage.create({data:{departmentId:body.departmentId,parentId:body.parentId||null,title:body.title,icon:body.icon||'🌙',kind:body.kind,content:[],data:defaultPageData(body.kind),createdById:actor.id,updatedById:actor.id}});
  await tx.auditLog.create({data:{userId:actor.id,action:'create',resource:'workspace',recordId:p.id,details:{departmentId:p.departmentId,kind:p.kind}}});
  return p;
 });
 return NextResponse.json({page},{status:201});
}
