/**
 * POST /api/auth/resend-verification — re-send the verification email to the
 * signed-in user. Always returns ok (no enumeration; no-op if already verified).
 */
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongoose';
import { User } from '@/lib/models/User';
import { sendEmail, emailLayout, baseUrl } from '@/lib/email';

export async function POST() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  await connectDB();
  const user = await User.findOne({ email: session.user.email.toLowerCase() });
  if (!user || user.emailVerified) return NextResponse.json({ ok: true });

  const token = crypto.randomBytes(32).toString('hex');
  user.verifyToken = token;
  user.verifyTokenExpiry = new Date(Date.now() + 24 * 3600_000);
  await user.save();

  await sendEmail({
    to: user.email,
    subject: 'Verify your Cubelelo email',
    html: emailLayout(
      'Confirm your email',
      '<p>Confirm your email to register for paid competitions. This link expires in 24 hours.</p>',
      { label: 'Verify email', url: `${baseUrl()}/verify-email?token=${token}` },
    ),
  });

  return NextResponse.json({ ok: true });
}
