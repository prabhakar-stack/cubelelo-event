/**
 * GET /api/orders?compId=XXX
 * Check if current user is registered for a competition.
 * Returns: { registered: bool, events: string[], participant?: IPaidParticipant }
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongoose';
import { PaidParticipant } from '@/lib/models/PaidParticipant';
import { User } from '@/lib/models/User';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ registered: false });
    }

    const compId = new URL(req.url).searchParams.get('compId');
    if (!compId) return NextResponse.json({ error: 'compId required' }, { status: 400 });

    await connectDB();
    const user = await User.findOne({ email: session.user.email.toLowerCase() }).lean() as any;
    if (!user) return NextResponse.json({ registered: false });

    const participant = await PaidParticipant.findOne({
      competitionId: compId,
      userId: user.userId,
    }).lean();

    return NextResponse.json({
      registered: !!participant,
      events: (participant as any)?.events ?? [],
      participant: participant ?? null,
    });
  } catch (err) {
    console.error('[GET /api/orders]', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
