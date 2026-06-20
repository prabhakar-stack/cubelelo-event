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

    const {
      competitionType, description,
      start, end, registrationOpen, featured, status,
      events, rules, faqs, competitionProfile, shortName,
      // admin create form sends these field names:
      name, startDate, endDate, baseFee, perEventFee, isFree, maxEntries, rounds, prize,
    } = body;

    // Accept both naming conventions
    const resolvedName = body.competitionName ?? name;
    const resolvedStart = start ?? startDate;
    const resolvedEnd = end ?? endDate ?? startDate;

    if (!resolvedName || !resolvedStart) {
      return NextResponse.json(
        { error: 'name/competitionName and start/startDate are required' },
        { status: 400 }
      );
    }

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const newId = Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');

    const doc = await Competition.create({
      competitionId: newId,
      competitionName: resolvedName,
      description: body.description ?? '',
      status: 'DRAFT',
      competitionType: body.competitionType ?? 'STANDARD',
      events: body.events ?? [],
      fee: body.fee ?? 0,
      perEventFee: body.perEventFee ?? 0,
      isFree: body.isFree ?? false,
      maxEntries: body.maxEntries ?? 100,
      rounds: body.rounds ?? 1,
      prize: body.prize ?? '',
      rules: body.rules ?? '',
      startDate: resolvedStart,
      endDate: resolvedEnd,
      registrationDeadline: body.registrationDeadline ?? null,
    });

    return NextResponse.json({ competition: doc }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/competitions]', err);
    return NextResponse.json({ error: 'Failed to create competition' }, { status: 500 });
  }
}
