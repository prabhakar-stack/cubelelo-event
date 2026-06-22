'use client';

import Link from 'next/link';
import { CalendarDays, ArrowLeft } from 'lucide-react';

export default function DailyProblemPage() {
  return (
    <div className="min-h-screen bg-bg text-fg flex items-center justify-center px-4">
      <div className="bg-surface border border-line rounded-2xl p-8 max-w-sm w-full text-center">
        <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mx-auto mb-4">
          <CalendarDays size={22} className="text-orange-400" />
        </div>
        <h1 className="text-lg font-bold mb-1">No active daily problem</h1>
        <p className="text-sm text-muted mb-6">Today's challenge hasn't been published yet. The Solution tab unlocks once a daily problem archives.</p>
        <Link href="/problems" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-line-strong text-sm text-muted hover:text-fg transition-all">
          <ArrowLeft size={15} /> All problems
        </Link>
      </div>
    </div>
  );
}
