'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

function VerifyInner() {
  const params = useSearchParams();
  const token = params.get('token');
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!token) { setState('error'); setMsg('Missing verification token.'); return; }
    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async r => {
        const d = await r.json();
        if (r.ok) { setState('ok'); }
        else { setState('error'); setMsg(d.error ?? 'Verification failed'); }
      })
      .catch(() => { setState('error'); setMsg('Network error'); });
  }, [token]);

  return (
    <div className="min-h-screen bg-bg text-fg flex items-center justify-center px-4">
      <div className="bg-surface border border-line rounded-2xl p-8 max-w-sm w-full text-center">
        {state === 'loading' && (
          <>
            <Loader2 size={28} className="text-accent animate-spin mx-auto mb-3" />
            <p className="text-sm text-muted">Verifying your email…</p>
          </>
        )}
        {state === 'ok' && (
          <>
            <CheckCircle2 size={36} className="text-emerald-400 mx-auto mb-3" />
            <h1 className="text-lg font-bold text-fg mb-1">Email verified</h1>
            <p className="text-sm text-muted mb-5">You can now register for paid competitions.</p>
            <Link href="/competitions" className="inline-block px-4 py-2 rounded-xl bg-accent text-black text-sm font-bold hover:bg-accent-hover transition-all">Browse competitions</Link>
          </>
        )}
        {state === 'error' && (
          <>
            <AlertCircle size={36} className="text-red-400 mx-auto mb-3" />
            <h1 className="text-lg font-bold text-fg mb-1">Verification failed</h1>
            <p className="text-sm text-muted mb-5">{msg}</p>
            <Link href="/profile/me/settings" className="inline-block px-4 py-2 rounded-xl border border-line-strong text-sm text-muted hover:text-fg transition-all">Go to settings</Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyInner />
    </Suspense>
  );
}
