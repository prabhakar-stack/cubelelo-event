import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongoose';
import { DailyChallenge, DailyChallengeEntry } from '@/lib/models/DailyChallenge';
import { computeDailyStreak } from '@/lib/utils/streak';

const MOVES_3x3 = ['R','L','U','D','F','B'];
const MODS = ["","'","2"];
function serverScramble3x3(): string {
  const moves: string[] = [];
  let last = '';
  for (let i = 0; i < 20; i++) {
    let m = MOVES_3x3[Math.floor(Math.random() * MOVES_3x3.length)];
    while (m === last) m = MOVES_3x3[Math.floor(Math.random() * MOVES_3x3.length)];
    last = m;
    moves.push(m + MODS[Math.floor(Math.random() * MODS.length)]);
  }
  return moves.join(' ');
}

function todayIST(): string {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().split('T')[0];
}

async function getOrCreateChallenge(date: string) {
  let challenge = await DailyChallenge.findOne({ date });
  if (!challenge) {
    const scramble = serverScramble3x3();
    challenge = await DailyChallenge.create({ date, puzzleType: '3x3x3', scramble });
  }
  return challenge;
}

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date') ?? todayIST();
  const session = await auth();

  try {
    await connectDB();
    const challenge = await getOrCreateChallenge(date);

    let myEntry = null;
    let streak = 0;
    // Key on CL ID so streaks match the public profile (falls back to id only if absent).
    const uid = (session?.user as any)?.userId ?? session?.user?.id;
    if (uid) {
      myEntry = await DailyChallengeEntry.findOne({
        challengeId: String(challenge._id),
        userId: uid,
      }).lean();
      streak = await computeDailyStreak(uid);
    }

    return NextResponse.json({ challenge, myEntry, streak });
  } catch (err) {
    console.error('[daily-challenge GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { timeInMs, status, date } = await req.json();
  const targetDate = date ?? todayIST();
  const uid = (session.user as any).userId ?? session.user.id;

  try {
    await connectDB();
    const challenge = await getOrCreateChallenge(targetDate);

    const existing = await DailyChallengeEntry.findOne({
      challengeId: String(challenge._id),
      userId: uid,
    });
    if (existing) {
      return NextResponse.json({ error: 'Already submitted today' }, { status: 409 });
    }

    const entry = await DailyChallengeEntry.create({
      challengeId: String(challenge._id),
      date: targetDate,
      userId: uid,
      userName: (session.user as any).name ?? session.user.email,
      timeInMs: typeof timeInMs === 'number' ? timeInMs : undefined,
      status: status ?? 'OK',
    });

    return NextResponse.json({ entry, ok: true });
  } catch (err: any) {
    if (err.code === 11000) {
      return NextResponse.json({ error: 'Already submitted today' }, { status: 409 });
    }
    console.error('[daily-challenge POST]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
