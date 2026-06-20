/**
 * GET  /api/admin/competitions/[id]/scrambles?eventId=333 → get scramble set
 * POST /api/admin/competitions/[id]/scrambles → generate + lock scramble set
 *   body: { eventId, count (default 5), action: 'generate' | 'lock' | 'unlock' }
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/adminAuth';
import { connectDB } from '@/lib/mongoose';
import { Competition } from '@/lib/models/Competition';

// Server-side scramble generation (basic — cubing.js runs client-side)
// For server use we generate pseudo-WCA scrambles with a helper
function generateServerScramble(eventId: string): string {
  const moves333 = ['U', 'D', 'L', 'R', 'F', 'B'];
  const suffixes = ['', "'", '2'];
  const length = eventId === '222' ? 11 : eventId === '333' ? 20 : 25;
  let last = '', scramble: string[] = [];
  for (let i = 0; i < length; i++) {
    let move: string;
    do { move = moves333[Math.floor(Math.random() * moves333.length)]; } while (move === last);
    last = move;
    scramble.push(move + suffixes[Math.floor(Math.random() * suffixes.length)]);
  }
  return scramble.join(' ');
}

async function resolveComp(id: string) {
  return Competition.findOne({
    $or: [...(id.length === 24 ? [{ _id: id }] : []), { competitionId: id }],
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;
  const { id } = await params;
  const eventId = new URL(req.url).searchParams.get('eventId') ?? '';
  await connectDB();
  const comp = await resolveComp(id);
  if (!comp) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const scrambleSets = comp.get('scrambleSets') ?? {};
  const set = eventId ? scrambleSets[eventId] : scrambleSets;
  return NextResponse.json({ scrambleSets: set ?? null });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;
  const { id } = await params;
  const body = await req.json();
  const { eventId, count = 5, action = 'generate' } = body;
  if (!eventId) return NextResponse.json({ error: 'eventId required' }, { status: 400 });
  await connectDB();

  const comp = await resolveComp(id);
  if (!comp) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const scrambleSets = comp.get('scrambleSets') ?? {};

  if (action === 'generate') {
    if (scrambleSets[eventId]?.locked) {
      return NextResponse.json({ error: 'Scramble set is locked. Unlock first.' }, { status: 400 });
    }
    const scrambles = Array.from({ length: count }, () => generateServerScramble(eventId));
    scrambleSets[eventId] = { scrambles, locked: false, generatedAt: new Date() };
    comp.set('scrambleSets', scrambleSets);
    comp.markModified('scrambleSets');
    await comp.save();
    return NextResponse.json({ ok: true, scrambles, locked: false });
  }

  if (action === 'lock') {
    if (!scrambleSets[eventId]?.scrambles?.length) {
      return NextResponse.json({ error: 'Generate scrambles first' }, { status: 400 });
    }
    scrambleSets[eventId].locked = true;
    scrambleSets[eventId].lockedAt = new Date();
    comp.set('scrambleSets', scrambleSets);
    comp.markModified('scrambleSets');
    await comp.save();
    return NextResponse.json({ ok: true, locked: true });
  }

  if (action === 'unlock') {
    if (scrambleSets[eventId]) {
      scrambleSets[eventId].locked = false;
      comp.set('scrambleSets', scrambleSets);
      comp.markModified('scrambleSets');
      await comp.save();
    }
    return NextResponse.json({ ok: true, locked: false });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
