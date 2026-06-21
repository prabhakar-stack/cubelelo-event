'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  ChevronLeft, Users, Clock, Trophy, CheckCircle,
  AlertCircle, Loader2, Calendar, Zap
} from 'lucide-react';

interface PageParams {
  params: Promise<{ id: string }>;
}

interface Competitor {
  userId: string;
  name: string;
  wcaId?: string;
}

export default function CompetitionLobby({ params }: PageParams) {
  const { id } = use(params);
  const { data: session } = useSession();

  const [competition, setCompetition] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [registered, setRegistered] = useState(false);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [timeToOpen, setTimeToOpen] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/competitions/${id}`)
      .then(r => r.json())
      .then(d => { setCompetition(d.competition); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  // Check registration
  useEffect(() => {
    if (!session || !competition) return;
    const compId = competition.competitionId ?? id;
    fetch(`/api/orders?compId=${compId}`)
      .then(r => r.json())
      .then(d => setRegistered(d.registered ?? false))
      .catch(() => {});
  }, [session, competition, id]);

  // Countdown to round open
  useEffect(() => {
    if (!competition?.startDate) return;
    const start = new Date(competition.startDate).getTime();
    const tick = () => {
      const diff = Math.max(0, Math.floor((start - Date.now()) / 1000));
      setTimeToOpen(diff);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [competition]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 size={24} className="text-accent animate-spin" />
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center text-muted">
        Competition not found.{' '}
        <Link href="/compete" className="text-accent underline ml-1">Back to lobby</Link>
      </div>
    );
  }

  const isLive = competition.status === 'LIVE';
  const isOpen = competition.status === 'REGISTRATION_OPEN';
  const compName = competition.name ?? competition.competitionName;

  const formatCountdown = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <Link href="/compete" className="inline-flex items-center gap-1 text-muted hover:text-fg text-xs mb-8 transition-colors">
          <ChevronLeft size={14} /> Back to competitions
        </Link>

        {/* Header */}
        <div className="bg-surface border border-line rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isLive
                    ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                    : isOpen
                    ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                    : 'bg-elevated border border-line-strong text-muted'
                }`}>
                  {isLive ? '🔴 LIVE' : isOpen ? 'REGISTRATION OPEN' : competition.status}
                </span>
              </div>
              <h1 className="text-2xl font-black text-fg mb-2">{compName}</h1>
              {competition.description && (
                <p className="text-sm text-muted leading-relaxed">{competition.description}</p>
              )}
            </div>
            {registered && (
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold flex-shrink-0">
                <CheckCircle size={14} />
                Registered
              </div>
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          {/* Countdown */}
          <div className="bg-surface border border-line rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={15} className="text-accent" />
              <h2 className="font-semibold text-sm text-fg">
                {isLive ? 'Round Status' : 'Countdown to Open'}
              </h2>
            </div>
            {isLive ? (
              <div className="text-center py-4">
                <div className="text-3xl font-black text-red-400 mb-1 flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  LIVE NOW
                </div>
                <p className="text-xs text-muted">Scramble is revealed — timer is armed</p>
              </div>
            ) : timeToOpen !== null ? (
              <div className="text-center py-4">
                <div className="text-3xl font-black text-fg font-mono mb-1">
                  {formatCountdown(timeToOpen)}
                </div>
                <p className="text-xs text-muted">until round opens</p>
              </div>
            ) : (
              <p className="text-sm text-muted">Check back soon</p>
            )}
          </div>

          {/* Events */}
          <div className="bg-surface border border-line rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Trophy size={15} className="text-amber-400" />
              <h2 className="font-semibold text-sm text-fg">Events</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {(competition.events ?? []).map((e: any, i: number) => (
                <span key={i}
                  className="px-3 py-1 rounded-lg bg-elevated border border-line-strong text-xs font-mono text-muted">
                  {e.eventId ?? e}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Round Rules */}
        <div className="bg-surface border border-line rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={15} className="text-lime" />
            <h2 className="font-semibold text-sm text-fg">Round Rules</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 text-xs text-muted">
            {[
              ['Format', 'Average of 5 (ao5)'],
              ['Inspection', '15 seconds (WCA rules)'],
              ['Time Limit', '10:00 per solve'],
              ['Submission', 'Auto-submit on timer stop'],
              ['Video Proof', 'Required for top 3'],
              ['Anti-Cheat', 'Statistical outlier detection'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between bg-bg rounded-lg px-3 py-2">
                <span className="text-muted">{k}</span>
                <span className="text-fg font-medium">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        {registered ? (
          isLive ? (
            <Link href={`/competitions/${id}/round/1`}
              className="w-full flex items-center justify-center gap-2 py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl text-sm transition-all shadow-lg shadow-red-500/20">
              <Zap size={18} /> Enter Live Round
            </Link>
          ) : (
            <div className="w-full flex items-center justify-center gap-2 py-4 bg-elevated border border-line-strong text-muted rounded-2xl text-sm">
              <Clock size={16} /> Waiting for round to open…
            </div>
          )
        ) : (
          <Link href={`/competitions/${id}/round/1`}
            className="w-full flex items-center justify-center gap-2 py-4 bg-accent hover:bg-accent-hover text-black font-bold rounded-2xl text-sm transition-all shadow-lg shadow-accent/20">
            Register to Compete
          </Link>
        )}

        {/* Competitor count */}
        {competition.registrationCount > 0 && (
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted">
            <Users size={13} />
            {competition.registrationCount} competitor{competition.registrationCount !== 1 ? 's' : ''} registered
          </div>
        )}
      </div>
    </div>
  );
}
