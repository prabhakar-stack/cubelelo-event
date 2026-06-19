/**
 * GET   /api/competitions/[id]  — single competition detail (public)
 * PATCH /api/competitions/[id]  — update status / fields (ADMIN only)
 * DELETE /api/competitions/[id] — soft-cancel (ADMIN only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongoose';
import { Competition } from '@/lib/models/Competition';

type Params = { params: { id: string } };

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;

    const competition = await Competition.findById(id)
      .select('-scrambleSets')   // never send scrambles to public
      .lean();

    if (!competition) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ competition });
  } catch (err) {
    console.error('[GET /api/competitions/[id]]', err);
    return NextResponse.json({ error: 'Failed to fetch competition' }, { status: 500 });
  }
}

// ─── PATCH ────────────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();
    const { id } = await params;
    const body = await req.json();

    // Strip fields that shouldn't be patched directly
    const { scrambleSets, entries, solveResults, createdBy, ...allowedUpdates } = body;

    const competition = await Competition.findByIdAndUpdate(
      id,
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    ).select('-scrambleSets');

    if (!competition) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ competition });
  } catch (err) {
    console.error('[PATCH /api/competitions/[id]]', err);
    return NextResponse.json({ error: 'Failed to update competition' }, { status: 500 });
  }
}

// ─── DELETE (soft cancel) ─────────────────────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();
    const { id } = await params;

    const competition = await Competition.findByIdAndUpdate(
      id,
      { $set: { status: 'CANCELLED' } },
      { new: true }
    );

    if (!competition) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/competitions/[id]]', err);
    return NextResponse.json({ error: 'Failed to cancel competition' }, { status: 500 });
  }
}
