'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Boxes, Wand2, CalendarDays, Lightbulb, CheckCircle2, Circle } from 'lucide-react';

interface ProblemRow {
  problemId: string;
  puzzleType: string;
  difficulty: string;
  mode: string;
  stepLimit: number;
}

const DIFF_COLOR: Record<string, string> = {
  easy: 'text-emerald-400', medium: 'text-amber-400', hard: 'text-orange-400', expert: 'text-red-400',
};

export default function ProblemsHub() {
  const [problems, setProblems] = useState<ProblemRow[]>([]);
  const [fact, setFact] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/problems').then(r => r.ok ? r.json() : { problems: [] }).then(d => setProblems(d.problems ?? [])).catch(() => {}).finally(() => setLoading(false));
    fetch('/api/funfacts/today').then(r => r.ok ? r.json() : null).then(d => setFact(d?.fact ?? null)).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="bg-surface border-b border-line px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-2">
          <Boxes size={18} className="text-accent" />
          <h1 className="text-xl font-black">Problems</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Tiles */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Link href="/problems/daily" className="bg-surface border border-line rounded-2xl p-4 hover:border-line-strong transition-all">
            <CalendarDays size={18} className="text-orange-400 mb-2" />
            <p className="font-bold text-sm">Daily Problem</p>
            <p className="text-xs text-muted mt-0.5">One scramble, one step-limit, daily.</p>
          </Link>
          <Link href="/solver" className="bg-surface border border-line rounded-2xl p-4 hover:border-line-strong transition-all">
            <Wand2 size={18} className="text-accent mb-2" />
            <p className="font-bold text-sm">Solver</p>
            <p className="text-xs text-muted mt-0.5">Optimal + step-by-step solutions.</p>
          </Link>
          <Link href="/builder" className="bg-surface border border-line rounded-2xl p-4 hover:border-line-strong transition-all">
            <Boxes size={18} className="text-lime mb-2" />
            <p className="font-bold text-sm">Builder</p>
            <p className="text-xs text-muted mt-0.5">NxN cube sandbox.</p>
          </Link>
        </div>

        {/* Daily Cube Fun-Fact */}
        <div className="bg-surface border border-line rounded-2xl p-4 flex items-start gap-3">
          <Lightbulb size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-1">Daily Cube Fun-Fact</p>
            <p className="text-sm text-fg">{fact ?? 'Fun-facts will appear here once the dataset is loaded.'}</p>
          </div>
        </div>

        {/* Problem set */}
        <div className="bg-surface border border-line rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-line"><p className="text-sm font-semibold">Problem Set</p></div>
          {loading ? (
            <p className="px-5 py-10 text-center text-sm text-muted">Loading…</p>
          ) : problems.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <Boxes size={32} className="mx-auto mb-3 text-muted opacity-30" />
              <p className="text-sm text-muted">No problems yet.</p>
              <p className="text-xs text-muted mt-1">Problems will appear here once they're published.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-muted text-xs uppercase tracking-wider">
                  <th className="px-5 py-2.5 text-left w-10">#</th>
                  <th className="px-3 py-2.5 text-left">Problem</th>
                  <th className="px-3 py-2.5 text-left">Puzzle</th>
                  <th className="px-3 py-2.5 text-left">Difficulty</th>
                  <th className="px-3 py-2.5 text-center w-16">Status</th>
                </tr>
              </thead>
              <tbody>
                {problems.map((p, i) => (
                  <tr key={p.problemId} className="border-b border-line last:border-0 hover:bg-elevated transition-colors">
                    <td className="px-5 py-3 text-muted font-mono">{i + 1}</td>
                    <td className="px-3 py-3"><Link href={`/problems/${p.problemId}`} className="text-fg hover:text-accent font-medium">{p.problemId}</Link></td>
                    <td className="px-3 py-3 font-mono text-muted">{p.puzzleType}</td>
                    <td className={`px-3 py-3 font-medium capitalize ${DIFF_COLOR[p.difficulty] ?? 'text-muted'}`}>{p.difficulty}</td>
                    <td className="px-3 py-3 text-center"><Circle size={13} className="text-muted inline" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
