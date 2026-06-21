'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

function fmt(diff: number): string {
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/** Live-updating relative countdown to a target time. */
export default function Countdown({
  to, prefix = 'in', icon = true, ended = 'now', className = '',
}: { to: string | number | Date; prefix?: string; icon?: boolean; ended?: string; className?: string }) {
  const target = new Date(to).getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (isNaN(target)) return null;
  const diff = target - now;
  const label = diff <= 0 ? ended : `${prefix} ${fmt(diff)}`;
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      {icon && <Clock size={11} />}{label}
    </span>
  );
}
