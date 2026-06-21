'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, Users, Trophy, ChevronRight, Clock } from 'lucide-react';
import { getPuzzleEmoji } from '@/lib/utils/competition';
import StatusChip from '@/components/ui/StatusChip';

// ─── Props shape — decoupled from DB schema ───────────────────────────────────

export interface CompetitionCardData {
  id: string;
  name: string;
  description?: string;
  puzzleType: string;        // primary event (for icon)
  events?: string[];
  startDate: string;
  endDate?: string;
  entryFee: number;          // in ₹ (already converted from paise)
  maxEntries: number;
  currentEntries: number;
  status: string;
  rounds: number;
  currentRound?: number;
  prize?: string;
}

interface CompetitionCardProps {
  competition: CompetitionCardData;
  onRegister?: (id: string) => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getTimeUntil(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return 'Started';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 48) return `${Math.floor(h / 24)}d away`;
  if (h > 0) return `${h}h ${m}m away`;
  return `${m}m away`;
}

export default function CompetitionCard({ competition, onRegister }: CompetitionCardProps) {
  const {
    id, name, description, puzzleType, events, startDate,
    entryFee, maxEntries, currentEntries, status, rounds, prize,
  } = competition;

  const spotsLeft = maxEntries - currentEntries;
  const fillPercent = maxEntries > 0 ? Math.round((currentEntries / maxEntries) * 100) : 0;

  const canRegister = status === 'REGISTRATION_OPEN' && spotsLeft > 0;
  const isLive = status === 'LIVE';
  const isCompleted = status === 'COMPLETED';

  return (
    <div className={`relative group bg-surface border rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-2xl hover:shadow-black/40 hover:-translate-y-0.5 ${
      isLive ? 'border-red-500/40 shadow-red-500/10 shadow-lg' : 'border-line hover:border-line-strong'
    }`}>
      {/* Live indicator */}
      {isLive && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Live</span>
        </div>
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-elevated border border-line flex items-center justify-center text-xl flex-shrink-0">
            {getPuzzleEmoji(puzzleType)}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-fg text-sm leading-tight truncate pr-8">{name}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <StatusChip status={status} />
              <span className="text-[10px] text-muted">
                {events?.length ? events.join(', ') : puzzleType}
              </span>
              <span className="text-[10px] text-muted">· {rounds} round{rounds !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        {description && (
          <p className="text-xs text-muted leading-relaxed mb-3 line-clamp-2">{description}</p>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-muted mb-3">
          <span className="flex items-center gap-1">
            <Calendar size={11} />
            {formatDate(startDate)}
          </span>
          {!isLive && !isCompleted && (
            <span className="flex items-center gap-1 text-accent">
              <Clock size={11} />
              {getTimeUntil(startDate)}
            </span>
          )}
        </div>

        {/* Entry fill bar */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="flex items-center gap-1 text-[10px] text-muted">
              <Users size={10} />
              {currentEntries}/{maxEntries} registered
            </span>
            <span className="text-[10px] text-muted">
              {spotsLeft > 0 ? `${spotsLeft} spots left` : 'Full'}
            </span>
          </div>
          <div className="h-1 bg-line rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                fillPercent >= 90 ? 'bg-red-500' : fillPercent >= 70 ? 'bg-amber-500' : 'bg-accent'
              }`}
              style={{ width: `${fillPercent}%` }}
            />
          </div>
        </div>

        {/* Prize + Fee */}
        <div className="flex items-center justify-between mb-4">
          {prize && (
            <div className="flex items-center gap-1 text-xs text-amber-400">
              <Trophy size={11} />
              <span className="font-medium">{prize}</span>
            </div>
          )}
          <div className="ml-auto">
            {entryFee === 0 ? (
              <span className="text-xs font-bold text-emerald-400">FREE</span>
            ) : (
              <span className="text-xs font-bold text-fg">₹{entryFee}</span>
            )}
          </div>
        </div>

        {/* CTA */}
        {isCompleted ? (
          <Link
            href={`/compete/${id}/results`}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-elevated hover:bg-line border border-line-strong text-sm font-medium text-muted hover:text-fg transition-all"
          >
            View Results <ChevronRight size={14} />
          </Link>
        ) : isLive ? (
          <Link
            href={`/compete/${id}`}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-sm font-bold text-red-400 transition-all"
          >
            Join Live Room <ChevronRight size={14} />
          </Link>
        ) : canRegister ? (
          <button
            onClick={() => onRegister?.(id)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent/10 hover:bg-accent/20 border border-accent/30 text-sm font-bold text-accent transition-all"
          >
            Register Now <ChevronRight size={14} />
          </button>
        ) : (
          <button
            disabled
            className="w-full px-4 py-2.5 rounded-xl bg-elevated border border-line text-sm text-muted cursor-not-allowed"
          >
            {spotsLeft === 0 ? 'Competition Full' : 'Registration Closed'}
          </button>
        )}
      </div>
    </div>
  );
}
