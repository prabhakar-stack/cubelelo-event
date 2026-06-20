'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { ChevronLeft, Search, Key, CheckCircle, Loader2, AlertCircle, User } from 'lucide-react';

type Step = 'lookup' | 'verify' | 'done';

export default function MigratePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('lookup');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [claimToken, setClaimToken] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/migrate-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'lookup', identifier: identifier.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setClaimToken(data.claimToken);
      setMaskedEmail(data.maskedEmail);
      setUserId(data.userId);
      setStep('verify');
    } catch { setError('Something went wrong'); }
    finally { setLoading(false); }
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/migrate-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'activate', claimToken, otp, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setStep('done');
      // Auto sign-in
      await signIn('credentials', { email: data.email, password, redirect: false });
      setTimeout(() => router.push('/profile/me'), 1500);
    } catch { setError('Something went wrong'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/login" className="inline-flex items-center gap-1 text-[#8b949e] hover:text-white text-xs mb-8 transition-colors">
          <ChevronLeft size={14} /> Back to login
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-mono mb-4">
            <User size={12} /> Existing Member
          </div>
          <h1 className="text-2xl font-black text-white mb-1">Claim your account</h1>
          <p className="text-sm text-[#8b949e]">
            Already competed on Cubelelo? Activate your account to keep your full history.
          </p>
        </div>

        {/* Step 1: Lookup */}
        {step === 'lookup' && (
          <form onSubmit={handleLookup} className="space-y-4">
            <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl p-5 mb-6 text-sm text-[#8b949e] space-y-2">
              <p className="font-medium text-white text-xs">How this works:</p>
              <p>1. Enter your CL ID (e.g. 22CLNAG001) or old email address</p>
              <p>2. We'll send a 6-digit OTP to your registered email</p>
              <p>3. Verify and set a new password — your history is restored</p>
            </div>
            <div>
              <label className="block text-xs text-[#8b949e] mb-1.5">CL ID or Email address</label>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b949e]" />
                <input type="text" value={identifier} onChange={e => setIdentifier(e.target.value)}
                  placeholder="22CLNAG001 or your@email.com" required
                  className="w-full pl-9 pr-4 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-xl text-sm text-white placeholder-[#8b949e] focus:outline-none focus:border-[#00dbe7] transition-colors" />
              </div>
            </div>
            {error && <div className="flex items-center gap-2 text-xs text-red-400"><AlertCircle size={13} />{error}</div>}
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-[#00dbe7] hover:bg-[#00c4d0] disabled:opacity-50 text-black font-bold text-sm transition-all flex items-center justify-center gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              Find My Account
            </button>
          </form>
        )}

        {/* Step 2: OTP + password */}
        {step === 'verify' && (
          <form onSubmit={handleActivate} className="space-y-4">
            <div className="bg-[#0d1117] border border-amber-400/20 rounded-2xl p-4 mb-2">
              <p className="text-xs text-[#8b949e]">OTP sent to <span className="text-white font-mono">{maskedEmail}</span></p>
              {userId && <p className="text-[10px] text-[#8b949e] mt-1">CL ID: <span className="text-amber-400 font-mono">{userId}</span></p>}
            </div>
            <div>
              <label className="block text-xs text-[#8b949e] mb-1.5">6-digit OTP</label>
              <input type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456" required maxLength={6} pattern="[0-9]{6}"
                className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-xl text-sm text-white placeholder-[#8b949e] focus:outline-none focus:border-[#00dbe7] transition-colors font-mono tracking-widest text-center text-lg" />
            </div>
            {['New password', 'Confirm password'].map((label, i) => (
              <div key={label}>
                <label className="block text-xs text-[#8b949e] mb-1.5">{label}</label>
                <input type="password" required minLength={6} placeholder="••••••••"
                  value={i === 0 ? password : confirm}
                  onChange={e => i === 0 ? setPassword(e.target.value) : setConfirm(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-xl text-sm text-white placeholder-[#8b949e] focus:outline-none focus:border-[#00dbe7] transition-colors" />
              </div>
            ))}
            {error && <div className="flex items-center gap-2 text-xs text-red-400"><AlertCircle size={13} />{error}</div>}
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-[#00dbe7] hover:bg-[#00c4d0] disabled:opacity-50 text-black font-bold text-sm transition-all flex items-center justify-center gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Key size={16} />}
              Activate Account
            </button>
            <button type="button" onClick={() => { setStep('lookup'); setError(''); }}
              className="w-full py-2 text-xs text-[#8b949e] hover:text-white transition-colors">
              ← Try a different ID
            </button>
          </form>
        )}

        {/* Done */}
        {step === 'done' && (
          <div className="text-center">
            <CheckCircle size={52} className="text-emerald-400 mx-auto mb-4" />
            <h2 className="text-xl font-black text-white mb-2">Account activated!</h2>
            <p className="text-sm text-[#8b949e] mb-2">Your full competition history is restored.</p>
            <p className="text-xs text-[#8b949e]">Redirecting to your profile…</p>
          </div>
        )}

        <p className="mt-8 text-center text-xs text-[#8b949e]">
          New to Cubelelo?{' '}
          <Link href="/signup" className="text-[#00dbe7] hover:underline">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
