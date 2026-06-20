'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Trophy, Users, Clock, ChevronLeft, Wifi, Send,
  MessageSquare, CheckCircle, AlertCircle, Video, Loader2
} from 'lucide-react';
import { getPuzzleEmoji } from '@/lib/utils/competition';

const TimerDisplay = dynamic(() => import('@/components/TimerDisplay'), { ssr: false });
const ScrambleVisualizer = dynamic(() => import('@/components/ScrambleVisualizer'), { ssr: false });

const DNF_SENTINEL = 360000;

function formatTime(ms: number | null): string {
  if (ms === null || ms >= DNF_SENTINEL) return 'DNF';
  const s = Math.floor(ms / 1000);
  const milli = ms % 1000;
  const min = Math.floor(s / 60);
  if (min > 0) {
    return `${min}:${(s % 60).toString().padStart(2, '0')}.${milli.toString().padStart(3, '0')}`;
  }
  return `${s}.${milli.toString().padStart(3, '0')}`;
}

function computeAo5Display(vals: (number | null)[]): string {
  const filled = vals.filter(v => v !== null) as number[];
  if (filled.length < 5) return '—';
  const sorted = [...filled].sort((a, b) => a - b);
  const middle = sorted.slice(1, 4);
  const dnfCount = filled.filter(v => v >= DNF_SENTINEL).length;
  if (dnfCount >= 2) return 'DNF';
  const sum = middle.reduce((a, b) => a + b, 0);
  return formatTime(Math.round(sum / 3));
}

const MOCK_CHAT = [
  { id: 1, user: 'Rohan M.', msg: 'Good luck everyone! 🧊', time: '2m ago', isSystem: false },
  { id: 2, user: 'Priya S.', msg: 'This scramble is tough 😅', time: '1m ago', isSystem: false },
  { id: 3, user: 'System', msg: 'Round opens now — timer armed', time: 'now', isSystem: true },
];

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  average: string;
  best: string;
  solves: string[];
  flagStatus?: string;
}

interface PageParams {
  params: Promise<{ id: string }>;
}

export default function LiveCompetitionRoom({ params }: PageParams) {
  const { id } = use(params);
  const { data: session } = useSession();

  const [competition, setCompetition] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [registered, setRegistered] = useState(false);
  const [registeredEvents, setRegisteredEvents] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [scramble, setScramble] = useState<string>('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [chatMsg, setChatMsg] = useState('');
  const [chatHistory, setChatHistory] = useState(MOCK_CHAT);

  const [solves, setSolves] = useState<(number | null)[]>([null, null, null, null, null]);
  const [currentSolveIdx, setCurrentSolveIdx] = useState(0);
  const [showVideoPrompt, setShowVideoPrompt] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [videoLink, setVideoLink] = useState('');
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');

  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [razorpayReady, setRazorpayReady] = useState(false);
  const [showRefundNotice, setShowRefundNotice] = useState(false);

  useEffect(() => {
    fetch(`/api/competitions/${id}`)
      .then(r => r.json())
      .then(d => {
        const comp = d.competition;
        setCompetition(comp);
        if (comp?.events?.[0]) setSelectedEvent(comp.events[0].eventId ?? comp.events[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!session?.user?.email || !competition) return;
    const compId = competition.competitionId ?? id;
    fetch(`/api/orders?compId=${compId}`)
      .then(r => r.json())
      .then(d => {
        const isReg = d.registered ?? false;
        setRegistered(isReg);
        if (isReg && typeof window !== 'undefined') {
          const seen = localStorage.getItem('cl_onboarding_done');
          if (!seen) setShowOnboarding(true);
        }
        setRegisteredEvents(d.events ?? []);
      })
      .catch(() => {});
  }, [session, competition, id]);

  useEffect(() => {
    if (document.getElementById('razorpay-script')) { setRazorpayReady(true); return; }
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => setRazorpayReady(true);
    document.body.appendChild(script);
  }, []);

  const fetchLeaderboard = useCallback(() => {
    if (!competition) return;
    const compId = competition.competitionId ?? id;
    fetch(`/api/competitions/${compId}/leaderboard?eventId=${selectedEvent}`)
      .then(r => r.json())
      .then(d => setLeaderboard(d.leaderboard ?? []))
      .catch(() => {});
  }, [competition, id, selectedEvent]);

  useEffect(() => {
    fetchLeaderboard();
    const t = setInterval(fetchLeaderboard, 10000);
    return () => clearInterval(t);
  }, [fetchLeaderboard]);

  useEffect(() => {
    if (!selectedEvent) return;
    import('@/lib/cube').then(m => {
      setScramble(m.generateScramble(selectedEvent));
    }).catch(() => setScramble('R U R\' U R U2 R\''));
  }, [selectedEvent, currentSolveIdx]);

  const handleRegister = async () => {
    if (!session) return;
    // Show non-refundable notice for paid competitions before proceeding
    if (competition.fee > 0 && !showRefundNotice) {
      setShowRefundNotice(true);
      return;
    }
    setShowRefundNotice(false);
    setRegLoading(true);
    setRegError('');
    try {
      const compId = competition.competitionId ?? id;
      const res = await fetch(`/api/competitions/${compId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventIds: competition.events?.map((e: any) => e.eventId ?? e) ?? [] }),
      });
      const data = await res.json();
      if (!res.ok) { setRegError(data.error ?? 'Registration failed'); return; }
      if (data.free) { setRegistered(true); return; }
      if (!razorpayReady) { setRegError('Payment gateway loading...'); return; }
      const rzp = new (window as any).Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency ?? 'INR',
        name: 'Cubelelo Events',
        description: competition.name,
        order_id: data.orderId,
        prefill: data.prefill,
        theme: { color: '#00dbe7' },
        handler: async (response: any) => {
          const verify = await fetch('/api/orders/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              competitionId: compId,
            }),
          });
          if (verify.ok) setRegistered(true);
          else setRegError('Payment verification failed. Contact support.');
        },
      });
      rzp.open();
    } catch {
      setRegError('Something went wrong');
    } finally {
      setRegLoading(false);
    }
  };

  const handleSolveComplete = (timeMs: number) => {
    setSolves(prev => {
      const next = [...prev];
      next[currentSolveIdx] = timeMs;
      return next;
    });
    if (currentSolveIdx < 4) {
      setCurrentSolveIdx(i => i + 1);
    } else {
      setShowVideoPrompt(true);
    }
  };

  const handleSubmitResult = async () => {
    setSubmitState('submitting');
    try {
      const compId = competition.competitionId ?? id;
      const [v1, v2, v3, v4, v5] = solves.map(s => s ?? DNF_SENTINEL);
      const res = await fetch(`/api/competitions/${compId}/results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: selectedEvent,
          value1: v1, value2: v2, value3: v3, value4: v4, value5: v5,
          plus2Array: [],
          videoLink: videoLink || null,
        }),
      });
      if (res.ok) {
        setSubmitState('done');
        fetchLeaderboard();
      } else {
        setSubmitState('error');
      }
    } catch {
      setSubmitState('error');
    }
  };

  const sendChat = () => {
    if (!chatMsg.trim()) return;
    setChatHistory(prev => [...prev, {
      id: prev.length + 1,
      user: session?.user?.name ?? 'You',
      msg: chatMsg,
      time: 'now',
      isSystem: false,
    }]);
    setChatMsg('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center">
        <Loader2 size={24} className="text-[#00dbe7] animate-spin" />
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center text-[#8b949e]">
        Competition not found.{' '}
        <Link href="/compete" className="text-[#00dbe7] underline ml-1">Back to lobby</Link>
      </div>
    );
  }

  const isLive = competition.status === 'LIVE';
  const compName = competition.name ?? competition.competitionName;
  const puzzleType = competition.puzzleType ?? selectedEvent ?? '3x3x3';
  const filledSolves = solves.filter(s => s !== null).length;


  // ── Onboarding modal (shown once for first-time competitors) ─────────────────
  const ONBOARDING_STEPS = [
    {
      title: '1. Inspection Time',
      icon: '👀',
      content: 'Before each solve, you have up to 15 seconds to inspect the scrambled cube. A +2 penalty is added if you exceed 15s, and a DNF if you exceed 17s. The countdown starts automatically when the scramble is revealed.',
    },
    {
      title: '2. Starting & Stopping the Timer',
      icon: '⏱️',
      content: 'Hold the SPACEBAR (or place two fingers on screen) until the display turns green — that is the "armed" state. Release to start the timer. Press SPACEBAR again (or tap) to stop it when your cube is solved.',
    },
    {
      title: '3. Submitting Your Result',
      icon: '✅',
      content: 'After all 5 solves, your ao5 is calculated automatically. You will be prompted to paste a video link (YouTube or Google Drive). Submit when ready. Your result appears on the live leaderboard instantly.',
    },
  ];

  if (showOnboarding) {
    const step = ONBOARDING_STEPS[onboardingStep];
    const isLast = onboardingStep === ONBOARDING_STEPS.length - 1;
    return (
      <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-[#0d1117] border border-[#21262d] rounded-2xl p-8 space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#8b949e]">
              Before you compete — step {onboardingStep + 1} of {ONBOARDING_STEPS.length}
            </span>
            <button onClick={() => { localStorage.setItem('cl_onboarding_done', '1'); setShowOnboarding(false); }}
              className="text-xs text-[#8b949e] hover:text-white transition-colors">Skip</button>
          </div>

          <div className="text-center space-y-3">
            <div className="text-5xl">{step.icon}</div>
            <h2 className="text-xl font-black text-white">{step.title}</h2>
            <p className="text-sm text-[#8b949e] leading-relaxed">{step.content}</p>
          </div>

          {/* Step indicators */}
          <div className="flex justify-center gap-2">
            {ONBOARDING_STEPS.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === onboardingStep ? 'w-6 bg-[#00dbe7]' : 'w-2 bg-[#30363d]'}`} />
            ))}
          </div>

          <div className="flex gap-3">
            {onboardingStep > 0 && (
              <button onClick={() => setOnboardingStep(s => s - 1)}
                className="flex-1 py-2.5 rounded-xl border border-[#30363d] text-sm text-[#8b949e] hover:text-white transition-all">
                Back
              </button>
            )}
            {!isLast ? (
              <button onClick={() => setOnboardingStep(s => s + 1)}
                className="flex-1 py-2.5 rounded-xl bg-[#00dbe7] text-black font-bold text-sm hover:bg-[#00dbe7]/80 transition-all">
                Next
              </button>
            ) : (
              <button onClick={() => { localStorage.setItem('cl_onboarding_done', '1'); setShowOnboarding(false); }}
                className="flex-1 py-2.5 rounded-xl bg-[#00dbe7] text-black font-bold text-sm hover:bg-[#00dbe7]/80 transition-all">
                Let's Compete! 🎉
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!registered) {
    return (
      <div className="min-h-screen bg-[#0b0e11] text-white">
        <div className="max-w-2xl mx-auto px-4 py-16">
          <Link href="/compete" className="inline-flex items-center gap-1 text-[#8b949e] hover:text-white text-xs mb-8 transition-colors">
            <ChevronLeft size={14} /> Back to competitions
          </Link>

          {/* Non-refundable notice modal */}
          {showRefundNotice && (
            <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
              <div className="bg-[#0d1117] border border-amber-400/30 rounded-2xl p-8 max-w-sm w-full">
                <div className="text-3xl mb-4 text-center">⚠️</div>
                <h2 className="text-lg font-black text-white mb-3 text-center">Before You Pay</h2>
                <p className="text-sm text-[#8b949e] mb-2 text-center">
                  Registration fee: <span className="text-white font-bold">₹{Math.round(competition.fee / 100)}</span>
                </p>
                <div className="bg-amber-400/10 border border-amber-400/20 rounded-xl p-4 mb-6">
                  <p className="text-xs text-amber-400 font-semibold text-center">
                    ⚠️ Registration fees are non-refundable. Once paid, no refunds will be issued under any circumstance.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowRefundNotice(false)}
                    className="flex-1 py-2.5 rounded-xl border border-[#30363d] text-sm text-[#8b949e] hover:text-white transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleRegister} disabled={regLoading}
                    className="flex-1 py-2.5 rounded-xl bg-[#00dbe7] text-black font-bold text-sm hover:bg-[#00c4d0] transition-colors disabled:opacity-50">
                    {regLoading ? 'Processing…' : 'I Understand — Pay Now'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl p-8 text-center">
            <div className="text-4xl mb-4">{getPuzzleEmoji(puzzleType)}</div>
            <h1 className="text-2xl font-black text-white mb-2">{compName}</h1>
            <p className="text-[#8b949e] text-sm mb-6">
              {isLive ? 'This competition is live!' : 'Register to compete in this event.'}
            </p>
            {competition.events && competition.events.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center mb-6">
                {competition.events.map((e: any) => (
                  <span key={e.eventId ?? e}
                    className="px-3 py-1 rounded-full bg-[#161b22] border border-[#30363d] text-xs text-[#8b949e] font-mono">
                    {e.eventId ?? e}
                  </span>
                ))}
              </div>
            )}
            {competition.fee > 0 && (
              <p className="text-sm text-amber-400 font-semibold mb-4">
                Entry fee: ₹{Math.round(competition.fee / 100)}
              </p>
            )}
            {!session ? (
              <Link href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#00dbe7] hover:bg-[#00c4d0] text-black font-bold rounded-xl transition-all">
                Sign in to Register
              </Link>
            ) : (
              <>
                <button onClick={handleRegister} disabled={regLoading}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#00dbe7] hover:bg-[#00c4d0] disabled:opacity-50 text-black font-bold rounded-xl transition-all">
                  {regLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                  {competition.fee > 0 ? `Register — ₹${Math.round(competition.fee / 100)}` : 'Register Free'}
                </button>
                {regError && <p className="mt-3 text-xs text-red-400">{regError}</p>}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Round Window Enforcement (PRD Must Have) ─────────────────────────────────
  // When registered but competition is not LIVE, show waiting screen with status
  if (registered && !isLive && submitState === 'idle') {
    const statusLabel: Record<string, string> = {
      UPCOMING: 'Upcoming',
      DRAFT: 'Draft',
      REGISTRATION_OPEN: 'Registration Open',
      RESULTS_PENDING: 'Results Pending',
      COMPLETED: 'Completed',
    };
    const label = statusLabel[competition.status] ?? competition.status;
    const isCompleted = competition.status === 'COMPLETED' || competition.status === 'RESULTS_PENDING';
    return (
      <div className="min-h-screen bg-[#0b0e11] text-white flex items-center justify-center">
        <div className="max-w-md w-full mx-4 text-center">
          <div className="text-5xl mb-6">{isCompleted ? '🏁' : '⏳'}</div>
          <h1 className="text-2xl font-black text-white mb-2">{compName}</h1>
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-6 ${
            isCompleted
              ? 'bg-gray-500/10 border border-gray-500/30 text-gray-400'
              : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-gray-400' : 'bg-amber-400 animate-pulse'}`} />
            {label}
          </div>
          {isCompleted ? (
            <p className="text-[#8b949e] text-sm mb-6">This competition has ended. Check the results below.</p>
          ) : (
            <p className="text-[#8b949e] text-sm mb-6">
              You&apos;re registered! The timer will unlock when the admin opens the round.
              <br />
              <span className="text-xs text-[#8b949e]/70 mt-1 block">Scramble is hidden until the round opens.</span>
            </p>
          )}
          <div className="flex gap-3 justify-center">
            <Link href={`/compete/${id}/results`}
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-[#30363d] rounded-xl text-sm text-[#8b949e] hover:text-white transition-colors">
              <Trophy size={14} /> Results
            </Link>
            <Link href="/compete"
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-[#30363d] rounded-xl text-sm text-[#8b949e] hover:text-white transition-colors">
              <ChevronLeft size={14} /> All Competitions
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (submitState === 'done') {
    return (
      <div className="min-h-screen bg-[#0b0e11] text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <CheckCircle size={48} className="text-emerald-400 mx-auto mb-4" />
          <h2 className="text-2xl font-black mb-2">Result Submitted!</h2>
          <p className="text-[#8b949e] text-sm mb-2">ao5: {computeAo5Display(solves)}</p>
          <div className="flex gap-2 justify-center flex-wrap mb-6">
            {solves.map((s, i) => (
              <span key={i} className="font-mono text-sm px-3 py-1.5 bg-[#161b22] rounded-lg border border-[#30363d]">
                {formatTime(s)}
              </span>
            ))}
          </div>
          <Link href={`/compete/${id}/results`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#00dbe7] hover:bg-[#00c4d0] text-black font-bold rounded-xl transition-all">
            <Trophy size={16} /> View Leaderboard
          </Link>
        </div>
      </div>
    );
  }

  if (showVideoPrompt) {
    return (
      <div className="min-h-screen bg-[#0b0e11] text-white flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <Video size={24} className="text-[#00dbe7]" />
              <div>
                <h2 className="font-bold text-white">Submit Video Proof</h2>
                <p className="text-xs text-[#8b949e]">Optional but recommended for top results</p>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-xs text-[#8b949e] mb-1">Your times:</p>
              <div className="flex gap-2 flex-wrap">
                {solves.map((s, i) => (
                  <span key={i} className="font-mono text-sm px-2.5 py-1 bg-[#161b22] rounded-lg border border-[#30363d]">
                    {formatTime(s)}
                  </span>
                ))}
              </div>
              <p className="text-sm font-bold text-[#00dbe7] mt-2">ao5: {computeAo5Display(solves)}</p>
            </div>
            <div className="mb-6">
              <label className="block text-xs text-[#8b949e] mb-1.5">
                YouTube / Google Drive link (external links only)
              </label>
              <input
                type="url"
                value={videoLink}
                onChange={e => setVideoLink(e.target.value)}
                placeholder="https://youtu.be/..."
                className="w-full px-3 py-2 bg-[#0b0e11] border border-[#30363d] rounded-lg text-sm text-white placeholder-[#8b949e] focus:outline-none focus:border-[#00dbe7] transition-colors"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={handleSubmitResult} disabled={submitState === 'submitting'}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#00dbe7] hover:bg-[#00c4d0] disabled:opacity-50 text-black font-bold rounded-xl transition-all">
                {submitState === 'submitting' ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                Submit Result
              </button>
              <button onClick={() => { setVideoLink(''); handleSubmitResult(); }}
                className="px-4 py-3 border border-[#30363d] rounded-xl text-xs text-[#8b949e] hover:text-white transition-colors">
                Skip
              </button>
            </div>
            {submitState === 'error' && (
              <div className="mt-3 flex items-center gap-2 text-red-400 text-xs">
                <AlertCircle size={14} /> Failed to submit. Please try again.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0e11] text-white">
      <div className="bg-[#0d1117] border-b border-[#21262d] sticky top-14 z-20 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-4 flex-wrap">
          <Link href="/compete" className="flex items-center gap-1 text-[#8b949e] hover:text-white text-xs transition-colors">
            <ChevronLeft size={14} /> Lobby
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-lg">{getPuzzleEmoji(puzzleType)}</span>
            <span className="font-semibold text-sm text-white">{compName}</span>
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
              isLive
                ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
              {isLive ? 'LIVE' : competition.status}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-4 text-xs text-[#8b949e]">
            <span className="flex items-center gap-1"><Users size={12} /> {leaderboard.length} competing</span>
            <span className="text-emerald-400 font-mono">Solve {filledSolves + 1} / 5</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="grid lg:grid-cols-12 gap-4">

          <div className="lg:col-span-5 space-y-4">
            {registeredEvents.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {registeredEvents.map(ev => (
                  <button key={ev} onClick={() => { setSelectedEvent(ev); setCurrentSolveIdx(0); setSolves([null, null, null, null, null]); }}
                    className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${
                      selectedEvent === ev
                        ? 'bg-[#00dbe7]/20 border border-[#00dbe7]/50 text-[#00dbe7]'
                        : 'bg-[#161b22] border border-[#30363d] text-[#8b949e] hover:text-white'
                    }`}>{ev}</button>
                ))}
              </div>
            )}

            <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-mono uppercase tracking-widest text-[#8b949e]">
                  Solve {currentSolveIdx + 1} of 5 · Scramble
                </p>
                <Wifi size={12} className="text-emerald-400" />
              </div>
              <p className="font-mono text-sm text-white leading-relaxed break-all">{scramble}</p>
            </div>

            <ScrambleVisualizer puzzleType={puzzleType} scramble={scramble} />
            <TimerDisplay onSolveComplete={handleSolveComplete} />

            <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl p-4">
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#8b949e] mb-3">
                Progress — ao5: {computeAo5Display(solves)}
              </p>
              <div className="flex gap-2 flex-wrap">
                {solves.map((s, i) => (
                  <div key={i} className={`px-3 py-1.5 rounded-lg border transition-colors ${
                    s !== null ? 'bg-[#161b22] border-[#30363d]' :
                    i === currentSolveIdx ? 'border-[#00dbe7]/50 bg-[#00dbe7]/5' :
                    'border-dashed border-[#30363d] bg-[#0d1117]'
                  }`}>
                    <span className="text-[10px] text-[#8b949e] mr-1">#{i + 1}</span>
                    <span className="font-mono text-sm font-bold text-white">
                      {s !== null ? formatTime(s) : i === currentSolveIdx ? '…' : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[#21262d]">
                <Trophy size={14} className="text-amber-400" />
                <h2 className="font-semibold text-sm text-white">Live Leaderboard</h2>
                <span className="ml-auto text-[10px] text-[#8b949e] font-mono">~10s refresh</span>
              </div>
              {leaderboard.length === 0 ? (
                <div className="px-4 py-8 text-center text-[#8b949e] text-xs">No results yet — be first!</div>
              ) : (
                <div className="divide-y divide-[#21262d]">
                  {leaderboard.map(entry => (
                    <div key={entry.userId} className="flex items-center gap-3 px-4 py-3 hover:bg-[#161b22] transition-colors">
                      <span className={`w-6 text-center font-black text-sm font-mono ${
                        entry.rank === 1 ? 'text-amber-400' : entry.rank === 2 ? 'text-slate-300' :
                        entry.rank === 3 ? 'text-amber-600' : 'text-[#8b949e]'
                      }`}>
                        {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
                      </span>
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#00dbe7] to-[#a3fa00] flex items-center justify-center text-black font-bold text-[10px] flex-shrink-0">
                        {(entry.name || '?')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{entry.name}</p>
                        <p className="text-[10px] text-[#8b949e]">ao5: {entry.average} &middot; Best: {entry.best}</p>
                      </div>
                      {entry.flagStatus === 'flagged' && (
                        <span className="text-[10px] text-red-400">🚩</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat / Leaderboard sidebar */}
          <div className="lg:col-span-3 space-y-4">
            {/* Live Leaderboard */}
            <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[#21262d]">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-white">Live Leaderboard</span>
              </div>
              <div className="divide-y divide-[#21262d] max-h-72 overflow-y-auto">
                {leaderboard.length === 0 ? (
                  <p className="text-center py-6 text-xs text-[#8b949e]">No submissions yet</p>
                ) : leaderboard.map((entry: any, i: number) => (
                  <div key={entry.userId ?? i} className="px-4 py-2.5 flex items-center gap-3">
                    <span className={`text-xs font-black w-5 text-center ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-[#8b949e]' : i === 2 ? 'text-amber-700' : 'text-[#8b949e]'}`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{entry.firstName} {entry.lastName}</p>
                      <p className="text-[10px] text-[#8b949e]">Best: {entry.bestTime < 360000 ? formatTime(entry.bestTime) : 'DNF'}</p>
                    </div>
                    <span className="text-xs font-mono text-[#00dbe7]">
                      {entry.averageTime && entry.averageTime < 360000 ? formatTime(entry.averageTime) : entry.bestTime < 360000 ? formatTime(entry.bestTime) : 'DNF'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Round Info */}
            <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl p-4">
              <p className="text-xs font-bold text-white mb-3">Round Info</p>
              <div className="space-y-2 text-xs text-[#8b949e]">
                <div className="flex justify-between">
                  <span>Event</span>
                  <span className="font-mono text-white">{selectedEvent}</span>
                </div>
                <div className="flex justify-between">
                  <span>Format</span>
                  <span className="font-mono text-white">ao5</span>
                </div>
                <div className="flex justify-between">
                  <span>Status</span>
                  <span className={`font-mono ${isLive ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {isLive ? 'LIVE' : 'Waiting'}
                  </span>
                </div>
                {competition?.timeLimit && (
                  <div className="flex justify-between">
                    <span>Time Limit</span>
                    <span className="font-mono text-white">{formatTime(competition.timeLimit)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Refund Notice Modal */}
      {showRefundNotice && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400 text-lg">⚠</div>
              <h2 className="font-black text-white">Non-Refundable</h2>
            </div>
            <p className="text-sm text-[#8b949e] mb-6">
              Registration fees are <strong className="text-white">non-refundable</strong> once payment is made. Please ensure you can participate before proceeding.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowRefundNotice(false)}
                className="flex-1 px-4 py-2 border border-[#30363d] rounded-xl text-sm text-[#8b949e] hover:text-white transition-all">
                Cancel
              </button>
              <button onClick={handleRegister}
                className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white font-bold text-sm rounded-xl transition-all">
                I Understand — Pay Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
