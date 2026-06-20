'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Flame, Trophy, Clock, Copy, RefreshCw, CheckCircle2 } from 'lucide-react';

const TimerDisplay = dynamic(() => import('@/components/TimerDisplay'), { ssr: false });
const ScrambleVisualizer = dynamic(() => import('@/components/ScrambleVisualizer'), { ssr: false });

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  time: string;
  status: string;
}

function formatMs(ms: number, status: string): string {
  if (status === 'DNF') return 'DNF';
  if (status === '+2') ms += 2000;
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const msStr = (ms % 1000).toString().padStart(3, '0');
  return m > 0 ? `${m}:${s.toString().padStart(2, '0')}.${msStr}` : `${s}.${msStr}`;
}

export default function DailyChallengePage() {
  const { data: session } = useSession();
  const [challenge, setChallenge] = useState<any>(null);
  const [myEntry, setMyEntry] = useState<any>(null);
  const [streak, setStreak] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timerState, setTimerState] = useState<'idle' | 'done'>('idle');
  const [solvedMs, setSolvedMs] = useState<number>(0);
  const [pendingStatus, setPendingStatus] = useState<'OK' | '+2' | 'DNF'>('OK');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [timerBlurred, setTimerBlurred] = useState(false);

  const fetchChallenge = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/daily-challenge');
      const d = await r.json();
      setChallenge(d.challenge);
      setMyEntry(d.myEntry);
      setStreak(d.streak ?? 0);
    } catch {
      setError('Failed to load today\'s challenge');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const r = await fetch('/api/daily-challenge/leaderboard');
      const d = await r.json();
      setLeaderboard(d.leaderboard ?? []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchChallenge();
    fetchLeaderboard();
  }, [fetchChallenge, fetchLeaderboard]);

  const handleSolveComplete = useCallback((ms: number) => {
    setSolvedMs(ms);
    setTimerState('done');
    setPendingStatus('OK');
  }, []);

  const handleStatusChange = useCallback((status: string) => {
    setTimerBlurred(['holding', 'ready', 'running'].includes(status));
  }, []);

  const submitResult = async () => {
    if (!session) {
      setError('Please sign in to submit your result');
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch('/api/daily-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeInMs: solvedMs, status: pendingStatus }),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error ?? 'Submission failed');
      } else {
        setMyEntry(d.entry);
        fetchLeaderboard();
        fetchChallenge();
      }
    } catch {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-black text-fg flex items-center gap-2">
              <Flame className="text-orange-400" size={24} />
              Daily Challenge
            </h1>
            <p className="text-sm text-muted mt-1">{today}</p>
          </div>
          {streak > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-2xl">
              <Flame size={18} className="text-orange-400" />
              <span className="font-black text-xl text-orange-400">{streak}</span>
              <span className="text-sm text-muted">day streak</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="animate-spin text-muted" size={24} />
          </div>
        ) : !challenge ? (
          <div className="text-center py-20 text-muted">{error || "Today's challenge isn't ready yet."}</div>
        ) : (
          <>
            {/* Scramble card */}
            <div className="bg-surface border border-line rounded-2xl p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-1.5">Today's Scramble · 3×3×3</p>
                  <p className="font-mono text-sm text-fg leading-relaxed break-all">{challenge.scramble}</p>
                </div>
                <button
                  onClick={() => { navigator.clipboard.writeText(challenge.scramble); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                  className="p-2 rounded-lg text-muted hover:text-fg hover:bg-line transition-all flex-shrink-0"
                >
                  {copied ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>
              <div className={`transition-all duration-300 ${timerBlurred ? 'opacity-20 blur-sm pointer-events-none' : ''}`}>
                <ScrambleVisualizer puzzleType="3x3x3" scramble={challenge.scramble} />
              </div>
            </div>

            {/* Timer or result */}
            {myEntry ? (
              <div className="bg-surface border border-emerald-500/30 rounded-2xl p-6 text-center space-y-2">
                <CheckCircle2 size={36} className="text-emerald-400 mx-auto" />
                <p className="text-sm text-muted">Your result today</p>
                <p className="font-mono font-black text-4xl text-emerald-400">
                  {formatMs(myEntry.timeInMs ?? 0, myEntry.status)}
                </p>
                <p className="text-xs text-muted">Come back tomorrow for a new scramble!</p>
              </div>
            ) : (
              <div className="bg-surface border border-line rounded-2xl p-5 space-y-4">
                {!session && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2 text-xs text-amber-400">
                    <Link href="/login" className="underline">Sign in</Link> to save your result to the leaderboard.
                  </div>
                )}

                {timerState === 'idle' ? (
                  <TimerDisplay
                    onSolveComplete={handleSolveComplete}
                    onStatusChange={handleStatusChange}
                  />
                ) : (
                  <div className="space-y-4 text-center">
                    <p className="text-sm text-muted">Your time</p>
                    <p className="font-mono font-black text-5xl text-fg">
                      {pendingStatus === 'DNF' ? 'DNF' : formatMs(solvedMs, pendingStatus)}
                    </p>
                    {/* Penalty */}
                    <div className="flex justify-center gap-2">
                      {(['OK', '+2', 'DNF'] as const).map(p => (
                        <button key={p} onClick={() => setPendingStatus(p)}
                          className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                            pendingStatus === p
                              ? p === 'DNF' ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                                : p === '+2' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : 'bg-elevated text-muted border border-line-strong hover:text-fg'
                          }`}
                        >{p}</button>
                      ))}
                    </div>
                    {error && <p className="text-red-400 text-xs">{error}</p>}
                    <div className="flex justify-center gap-3">
                      <button onClick={() => { setTimerState('idle'); setSolvedMs(0); setError(''); }}
                        className="px-4 py-2 rounded-xl text-sm text-muted border border-line-strong hover:text-fg transition-all">
                        Retry
                      </button>
                      {session && (
                        <button onClick={submitResult} disabled={submitting}
                          className="px-6 py-2 rounded-xl text-sm font-bold bg-accent text-black hover:bg-accent/80 disabled:opacity-50 transition-all">
                          {submitting ? 'Submitting...' : 'Submit Result'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Leaderboard */}
            <div className="bg-surface border border-line rounded-2xl p-5">
              <h2 className="text-sm font-bold text-fg mb-4 flex items-center gap-2">
                <Trophy size={15} className="text-amber-400" />
                Today's Leaderboard
                <span className="text-muted font-normal">({leaderboard.length} solves)</span>
              </h2>
              {leaderboard.length === 0 ? (
                <p className="text-center text-muted text-sm py-8">No submissions yet — be the first!</p>
              ) : (
                <div className="space-y-1.5">
                  {leaderboard.slice(0, 50).map((entry) => (
                    <div key={entry.userId} className={`flex items-center gap-3 px-3 py-2 rounded-xl ${
                      entry.rank <= 3 ? 'bg-amber-500/5 border border-amber-500/10' : 'hover:bg-elevated'
                    }`}>
                      <span className={`w-6 text-right font-mono text-xs font-bold flex-shrink-0 ${
                        entry.rank === 1 ? 'text-amber-400' :
                        entry.rank === 2 ? 'text-[#c0c0c0]' :
                        entry.rank === 3 ? 'text-amber-700' : 'text-muted'
                      }`}>{entry.rank}</span>
                      <span className="flex-1 text-sm text-fg truncate">{entry.name}</span>
                      <span className={`font-mono text-sm font-bold ${
                        entry.status === 'DNF' ? 'text-red-400' :
                        entry.rank === 1 ? 'text-amber-400' : 'text-fg'
                      }`}>{entry.time}</span>
                      {entry.rank <= 3 && <Clock size={12} className="text-muted" />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
