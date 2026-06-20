/**
 * GET  /api/admin/users?q=search&role=user&limit=50
 * PATCH /api/admin/users  body: { userId, action: 'disable'|'enable'|'setRole', role? }
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/adminAuth';
import { connectDB } from '@/lib/mongoose';
import { User } from '@/lib/models/User';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
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
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;
  await connectDB();
  const { userId, action, role } = await req.json();
  if (!userId || !action) return NextResponse.json({ error: 'userId and action required' }, { status: 400 });

  const user = await User.findOne({ userId });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  if (action === 'disable') user.active = false;
  else if (action === 'enable') user.active = true;
  else if (action === 'setRole' && role) user.role = role;
  else return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  await user.save();
  return NextResponse.json({ ok: true, userId: user.userId, active: user.active, role: user.role });
}
