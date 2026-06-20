// GET  /api/profile          -> own profile (requires auth)
// PATCH /api/profile         -> update own profile (requires auth)
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongoose';
import { User } from '@/lib/models/User';
import { EventBest } from '@/lib/models/EventBest';
import { PaidParticipant } from '@/lib/models/PaidParticipant';
import { Result } from '@/lib/models/Result';
import { Competition } from '@/lib/models/Competition';

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await connectDB();

  const user = await User.findOne({ email: session.user.email.toLowerCase() })
    .select('-password -token')
    .lean() as any;
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Normalise legacy flat-string name field
  if (typeof user.name === 'string') {
    const parts = (user.name as string).trim().split(/\s+/);
    user.name = { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') };
  }

  const userId = user.userId;

  const pbs = await EventBest.find({ userId }).lean() as any[];

  const registrations = await PaidParticipant.find({ userId })
    .sort({ regDateAndTime: -1 })
    .limit(20)
    .lean() as any[];

  const compIds = registrations.map((r: any) => r.competitionId).filter(Boolean);
  const competitions = compIds.length > 0
    ? await Competition.find({ competitionId: { $in: compIds } }).lean() as any[]
    : [];

  const compMap = new Map(competitions.map((c: any) => [c.competitionId, c]));

  const resultsList = userId && compIds.length > 0
    ? await Result.find({ userId, competitionId: { $in: compIds } }).lean() as any[]
    : [];

  const resultsByComp = new Map<string, any[]>();
  for (const r of resultsList) {
    const arr = resultsByComp.get(r.competitionId) ?? [];
    arr.push(r);
    resultsByComp.set(r.competitionId, arr);
  }

  const history = registrations.map((reg: any) => {
    const comp = compMap.get(reg.competitionId);
    const results = resultsByComp.get(reg.competitionId) ?? [];
    return {
      competitionId: reg.competitionId,
      competitionName: comp?.competitionName ?? reg.competitionId,
      events: reg.events ?? [],
      registeredAt: reg.regDateAndTime,
      results: results.map((r: any) => ({
        eventId: r.eventId,
        bestTime: r.bestTime,
        averageTime: r.averageTime,
        value1: r.value1, value2: r.value2, value3: r.value3, value4: r.value4, value5: r.value5,
      })),
    };
  });

  return NextResponse.json({
    user,
    pbs: pbs.map((p: any) => ({
      eventId: p.eventId,
      bestSingle: p.bestSingle,
      bestAverage: p.bestAverage,
      competitionId: p.competitionId,
    })),
    history,
  });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const email = session.user.email.toLowerCase();

  const body = await req.json();
  await connectDB();

  // Password change
  if (body.action === 'change-password') {
    const { oldPassword, newPassword } = body;
    if (!oldPassword || !newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: 'Invalid password data' }, { status: 400 });
    }
    const bcrypt = await import('bcryptjs');
    const userWithPw = await User.findOne({ email: session.user.email.toLowerCase() })
      .select('+password').lean() as any;
    if (!userWithPw?.password) {
      return NextResponse.json({ error: 'No password set on this account (use Google sign-in)' }, { status: 400 });
    }
    const match = await bcrypt.compare(oldPassword, userWithPw.password);
    if (!match) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
    const hashed = await bcrypt.hash(newPassword, 10);
    await User.updateOne({ email: session.user.email.toLowerCase() }, { $set: { password: hashed } });
    return NextResponse.json({ ok: true });
  }

  // Preference / profile fields
  const allowed = ['wcaId', 'city', 'country', 'mobile', 'dob', 'gender', 'socialMedia',
    'privacyPublic', 'notifEmail', 'notifPush'];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  // Handle name update — legacy docs store `name` as a flat string (e.g. "Prabhakar Patel").
  // MongoDB will throw PathNotViable if we try `$set: { "name.firstName": ... }` on a string field.
  // Solution: always replace `name` as a whole object.
  const wantFirstName = typeof body.firstName === 'string' ? body.firstName.trim() : undefined;
  const wantLastName  = typeof body.lastName  === 'string' ? body.lastName.trim()  : undefined;

  if (wantFirstName !== undefined || wantLastName !== undefined) {
    // Fetch current name to fill in the unchanged part
    const existing = await User.findOne({ email }).select('name').lean() as any;
    const curName  = existing?.name ?? {};
    const curFirst = typeof curName === 'string' ? curName.split(' ')[0] : (curName.firstName ?? '');
    const curLast  = typeof curName === 'string' ? curName.split(' ').slice(1).join(' ') : (curName.lastName ?? '');

    update['name'] = {
      firstName: wantFirstName ?? curFirst,
      lastName:  wantLastName  ?? curLast,
    };
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ ok: true, message: 'Nothing to update' });
  }

  await User.updateOne({ email }, { $set: update });
  return NextResponse.json({ ok: true });
}
