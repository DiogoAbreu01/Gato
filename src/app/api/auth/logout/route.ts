import { NextRequest, NextResponse } from 'next/server';
import { endSession } from '@/lib/auth';
import { bad, sameOrigin } from '@/lib/http';
export async function POST(req:NextRequest){
  if(!sameOrigin(req)) return bad('Origem inválida',403);
  await endSession();
  return NextResponse.json({ok:true});
}
