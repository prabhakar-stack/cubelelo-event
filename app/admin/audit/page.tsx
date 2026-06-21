'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ScrollText, Loader2 } from 'lucide-react';

interface Log {
  _id: string;
  adminName?: string;
  adminEmail?: string;
  action: string;
  target?: string;
  reason?: string;
  createdAt: string;
}

export default function AuditLogPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || (session.user.role !== 'admin' && session.user.email !== 'prabhakar@cubelelo.com')) {
      router.push('/login');
      return;
    }
    fetch('/api/admin/audit')
      .then(r => (r.ok ? r.json() : { logs: [] }))
      .then(d => setLogs(d.logs ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session, status, router]);

  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-2 mb-6">
          <ScrollText size={18} className="text-accent" />
          <h1 className="text-xl font-black text-fg">Audit Log</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={22} className="text-accent animate-spin" /></div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 text-muted text-sm">No admin actions logged yet.</div>
        ) : (
          <div className="bg-surface border border-line rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-muted text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">When</th>
                  <th className="px-4 py-3 text-left">Admin</th>
                  <th className="px-4 py-3 text-left">Action</th>
                  <th className="px-4 py-3 text-left">Target</th>
                  <th className="px-4 py-3 text-left">Reason</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l._id} className="border-b border-line last:border-0">
                    <td className="px-4 py-2.5 text-muted text-xs whitespace-nowrap">{new Date(l.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                    <td className="px-4 py-2.5 text-fg text-xs">{l.adminName || l.adminEmail || '—'}</td>
                    <td className="px-4 py-2.5"><span className="font-mono text-[11px] text-accent">{l.action}</span></td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-muted">{l.target ?? '—'}</td>
                    <td className="px-4 py-2.5 text-muted text-xs">{l.reason ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
