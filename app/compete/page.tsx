'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Trophy, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import CompetitionCard from '@/components/ui/CompetitionCard';
import Modal from '@/components/ui/Modal';
import { useSession, signIn } from 'next-auth/react';
import {
  CompetitionStatus,
  Competition,
  getPuzzleEmoji,
  getStatusLabel,
  getStatusColor,
  formatPrice,
} from '@/lib/utils/competition';


// ─── Filter config ────────────────────────────────────────────────────────────

const PUZZLE_FILTERS = ['All', '3x3x3', '2x2x2', '4x4x4', 'OH', 'Pyraminx', 'Megaminx'];
const STATUS_FILTERS: { label: string; value: CompetitionStatus }[] = [
  { label: 'All', value: 'ALL' },
  { label: '🔴 Live', value: 'LIVE' },
  { label: 'Open', value: 'REGISTRATION_OPEN' },
  { label: 'Upcoming', value: 'REGISTRATION_CLOSED' },
  { label: 'Ended', value: 'COMPLETED' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CompeteLobby() {
  const { data: session } = useSession();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [puzzleFilter, setPuzzleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<CompetitionStatus>('ALL');
  const [registerModal, setRegisterModal] = useState<Competition | null>(null);

  const fetchCompetitions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      const res = await fetch(`/api/competitions?${params}`);
      if (!res.ok) throw new Error('Failed to load competitions');
      const data = await res.json();
      setCompetitions(data.competitions ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchCompetitions();
  }, [fetchCompetitions]);

  const filtered = competitions.filter(c => {
    const matchesPuzzle = puzzleFilter === 'All' || c.events.includes(puzzleFilter);
    const matchesSearch = !search || c.name.toLowerCase().includes(search.toLowerCase());
    return matchesPuzzle && matchesSearch;
  });

  const liveCount = competitions.filter(c => c.status === 'LIVE').length;
  const openCount = competitions.filter(c => c.status === 'REGISTRATION_OPEN').length;

  const handleRegister = (id: string) => {
    if (!session) { signIn('google'); return; }
    const comp = competitions.find(c => c._id === id);
    if (comp) setRegisterModal(comp);
  };

  return (
    <div className="min-h-screen bg-[#0b0e11] text-white">
      {/* Header */}
      <div className="bg-[#0d1117] border-b border-[#21262d] px-4 sm:px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Trophy size={20} className="text-amber-400" />
                <h1 className="text-2xl font-black text-white">Competitions</h1>
                {liveCount > 0 && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    {liveCount} LIVE
                  </span>
                )}
              </div>
              <p className="text-sm text-[#8b949e]">
                {openCount} open · WCA-style online events
              </p>
            </div>
            <button
              onClick={fetchCompetitions}
              className="p-2 rounded-lg text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-all"
              title="Refresh"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Search + Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b949e]" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search competitions..."
                className="w-full pl-8 pr-3 py-2 bg-[#161b22] border border-[#30363d] rounded-xl text-sm text-white placeholder-[#8b949e] focus:outline-none focus:border-[#00dbe7] transition-colors"
              />
            </div>

            <div className="flex gap-1.5 flex-wrap">
              {STATUS_FILTERS.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setStatusFilter(value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    statusFilter === value
                      ? 'bg-[#00dbe7] text-black font-bold'
                      : 'bg-[#161b22] text-[#8b949e] border border-[#30363d] hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex gap-1.5 flex-wrap ml-auto">
              {PUZZLE_FILTERS.map(p => (
                <button
                  key={p}
                  onClick={() => setPuzzleFilter(p)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                    puzzleFilter === p
                      ? 'bg-amber-400/20 text-amber-400 border border-amber-400/40'
                      : 'text-[#8b949e] hover:text-white'
                  }`}
                >
                  {p === 'All' ? p : `${getPuzzleEmoji(p)} ${p}`}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Competitio
      {/* Competition Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {loading && (
          <div className="text-center py-16 text-[#8b949e]">
            <RefreshCw size={32} className="mx-auto mb-3 animate-spin opacity-40" />
            <p className="text-sm">Loading competitions...</p>
          </div>
        )}
        {error && !loading && (
          <div className="text-center py-16">
            <WifiOff size={40} className="mx-auto mb-3 text-red-400/40" />
            <p className="text-sm text-red-400">{error}</p>
            <p className="text-xs text-[#8b949e] mt-1">Make sure MONGODB_URI is set in your .env</p>
            <button onClick={fetchCompetitions} className="mt-4 px-4 py-2 rounded-xl text-xs text-[#00dbe7] border border-[#00dbe7]/30 hover:bg-[#00dbe7]/10 transition-all">Retry</button>
          </div>
        )}
        {!loading && !error && (
          <>
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-[#8b949e]">
                <Trophy size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">{competitions.length === 0 ? 'No competitions yet.' : 'No competitions match your filters.'}</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-[#8b949e] mb-4 font-mono">Showing {filtered.length} of {competitions.length} competitions</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map(comp => (
                    <CompetitionCard
                      key={comp._id}
                      competition={{
                        id: comp._id,
                        name: comp.name,
                        description: comp.description,
                        puzzleType: comp.events[0] ?? '3x3x3',
                        events: comp.events,
                        startDate: comp.startDate,
                        endDate: comp.endDate,
                        entryFee: comp.isFree ? 0 : comp.baseFee,
                        maxEntries: comp.maxEntries,
                        currentEntries: comp.currentEntries ?? 0,
                        status: comp.status,
                        rounds: comp.rounds,
                        currentRound: comp.currentRound ?? 1,
                        prize: comp.prizePool ? formatPrice(comp.prizePool) : undefined,
                      }}
                      onRegister={() => handleRegister(comp._id)}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <Modal isOpen={registerModal !== null} onClose={() => setRegisterModal(null)} title={`Register — ${registerModal?.name}`} size="md">
        {registerModal && (
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3 p-3 bg-[#161b22] rounded-xl border border-[#21262d]">
              <span className="text-2xl">{getPuzzleEmoji(registerModal.events[0])}</span>
              <div>
                <p className="text-sm font-semibold text-white">{registerModal.name}</p>
                <p className="text-xs text-[#8b949e]">{registerModal.events.join(', ')} · {registerModal.rounds} round{registerModal.rounds !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-[#21262d]">
                <span className="text-[#8b949e]">Entry Fee</span>
                <span className="font-bold text-white">{registerModal.isFree ? 'FREE' : `₹${registerModal.baseFee}`}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#21262d]">
                <span className="text-[#8b949e]">Registered as</span>
                <span className="font-semibold text-[#00dbe7]">{session?.user?.name}</span>
              </div>
            </div>
            <button onClick={() => { alert('Registration coming soon.'); setRegisterModal(null); }}
              className="w-full py-3 rounded-xl bg-[#00dbe7]/10 border border-[#00dbe7]/30 text-[#00dbe7] font-bold text-sm hover:bg-[#00dbe7]/20 transition-all">
              {registerModal.isFree ? 'Register Free' : `Pay ₹${registerModal.baseFee} & Register`}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
