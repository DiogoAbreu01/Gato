import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { normalizeEmail, checkPassword, startSession, anonymousHash } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { bad, sameOrigin } from '@/lib/http';
const schema = z.object({ email: z.string().email().max(254), password: z.string().min(1).max(1024) });

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return bad('Origem inválida',403);
  const json = await req.json().catch(()=>null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return bad('Preencha e-mail e senha corretamente',422);
  const email = normalizeEmail(parsed.data.email);
  const key = anonymousHash(email);
  const throttle = await prisma.loginThrottle.findUnique({where:{key}});
  if (throttle?.blockedUntil && throttle.blockedUntil > new Date()) return bad('Muitas tentativas. Tente novamente depois.',429);
  const user = await prisma.user.findUnique({where:{email}});
  const ok = user?.active && await checkPassword(parsed.data.password,user.passwordHash);
  if (!ok) {
    const failures = (throttle?.updatedAt && Date.now() - throttle.updatedAt.getTime() < 30 * 60_000 ? throttle.failures : 0) + 1;
    await prisma.loginThrottle.upsert({where:{key},create:{key,failures,blockedUntil:failures>=5?new Date(Date.now()+15*60_000):null},update:{failures,blockedUntil:failures>=5?new Date(Date.now()+15*60_000):null}});
    return bad('Credenciais inválidas',401);
  }
  await prisma.loginThrottle.deleteMany({where:{key}});
  await startSession(user.id);
  return NextResponse.json({ok:true});
}
