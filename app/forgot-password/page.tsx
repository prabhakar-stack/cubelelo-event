'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ChevronLeft, CheckCircle, Loader2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link href="/login" className="inline-flex items-center gap-1 text-[#8b949e] hover:text-white text-xs mb-8 transition-colors">
          <ChevronLeft size={14} /> Back to login
        </Link>

        {sent ? (
          <div className="text-center">
            <CheckCircle size={48} className="text-emerald-400 mx-auto mb-4" />
            <h1 className="text-xl font-black text-white mb-2">Check your email</h1>
            <p className="text-sm text-[#8b949e]">
              If an account exists for <span className="text-white">{email}</span>, we sent a reset link. Check your spam folder too.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-black text-white mb-1">Forgot password?</h1>
              <p className="text-sm text-[#8b949e]">We'll send a reset link to your email.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-[#8b949e] mb-1.5">Email address</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b949e]" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com" required
                    className="w-full pl-9 pr-4 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-xl text-sm text-white placeholder-[#8b949e] focus:outline-none focus:border-[#00dbe7] transition-colors" />
                </div>
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl bg-[#00dbe7] hover:bg-[#00c4d0] disabled:opacity-50 text-black font-bold text-sm transition-all flex items-center justify-center gap-2">
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                Send Reset Link
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
