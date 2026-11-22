import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {NextResponse} from 'next/server';
import {actorFromSession,bad} from '@/lib/http';
import {can} from '@/lib/rbac';
import {prisma} from '@/lib/prisma';
export const runtime='nodejs';
type C={params:Promise<{id:string}>};
export async function GET(_req:Request,{params}:C){
 const actor=await actorFromSession();if(!actor)return bad('Login necessário',401);
 const {id}=await params;const doc=await prisma.document.findUnique({where:{id}});
 if(!doc||doc.archivedAt||!doc.storageKey)return bad('Arquivo inexistente',404);
 if(!can(actor,'documents','read',doc.departmentId))return bad('Sem permissão',403);
 const dir=process.env.STORAGE_DIR||path.join(process.cwd(),'storage');
 try{
  const bytes=await readFile(path.join(dir,doc.storageKey));
  const safeName=(doc.fileName||'documento').replace(/[\r\n"\\]/g,'_');
  return new NextResponse(new Uint8Array(bytes),{headers:{'Content-Type':'application/octet-stream','Content-Disposition':`attachment; filename="${safeName}"`,'X-Content-Type-Options':'nosniff','Cache-Control':'private, no-store'}});
 }catch{return bad('Arquivo temporariamente indisponível',503)}
}
