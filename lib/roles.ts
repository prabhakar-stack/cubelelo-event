import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export type Role = 'user' | 'judge' | 'moderator' | 'admin';

const ADMIN_EMAILS = ['prabhakar@cubelelo.com', process.env.NEXTAUTH_ADMIN_EMAIL].filter(Boolean) as string[];

const KNOWN: Role[] = ['user', 'judge', 'moderator', 'admin'];

export function isRole(v: any): v is Role {
  return KNOWN.includes(v);
}

/** Resolve a session to a concrete role (admin emails are always admin). */
export function roleOf(session: any): Role {
  if (session?.user?.email && ADMIN_EMAILS.includes(session.user.email)) return 'admin';
  const r = session?.user?.role;
  return isRole(r) ? r : 'user';
}

/**
 * Gate an API route to a set of roles. Admin always passes.
 * Returns { session, role } on success, or a NextResponse error.
 */
export async function requireRole(allowed: Role[]): Promise<{ session: any; role: Role } | NextResponse> {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const role = roleOf(session);
  if (role === 'admin' || allowed.includes(role)) return { session, role };
  return NextResponse.json({ error: 'Forbidden — insufficient role' }, { status: 403 });
}

export function isAuthError(v: any): v is NextResponse {
  return v instanceof NextResponse;
}

/** Client-side helper: can this session role reach a capability? Admin always can. */
export function roleAllows(role: string | undefined, allowed: Role[]): boolean {
  return role === 'admin' || (isRole(role) && allowed.includes(role));
}
