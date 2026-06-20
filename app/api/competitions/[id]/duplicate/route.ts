/**
 * POST /api/competitions/[id]/duplicate
 * Clones an existing competition as a new DRAFT with "Copy of " prefix.
 * Strips scrambles, competitor lists, and resets status/dates.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/adminAuth';
import { connectDB } from '@/lib/mongoose';
import { Competition } from '@/lib/models/Competition';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;

  await connectDB();
  const { id } = await params;

  const query = id.length === 24 ? { _id: id } : { competitionId: id.toUpperCase() };
  const source = await Competition.findOne(query).lean() as any;
  if (!source) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Generate new unique competitionId
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const newCompId = Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');

  // Strip scrambles from each event
  const cleanEvents = (source.events ?? []).map((e: any) => {
    const { scramble: _s, scrambles: _ss, ...eventRest } = e;
    return eventRest;
  });

  const newComp = await Competition.create({
    competitionId: newCompId,
    competitionName: `Copy of ${source.competitionName ?? source.name ?? 'Competition'}`,
    description: source.description ?? '',
    status: 'DRAFT',
    competitionType: source.competitionType ?? 'STANDARD',
    events: cleanEvents,
    fee: source.fee ?? 0,
    perEventFee: source.perEventFee ?? 0,
    isFree: source.isFree ?? false,
    maxEntries: source.maxEntries ?? 100,
    rounds: source.rounds ?? 1,
    prize: source.prize ?? '',
    rules: source.rules ?? '',
    competitorsIds: [],
    startDate: null,
    endDate: null,
    registrationDeadline: null,
  });

  return NextResponse.json({ ok: true, competition: newComp }, { status: 201 });
}
