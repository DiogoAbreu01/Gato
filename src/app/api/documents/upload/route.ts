import {NextRequest,NextResponse} from 'next/server';
import {randomUUID} from 'node:crypto';
import {mkdir,writeFile,unlink} from 'node:fs/promises';
import path from 'node:path';
import {z} from 'zod';
import {actorFromSession,bad,sameOrigin} from '@/lib/http';
import {can} from '@/lib/rbac';
import {prisma} from '@/lib/prisma';
export const runtime='nodejs';
const MAX=10*1024*1024;
const whitelist=new Set(['application/pdf','image/jpeg','image/png','text/plain','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);
const schema=z.object({title:z.string().trim().min(1).max(300),description:z.string().max(1000).optional(),departmentId:z.string().uuid()});
function validSignature(buffer:Buffer,type:string){
 if(type==='application/pdf')return buffer.subarray(0,5).toString()==='%PDF-';
 if(type==='image/png')return buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
 if(type==='image/jpeg')return buffer.subarray(0,3).equals(Buffer.from([255,216,255]));
 if(type.startsWith('application/vnd.openxmlformats'))return buffer.subarray(0,4).equals(Buffer.from([80,75,3,4]));
 return true;
}
export async function POST(req:NextRequest){
 if(!sameOrigin(req))return bad('Origem inválida',403);
 const actor=await actorFromSession();if(!actor)return bad('Login necessário',401);
 const form=await req.formData().catch(()=>null);if(!form)return bad('Formulário inválido',400);
 const file=form.get('file');if(!(file instanceof File))return bad('Arquivo obrigatório',422);
 const data=schema.safeParse({title:form.get('title'),description:form.get('description'),departmentId:form.get('departmentId')});
 if(!data.success)return bad('Título e diretoria obrigatórios',422);
 if(!can(actor,'documents','write',data.data.departmentId))return bad('Sem permissão',403);
 if(file.size>MAX||file.size===0||!whitelist.has(file.type))return bad('Tipo ou tamanho inválido. Máximo: 10 MB',422);
 const bytes=Buffer.from(await file.arrayBuffer());
 if(!validSignature(bytes,file.type))return bad('Assinatura de arquivo inválida',422);
 const key=randomUUID();const dir=process.env.STORAGE_DIR||path.join(process.cwd(),'storage');
 await mkdir(dir,{recursive:true,mode:0o700});const stored=path.join(dir,key);
 try{
  await writeFile(stored,bytes,{flag:'wx',mode:0o600});
  const record=await prisma.document.create({data:{title:data.data.title,description:data.data.description||null,departmentId:data.data.departmentId,fileName:path.basename(file.name).slice(0,255),contentType:file.type,sizeBytes:file.size,storageKey:key,private:true}});
  await prisma.auditLog.create({data:{userId:actor.id,resource:'documents',recordId:record.id,action:'upload',details:{sizeBytes:file.size,contentType:file.type}}});
  return NextResponse.json({record},{status:201});
 }catch(e){await unlink(stored).catch(()=>{});console.error('upload error',e);return bad('Não foi possível armazenar o arquivo',500)}
}
