import { connectDB } from '@/lib/mongoose';
import { Notification } from '@/lib/models/Notification';
import { User } from '@/lib/models/User';
import { sendEmail, emailLayout, baseUrl } from '@/lib/email';

/**
 * Notify a set of users (keyed by CL ID): writes in-app notifications and,
 * unless `email: false`, sends an email to those who haven't opted out.
 * Never throws.
 */
export async function notifyUsers(
  userIds: string[],
  n: { type?: string; title: string; body?: string; link?: string; email?: boolean },
): Promise<void> {
  try {
    const uniq = [...new Set((userIds ?? []).filter(Boolean))];
    if (!uniq.length) return;
    await connectDB();

    await Notification.insertMany(
      uniq.map(uid => ({ userId: uid, type: n.type ?? 'info', title: n.title, body: n.body, link: n.link })),
    );

    if (n.email !== false) {
      const users = await User.find({ userId: { $in: uniq } }).select('email notifEmail').lean() as any[];
      const url = n.link ? `${baseUrl()}${n.link}` : baseUrl();
      await Promise.all(
        users
          .filter(u => u.email && u.notifEmail !== false)
          .map(u => sendEmail({
            to: u.email,
            subject: n.title,
            html: emailLayout(n.title, `<p>${n.body ?? ''}</p>`, n.link ? { label: 'Open', url } : undefined),
          })),
      );
    }
  } catch (e) {
    console.error('[notify] failed', e);
  }
}
