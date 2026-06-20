/**
 * GET /api/competitions/[id]/leaderboard?eventId=333
 * Returns live ranking sorted by averageTime (DNF last), then bestTime
 */
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Result, isDNF, formatMs } from '@/lib/models/Result';
import { Competition } from '@/lib/models/Competition';

const DNF = 360000;

async function resolveComp(id: string) {
  return Competition.findOne({
    $or: [
      ...(id.length === 24 ? [{ _id: id }] : []),
      { competitionId: id },
    ],
  }).lean() as Promise<any>;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const eventId = url.searchParams.get('eventId') ?? '';

    await connectDB();
    const comp = await resolveComp(id);
    if (!comp) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const compId = comp.competitionId ?? comp._id.toString();

    const query: Record<string, any> = { competitionId: compId };
    if (eventId) query.eventId = eventId;

    // Fetch all results, sort DNF last
    const results = await Result.find(query)
      .sort({ averageTime: 1, bestTime: 1 })
      .lean() as any[];

    // Rank — ties share the same rank
    let rank = 1;
    const leaderboard = results.map((r, i) => {
      if (i > 0) {
        const prev = results[i - 1];
        if (r.averageTime !== prev.averageTime || r.bestTime !== prev.bestTime) {
          rank = i + 1;
        }
      }
      return {
        rank,
        userId: r.userId,
        name: `${r.firstName} ${r.lastName}`.trim(),
        wcaId: r.wcaId,
        country: r.country,
        average: isDNF(r.averageTime) ? 'DNF' : formatMs(r.averageTime),
        best: isDNF(r.bestTime) ? 'DNF' : formatMs(r.bestTime),
        solves: [r.value1, r.value2, r.value3, r.value4, r.value5].map((v: number) =>
          isDNF(v) ? 'DNF' : formatMs(v)
        ),
        flagStatus: r.status?.verified,
        eventId: r.eventId,
      };
    });

    return NextResponse.json({
      leaderboard,
      total: leaderboard.length,
      competitionName: comp.competitionName,
      eventId: eventId || 'all',
    });
  } catch (err) {
    console.error('[GET leaderboard]', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
