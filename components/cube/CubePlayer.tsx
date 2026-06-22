'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { DEFAULT_KEYMAP, KeyMap, isRotation } from '@/lib/cube/input';
import {
  applySingleMove2, applySingleMove3,
  getInitialCubeState2, getInitialCubeState3,
} from '@/lib/cube';

interface CubePlayerProps {
  scramble: string;
  /** twisty puzzle string, e.g. '2x2x2' | '3x3x3' | '4x4x4'. */
  puzzle?: string;
  keymap?: KeyMap;
  controlPanel?: 'none' | 'bottom-row';
  /** Track move count + solved state (supported for 2×2 / 3×3). */
  track?: boolean;
  onMove?: (move: string, count: number) => void;
  onSolved?: (count: number) => void;
  size?: number;
  className?: string;
}

function isSolved(state: Record<string, string[]>): boolean {
  return Object.values(state).every(face => face.every(s => s === face[0]));
}

function trackDimOf(puzzle: string): 0 | 2 | 3 {
  if (puzzle === '2x2x2') return 2;
  if (puzzle === '3x3x3') return 3;
  return 0;
}

export default function CubePlayer({
  scramble,
  puzzle = '3x3x3',
  keymap = DEFAULT_KEYMAP,
  controlPanel = 'none',
  track = true,
  onMove,
  onSolved,
  size = 280,
  className = '',
}: CubePlayerProps) {
  const [loaded, setLoaded] = useState(false);
  const playerRef = useRef<HTMLElement | null>(null);
  const stateRef = useRef<Record<string, string[]> | null>(null);
  const countRef = useRef(0);
  const solvedRef = useRef(false);
  const dim = track ? trackDimOf(puzzle) : 0;

  useEffect(() => {
    import('cubing/twisty').then(() => setLoaded(true)).catch(() => {});
  }, []);

  // (Re)build the tracked state whenever the scramble or puzzle changes.
  const resetState = useCallback(() => {
    countRef.current = 0;
    solvedRef.current = false;
    if (dim === 0) { stateRef.current = null; return; }
    let st: any = dim === 2 ? getInitialCubeState2() : getInitialCubeState3();
    const apply = dim === 2 ? applySingleMove2 : applySingleMove3;
    for (const m of scramble.trim().split(/\s+/).filter(Boolean)) {
      try { st = apply(st, m); } catch { /* skip unknown token */ }
    }
    stateRef.current = st;
  }, [scramble, dim]);

  useEffect(() => { resetState(); }, [resetState]);

  const handleKey = useCallback((e: React.KeyboardEvent) => {
    const move = keymap[e.key];
    if (!move) return;
    e.preventDefault();

    (playerRef.current as any)?.experimentalAddMove?.(move);

    if (dim === 0 || isRotation(move)) return;          // rotations: visual only
    if (stateRef.current) {
      const apply = dim === 2 ? applySingleMove2 : applySingleMove3;
      try { stateRef.current = apply(stateRef.current as any, move) as any; } catch { return; }
    }
    countRef.current += 1;
    onMove?.(move, countRef.current);
    if (!solvedRef.current && stateRef.current && isSolved(stateRef.current)) {
      solvedRef.current = true;
      onSolved?.(countRef.current);
    }
  }, [keymap, dim, onMove, onSolved]);

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKey}
      className={`relative outline-none rounded-2xl focus:ring-2 focus:ring-accent/40 ${className}`}
      style={{ width: size, height: size }}
      aria-label="Interactive cube — click then type WCA notation"
    >
      {loaded && (
        <twisty-player
          ref={playerRef as any}
          puzzle={puzzle}
          experimental-setup-alg={scramble}
          experimental-drag-input="auto"
          background="none"
          control-panel={controlPanel}
          style={{ width: '100%', height: '100%' }}
        />
      )}
      {!loaded && (
        <div className="w-full h-full flex items-center justify-center text-xs text-muted">Loading cube…</div>
      )}
    </div>
  );
}
