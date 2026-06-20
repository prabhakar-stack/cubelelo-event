'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Chrome, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleGoogle = async () => {
    setGoogleLoading(true);
    await signIn('google', { callbackUrl: '/' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      const r = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password, firstName: form.firstName, lastName: form.lastName }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error ?? 'Registration failed'); return; }
      // Auto sign in
      const result = await signIn('credentials', { email: form.email, password: form.password, redirect: false });
      if (result?.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/'), 1200);
      } else {
        // Signed up but auto-login failed — go to login
        router.push('/login?registered=1');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex">

      {/* Left branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-14 bg-surface border-r border-line">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-lime flex items-center justify-center shadow-lg shadow-accent/20">
            <span className="text-black font-black text-xs">CB</span>
          </div>
          <span className="font-bold text-fg text-lg">Cube<span className="text-accent">lelo</span></span>
        </Link>

        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-5">Join the Community</p>
          <h2 className="text-5xl font-black text-fg leading-tight mb-5">
            Your cubing<br />journey<br />
            <span className="text-lime">starts here.</span>
          </h2>
          <p className="text-muted leading-relaxed max-w-sm">
            Get your unique Cubelelo ID, compete in live WCA-style events, and track every solve on your journey to the top.
          </p>
        </div>

        <div className="space-y-3">
          {[
            { emoji: '🏆', title: 'Live competitions', desc: 'Simultaneous scrambles, real-time leaderboards' },
            { emoji: '⏱️', title: 'Precision timer', desc: 'Web Worker accuracy, ao5 / ao12, PB tracking' },
            { emoji: '📈', title: 'Full history', desc: 'Every solve, every session, every PB' },
          ].map(({ emoji, title, desc }) => (
            <div key={title} className="flex items-center gap-3 p-3.5 rounded-xl bg-elevated border border-line">
              <span className="text-2xl">{emoji}</span>
              <div>
                <p className="text-sm font-semibold text-fg">{title}</p>
                <p className="text-xs text-muted">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">

          <Link href="/" className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-lime flex items-center justify-center">
              <span className="text-black font-black text-xs">CB</span>
            </div>
            <span className="font-bold text-fg">Cube<span className="text-accent">lelo</span></span>
          </Link>

          <h1 className="text-3xl font-black text-fg mb-1">Create your account</h1>
          <p className="text-muted text-sm mb-8">
            Already have one?{' '}
            <Link href="/login" className="text-accent hover:underline font-medium">Sign in</Link>
            {' · '}
            <Link href="/register/migrate" className="text-muted hover:text-fg transition-colors">Claim existing account</Link>
          </p>

          {success ? (
            <div className="flex flex-col items-center gap-3 py-10">
              <CheckCircle2 size={40} className="text-emerald-400" />
              <p className="text-fg font-semibold">Account created!</p>
              <p className="text-muted text-sm">Signing you in…</p>
            </div>
          ) : (
            <>
              {/* Google */}
              <button onClick={handleGoogle} disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-white hover:bg-gray-50 text-gray-900 font-semibold text-sm transition-all disabled:opacity-60 shadow-sm mb-5">
                {googleLoading
                  ? <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  : <Chrome size={18} className="text-[#4285F4]" />}
                Sign up with Google
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-line" />
                <span className="text-[10px] text-muted font-mono uppercase">or</span>
                <div className="flex-1 h-px bg-line" />
              </div>

              {/* Email form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted mb-1">First name</label>
                    <input type="text" value={form.firstName} onChange={set('firstName')} required
                      className="w-full px-3 py-2.5 rounded-xl bg-elevated border border-line-strong text-sm text-fg placeholder-muted focus:outline-none focus:border-accent transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">Last name</label>
                    <input type="text" value={form.lastName} onChange={set('lastName')}
                      className="w-full px-3 py-2.5 rounded-xl bg-elevated border border-line-strong text-sm text-fg placeholder-muted focus:outline-none focus:border-accent transition-colors" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-muted mb-1">Email</label>
                  <input type="email" value={form.email} onChange={set('email')} required autoComplete="email"
                    className="w-full px-3 py-2.5 rounded-xl bg-elevated border border-line-strong text-sm text-fg placeholder-muted focus:outline-none focus:border-accent transition-colors" />
                </div>

                <div>
                  <label className="block text-xs text-muted mb-1">Password</label>
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')}
                      required minLength={8} autoComplete="new-password"
                      placeholder="Min 8 characters"
                      className="w-full px-3 py-2.5 pr-10 rounded-xl bg-elevated border border-line-strong text-sm text-fg placeholder-muted focus:outline-none focus:border-accent transition-colors" />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-fg transition-colors">
                      {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-muted mb-1">Confirm password</label>
                  <input type="password" value={form.confirm} onChange={set('confirm')} required
                    autoComplete="new-password"
                    className="w-full px-3 py-2.5 rounded-xl bg-elevated border border-line-strong text-sm text-fg placeholder-muted focus:outline-none focus:border-accent transition-colors" />
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    <AlertCircle size={13} />
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl bg-accent text-black font-bold text-sm hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-1">
                  {loading ? 'Creating account…' : 'Create Account'}
                </button>
              </form>

              <p className="text-xs text-muted text-center mt-6 leading-relaxed">
                By signing up you agree to our{' '}
                <Link href="/terms" className="hover:text-fg underline transition-colors">Terms</Link>
                {' '}and{' '}
                <Link href="/privacy" className="hover:text-fg underline transition-colors">Privacy Policy</Link>.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
