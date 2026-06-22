'use client';

import React, { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import { ChevronLeft, FileText, MessagesSquare, ListChecks, Trophy, Lock, Lightbulb, Send } from 'lucide-react';
import CubePlayer from '@/components/cube/CubePlayer';
import { hintPenaltyPercent, hintsLocked, finalScore } from '@/lib/problems/scoring';

const PUZZLE_UI: Record<string, string> = { '222': '2x2x2', '333': '3x3x3' };
type TabId = 'description' | 'discussion' | 'submissions' | 'solution';

export default function ProblemDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [problem, setProblem] = useState<any>(null);
  const [solutionUnlocked, setSolutionUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>('description');

  // Hint state (persistence endpoint wired when problems are published).
  const [hintsUsed, setHintsUsed] = useState(0);
  const [moveCount, setMoveCount] = useState(0);
  const [solved, setSolved] = useState(false);

  useEffect(() => {
    fetch(`/api/problems/${id}`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d?.problem) { setProblem(d.problem); setSolutionUnlocked(!!d.solutionUnlocked); } })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const totalHints = problem?.hints?.length ?? 0;
  const penalty = hintPenaltyPercent(hintsUsed);
  const locked = hintsLocked(hintsUsed, totalHints);
  const useHint = useCallback(() => { if (!locked) setHintsUsed(h => h + 1); }, [locked]);

  const TABS: { id: TabId; label: string; icon: React.ElementType; hidden?: boolean }[] = [
    { id: 'description', label: 'Description', icon: FileText },
    { id: 'discussion', label: 'Discussion', icon: MessagesSquare },
    { id: 'submissions', label: 'Submissions', icon: ListChecks },
    { id: 'solution', label: 'Solution', icon: solutionUnlocked ? Trophy : Lock, hidden: false },
  ];

  if (loading) {
    return <div className="min-h-screen bg-bg flex items-center justify-center"><div className="w-7 h-7 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="bg-surface border-b border-line px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <Link href="/problems" className="text-muted hover:text-fg"><ChevronLeft size={18} /></Link>
          <h1 className="text-sm font-bold">{problem?.problemId ?? 'Problem'}</h1>
          {problem && <span className="text-[10px] font-mono text-muted border border-line-strong rounded-full px-2 py-0.5">{problem.puzzleType} · {problem.difficulty}</span>}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-5 grid lg:grid-cols-2 gap-5">
        {/* Left — tabbed panel */}
        <div className="bg-surface border border-line rounded-2xl overflow-hidden">
          <div className="flex border-b border-line">
            {TABS.filter(t => !(t.id === 'solution' && !solutionUnlocked)).map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-all ${
                  tab === t.id ? 'border-accent text-fg' : 'border-transparent text-muted hover:text-fg'
                }`}>
                <t.icon size={13} /> {t.label}
              </button>
            ))}
            {!solutionUnlocked && (
              <span className="flex items-center gap-1.5 px-4 py-2.5 text-xs text-muted/60 border-b-2 border-transparent cursor-not-allowed" title="Unlocks after the daily problem archives">
                <Lock size={13} /> Solution
              </span>
            )}
          </div>

          <div className="p-5 min-h-[260px] text-sm">
            {!problem ? (
              <div className="text-center py-12 text-muted">
                <FileText size={28} className="mx-auto mb-3 opacity-30" />
                <p>No problem loaded.</p>
                <p className="text-xs mt-1">Problems are published on a schedule — check back soon.</p>
              </div>
            ) : tab === 'description' ? (
              <div className="space-y-3">
                <p className="text-muted">Solve the scramble within the step limit. Fewer moves and fewer hints score higher.</p>
                <div className="flex gap-4 text-xs">
                  <span className="text-muted">Step limit: <span className="text-fg font-mono">{problem.stepLimit}</span></span>
                  <span className="text-muted">Base points: <span className="text-fg font-mono">{problem.basePoints}</span></span>
                </div>
                <div className="font-mono text-xs bg-bg border border-line rounded-lg p-3 break-words">{problem.scramble}</div>
              </div>
            ) : tab === 'discussion' ? (
              <div className="text-center py-12 text-muted"><MessagesSquare size={28} className="mx-auto mb-3 opacity-30" /><p>No discussion yet.</p></div>
            ) : tab === 'submissions' ? (
              <div className="text-center py-12 text-muted"><ListChecks size={28} className="mx-auto mb-3 opacity-30" /><p>Your attempts will appear here.</p></div>
            ) : ( // solution (only reachable when unlocked)
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-1">Optimal</p>
                  <p className="font-mono text-xs">{problem.solutions?.optimal?.moves ?? '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-1">Step-by-step</p>
                  {(problem.solutions?.algorithmic?.steps ?? []).map((s: any, i: number) => (
                    <p key={i} className="font-mono text-xs"><span className="text-muted mr-2">{s.label}</span>{s.moves}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right — workspace */}
        <div className="space-y-4">
          <div className="bg-surface border border-line rounded-2xl p-4 flex flex-col items-center gap-3">
            <CubePlayer
              scramble={problem?.scramble ?? ''}
              puzzle={PUZZLE_UI[problem?.puzzleType] ?? '3x3x3'}
              size={260}
              onMove={(_m, c) => setMoveCount(c)}
              onSolved={() => setSolved(true)}
            />
            <div className="flex items-center gap-4 text-xs">
              <span className="text-muted">Moves: <span className="font-mono text-fg">{moveCount}</span></span>
              {solved && <span className="text-emerald-400 font-bold">Solved!</span>}
            </div>
          </div>

          {/* Hints + penalty */}
          <div className="bg-surface border border-line rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-sm font-semibold"><Lightbulb size={15} className="text-amber-400" /> Hints</span>
              <span className="text-xs text-muted">Penalty: <span className={penalty > 0 ? 'text-amber-400 font-bold' : 'text-muted'}>{penalty}%</span></span>
            </div>
            <p className="text-[11px] text-muted mb-3">Hint 1 is free; each further hint costs 5% (max 50%). {problem ? `${hintsUsed}/${totalHints} used.` : ''}</p>
            {hintsUsed > 0 && problem && (
              <div className="space-y-1.5 mb-3">
                {(problem.hints ?? []).slice(0, hintsUsed).map((h: any, i: number) => (
                  <p key={i} className="font-mono text-xs text-fg bg-bg border border-line rounded-lg px-3 py-1.5">{h.body}</p>
                ))}
              </div>
            )}
            <button onClick={useHint} disabled={locked || !problem}
              className="w-full py-2 rounded-xl text-sm font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              {locked ? 'No more hints' : 'Use a hint'}
            </button>
          </div>

          <button disabled={!problem}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent text-black font-bold text-sm hover:bg-accent-hover disabled:opacity-50 transition-all">
            <Send size={15} /> Submit {problem && `· potential ${finalScore(problem.basePoints, penalty)} pts`}
          </button>
        </div>
      </div>
    </div>
  );
}
