import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/mongoose';
import { User } from '@/lib/models/User';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase() });
    // Always return success to prevent email enumeration
    if (!user) return NextResponse.json({ ok: true });

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600_000); // 1 hour

    user.resetToken = token;
    user.resetTokenExpiry = expiry;
    await user.save();

    const resetUrl = `${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/reset-password?token=${token}`;

    // Send email — using Resend if configured, else log to console
    if (process.env.RESEND_API_KEY) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'noreply@cubelelo.com',
            to: email,
            subject: 'Reset your Cubelelo password',
            html: `
              <h2>Reset your password</h2>
              <p>Click the link below to reset your password. This link expires in 1 hour.</p>
              <a href="${resetUrl}" style="background:#00dbe7;color:black;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
                Reset Password
              </a>
              <p>Or copy: ${resetUrl}</p>
              <p>If you didn't request this, ignore this email.</p>
            `,
          }),
        });
        if (!res.ok) console.error('[forgot-password] Resend error:', await res.text());
      } catch (e) {
        console.error('[forgot-password] Email send failed:', e);
      }
    } else {
      console.log('[forgot-password] Reset URL:', resetUrl);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[forgot-password]', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
