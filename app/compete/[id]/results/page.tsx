'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { ChevronLeft, Trophy, Download, Share2, Medal } from 'lucide-react';
import { getPuzzleEmoji } from '@/app/compete/page';

function formatTime(ms: number | null): string {
  if (ms === null) return 'DNF';
  const s = Math.floor(ms / 1000);
  const milli = ms % 1000;
  return `${s}.${milli.toString().padStart(3, '0')}`;
}

interface PageParams {
  params: Promise<{ id: string }>;
}

export default function CompetitionResults({ params }: PageParams) {
  const { id } = use(params);
  const [competition, setCompetition] = React.useState<any>(null);

  React.useEffect(() => {
    fetch(`/api/competitions/${id}`)
      .then(r => r.json())
      .then(d => setCompetition(d.competition))
      .catch(() => {});
  }, [id]);

  if (!competition) {
    return (
      <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center text-[#8b949e]">
        <span>Loading...</span>
      </div>
    );
  }

  const sorted: any[] = competition.solveResults ?? [];

  return (
    <div className="min-h-screen bg-[#0b0e11] text-white">
      {/* Header */}
      <div className="bg-[#0d1117] border-b border-[#21262d] px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/compete" className="flex items-center gap-1 text-[#8b949e] hover:text-white text-xs mb-3 transition-colors w-fit">
            <ChevronLeft size={14} /> Back to Lobby
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{getPuzzleEmoji(competition.events?.[0] ?? '3x3x3')}</span>
              <div>
                <h1 className="text-xl font-black text-white">{competition.name}</h1>
                <p className="text-xs text-[#8b949e]">
                  {competition.events?.join(', ')} · {competition.rounds} rounds · Final Results
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => alert('Certificate download coming soon!')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#161b22] border border-[#30363d] text-xs text-[#8b949e] hover:text-white transition-all"
              >
                <Download size={13} /> Certificate
              </button>
              <button
                onClick={() => navigator.share?.({ title: competition.name, url: window.location.href })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#161b22] border border-[#30363d] text-xs text-[#8b949e] hover:text-white transition-all"
              >
                <Share2 size={13} /> Share
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Podium Top 3 */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {sorted.slice(0, 3).map((entry, podiumIdx) => {
            const podiumOrder = [1, 0, 2]; // 2nd, 1st, 3rd visually
            const actual = sorted[podiumOrder[podiumIdx]];
            const isFirst = podiumOrder[podiumIdx] === 0;
            return (
              <div
                key={actual.user.id}
                className={`flex flex-col items-center p-4 rounded-2xl border text-center ${
                  isFirst
                    ? 'bg-amber-500/5 border-amber-500/30 shadow-lg shadow-amber-500/10'
                    : 'bg-[#0d1117] border-[#21262d]'
                }`}
              >
                <div className="text-2xl mb-2">
                  {podiumOrder[podiumIdx] === 0 ? '🥇' : podiumOrder[podiumIdx] === 1 ? '🥈' : '🥉'}
                </div>
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-[#00dbe7] to-[#a3fa00] flex items-center justify-center text-black font-black text-sm mb-2 ${isFirst ? 'w-12 h-12 text-base' : ''}`}>
                  {actual.user.name[0]}
                </div>
                <p className="font-semibold text-xs text-white">{actual.user.name}</p>
                <p className="font-mono font-black text-lg text-white mt-1">{formatTime(actual.average)}</p>
                <p className="text-[10px] text-[#8b949e]">avg · best {formatTime(actual.best)}</p>
              </div>
            );
          })}
        </div>

        {/* Full Results Table */}
        <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-[#21262d]">
            <Trophy size={14} className="text-amber-400" />
            <h2 className="font-semibold text-sm text-white">Final Standings</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[10px] font-mono uppercase tracking-widest text-[#8b949e] border-b border-[#21262d]">
                  <th className="text-left px-5 py-2.5">#</th>
                  <th className="text-left px-3 py-2.5">Athlete</th>
                  <th className="text-right px-3 py-2.5">Average</th>
                  <th className="text-right px-3 py-2.5">Best</th>
                  <th className="text-right px-3 py-2.5 hidden sm:table-cell">S1</th>
                  <th className="text-right px-3 py-2.5 hidden sm:table-cell">S2</th>
                  <th className="text-right px-3 py-2.5 hidden sm:table-cell">S3</th>
                  <th className="text-right px-3 py-2.5 hidden sm:table-cell">S4</th>
                  <th className="text-right px-5 py-2.5 hidden sm:table-cell">S5</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#21262d]">
                {sorted.map(entry => (
                  <tr key={entry.user.id} className="hover:bg-[#161b22] transition-colors">
                    <td className={`px-5 py-3 font-black text-sm font-mono ${
                      entry.rank === 1 ? 'text-amber-400' :
                      entry.rank === 2 ? 'text-slate-300' :
                      entry.rank === 3 ? 'text-amber-600' : 'text-[#8b949e]'
                    }`}>
                      {entry.rank}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#00dbe7] to-[#a3fa00] flex items-center justify-center text-black font-bold text-[10px]">
                          {entry.user.name[0]}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-white">{entry.user.name}</p>
                          {entry.user.wcaId && <p className="text-[10px] text-[#8b949e] font-mono">{entry.user.wcaId}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-bold text-sm text-white">
                      {formatTime(entry.average)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-xs text-[#00dbe7]">
                      {formatTime(entry.best)}
                    </td>
                    {entry.solves.map((s, i) => (
                      <td key={i} className="px-3 py-3 text-right font-mono text-xs text-[#8b949e] hidden sm:table-cell">
                        {s === null ? 'DNF' : `${(s / 1000).toFixed(3)}`}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
