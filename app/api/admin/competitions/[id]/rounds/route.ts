/**
 * GET  /api/admin/competitions/[id]/rounds  → list rounds status
 * POST /api/admin/competitions/[id]/rounds  → open/close a round
 *   body: { action: 'open' | 'close' | 'advance', eventId? }
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/adminAuth';
import { connectDB } from '@/lib/mongoose';
import { Competition } from '@/lib/models/Competition';
import { Result } from '@/lib/models/Result';

async function resolveComp(id: string) {
  return Competition.findOne({
    $or: [
      ...(id.length === 24 ? [{ _id: id }] : []),
      { competitionId: id },
    ],
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;
  const { id } = await params;
  await connectDB();
  const comp = await resolveComp(id);
  if (!comp) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ status: comp.get('status'), competitionId: comp.get('competitionId') });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;
  const { id } = await params;
  const body = await req.json();
  const { action, eventId } = body;
  await connectDB();

  const comp = await resolveComp(id);
  if (!comp) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const compId = comp.get('competitionId') ?? comp._id.toString();

  if (action === 'open') {
    comp.set('status', 'live');
    comp.set('roundOpenedAt', new Date());
    await comp.save();
    return NextResponse.json({ ok: true, status: 'live', message: 'Round opened — scrambles now visible to competitors' });
  }

  if (action === 'close') {
    comp.set('status', 'past');
    comp.set('roundClosedAt', new Date());
    await comp.save();
    return NextResponse.json({ ok: true, status: 'past', message: 'Round closed' });
  }

  if (action === 'advance') {
    // Compute qualifiers: top N by averageTime from results
    const advancementCount = comp.get('advancementCount') ?? 16;
    const query: Record<string, any> = { competitionId: compId };
    if (eventId) query.eventId = eventId;
    const results = await Result.find(query).sort({ averageTime: 1 }).limit(advancementCount).lean() as any[];
    const qualifiers = results.map(r => ({ userId: r.userId, name: `${r.firstName} ${r.lastName}`.trim(), averageTime: r.averageTime }));
    return NextResponse.json({ ok: true, qualifiers, advancementCount, total: results.length });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
