/**
 * POST /api/competitions/[id]/duplicate
 * Clones an existing competition as a new DRAFT with "Copy of " prefix.
 * Strips scrambles, competitor lists, and resets status/dates.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/adminAuth';
import { connectDB } from '@/lib/mongoose';
import { Competition, toApiShape } from '@/lib/models/Competition';

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
    // Clone starts as an unpublished draft: 'upcoming' + registration closed, dates reset.
    status: 'upcoming',
    registrationOpen: false,
    competitionType: source.competitionType ?? 'STANDARD',
    events: cleanEvents,
    // Preserve pricing & prize configuration (all money in paise).
    isFree: source.isFree ?? true,
    baseFee: source.baseFee ?? 0,
    perEventFee: source.perEventFee ?? 0,
    maxEntries: source.maxEntries ?? 100,
    rounds: source.rounds ?? 1,
    prizes: source.prizes ?? [],
    rules: source.rules ?? '',
    competitorsIds: [],
  });

  return NextResponse.json({ ok: true, competition: toApiShape(newComp.toObject()) }, { status: 201 });
}
