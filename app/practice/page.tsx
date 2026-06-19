'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Dumbbell, Calendar, History, ChevronRight, Zap } from 'lucide-react';
import { generateScramble } from '@/lib/cube';

const TimerDisplay = dynamic(() => import('@/components/TimerDisplay'), { ssr: false });
const ScrambleVisualizer = dynamic(() => import('@/components/ScrambleVisualizer'), { ssr: false });

const PUZZLE_TYPES = ['3x3x3', '2x2x2', '4x4x4', 'OH', 'Pyraminx', 'Megaminx'];

const QUICK_LINKS = [
  {
    href: '/practice/daily',
    icon: Calendar,
    color: 'text-amber-400',
    bg: 'bg-amber-400/10 border-amber-400/20',
    title: 'Daily Challenge',
    desc: "Today's fixed scramble. See how you rank."
  },
  {
    href: '/practice/history',
    icon: History,
    color: 'text-[#a3fa00]',
    bg: 'bg-[#a3fa00]/10 border-[#a3fa00]/20',
    title: 'My History',
    desc: 'Progress charts, heatmap, and all-time stats.'
  },
];

export default function FreePractice() {
  const [puzzleType, setPuzzleType] = useState('3x3x3');
  const [scramble, setScramble] = useState(() => generateScramble('3x3x3'));
  const [solves, setSolves] = useState<{ time: number; scramble: string }[]>([]);

  const newScramble = () => setScramble(generateScramble(puzzleType));

  const handleSolveComplete = (ms: number) => {
    setSolves(prev => [{ time: ms, scramble }, ...prev]);
    newScramble();
  };

  function fmt(ms: number) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const rem = s % 60;
    const mil = ms % 1000;
    if (m > 0) return `${m}:${rem.toString().padStart(2, '0')}.${mil.toString().padStart(3, '0')}`;
    return `${s}.${mil.toString().padStart(3, '0')}`;
  }

  const best = solves.length ? Math.min(...solves.map(s => s.time)) : null;
  const mean = solves.length ? Math.round(solves.reduce((a, s) => a + s.time, 0) / solves.length) : null;

  return (
    <div className="min-h-screen bg-[#0b0e11] text-white">
      {/* Header */}
      <div className="bg-[#0d1117] border-b border-[#21262d] px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Dumbbell size={18} className="text-[#a3fa00]" />
            <h1 className="text-xl font-black text-white">Practice Mode</h1>
          </div>
          <div className="flex gap-2">
            {QUICK_LINKS.map(({ href, icon: Icon, color, title }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all hover:opacity-80 ${color} bg-[#161b22] border-[#30363d]`}
              >
                <Icon size={13} className={color} />
                {title}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Quick links */}
          <div className="space-y-3">
            {QUICK_LINKS.map(({ href, icon: Icon, color, bg, title, desc }) => (
              <Link
                key={href}
                href={href}
                className="flex items-start gap-3 p-4 bg-[#0d1117] border border-[#21262d] hover:border-[#30363d] rounded-2xl group transition-all hover:-translate-y-0.5"
              >
                <div className={`w-9 h-9 rounded-xl border ${bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={16} className={color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-white">{title}</p>
                  <p className="text-xs text-[#8b949e] mt-0.5">{desc}</p>
                </div>
                <ChevronRight size={14} className="text-[#8b949e] group-hover:text-white mt-1 transition-colors" />
              </Link>
            ))}

            {/* Session stats */}
            {solves.length > 0 && (
              <div className="p-4 bg-[#0d1117] border border-[#21262d] rounded-2xl">
                <p className="text-[10px] font-mono uppercase tracking-widest text-[#8b949e] mb-3">This Session</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Solves', value: solves.length.toString() },
                    { label: 'Best', value: best ? fmt(best) : '—' },
                    { label: 'Mean', value: mean ? fmt(mean) : '—' },
                    { label: 'Last', value: fmt(solves[0].time) },
                  ].map(({ label, value }) => (
                    <div key={label} className="text-center py-2 bg-[#161b22] rounded-xl">
                      <p className="text-[10px] text-[#8b949e] mb-0.5">{label}</p>
                      <p className="font-mono font-bold text-sm text-white">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Timer */}
          <div className="lg:col-span-2 space-y-4">
            {/* Puzzle selector */}
            <div className="flex flex-wrap gap-2">
              {PUZZLE_TYPES.map(p => (
                <button
                  key={p}
                  onClick={() => { setPuzzleType(p); setScramble(generateScramble(p)); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all ${
                    puzzleType === p
                      ? 'bg-[#a3fa00] text-black'
                      : 'bg-[#161b22] text-[#8b949e] border border-[#30363d] hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button onClick={newScramble} className="ml-auto px-3 py-1.5 rounded-xl text-xs text-[#8b949e] border border-[#30363d] hover:text-white transition-all flex items-center gap-1">
                <Zap size={11} /> New
              </button>
            </div>

            {/* Scramble */}
            <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl p-4">
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#8b949e] mb-1.5">Scramble</p>
              <p className="font-mono text-sm text-white leading-relaxed">{scramble}</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <ScrambleVisualizer puzzleType={puzzleType} scramble={scramble} />
              <TimerDisplay onSolveComplete={handleSolveComplete} />
            </div>

            {/* Recent solves */}
            {solves.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-[#8b949e] font-mono uppercase tracking-widest">Recent</p>
                {solves.slice(0, 5).map((s, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 bg-[#0d1117] border border-[#21262d] rounded-xl">
                    <span className="text-[10px] text-[#8b949e] font-mono w-4">{i + 1}</span>
                    <span className="font-mono text-sm font-bold text-white">{fmt(s.time)}</span>
                    <span className="text-[10px] text-[#8b949e] truncate flex-1">{s.scramble.substring(0, 30)}...</span>
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
