'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) setError('Missing reset token. Request a new link.');
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Failed'); return; }
      setDone(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch {
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  if (done) return (
    <div className="text-center">
      <CheckCircle size={48} className="text-emerald-400 mx-auto mb-4" />
      <h1 className="text-xl font-black text-white mb-2">Password updated!</h1>
      <p className="text-sm text-[#8b949e]">Redirecting to login…</p>
    </div>
  );

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white mb-1">Set new password</h1>
        <p className="text-sm text-[#8b949e]">Choose a strong password for your account.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {['New password', 'Confirm password'].map((label, i) => (
          <div key={label}>
            <label className="block text-xs text-[#8b949e] mb-1.5">{label}</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b949e]" />
              <input type="password"
                value={i === 0 ? password : confirm}
                onChange={e => i === 0 ? setPassword(e.target.value) : setConfirm(e.target.value)}
                placeholder="••••••••" required minLength={6}
                className="w-full pl-9 pr-4 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-xl text-sm text-white placeholder-[#8b949e] focus:outline-none focus:border-[#00dbe7] transition-colors" />
            </div>
          </div>
        ))}
        {error && (
          <div className="flex items-center gap-2 text-xs text-red-400">
            <AlertCircle size={13} /> {error}
          </div>
        )}
        <button type="submit" disabled={loading || !token}
          className="w-full py-3 rounded-xl bg-[#00dbe7] hover:bg-[#00c4d0] disabled:opacity-50 text-black font-bold text-sm transition-all flex items-center justify-center gap-2">
          {loading ? <Loader2 size={16} className="animate-spin" /> : null}
          Update Password
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Suspense fallback={<div className="text-[#8b949e] text-sm">Loading…</div>}>
          <ResetForm />
        </Suspense>
        <p className="mt-6 text-center text-xs text-[#8b949e]">
          Remember it?{' '}
          <Link href="/login" className="text-[#00dbe7] hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
