/**
 * POST /api/auth/register
 * Creates a new user account with email + password.
 * Same logic as the credentials provider registration.
 */
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/mongoose';
import { User } from '@/lib/models/User';
import { sendEmail, emailLayout, baseUrl } from '@/lib/email';

function generateCLID(): string {
  const year = new Date().getFullYear().toString().slice(-2);
  const rand = Math.floor(Math.random() * 900 + 100);
  const state = 'CL';
  const suffix = Math.floor(Math.random() * 900 + 100);
  return `${year}${state}${rand}${suffix}`;
}

export async function POST(req: NextRequest) {
  const { email, password, firstName, lastName, state: userState } = await req.json();

  if (!email || !password || password.length < 8) {
    return NextResponse.json({ error: 'Email and password (min 8 chars) are required' }, { status: 400 });
  }

  try {
    await connectDB();

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const bcrypt = await import('bcryptjs');
    const hashed = await bcrypt.hash(password, 10);

    let userId = generateCLID();
    // Ensure uniqueness
    let attempts = 0;
    while (await User.findOne({ userId }) && attempts < 5) {
      userId = generateCLID();
      attempts++;
    }

    const verifyToken = crypto.randomBytes(32).toString('hex');

    const user = await User.create({
      email: email.toLowerCase().trim(),
      password: hashed,
      userId,
      name: { firstName: firstName ?? '', lastName: lastName ?? '' },
      country: userState ?? 'IN',
      role: 'user',
      active: true,
      emailVerified: false,
      verifyToken,
      verifyTokenExpiry: new Date(Date.now() + 24 * 3600_000),
    });

    const verifyUrl = `${baseUrl()}/verify-email?token=${verifyToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Verify your Cubelelo email',
      html: emailLayout(
        'Confirm your email',
        '<p>Welcome to Cubelelo Events! Confirm your email to register for paid competitions. This link expires in 24 hours.</p>',
        { label: 'Verify email', url: verifyUrl },
      ),
    });

    return NextResponse.json({
      ok: true,
      userId: user.userId,
      email: user.email,
    });
  } catch (err: any) {
    if (err.code === 11000) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }
    console.error('[register POST]', err);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
