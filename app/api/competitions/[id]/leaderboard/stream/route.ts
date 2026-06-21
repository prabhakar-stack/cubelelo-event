/**
 * GET /api/competitions/[id]/leaderboard/stream?eventId=333
 * Server-Sent Events stream — pushes the ranked leaderboard whenever it changes.
 * Replaces client polling with a live push (matches PRD "no refresh needed").
 */
import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Result, isDNF, formatMs } from '@/lib/models/Result';
import { Competition } from '@/lib/models/Competition';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function resolveComp(id: string) {
  return Competition.findOne({
    $or: [...(id.length === 24 ? [{ _id: id }] : []), { competitionId: id }],
  }).lean() as Promise<any>;
}

async function buildLeaderboard(compId: string, eventId: string) {
  const query: Record<string, any> = { competitionId: compId };
  if (eventId) query.eventId = eventId;
  const results = await Result.find(query).sort({ averageTime: 1, bestTime: 1 }).lean() as any[];

  let rank = 1;
  return results.map((r, i) => {
    if (i > 0) {
      const prev = results[i - 1];
      if (r.averageTime !== prev.averageTime || r.bestTime !== prev.bestTime) rank = i + 1;
    }
    return {
      rank,
      userId: r.userId,
      name: `${r.firstName} ${r.lastName}`.trim(),
      average: isDNF(r.averageTime) ? 'DNF' : formatMs(r.averageTime),
      best: isDNF(r.bestTime) ? 'DNF' : formatMs(r.bestTime),
      flagStatus: r.status?.verified,
      eventId: r.eventId,
    };
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const eventId = new URL(req.url).searchParams.get('eventId') ?? '';

  await connectDB();
  const comp = await resolveComp(id);
  if (!comp) return new Response('Not found', { status: 404 });
  const compId = comp.competitionId ?? comp._id.toString();

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      let lastHash = '';
      const send = (event: string, data: any) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      const tick = async () => {
        if (closed) return;
        try {
          const lb = await buildLeaderboard(compId, eventId);
          const hash = JSON.stringify(lb.map(r => [r.userId, r.average, r.best, r.flagStatus]));
          if (hash !== lastHash) {
            lastHash = hash;
            send('leaderboard', { leaderboard: lb, total: lb.length });
          }
        } catch { /* ignore a transient tick error */ }
      };

      send('ping', { ok: true });
      await tick();

      const interval = setInterval(tick, 3000);
      const keepalive = setInterval(() => { if (!closed) controller.enqueue(encoder.encode(': keepalive\n\n')); }, 20000);

      req.signal.addEventListener('abort', () => {
        closed = true;
        clearInterval(interval);
        clearInterval(keepalive);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
