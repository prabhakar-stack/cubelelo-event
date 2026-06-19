'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSession, signIn } from 'next-auth/react';
import { Timer, Trophy, Dumbbell, ChevronRight, Zap, Users, Star, TrendingUp } from 'lucide-react';
import AuthModal from '@/components/ui/AuthModal';

const FEATURES = [
  {
    icon: Timer,
    color: 'text-[#00dbe7]',
    bg: 'bg-[#00dbe7]/10 border-[#00dbe7]/20',
    title: 'Timer Terminal',
    description: 'Sub-millisecond Web Worker precision. WCA Stackmat logic. 2D/3D scramble visualizer.',
    href: '/timer',
    cta: 'Open Timer',
  },
  {
    icon: Trophy,
    color: 'text-amber-400',
    bg: 'bg-amber-400/10 border-amber-400/20',
    title: 'Competitions',
    description: 'WCA-style online events. Live leaderboards, Razorpay payments, and real-time round management.',
    href: '/compete',
    cta: 'Browse Events',
  },
  {
    icon: Dumbbell,
    color: 'text-[#a3fa00]',
    bg: 'bg-[#a3fa00]/10 border-[#a3fa00]/20',
    title: 'Practice Mode',
    description: 'Daily challenges, OLL/PLL drills, progress heatmaps, and historical analysis.',
    href: '/practice',
    cta: 'Start Practicing',
  },
];

const STATS = [
  { label: 'Active Athletes', value: '2,400+', icon: Users },
  { label: 'Competitions Hosted', value: '120+', icon: Trophy },
  { label: 'Solves Logged', value: '850K+', icon: Zap },
  { label: 'Platform Uptime', value: '99.9%', icon: Star },
];

export default function HomePage() {
  const { data: session } = useSession();
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0b0e11] text-white">
      {/* Hero */}
      <div className="relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#00dbe7]/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-20 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#161b22] border border-[#30363d] text-xs font-mono text-[#00dbe7] mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00dbe7] animate-pulse" />
            Phase 1 · Now Live
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4">
            The{' '}
            <span className="bg-gradient-to-r from-[#00dbe7] to-[#a3fa00] bg-clip-text text-transparent">
              Cubelelo
            </span>
            {' '}Platform
          </h1>

          <p className="text-lg text-[#8b949e] max-w-xl mx-auto mb-8 leading-relaxed">
            Compete in WCA-style online events, train with precision tools,
            and track your speedcubing journey — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {session ? (
              <Link
                href="/timer"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#00dbe7] hover:bg-[#00dbe7]/90 text-black font-bold text-sm transition-all shadow-lg shadow-[#00dbe7]/20"
              >
                Open Timer
                <ChevronRight size={16} />
              </Link>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#00dbe7] hover:bg-[#00dbe7]/90 text-black font-bold text-sm transition-all shadow-lg shadow-[#00dbe7]/20"
              >
                Get Started Free
                <ChevronRight size={16} />
              </button>
            )}
            <Link
              href="/compete"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-white font-medium text-sm transition-all"
            >
              Browse Competitions
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="border-y border-[#21262d] bg-[#0d1117]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {STATS.map(({ label, value, icon: Icon }) => (
            <div key={label} className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Icon size={14} className="text-[#00dbe7]" />
                <span className="text-2xl font-black text-white">{value}</span>
              </div>
              <p className="text-xs text-[#8b949e]">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Cards */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-white mb-2">Everything You Need</h2>
          <p className="text-sm text-[#8b949e]">Three modules. One platform.</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, color, bg, title, description, href, cta }) => (
            <div
              key={href}
              className="group relative bg-[#0d1117] border border-[#21262d] hover:border-[#30363d] rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/40"
            >
              <div className={`w-10 h-10 rounded-xl border ${bg} flex items-center justify-center mb-4`}>
                <Icon size={20} className={color} />
              </div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-xs text-[#8b949e] leading-relaxed mb-5">{description}</p>
              <Link
                href={href}
                className={`flex items-center gap-1.5 text-xs font-semibold ${color} hover:opacity-80 transition-opacity`}
              >
                {cta}
                <ChevronRight size={13} />
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Module status tracker */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-[#00dbe7]" />
            <h3 className="font-semibold text-white text-sm">Platform Build Status</h3>
            <span className="ml-auto text-xs text-[#8b949e] font-mono">Phase 1 · Foundation</span>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Module 1 · Timer Terminal', status: 'Foundation Built', color: 'text-[#00dbe7]', dot: 'bg-[#00dbe7]' },
              { label: 'Module 2 · Competitions', status: 'Foundation Built', color: 'text-[#00dbe7]', dot: 'bg-[#00dbe7]' },
              { label: 'Module 3 · Practice Mode', status: 'Foundation Built', color: 'text-[#00dbe7]', dot: 'bg-[#00dbe7]' },
              { label: 'Auth · Google OAuth', status: 'Configured (add credentials)', color: 'text-amber-400', dot: 'bg-amber-400' },
              { label: 'Database · Prisma + PostgreSQL', status: 'Schema ready (add DATABASE_URL)', color: 'text-amber-400', dot: 'bg-amber-400' },
              { label: 'Payments · Razorpay', status: 'Coming next', color: 'text-[#8b949e]', dot: 'bg-[#8b949e]' },
            ].map(({ label, status, color, dot }) => (
              <div key={label} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                  <span className="text-[#8b949e]">{label}</span>
                </div>
                <span className={`font-medium ${color}`}>{status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
