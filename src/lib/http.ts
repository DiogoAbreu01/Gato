import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import type { Actor } from '@/lib/rbac';

export function bad(message: string, status = 400, detail?: unknown) {
  return NextResponse.json({ error: message, ...(detail ? { detail } : {}) }, { status });
}
export async function actorFromSession(): Promise<Actor | null> {
  const session = await getSession();
  if (!session) return null;
  return { id: session.user.id, globalRole: session.user.globalRole, departments: session.user.departments.map(d=>({ departmentId:d.departmentId, role:d.role, key:d.department.key })) };
}
export function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  // Permitir clientes sem Origin somente em endpoints de leitura. Mutações browser são obrigadas a enviar Origin.
  if (!origin) return false;
  try {
    const expected = new URL(process.env.APP_URL || 'http://localhost:3000');
    const actual = new URL(origin);
    return actual.origin === expected.origin;
  } catch { return false; }
}
