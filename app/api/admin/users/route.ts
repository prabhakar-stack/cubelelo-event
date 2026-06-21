/**
 * GET  /api/admin/users?q=search&role=user&limit=50
 * PATCH /api/admin/users  body: { userId, action: 'disable'|'enable'|'setRole', role? }
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireRole, isAuthError, isRole } from '@/lib/roles';
import { connectDB } from '@/lib/mongoose';
import { User } from '@/lib/models/User';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  const auth = await requireRole(['moderator']);
  if (isAuthError(auth)) return auth;
  await connectDB();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? '';
  const role = searchParams.get('role') ?? '';
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200);
  const skip = parseInt(searchParams.get('skip') ?? '0');

  const query: Record<string, any> = {};
  if (q) {
    query.$or = [
      { email: { $regex: q, $options: 'i' } },
      { userId: { $regex: q, $options: 'i' } },
      { 'name.firstName': { $regex: q, $options: 'i' } },
      { 'name.lastName': { $regex: q, $options: 'i' } },
      { wcaId: { $regex: q, $options: 'i' } },
    ];
  }
  if (role) query.role = role;

  const [users, total] = await Promise.all([
    User.find(query).select('-password -token -resetToken').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(query),
  ]);
  return NextResponse.json({ users, total, limit, skip });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireRole(['moderator']);
  if (isAuthError(auth)) return auth;
  await connectDB();
  const { userId, action, role } = await req.json();
  if (!userId || !action) return NextResponse.json({ error: 'userId and action required' }, { status: 400 });

  const user = await User.findOne({ userId });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  if (action === 'disable') user.active = false;
  else if (action === 'enable') user.active = true;
  else if (action === 'setRole') {
    // Only full admins may change roles, and only to a known role.
    if (auth.role !== 'admin') return NextResponse.json({ error: 'Only admins can change roles' }, { status: 403 });
    if (!isRole(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    user.role = role;
  }
  else return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  await user.save();
  await logAudit(auth.session, `user.${action}`, { target: userId, meta: { role: user.role, active: user.active } });
  return NextResponse.json({ ok: true, userId: user.userId, active: user.active, role: user.role });
}
