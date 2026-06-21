'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

/** Pulsing "Live" pill in the nav — only renders when a competition is currently live. */
export default function LiveBadge() {
  const [liveId, setLiveId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/competitions?status=LIVE&limit=1')
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        const c = d?.competitions?.[0];
        if (!cancelled && c) setLiveId(c._id ?? c.competitionId ?? null);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (!liveId) return null;
  return (
    <Link
      href={`/compete/${liveId}`}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all"
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
      </span>
      Live
    </Link>
  );
}
