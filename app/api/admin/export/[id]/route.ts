/**
 * GET /api/admin/export/[id]  → CSV of all results for a competition
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/adminAuth';
import { connectDB } from '@/lib/mongoose';
import { Result } from '@/lib/models/Result';

const DNF = 360000;
function fmt(ms: number) {
  if (!ms || ms >= DNF) return 'DNF';
  return (ms / 1000).toFixed(3);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;
  const { id } = await params;
  await connectDB();

  const results = await Result.find({ competitionId: id }).sort({ eventId: 1, averageTime: 1 }).lean() as any[];

  const rows = [
    'Rank,Name,Email,WCA ID,Event,Best,Average,S1,S2,S3,S4,S5,Status',
    ...results.map((r, i) => [
      i + 1, `"${r.firstName} ${r.lastName}"`, r.email, r.wcaId ?? '',
      r.eventId, fmt(r.bestTime), fmt(r.averageTime),
      fmt(r.value1), fmt(r.value2), fmt(r.value3), fmt(r.value4), fmt(r.value5),
      r.status?.verified ?? 'pending',
    ].join(',')),
  ];

  return new NextResponse(rows.join('\n'), {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="results-${id}.csv"`,
    },
  });
}
