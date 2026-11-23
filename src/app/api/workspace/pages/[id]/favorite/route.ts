import {NextRequest,NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {actorFromSession,bad,sameOrigin} from '@/lib/http';
import {hasWorkspaceAccess} from '@/lib/workspace';
type C={params:Promise<{id:string}>};
export async function POST(req:NextRequest,{params}:C){
 if(!sameOrigin(req))return bad('Origem inválida',403);
 const actor=await actorFromSession();if(!actor)return bad('Login necessário',401);
 const {id}=await params;
 const page=await prisma.workspacePage.findUnique({where:{id},select:{id:true,departmentId:true,archivedAt:true}});
 if(!page||page.archivedAt)return bad('Página não encontrada',404);
 if(!hasWorkspaceAccess(actor,page.departmentId,'read'))return bad('Sem acesso',403);
 const existing=await prisma.workspacePageFavorite.findUnique({where:{pageId_userId:{pageId:id,userId:actor.id}}});
 if(existing){await prisma.workspacePageFavorite.delete({where:{pageId_userId:{pageId:id,userId:actor.id}}});return NextResponse.json({favorite:false});}
 await prisma.workspacePageFavorite.create({data:{pageId:id,userId:actor.id}});
 return NextResponse.json({favorite:true});
}
