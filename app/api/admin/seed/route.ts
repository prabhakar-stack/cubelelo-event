/**
 * POST /api/admin/seed
 * Seeds the DB with sample competitions for development.
 * Only callable by ADMIN. Remove or protect this in production.
 */

import { NextResponse } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/adminAuth';
import { connectDB } from '@/lib/mongoose';
import { Competition } from '@/lib/models/Competition';

const TYPE_TO_EVENT: Record<string, { eventId: string; eventName: string }> = {
  '2x2x2': { eventId: '222', eventName: '2x2x2 Cube' },
  '3x3x3': { eventId: '333', eventName: '3x3x3 Cube' },
  '4x4x4': { eventId: '444', eventName: '4x4x4 Cube' },
  'OH':    { eventId: '333oh', eventName: '3x3x3 One-Handed' },
  'Pyraminx': { eventId: 'pyram', eventName: 'Pyraminx' },
  'Skewb':    { eventId: 'skewb', eventName: 'Skewb' },
};

const day = (offsetMs: number) => new Date(Date.now() + offsetMs).toISOString().split('T')[0];
const randId = () => Array.from({ length: 10 }, () =>
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]).join('');

// Field names + value shapes match the Competition schema exactly.
const SEED_COMPETITIONS = [
  {
    competitionName: 'Midweek Madness #26 — 3x3',
    description: 'Our flagship weekly 3x3 speedcubing competition. 3 rounds, top 16 advance.',
    events: ['3x3x3'],
    start: day(2 * 86400000),
    end: day(2 * 86400000),
    baseFee: 39900,    // ₹399 in paise
    perEventFee: 9900, // ₹99
    isFree: false,
    maxEntries: 64,
    status: 'upcoming' as const,
    registrationOpen: true,
    rounds: 3,
    prizes: [
      { rankStart: 1, rankEnd: 1, mode: 'fixed', amount: 300000 },
      { rankStart: 2, rankEnd: 2, mode: 'fixed', amount: 150000 },
      { rankStart: 3, rankEnd: 3, mode: 'fixed', amount: 50000 },
    ],
  },
  {
    competitionName: 'Sunday Speedfest — Multi Event',
    description: 'Multi-event Sunday competition. 2x2, 3x3, Pyraminx and Skewb.',
    events: ['2x2x2', '3x3x3', 'Pyraminx', 'Skewb'],
    start: day(5 * 86400000),
    end: day(5 * 86400000),
    baseFee: 39900,
    perEventFee: 9900,
    isFree: false,
    maxEntries: 100,
    status: 'upcoming' as const,
    registrationOpen: true,
    rounds: 2,
    prizes: [
      { rankStart: 1, rankEnd: 1, mode: 'fixed', amount: 500000 },
      { rankStart: 2, rankEnd: 2, mode: 'fixed', amount: 300000 },
      { rankStart: 3, rankEnd: 3, mode: 'fixed', amount: 200000 },
    ],
  },
  {
    competitionName: 'Practice WCA Sim — 3x3 Open',
    description: 'Unlisted practice event. No prizes. Full WCA-style flow for training.',
    events: ['3x3x3'],
    start: day(0),
    end: day(0),
    baseFee: 0,
    perEventFee: 0,
    isFree: true,
    maxEntries: 200,
    status: 'live' as const,
    registrationOpen: false,
    competitionType: 'PRACTICE',
    rounds: 1,
    prizes: [],
  },
  {
    competitionName: 'CL Championship 2025 Finals',
    description: 'Season championship archived results.',
    events: ['3x3x3', '2x2x2', '4x4x4', 'OH'],
    start: '2025-12-15',
    end: '2025-12-15',
    baseFee: 59900,
    perEventFee: 9900,
    isFree: false,
    maxEntries: 128,
    status: 'past' as const,
    registrationOpen: false,
    rounds: 3,
    prizes: [
      { rankStart: 1, rankEnd: 1, mode: 'fixed', amount: 1000000 },
      { rankStart: 2, rankEnd: 2, mode: 'fixed', amount: 700000 },
      { rankStart: 3, rankEnd: 3, mode: 'fixed', amount: 300000 },
      { rankStart: 4, rankEnd: 10, mode: 'pool', poolTotal: 500000, distribution: 'uniform' },
    ],
  },
];

export async function POST() {
  try {
    const auth = await requireAdmin();
    if (isAuthError(auth)) return auth;

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
      SEED_COMPETITIONS.map(c => ({
        ...c,
        competitionId: randId(),
        competitionType: (c as any).competitionType ?? 'STANDARD',
        events: c.events.map(t => TYPE_TO_EVENT[t] ?? { eventId: t, eventName: t }),
        createdByAdminId: auth.session.user?.id,
      }))
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
