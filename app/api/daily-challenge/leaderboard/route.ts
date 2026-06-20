import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { DailyChallenge, DailyChallengeEntry } from '@/lib/models/DailyChallenge';

function todayIST(): string {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().split('T')[0];
}

function formatMs(ms: number | undefined, status: string): string {
  if (status === 'DNF' || ms == null) return 'DNF';
  if (status === '+2') ms += 2000;
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const msStr = (ms % 1000).toString().padStart(3, '0');
  return m > 0 ? `${m}:${s.toString().padStart(2,'0')}.${msStr}` : `${s}.${msStr}`;
}

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date') ?? todayIST();

  try {
    await connectDB();
    const challenge = await DailyChallenge.findOne({ date }).lean();
    if (!challenge) {
      return NextResponse.json({ leaderboard: [] });
    }

    const entries = await DailyChallengeEntry.find({
      challengeId: String((challenge as any)._id),
    })
      .sort({ timeInMs: 1 })
      .limit(100)
      .lean();

    // DNFs go last
    const ok = entries.filter(e => e.status !== 'DNF');
    const dnf = entries.filter(e => e.status === 'DNF');
    const sorted = [...ok, ...dnf];

    const leaderboard = sorted.map((e, i) => ({
      rank: i + 1,
      userId: e.userId,
      name: e.userName ?? 'Cuber',
      time: formatMs(e.timeInMs, e.status),
      status: e.status,
      submittedAt: e.submittedAt,
    }));

    return NextResponse.json({ leaderboard, date });
  } catch (err) {
    console.error('[daily-challenge leaderboard GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
