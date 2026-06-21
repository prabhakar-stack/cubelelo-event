/**
 * GET  /api/admin/migration/send-emails  — counts of unclaimed / pending users
 * POST /api/admin/migration/send-emails  { limit?, resend? } — batch-send activation emails
 *
 * "Unclaimed" = a migrated account with no password set yet (can't log in).
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/adminAuth';
import { connectDB } from '@/lib/mongoose';
import { User } from '@/lib/models/User';
import { sendEmail, emailLayout, baseUrl } from '@/lib/email';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;
  await connectDB();
  const unclaimed = await User.countDocuments({ password: { $exists: false } });
  const pending = await User.countDocuments({ password: { $exists: false }, migrationEmailSentAt: { $exists: false } });
  return NextResponse.json({ unclaimed, pending });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;
  await connectDB();

  const { limit = 200, resend = false } = await req.json().catch(() => ({}));
  const query: Record<string, any> = { password: { $exists: false } };
  if (!resend) query.migrationEmailSentAt = { $exists: false };

  const users = await User.find(query).select('email userId name').limit(Math.min(limit, 500)).lean() as any[];

  const activateUrl = `${baseUrl()}/register/migrate`;
  let sent = 0;
  for (const u of users) {
    if (!u.email) continue;
    const first = u.name?.firstName ?? 'cuber';
    const r = await sendEmail({
      to: u.email,
      subject: 'Your Cubelelo account is ready',
      html: emailLayout(
        'Your account is ready',
        `<p>Hi ${first}, your Cubelelo account (CL ID <b>${u.userId}</b>) has moved to the new platform with your full competition history intact. Activate it to set a password and start competing.</p>`,
        { label: 'Activate my account', url: activateUrl },
      ),
    });
    if (r.ok) {
      await User.updateOne({ userId: u.userId }, { $set: { migrationEmailSentAt: new Date() } });
      sent++;
    }
  }

  await logAudit(auth.session, 'migration.campaign', { meta: { sent, attempted: users.length } });
  return NextResponse.json({ ok: true, sent, attempted: users.length });
}
