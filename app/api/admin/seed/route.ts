/**
 * POST /api/admin/seed
 * Seeds the DB with sample competitions for development.
 * Only callable by ADMIN. Remove or protect this in production.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongoose';
import { Competition } from '@/lib/models/Competition';

const SEED_COMPETITIONS = [
  {
    name: 'Midweek Madness #26 — 3x3',
    description: 'Our flagship weekly 3x3 speedcubing competition. 3 rounds, top 16 advance.',
    events: ['3x3x3'],
    startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),    // 2 days from now
    endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
    registrationDeadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    baseFee: 39900,    // ₹399 in paise
    perEventFee: 9900, // ₹99
    isFree: false,
    maxEntries: 64,
    status: 'REGISTRATION_OPEN',
    rounds: 3,
    prize: '₹5,000 prize pool',
  },
  {
    name: 'Sunday Speedfest — Multi Event',
    description: 'Multi-event Sunday competition. 2x2, 3x3, Pyraminx and Skewb.',
    events: ['2x2x2', '3x3x3', 'Pyraminx', 'Skewb'],
    startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
    registrationDeadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    baseFee: 39900,
    perEventFee: 9900,
    isFree: false,
    maxEntries: 100,
    status: 'REGISTRATION_OPEN',
    rounds: 2,
    prize: '₹10,000 prize pool',
  },
  {
    name: 'Practice WCA Sim — 3x3 Open',
    description: 'Unlisted practice event. No prizes. Full WCA-style flow for training.',
    events: ['3x3x3'],
    startDate: new Date(Date.now() - 30 * 60 * 1000),    // started 30 min ago
    endDate: new Date(Date.now() + 90 * 60 * 1000),
    baseFee: 0,
    perEventFee: 0,
    isFree: true,
    maxEntries: 200,
    status: 'LIVE',
    rounds: 1,
    prize: undefined,
  },
  {
    name: 'CL Championship 2025 Finals',
    description: 'Season championship archived results.',
    events: ['3x3x3', '2x2x2', '4x4x4', 'OH'],
    startDate: new Date('2025-12-15'),
    endDate: new Date('2025-12-15'),
    baseFee: 59900,
    perEventFee: 9900,
    isFree: false,
    maxEntries: 128,
    status: 'COMPLETED',
    rounds: 3,
    prize: '₹25,000 prize pool',
  },
];

export async function POST() {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();

    // Don't re-seed if competitions already exist
    const existing = await Competition.countDocuments();
    if (existing > 0) {
      return NextResponse.json({
        message: `Skipped — ${existing} competitions already exist. Drop the collection manually to re-seed.`,
        count: existing,
      });
    }

    const created = await Competition.insertMany(
      SEED_COMPETITIONS.map(c => ({ ...c, createdBy: session.user!.id }))
    );

    return NextResponse.json({
      message: `Seeded ${created.length} competitions.`,
      count: created.length,
    });
  } catch (err) {
    console.error('[POST /api/admin/seed]', err);
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 });
  }
}
