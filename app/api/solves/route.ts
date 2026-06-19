/**
 * GET  /api/solves  — get user's solve history (auth required)
 * POST /api/solves  — save a new solve (auth required)
 *
 * Query params for GET:
 *   puzzleType — filter by event
 *   sessionId  — filter by session
 *   limit      — default 100
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongoose';
import { Solve } from '@/lib/models/Solve';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const puzzleType = searchParams.get('puzzleType');
    const sessionId = searchParams.get('sessionId');
    const limit = parseInt(searchParams.get('limit') ?? '100');

    const filter: Record<string, any> = { userId: session.user.id };
    if (puzzleType) filter.puzzleType = puzzleType;
    if (sessionId) filter.sessionId = sessionId;

    const solves = await Solve.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ solves });
  } catch (err) {
    console.error('[GET /api/solves]', err);
    return NextResponse.json({ error: 'Failed to fetch solves' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { puzzleType, timeInMs, scramble, status, notes, sessionId, sessionName } = body;

    if (!puzzleType || timeInMs == null || !scramble) {
      return NextResponse.json(
        { error: 'puzzleType, timeInMs, scramble are required' },
        { status: 400 }
      );
    }

    // Check PB
    const currentBest = await Solve.findOne({
      userId: session.user.id,
      puzzleType,
      status: 'OK',
    })
      .sort({ timeInMs: 1 })
      .lean();

    const isPB =
      status === 'OK' &&
      (!currentBest || timeInMs < (currentBest as any).timeInMs);

    const solve = await Solve.create({
      userId: session.user.id,
      sessionId,
      sessionName,
      puzzleType,
      timeInMs,
      scramble,
      status: status ?? 'OK',
      notes,
      isPB,
    });

    return NextResponse.json({ solve, isPB }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/solves]', err);
    return NextResponse.json({ error: 'Failed to save solve' }, { status: 500 });
  }
}
