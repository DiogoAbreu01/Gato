import { NextRequest,NextResponse } from 'next/server';
import { actorFromSession, bad, sameOrigin } from '@/lib/http';
import { listRecords,createRecord,HttpFailure } from '@/lib/records';
export const runtime='nodejs';
type Context={params:Promise<{resource:string}>};
function fail(error:unknown) {
  if (error instanceof HttpFailure) return bad(error.message,error.status);
  console.error('records collection request failed',error);
  return bad('Erro interno ao processar a solicitação',500);
}
export async function GET(req:NextRequest,{params}:Context){
  const actor=await actorFromSession();if(!actor)return bad('Login necessário',401);
  try{
    const {resource}=await params;
    const search=new URL(req.url).searchParams;
    const page=Math.min(10000,Math.max(0,Number(search.get('page')||0)||0));
    return NextResponse.json(await listRecords(resource,actor,page,search.get('q')||''));
  }catch(e){return fail(e)}
}
export async function POST(req:NextRequest,{params}:Context){
  if(!sameOrigin(req))return bad('Origem inválida',403);
  const actor=await actorFromSession();if(!actor)return bad('Login necessário',401);
  try{
    const {resource}=await params;
    const input=await req.json();
    const record=await createRecord(resource,input,actor);
    return NextResponse.json({record},{status:201});
  }catch(e){return fail(e)}
}
