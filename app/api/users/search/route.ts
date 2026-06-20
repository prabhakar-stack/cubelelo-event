/**
 * GET /api/users/search?q=name_or_clid
 * Public endpoint — returns name, userId, avatar for matching users
 */
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { User } from '@/lib/models/User';

/** Escape regex metacharacters so user input can't inject patterns / cause ReDoS. */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function GET(req: NextRequest) {
  await connectDB();
  const q = new URL(req.url).searchParams.get('q')?.trim() ?? '';
  if (!q || q.length < 2) return NextResponse.json({ users: [] });

  const safe = escapeRegex(q);
  const query = {
    $or: [
      { userId: { $regex: safe, $options: 'i' } },
      { 'name.firstName': { $regex: safe, $options: 'i' } },
      { 'name.lastName': { $regex: safe, $options: 'i' } },
    ],
  };

  const users = await User.find(query)
    .select('userId name.firstName name.lastName profilePicture')
    .sort({ 'name.firstName': 1 })
    .limit(50)
    .lean();

  return NextResponse.json({
    users: users.map((u: any) => ({
      clid: u.userId,
      name: [u.name?.firstName, u.name?.lastName].filter(Boolean).join(' '),
      avatarUrl: u.profilePicture ?? null,
    })),
  });
}
