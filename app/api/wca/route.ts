/**
 * GET /api/wca?wcaId=2019EXXX01  → verify WCA ID via WCA public API
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongoose';
import { User } from '@/lib/models/User';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const wcaId = new URL(req.url).searchParams.get('wcaId') ?? '';
  if (!wcaId) return NextResponse.json({ error: 'wcaId required' }, { status: 400 });

  try {
    const res = await fetch(`https://www.worldcubeassociation.org/api/v0/persons/${wcaId}`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return NextResponse.json({ verified: false, error: 'WCA ID not found' });
    }

    const data = await res.json();
    const person = data.person;

    // Auto-link if name roughly matches
    await connectDB();
    const user = await User.findOne({ email: session.user.email.toLowerCase() });
    if (user) {
      user.wcaId = wcaId;
      user.wcaVerified = true;
      await user.save();
    }

    return NextResponse.json({
      verified: true,
      wcaId,
      name: person?.name,
      country: person?.country?.name,
      avatar: person?.avatar?.url,
    });
  } catch (err) {
    // WCA API unavailable — flag for manual review
    return NextResponse.json({ verified: false, pending: true, error: 'WCA API unavailable — will be verified manually' });
  }
}
