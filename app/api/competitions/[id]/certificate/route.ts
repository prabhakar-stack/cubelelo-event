/**
 * GET /api/competitions/[id]/certificate?userId=&event=
 *
 * Generates a participation or podium certificate as an SVG-based PDF.
 * Returns the certificate as a downloadable SVG (can be printed/saved as PDF).
 *
 * Access: logged-in user (own certificate) or admin
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongoose';
import { Competition, mapEventId } from '@/lib/models/Competition';
import { Result } from '@/lib/models/Result';
import { PaidParticipant } from '@/lib/models/PaidParticipant';
import { User } from '@/lib/models/User';

function formatTime(ms: number): string {
  if (ms <= 0) return 'DNF';
  const secs = ms / 1000;
  if (secs >= 60) {
    const m = Math.floor(secs / 60);
    const s = (secs % 60).toFixed(2).padStart(5, '0');
    return `${m}:${s}`;
  }
  return secs.toFixed(2);
}

function buildCertificateSVG({
  name,
  clid,
  competitionName,
  event,
  rank,
  bestTime,
  date,
  type,
}: {
  name: string;
  clid: string;
  competitionName: string;
  event: string;
  rank: number;
  bestTime: number;
  date: string;
  type: 'participation' | 'podium';
}): string {
  const medalColors: Record<number, string> = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };
  const rankLabel: Record<number, string> = { 1: '1st Place 🥇', 2: '2nd Place 🥈', 3: '3rd Place 🥉' };

  const accentColor = type === 'podium' ? (medalColors[rank] ?? '#00dbe7') : '#00dbe7';
  const achievementText = type === 'podium'
    ? (rankLabel[rank] ?? `Rank #${rank}`)
    : 'Participant';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="900" height="640" viewBox="0 0 900 640" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif">
  <!-- Background -->
  <rect width="900" height="640" fill="#0b0e11"/>
  <!-- Border frame -->
  <rect x="16" y="16" width="868" height="608" fill="none" stroke="${accentColor}" stroke-width="2" rx="12"/>
  <rect x="22" y="22" width="856" height="596" fill="none" stroke="${accentColor}" stroke-width="0.5" stroke-opacity="0.4" rx="10"/>

  <!-- Top decorative line -->
  <line x1="100" y1="80" x2="800" y2="80" stroke="${accentColor}" stroke-width="1" stroke-opacity="0.3"/>

  <!-- Logo mark -->
  <rect x="420" y="42" width="60" height="22" fill="${accentColor}" rx="4"/>
  <text x="450" y="58" text-anchor="middle" fill="#0b0e11" font-size="12" font-weight="bold">CB</text>

  <!-- Title -->
  <text x="450" y="140" text-anchor="middle" fill="#ffffff" font-size="13" letter-spacing="6" opacity="0.6">CERTIFICATE OF</text>
  <text x="450" y="178" text-anchor="middle" fill="${accentColor}" font-size="36" font-weight="bold" letter-spacing="2">${type === 'podium' ? 'ACHIEVEMENT' : 'PARTICIPATION'}</text>

  <!-- Divider -->
  <line x1="300" y1="200" x2="600" y2="200" stroke="${accentColor}" stroke-width="1" stroke-opacity="0.5"/>

  <!-- "This certifies that" -->
  <text x="450" y="238" text-anchor="middle" fill="#8b949e" font-size="14">This certifies that</text>

  <!-- Competitor name -->
  <text x="450" y="286" text-anchor="middle" fill="#ffffff" font-size="42" font-weight="bold">${name}</text>

  <!-- CL ID -->
  <text x="450" y="314" text-anchor="middle" fill="${accentColor}" font-size="13" opacity="0.8">${clid}</text>

  <!-- Achievement description -->
  <text x="450" y="354" text-anchor="middle" fill="#8b949e" font-size="15">has ${type === 'podium' ? 'achieved' : 'participated in'}</text>

  <!-- Competition name -->
  <text x="450" y="390" text-anchor="middle" fill="#ffffff" font-size="20" font-weight="bold">${competitionName}</text>

  <!-- Event + Rank -->
  <text x="450" y="424" text-anchor="middle" fill="${accentColor}" font-size="16">${event} · ${achievementText}</text>

  ${bestTime > 0 ? `<text x="450" y="452" text-anchor="middle" fill="#8b949e" font-size="14">Best Time: ${formatTime(bestTime)}</text>` : ''}

  <!-- Bottom divider -->
  <line x1="200" y1="490" x2="700" y2="490" stroke="${accentColor}" stroke-width="1" stroke-opacity="0.3"/>

  <!-- Date + Branding -->
  <text x="450" y="520" text-anchor="middle" fill="#8b949e" font-size="12">${date}</text>
  <text x="450" y="548" text-anchor="middle" fill="#ffffff" font-size="16" font-weight="bold">Cube<tspan fill="${accentColor}">lelo</tspan> Events</text>
  <text x="450" y="570" text-anchor="middle" fill="#8b949e" font-size="11" opacity="0.6">events.cubelelo.com</text>

  <!-- Corner decorations -->
  <polygon points="40,40 70,40 40,70" fill="${accentColor}" opacity="0.3"/>
  <polygon points="860,40 830,40 860,70" fill="${accentColor}" opacity="0.3"/>
  <polygon points="40,600 70,600 40,570" fill="${accentColor}" opacity="0.3"/>
  <polygon points="860,600 830,600 860,570" fill="${accentColor}" opacity="0.3"/>
</svg>`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    }

    const { id } = await params;
    const url = new URL(req.url);
    const requestedUserId = url.searchParams.get('userId');
    const requestedEvent = url.searchParams.get('event') ?? '3x3x3';

    await connectDB();

    // Load competition
    const comp = await Competition.findOne({
      $or: [
        { competitionId: id },
        ...(mongoose.isValidObjectId(id) ? [{ _id: id }] : []),
      ],
    }).lean() as any;
    if (!comp) return NextResponse.json({ error: 'Competition not found' }, { status: 404 });

    // Determine target user
    const sessionUser = await User.findOne({ email: session.user.email.toLowerCase() }).lean() as any;
    const isAdmin = sessionUser?.role === 'admin';
    const targetUserId = (isAdmin && requestedUserId) ? requestedUserId : sessionUser?.userId;
    if (!targetUserId) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const targetUser = requestedUserId && isAdmin
      ? await User.findOne({ userId: targetUserId }).lean() as any
      : sessionUser;

    // Check participation
    const compId = comp.competitionId ?? comp._id.toString();
    const participant = await PaidParticipant.findOne({ competitionId: compId, userId: targetUserId }).lean();
    if (!participant) {
      return NextResponse.json({ error: 'Not registered for this competition' }, { status: 403 });
    }

    // The `event` param may be a UI label ("3x3x3") or an eventId ("333"); normalise to eventId.
    const UI_TO_EVENT_ID: Record<string, string> = {
      '2x2x2': '222', '3x3x3': '333', '4x4x4': '444', '5x5x5': '555',
      '6x6x6': '666', '7x7x7': '777', 'OH': '333oh', 'BLD': '333bf',
      'Pyraminx': 'pyram', 'Skewb': 'skewb', 'Megaminx': 'minx',
      'Square-1': 'sq1', 'Clock': 'clock',
    };
    const eventId = UI_TO_EVENT_ID[requestedEvent] ?? requestedEvent;

    // Rank by ranking the event's results (average, then best — matches the leaderboard).
    // Result has no stored rank, so compute it; ties share a rank.
    const DNF_SENTINEL = 360000;
    const eventResults = await Result.find({ competitionId: compId, eventId })
      .sort({ averageTime: 1, bestTime: 1 })
      .lean() as any[];

    let rank = 0;
    let bestTime = 0;
    const myIdx = eventResults.findIndex((r: any) => r.userId === targetUserId);
    if (myIdx >= 0) {
      const mine = eventResults[myIdx];
      bestTime = (mine.bestTime != null && mine.bestTime < DNF_SENTINEL) ? mine.bestTime : 0;
      rank = 1;
      for (let i = 1; i <= myIdx; i++) {
        const prev = eventResults[i - 1];
        const cur = eventResults[i];
        if (cur.averageTime !== prev.averageTime || cur.bestTime !== prev.bestTime) rank = i + 1;
      }
    }
    const certType = (rank >= 1 && rank <= 3) ? 'podium' : 'participation';

    const name = [targetUser?.name?.firstName, targetUser?.name?.lastName].filter(Boolean).join(' ') || targetUser?.email || targetUserId;
    const clid = targetUser?.userId ?? targetUserId;
    const dateStr = new Date(comp.start ?? comp.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric',
    });

    const svg = buildCertificateSVG({
      name,
      clid,
      competitionName: comp.competitionName ?? comp.name ?? 'Cubelelo Competition',
      event: mapEventId(eventId),
      rank,
      bestTime,
      date: dateStr,
      type: certType,
    });

    const filename = `certificate-${clid}-${compId}-${requestedEvent}.svg`.replace(/[^a-zA-Z0-9\-_.]/g, '_');

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (err) {
    console.error('[GET /api/competitions/[id]/certificate]', err);
    return NextResponse.json({ error: 'Certificate generation failed' }, { status: 500 });
  }
}
