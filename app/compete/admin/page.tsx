'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield, Plus, Trash2, Users, CheckCircle, RefreshCw,
  ExternalLink, Database, Zap, Lock, Unlock, Loader2
} from 'lucide-react';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import Modal from '@/components/ui/Modal';
import { getPuzzleEmoji, getStatusLabel, getStatusColor, Competition } from '@/lib/utils/competition';

type CompetitionStatus = Competition['status'];

const PUZZLE_TYPES = ['3x3x3', '2x2x2', '4x4x4', 'OH', 'Pyraminx', 'Megaminx', 'Skewb', 'Square-1'];

interface NewCompForm {
  name: string;
  events: string[];
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  baseFee: string;
  perEventFee: string;
  isFree: boolean;
  isPractice: boolean;
  maxEntries: string;
  rounds: string;
  prize: string;
  description: string;
}

const emptyForm: NewCompForm = {
  name: '', events: ['3x3x3'],
  startDate: '', endDate: '', registrationDeadline: '',
  baseFee: '399', perEventFee: '99',
  isFree: false, isPractice: false, maxEntries: '64', rounds: '3', prize: '', description: '',
};

// ─── Status transition map ────────────────────────────────────────────────────
const NEXT_STATUS: Record<string, { label: string; status: string; color: string }> = {
  DRAFT: { label: 'Open Registration', status: 'REGISTRATION_OPEN', color: 'text-emerald-400 border-emerald-400/30 hover:bg-emerald-400/10' },
  REGISTRATION_OPEN: { label: 'Close Registration', status: 'REGISTRATION_CLOSED', color: 'text-amber-400 border-amber-400/30 hover:bg-amber-400/10' },
  REGISTRATION_CLOSED: { label: '🔴 Go Live', status: 'LIVE', color: 'text-red-400 border-red-400/30 hover:bg-red-400/10' },
  LIVE: { label: 'End Competition', status: 'COMPLETED', color: 'text-[#8b949e] border-[#30363d] hover:text-white' },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPanel() {
  const { data: session, status: authStatus } = useSession();

  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedMsg, setSeedMsg] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<NewCompForm>(emptyForm);
  const [activeTab, setActiveTab] = useState<'competitions' | 'tools'>('competitions');

  // ── Auth guard ────────────────────────────────────────────────────────────
  const isAdmin = session?.user?.role === 'admin';

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchCompetitions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/competitions?limit=100');
      const data = await res.json();
      setCompetitions(data.competitions ?? []);
    } catch {
      /* ignore — show empty state */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchCompetitions();
  }, [isAdmin, fetchCompetitions]);

  // ── Status transition ─────────────────────────────────────────────────────
  const updateStatus = async (id: string, status: string) => {
    setSaving(true);
    try {
      await fetch(`/api/competitions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setCompetitions(prev => prev.map(c => c._id === id ? { ...c, status: status as any } : c));
    } finally {
      setSaving(false);
    }
  };

  // ── Cancel ────────────────────────────────────────────────────────────────
  const cancelComp = async (id: string) => {
    if (!confirm('Cancel this competition? This cannot be undone.')) return;
    await fetch(`/api/competitions/${id}`, { method: 'DELETE' });
    setCompetitions(prev => prev.map(c => c._id === id ? { ...c, status: 'CANCELLED' } : c));
  };

  // ── Create ────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!form.name || !form.startDate) return;
    setSaving(true);
    try {
      const res = await fetch('/api/competitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          events: form.events,
          startDate: form.startDate,
          endDate: form.endDate || form.startDate,
          registrationDeadline: form.registrationDeadline || undefined,
          baseFee: form.isFree ? 0 : parseInt(form.baseFee) * 100,   // convert to paise
          perEventFee: form.isFree ? 0 : parseInt(form.perEventFee) * 100,
          isFree: form.isFree,
          competitionType: form.isPractice ? 'PRACTICE' : 'STANDARD',
          maxEntries: parseInt(form.maxEntries) || 64,
          rounds: parseInt(form.rounds) || 1,
          prize: form.prize,
        }),
      });
      if (res.ok) {
        const { competition } = await res.json();
        setCompetitions(prev => [competition, ...prev]);
        setForm(emptyForm);
        setShowCreate(false);
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Seed ─────────────────────────────────────────────────────────────────
  const handleSeed = async () => {
    setSeedLoading(true);
    setSeedMsg('');
    try {
      const res = await fetch('/api/admin/seed', { method: 'POST' });
      const data = await res.json();
      setSeedMsg(data.message);
      fetchCompetitions();
    } finally {
      setSeedLoading(false);
    }
  };

  // ── Auth states ───────────────────────────────────────────────────────────
  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center">
        <RefreshCw size={24} className="text-[#00dbe7] animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center">
        <div className="text-center text-[#8b949e]">
          <Shield size={40} className="mx-auto mb-3 opacity-30" />
          <p className="mb-3">Sign in to access the admin panel</p>
          <button
            onClick={() => signIn()}
            className="px-4 py-2 rounded-xl bg-[#00dbe7]/10 border border-[#00dbe7]/30 text-[#00dbe7] text-sm font-bold hover:bg-[#00dbe7]/20 transition-all"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center">
        <div className="text-center text-[#8b949e]">
          <Shield size={40} className="mx-auto mb-3 opacity-30" />
          <p className="mb-1">Admin access required</p>
          <p className="text-xs font-mono text-red-400/80">Your role: {session.user?.role ?? 'ATHLETE'}</p>
          <Link href="/" className="mt-3 inline-block text-[#00dbe7] text-sm underline">Go home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0e11] text-white">
      {/* Header */}
      <div className="bg-[#0d1117] border-b border-[#21262d] px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-amber-400" />
            <h1 className="text-xl font-black text-white">Admin Panel</h1>
            <span className="text-[10px] font-mono text-amber-400 border border-amber-400/30 px-2 py-0.5 rounded-full">
              {session.user?.email}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchCompetitions}
              className="p-2 rounded-lg text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-all"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00dbe7]/10 border border-[#00dbe7]/30 text-[#00dbe7] text-sm font-bold hover:bg-[#00dbe7]/20 transition-all"
            >
              <Plus size={14} /> New Competition
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto flex gap-1 mt-3">
          {[
            { id: 'competitions', label: 'Competitions', count: competitions.length },
            { id: 'tools', label: 'Dev Tools' },
          ].map(({ id, label, count }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === id ? 'bg-[#21262d] text-white' : 'text-[#8b949e] hover:text-white'
              }`}
            >
              {label}
              {count != null && (
                <span className="text-[10px] bg-[#30363d] px-1.5 py-0.5 rounded-full">{count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* ── Competitions Tab ── */}
        {activeTab === 'competitions' && (
          <div className="space-y-3">
            {loading && (
              <div className="text-center py-10 text-[#8b949e]">
                <RefreshCw size={24} className="mx-auto mb-2 animate-spin opacity-40" />
                <p className="text-sm">Loading...</p>
              </div>
            )}
            {!loading && competitions.length === 0 && (
              <div className="text-center py-10 bg-[#0d1117] border border-[#21262d] rounded-2xl">
                <Database size={32} className="mx-auto mb-3 text-[#8b949e] opacity-40" />
                <p className="text-sm text-[#8b949e] mb-2">No competitions yet.</p>
                <p className="text-xs text-[#8b949e]">Use Dev Tools to seed sample data, or create one above.</p>
              </div>
            )}
            {competitions.map(comp => {
              const nextAction = NEXT_STATUS[comp.status];
              return (
                <div
                  key={comp._id}
                  className="bg-[#0d1117] border border-[#21262d] rounded-2xl p-4 hover:border-[#30363d] transition-all"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{getPuzzleEmoji(comp.events?.[0] ?? '3x3x3')}</span>
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-sm text-white">{comp.name}</h3>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusColor(comp.status)}`}>
                            {comp.status === 'LIVE' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse mr-1" />}
                            {getStatusLabel(comp.status)}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#8b949e]">
                          {comp.events?.join(', ')} · {comp.rounds} rounds ·{' '}
                          {comp.entries?.length ?? 0}/{comp.maxEntries} entries ·{' '}
                          {comp.isFree ? 'FREE' : `₹${Math.round(comp.baseFee / 100)}`}
                        </p>
                        <p className="text-[10px] text-[#8b949e] mt-0.5">
                          {new Date(comp.startDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {nextAction && (
                        <button
                          onClick={() => updateStatus(comp._id, nextAction.status)}
                          disabled={saving}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border transition-all disabled:opacity-50 ${nextAction.color}`}
                        >
                          <Zap size={11} /> {nextAction.label}
                        </button>
                      )}
                      <Link
                        href={`/compete/${comp._id}`}
                        target="_blank"
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-[#8b949e] border border-[#30363d] hover:text-white transition-all"
                      >
                        <ExternalLink size={11} /> View
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          )}

          {/* ── Dev Tools Tab ── */}
          {activeTab === 'tools' && (
            <div className="space-y-4 max-w-lg">
              <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Database size={16} className="text-[#00dbe7]" />
                  <h3 className="font-semibold text-sm text-white">Seed Sample Data</h3>
                </div>
                <p className="text-xs text-[#8b949e] mb-4">
                  Inserts 3 sample competitions (live, open, past) into MongoDB for development testing.
                  Safe to run multiple times — uses upsert by competitionId.
                </p>
                <button
                  onClick={handleSeed}
                  disabled={seedLoading}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00dbe7]/10 border border-[#00dbe7]/30 text-[#00dbe7] text-sm font-bold hover:bg-[#00dbe7]/20 transition-all disabled:opacity-50"
                >
                  {seedLoading ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
                  {seedLoading ? 'Seeding...' : 'Seed Competitions'}
                </button>
                {seedMsg && (
                  <p className="mt-3 text-xs font-mono text-emerald-400 bg-emerald-400/5 border border-emerald-400/20 rounded-lg px-3 py-2">
                    {seedMsg}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

      {/* Create Competition Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Competition" size="lg">
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-[#8b949e] mb-1 block">Competition Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 bg-[#161b22] border border-[#30363d] rounded-xl text-sm text-white focus:outline-none focus:border-[#00dbe7]"
                placeholder="Midweek Madness #26" />
            </div>
            <div>
              <label className="text-xs text-[#8b949e] mb-1 block">Start Date *</label>
              <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                className="w-full px-3 py-2 bg-[#161b22] border border-[#30363d] rounded-xl text-sm text-white focus:outline-none focus:border-[#00dbe7]" />
            </div>
            <div>
              <label className="text-xs text-[#8b949e] mb-1 block">End Date</label>
              <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                className="w-full px-3 py-2 bg-[#161b22] border border-[#30363d] rounded-xl text-sm text-white focus:outline-none focus:border-[#00dbe7]" />
            </div>
          </div>
          <div>
            <label className="text-xs text-[#8b949e] mb-2 block">Events</label>
            <div className="flex flex-wrap gap-2">
              {PUZZLE_TYPES.map(p => (
                <button key={p} type="button"
                  onClick={() => setForm(f => ({
                    ...f,
                    events: f.events.includes(p) ? f.events.filter(e => e !== p) : [...f.events, p],
                  }))}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                    form.events.includes(p)
                      ? 'bg-[#00dbe7]/20 text-[#00dbe7] border border-[#00dbe7]/40'
                      : 'bg-[#161b22] text-[#8b949e] border border-[#30363d] hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isFree}
                onChange={e => setForm(f => ({ ...f, isFree: e.target.checked }))} />
              <span className="text-sm text-white">Free competition</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isPractice}
                onChange={e => setForm(f => ({ ...f, isPractice: e.target.checked }))} />
              <span className="text-sm text-white">Practice event (unlisted — direct link only)</span>
            </label>
          </div>
          {!form.isFree && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#8b949e] mb-1 block">Base Fee (Rs.)</label>
                <input type="number" value={form.baseFee}
                  onChange={e => setForm(f => ({ ...f, baseFee: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#161b22] border border-[#30363d] rounded-xl text-sm text-white focus:outline-none focus:border-[#00dbe7]" />
              </div>
              <div>
                <label className="text-xs text-[#8b949e] mb-1 block">Per Event Fee (Rs.)</label>
                <input type="number" value={form.perEventFee}
                  onChange={e => setForm(f => ({ ...f, perEventFee: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#161b22] border border-[#30363d] rounded-xl text-sm text-white focus:outline-none focus:border-[#00dbe7]" />
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#8b949e] mb-1 block">Max Entries</label>
              <input type="number" value={form.maxEntries}
                onChange={e => setForm(f => ({ ...f, maxEntries: e.target.value }))}
                className="w-full px-3 py-2 bg-[#161b22] border border-[#30363d] rounded-xl text-sm text-white focus:outline-none focus:border-[#00dbe7]" />
            </div>
            <div>
              <label className="text-xs text-[#8b949e] mb-1 block">Rounds</label>
              <input type="number" value={form.rounds}
                onChange={e => setForm(f => ({ ...f, rounds: e.target.value }))}
                className="w-full px-3 py-2 bg-[#161b22] border border-[#30363d] rounded-xl text-sm text-white focus:outline-none focus:border-[#00dbe7]" />
            </div>
          </div>
          <div>
            <label className="text-xs text-[#8b949e] mb-1 block">Description</label>
            <textarea value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 bg-[#161b22] border border-[#30363d] rounded-xl text-sm text-white focus:outline-none focus:border-[#00dbe7] resize-none"
              placeholder="Competition description..." />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-[#21262d]">
            <button onClick={() => setShowCreate(false)}
              className="px-4 py-2 rounded-xl text-sm text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-all">
              Cancel
            </button>
            <button onClick={handleCreate} disabled={saving || !form.name}
              className="flex items-center gap-2 px-4 py-2 bg-[#00dbe7] hover:bg-[#00c4d0] text-black font-bold text-sm rounded-xl transition-all disabled:opacity-60">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {saving ? 'Creating...' : 'Create Competition'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
