import { connectDB } from '@/lib/mongoose';
import { AuditLog } from '@/lib/models/AuditLog';

/**
 * Record an admin action. Never throws — auditing must not break the action.
 * Pass the session returned by requireAdmin (auth.session).
 */
export async function logAudit(
  session: any,
  action: string,
  opts: { target?: string; reason?: string; meta?: any } = {},
): Promise<void> {
  try {
    await connectDB();
    await AuditLog.create({
      adminId: session?.user?.userId ?? session?.user?.id ?? null,
      adminName: session?.user?.name ?? null,
      adminEmail: session?.user?.email ?? null,
      action,
      target: opts.target,
      reason: opts.reason,
      meta: opts.meta,
    });
  } catch (e) {
    console.error('[audit] failed to log', action, e);
  }
}
