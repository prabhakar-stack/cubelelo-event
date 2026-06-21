/**
 * GET /api/admin/audit?limit=100&action=competition.create — recent admin actions.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/adminAuth';
import { connectDB } from '@/lib/mongoose';
import { AuditLog } from '@/lib/models/AuditLog';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;

  await connectDB();
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 500);
  const action = searchParams.get('action') ?? '';

  const query: Record<string, any> = {};
  if (action) query.action = action;

  const logs = await AuditLog.find(query).sort({ createdAt: -1 }).limit(limit).lean();
  return NextResponse.json({ logs, total: logs.length });
}
