'use client';

import React, { useState, useCallback } from 'react';
import { Wand2, RefreshCw, Cpu, ListOrdered, Lock } from 'lucide-react';
import CubePlayer from '@/components/cube/CubePlayer';
import { generateScrambleAsync } from '@/lib/cube';
import { getEngine, classifyDifficulty } from '@/lib/solver';
import type { OptimalResult, AlgorithmicResult } from '@/lib/solver';

const PUZZLES = [
  { ui: '2x2x2', key: '222', label: '2×2' },
  { ui: '3x3x3', key: '333', label: '3×3' },
];

const DIFF_COLOR: Record<string, string> = {
  easy: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  medium: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  hard: 'text-orange-400 border-orange-500/30 bg-orange-500/10',
  expert: 'text-red-400 border-red-500/30 bg-red-500/10',
};

export default function SolverPage() {
  const [puzzle, setPuzzle] = useState(PUZZLES[1]);
  const [scramble, setScramble] = useState('');
  const [optimal, setOptimal] = useState<OptimalResult | null>(null);
  const [algo, setAlgo] = useState<AlgorithmicResult | null>(null);
  const [solving, setSolving] = useState(false);

  const generate = useCallback(async (p = puzzle) => {
    setOptimal(null); setAlgo(null);
    const s = await generateScrambleAsync(p.ui);
    setScramble(s);
  }, [puzzle]);

  const solve = useCallback(async () => {
    if (!scramble.trim()) return;
    setSolving(true);
    try {
      const engine = getEngine(puzzle.key);
      if (!engine) return;
      const [a, b] = await Promise.all([engine.solveOptimal(scramble), engine.solveAlgorithmic(scramble)]);
      setOptimal(a); setAlgo(b);
    } finally {
      setSolving(false);
    }
  }, [scramble, puzzle]);

  const difficulty = optimal ? classifyDifficulty(puzzle.key, optimal.count) : null;

  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="bg-surface border-b border-line px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-2">
          <Wand2 size={18} className="text-accent" />
          <h1 className="text-xl font-black">Cube Solver</h1>
          <span className="ml-2 text-[10px] font-mono text-muted border border-line-strong rounded-full px-2 py-0.5">Engine A + B</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 grid lg:grid-cols-2 gap-6">
        {/* Left: cube + scramble */}
        <div className="space-y-4">
          <div className="flex gap-2">
            {PUZZLES.map(p => (
              <button key={p.key} onClick={() => { setPuzzle(p); setOptimal(null); setAlgo(null); }}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  puzzle.key === p.key ? 'bg-accent text-black' : 'bg-elevated text-muted border border-line-strong hover:text-fg'
                }`}>{p.label}</button>
            ))}
            <button onClick={() => generate()} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted border border-line-strong hover:text-fg transition-all">
              <RefreshCw size={13} /> Generate
            </button>
          </div>

          <div className="bg-surface border border-line rounded-2xl p-4 flex flex-col items-center gap-4">
            <CubePlayer scramble={scramble} puzzle={puzzle.ui} size={260} track={false} />
            <p className="text-[11px] text-muted text-center">Drag to rotate · click the cube then type WCA notation (R, U, F…)</p>
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted mb-1 block">Scramble</label>
            <textarea value={scramble} onChange={e => { setScramble(e.target.value); setOptimal(null); setAlgo(null); }}
              rows={2} placeholder="Enter or generate a scramble…"
              className="w-full px-3 py-2 bg-elevated border border-line-strong rounded-xl text-sm font-mono text-fg focus:outline-none focus:border-accent resize-none" />
          </div>

          <button onClick={solve} disabled={solving || !scramble.trim()}
            className="w-full py-2.5 rounded-xl bg-accent text-black font-bold text-sm hover:bg-accent-hover disabled:opacity-50 transition-all">
            {solving ? 'Solving…' : 'Solve'}
          </button>
        </div>

        {/* Right: dual output */}
        <div className="space-y-4">
          {/* Engine A — optimal */}
          <div className="bg-surface border border-line rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2"><Cpu size={15} className="text-accent" /><h2 className="font-bold text-sm">Engine A · Optimal</h2></div>
              {difficulty && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${DIFF_COLOR[difficulty]}`}>{difficulty} · {optimal?.count} moves</span>}
            </div>
            {optimal ? (
              <>
                <p className="font-mono text-sm text-fg break-words">{optimal.moves || '(already solved)'}</p>
                <p className="text-[10px] text-muted mt-2">{optimal.count} moves · {optimal.method}</p>
              </>
            ) : <p className="text-xs text-muted">Run the solver to see the fewest-move solution.</p>}
          </div>

          {/* Engine B — algorithmic */}
          <div className="bg-surface border border-line rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2"><ListOrdered size={15} className="text-lime" /><h2 className="font-bold text-sm">Engine B · Step-by-step</h2></div>
            {algo ? (
              <div className="space-y-1.5">
                {algo.steps.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="text-[10px] text-muted w-14 flex-shrink-0">{s.label}</span>
                    <span className="font-mono text-fg">{s.moves}</span>
                  </div>
                ))}
                <p className="text-[10px] text-muted pt-1">{algo.totalCount} moves · {algo.method}</p>
              </div>
            ) : <p className="text-xs text-muted">Run the solver to see the procedural walkthrough.</p>}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-muted bg-elevated border border-line-strong rounded-xl px-3 py-2">
            <Lock size={12} /> Advanced solver features (full optimal depth, more events) will be part of a premium tier.
          </div>
        </div>
      </div>
    </div>
  );
}
