'use client';
import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Calendar, Clock, Trophy, Users, ChevronLeft, ExternalLink,
  CheckCircle, Loader2, AlertCircle, Zap, Gift, FileText
} from 'lucide-react';
import { getPuzzleEmoji, getStatusLabel, getStatusColor } from '@/lib/utils/competition';

interface PageParams { params: Promise<{ id: string }> }

const DNF = 360000;
function fmtMs(ms: number) {
  if (!ms || ms >= DNF) return 'DNF';
  const s = Math.floor(ms / 1000), mm = ms % 1000;
  return `${s}.${mm.toString().padStart(3, '0')}`;
}

export default function CompetitionDetailPage({ params }: PageParams) {
  const { id } = use(params);
  const { data: session } = useSession();
  const [comp, setComp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [registered, setRegistered] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [regDone, setRegDone] = useState(false);
  const [tab, setTab] = useState<'overview' | 'results' | 'rules'>('overview');
  const [results, setResults] = useState<any[]>([]);
  const [razorpayReady, setRazorpayReady] = useState(false);

  useEffect(() => {
    fetch(`/api/competitions/${id}`)
      .then(r => r.json())
      .then(d => setComp(d.competition))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!session || !comp) return;
    const compId = comp.competitionId ?? id;
    fetch(`/api/orders?compId=${compId}`)
      .then(r => r.json())
      .then(d => setRegistered(d.registered ?? false))
      .catch(() => {});
  }, [session, comp, id]);

  useEffect(() => {
    if (!comp || tab !== 'results') return;
    const compId = comp.competitionId ?? id;
    fetch(`/api/competitions/${compId}/leaderboard`)
      .then(r => r.json())
      .then(d => setResults(d.leaderboard ?? []))
      .catch(() => {});
  }, [comp, id, tab]);

  useEffect(() => {
    if (document.getElementById('rzp-script')) { setRazorpayReady(true); return; }
    const s = document.createElement('script');
    s.id = 'rzp-script'; s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => setRazorpayReady(true);
    document.body.appendChild(s);
  }, []);

  const handleRegister = async () => {
    if (!session) return;
    setRegLoading(true); setRegError('');
    try {
      const compId = comp.competitionId ?? id;
      const res = await fetch(`/api/competitions/${compId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventIds: (comp.events ?? []).map((e: any) => e.eventId ?? e) }),
      });
      const data = await res.json();
      if (!res.ok) { setRegError(data.error ?? 'Registration failed'); return; }
      if (data.free) { setRegistered(true); setRegDone(true); return; }
      if (!razorpayReady) { setRegError('Payment gateway loading…'); return; }
      const rzp = new (window as any).Razorpay({
        key: data.keyId, amount: data.amount, currency: data.currency ?? 'INR',
        name: 'Cubelelo Events', description: comp.name ?? comp.competitionName,
        order_id: data.orderId, prefill: data.prefill, theme: { color: '#00dbe7' },
        handler: async (response: any) => {
          const v = await fetch('/api/orders/verify', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...response, competitionId: compId }),
          });
          if (v.ok) { setRegistered(true); setRegDone(true); }
          else setRegError('Payment verification failed');
        },
      });
      rzp.open();
    } catch { setRegError('Something went wrong'); }
    finally { setRegLoading(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center">
      <Loader2 size={24} className="text-[#00dbe7] animate-spin" />
    </div>
  );
  if (!comp) return (
    <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center text-[#8b949e]">
      Not found. <Link href="/compete" className="text-[#00dbe7] underline ml-1">Browse competitions</Link>
    </div>
  );

  const compName = comp.name ?? comp.competitionName;
  const events: any[] = comp.events ?? [];
  const puzzleType = comp.puzzleType ?? events[0]?.eventId ?? '3x3x3';
  const isLive = comp.status === 'LIVE';
  const isCompleted = comp.status === 'COMPLETED';
  const feeInr = comp.fee ? `₹${Math.round(comp.fee / 100)}` : 'Free';

  return (
    <div className="min-h-screen bg-[#0b0e11] text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <Link href="/compete" className="inline-flex items-center gap-1 text-[#8b949e] hover:text-white text-xs mb-8 transition-colors">
          <ChevronLeft size={14} /> All Competitions
        </Link>

        {/* Hero */}
        <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="text-5xl">{getPuzzleEmoji(puzzleType)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusColor(comp.status)}`}>
                  {isLive && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block mr-1" />}
                  {getStatusLabel(comp.status)}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">{compName}</h1>
              {comp.description && <p className="text-sm text-[#8b949e] leading-relaxed mb-3">{comp.description}</p>}
              <div className="flex flex-wrap gap-4 text-xs text-[#8b949e]">
                {comp.startDate && (
                  <span className="flex items-center gap-1.5">
                    <Calendar size={12} />
                    {new Date(comp.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {comp.endDate && comp.endDate !== comp.startDate && (
                      <> — {new Date(comp.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</>
                    )}
                  </span>
                )}
                {comp.registrationDeadline && (
                  <span className="flex items-center gap-1.5">
                    <Clock size={12} /> Reg. closes {new Date(comp.registrationDeadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                )}
                {comp.registrationCount > 0 && (
                  <span className="flex items-center gap-1.5"><Users size={12} /> {comp.registrationCount} registered</span>
                )}
              </div>
            </div>

            {/* CTA */}
            <div className="sm:text-right space-y-2 flex-shrink-0">
              {comp.fee > 0 && (
                <p className="text-xl font-black text-amber-400">{feeInr}</p>
              )}
              {registered || regDone ? (
                <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-semibold">
                  <CheckCircle size={16} /> Registered
                </div>
              ) : session ? (
                <button onClick={handleRegister} disabled={regLoading || isCompleted}
                  className="px-5 py-2.5 rounded-xl bg-[#00dbe7] hover:bg-[#00c4d0] disabled:opacity-50 text-black font-bold text-sm transition-all flex items-center gap-2">
                  {regLoading ? <Loader2 size={15} className="animate-spin" /> : null}
                  {comp.fee > 0 ? `Register — ${feeInr}` : 'Register Free'}
                </button>
              ) : (
                <Link href={`/login?callbackUrl=/competitions/${id}`}
                  className="inline-flex px-5 py-2.5 rounded-xl bg-[#00dbe7] hover:bg-[#00c4d0] text-black font-bold text-sm transition-all">
                  Sign in to Register
                </Link>
              )}
              {regError && <p className="text-xs text-red-400 max-w-[160px]">{regError}</p>}
              {(isLive || (registered && comp.status !== 'COMPLETED')) && (
                <Link href={`/compete/${id}`}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-[#30363d] text-white text-sm hover:bg-[#161b22] transition-all">
                  <Zap size={14} /> {isLive ? 'Enter Live Room' : 'Competition Room'}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Events chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          {events.map((e: any) => (
            <div key={e.eventId ?? e}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#0d1117] border border-[#21262d] rounded-lg text-xs">
              <span>{getPuzzleEmoji(e.eventId ?? e)}</span>
              <span className="font-mono text-[#8b949e]">{e.eventId ?? e}</span>
              {e.cutoff && <span className="text-amber-400">cutoff {fmtMs(e.cutoff)}</span>}
            </div>
          ))}
        </div>

        {/* Refund notice */}
        {comp.fee > 0 && !registered && (
          <div className="flex items-start gap-2 bg-amber-400/5 border border-amber-400/20 rounded-xl px-4 py-3 mb-6 text-xs text-amber-400/80">
            <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
            Registration fees are non-refundable. Please confirm your availability before registering.
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-[#0d1117] border border-[#21262d] rounded-xl p-1">
          {(['overview', 'results', 'rules'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all capitalize ${
                tab === t ? 'bg-[#161b22] text-white' : 'text-[#8b949e] hover:text-white'
              }`}>
              {t === 'results' ? '🏆 Results' : t === 'rules' ? '📋 Rules' : '📌 Overview'}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={14} className="text-[#00dbe7]" />
                <h2 className="font-semibold text-sm">Schedule</h2>
              </div>
              <div className="space-y-2 text-xs text-[#8b949e]">
                {comp.startDate && <div className="flex justify-between"><span>Start</span><span className="text-white">{new Date(comp.startDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span></div>}
                {comp.endDate && <div className="flex justify-between"><span>End</span><span className="text-white">{new Date(comp.endDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span></div>}
                {comp.registrationDeadline && <div className="flex justify-between"><span>Reg. closes</span><span className="text-white">{new Date(comp.registrationDeadline).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span></div>}
                {comp.rounds && <div className="flex justify-between"><span>Rounds</span><span className="text-white">{comp.rounds}</span></div>}
              </div>
            </div>

            <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Gift size={14} className="text-amber-400" />
                <h2 className="font-semibold text-sm">Prizes & Fees</h2>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-[#8b949e]">Entry Fee</span><span className="text-white font-semibold">{feeInr}</span></div>
                {comp.perEventFee && comp.perEventFee > 0 && (
                  <div className="flex justify-between"><span className="text-[#8b949e]">Per Event</span><span className="text-white">+₹{Math.round(comp.perEventFee / 100)}</span></div>
                )}
                {comp.prize && <div className="flex justify-between"><span className="text-[#8b949e]">Prizes</span><span className="text-white">{comp.prize}</span></div>}
                {comp.maxEntries && <div className="flex justify-between"><span className="text-[#8b949e]">Max Entries</span><span className="text-white">{comp.maxEntries}</span></div>}
              </div>
            </div>

            {comp.description && (
              <div className="sm:col-span-2 bg-[#0d1117] border border-[#21262d] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <FileText size={14} className="text-[#a3fa00]" />
                  <h2 className="font-semibold text-sm">About</h2>
                </div>
                <p className="text-sm text-[#8b949e] leading-relaxed">{comp.description}</p>
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {tab === 'results' && (
          <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl overflow-hidden">
            {results.length === 0 ? (
              <div className="py-12 text-center text-[#8b949e] text-sm">
                <Trophy size={32} className="mx-auto mb-3 opacity-20" />
                No results yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-[#21262d] text-[#8b949e]">
                    <th className="px-4 py-2 text-left">#</th>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-right">ao5</th>
                    <th className="px-4 py-2 text-right">Best</th>
                  </tr></thead>
                  <tbody className="divide-y divide-[#21262d]">
                    {results.map((r: any) => (
                      <tr key={r.userId} className="hover:bg-[#161b22] transition-colors">
                        <td className="px-4 py-3 font-mono font-black">{r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : r.rank}</td>
                        <td className="px-4 py-3"><Link href={`/profile/${r.userId}`} className="text-white hover:text-[#00dbe7] font-semibold transition-colors">{r.name}</Link></td>
                        <td className={`px-4 py-3 text-right font-mono font-bold ${r.average === 'DNF' ? 'text-red-400' : 'text-white'}`}>{r.average}</td>
                        <td className="px-4 py-3 text-right font-mono text-[#8b949e]">{r.best}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Rules */}
        {tab === 'rules' && (
          <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl p-6 text-sm text-[#8b949e] space-y-3 leading-relaxed">
            {comp.rules ? (
              <div className="whitespace-pre-wrap">{comp.rules}</div>
            ) : (
              <div className="space-y-3">
                {[
                  'All solves must be performed using the built-in timer on this platform.',
                  'WCA inspection time (15 seconds) is mandatory. +2 penalty applies at 15s, DNF at 17s.',
                  'Video proof is required for podium finishes. External links only (YouTube / Google Drive).',
                  'Results marked as statistical outliers will be reviewed by a judge before publication.',
                  'Any attempt to manipulate results will result in disqualification.',
                  'The format is Average of 5 (ao5). The best and worst solves are trimmed.',
                  'Appeals must be submitted within 24 hours of results publication.',
                ].map((rule, i) => (
                  <p key={i}><span className="text-[#00dbe7] font-mono mr-2">{String(i + 1).padStart(2, '0')}.</span>{rule}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* View lobby CTA */}
        {registered && (
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/compete/${id}/lobby`}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#30363d] text-sm text-[#8b949e] hover:text-white hover:bg-[#161b22] transition-all">
              <Users size={14} /> View Lobby
            </Link>
            <Link href={`/compete/${id}/results`}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#30363d] text-sm text-[#8b949e] hover:text-white hover:bg-[#161b22] transition-all">
              <Trophy size={14} /> Results
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
