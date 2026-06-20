'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ChevronLeft, History, TrendingUp, Calendar, BarChart2, RefreshCw, ChevronRight } from 'lucide-react';

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
  const rem = s % 60;
  const mil = ms % 1000;
  if (m > 0) return `${m}:${rem.toString().padStart(2, '0')}.${mil.toString().padStart(3, '0')}`;
  return `${s}.${mil.toString().padStart(3, '0')}`;
}

function computeAoN(times: number[], n: number): number | null {
  if (times.length < n) return null;
  const last = times.slice(-n);
  const sorted = [...last].sort((a, b) => a - b);
  const trimmed = sorted.slice(1, n - 1);
  return Math.round(trimmed.reduce((a, b) => a + b, 0) / trimmed.length);
}

const PUZZLE_TYPES = ['3x3x3', '2x2x2', '4x4x4', 'OH', 'Pyraminx', 'Megaminx', 'Skewb', 'Square-1'];

export default function PracticeHistory() {
  const { data: session, status } = useSession();
  const [selectedPuzzle, setSelectedPuzzle] = useState('3x3x3');
  const [solves, setSolves] = useState<SolveRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  const fetchSolves = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/solves?puzzleType=${encodeURIComponent(selectedPuzzle)}&limit=500`);
      const d = await r.json();
      setSolves(d.solves ?? []);
    } catch {
      setSolves([]);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, selectedPuzzle]);

  useEffect(() => {
    setPage(1);
    fetchSolves();
  }, [fetchSolves]);

  // ── Stats ──────────────────────────────────────────────
  const validTimes = solves.filter(s => s.status !== 'DNF').map(s =>
    s.status === '+2' ? s.timeInMs + 2000 : s.timeInMs
  );
  const best = validTimes.length ? Math.min(...validTimes) : null;
  const worst = validTimes.length ? Math.max(...validTimes) : null;
  const mean = validTimes.length
    ? Math.round(validTimes.reduce((a, b) => a + b, 0) / validTimes.length)
    : null;
  const ao5 = computeAoN(validTimes, 5);
  const ao12 = computeAoN(validTimes, 12);

  // ── Progress chart (last 30 valid solves, oldest→newest) ──
  const chartSolves = [...solves]
    .reverse()
    .filter(s => s.status !== 'DNF')
    .slice(-30);
  const chartTimes = chartSolves.map(s => s.status === '+2' ? s.timeInMs + 2000 : s.timeInMs);
  const chartMin = chartTimes.length ? Math.min(...chartTimes) : 0;
  const chartMax = chartTimes.length ? Math.max(...chartTimes) : 1;
  const W = 360, H = 90;
  const chartPoints = chartTimes.map((t, i) => {
    const x = (i / Math.max(chartTimes.length - 1, 1)) * W;
    const y = H - ((t - chartMin) / Math.max(chartMax - chartMin, 1)) * H;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  // ── Activity heatmap (last 84 days, real data) ──────────
  const solvesByDate: Record<string, number> = {};
  for (const s of solves) {
    const d = new Date(s.createdAt).toISOString().split('T')[0];
    solvesByDate[d] = (solvesByDate[d] ?? 0) + 1;
  }
  const heatmap = Array.from({ length: 84 }, (_, i) => {
    const date = new Date(Date.now() - (83 - i) * 86400000);
    const ds = date.toISOString().split('T')[0];
    return { date: ds, count: solvesByDate[ds] ?? 0 };
  });

  // ── Sessions grouped ────────────────────────────────────
  const sessionMap: Record<string, SolveRecord[]> = {};
  for (const s of solves) {
    const key = s.sessionName ?? 'Default';
    if (!sessionMap[key]) sessionMap[key] = [];
    sessionMap[key].push(s);
  }
  const sessionList = Object.entries(sessionMap).map(([name, ss]) => {
    const valid = ss.filter(s => s.status !== 'DNF').map(s => s.timeInMs);
    return {
      name,
      count: ss.length,
      best: valid.length ? Math.min(...valid) : null,
      mean: valid.length ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : null,
    };
  }).sort((a, b) => b.count - a.count);

  // ── Paged solve log ─────────────────────────────────────
  const pagedSolves = solves.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(solves.length / PAGE_SIZE);

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-[#0b0e11] flex flex-col items-center justify-center gap-4">
        <p className="text-[#8b949e] text-sm">Sign in to view your practice history.</p>
        <Link href="/login" className="px-4 py-2 rounded-xl bg-[#00dbe7]/10 border border-[#00dbe7]/30 text-[#00dbe7] text-sm">Sign in</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0e11] text-white">
      {/* Header */}
      <div className="bg-[#0d1117] border-b border-[#21262d] px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto">
          <Link href="/practice" className="flex items-center gap-1 text-[#8b949e] hover:text-white text-xs mb-2 transition-colors w-fit">
            <ChevronLeft size={14} /> Practice
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History size={18} className="text-[#a3fa00]" />
              <h1 className="text-xl font-black text-white">Practice History</h1>
            </div>
            <button onClick={fetchSolves} className="text-[#8b949e] hover:text-white transition-colors">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Puzzle selector */}
        <div className="flex flex-wrap gap-2">
          {PUZZLE_TYPES.map(p => (
            <button key={p} onClick={() => setSelectedPuzzle(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all ${
                selectedPuzzle === p
                  ? 'bg-[#a3fa00] text-black'
                  : 'bg-[#161b22] text-[#8b949e] border border-[#30363d] hover:text-white'
              }`}>
              {p}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw size={20} className="animate-spin text-[#8b949e]" />
          </div>
        ) : solves.length === 0 ? (
          <div className="text-center py-16 text-[#8b949e] text-sm">
            No {selectedPuzzle} solves yet.{' '}
            <Link href="/terminal" className="text-[#00dbe7] hover:underline">Start practicing →</Link>
          </div>
        ) : (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: 'Total', value: String(solves.length) },
                { label: 'Best', value: best ? fmt(best) : '—' },
                { label: 'Mean', value: mean ? fmt(mean) : '—' },
                { label: 'Ao5', value: ao5 ? fmt(ao5) : '—' },
                { label: 'Ao12', value: ao12 ? fmt(ao12) : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-[#0d1117] border border-[#21262d] rounded-2xl p-4 text-center">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-[#8b949e] mb-1">{label}</p>
                  <p className="font-mono font-black text-xl text-white">{value}</p>
                </div>
              ))}
            </div>

            {/* Progress chart */}
            {chartTimes.length > 1 && (
              <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={14} className="text-[#a3fa00]" />
                  <h3 className="font-semibold text-sm text-white">Progress Trend</h3>
                  <span className="ml-auto text-[10px] text-[#8b949e]">Last {chartTimes.length} solves</span>
                </div>
                <svg viewBox={`0 0 ${W} ${H + 20}`} className="w-full" style={{ minWidth: '280px' }}>
                  {[0, H / 4, H / 2, (3 * H) / 4, H].map(y => (
                    <line key={y} x1="0" y1={y} x2={W} y2={y} stroke="#21262d" strokeWidth="0.5" />
                  ))}
                  <polyline points={chartPoints} fill="none" stroke="#a3fa00" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round" />
                  {chartTimes.map((t, i) => {
                    const x = (i / Math.max(chartTimes.length - 1, 1)) * W;
                    const y = H - ((t - chartMin) / Math.max(chartMax - chartMin, 1)) * H;
                    return <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r="2.5" fill="#a3fa00" />;
                  })}
                  <text x="2" y="10" fontSize="8" fill="#8b949e">{fmt(chartMax)}</text>
                  <text x="2" y={H} fontSize="8" fill="#8b949e">{fmt(chartMin)}</text>
                </svg>
              </div>
            )}

            {/* Activity heatmap */}
            <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Calendar size={14} className="text-[#8b949e]" />
                <h3 className="font-semibold text-sm text-white">Activity — Last 12 Weeks</h3>
                <span className="ml-auto text-[10px] text-[#8b949e]">{selectedPuzzle}</span>
              </div>
              <div className="grid grid-rows-7 grid-flow-col gap-1" style={{ gridTemplateRows: 'repeat(7, 1fr)' }}>
                {heatmap.map(({ date, count }) => {
                  const lvl = count === 0 ? 0 : count < 5 ? 1 : count < 10 ? 2 : count < 20 ? 3 : 4;
                  const colors = ['bg-[#161b22]', 'bg-[#a3fa00]/20', 'bg-[#a3fa00]/45', 'bg-[#a3fa00]/70', 'bg-[#a3fa00]'];
                  return (
                    <div key={date} title={`${date}: ${count} solve${count !== 1 ? 's' : ''}`}
                      className={`w-3 h-3 rounded-sm ${colors[lvl]}`} />
                  );
                })}
              </div>
              <div className="flex items-center gap-1.5 mt-3 text-[10px] text-[#8b949e]">
                <span>Less</span>
                {['bg-[#161b22]', 'bg-[#a3fa00]/20', 'bg-[#a3fa00]/45', 'bg-[#a3fa00]/70', 'bg-[#a3fa00]'].map((c, i) => (
                  <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
                ))}
                <span>More</span>
              </div>
            </div>

            {/* Sessions */}
            {sessionList.length > 0 && (
              <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3 border-b border-[#21262d]">
                  <h3 className="font-semibold text-sm text-white">Sessions</h3>
                  <span className="ml-auto text-[10px] text-[#8b949e]">{sessionList.length} sessions</span>
                </div>
                <div className="divide-y divide-[#21262d]">
                  {sessionList.map(s => (
                    <Link key={s.name}
                      href={`/practice/sessions/${encodeURIComponent(s.name)}?puzzle=${encodeURIComponent(selectedPuzzle)}`}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-[#161b22] transition-colors group">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{s.name}</p>
                        <p className="text-[10px] text-[#8b949e]">{s.count} solves</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {s.best && <p className="font-mono text-xs text-amber-400 font-bold">{fmt(s.best)}</p>}
                        {s.mean && <p className="font-mono text-[10px] text-[#8b949e]">mean {fmt(s.mean)}</p>}
                      </div>
                      <ChevronRight size={14} className="text-[#8b949e] group-hover:text-white transition-colors flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Solve log */}
            <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-[#21262d]">
                <BarChart2 size={14} className="text-[#8b949e]" />
                <h3 className="font-semibold text-sm text-white">All Solves</h3>
                <span className="ml-auto text-[10px] text-[#8b949e]">{solves.length} total</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="text-[#8b949e] border-b border-[#21262d]">
                      <th className="text-left px-5 py-2">#</th>
                      <th className="text-left px-3 py-2">Time</th>
                      <th className="text-left px-3 py-2 hidden sm:table-cell">Session</th>
                      <th className="text-left px-3 py-2">Date</th>
                      <th className="text-left px-3 py-2 hidden md:table-cell">Scramble</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#21262d]/50">
                    {pagedSolves.map((s, i) => {
                      const displayTime = s.status === '+2' ? s.timeInMs + 2000 : s.timeInMs;
                      return (
                        <tr key={s._id} className="hover:bg-[#161b22] transition-colors">
                          <td className="px-5 py-2 text-[#8b949e]">{(page - 1) * PAGE_SIZE + i + 1}</td>
                          <td className={`px-3 py-2 font-bold ${
                            s.status === 'DNF' ? 'text-red-400' :
                            s.status === '+2' ? 'text-amber-400' : 'text-white'
                          }`}>
                            {s.status === 'DNF' ? 'DNF' : fmt(displayTime)}
                            {s.status === '+2' && <span className="text-[10px] ml-1">+2</span>}
                          </td>
                          <td className="px-3 py-2 text-[#8b949e] hidden sm:table-cell truncate max-w-[120px]">
                            {s.sessionName ?? 'Default'}
                          </td>
                          <td className="px-3 py-2 text-[#8b949e]">
                            {new Date(s.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </td>
                          <td className="px-3 py-2 text-[#8b949e] truncate max-w-[200px] hidden md:table-cell">
                            {s.scramble.substring(0, 30)}{s.scramble.length > 30 ? '…' : ''}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-[#21262d]">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="text-xs text-[#8b949e] hover:text-white disabled:opacity-30 transition-colors">← Prev</button>
                  <span className="text-xs text-[#8b949e] font-mono">{page} / {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="text-xs text-[#8b949e] hover:text-white disabled:opacity-30 transition-colors">Next →</button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
