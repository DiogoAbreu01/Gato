import {NextRequest,NextResponse} from 'next/server';
import {actorFromSession,bad,sameOrigin} from '@/lib/http';
import {oneRecord,updateRecord,removeRecord,HttpFailure} from '@/lib/records';
export const runtime='nodejs';
type Context={params:Promise<{resource:string;id:string}>};
function fail(e:unknown){if(e instanceof HttpFailure)return bad(e.message,e.status);console.error('records item request failed',e);return bad('Erro interno ao processar a solicitação',500)}
export async function GET(_req:NextRequest,{params}:Context){
  const actor=await actorFromSession();if(!actor)return bad('Login necessário',401);
  try{const {resource,id}=await params;return NextResponse.json({record:await oneRecord(resource,id,actor)});}catch(e){return fail(e)}
}
export async function PATCH(req:NextRequest,{params}:Context){
  if(!sameOrigin(req))return bad('Origem inválida',403);
  const actor=await actorFromSession();if(!actor)return bad('Login necessário',401);
  try{const {resource,id}=await params;const payload=await req.json();const record=await updateRecord(resource,id,payload.data,payload.version,actor);return NextResponse.json({record});}catch(e){return fail(e)}
}
export async function DELETE(req:NextRequest,{params}:Context){
  if(!sameOrigin(req))return bad('Origem inválida',403);
  const actor=await actorFromSession();if(!actor)return bad('Login necessário',401);
  try{const {resource,id}=await params;return NextResponse.json({record:await removeRecord(resource,id,actor)});}catch(e){return fail(e)}
}
