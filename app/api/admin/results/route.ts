/**
 * GET  /api/admin/results?competitionId=XXX&flagged=true
 * PATCH /api/admin/results
 *   Body: { resultId, action: 'verify'|'plus2'|'dnf'|'dq'|'override', value?, remark? }
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongoose';
import { Result } from '@/lib/models/Result';

const ADMIN_EMAILS = ['prabhakar@cubelelo.com', process.env.NEXTAUTH_ADMIN_EMAIL].filter(Boolean);

async function requireAdmin(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return null;
  if (!ADMIN_EMAILS.includes(session.user.email) && session.user.role !== 'admin') return null;
  return session;
}

export async function GET(req: NextRequest) {
  const session = await requireAdmin(req);
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const competitionId = searchParams.get('competitionId') ?? '';
    const flagged = searchParams.get('flagged') === 'true';
    const eventId = searchParams.get('eventId') ?? '';
    const query: Record<string, unknown> = {};
    if (competitionId) query.competitionId = competitionId;
    if (eventId) query.eventId = eventId;
    if (flagged) query['status.verified'] = 'flagged';
    const results = await Result.find(query).sort({ createdAt: -1 }).limit(200).lean();
    return NextResponse.json({ results, total: results.length });
  } catch (err) {
    console.error('[GET admin/results]', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin(req);
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    await connectDB();
    const body = await req.json();
    const { resultId, action, value, remark } = body;
    if (!resultId || !action) return NextResponse.json({ error: 'resultId and action required' }, { status: 400 });
    const result = await Result.findOne({ resultId });
    if (!result) return NextResponse.json({ error: 'Result not found' }, { status: 404 });
    const adminEmail = session.user.email;
    switch (action) {
      case 'verify':
        result.status = { ...result.status, verified: 'verified', judge: adminEmail, remark: remark ?? '' };
        break;
      case 'plus2':
        result.bestTime = (result.bestTime ?? 0) + 2000;
        if (result.averageTime && result.averageTime < 360000) result.averageTime = result.averageTime + 2000;
        result.status = { ...result.status, verified: 'plus2', judge: adminEmail, remark: remark ?? '+2 penalty applied' };
        break;
      case 'dnf':
        result.averageTime = 360000;
        result.bestTime = 360000;
        result.status = { ...result.status, verified: 'dnf', judge: adminEmail, remark: remark ?? 'DNF applied by admin' };
        break;
      case 'dq':
        result.status = { ...result.status, verified: 'dq', judge: adminEmail, remark: remark ?? 'Disqualified' };
        break;
      case 'override':
        if (value && !isNaN(Number(value))) {
          result.bestTime = Number(value);
          result.status = { ...result.status, verified: 'verified', judge: adminEmail, remark: 'Override by admin' };
        }
        break;
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
    await result.save();
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error('[PATCH admin/results]', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
