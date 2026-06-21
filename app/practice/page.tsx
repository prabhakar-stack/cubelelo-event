'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Dumbbell, Calendar, History, ChevronRight, Zap, RefreshCw, Trophy, Clock } from 'lucide-react';
import { generateScramble } from '@/lib/cube';
import DailyChallengeSection from '@/components/ui/DailyChallengeSection';
import UpcomingCompetitionsRail from '@/components/ui/UpcomingCompetitionsRail';

const TimerDisplay = dynamic(() => import('@/components/TimerDisplay'), { ssr: false });
const ScrambleVisualizer = dynamic(() => import('@/components/ScrambleVisualizer'), { ssr: false });

const PUZZLE_TYPES = ['3x3x3', '2x2x2', '4x4x4', 'OH', 'Pyraminx', 'Megaminx'];

function formatMs(ms: number): string {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const msStr = (ms % 1000).toString().padStart(3, '0');
  return m > 0 ? `${m}:${s.toString().padStart(2, '0')}.${msStr}` : `${s}.${msStr}`;
}

interface SolveRecord { timeInMs: number; puzzleType: string; sessionName?: string; status?: string; createdAt?: string; }

function computeAo5(solves: number[]): number | null {
  if (solves.length < 5) return null;
  const last5 = solves.slice(-5);
  const sorted = [...last5].sort((a, b) => a - b);
  const trimmed = sorted.slice(1, 4);
  return Math.round(trimmed.reduce((a, b) => a + b, 0) / trimmed.length);
}

export default function PracticePage() {
  const { data: session } = useSession();
  const [puzzleType, setPuzzleType] = useState('3x3x3');
  const [scramble, setScramble] = useState(() => generateScramble('3x3x3'));
  const [localSolves, setLocalSolves] = useState<{ time: number; scramble: string }[]>([]);
  const [dbSolves, setDbSolves] = useState<SolveRecord[]>([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [timerBlurred, setTimerBlurred] = useState(false);

  const newScramble = useCallback(() => setScramble(generateScramble(puzzleType)), [puzzleType]);

  const handleSolveComplete = useCallback((ms: number) => {
    setLocalSolves(prev => [{ time: ms, scramble }, ...prev]);
    newScramble();
  }, [scramble, newScramble]);

  const handleStatusChange = useCallback((s: string) => {
    setTimerBlurred(['holding', 'ready', 'running'].includes(s));
  }, []);

  const fetchDbSolves = useCallback(async () => {
    if (!session?.user?.id) return;
    setDbLoading(true);
    try {
      const r = await fetch('/api/solves?limit=500');
      const d = await r.json();
      setDbSolves(d.solves ?? []);
    } catch {}
    finally { setDbLoading(false); }
  }, [session?.user?.id]);

  useEffect(() => { fetchDbSolves(); }, [fetchDbSolves]);
  useEffect(() => { setScramble(generateScramble(puzzleType)); }, [puzzleType]);

  // Stats computed from DB solves
  const pbByEvent: Record<string, { best: number; ao5: number | null; count: number; totalMs: number }> = {};
  for (const ev of PUZZLE_TYPES) {
    const evSolves = dbSolves.filter(s => s.puzzleType === ev && s.status !== 'DNF').map(s => s.timeInMs);
    if (!evSolves.length) continue;
    pbByEvent[ev] = {
      best: Math.min(...evSolves),
      ao5: computeAo5([...evSolves].reverse()),
      count: evSolves.length,
      totalMs: evSolves.reduce((a, b) => a + b, 0),
    };
  }

  const totalSolves = dbSolves.length;
  const totalPracticeMs = dbSolves.filter(s => s.status !== 'DNF').reduce((a, s) => a + s.timeInMs, 0);
  const practiceHours = Math.floor(totalPracticeMs / 3600000);
  const practiceMinutes = Math.floor((totalPracticeMs % 3600000) / 60000);

  // Group by session
  const sessionMap: Record<string, SolveRecord[]> = {};
  for (const s of dbSolves) {
    const key = s.sessionName ?? 'Default';
    if (!sessionMap[key]) sessionMap[key] = [];
    sessionMap[key].push(s);
  }
  const sessionList = Object.entries(sessionMap)
    .map(([name, solves]) => ({ name, count: solves.length, best: Math.min(...solves.filter(s => s.status !== 'DNF').map(s => s.timeInMs).filter(Boolean)) || 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Local session quick stats
  const localBest = localSolves.length ? Math.min(...localSolves.map(s => s.time)) : null;
  const localMean = localSolves.length ? Math.round(localSolves.reduce((a, s) => a + s.time, 0) / localSolves.length) : null;

  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="bg-surface border-b border-line px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Dumbbell size={18} className="text-lime" />
            <h1 className="text-xl font-black text-fg">Practice Hub</h1>
          </div>
          <div className="flex gap-2">
            <Link href="/daily-challenge" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-orange-500/30 text-xs font-medium text-orange-400 hover:bg-orange-500/10 transition-all">
              <Calendar size={13} /> Daily Challenge
            </Link>
            <Link href="/timer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-line-strong text-xs font-medium text-muted hover:text-fg transition-all">
              <Clock size={13} /> Full Timer
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Daily challenge — engagement hub */}
        <DailyChallengeSection />

        <div className="grid lg:grid-cols-3 gap-6">

          {/* Sidebar: stats */}
          <div className="space-y-4">

            {/* Upcoming competitions rail */}
            <UpcomingCompetitionsRail />

            {/* Overall stats */}
            {session?.user?.id && (
              <div className="bg-surface border border-line rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted">All-Time Stats</p>
                  <button onClick={fetchDbSolves} className="text-muted hover:text-fg transition-colors">
                    <RefreshCw size={12} className={dbLoading ? 'animate-spin' : ''} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center py-2 bg-elevated rounded-xl">
                    <p className="text-[10px] text-muted">Total Solves</p>
                    <p className="font-mono font-bold text-lg text-fg">{totalSolves}</p>
                  </div>
                  <div className="text-center py-2 bg-elevated rounded-xl">
                    <p className="text-[10px] text-muted">Practice Time</p>
                    <p className="font-mono font-bold text-sm text-fg">
                      {practiceHours}h {practiceMinutes}m
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* PBs per event */}
            {session?.user?.id && Object.keys(pbByEvent).length > 0 && (
              <div className="bg-surface border border-line rounded-2xl p-4 space-y-3">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted flex items-center gap-1.5">
                  <Trophy size={10} className="text-amber-400" /> Personal Bests
                </p>
                {Object.entries(pbByEvent).map(([ev, stats]) => (
                  <div key={ev} className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-fg">{ev}</span>
                      <span className="text-[10px] text-muted ml-2">{stats.count} solves</span>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-xs text-amber-400 font-bold">{formatMs(stats.best)}</p>
                      {stats.ao5 && <p className="font-mono text-[10px] text-muted">ao5 {formatMs(stats.ao5)}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Sessions */}
            {sessionList.length > 0 && (
              <div className="bg-surface border border-line rounded-2xl p-4 space-y-2">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted">Recent Sessions</p>
                {sessionList.map(s => (
                  <div key={s.name} className="flex items-center justify-between py-1">
                    <div>
                      <p className="text-xs text-fg font-medium truncate max-w-[130px]">{s.name}</p>
                      <p className="text-[10px] text-muted">{s.count} solves</p>
                    </div>
                    <span className="font-mono text-xs text-accent">{s.best ? formatMs(s.best) : '—'}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Local session quick stats */}
            {localSolves.length > 0 && (
              <div className="bg-surface border border-line rounded-2xl p-4 space-y-2">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted">This Session</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Solves', value: String(localSolves.length) },
                    { label: 'Best', value: localBest ? formatMs(localBest) : '—' },
                    { label: 'Mean', value: localMean ? formatMs(localMean) : '—' },
                    { label: 'Last', value: formatMs(localSolves[0].time) },
                  ].map(({ label, value }) => (
                    <div key={label} className="text-center py-2 bg-elevated rounded-xl">
                      <p className="text-[10px] text-muted">{label}</p>
                      <p className="font-mono font-bold text-sm text-fg">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!session?.user?.id && (
              <div className="bg-surface border border-line rounded-2xl p-4 text-center space-y-2">
                <p className="text-xs text-muted">Sign in to save your solves and track progress over time.</p>
                <Link href="/login" className="inline-block px-4 py-1.5 rounded-xl bg-accent/10 border border-accent/30 text-accent text-xs font-medium hover:bg-accent/20 transition-all">Sign in</Link>
              </div>
            )}
          </div>

          {/* Main: timer */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-wrap gap-2 items-center">
              {PUZZLE_TYPES.map(p => (
                <button key={p} onClick={() => setPuzzleType(p)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all ${
                    puzzleType === p ? 'bg-lime text-black' : 'bg-elevated text-muted border border-line-strong hover:text-fg'
                  }`}>{p}</button>
              ))}
              <button onClick={newScramble} className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs text-muted border border-line-strong hover:text-fg transition-all">
                <Zap size={11} /> New Scramble
              </button>
            </div>

            <div className="bg-surface border border-line rounded-2xl p-4">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-1.5">Scramble</p>
              <p className="font-mono text-sm text-fg leading-relaxed break-all">{scramble}</p>
            </div>

            <div className={`grid sm:grid-cols-2 gap-4 transition-all duration-300 ${timerBlurred ? 'opacity-20 blur-sm pointer-events-none' : ''}`}>
              <ScrambleVisualizer puzzleType={puzzleType} scramble={scramble} />
            </div>
            <TimerDisplay onSolveComplete={handleSolveComplete} onStatusChange={handleStatusChange} />

            {localSolves.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-muted font-mono uppercase tracking-widest">Recent Solves</p>
                {localSolves.slice(0, 8).map((s, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 bg-surface border border-line rounded-xl">
                    <span className="text-[10px] text-muted font-mono w-4">{i + 1}</span>
                    <span className="font-mono text-sm font-bold text-fg">{formatMs(s.time)}</span>
                    <span className="text-[10px] text-muted truncate flex-1">{s.scramble.substring(0, 30)}…</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
