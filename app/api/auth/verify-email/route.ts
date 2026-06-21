/**
 * POST /api/auth/verify-email  { token }  — consume a verification token.
 */
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { User } from '@/lib/models/User';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 });

    await connectDB();
    const user = await User.findOne({ verifyToken: token }).select('+verifyToken +verifyTokenExpiry');
    if (!user) return NextResponse.json({ error: 'Invalid or already-used link' }, { status: 400 });

    if (user.verifyTokenExpiry && user.verifyTokenExpiry.getTime() < Date.now()) {
      return NextResponse.json({ error: 'This verification link has expired — request a new one.' }, { status: 400 });
    }

    user.emailVerified = true;
    user.verifyToken = undefined;
    user.verifyTokenExpiry = undefined;
    await user.save();

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[verify-email]', err);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
