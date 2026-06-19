'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { X, Mail, Chrome, Shield } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [devEmail, setDevEmail] = useState('');
  const [showDevBypass, setShowDevBypass] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading('google');
    await signIn('google', { callbackUrl: '/timer' });
    setLoading(null);
  };

  const handleDevBypass = async () => {
    if (!devEmail) return;
    setLoading('dev');
    await signIn('dev-bypass', {
      email: devEmail,
      callbackUrl: '/timer',
      redirect: true,
    });
    setLoading(null);
  };

  const isDevMode = process.env.NEXT_PUBLIC_DEV_BYPASS === 'true';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm mx-4 bg-[#0d1117] border border-[#30363d] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#21262d]">
          <div>
            <h2 className="text-lg font-bold text-white">Sign in to Cubelelo</h2>
            <p className="text-xs text-[#8b949e] mt-0.5">
              Track solves, compete, and earn rankings
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#21262d] text-[#8b949e] hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-3">
          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading !== null}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white hover:bg-gray-100 text-gray-900 font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading === 'google' ? (
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Chrome size={18} className="text-[#4285F4]" />
            )}
            Continue with Google
          </button>

          {/* Dev Bypass (only in dev mode) */}
          {(isDevMode || process.env.NODE_ENV === 'development') && (
            <>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-[#21262d]" />
                <span className="text-xs text-[#8b949e]">or</span>
                <div className="flex-1 h-px bg-[#21262d]" />
              </div>

              <button
                onClick={() => setShowDevBypass(!showDevBypass)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#161b22] hover:bg-[#21262d] border border-dashed border-[#30363d] text-[#8b949e] hover:text-[#00dbe7] text-xs font-mono transition-all"
              >
                <Shield size={13} />
                Dev Bypass Login
              </button>

              {showDevBypass && (
                <div className="space-y-2">
                  <input
                    type="email"
                    value={devEmail}
                    onChange={(e) => setDevEmail(e.target.value)}
                    placeholder="dev@example.com"
                    className="w-full px-3 py-2 rounded-xl bg-[#161b22] border border-[#30363d] text-white text-sm placeholder-[#8b949e] focus:outline-none focus:border-[#00dbe7] transition-colors font-mono"
                  />
                  <button
                    onClick={handleDevBypass}
                    disabled={!devEmail || loading !== null}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#00dbe7]/10 border border-[#00dbe7]/30 text-[#00dbe7] text-xs font-mono font-semibold hover:bg-[#00dbe7]/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {loading === 'dev' ? (
                      <div className="w-3 h-3 border border-[#00dbe7] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Mail size={13} />
                    )}
                    Bypass with this email
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-6 pb-5">
          <p className="text-xs text-[#8b949e] text-center">
            By signing in you agree to our terms and privacy policy.
          </p>
        </div>
      </div>
    </div>
  );
}
