/**
 * POST /api/auth/migrate-claim
 * Step 1: Enter CL ID or old email → sends OTP to their email
 * Step 2: { token, otp, password } → activates account
 */
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongoose';
import { User } from '@/lib/models/User';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await connectDB();

    // ── Step 1: lookup by CL ID or email ────────────────────────────────
    if (body.step === 'lookup') {
      const { identifier } = body;
      if (!identifier) return NextResponse.json({ error: 'CL ID or email required' }, { status: 400 });

      const user = await User.findOne({
        $or: [
          { userId: identifier.toUpperCase() },
          { email: identifier.toLowerCase() },
        ],
      }).select('+resetToken +resetTokenExpiry');

      if (!user) return NextResponse.json({ error: 'No account found with that CL ID or email' }, { status: 404 });
      if (user.password && user.password.length > 10) {
        return NextResponse.json({ error: 'This account is already activated. Please sign in.' }, { status: 400 });
      }

      // Generate 6-digit OTP stored as resetToken
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const claimToken = crypto.randomBytes(32).toString('hex');
      user.resetToken = `${claimToken}:${otp}`;
      user.resetTokenExpiry = new Date(Date.now() + 1800_000); // 30 min
      await user.save();

      // Mask email for display
      const email = user.email;
      const masked = email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(Math.min(b.length, 4)) + c);

      // Send OTP email
      if (process.env.RESEND_API_KEY) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'noreply@cubelelo.com',
            to: email,
            subject: 'Your Cubelelo account activation OTP',
            html: `<h2>Activate your Cubelelo account</h2><p>Your OTP is: <strong style="font-size:24px;letter-spacing:4px">${otp}</strong></p><p>Valid for 30 minutes.</p>`,
          }),
        });
      } else {
        console.log('[migrate-claim] OTP for', email, ':', otp);
      }

      return NextResponse.json({ ok: true, claimToken, maskedEmail: masked, userId: user.userId });
    }

    // ── Step 2: verify OTP + set password ───────────────────────────────
    if (body.step === 'activate') {
      const { claimToken, otp, password } = body;
      if (!claimToken || !otp || !password) {
        return NextResponse.json({ error: 'claimToken, otp, and password required' }, { status: 400 });
      }
      if (password.length < 6) return NextResponse.json({ error: 'Password too short' }, { status: 400 });

      const user = await User.findOne({
        resetToken: `${claimToken}:${otp}`,
        resetTokenExpiry: { $gt: new Date() },
      }).select('+resetToken +resetTokenExpiry');

      if (!user) return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });

      user.password = await bcrypt.hash(password, 10);
      user.resetToken = undefined;
      user.resetTokenExpiry = undefined;
      user.active = true;
      await user.save();

      return NextResponse.json({ ok: true, email: user.email, userId: user.userId });
    }

    return NextResponse.json({ error: 'Invalid step' }, { status: 400 });
  } catch (err) {
    console.error('[migrate-claim]', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
