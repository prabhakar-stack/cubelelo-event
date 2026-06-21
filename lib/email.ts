/**
 * Centralized transactional email. Uses Resend when RESEND_API_KEY is set;
 * otherwise logs to the console (dev fallback) so flows still work locally.
 */
const FROM = 'Cubelelo Events <noreply@cubelelo.com>';

export function baseUrl(): string {
  return process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
}

export async function sendEmail(
  { to, subject, html, replyTo }: { to: string | string[]; subject: string; html: string; replyTo?: string },
): Promise<{ ok: boolean; dev?: boolean }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log('[email:dev]', { to, subject });
    return { ok: true, dev: true };
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });
    if (!res.ok) { console.error('[email] resend error:', await res.text()); return { ok: false }; }
    return { ok: true };
  } catch (e) {
    console.error('[email] send failed:', e);
    return { ok: false };
  }
}

/** Wrap body content in a simple branded layout. */
export function emailLayout(title: string, bodyHtml: string, cta?: { label: string; url: string }): string {
  return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1c2128">
    <h2 style="color:#0b0e11;margin:0 0 12px">${title}</h2>
    ${bodyHtml}
    ${cta ? `<p style="margin:18px 0"><a href="${cta.url}" style="display:inline-block;background:#00b3c4;color:#ffffff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:bold">${cta.label}</a></p><p style="color:#5b6570;font-size:12px">Or copy this link: ${cta.url}</p>` : ''}
    <hr style="border:none;border-top:1px solid #e6e9ee;margin:20px 0"/>
    <p style="color:#8b949e;font-size:12px">Cubelelo Events · events.cubelelo.com</p>
  </div>`;
}
