'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Database, Users, CheckCircle, AlertCircle, Loader2, Upload } from 'lucide-react';

export default function AdminMigration() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || (session.user.role !== 'admin' && session.user.email !== 'prabhakar@cubelelo.com')) { router.push('/login'); return; }
    fetch('/api/admin/users?limit=1')
      .then(r => r.json())
      .then(d => setStats({ total: d.total }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session, status]);

  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <Link href="/admin" className="text-xs text-muted hover:text-fg mb-1 block">← Admin</Link>
        <h1 className="text-2xl font-black mb-8">User Migration</h1>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-surface border border-line rounded-2xl p-5">
            <Database size={16} className="text-purple-400 mb-2" />
            <p className="text-2xl font-black text-fg">{loading ? '…' : stats?.total?.toLocaleString()}</p>
            <p className="text-xs text-muted">Total users in DB</p>
          </div>
          <div className="bg-surface border border-line rounded-2xl p-5">
            <Users size={16} className="text-accent mb-2" />
            <p className="text-2xl font-black text-fg">—</p>
            <p className="text-xs text-muted">Unclaimed accounts</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-surface border border-line rounded-2xl p-5">
            <h2 className="font-semibold mb-3">Migration Steps</h2>
            <div className="space-y-2">
              {[
                { label: 'Export from old DB', done: true, desc: 'Run: mongodump + data extraction script' },
                { label: 'Bulk import to new DB', done: true, desc: 'Users, CL IDs, competition history' },
                { label: 'Send activation emails', done: false, desc: 'Personalised email to all existing users' },
                { label: 'Monitor claim rate', done: false, desc: 'Track unclaimed accounts via this dashboard' },
                { label: 'Old site redirect', done: false, desc: 'Point old domain to new platform' },
              ].map(({ label, done, desc }) => (
                <div key={label} className="flex items-start gap-3 py-2 border-b border-line last:border-0">
                  {done ? <CheckCircle size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" /> : <AlertCircle size={14} className="text-muted flex-shrink-0 mt-0.5" />}
                  <div>
                    <p className={`text-sm font-medium ${done ? 'text-fg' : 'text-muted'}`}>{label}</p>
                    <p className="text-xs text-muted">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface border border-line rounded-2xl p-5">
            <h2 className="font-semibold mb-3">User Claim Flow</h2>
            <p className="text-sm text-muted mb-4">Direct existing users to the activation page:</p>
            <div className="bg-bg rounded-xl px-4 py-3 font-mono text-sm text-accent select-all">
              {typeof window !== 'undefined' ? window.location.origin : 'https://events.cubelelo.com'}/register/migrate
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
