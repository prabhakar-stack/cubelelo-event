'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, AlertTriangle, CheckCircle2, Loader2, ChevronDown } from 'lucide-react';

interface Anomaly {
  id: string;
  source_collection: string;
  source_mongo_id: string;
  anomaly_type: 'extra_fields' | 'validation_error';
  extra_fields: any;
  error_message: string | null;
  full_document: any;
  resolved: boolean;
}

export default function MigrationAnomaliesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<Anomaly[]>([]);
  const [counts, setCounts] = useState({ total: 0, unresolved: 0 });
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'false' | 'all'>('false');
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const qs = filter === 'false' ? '?resolved=false' : '';
    fetch(`/api/admin/migration/anomalies${qs}`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d) { setItems(d.anomalies ?? []); setCounts(d.counts ?? { total: 0, unresolved: 0 }); setConfigured(d.configured !== false); } })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || (session.user.role !== 'admin' && session.user.email !== 'prabhakar@cubelelo.com')) { router.push('/login'); return; }
    load();
  }, [session, status, router, load]);

  const resolve = (id: string, resolved: boolean) => {
    fetch('/api/admin/migration/anomalies', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, resolved }) })
      .then(() => load())
      .catch(() => {});
  };

  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Link href="/admin/migration" className="inline-flex items-center gap-1 text-xs text-muted hover:text-fg mb-1"><ChevronLeft size={14} /> Migration</Link>
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle size={18} className="text-amber-400" />
          <h1 className="text-xl font-black">Migration Anomalies</h1>
        </div>
        <p className="text-xs text-muted mb-6">Records with extra fields or failed inserts during the Supabase migration — the full original document is preserved here so nothing is lost.</p>

        {!configured ? (
          <div className="bg-surface border border-line rounded-2xl p-8 text-center text-sm text-muted">Supabase isn’t configured in this environment.</div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs text-muted">{counts.unresolved} unresolved · {counts.total} total</span>
              <div className="ml-auto flex gap-1">
                {(['false', 'all'] as const).map(f => (
                  <button key={f} onClick={() => setFilter(f)} className={`px-2.5 py-1 rounded-lg text-xs ${filter === f ? 'bg-accent text-black font-bold' : 'bg-elevated text-muted border border-line-strong'}`}>
                    {f === 'false' ? 'Unresolved' : 'All'}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-16"><Loader2 size={22} className="text-accent animate-spin" /></div>
            ) : items.length === 0 ? (
              <div className="bg-surface border border-line rounded-2xl p-12 text-center">
                <CheckCircle2 size={32} className="mx-auto mb-3 text-emerald-400" />
                <p className="text-sm text-fg">No anomalies{filter === 'false' ? ' to resolve' : ''}.</p>
                <p className="text-xs text-muted mt-1">Every document migrated cleanly.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map(a => (
                  <div key={a.id} className="bg-surface border border-line rounded-xl overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${a.anomaly_type === 'extra_fields' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' : 'text-red-400 border-red-500/30 bg-red-500/10'}`}>
                        {a.anomaly_type === 'extra_fields' ? 'extra fields' : 'validation error'}
                      </span>
                      <span className="text-sm font-mono text-fg">{a.source_collection}</span>
                      <span className="text-[11px] font-mono text-muted truncate">{a.source_mongo_id}</span>
                      <button onClick={() => setExpanded(expanded === a.id ? null : a.id)} className="ml-auto text-muted hover:text-fg"><ChevronDown size={15} className={expanded === a.id ? 'rotate-180 transition-transform' : 'transition-transform'} /></button>
                      <button onClick={() => resolve(a.id, !a.resolved)} className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all ${a.resolved ? 'text-muted border border-line-strong' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'}`}>
                        {a.resolved ? 'Resolved' : 'Mark resolved'}
                      </button>
                    </div>
                    {expanded === a.id && (
                      <div className="px-4 pb-4 space-y-3 border-t border-line pt-3">
                        {a.error_message && <p className="text-xs text-red-400 font-mono">{a.error_message}</p>}
                        {a.extra_fields && (
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-muted mb-1">Extra fields</p>
                            <pre className="text-[11px] font-mono text-fg bg-bg border border-line rounded-lg p-3 overflow-x-auto">{JSON.stringify(a.extra_fields, null, 2)}</pre>
                          </div>
                        )}
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted mb-1">Full original document</p>
                          <pre className="text-[11px] font-mono text-muted bg-bg border border-line rounded-lg p-3 max-h-72 overflow-auto">{JSON.stringify(a.full_document, null, 2)}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
