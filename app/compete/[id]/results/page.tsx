'use client';

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, Trophy, Loader2, Download } from 'lucide-react';
import { getPuzzleEmoji } from '@/lib/utils/competition';
import { useSession } from 'next-auth/react';

const DNF_SENTINEL = 360000;

function formatTime(ms: number | string | null): string {
  if (ms === null || ms === undefined) return '—';
  const n = Number(ms);
  if (isNaN(n) || n >= DNF_SENTINEL) return 'DNF';
  const s = Math.floor(n / 1000);
  const milli = n % 1000;
  const min = Math.floor(s / 60);
  if (min > 0) {
    return `${min}:${(s % 60).toString().padStart(2, '0')}.${milli.toString().padStart(3, '0')}`;
  }
  return `${s}.${milli.toString().padStart(3, '0')}`;
}

interface PageParams {
  params: Promise<{ id: string }>;
}

interface ResultEntry {
  rank: number;
  userId: string;
  name: string;
  wcaId: string;
  country: string;
  average: string;
  best: string;
  solves: string[];
  eventId: string;
  flagStatus?: string;
}

export default function CompetitionResults({ params }: PageParams) {
  const { id } = use(params);
  const { data: session } = useSession();
  const [competition, setCompetition] = useState<any>(null);
  const [results, setResults] = useState<ResultEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [certLoading, setCertLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/competitions/${id}`)
      .then(r => r.json())
      .then(d => {
        const comp = d.competition;
        setCompetition(comp);
        const firstEvent = comp?.events?.[0]?.eventId ?? comp?.events?.[0] ?? '';
        setSelectedEvent(firstEvent);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!competition) return;
    const compId = competition.competitionId ?? id;
    fetch(`/api/competitions/${compId}/leaderboard?eventId=${selectedEvent}`)
      .then(r => r.json())
      .then(d => setResults(d.leaderboard ?? []))
      .catch(() => {});
  }, [competition, id, selectedEvent]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 size={24} className="text-accent animate-spin" />
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center text-muted">
        Competition not found.{' '}
        <Link href="/compete" className="text-accent underline ml-1">Back</Link>
      </div>
    );
  }

  const compName = competition.name ?? competition.competitionName;
  const events: any[] = competition.events ?? [];
  const puzzleType = competition.puzzleType ?? selectedEvent ?? '3x3x3';
  const compId = competition.competitionId ?? id;

  async function downloadCertificate() {
    if (!session) return;
    setCertLoading(true);
    try {
      const res = await fetch(`/api/competitions/${compId}/certificate?event=${encodeURIComponent(selectedEvent)}`);
      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? 'Certificate not available');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${compId}-${selectedEvent}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setCertLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        <Link href={`/compete/${id}`}
          className="inline-flex items-center gap-1 text-muted hover:text-fg text-xs mb-8 transition-colors">
          <ChevronLeft size={14} /> Back to competition
        </Link>

        {/* Header */}
        <div className="flex items-start gap-4 mb-8">
          <div className="text-4xl">{getPuzzleEmoji(puzzleType)}</div>
          <div className="flex-1">
            <h1 className="text-2xl font-black text-fg mb-1">{compName}</h1>
            <p className="text-sm text-muted">Official Results</p>
          </div>
          {session && (
            <button
              onClick={downloadCertificate}
              disabled={certLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent/10 border border-accent/30 text-accent text-sm font-semibold hover:bg-accent/20 transition-all disabled:opacity-50 flex-shrink-0"
            >
              {certLoading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              My Certificate
            </button>
          )}
        </div>

        {/* Podium for top 3 */}
        {results.length >= 3 && (
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[results[1], results[0], results[2]].map((entry, pos) => {
              const medals = ['🥈', '🥇', '🥉'];
              const heights = ['h-24', 'h-32', 'h-20'];
              const colors = ['from-slate-400/20 to-slate-500/10 border-slate-400/30',
                              'from-amber-400/20 to-amber-500/10 border-amber-400/30',
                              'from-amber-700/20 to-amber-800/10 border-amber-700/30'];
              return (
                <div key={entry.userId}
                  className={`bg-gradient-to-b ${colors[pos]} border rounded-2xl p-4 text-center flex flex-col items-center justify-end ${heights[pos]}`}>
                  <div className="text-2xl mb-1">{medals[pos]}</div>
                  <p className="text-xs font-bold text-fg truncate w-full">{entry.name}</p>
                  <p className="text-sm font-black font-mono text-fg mt-0.5">{entry.average}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Event tabs */}
        {events.length > 1 && (
          <div className="flex gap-2 flex-wrap mb-4">
            {events.map((e: any) => {
              const ev = e.eventId ?? e;
              return (
                <button key={ev} onClick={() => setSelectedEvent(ev)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${
                    selectedEvent === ev
                      ? 'bg-accent/20 border border-accent/50 text-accent'
                      : 'bg-elevated border border-line-strong text-muted hover:text-fg'
                  }`}>
                  {ev}
                </button>
              );
            })}
          </div>
        )}

        {/* Results table */}
        <div className="bg-surface border border-line rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-line">
            <Trophy size={14} className="text-amber-400" />
            <h2 className="font-semibold text-sm text-fg">
              {selectedEvent} Results
            </h2>
            <span className="ml-auto text-[10px] text-muted font-mono">{results.length} competitors</span>
          </div>

          {results.length === 0 ? (
            <div className="py-12 text-center text-muted text-sm">
              No results yet for this event.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-line text-muted">
                    <th className="px-4 py-2 text-left font-medium">#</th>
                    <th className="px-4 py-2 text-left font-medium">Name</th>
                    <th className="px-4 py-2 text-left font-medium hidden sm:table-cell">WCA ID</th>
                    <th className="px-4 py-2 text-right font-medium">ao5</th>
                    <th className="px-4 py-2 text-right font-medium">Best</th>
                    <th className="px-4 py-2 text-right font-medium hidden md:table-cell">Solves</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {results.map(entry => (
                    <tr key={entry.userId}
                      className="hover:bg-elevated transition-colors">
                      <td className="px-4 py-3 font-mono font-black">
                        {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/profile/${entry.userId}`}
                          className="font-semibold text-fg hover:text-accent transition-colors">
                          {entry.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted hidden sm:table-cell font-mono">
                        {entry.wcaId && entry.wcaId !== 'NA' ? (
                          <a href={`https://www.worldcubeassociation.org/persons/${entry.wcaId}`}
                            target="_blank" rel="noopener noreferrer"
                            className="text-accent hover:underline">
                            {entry.wcaId}
                          </a>
                        ) : '—'}
                      </td>
                      <td className={`px-4 py-3 text-right font-mono font-bold ${
                        entry.average === 'DNF' ? 'text-red-400' : 'text-fg'
                      }`}>
                        {entry.average}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-muted">
                        {entry.best}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex gap-1 justify-end">
                          {(entry.solves ?? []).map((s: string, i: number) => (
                            <span key={i}
                              className={`font-mono text-[10px] px-1.5 py-0.5 rounded bg-bg ${
                                s === 'DNF' ? 'text-red-400' : 'text-muted'
                              }`}>
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
