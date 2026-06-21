'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import StatusChip from '@/components/ui/StatusChip';
import Countdown from '@/components/ui/Countdown';
import PrizeBadge from '@/components/ui/PrizeBadge';

/** Compact upcoming/live competitions rail — surfaces contests inside the Practice hub. */
export default function UpcomingCompetitionsRail() {
  const [comps, setComps] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/competitions?status=LIVE&limit=2').then(r => (r.ok ? r.json() : { competitions: [] })),
      fetch('/api/competitions?status=REGISTRATION_OPEN&limit=4').then(r => (r.ok ? r.json() : { competitions: [] })),
    ])
      .then(([live, open]) => setComps([...(live.competitions ?? []), ...(open.competitions ?? [])].slice(0, 4)))
      .catch(() => {});
  }, []);

  return (
    <div className="bg-surface border border-line rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted">Upcoming competitions</p>
        <Link href="/competitions" className="text-[11px] text-accent hover:underline">View all</Link>
      </div>
      {comps.length === 0 ? (
        <p className="text-xs text-muted py-3 text-center">No open competitions right now.</p>
      ) : (
        <div className="space-y-2.5">
          {comps.map(c => (
            <Link key={c._id} href={`/competitions/${c._id}`} className="block border border-line rounded-xl p-3 hover:border-line-strong transition-all">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <span className="text-sm font-medium text-fg truncate">{c.name}</span>
                <StatusChip status={c.status} />
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {(c.events ?? []).slice(0, 4).map((e: string) => (
                  <span key={e} className="font-mono text-[10px] text-muted bg-elevated px-1.5 py-0.5 rounded">{e}</span>
                ))}
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted">
                <Countdown to={c.startDate} prefix="opens in" ended="live now" />
                <PrizeBadge paise={c.prizePool} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
