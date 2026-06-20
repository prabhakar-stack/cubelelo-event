'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Plus, Trophy, ChevronRight, Loader2, Copy, Zap } from 'lucide-react';
import { getStatusLabel, getStatusColor } from '@/lib/utils/competition';

const NEXT_STATUS: Record<string, { label: string; status: string }> = {
  DRAFT: { label: 'Open Registration', status: 'REGISTRATION_OPEN' },
  REGISTRATION_OPEN: { label: 'Close Registration', status: 'REGISTRATION_CLOSED' },
  REGISTRATION_CLOSED: { label: 'Go Live 🔴', status: 'LIVE' },
  LIVE: { label: 'End Competition', status: 'COMPLETED' },
};

export default function AdminCompetitions() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [comps, setComps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || (session.user.role !== 'admin' && session.user.email !== 'prabhakar@cubelelo.com')) { router.push('/login'); return; }
    fetch('/api/competitions?limit=100').then(r => r.json()).then(d => setComps(d.competitions ?? [])).catch(() => {}).finally(() => setLoading(false));
  }, [session, status, router]);

  const handleDuplicate = async (id: string, name: string) => {
    if (!confirm(`Duplicate "${name}" as a new DRAFT?`)) return;
    setDuplicating(id);
    try {
      const res = await fetch(`/api/competitions/${id}/duplicate`, { method: 'POST' });
      const data = await res.json();
      if (data.ok && data.competition) {
        setComps(prev => [data.competition, ...prev]);
      }
    } catch {
      alert('Duplicate failed');
    } finally {
      setDuplicating(null);
    }
  };

  const advance = async (compId: string, status: string) => {
    setAdvancing(compId);
    await fetch(`/api/competitions/${compId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setComps(prev => prev.map(c => (c._id === compId || c.competitionId === compId) ? { ...c, status } : c));
    setAdvancing(null);
  };

  if (loading) return <div className="min-h-screen bg-bg flex items-center justify-center"><Loader2 size={24} className="text-accent animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/admin" className="text-xs text-muted hover:text-fg mb-1 block">← Admin</Link>
            <h1 className="text-2xl font-black">Competitions</h1>
          </div>
          <Link href="/compete/admin" className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-black font-bold text-sm rounded-xl transition-all">
            <Plus size={15} /> New Competition
          </Link>
        </div>

        <div className="space-y-3">
          {comps.length === 0 && <p className="text-center py-12 text-muted">No competitions yet.</p>}
          {comps.map(c => {
            const id = c.competitionId ?? c._id;
            const next = NEXT_STATUS[c.status];
            return (
              <div key={id} className="bg-surface border border-line rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(c.status)}`}>{getStatusLabel(c.status)}</span>
                    {c.registrationCount > 0 && <span className="text-[10px] text-muted">{c.registrationCount} registered</span>}
                  </div>
                  <h2 className="font-bold text-fg truncate">{c.name ?? c.competitionName}</h2>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {(c.events ?? []).slice(0, 4).map((e: any) => (
                      <span key={e.eventId ?? e} className="text-[10px] font-mono text-muted">{e.eventId ?? e}</span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                  {next && (
                    <button onClick={() => advance(id, next.status)} disabled={advancing === id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-line-strong rounded-lg text-muted hover:text-fg hover:bg-elevated transition-all disabled:opacity-50">
                      {advancing === id ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                      {next.label}
                    </button>
                  )}
                  <button onClick={() => handleDuplicate(id, c.competitionName ?? c.name ?? id)} disabled={duplicating === id}
                    title="Duplicate competition"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-line-strong rounded-lg text-muted hover:text-fg hover:bg-elevated transition-all disabled:opacity-50">
                    {duplicating === id ? <Loader2 size={12} className="animate-spin" /> : <Copy size={12} />}
                    Clone
                  </button>
                  <Link href={`/admin/competitions/${id}`}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-elevated border border-line-strong rounded-lg text-fg hover:bg-line transition-all">
                    Manage <ChevronRight size={12} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
