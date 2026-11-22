import { cookies } from 'next/headers';
import { randomBytes, createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

const COOKIE = process.env.SESSION_COOKIE_NAME || 'atletica_session';
const DAYS = 7;
export const normalizeEmail = (value: string) => value.trim().toLowerCase();
export const hashPassword = (plain: string) => bcrypt.hash(plain, 12);
export const checkPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
export const anonymousHash = (value: string) => createHash('sha256').update(value).digest('hex');

export async function getSession() {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw || raw.length !== 64) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(raw) },
    include: { user: { include: { departments: { include: { department: {select: {key:true}} } } } } }
  });
  if (!session || session.revokedAt || session.expiresAt <= new Date() || !session.user.active) return null;
  return session;
}

export async function startSession(userId: string) {
  const raw = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({ data: { userId, tokenHash: hashToken(raw), expiresAt } });
  (await cookies()).set(COOKIE, raw, {
    httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production',
    path: '/', expires: expiresAt
  });
}

export async function endSession() {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (raw) await prisma.session.updateMany({ where: { tokenHash: hashToken(raw), revokedAt: null }, data: { revokedAt: new Date() } });
  jar.delete(COOKIE);
}
