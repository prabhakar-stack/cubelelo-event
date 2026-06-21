import type { Metadata } from 'next';
import Link from 'next/link';
import { BarChart3, Trophy, Clock } from 'lucide-react';

export const metadata: Metadata = { title: 'Rankings — Cubelelo Events' };

const EVENTS = ['3x3x3', '2x2x2', '4x4x4', '5x5x5', 'OH', 'Pyraminx', 'Megaminx', 'Skewb', 'Square-1'];

export default function RankingsPage() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="bg-surface border-b border-line px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-2">
          <BarChart3 size={18} className="text-accent" />
          <h1 className="text-xl font-black text-fg">Rankings</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="bg-surface border border-line rounded-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/30 flex items-center justify-center mx-auto mb-4">
            <Trophy size={22} className="text-accent" />
          </div>
          <h2 className="text-lg font-bold text-fg mb-2">Global leaderboards are coming</h2>
          <p className="text-sm text-muted max-w-md mx-auto mb-6">
            Per-event single and average rankings across every Cubelelo cuber, powered by your competition and practice results. Ranked by CL ID, WCA-style.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {EVENTS.map(e => (
              <span key={e} className="font-mono text-xs text-muted bg-elevated border border-line-strong px-2.5 py-1 rounded-lg">{e}</span>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/competitions" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-black text-sm font-bold hover:bg-accent-hover transition-all">
              <Trophy size={15} /> Browse competitions
            </Link>
            <Link href="/practice" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-line-strong text-sm font-medium text-muted hover:text-fg transition-all">
              <Clock size={15} /> Practice now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
