'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import {
  User, Edit2, Save, X, ExternalLink, Trophy,
  MapPin, Calendar, Phone, Shield, CheckCircle, Clock
} from 'lucide-react';

interface UserProfile {
  _id: string;
  userId: string;
  wcaId?: string | null;
  name?: { firstName?: string; lastName?: string };
  dob?: string;
  gender?: string;
  city?: string;
  country?: string;
  mobile?: string;
  email: string;
  role: string;
  active: boolean;
  profilePicture?: string;
  socialMedia?: Record<string, string>;
  createdAt: string;
}

export default function MyProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [pbs, setPbs] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  // Edit form state
  const [form, setForm] = useState({
    firstName: '', lastName: '', wcaId: '',
    city: '', country: '', mobile: '', dob: '', gender: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/profile')
      .then(r => r.json())
      .then(d => {
        setProfile(d.user);
        setPbs(d.pbs ?? []);
        setHistory(d.history ?? []);
        setForm({
          firstName: d.user?.name?.firstName ?? '',
          lastName: d.user?.name?.lastName ?? '',
          wcaId: d.user?.wcaId ?? '',
          city: d.user?.city ?? '',
          country: d.user?.country ?? '',
          mobile: d.user?.mobile ?? '',
          dob: d.user?.dob ?? '',
          gender: d.user?.gender ?? '',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setSaveError(data.error ?? 'Save failed'); return; }
    setProfile(data.user);
    setEditing(false);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const displayName = profile?.name
    ? `${profile.name.firstName ?? ''} ${profile.name.lastName ?? ''}`.trim()
    : session?.user?.name ?? 'Cuber';

  const initials = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Profile Header ── */}
        <div className="bg-surface border border-line rounded-2xl overflow-hidden mb-5">
          {/* Cover */}
          <div className="h-28 bg-gradient-to-r from-accent/20 via-lime/10 to-accent/5" />

          <div className="px-6 pb-6">
            <div className="flex items-end justify-between -mt-10 mb-4 flex-wrap gap-3">
              {/* Avatar */}
              <div className="relative">
                {profile?.profilePicture || session?.user?.image ? (
                  <Image
                    src={profile?.profilePicture || session?.user?.image || ''}
                    alt={displayName}
                    width={80}
                    height={80}
                    className="rounded-2xl border-4 border-surface object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl border-4 border-surface bg-gradient-to-br from-accent to-lime flex items-center justify-center">
                    <span className="text-black font-black text-2xl">{initials}</span>
                  </div>
                )}
                {profile?.role === 'admin' && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
                    <Shield size={11} className="text-black" />
                  </div>
                )}
              </div>

              {/* Edit / Save buttons */}
              <div className="flex gap-2">
                {editing ? (
                  <>
                    <button
                      onClick={() => { setEditing(false); setSaveError(''); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line-strong text-muted hover:text-fg text-xs transition-colors"
                    >
                      <X size={13} /> Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-black text-xs font-bold transition-all disabled:opacity-50"
                    >
                      {saving ? <span className="w-3 h-3 border border-black/30 border-t-black rounded-full animate-spin" /> : <Save size={13} />}
                      Save
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line-strong hover:bg-line text-muted hover:text-fg text-xs transition-all"
                  >
                    <Edit2 size={13} /> Edit Profile
                  </button>
                )}
              </div>
            </div>

            {/* Name + IDs */}
            {editing ? (
              <div className="grid sm:grid-cols-2 gap-3 mb-3">
                <Input label="First name" value={form.firstName} onChange={v => setForm(f => ({ ...f, firstName: v }))} />
                <Input label="Last name" value={form.lastName} onChange={v => setForm(f => ({ ...f, lastName: v }))} />
              </div>
            ) : (
              <div className="mb-1">
                <h1 className="text-xl font-black text-fg">{displayName}</h1>
              </div>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              {profile?.userId && (
                <span className="text-xs font-mono text-accent bg-accent/10 border border-accent/20 px-2.5 py-1 rounded-lg">
                  {profile.userId}
                </span>
              )}
              {profile?.wcaId && !editing && (
                <a href={`https://www.worldcubeassociation.org/persons/${profile.wcaId}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-mono text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-lg hover:bg-amber-400/20 transition-colors">
                  WCA: {profile.wcaId} <ExternalLink size={10} />
                </a>
              )}
              {profile?.role === 'admin' && (
                <span className="text-[10px] font-mono font-bold text-amber-400 border border-amber-400/30 px-2 py-0.5 rounded-full">
                  ADMIN
                </span>
              )}
              {profile?.active && (
                <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                  <CheckCircle size={10} /> Active
                </span>
              )}
            </div>

            {saveError && (
              <p className="text-xs text-red-400 mt-3">{saveError}</p>
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-5">
          {/* ── Left: Details ── */}
          <div className="sm:col-span-2 space-y-5">

            {/* Info Card */}
            <div className="bg-surface border border-line rounded-2xl p-5">
              <h2 className="text-xs font-mono uppercase tracking-widest text-muted mb-4">Profile Details</h2>
              {editing ? (
                <div className="grid sm:grid-cols-2 gap-3">
                  <Input label="WCA ID" value={form.wcaId} onChange={v => setForm(f => ({ ...f, wcaId: v }))} placeholder="e.g. 2018AAAA01" />
                  <Input label="City / State" value={form.city} onChange={v => setForm(f => ({ ...f, city: v }))} />
                  <Input label="Country" value={form.country} onChange={v => setForm(f => ({ ...f, country: v }))} />
                  <Input label="Mobile" value={form.mobile} onChange={v => setForm(f => ({ ...f, mobile: v }))} />
                  <Input label="Date of Birth" value={form.dob} onChange={v => setForm(f => ({ ...f, dob: v }))} placeholder="YYYY-MM-DD" />
                  <div>
                    <label className="text-[10px] font-mono text-muted uppercase tracking-wider block mb-1">Gender</label>
                    <select
                      value={form.gender}
                      onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-elevated border border-line-strong text-sm text-fg focus:outline-none focus:border-accent"
                    >
                      <option value="">Select…</option>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                      <option>Prefer not to say</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <DetailRow icon={<MapPin size={13} />} label="Location"
                    value={[profile?.city, profile?.country].filter(Boolean).join(', ') || '—'} />
                  <DetailRow icon={<Calendar size={13} />} label="Date of Birth" value={profile?.dob || '—'} />
                  <DetailRow icon={<User size={13} />} label="Gender" value={profile?.gender || '—'} />
                  <DetailRow icon={<Phone size={13} />} label="Mobile" value={profile?.mobile || '—'} />
                  <DetailRow icon={<Clock size={13} />} label="Member Since"
                    value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '—'} />
                </div>
              )}
            </div>

            {/* Competition History */}
            <div className="bg-surface border border-line rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-mono uppercase tracking-widest text-muted">Competition History</h2>
                <Link href="/compete" className="text-xs text-accent hover:underline">Browse →</Link>
              </div>
              {history.length === 0 ? (
                <div className="text-center py-8 text-muted text-sm">
                  <Trophy size={28} className="mx-auto mb-2 opacity-30" />
                  No competition results yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map((h: any) => (
                    <div key={h.competitionId} className="bg-bg rounded-xl px-4 py-3">
                      <p className="text-xs font-semibold text-fg truncate">{h.competitionName}</p>
                      <div className="flex gap-2 flex-wrap mt-1">
                        {(h.results ?? []).map((r: any) => (
                          <span key={r.eventId} className="text-[10px] text-muted font-mono">
                            {r.eventId}: {r.averageTime >= 360000 ? 'DNF' : (r.averageTime / 1000).toFixed(2)}
                          </span>
                        ))}
                        {h.results?.length === 0 && (
                          <span className="text-[10px] text-muted">Registered — no result yet</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Right: Stats ── */}
          <div className="space-y-5">
            {/* PBs & Quick Stats */}
            <div className="bg-surface border border-line rounded-2xl p-5">
              <h2 className="text-xs font-mono uppercase tracking-widest text-muted mb-4">Personal Bests</h2>
              {pbs.length === 0 ? (
                <p className="text-xs text-muted">No PBs yet — start competing!</p>
              ) : (
                <div className="space-y-2">
                  {pbs.map((pb: any) => (
                    <div key={pb.eventId} className="flex items-center justify-between">
                      <span className="text-xs text-muted font-mono">{pb.eventId}</span>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-fg">
                          {pb.bestSingle && parseInt(pb.bestSingle) < 360000
                            ? (parseInt(pb.bestSingle) / 1000).toFixed(2)
                            : 'DNF'}
                        </span>
                        {pb.bestAverage && parseInt(pb.bestAverage) < 360000 && (
                          <span className="ml-2 text-[10px] text-muted font-mono">
                            ao5: {(parseInt(pb.bestAverage) / 1000).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-line space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">Competitions</span>
                  <span className="text-xs font-mono font-bold text-fg">{history.length}</span>
                </div>
              </div>
            </div>

            {/* Social / WCA links */}
            <div className="bg-surface border border-line rounded-2xl p-5">
              <h2 className="text-xs font-mono uppercase tracking-widest text-muted mb-4">Links</h2>
              <div className="space-y-2">
                {profile?.wcaId ? (
                  <a href={`https://www.worldcubeassociation.org/persons/${profile.wcaId}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-amber-400 hover:text-amber-300 transition-colors">
                    <ExternalLink size={12} /> WCA Profile
                  </a>
                ) : (
                  <p className="text-xs text-muted">No WCA ID linked yet.</p>
                )}
                {profile?.socialMedia?.instagram && (
                  <a href={profile.socialMedia.instagram}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-muted hover:text-fg transition-colors">
                    <ExternalLink size={12} /> Instagram
                  </a>
                )}
              </div>
            </div>

            {/* View public profile */}
            {profile?.userId && (
              <Link href={`/profile/${profile.userId}`}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-line-strong text-xs text-muted hover:text-fg hover:bg-elevated transition-all">
                <User size={13} /> View Public Profile
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder }: {
  label: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[10px] font-mono text-muted uppercase tracking-wider block mb-1">{label}</label>
      <input
        type="text" value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-elevated border border-line-strong text-sm text-fg placeholder-muted focus:outline-none focus:border-accent transition-colors"
      />
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-muted">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <span className="text-xs font-medium text-fg text-right">{value}</span>
    </div>
  );
}
