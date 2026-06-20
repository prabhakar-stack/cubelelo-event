import { NextRequest, NextResponse } from 'next/server';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Field length caps (defensive — keeps payloads and logs bounded).
const LIMITS = { name: 100, email: 200, subject: 150, message: 5000 };

/**
 * Best-effort in-memory rate limit: max 5 submissions / 10 min per IP.
 * Note: per-instance only — on serverless this resets per cold start and isn't
 * shared across instances. For hard guarantees, back this with Redis/Upstash.
 */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_HITS = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter(t => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_HITS;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    if (rateLimited(ip)) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const body = await req.json();
    const name = String(body.name ?? '').trim();
    const email = String(body.email ?? '').trim();
    const subject = String(body.subject ?? '').trim();
    const message = String(body.message ?? '').trim();

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }
    if (
      name.length > LIMITS.name || email.length > LIMITS.email ||
      subject.length > LIMITS.subject || message.length > LIMITS.message
    ) {
      return NextResponse.json({ error: 'One or more fields are too long' }, { status: 400 });
    }

    // Log all contact submissions regardless of email config
    console.log('[contact-form]', { name, email, subject, message: message.slice(0, 200) });

    if (process.env.RESEND_API_KEY) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const resendModule = await (Function('return import("resend")')() as Promise<any>);
        const resend = new resendModule.Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: 'Cubelelo Events <noreply@cubelelo.com>',
          to: 'support@cubelelo.com',
          replyTo: email,
          subject: `[Contact] ${subject} — ${name}`,
          text: `From: ${name} <${email}>\nSubject: ${subject}\n\n${message}`,
        });
      } catch (emailErr) {
        console.error('[contact] email send failed:', emailErr);
        // Don't fail the request — log was already written
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[contact] error:', err);
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
  }
}
