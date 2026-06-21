'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Timer, Trophy, Dumbbell, ChevronRight, Zap, Users, Star, Calendar, ArrowRight } from 'lucide-react';

const FEATURES = [
  {
    icon: Timer,
    color: 'text-accent',
    bg: 'bg-accent/10 border-accent/20',
    title: 'Timer Terminal',
    description: 'Sub-millisecond Web Worker precision. WCA Stackmat logic. 2D scramble visualizer for all events.',
    href: '/timer',
    cta: 'Open Timer',
  },
  {
    icon: Trophy,
    color: 'text-amber-400',
    bg: 'bg-amber-400/10 border-amber-400/20',
    title: 'Competitions',
    description: 'WCA-style online events. Simultaneous scramble reveals, live leaderboards, Razorpay payments.',
    href: '/compete',
    cta: 'Browse Events',
  },
  {
    icon: Dumbbell,
    color: 'text-lime',
    bg: 'bg-lime/10 border-lime/20',
    title: 'Practice Mode',
    description: 'Daily challenges, session stats, ao5/ao12 tracking, and PB celebration.',
    href: '/practice',
    cta: 'Start Practicing',
  },
];

const STATS = [
  { label: 'Active Athletes', value: '10K+', icon: Users },
  { label: 'Competitions Hosted', value: '500+', icon: Trophy },
  { label: 'Solves Logged', value: '2M+', icon: Zap },
  { label: 'Platform Uptime', value: '99.9%', icon: Star },
];

interface CompSnippet {
  _id: string;
  name: string;
  events: string[];
  status: string;
}


interface CarouselItem {
  _id: string; image: string; link?: string; colour?: string;
  text?: string; mobileCarousel?: boolean;
}

function AnnouncementBanner() {
  const [text, setText] = React.useState('');
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('cl_announcement');
      if (stored) setText(stored);
    }
  }, []);
  if (!text) return null;
  return (
    <div className="bg-amber-400/10 border-b border-amber-400/20 px-4 py-2 text-center">
      <p className="text-xs text-amber-400 font-medium">{text}</p>
    </div>
  );
}

function CarouselHero() {
  const [slides, setSlides] = React.useState<CarouselItem[]>([]);
  const [idx, setIdx] = React.useState(0);
  React.useEffect(() => {
    fetch('/api/carousels')
      .then(r => r.json())
      .then(d => { if (d.carousels?.length) setSlides(d.carousels); })
      .catch(() => {});
  }, []);
  React.useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setIdx(i => (i + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides.length]);

  if (!slides.length) return null;
  const slide = slides[idx];
  return (
    <div className="relative w-full overflow-hidden" style={{ background: slide.colour ?? '#0d1117' }}>
      <a href={slide.link ?? '#'} className="block w-full">
        <img src={slide.image} alt={slide.text ?? ''} className="w-full object-cover max-h-[400px]" />
      </a>
      {slide.text && (
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <span className="px-4 py-2 bg-black/60 rounded-full text-fg text-sm font-semibold">{slide.text}</span>
        </div>
      )}
      {slides.length > 1 && (
        <div className="absolute bottom-2 right-4 flex gap-1.5">
          {slides.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === idx ? 'bg-white' : 'bg-white/30'}`} />
          ))}
        </div>
      )}
    </div>
  );
}

function LiveBanner() {
  const [comps, setComps] = useState<CompSnippet[]>([]);
  useEffect(() => {
    fetch('/api/competitions?status=LIVE&limit=3')
      .then(r => r.json())
      .then(d => setComps(d.competitions ?? []))
      .catch(() => {});
  }, []);
  if (!comps.length) return null;
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-xs font-bold text-red-400 font-mono uppercase tracking-widest">Live Now</span>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        {comps.map(c => (
          <Link key={c._id} href={`/competitions/${c._id}/round/1`}
            className="flex items-center justify-between px-4 py-3 rounded-xl bg-red-500/5 border border-red-500/20 hover:bg-red-500/10 transition-all">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-fg truncate">{c.name}</p>
              <p className="text-xs text-muted">{c.events?.join(' · ')}</p>
            </div>
            <ArrowRight size={14} className="text-red-400 flex-shrink-0 ml-2" />
          </Link>
        ))}
      </div>
    </div>
  );
}

function UpcomingComps() {
  const [comps, setComps] = useState<CompSnippet[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch('/api/competitions?status=REGISTRATION_OPEN&limit=4')
      .then(r => r.json())
      .then(d => { setComps(d.competitions ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="grid sm:grid-cols-2 gap-3">
      {[1, 2].map(i => <div key={i} className="h-20 rounded-xl bg-surface border border-line animate-pulse" />)}
    </div>
  );

  if (!comps.length) return (
    <div className="text-center py-10 text-muted text-sm border border-dashed border-line rounded-2xl">
      No upcoming competitions right now. Check back soon!
    </div>
  );

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {comps.map(c => (
        <Link key={c._id} href={`/competitions/${c._id}/round/1`}
          className="flex items-center justify-between px-4 py-4 rounded-xl bg-surface border border-line hover:border-line-strong hover:bg-elevated transition-all">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-fg truncate">{c.name}</p>
            <p className="text-xs text-muted mt-0.5">{c.events?.join(' · ')}</p>
          </div>
          <span className="text-[10px] font-mono text-amber-400 border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 rounded-full flex-shrink-0 ml-3">
            Open
          </span>
        </Link>
      ))}
    </div>
  );
}

function PastResults() {
  const [comps, setComps] = useState<CompSnippet[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch('/api/competitions?status=COMPLETED&limit=6')
      .then(r => r.json())
      .then(d => { setComps(d.competitions ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);
  if (!loading && !comps.length) return null;
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Trophy size={16} className="text-muted" />
          <h2 className="font-bold text-fg">Past Results</h2>
        </div>
        <a href="/compete" className="text-xs text-accent hover:underline flex items-center gap-1">
          All results <ArrowRight size={12} />
        </a>
      </div>
      {loading ? (
        <div className="grid sm:grid-cols-3 gap-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-surface border border-line animate-pulse" />)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-3 gap-3">
          {comps.map(c => (
            <Link key={c._id} href={`/competitions/${c._id}/results`}
              className="flex items-center justify-between px-4 py-3 rounded-xl bg-surface border border-line hover:border-line-strong hover:bg-elevated transition-all">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-fg truncate">{c.name}</p>
                <p className="text-xs text-muted mt-0.5">{c.events?.join(' · ')}</p>
              </div>
              <span className="text-[10px] font-mono text-muted border border-line-strong bg-elevated px-2 py-0.5 rounded-full flex-shrink-0 ml-3">
                Ended
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-bg text-fg">

      <AnnouncementBanner />
      <CarouselHero />

      {/* ── Hero ── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-accent/4 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-elevated border border-line-strong text-xs font-mono text-accent mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            India's #1 Speedcubing Platform
          </div>

          <h1 className="text-5xl sm:text-7xl font-black tracking-tight mb-5 leading-none">
            The{' '}
            <span className="bg-gradient-to-r from-accent to-lime bg-clip-text text-transparent">
              Cubelelo
            </span>
            {' '}Platform
          </h1>

          <p className="text-lg text-muted max-w-xl mx-auto mb-10 leading-relaxed">
            Compete in WCA-style online events, train with precision tools,
            and track your entire speedcubing journey.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {session ? (
              <Link href="/timer"
                className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-accent hover:bg-accent-hover text-black font-bold transition-all shadow-lg shadow-accent/20">
                Open Timer <ChevronRight size={16} />
              </Link>
            ) : (
              <Link href="/signup"
                className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-accent hover:bg-accent-hover text-black font-bold transition-all shadow-lg shadow-accent/20">
                Get Started Free <ChevronRight size={16} />
              </Link>
            )}
            <Link href="/compete"
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-elevated hover:bg-line border border-line-strong text-fg font-medium transition-all">
              Browse Competitions
            </Link>
          </div>
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <div className="border-y border-line bg-surface">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {STATS.map(({ label, value, icon: Icon }) => (
            <div key={label} className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Icon size={14} className="text-accent" />
                <span className="text-2xl font-black text-fg">{value}</span>
              </div>
              <p className="text-xs text-muted">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Live / Upcoming Competitions ── */}
      <LiveBanner />
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black">Upcoming Competitions</h2>
          <Link href="/competitions" className="text-xs text-accent hover:underline">View all →</Link>
        </div>
        <UpcomingComps />
      </section>

      {/* ── Past Results ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black">Past Results</h2>
          <Link href="/competitions?status=COMPLETED" className="text-xs text-accent hover:underline">View all →</Link>
        </div>
        <PastResults />
      </section>
    </div>
  );
}
