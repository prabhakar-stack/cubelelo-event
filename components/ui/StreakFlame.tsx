'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Flame } from 'lucide-react';

/** Nav chip showing the user's daily-challenge streak. Hidden when zero / signed out. */
export default function StreakFlame() {
  const { status } = useSession();
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (status !== 'authenticated') return;
    let cancelled = false;
    fetch('/api/daily-challenge')
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (!cancelled && typeof d?.streak === 'number') setStreak(d.streak); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [status]);

  if (streak <= 0) return null;
  return (
    <Link
      href="/practice"
      title={`${streak}-day daily streak`}
      className="flex items-center gap-1 text-orange-400 hover:text-orange-300 text-sm font-medium transition-colors"
    >
      <Flame size={15} />{streak}
    </Link>
  );
}
