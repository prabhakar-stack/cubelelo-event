/**
 * GET   /api/notifications        — list the signed-in user's notifications
 * PATCH /api/notifications         — mark all read, or { id } to mark one read
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongoose';
import { Notification } from '@/lib/models/Notification';

function uid(session: any): string | null {
  return (session?.user as any)?.userId ?? session?.user?.id ?? null;
}

export async function GET() {
  const session = await auth();
  const id = uid(session);
  if (!id) return NextResponse.json({ notifications: [], unread: 0 });

  await connectDB();
  const notifications = await Notification.find({ userId: id }).sort({ createdAt: -1 }).limit(30).lean();
  const unread = await Notification.countDocuments({ userId: id, read: false });
  return NextResponse.json({ notifications, unread });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  const id = uid(session);
  if (!id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  await connectDB();
  if (body.id) {
    await Notification.updateOne({ _id: body.id, userId: id }, { $set: { read: true } });
  } else {
    await Notification.updateMany({ userId: id, read: false }, { $set: { read: true } });
  }
  return NextResponse.json({ ok: true });
}
