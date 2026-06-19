'use client';

import React, { useState, useEffect, use } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Trophy, Users, Clock, ChevronLeft, Wifi, Send, MessageSquare
} from 'lucide-react';
import { getPuzzleEmoji } from '@/app/compete/page';

interface MockLeaderboardEntry {
  rank: number; userId: string; name: string; avatar: string;
  ao5: number | null; best: number | null; status: string;
}
import { generateScramble } from '@/lib/cube';

const TimerDisplay = dynamic(() => import('@/components/TimerDisplay'), { ssr: false });
const ScrambleVisualizer = dynamic(() => import('@/components/ScrambleVisualizer'), { ssr: false });

// Format ms to time string
function formatTime(ms: number | null): string {
  if (ms === null) return 'DNF';
  const s = Math.floor(ms / 1000);
  const milli = ms % 1000;
  return `${s}.${milli.toString().padStart(3, '0')}`;
}

// Mock chat messages
const MOCK_CHAT = [
  { id: 1, user: 'Rohan M.', msg: 'Good luck everyone! 🧊', time: '2m ago' },
  { id: 2, user: 'Priya S.', msg: 'This scramble is tough 😅', time: '1m ago' },
  { id: 3, user: 'Aditya R.', msg: '8.43 WOO!!! sub-9 done 🎉', time: '45s ago' },
  { id: 4, user: 'System', msg: 'Round 1 — 12 min remaining', time: 'now', isSystem: true },
];

interface PageParams {
  params: Promise<{ id: string }>;
}

export default function LiveCompetitionRoom({ params }: PageParams) {
  const { id } = use(params);
  const { data: session } = useSession();
  const [leaderboard, setLeaderboard] = useState<MockLeaderboardEntry[]>([]);
  const [chatMsg, setChatMsg] = useState('');
  const [chatHistory, setChatHistory] = useState(MOCK_CHAT);
  const [myAttempts, setMyAttempts] = useState<(number | null)[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(720); // 12 minutes
  const [competition, setCompetition] = useState<any>(null);

  const scramble = generateScramble(competition?.events?.[0] ?? '3x3x3');

  useEffect(() => {
    fetch(`/api/competitions/${id}`)
      .then(r => r.json())
      .then(d => setCompetition(d.competition))
      .catch(() => {});
  }, [id]);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(t => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Simulate leaderboard updates every 8s
  useEffect(() => {
    const interval = setInterval(() => {
      setLeaderboard(prev => {
        return [...prev].map(entry => ({
          ...entry,
          average: entry.average ? entry.average + Math.round((Math.random() - 0.5) * 500) : null,
        })).sort((a, b) => (a.average ?? Infinity) - (b.average ?? Infinity))
          .map((entry, i) => ({ ...entry, rank: i + 1 }));
      });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleSolveComplete = (timeMs: number) => {
    setMyAttempts(prev => [...prev, timeMs]);
  };

  const sendChat = () => {
    if (!chatMsg.trim()) return;
    setChatHistory(prev => [...prev, {
      id: prev.length + 1,
      user: session?.user?.name ?? 'You',
      msg: chatMsg,
      time: 'now',
    }]);
    setChatMsg('');
  };

  const formatCountdown = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (!competition) {
    return (
      <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center text-[#8b949e]">
        Competition not found.{' '}
        <Link href="/compete" className="text-[#00dbe7] underline ml-1">Back to lobby</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0e11] text-white">
      {/* Room Header */}
      <div className="bg-[#0d1117] border-b border-[#21262d] sticky top-14 z-20 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-4 flex-wrap">
          <Link href="/compete" className="flex items-center gap-1 text-[#8b949e] hover:text-white text-xs transition-colors">
            <ChevronLeft size={14} /> Lobby
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-lg">{getPuzzleEmoji(competition.puzzleType)}</span>
            <span className="font-semibold text-sm text-white">{competition.name}</span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              LIVE
            </span>
          </div>
          <div className="ml-auto flex items-center gap-4 text-xs text-[#8b949e]">
            <span className="flex items-center gap-1">
              <Users size={12} />
              {leaderboard.length} competing
            </span>
            <span className={`flex items-center gap-1 font-mono font-bold ${timeRemaining < 120 ? 'text-red-400' : 'text-white'}`}>
              <Clock size={12} />
              {formatCountdown(timeRemaining)}
            </span>
            <span className="text-[#00dbe7]">Round {competition.currentRound}/{competition.rounds}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="grid lg:grid-cols-12 gap-4">

          {/* Left: Scramble + Timer */}
          <div className="lg:col-span-5 space-y-4">
            {/* Scramble */}
            <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-mono uppercase tracking-widest text-[#8b949e]">
                  Attempt {myAttempts.length + 1} of 5 · Scramble
                </p>
                <Wifi size={12} className="text-emerald-400" />
              </div>
              <p className="font-mono text-sm text-white leading-relaxed">{scramble}</p>
            </div>

            <ScrambleVisualizer puzzleType={competition.puzzleType} scramble={scramble} />

            {/* Timer */}
            <TimerDisplay onSolveComplete={handleSolveComplete} />

            {/* My attempts so far */}
            {myAttempts.length > 0 && (
              <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl p-4">
                <p className="text-[10px] font-mono uppercase tracking-widest text-[#8b949e] mb-3">My Attempts</p>
                <div className="flex gap-2 flex-wrap">
                  {myAttempts.map((t, i) => (
                    <div key={i} className="px-3 py-1.5 bg-[#161b22] border border-[#30363d] rounded-lg">
                      <span className="text-[10px] text-[#8b949e] mr-1">#{i + 1}</span>
                      <span className="font-mono text-sm font-bold text-white">{formatTime(t)}</span>
                    </div>
                  ))}
                  {Array(5 - myAttempts.length).fill(null).map((_, i) => (
                    <div key={`empty-${i}`} className="px-3 py-1.5 bg-[#0d1117] border border-dashed border-[#30363d] rounded-lg">
                      <span className="text-[10px] text-[#8b949e] font-mono">#{myAttempts.length + i + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Center: Leaderboard */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[#21262d]">
                <Trophy size={14} className="text-amber-400" />
                <h2 className="font-semibold text-sm text-white">Live Leaderboard</h2>
                <span className="ml-auto text-[10px] text-[#8b949e] font-mono">Updates live</span>
              </div>
              <div className="divide-y divide-[#21262d]">
                {leaderboard.map(entry => (
                  <div
                    key={entry.user.id}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                      entry.user.email === session?.user?.email ? 'bg-[#00dbe7]/5' : 'hover:bg-[#161b22]'
                    }`}
                  >
                    <span className={`w-6 text-center font-black text-sm font-mono ${
                      entry.rank === 1 ? 'text-amber-400' :
                      entry.rank === 2 ? 'text-slate-300' :
                      entry.rank === 3 ? 'text-amber-600' : 'text-[#8b949e]'
                    }`}>
                      {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
                    </span>

                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#00dbe7] to-[#a3fa00] flex items-center justify-center text-black font-bold text-[10px] flex-shrink-0">
                      {entry.user.name[0]}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{entry.user.name}</p>
                      <p className="text-[10px] text-[#8b949e]">Best: {formatTime(entry.best)}</p>
                    </div>

                    <span className={`font-mono text-sm font-bold ${entry.average ? 'text-white' : 'text-red-400'}`}>
                      {formatTime(entry.average)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Chat */}
          <div className="lg:col-span-3">
            <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl overflow-hidden flex flex-col h-full min-h-[400px]">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[#21262d]">
                <MessageSquare size={14} className="text-[#8b949e]" />
                <h2 className="font-semibold text-sm text-white">Live Chat</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatHistory.map(msg => (
                  <div key={msg.id}>
                    {(msg as any).isSystem ? (
                      <div className="text-center">
                        <span className="text-[10px] text-[#8b949e] bg-[#161b22] px-2 py-0.5 rounded-full font-mono">{msg.msg}</span>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-baseline gap-1.5 mb-0.5">
                          <span className="text-[10px] font-bold text-[#00dbe7]">{msg.user}</span>
                          <span className="text-[9px] text-[#8b949e]">{msg.time}</span>
                        </div>
                        <p className="text-xs text-[#e1e2e7] leading-relaxed">{msg.msg}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-[#21262d] flex gap-2">
                <input
                  type="text"
                  value={chatMsg}
                  onChange={e => setChatMsg(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') sendChat(); }}
                  placeholder="Say something..."
                  className="flex-1 px-3 py-1.5 bg-[#161b22] border border-[#30363d] rounded-lg text-xs text-white placeholder-[#8b949e] focus:outline-none focus:border-[#00dbe7] transition-colors"
                />
                <button
                  onClick={sendChat}
                  className="p-1.5 rounded-lg bg-[#00dbe7]/10 border border-[#00dbe7]/30 text-[#00dbe7] hover:bg-[#00dbe7]/20 transition-all"
                >
                  <Send size={13} />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
