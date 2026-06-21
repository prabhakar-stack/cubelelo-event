'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Bell, Save, CheckCircle, Trophy, Plus, Trash2, Loader2, CalendarClock } from 'lucide-react';

interface RankTier { name: string; maxMs: number; }

const DEFAULT_TIERS: RankTier[] = [
  { name: 'Elite',        maxMs: 12000  },
  { name: 'Pro',          maxMs: 15000  },
  { name: 'Expert',       maxMs: 20000  },
  { name: 'Advanced',     maxMs: 30000  },
  { name: 'Intermediate', maxMs: 60000  },
  { name: 'Beginner',     maxMs: 999999 },
];

function msToSeconds(ms: number): string {
  if (ms >= 999999) return '';
  return (ms / 1000).toFixed(2);
}
function secondsToMs(s: string): number {
  const n = parseFloat(s);
  if (isNaN(n) || n <= 0) return 999999;
  return Math.round(n * 1000);
}

export default function AdminContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [announcement, setAnnouncement] = useState('');
  const [bannerSaved, setBannerSaved] = useState(false);
  const [tiers, setTiers] = useState<RankTier[]>(DEFAULT_TIERS);
  const [tiersSaved, setTiersSaved] = useState(false);
  const [tiersLoading, setTiersLoading] = useState(true);
  const [tiersSaving, setTiersSaving] = useState(false);
  const [freezeDate, setFreezeDate] = useState('');
  const [freezeSaved, setFreezeSaved] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    const allowed = session && (session.user.role === 'admin' || session.user.role === 'moderator' || session.user.email === 'prabhakar@cubelelo.com');
    if (!allowed) {
      router.push('/login'); return;
    }
    setAnnouncement(localStorage.getItem('cl_announcement') ?? '');
    fetch('/api/admin/config?key=rankTiers')
      .then(r => r.json())
      .then(d => { if (d.value) setTiers(d.value); })
      .catch(() => null)
      .finally(() => setTiersLoading(false));
    fetch('/api/admin/config?key=freezeDate')
      .then(r => r.json())
      .then(d => { if (typeof d.value === 'string') setFreezeDate(d.value.slice(0, 10)); })
      .catch(() => null);
  }, [session, status, router]);

  const saveBanner = () => {
    localStorage.setItem('cl_announcement', announcement);
    setBannerSaved(true);
    setTimeout(() => setBannerSaved(false), 2000);
  };

  const saveFreeze = async () => {
    await fetch('/api/admin/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'freezeDate', value: freezeDate || null }),
    });
    setFreezeSaved(true);
    setTimeout(() => setFreezeSaved(false), 2000);
  };

  const saveTiers = async () => {
    setTiersSaving(true);
    try {
      const sorted = [...tiers].sort((a, b) => a.maxMs - b.maxMs);
      const hdrs: Record<string, string> = {};
      hdrs['Content-Type'] = 'application/json';
      await fetch('/api/admin/config', {
        method: 'PUT',
        headers: hdrs,
        body: JSON.stringify({ key: 'rankTiers', value: sorted }),
      });
      setTiers(sorted);
      setTiersSaved(true);
      setTimeout(() => setTiersSaved(false), 2000);
    } catch (e) {
      alert('Failed to save rank tiers');
    } finally {
      setTiersSaving(false);
    }
  };

  const updateTier = (i: number, field: keyof RankTier, val: string) => {
    setTiers(prev => prev.map((t, idx) =>
      idx === i ? { ...t, [field]: field === 'maxMs' ? secondsToMs(val) : val } : t
    ));
  };

  const addTier = () => { setTiers(prev => [...prev, { name: 'New Tier', maxMs: 45000 }]); };
  const removeTier = (i: number) => { setTiers(prev => prev.filter((_, idx) => idx !== i)); };
  const resetTiers = () => { if (confirm('Reset to default tier thresholds?')) setTiers(DEFAULT_TIERS); };

  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div>
          <Link href="/admin" className="text-xs text-muted hover:text-fg mb-1 block">← Admin</Link>
          <h1 className="text-2xl font-black">Content Management</h1>
        </div>

        {/* Announcement Banner */}
        <div className="bg-surface border border-line rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Bell size={15} className="text-amber-400" />
            <h2 className="font-semibold">Site-wide Announcement Banner</h2>
          </div>
          <p className="text-xs text-muted">Shown across all pages. Leave blank to hide.</p>
          <input type="text" value={announcement} onChange={e => setAnnouncement(e.target.value)}
            placeholder="e.g. Round 2 of Midweek Madness is now open!"
            className="w-full px-3 py-2.5 bg-bg border border-line-strong rounded-xl text-sm text-fg placeholder-muted focus:outline-none focus:border-accent transition-colors" />
          <button onClick={saveBanner}
            className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-black font-bold text-sm rounded-xl transition-all">
            {bannerSaved ? <CheckCircle size={15} /> : <Save size={15} />}
            {bannerSaved ? 'Saved!' : 'Save Banner'}
          </button>
        </div>

        {/* Migration freeze date */}
        <div className="bg-surface border border-line rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <CalendarClock size={15} className="text-amber-400" />
            <h2 className="font-semibold">Migration Freeze Date</h2>
          </div>
          <p className="text-xs text-muted">Shows a sitewide banner urging users to claim their accounts before this date. Leave blank to hide.</p>
          <div className="flex items-center gap-3 flex-wrap">
            <input type="date" value={freezeDate} onChange={e => setFreezeDate(e.target.value)}
              className="px-3 py-2.5 bg-bg border border-line-strong rounded-xl text-sm text-fg focus:outline-none focus:border-accent transition-colors" />
            <button onClick={saveFreeze}
              className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-black font-bold text-sm rounded-xl transition-all">
              {freezeSaved ? <CheckCircle size={15} /> : <Save size={15} />} {freezeSaved ? 'Saved!' : 'Save Date'}
            </button>
            {freezeDate && <button onClick={() => setFreezeDate('')} className="text-xs text-muted hover:text-fg">clear</button>}
          </div>
        </div>

        {/* Rank Tier Config */}
        <div className="bg-surface border border-line rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy size={15} className="text-accent" />
              <h2 className="font-semibold">Rank Tier Thresholds (3x3)</h2>
            </div>
            <button onClick={resetTiers} className="text-xs text-muted hover:text-fg transition-colors">
              Reset to defaults
            </button>
          </div>
          <p className="text-xs text-muted">
            Each tier shows its upper bound in seconds. Leave blank for no limit (slowest tier).
            Tiers are auto-sorted ascending on save.
          </p>

          {tiersLoading ? (
            <div className="flex items-center gap-2 py-4 text-muted">
              <Loader2 size={14} className="animate-spin" /> Loading...
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_140px_40px] gap-2 text-[10px] font-mono text-muted px-1">
                  <span>Tier Name</span><span>Max time (seconds)</span><span></span>
                </div>
                {tiers.map((tier, i) => (
                  <div key={i} className="grid grid-cols-[1fr_140px_40px] gap-2 items-center">
                    <input type="text" value={tier.name} onChange={e => updateTier(i, 'name', e.target.value)}
                      className="px-3 py-2 bg-bg border border-line-strong rounded-lg text-sm text-fg focus:outline-none focus:border-accent transition-colors" />
                    <input type="number" step="0.01" min="0"
                      value={tier.maxMs >= 999999 ? '' : msToSeconds(tier.maxMs)}
                      onChange={e => updateTier(i, 'maxMs', e.target.value)}
                      placeholder="no limit"
                      className="w-full px-3 py-2 bg-bg border border-line-strong rounded-lg text-sm text-fg placeholder-muted focus:outline-none focus:border-accent transition-colors" />
                    <button onClick={() => removeTier(i)} disabled={tiers.length <= 1}
                      className="flex items-center justify-center w-9 h-9 rounded-lg border border-line-strong text-muted hover:text-red-400 hover:border-red-400/40 transition-colors disabled:opacity-30">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button onClick={addTier}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-line-strong rounded-lg text-muted hover:text-fg hover:bg-elevated transition-all">
                  <Plus size={12} /> Add Tier
                </button>
                <button onClick={saveTiers} disabled={tiersSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-black font-bold text-sm rounded-xl transition-all disabled:opacity-60">
                  {tiersSaving ? <Loader2 size={14} className="animate-spin" /> : tiersSaved ? <CheckCircle size={14} /> : <Save size={14} />}
                  {tiersSaved ? 'Saved!' : 'Save Tiers'}
                </button>
              </div>

              <div className="mt-2 pt-4 border-t border-line">
                <p className="text-[10px] text-muted mb-2 font-mono">PREVIEW</p>
                <div className="flex flex-wrap gap-2">
                  {[...tiers].sort((a, b) => a.maxMs - b.maxMs).map((tier, i) => (
                    <span key={i} className="text-[11px] px-2.5 py-1 rounded-full border border-line-strong text-muted">
                      {tier.name}{tier.maxMs < 999999 ? ` — sub-${(tier.maxMs / 1000).toFixed(0)}s` : ' (slowest)'}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
