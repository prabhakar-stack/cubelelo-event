'use client';

import React, { useState, useCallback } from 'react';
import { Boxes, RefreshCw, RotateCcw } from 'lucide-react';
import CubePlayer from '@/components/cube/CubePlayer';
import { generateScrambleAsync } from '@/lib/cube';

const SIZE_TO_UI: Record<number, string> = {
  2: '2x2x2', 3: '3x3x3', 4: '4x4x4', 5: '5x5x5', 6: '6x6x6', 7: '7x7x7',
};

export default function BuilderPage() {
  const [n, setN] = useState(3);
  const [scramble, setScramble] = useState('');
  const puzzle = `${n}x${n}x${n}`;

  const scrambleIt = useCallback(async (size = n) => {
    const s = await generateScrambleAsync(SIZE_TO_UI[size] ?? '3x3x3');
    setScramble(s);
  }, [n]);

  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="bg-surface border-b border-line px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-2">
          <Boxes size={18} className="text-lime" />
          <h1 className="text-xl font-black">Cube Builder</h1>
          <span className="ml-2 text-[10px] font-mono text-muted border border-line-strong rounded-full px-2 py-0.5">Sandbox</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 grid lg:grid-cols-[1fr_280px] gap-8">
        <div className="bg-surface border border-line rounded-2xl p-6 flex flex-col items-center gap-5">
          <CubePlayer scramble={scramble} puzzle={puzzle} size={340} track={false} />
          <p className="text-[11px] text-muted text-center">Drag to rotate the {puzzle} · click then type WCA notation to turn layers · arrow keys rotate the view</p>
        </div>

        <div className="space-y-5">
          <div className="bg-surface border border-line rounded-2xl p-5">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-3">Cube size</p>
            <div className="grid grid-cols-3 gap-2">
              {[2, 3, 4, 5, 6, 7].map(size => (
                <button key={size} onClick={() => { setN(size); setScramble(''); }}
                  className={`py-2 rounded-lg text-sm font-bold transition-all ${
                    n === size ? 'bg-lime text-black' : 'bg-elevated text-muted border border-line-strong hover:text-fg'
                  }`}>{size}×{size}</button>
              ))}
            </div>
            <p className="text-[10px] text-muted mt-3">The engine is NxN-scalable — larger cubes are an architecture extension.</p>
          </div>

          <div className="flex gap-2">
            <button onClick={() => scrambleIt()} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent text-black font-bold text-sm hover:bg-accent-hover transition-all">
              <RefreshCw size={14} /> Scramble
            </button>
            <button onClick={() => setScramble('')} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-line-strong text-muted hover:text-fg transition-all">
              <RotateCcw size={14} /> Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
