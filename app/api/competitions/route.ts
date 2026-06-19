/**
 * GET  /api/competitions  — list all competitions (public)
 * POST /api/competitions  — create a competition (ADMIN only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongoose';
import { Competition } from '@/lib/models/Competition';

// ─── GET — public competition listing ─────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');         // e.g. 'LIVE'
    const event = searchParams.get('event');           // e.g. '3x3x3'
    const limit = parseInt(searchParams.get('limit') ?? '50');
    const skip = parseInt(searchParams.get('skip') ?? '0');

    const filter: Record<string, any> = {};
    if (status && status !== 'ALL') filter.status = status;
    if (event) filter.events = event;

    const competitions = await Competition.find(filter)
      .select('-solveResults -scrambleSets')   // don't expose scrambles to clients
      .sort({ startDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Competition.countDocuments(filter);

    return NextResponse.json({ competitions, total });
  } catch (err) {
    console.error('[GET /api/competitions]', err);
    return NextResponse.json({ error: 'Failed to fetch competitions' }, { status: 500 });
  }
}

// ─── POST — create competition (admin only) ───────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();

    const {
      name, description, events, startDate, endDate,
      registrationDeadline, baseFee, perEventFee, isFree,
      maxEntries, rounds, prize, rulesMarkdown,
    } = body;

    if (!name || !events?.length || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'name, events, startDate, endDate are required' },
        { status: 400 }
      );
    }

    const competition = await Competition.create({
      name,
      description,
      events,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : undefined,
      baseFee: baseFee ?? 0,
      perEventFee: perEventFee ?? 0,
      isFree: isFree ?? (baseFee === 0 && perEventFee === 0),
      maxEntries: maxEntries ?? 100,
      status: 'DRAFT',
      rounds: rounds ?? 1,
      prize,
      rulesMarkdown,
      createdBy: session.user.id,
    });

    return NextResponse.json({ competition }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/competitions]', err);
    return NextResponse.json({ error: 'Failed to create competition' }, { status: 500 });
  }
}
