import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
export async function GET(){
  const session=await getSession();
  if(!session) return NextResponse.json({error:'Autenticação necessária'},{status:401});
  const {id,name,email,globalRole,departments}=session.user;
  return NextResponse.json({id,name,email,globalRole,departments});
}
