'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Flame, Play, CheckCircle2, Calendar } from 'lucide-react';

function fmt(ms?: number): string {
  if (ms == null) return '';
  const total = Math.floor(ms);
  const m = Math.floor(total / 60000);
  const s = Math.floor((total % 60000) / 1000);
  const mil = (total % 1000).toString().padStart(3, '0');
  return m > 0 ? `${m}:${s.toString().padStart(2, '0')}.${mil}` : `${s}.${mil}`;
}

/** Daily-challenge section for the Practice hub. */
export default function DailyChallengeSection() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/daily-challenge').then(r => (r.ok ? r.json() : null)).then(setData).catch(() => {});
  }, []);

  const ch = data?.challenge;
  const mine = data?.myEntry;
  const streak = data?.streak ?? 0;

  return (
    <div className="bg-surface border border-line rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-orange-400" />
          <h2 className="font-bold text-fg">Daily challenge</h2>
        </div>
        {streak > 0 && (
          <span className="inline-flex items-center gap-1 text-xs text-orange-400 font-medium">
            <Flame size={13} />{streak}-day streak
          </span>
        )}
      </div>
      <p className="text-xs text-muted mb-1">
        {ch ? `Today · ${ch.puzzleType} · same scramble for everyone, resets midnight IST` : 'Loading today’s scramble…'}
      </p>
      {ch && <p className="font-mono text-sm text-fg break-all mb-4">{ch.scramble}</p>}
      {mine ? (
        <div className="flex items-center gap-2 text-sm text-emerald-400">
          <CheckCircle2 size={16} /> Solved today
          {mine.timeInMs != null && mine.status !== 'DNF' && <span className="font-mono text-fg">· {fmt(mine.timeInMs)}</span>}
          <Link href="/daily-challenge" className="ml-auto text-xs text-muted hover:text-fg">View leaderboard →</Link>
        </div>
      ) : (
        <Link href="/daily-challenge" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-black text-sm font-bold hover:bg-accent-hover transition-all">
          <Play size={15} /> Start solve
        </Link>
      )}
    </div>
  );
}
