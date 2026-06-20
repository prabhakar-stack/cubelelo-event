'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Chrome } from 'lucide-react';

export default function SignupPage() {
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setLoading(true);
    await signIn('google', { callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen bg-bg flex">

      {/* ── Left: Branding ── */}
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
            Your cubing<br />
            journey<br />
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

      {/* ── Right: Sign up ── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-lime flex items-center justify-center">
              <span className="text-black font-black text-xs">CB</span>
            </div>
            <span className="font-bold text-fg">Cube<span className="text-accent">lelo</span></span>
          </Link>

          <h1 className="text-3xl font-black text-fg mb-1">Create your account</h1>
          <p className="text-muted text-sm mb-10">
            Already have an account?{' '}
            <Link href="/login" className="text-accent hover:underline font-medium">
              Sign in
            </Link>
          </p>

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-white hover:bg-gray-50 text-gray-900 font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Chrome size={18} className="text-[#4285F4]" />
            )}
            Sign up with Google
          </button>

          <p className="text-xs text-muted text-center mt-8 leading-relaxed">
            By creating an account you agree to our{' '}
            <Link href="/terms" className="hover:text-fg underline transition-colors">Terms</Link>
            {' '}and{' '}
            <Link href="/privacy" className="hover:text-fg underline transition-colors">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
