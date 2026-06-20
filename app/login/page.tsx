'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Chrome, Zap, AlertCircle } from 'lucide-react';

const SANDBOX_ACCOUNTS = [
  {
    label: 'Admin',
    email: 'prabhakar@cubelelo.com',
    description: 'Full access · Admin Panel',
    color: 'text-amber-400 border-amber-400/40 hover:bg-amber-400/10',
    dot: 'bg-amber-400',
  },
  {
    label: 'Athlete',
    email: 'athlete@cubelelo.com',
    description: 'Regular user',
    color: 'text-[#00dbe7] border-[#00dbe7]/40 hover:bg-[#00dbe7]/10',
    dot: 'bg-[#00dbe7]',
  },
] as const;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/';
  const errorParam = searchParams.get('error');

  const [loading, setLoading] = useState<string | null>(null);
  const [sandboxOpen, setSandboxOpen] = useState(false);
  const [error, setError] = useState(
    errorParam === 'OAuthAccountNotLinked'
      ? 'This email is already linked to a different sign-in method.'
      : errorParam
        ? 'Something went wrong. Please try again.'
        : ''
  );

  const isDevMode = process.env.NEXT_PUBLIC_DEV_BYPASS === 'true';

  const handleGoogle = async () => {
    setLoading('google');
    await signIn('google', { callbackUrl });
  };

  const handleSandbox = async (email: string) => {
    setError('');
    setLoading(email);
    const res = await signIn('dev-bypass', { email, callbackUrl, redirect: false });
    setLoading(null);
    if (res?.error) {
      setError('Sandbox login failed — ensure NEXTAUTH_DEV_BYPASS=true in .env');
    } else {
      router.push(callbackUrl);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0e11] flex">

      {/* ── Left: Branding ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-14 bg-[#0d1117] border-r border-[#21262d]">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00dbe7] to-[#a3fa00] flex items-center justify-center shadow-lg shadow-[#00dbe7]/20">
            <span className="text-black font-black text-xs">CB</span>
          </div>
          <span className="font-bold text-white text-lg">Cube<span className="text-[#00dbe7]">lelo</span></span>
        </Link>

        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#8b949e] mb-5">Elite Speedcubing Platform</p>
          <h2 className="text-5xl font-black text-white leading-tight mb-5">
            Compete.<br />
            Practice.<br />
            <span className="text-[#00dbe7]">Improve.</span>
          </h2>
          <p className="text-[#8b949e] leading-relaxed max-w-sm">
            WCA-compliant competitions, precision timer, and live leaderboards — built for India's speedcubing community.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { num: '10K+', label: 'Registered Cubers' },
            { num: '500+', label: 'Competitions' },
            { num: '2M+', label: 'Solves Tracked' },
          ].map(({ num, label }) => (
            <div key={label} className="text-center p-4 rounded-xl bg-[#161b22] border border-[#21262d]">
              <p className="font-black text-white text-xl">{num}</p>
              <p className="text-[10px] text-[#8b949e] font-mono mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: Sign in ── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00dbe7] to-[#a3fa00] flex items-center justify-center">
              <span className="text-black font-black text-xs">CB</span>
            </div>
            <span className="font-bold text-white">Cube<span className="text-[#00dbe7]">lelo</span></span>
          </Link>

          <h1 className="text-3xl font-black text-white mb-1">Welcome back</h1>
          <p className="text-[#8b949e] text-sm mb-8">
            New to Cubelelo?{' '}
            <Link href="/signup" className="text-[#00dbe7] hover:underline font-medium">
              Create an account
            </Link>
          </p>

          {error && (
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm mb-6">
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <button
            onClick={handleGoogle}
            disabled={loading !== null}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-white hover:bg-gray-50 text-gray-900 font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
          >
            {loading === 'google' ? (
              <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Chrome size={18} className="text-[#4285F4]" />
            )}
            Continue with Google
          </button>


          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-[#21262d]" />
            <span className="text-[10px] text-[#8b949e] font-mono">OR</span>
            <div className="flex-1 h-px bg-[#21262d]" />
          </div>

          {/* Email / Password */}
          <form onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            setLoading('credentials');
            const res = await signIn('credentials', {
              email: fd.get('email') as string,
              password: fd.get('password') as string,
              callbackUrl,
              redirect: false,
            });
            setLoading(null);
            if (res?.error) setError('Invalid email or password');
            else if (res?.url) router.push(res.url);
          }} className="space-y-3">
            <div>
              <label className="block text-xs text-[#8b949e] mb-1.5">Email</label>
              <input name="email" type="email" required placeholder="you@example.com"
                className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-xl text-sm text-white placeholder-[#8b949e] focus:outline-none focus:border-[#00dbe7] transition-colors" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-[#8b949e]">Password</label>
                <Link href="/forgot-password" className="text-xs text-[#00dbe7] hover:underline">Forgot password?</Link>
              </div>
              <input name="password" type="password" required placeholder="••••••••"
                className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-xl text-sm text-white placeholder-[#8b949e] focus:outline-none focus:border-[#00dbe7] transition-colors" />
            </div>
            <button type="submit" disabled={loading !== null}
              className="w-full py-3 rounded-xl bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-white font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {loading === 'credentials' ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
              Sign in with Email
            </button>
          </form>

          {/* Sandbox — dev only */}
          {isDevMode && (
            <div className="mt-6 rounded-xl border border-dashed border-[#30363d] overflow-hidden">
              <button
                onClick={() => setSandboxOpen(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 text-xs font-mono text-[#8b949e] hover:text-white hover:bg-[#161b22] transition-all"
              >
                <span className="flex items-center gap-2">
                  <Zap size={12} />
                  Sandbox — one-click login
                </span>
                <span>{sandboxOpen ? '▲' : '▼'}</span>
              </button>

              {sandboxOpen && (
                <div className="px-3 pb-3 space-y-2 border-t border-dashed border-[#30363d]">
                  <p className="text-[10px] font-mono text-[#8b949e] pt-2.5 pb-1 text-center">
                    no password · dev mode only
                  </p>
                  {SANDBOX_ACCOUNTS.map(({ label, email, description, color, dot }) => (
                    <button
                      key={email}
                      onClick={() => handleSandbox(email)}
                      disabled={loading !== null}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all disabled:opacity-50 ${color}`}
                    >
                      {loading === email ? (
                        <span className="w-2 h-2 border border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
                      ) : (
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
                      )}
                      <div className="text-left flex-1">
                        <div className="font-bold">{label}</div>
                        <div className="text-[10px] font-mono opacity-60">{description}</div>
                      </div>
                      <span className="text-[10px] font-mono opacity-40 hidden sm:block truncate max-w-[130px]">
                        {email}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-[#8b949e] text-center mt-8 leading-relaxed">
            By signing in you agree to our{' '}
            <Link href="/terms" className="hover:text-white underline transition-colors">Terms</Link>
            {' '}and{' '}
            <Link href="/privacy" className="hover:text-white underline transition-colors">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
