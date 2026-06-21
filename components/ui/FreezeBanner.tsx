'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

/** Sitewide banner announcing the migration freeze date (admin-configurable). */
export default function FreezeBanner() {
  const [date, setDate] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    fetch('/api/site-config')
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        const fd = d?.freezeDate;
        if (!fd) return;
        setDate(fd);
        setDismissed(localStorage.getItem('cl_freeze_dismissed') === fd);
      })
      .catch(() => {});
  }, []);

  if (!date || dismissed) return null;

  const pretty = (() => {
    const dt = new Date(date);
    return isNaN(dt.getTime()) ? date : dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  })();

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center gap-3 text-amber-400">
        <AlertTriangle size={15} className="flex-shrink-0" />
        <p className="text-xs flex-1">
          After <span className="font-semibold">{pretty}</span>, results are recorded only on this new platform. Claim your account and switch over before then.
        </p>
        <button
          onClick={() => { localStorage.setItem('cl_freeze_dismissed', date); setDismissed(true); }}
          aria-label="Dismiss"
          className="p-1 rounded hover:bg-amber-500/20 transition-colors flex-shrink-0"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
