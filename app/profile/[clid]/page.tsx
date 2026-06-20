'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  User, ExternalLink, Trophy, MapPin, Calendar,
  Shield, CheckCircle, ArrowLeft
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

export default function PublicProfilePage() {
  const params = useParams();
  const clid = (params?.clid as string)?.toUpperCase();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [pbs, setPbs] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);

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
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [clid]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#00dbe7] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-[#0b0e11] flex flex-col items-center justify-center text-center px-4">
        <User size={40} className="text-[#8b949e] mb-4 opacity-30" />
        <h1 className="text-xl font-bold text-white mb-1">Cuber Not Found</h1>
        <p className="text-sm text-[#8b949e] mb-6">No profile found for <span className="font-mono text-[#00dbe7]">{clid}</span></p>
        <Link href="/" className="flex items-center gap-1.5 text-sm text-[#00dbe7] hover:underline">
          <ArrowLeft size={14} /> Back to home
        </Link>
      </div>
    );
  }

  const displayName = profile.name
    ? `${profile.name.firstName ?? ''} ${profile.name.lastName ?? ''}`.trim()
    : profile.userId;

  const initials = displayName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <div className="min-h-screen bg-[#0b0e11] text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* Back link */}
        <Link href="/compete" className="inline-flex items-center gap-1.5 text-xs text-[#8b949e] hover:text-white mb-5 transition-colors">
          <ArrowLeft size={13} /> All Competitors
        </Link>

        {/* ── Profile Header ── */}
        <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl overflow-hidden mb-5">
          <div className="h-28 bg-gradient-to-r from-[#00dbe7]/20 via-[#a3fa00]/10 to-[#00dbe7]/5" />

          <div className="px-6 pb-6">
            <div className="-mt-10 mb-4">
              {profile.profilePicture ? (
                <Image
                  src={profile.profilePicture}
                  alt={displayName}
                  width={80}
                  height={80}
                  className="rounded-2xl border-4 border-[#0d1117] object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl border-4 border-[#0d1117] bg-gradient-to-br from-[#00dbe7] to-[#a3fa00] flex items-center justify-center">
                  <span className="text-black font-black text-2xl">{initials}</span>
                </div>
              )}
            </div>

            <h1 className="text-xl font-black text-white mb-1">{displayName}</h1>

            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-mono text-[#00dbe7] bg-[#00dbe7]/10 border border-[#00dbe7]/20 px-2.5 py-1 rounded-lg">
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
        </div>

        <div className="grid sm:grid-cols-3 gap-5">
          {/* ── Left: Info + History ── */}
          <div className="sm:col-span-2 space-y-5">

            {/* Basic Info */}
            <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl p-5">
              <h2 className="text-xs font-mono uppercase tracking-widest text-[#8b949e] mb-4">About</h2>
              <div className="space-y-3">
                {(profile.city || profile.country) && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin size={13} className="text-[#8b949e]" />
                    <span className="text-white">
                      {[profile.city, profile.country].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={13} className="text-[#8b949e]" />
                  <span className="text-[#8b949e]">Member since </span>
                  <span className="text-white">
                    {new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Competition History */}
            <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-mono uppercase tracking-widest text-[#8b949e]">Competition History</h2>
              </div>
              {history.length > 0 ? (
                  <div className="space-y-2">
                    {history.map((h: any) => (
                      <div key={h.competitionId} className="bg-[#0b0e11] rounded-xl px-4 py-3">
                        <p className="text-xs font-semibold text-white truncate">{h.competitionName}</p>
                        <div className="flex gap-2 flex-wrap mt-1">
                          {(h.results ?? []).map((r: any) => (
                            <span key={r.eventId} className="text-[10px] text-[#8b949e] font-mono">
                              {r.eventId}: {r.averageTime >= 360000 ? 'DNF' : (r.averageTime / 1000).toFixed(2)}
                            </span>
                          ))}
                          {h.results?.length === 0 && (
                            <span className="text-[10px] text-[#8b949e]">Registered</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-[#8b949e] text-sm">
                    <Trophy size={28} className="mx-auto mb-2 opacity-30" />
                    No competition results yet.
                  </div>
                )}
            </div>
          </div>

          {/* ── Right ── */}
          <div className="space-y-5">
            {/* Stats */}
            <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl p-5">
              <h2 className="text-xs font-mono uppercase tracking-widest text-[#8b949e] mb-4">Stats</h2>
              <div className="space-y-3">
                {[
                  { label: 'Competitions', value: '—' },
                  { label: 'Best Single (3x3)', value: '—' },
                  { label: 'Best Ao5 (3x3)', value: '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-xs text-[#8b949e]">{label}</span>
                    <span className="text-xs font-mono font-bold text-white">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Personal Bests */}
            <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl p-5">
              <h2 className="text-xs font-mono uppercase tracking-widest text-[#8b949e] mb-4">Personal Bests</h2>
              {pbs.length === 0 ? (
                <p className="text-xs text-[#8b949e]">No PBs yet.</p>
              ) : (
                <div className="space-y-2">
                  {pbs.map((pb: any) => (
                    <div key={pb.eventId} className="flex items-center justify-between">
                      <span className="text-xs text-[#8b949e] font-mono">{pb.eventId}</span>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-white">
                          {pb.bestSingle && parseInt(pb.bestSingle) < 360000
                            ? (parseInt(pb.bestSingle) / 1000).toFixed(2)
                            : 'DNF'}
                        </span>
                        {pb.bestAverage && parseInt(pb.bestAverage) < 360000 && (
                          <span className="ml-2 text-[10px] text-[#8b949e] font-mono">
                            ao5: {(parseInt(pb.bestAverage) / 1000).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Links */}
            <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl p-5">
              <h2 className="text-xs font-mono uppercase tracking-widest text-[#8b949e] mb-4">Links</h2>
              <div className="space-y-2">
                {profile.wcaId ? (
                  <a href={`https://www.worldcubeassociation.org/persons/${profile.wcaId}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-amber-400 hover:text-amber-300 transition-colors">
                    <ExternalLink size={12} /> WCA Profile
                  </a>
                ) : (
                  <p className="text-xs text-[#8b949e]">No WCA ID linked.</p>
                )}
                {profile.socialMedia?.instagram && (
                  <a href={profile.socialMedia.instagram}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-[#8b949e] hover:text-white transition-colors">
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
