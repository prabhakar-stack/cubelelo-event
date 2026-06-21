/**
 * GET   /api/competitions/[id]  — single competition (public, scrambles hidden)
 * PATCH /api/competitions/[id]  — update fields (admin only)
 * DELETE /api/competitions/[id] — soft-cancel: set status=past (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongoose';
import { Competition, toApiShape } from '@/lib/models/Competition';
import { logAudit } from '@/lib/audit';

type Ctx = { params: Promise<{ id: string }> };

// GET
export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    await connectDB();
    const { id } = await params;

    // support lookup by _id OR by competitionId ("KTEED443PJ")
    const query = id.length === 24
      ? { _id: id }
      : { competitionId: id.toUpperCase() };

    const doc = await Competition.findOne(query)
      .select('-events.scramble')   // never expose scramble patterns publicly
      .lean();

    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ competition: toApiShape(doc) });
  } catch (err) {
    console.error('[GET /api/competitions/[id]]', err);
    return NextResponse.json({ error: 'Failed to fetch competition' }, { status: 500 });
  }
}

// PATCH — update allowed fields (admin)
export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();
    const { id } = await params;
    const body = await req.json();

    // Only allow these top-level fields to be patched
    const ALLOWED = [
      'competitionName', 'shortName', 'description', 'competitionProfile',
      'anotherImage', 'competitionType', 'start', 'end', 'registrationOpen',
      'featured', 'status', 'rules', 'faqs', 'events',
    ];

    const update: Record<string, any> = {};
    for (const key of ALLOWED) {
      if (key in body) update[key] = body[key];
    }

    const doc = await Competition.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true }
    ).select('-events.scramble').lean();

    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await logAudit(session, 'competition.update', { target: id, meta: { fields: Object.keys(update), status: update.status } });
    return NextResponse.json({ competition: toApiShape(doc) });
  } catch (err) {
    console.error('[PATCH /api/competitions/[id]]', err);
    return NextResponse.json({ error: 'Failed to update competition' }, { status: 500 });
  }
}

// DELETE — soft cancel
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();
    const { id } = await params;

    const doc = await Competition.findByIdAndUpdate(
      id,
      { $set: { status: 'past', registrationOpen: false } },
      { new: true }
    );

    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await logAudit(session, 'competition.cancel', { target: id });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/competitions/[id]]', err);
    return NextResponse.json({ error: 'Failed to update competition' }, { status: 500 });
  }
}
