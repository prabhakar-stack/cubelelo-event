/**
 * GET  /api/competitions  — list competitions (public)
 * POST /api/competitions  — create competition (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongoose';
import { Competition, toApiShape } from '@/lib/models/Competition';

// Map UI status filter → real DB query
function buildStatusFilter(uiStatus: string | null): Record<string, any> {
  if (!uiStatus || uiStatus === 'ALL') return {};
  switch (uiStatus) {
    case 'LIVE': return { status: 'live' };
    case 'COMPLETED': return { status: 'past' };
    case 'REGISTRATION_OPEN': return { status: 'upcoming', registrationOpen: true };
    case 'REGISTRATION_CLOSED': return { status: 'upcoming', registrationOpen: false };
    default: return {};
  }
}

// GET — public listing
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const uiStatus = searchParams.get('status');
    const eventType = searchParams.get('event');   // e.g. "3x3x3"
    const compType = searchParams.get('type');    // "PRACTICE" | "STANDARD"
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200);
    const skip = parseInt(searchParams.get('skip') ?? '0');
    const featured = searchParams.get('featured');

    const filter: Record<string, any> = buildStatusFilter(uiStatus);
    if (featured === 'true') filter.featured = true;

    // competitionType filter — PRACTICE events are unlisted (only via direct link)
    if (compType === 'PRACTICE') {
      filter.competitionType = 'PRACTICE';
    } else if (!compType) {
      // By default exclude pure PRACTICE competitions from public listings
      filter.competitionType = { $ne: 'PRACTICE' };
    }

    // eventType filter: match docs that have an event with that eventId
    // eventId for "3x3x3" is "333" etc.
    if (eventType) {
      const idMap: Record<string, string> = {
        '2x2x2': '222', '3x3x3': '333', '4x4x4': '444',
        '5x5x5': '555', '6x6x6': '666', '7x7x7': '777',
        'OH': '333oh', 'BLD': '333bf', 'Pyraminx': 'pyram',
        'Skewb': 'skewb', 'Megaminx': 'minx', 'Square-1': 'sq1',
        'Clock': 'clock',
      };
      const dbEventId = idMap[eventType] ?? eventType;
      filter['events.eventId'] = dbEventId;
    }

    const docs = await Competition.find(filter)
      .select('-events.scramble')   // never expose scrambles in listings
      .sort({ start: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Competition.countDocuments(filter);
    const competitions = docs.map(toApiShape);

    return NextResponse.json({ competitions, total });
  } catch (err) {
    console.error('[GET /api/competitions]', err);
    return NextResponse.json({ error: 'Failed to fetch competitions' }, { status: 500 });
  }
}

// POST — create competition (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();

    // Accept both naming conventions (legacy `competitionName`/`start` and form `name`/`startDate`)
    const resolvedName = body.competitionName ?? body.name;
    const resolvedStart = body.start ?? body.startDate;
    const resolvedEnd = body.end ?? body.endDate ?? resolvedStart;

    if (!resolvedName || !resolvedStart) {
      return NextResponse.json(
        { error: 'name/competitionName and start/startDate are required' },
        { status: 400 }
      );
    }

    // The form sends events as UI type strings ("3x3x3"). The schema stores
    // event subdocuments, so map them — passing raw strings throws a CastError.
    const TYPE_TO_EVENT: Record<string, { eventId: string; eventName: string }> = {
      '2x2x2': { eventId: '222', eventName: '2x2x2 Cube' },
      '3x3x3': { eventId: '333', eventName: '3x3x3 Cube' },
      '4x4x4': { eventId: '444', eventName: '4x4x4 Cube' },
      '5x5x5': { eventId: '555', eventName: '5x5x5 Cube' },
      '6x6x6': { eventId: '666', eventName: '6x6x6 Cube' },
      '7x7x7': { eventId: '777', eventName: '7x7x7 Cube' },
      'OH':    { eventId: '333oh', eventName: '3x3x3 One-Handed' },
      'BLD':   { eventId: '333bf', eventName: '3x3x3 Blindfolded' },
      'Pyraminx': { eventId: 'pyram', eventName: 'Pyraminx' },
      'Skewb':    { eventId: 'skewb', eventName: 'Skewb' },
      'Megaminx': { eventId: 'minx',  eventName: 'Megaminx' },
      'Square-1': { eventId: 'sq1',   eventName: 'Square-1' },
      'Clock':    { eventId: 'clock', eventName: 'Clock' },
    };
    const events = Array.isArray(body.events)
      ? body.events.map((e: any) =>
          typeof e === 'string'
            ? (TYPE_TO_EVENT[e] ?? { eventId: e, eventName: e })
            : e
        )
      : [];

    // ── Pricing (paise) ──
    const toPaise = (v: any) => Math.max(0, Math.round(Number(v) || 0));
    const isFree = body.isFree ?? false;
    const baseFee = isFree ? 0 : toPaise(body.baseFee);
    const perEventFee = isFree ? 0 : toPaise(body.perEventFee);

    // ── Prizes — normalise to integer paise + valid shape ──
    const prizes = Array.isArray(body.prizes)
      ? body.prizes
          .map((p: any) => {
            const rankStart = Math.max(1, Math.round(Number(p.rankStart) || 1));
            const rankEnd = Math.max(rankStart, Math.round(Number(p.rankEnd) || rankStart));
            const mode = p.mode === 'pool' ? 'pool' : 'fixed';
            return {
              rankStart,
              rankEnd,
              mode,
              amount: mode === 'fixed' ? toPaise(p.amount) : 0,
              poolTotal: mode === 'pool' ? toPaise(p.poolTotal) : 0,
              distribution: mode === 'pool'
                ? (['uniform', 'linear', 'log'].includes(p.distribution) ? p.distribution : 'uniform')
                : undefined,
            };
          })
          .filter((p: any) => p.mode === 'fixed' ? p.amount > 0 : p.poolTotal > 0)
      : [];

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const newId = Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');

    const doc = await Competition.create({
      competitionId: newId,
      competitionName: resolvedName,
      shortName: body.shortName,
      description: body.description ?? '',
      // New competitions start as unpublished drafts: 'upcoming' + registration closed.
      status: 'upcoming',
      registrationOpen: false,
      competitionType: body.competitionType ?? 'STANDARD',
      featured: body.featured ?? false,
      events,
      isFree,
      baseFee,
      perEventFee,
      maxEntries: Math.max(1, Math.round(Number(body.maxEntries) || 100)),
      rounds: Math.max(1, Math.round(Number(body.rounds) || 1)),
      prizes,
      rules: typeof body.rules === 'string' ? body.rules : '',
      start: resolvedStart,
      end: resolvedEnd,
    });

    return NextResponse.json({ competition: toApiShape(doc.toObject()) }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/competitions]', err);
    return NextResponse.json({ error: 'Failed to create competition' }, { status: 500 });
  }
}
