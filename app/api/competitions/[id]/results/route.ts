/**
 * GET  /api/competitions/[id]/results?eventId=333
 *   → Returns ranked results for the event
 *
 * POST /api/competitions/[id]/results
 *   Body: { eventId, value1..5, plus2Array, videoLink, userId? }
 *   → Saves result, updates eventbests
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongoose';
import { Result, computeAo5, isDNF } from '@/lib/models/Result';
import { EventBest } from '@/lib/models/EventBest';
import { Competition } from '@/lib/models/Competition';
import { User } from '@/lib/models/User';
import { PaidParticipant } from '@/lib/models/PaidParticipant';

const DNF = 360000;

async function resolveComp(id: string) {
  return Competition.findOne({
    $or: [
      ...(id.length === 24 ? [{ _id: id }] : []),
      { competitionId: id },
    ],
  }).lean() as Promise<any>;
}

// ── GET ──────────────────────────────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const eventId = new URL(req.url).searchParams.get('eventId') ?? '';
    await connectDB();

    const comp = await resolveComp(id);
    if (!comp) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const compId = comp.competitionId ?? comp._id.toString();

    const query: Record<string, any> = { competitionId: compId };
    if (eventId) query.eventId = eventId;

    const results = await Result.find(query)
      .sort({ averageTime: 1, bestTime: 1 })
      .lean();

    // Rank within each event
    const ranked = results.map((r, i) => ({ ...r, rank: i + 1 }));

    return NextResponse.json({ results: ranked, total: ranked.length });
  } catch (err) {
    console.error('[GET results]', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// ── POST ─────────────────────────────────────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const {
      eventId,
      value1 = DNF, value2 = DNF, value3 = DNF, value4 = DNF, value5 = DNF,
      plus2Array = [],
      videoLink = null,
    } = body;

    if (!eventId) {
      return NextResponse.json({ error: 'eventId required' }, { status: 400 });
    }

    await connectDB();

    const comp = await resolveComp(id);
    if (!comp) return NextResponse.json({ error: 'Competition not found' }, { status: 404 });
    const compId = comp.competitionId ?? comp._id.toString();

    const user = await User.findOne({ email: session.user.email.toLowerCase() }).lean() as any;
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Must be registered
    const reg = await PaidParticipant.findOne({ competitionId: compId, userId: user.userId }).lean();
    if (!reg) {
      return NextResponse.json({ error: 'Not registered for this competition' }, { status: 403 });
    }

    const vals = [value1, value2, value3, value4, value5];

    // Apply +2 penalties
    const adjusted = vals.map((v, i) =>
      plus2Array.includes(String(i + 1)) && !isDNF(v) ? v + 2000 : v
    );

    const bestTime = Math.min(...adjusted);
    const averageTime = computeAo5(adjusted);

    // ── Statistical outlier flag (PRD §3.4 — Must Have) ─────────────────────
    // Flag if result is >30% faster than user's historical best for this event
    let flagStatus: 'ok' | 'flagged' = 'ok';
    const historicalBest = await EventBest.findOne({ userId: user.userId, eventId }).lean() as any;
    if (historicalBest?.bestSingle) {
      const histMs = parseInt(historicalBest.bestSingle);
      if (histMs > 0 && histMs < DNF && bestTime < DNF) {
        const improvement = (histMs - bestTime) / histMs;
        if (improvement > 0.30) flagStatus = 'flagged'; // >30% faster
      }
    }

    const resultId = `${compId}${eventId}${user.userId}`;

    // Upsert (one result per user per event per competition)
    const result = await Result.findOneAndUpdate(
      { resultId },
      {
        $set: {
          resultId,
          firstName: user.name?.firstName ?? '',
          lastName: user.name?.lastName ?? '',
          email: user.email,
          competitionId: compId,
          competitionName: comp.competitionName,
          eventId,
          userId: user.userId,
          wcaId: user.wcaId ?? 'NA',
          country: user.country ?? 'India',
          bestTime,
          averageTime,
          value1, value2, value3, value4, value5,
          plus2Array,
          'videoLink.videoLink': videoLink,
          'status.verified': flagStatus,
          'status.flagReason': flagStatus === 'flagged'
            ? `Result ${((1 - bestTime / (historicalBest?.bestSingle ? parseInt(historicalBest.bestSingle) : bestTime)) * 100).toFixed(0)}% faster than historical best`
            : undefined,
        },
      },
      { upsert: true, new: true }
    );

    // Update EventBest
    const existingBest = await EventBest.findOne({ userId: user.userId, eventId }).lean() as any;
    const shouldUpdate = !existingBest ||
      bestTime < parseInt(existingBest.bestSingle) ||
      (averageTime < parseInt(existingBest.bestAverage ?? String(DNF)));

    if (shouldUpdate) {
      await EventBest.findOneAndUpdate(
        { userId: user.userId, eventId },
        {
          $set: {
            competitionId: compId,
            userId: user.userId,
            name: `${user.name?.firstName ?? ''} ${user.name?.lastName ?? ''}`.trim(),
            eventId,
            bestSingle: String(bestTime),
            bestAverage: isDNF(averageTime) ? String(DNF) : String(averageTime),
          },
        },
        { upsert: true }
      );
    }

    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error('[POST results]', err);
    return NextResponse.json({ error: 'Failed to save result' }, { status: 500 });
  }
}
