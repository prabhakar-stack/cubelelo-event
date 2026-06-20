// GET /api/profile/[clid] — public profile by userId (clid)
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { User } from '@/lib/models/User';
import { EventBest } from '@/lib/models/EventBest';
import { PaidParticipant } from '@/lib/models/PaidParticipant';
import { Result } from '@/lib/models/Result';
import { Competition } from '@/lib/models/Competition';
import { computeDailyStreak } from '@/lib/utils/streak';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clid: string }> }
) {
  try {
    const { clid } = await params;
    await connectDB();

    const user = await User.findOne({ userId: clid })
      .select('-password -token -email')
      .lean() as any;
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const userId = user.userId;

    const [pbs, registrations, streak] = await Promise.all([
      EventBest.find({ userId }).lean() as Promise<any[]>,
      PaidParticipant.find({ userId }).sort({ regDateAndTime: -1 }).limit(20).lean() as Promise<any[]>,
      computeDailyStreak(userId),
    ]);

    const compIds = registrations.map((r: any) => r.competitionId).filter(Boolean);
    const [competitions, resultsList] = await Promise.all([
      compIds.length > 0 ? Competition.find({ competitionId: { $in: compIds } }).lean() as Promise<any[]> : Promise.resolve([]),
      compIds.length > 0 ? Result.find({ userId, competitionId: { $in: compIds } }).lean() as Promise<any[]> : Promise.resolve([]),
    ]);

    const compMap = new Map(competitions.map((c: any) => [c.competitionId, c]));
    const resultsByComp = new Map<string, any[]>();
    for (const r of resultsList) {
      const arr = resultsByComp.get(r.competitionId) ?? [];
      arr.push(r);
      resultsByComp.set(r.competitionId, arr);
    }

    const history = registrations.map((reg: any) => {
      const comp = compMap.get(reg.competitionId);
      const results = resultsByComp.get(reg.competitionId) ?? [];
      return {
        competitionId: reg.competitionId,
        competitionName: comp?.competitionName ?? reg.competitionId,
        events: reg.events ?? [],
        registeredAt: reg.regDateAndTime,
        results: results.map((r: any) => ({
          eventId: r.eventId,
          bestTime: r.bestTime,
          averageTime: r.averageTime,
        })),
      };
    });

    return NextResponse.json({
      user,
      streak,
      pbs: pbs.map((p: any) => ({
        eventId: p.eventId,
        bestSingle: p.bestSingle,
        bestAverage: p.bestAverage,
      })),
      history,
    });
  } catch (err) {
    console.error('[GET profile/clid]', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
