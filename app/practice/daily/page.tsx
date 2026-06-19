'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ChevronLeft, Calendar, Users, Flame, Trophy } from 'lucide-react';
// Daily challenge data fetched from API
const MOCK_LEADERBOARD: any[] = [];
import { useSession } from 'next-auth/react';

const TimerDisplay = dynamic(() => import('@/components/TimerDisplay'), { ssr: false });
const ScrambleVisualizer = dynamic(() => import('@/components/ScrambleVisualizer'), { ssr: false });

function formatTime(ms: number | null): string {
  if (ms === null) return '—';
  const s = Math.floor(ms / 1000);
  const milli = ms % 1000;
  return `${s}.${milli.toString().padStart(3, '0')}`;
}

// Seed-based "streak" from localStorage
function getStreak(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem('cubelelo_practice_streak');
    return raw ? parseInt(raw) : 3; // default 3 for demo
  } catch { return 0; }
}

export default function DailyChallenge() {
  const { data: session } = useSession();
  const [challenge, setChallenge] = useState<{ date: string; scramble: string; puzzleType: string } | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Fetch today's daily challenge from API (or generate client-side fallback)
    const today = new Date().toISOString().split('T')[0];
    fetch(`/api/daily-challenge?date=${today}`)
      .then(r => r.json())
      .then(d => { if (d.challenge) setChallenge(d.challenge); })
      .catch(() => {
        // Fallback: generate a deterministic scramble from today's date
        import('@/lib/cube').then(({ generateScramble }) => {
          setChallenge({ date: today, scramble: generateScramble('3x3x3'), puzzleType: '3x3x3' });
        });
      });
  }, []);
  const [myTime, setMyTime] = useState<number | null>(null);
  const [streak] = useState(getStreak());

  // Mock daily leaderboard — daily participants subset
  const dailyLeaderboard = MOCK_LEADERBOARD.slice(0, 5).map((e, i) => ({
    ...e,
    average: e.best ? e.best + i * 800 : null,
  }));

  const handleSolveComplete = (ms: number) => {
    setMyTime(ms);
    setSubmitted(true);
  };

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  // Find my rank in mock leaderboard
  const myRank = myTime
    ? dailyLeaderboard.filter(e => (e.average ?? Infinity) < myTime).length + 1
    : null;

  return (
    <div className="min-h-screen bg-[#0b0e11] text-white">
      {/* Header */}
      <div className="bg-[#0d1117] border-b border-[#21262d] px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div>
            <Link href="/practice" className="flex items-center gap-1 text-[#8b949e] hover:text-white text-xs mb-1 transition-colors w-fit">
              <ChevronLeft size={14} /> Practice
            </Link>
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-amber-400" />
              <h1 className="text-xl font-black text-white">Daily Challenge</h1>
            </div>
            <p className="text-xs text-[#8b949e] mt-0.5">{today}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-400/10 border border-amber-400/20">
              <Flame size={16} className="text-amber-400" />
              <span className="font-bold text-sm text-amber-400">{streak} day streak</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Scramble + Timer */}
          <div className="space-y-4">
            {/* Today's scramble — fixed, same for everyone */}
            <div className="bg-[#0d1117] border border-amber-400/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={12} className="text-amber-400" />
                <p className="text-[10px] font-mono uppercase tracking-widest text-amber-400">Today's Scramble · {challenge.puzzleType}</p>
              </div>
              <p className="font-mono text-sm text-white leading-relaxed">{challenge.scramble}</p>
            </div>

            <ScrambleVisualizer puzzleType={challenge.puzzleType} scramble={challenge.scramble} />

            {!submitted ? (
              <div>
                <p className="text-xs text-[#8b949e] text-center mb-2">
                  You get one attempt. Make it count!
                </p>
                <TimerDisplay onSolveComplete={handleSolveComplete} />
              </div>
            ) : (
              /* Result card */
              <div className="bg-gradient-to-br from-amber-500/10 to-[#0d1117] border border-amber-400/30 rounded-2xl p-6 text-center">
                <p className="text-[10px] font-mono uppercase tracking-widest text-amber-400 mb-2">Your Result</p>
                <p className="font-mono font-black text-5xl text-white mb-2">{formatTime(myTime)}</p>
                {myRank && (
                  <div className="flex items-center justify-center gap-1.5 text-sm">
                    <Trophy size={14} className="text-amber-400" />
                    <span className="text-[#8b949e]">You ranked</span>
                    <span className="font-bold text-amber-400">#{myRank}</span>
                    <span className="text-[#8b949e]">today</span>
                  </div>
                )}
                <button
                  onClick={() => navigator.share?.({ title: 'My Daily Challenge Result', text: `I solved today's ${challenge.puzzleType} daily challenge in ${formatTime(myTime)} on Cubelelo! 🧊` })}
                  className="mt-4 px-4 py-2 rounded-xl text-xs text-amber-400 border border-amber-400/30 hover:bg-amber-400/10 transition-all"
                >
                  Share Result
                </button>
              </div>
            )}
          </div>

          {/* Right: Leaderboard */}
          <div className="space-y-4">
            <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[#21262d]">
                <Users size={14} className="text-[#8b949e]" />
                <h2 className="font-semibold text-sm text-white">Today's Leaderboard</h2>
                <span className="ml-auto text-[10px] text-[#8b949e]">{dailyLeaderboard.length} submitted</span>
              </div>
              <div className="divide-y divide-[#21262d]">
                {dailyLeaderboard.map((entry, i) => (
                  <div key={entry.user.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#161b22] transition-colors">
                    <span className={`w-6 text-center font-black text-sm font-mono ${
                      i === 0 ? 'text-amber-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-600' : 'text-[#8b949e]'
                    }`}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                    </span>
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#00dbe7] to-[#a3fa00] flex items-center justify-center text-black font-bold text-xs">
                      {entry.user.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{entry.user.name}</p>
                    </div>
                    <span className="font-mono text-sm font-bold text-white">{formatTime(entry.average)}</span>
                  </div>
                ))}

                {/* My result if submitted */}
                {submitted && myTime && (
                  <div className="flex items-center gap-3 px-4 py-3 bg-amber-400/5 border-t-2 border-amber-400/30">
                    <span className="w-6 text-center font-black text-sm font-mono text-amber-400">#{myRank}</span>
                    <div className="w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center text-black font-bold text-xs">
                      {session?.user?.name?.[0] ?? 'Y'}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-amber-400">{session?.user?.name ?? 'You'}</p>
                    </div>
                    <span className="font-mono text-sm font-bold text-amber-400">{formatTime(myTime)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Calendar preview stub */}
            <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl p-4">
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#8b949e] mb-3">Your Streak</p>
              <div className="grid grid-cols-7 gap-1">
                {Array(35).fill(null).map((_, i) => {
                  const completed = i < 30 && Math.random() > 0.3;
                  const isToday = i === 34;
                  return (
                    <div
                      key={i}
                      title={isToday ? 'Today' : ''}
                      className={`aspect-square rounded-sm transition-colors ${
                        isToday
                          ? submitted ? 'bg-amber-400' : 'bg-amber-400/30 border border-amber-400/50'
                          : completed ? 'bg-[#00dbe7]/40' : 'bg-[#161b22]'
                      }`}
                    />
                  );
                })}
              </div>
              <Link href="/practice/history" className="block mt-3 text-xs text-center text-[#8b949e] hover:text-[#00dbe7] transition-colors">
                View full history →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
