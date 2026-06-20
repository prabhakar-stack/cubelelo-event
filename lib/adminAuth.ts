import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

const ADMIN_EMAILS = ['prabhakar@cubelelo.com', process.env.NEXTAUTH_ADMIN_EMAIL].filter(Boolean) as string[];

export async function requireAdmin(req?: NextRequest): Promise<{ session: any } | NextResponse> {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!ADMIN_EMAILS.includes(session.user.email) && session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 });
  }
  return { session };
}

export function isAuthError(v: any): v is NextResponse {
  return v instanceof NextResponse;
}
