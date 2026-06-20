'use client';

import React, { useState, useEffect, use, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ChevronLeft, Layers, Trophy, RefreshCw } from 'lucide-react';

interface SolveRecord {
  _id: string;
  puzzleType: string;
  timeInMs: number;
  scramble: string;
  status: 'OK' | '+2' | 'DNF';
  sessionName?: string;
  notes?: string;
  createdAt: string;
}

function fmt(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const mil = ms % 1000;
  if (m > 0) return `${m}:${(s % 60).toString().padStart(2, '0')}.${mil.toString().padStart(3, '0')}`;
  return `${s}.${mil.toString().padStart(3, '0')}`;
}

function computeAoN(times: number[], n: number): number | null {
  if (times.length < n) return null;
  const last = times.slice(-n);
  const sorted = [...last].sort((a, b) => a - b);
  return Math.round(sorted.slice(1, n - 1).reduce((a, b) => a + b, 0) / (n - 2));
}

export default function SessionDetailPage({ params }: { params: Promise<{ name: string }> }) {
  const { name: encodedName } = use(params);
  const sessionName = decodeURIComponent(encodedName);
  const { data: session, status } = useSession();
  const [solves, setSolves] = useState<SolveRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchSolves = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/solves?limit=1000`);
      const d = await r.json();
      const all: SolveRecord[] = d.solves ?? [];
      // Filter to this session
      setSolves(all.filter(s => (s.sessionName ?? 'Default') === sessionName));
    } catch {
      setSolves([]);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, sessionName]);

  useEffect(() => { fetchSolves(); }, [fetchSolves]);

  const validTimes = solves.filter(s => s.status !== 'DNF').map(s =>
    s.status === '+2' ? s.timeInMs + 2000 : s.timeInMs
  );
  const best = validTimes.length ? Math.min(...validTimes) : null;
  const mean = validTimes.length ? Math.round(validTimes.reduce((a, b) => a + b, 0) / validTimes.length) : null;
  const ao5 = computeAoN(validTimes, 5);
  const ao12 = computeAoN(validTimes, 12);
  const dnfCount = solves.filter(s => s.status === 'DNF').length;
  const plus2Count = solves.filter(s => s.status === '+2').length;

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Link href="/login" className="text-accent hover:underline text-sm">Sign in to view sessions</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="bg-surface border-b border-line px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/practice/history" className="flex items-center gap-1 text-muted hover:text-fg text-xs mb-2 transition-colors w-fit">
            <ChevronLeft size={14} /> History
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-lime" />
              <h1 className="text-xl font-black text-fg truncate">{sessionName}</h1>
            </div>
            <button onClick={fetchSolves} className="text-muted hover:text-fg transition-colors flex-shrink-0">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Solves', value: String(solves.length) },
            { label: 'Best', value: best ? fmt(best) : '—' },
            { label: 'Mean', value: mean ? fmt(mean) : '—' },
            { label: 'Ao5', value: ao5 ? fmt(ao5) : '—' },
            { label: 'Ao12', value: ao12 ? fmt(ao12) : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-surface border border-line rounded-2xl p-4 text-center">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-1">{label}</p>
              <p className="font-mono font-black text-xl text-fg">{value}</p>
            </div>
          ))}
        </div>

        {/* Penalty summary */}
        {(dnfCount > 0 || plus2Count > 0) && (
          <div className="flex gap-3">
            {plus2Count > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 font-mono">
                +2 × {plus2Count}
              </div>
            )}
            {dnfCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-mono">
                DNF × {dnfCount}
              </div>
            )}
          </div>
        )}

        {/* Solve list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw size={20} className="animate-spin text-muted" />
          </div>
        ) : solves.length === 0 ? (
          <div className="text-center py-16 text-muted text-sm">No solves in this session.</div>
        ) : (
          <div className="bg-surface border border-line rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-line">
              <Trophy size={14} className="text-muted" />
              <h3 className="font-semibold text-sm text-fg">Solves</h3>
              <span className="ml-auto text-[10px] text-muted font-mono">{solves.length} total</span>
            </div>
            <div className="divide-y divide-line/50">
              {solves.map((s, i) => {
                const displayMs = s.status === '+2' ? s.timeInMs + 2000 : s.timeInMs;
                const isBest = s.status !== 'DNF' && displayMs === best;
                const isExpanded = expanded === s._id;
                return (
                  <div key={s._id}>
                    <button
                      onClick={() => setExpanded(isExpanded ? null : s._id)}
                      className="w-full flex items-center gap-3 px-5 py-3 hover:bg-elevated transition-colors text-left"
                    >
                      <span className="text-[10px] text-muted font-mono w-6 flex-shrink-0">{i + 1}</span>
                      <span className={`font-mono text-sm font-bold flex-shrink-0 ${
                        s.status === 'DNF' ? 'text-red-400' :
                        s.status === '+2' ? 'text-amber-400' :
                        isBest ? 'text-lime' : 'text-fg'
                      }`}>
                        {s.status === 'DNF' ? 'DNF' : fmt(displayMs)}
                        {s.status === '+2' && <span className="text-[10px] ml-1">+2</span>}
                        {isBest && <span className="text-[10px] text-lime ml-1">PB</span>}
                      </span>
                      <span className="text-[10px] text-muted flex-1 truncate font-mono">
                        {s.scramble.substring(0, 35)}{s.scramble.length > 35 ? '…' : ''}
                      </span>
                      <span className="text-[10px] text-muted flex-shrink-0">
                        {new Date(s.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </button>
                    {isExpanded && (
                      <div className="px-14 pb-3 space-y-1.5">
                        <p className="text-xs text-muted font-mono break-all leading-relaxed">{s.scramble}</p>
                        {s.notes && (
                          <p className="text-xs text-muted italic">"{s.notes}"</p>
                        )}
                        <p className="text-[10px] text-muted">
                          {new Date(s.createdAt).toLocaleString('en-IN')} · {s.puzzleType}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
