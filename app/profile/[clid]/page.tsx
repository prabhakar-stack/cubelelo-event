'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  User, ExternalLink, Trophy, MapPin, Calendar,
  Shield, CheckCircle, ArrowLeft, Flame
} from 'lucide-react';

interface PublicProfile {
  userId: string;
  wcaId?: string | null;
  name?: { firstName?: string; lastName?: string };
  city?: string;
  country?: string;
  profilePicture?: string;
  role: string;
  active: boolean;
  socialMedia?: Record<string, string>;
  createdAt: string;
}

function fmtMs(ms: number): string {
  if (!ms || ms >= 360000) return 'DNF';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const mil = ms % 1000;
  if (m > 0) return `${m}:${(s % 60).toString().padStart(2, '0')}.${mil.toString().padStart(3, '0')}`;
  return `${s}.${mil.toString().padStart(3, '0')}`;
}

export default function PublicProfilePage() {
  const params = useParams();
  const clid = (params?.clid as string)?.toUpperCase();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [pbs, setPbs] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [streak, setStreak] = useState(0);
  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => {
    if (!clid) return;
    fetch(`/api/profile/${clid}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); setLoading(false); return null; }
        return r.json();
      })
      .then(d => {
        if (d) {
          setProfile(d.user);
          setPbs(d.pbs ?? []);
          setHistory(d.history ?? []);
          setStreak(d.streak ?? 0);
          setIsPrivate(!!d.private);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [clid]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center text-center px-4">
        <User size={40} className="text-muted mb-4 opacity-30" />
        <h1 className="text-xl font-bold text-fg mb-1">Cuber Not Found</h1>
        <p className="text-sm text-muted mb-6">No profile found for <span className="font-mono text-accent">{clid}</span></p>
        <Link href="/" className="flex items-center gap-1.5 text-sm text-accent hover:underline">
          <ArrowLeft size={14} /> Back to home
        </Link>
      </div>
    );
  }

  const displayName = profile.name
    ? `${profile.name.firstName ?? ''} ${profile.name.lastName ?? ''}`.trim()
    : profile.userId;
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || '?';

  // Best 3x3 PBs for stats card
  const pb3 = pbs.find(p => p.eventId === '3x3x3');

  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        <Link href="/compete" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-fg mb-5 transition-colors">
          <ArrowLeft size={13} /> All Competitors
        </Link>

        {isPrivate && (
          <div className="bg-elevated border border-line-strong rounded-xl px-4 py-3 mb-5 text-sm text-muted flex items-center gap-2">
            <Shield size={15} className="text-muted" /> This profile is private — personal bests and competition history are hidden.
          </div>
        )}

        {/* Profile Header */}
        <div className="bg-surface border border-line rounded-2xl overflow-hidden mb-5">
          <div className="h-28 bg-gradient-to-r from-accent/20 via-lime/10 to-accent/5" />
          <div className="px-6 pb-6">
            <div className="-mt-10 mb-4">
              {profile.profilePicture ? (
                <Image src={profile.profilePicture} alt={displayName}
                  width={80} height={80}
                  className="rounded-2xl border-4 border-surface object-cover" unoptimized />
              ) : (
                <div className="w-20 h-20 rounded-2xl border-4 border-surface bg-gradient-to-br from-accent to-lime flex items-center justify-center">
                  <span className="text-black font-black text-2xl">{initials}</span>
                </div>
              )}
            </div>

            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-xl font-black text-fg mb-2">{displayName}</h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-mono text-accent bg-accent/10 border border-accent/20 px-2.5 py-1 rounded-lg">
                    {profile.userId}
                  </span>
                  {profile.wcaId && (
                    <a href={`https://www.worldcubeassociation.org/persons/${profile.wcaId}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-mono text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-lg hover:bg-amber-400/20 transition-colors">
                      WCA: {profile.wcaId} <ExternalLink size={10} />
                    </a>
                  )}
                  {profile.role === 'admin' && (
                    <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-amber-400 border border-amber-400/30 px-2 py-0.5 rounded-full">
                      <Shield size={9} /> ADMIN
                    </span>
                  )}
                  {profile.active && (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                      <CheckCircle size={10} /> Active
                    </span>
                  )}
                </div>
              </div>
              {/* Daily streak badge */}
              {streak > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 flex-shrink-0">
                  <Flame size={15} className="text-orange-400" />
                  <span className="font-black text-lg text-orange-400">{streak}</span>
                  <span className="text-xs text-muted">day streak</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-5">
          {/* Left: Info + History */}
          <div className="sm:col-span-2 space-y-5">

            {/* Basic Info */}
            <div className="bg-surface border border-line rounded-2xl p-5">
              <h2 className="text-xs font-mono uppercase tracking-widest text-muted mb-4">About</h2>
              <div className="space-y-3">
                {(profile.city || profile.country) && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin size={13} className="text-muted" />
                    <span className="text-fg">{[profile.city, profile.country].filter(Boolean).join(', ')}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={13} className="text-muted" />
                  <span className="text-muted">Member since </span>
                  <span className="text-fg">
                    {new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Competition History */}
            <div className="bg-surface border border-line rounded-2xl p-5">
              <h2 className="text-xs font-mono uppercase tracking-widest text-muted mb-4">Competition History</h2>
              {history.length > 0 ? (
                <div className="space-y-2">
                  {history.map((h: any) => (
                    <Link key={h.competitionId} href={`/competitions/${h.competitionId}/results`}
                      className="block bg-bg rounded-xl px-4 py-3 hover:bg-elevated transition-colors">
                      <p className="text-xs font-semibold text-fg truncate">{h.competitionName}</p>
                      <div className="flex gap-2 flex-wrap mt-1">
                        {(h.results ?? []).map((r: any) => (
                          <span key={r.eventId} className="text-[10px] text-muted font-mono">
                            {r.eventId}: {fmtMs(r.averageTime || r.bestTime)}
                          </span>
                        ))}
                        {h.results?.length === 0 && (
                          <span className="text-[10px] text-muted">Registered</span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted text-sm">
                  <Trophy size={28} className="mx-auto mb-2 opacity-30" />
                  No competition results yet.
                </div>
              )}
            </div>
          </div>

          {/* Right */}
          <div className="space-y-5">

            {/* Stats */}
            <div className="bg-surface border border-line rounded-2xl p-5">
              <h2 className="text-xs font-mono uppercase tracking-widest text-muted mb-4">Stats</h2>
              <div className="space-y-3">
                {[
                  { label: 'Competitions', value: String(history.length) || '—' },
                  { label: 'Best Single (3x3)', value: pb3 ? fmtMs(parseInt(pb3.bestSingle)) : '—' },
                  { label: 'Best Ao5 (3x3)', value: pb3?.bestAverage ? fmtMs(parseInt(pb3.bestAverage)) : '—' },
                  ...(streak > 0 ? [{ label: 'Daily Streak', value: `🔥 ${streak}d` }] : []),
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-xs text-muted">{label}</span>
                    <span className="text-xs font-mono font-bold text-fg">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Personal Bests */}
            <div className="bg-surface border border-line rounded-2xl p-5">
              <h2 className="text-xs font-mono uppercase tracking-widest text-muted mb-4">Personal Bests</h2>
              {pbs.length === 0 ? (
                <p className="text-xs text-muted">No PBs recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {pbs.map((pb: any) => (
                    <div key={pb.eventId} className="flex items-center justify-between">
                      <span className="text-xs text-muted font-mono">{pb.eventId}</span>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-fg">{fmtMs(parseInt(pb.bestSingle))}</span>
                        {pb.bestAverage && parseInt(pb.bestAverage) < 360000 && (
                          <span className="ml-2 text-[10px] text-muted font-mono">
                            ao5 {fmtMs(parseInt(pb.bestAverage))}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Links */}
            <div className="bg-surface border border-line rounded-2xl p-5">
              <h2 className="text-xs font-mono uppercase tracking-widest text-muted mb-4">Links</h2>
              <div className="space-y-2">
                {profile.wcaId ? (
                  <a href={`https://www.worldcubeassociation.org/persons/${profile.wcaId}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-amber-400 hover:text-amber-300 transition-colors">
                    <ExternalLink size={12} /> WCA Profile
                  </a>
                ) : (
                  <p className="text-xs text-muted">No WCA ID linked.</p>
                )}
                {profile.socialMedia?.instagram && (
                  <a href={profile.socialMedia.instagram} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-muted hover:text-fg transition-colors">
                    <ExternalLink size={12} /> Instagram
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
