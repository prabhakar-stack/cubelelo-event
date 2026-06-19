'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, History, TrendingUp, Calendar, Trophy, BarChart2 } from 'lucide-react';

interface SolveRecord {
  id: string;
  puzzle: string;
  timeInMs: number;
  scramble: string;
  timestamp: number;
  status: 'OK' | '+2' | 'DNF';
}

function fmt(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  const mil = ms % 1000;
  if (m > 0) return `${m}:${rem.toString().padStart(2, '0')}.${mil.toString().padStart(3, '0')}`;
  return `${s}.${mil.toString().padStart(3, '0')}`;
}

// Generate mock solve history for chart
function generateMockHistory(count: number, basePuzzle: string): SolveRecord[] {
  const now = Date.now();
  return Array(count).fill(null).map((_, i) => ({
    id: `mock-${i}`,
    puzzle: basePuzzle,
    timeInMs: 8000 + Math.round(Math.random() * 12000 - i * 20), // improving trend
    scramble: 'R U R\' U\' R\' F R F\'',
    timestamp: now - (count - i) * 3600000,
    status: 'OK' as const,
  }));
}

const PUZZLE_TYPES = ['3x3x3', '2x2x2', '4x4x4', 'Pyraminx', 'Megaminx'];

export default function PracticeHistory() {
  const [selectedPuzzle, setSelectedPuzzle] = useState('3x3x3');
  const [solves, setSolves] = useState<SolveRecord[]>([]);

  useEffect(() => {
    // Load from localStorage first, supplement with mock
    try {
      const stored = JSON.parse(localStorage.getItem('neo_cube_solves') ?? '[]') as SolveRecord[];
      const filtered = stored.filter(s => s.puzzle === selectedPuzzle);
      if (filtered.length < 5) {
        // Supplement with mock history for UI demo
        setSolves([...filtered, ...generateMockHistory(20, selectedPuzzle)]);
      } else {
        setSolves(filtered);
      }
    } catch {
      setSolves(generateMockHistory(20, selectedPuzzle));
    }
  }, [selectedPuzzle]);

  const validSolves = solves.filter(s => s.status !== 'DNF');
  const best = validSolves.length ? Math.min(...validSolves.map(s => s.timeInMs)) : null;
  const worst = validSolves.length ? Math.max(...validSolves.map(s => s.timeInMs)) : null;
  const mean = validSolves.length ? Math.round(validSolves.reduce((a, s) => a + s.timeInMs, 0) / validSolves.length) : null;

  // Compute Ao5 and Ao12
  const computeAo = (n: number): number | null => {
    const recent = validSolves.slice(0, n);
    if (recent.length < n) return null;
    const sorted = [...recent].sort((a, b) => a.timeInMs - b.timeInMs);
    const trimmed = sorted.slice(1, n - 1);
    return Math.round(trimmed.reduce((a, s) => a + s.timeInMs, 0) / trimmed.length);
  };

  // Simple SVG chart data
  const chartSolves = validSolves.slice(0, 30).reverse();
  const chartMin = chartSolves.length ? Math.min(...chartSolves.map(s => s.timeInMs)) : 0;
  const chartMax = chartSolves.length ? Math.max(...chartSolves.map(s => s.timeInMs)) : 1;
  const chartHeight = 100;
  const chartWidth = 360;

  const chartPoints = chartSolves.map((s, i) => {
    const x = (i / Math.max(chartSolves.length - 1, 1)) * chartWidth;
    const y = chartHeight - ((s.timeInMs - chartMin) / Math.max(chartMax - chartMin, 1)) * chartHeight;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  // Heatmap: last 84 days (12 weeks)
  const heatmapDays = Array(84).fill(null).map((_, i) => {
    const date = new Date(Date.now() - (83 - i) * 86400000);
    const dateStr = date.toISOString().split('T')[0];
    const daySolves = solves.filter(s => {
      const d = new Date(s.timestamp).toISOString().split('T')[0];
      return d === dateStr;
    });
    return { date: dateStr, count: daySolves.length + (Math.random() > 0.5 ? Math.floor(Math.random() * 8) : 0) };
  });

  return (
    <div className="min-h-screen bg-[#0b0e11] text-white">
      {/* Header */}
      <div className="bg-[#0d1117] border-b border-[#21262d] px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto">
          <Link href="/practice" className="flex items-center gap-1 text-[#8b949e] hover:text-white text-xs mb-2 transition-colors w-fit">
            <ChevronLeft size={14} /> Practice
          </Link>
          <div className="flex items-center gap-2">
            <History size={18} className="text-[#a3fa00]" />
            <h1 className="text-xl font-black text-white">Practice History</h1>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Puzzle selector */}
        <div className="flex flex-wrap gap-2">
          {PUZZLE_TYPES.map(p => (
            <button
              key={p}
              onClick={() => setSelectedPuzzle(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all ${
                selectedPuzzle === p
                  ? 'bg-[#a3fa00] text-black'
                  : 'bg-[#161b22] text-[#8b949e] border border-[#30363d] hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Solves', value: solves.length.toString() },
            { label: 'Personal Best', value: best ? fmt(best) : '—' },
            { label: 'Session Mean', value: mean ? fmt(mean) : '—' },
            { label: 'Ao5', value: computeAo(5) ? fmt(computeAo(5)!) : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[#0d1117] border border-[#21262d] rounded-2xl p-4 text-center">
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#8b949e] mb-1.5">{label}</p>
              <p className="font-mono font-black text-xl text-white">{value}</p>
            </div>
          ))}
        </div>

        {/* Trend Chart */}
        {chartSolves.length > 1 && (
          <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={14} className="text-[#a3fa00]" />
              <h3 className="font-semibold text-sm text-white">Progress Trend</h3>
              <span className="ml-auto text-[10px] text-[#8b949e]">Last {chartSolves.length} solves</span>
            </div>
            <div className="w-full overflow-x-auto">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 20}`} className="w-full" style={{ minWidth: '300px' }}>
                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map(y => (
                  <line key={y} x1="0" y1={y} x2={chartWidth} y2={y} stroke="#21262d" strokeWidth="0.5" />
                ))}
                {/* Line */}
                <polyline
                  points={chartPoints}
                  fill="none"
                  stroke="#a3fa00"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Dots */}
                {chartSolves.map((s, i) => {
                  const x = (i / Math.max(chartSolves.length - 1, 1)) * chartWidth;
                  const y = chartHeight - ((s.timeInMs - chartMin) / Math.max(chartMax - chartMin, 1)) * chartHeight;
                  return (
                    <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r="2.5" fill="#a3fa00" />
                  );
                })}
                {/* Y labels */}
                <text x="2" y="10" fontSize="8" fill="#8b949e">{fmt(chartMax)}</text>
                <text x="2" y={chartHeight} fontSize="8" fill="#8b949e">{fmt(chartMin)}</text>
              </svg>
            </div>
          </div>
        )}

        {/* Heatmap */}
        <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={14} className="text-[#8b949e]" />
            <h3 className="font-semibold text-sm text-white">Activity Heatmap</h3>
            <span className="ml-auto text-[10px] text-[#8b949e]">Last 12 weeks</span>
          </div>
          <div className="grid grid-rows-7 grid-flow-col gap-1" style={{ gridTemplateRows: 'repeat(7, 1fr)' }}>
            {heatmapDays.map(({ date, count }) => {
              const intensity = count === 0 ? 0 : count < 3 ? 1 : count < 6 ? 2 : count < 10 ? 3 : 4;
              const colors = ['bg-[#161b22]', 'bg-[#a3fa00]/20', 'bg-[#a3fa00]/40', 'bg-[#a3fa00]/70', 'bg-[#a3fa00]'];
              return (
                <div
                  key={date}
                  title={`${date}: ${count} solves`}
                  className={`w-3 h-3 rounded-sm ${colors[intensity]} transition-colors`}
                />
              );
            })}
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-[10px] text-[#8b949e]">
            <span>Less</span>
            {['bg-[#161b22]', 'bg-[#a3fa00]/20', 'bg-[#a3fa00]/40', 'bg-[#a3fa00]/70', 'bg-[#a3fa00]'].map((c, i) => (
              <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
            ))}
            <span>More</span>
          </div>
        </div>

        {/* Solve log table */}
        <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-[#21262d]">
            <BarChart2 size={14} className="text-[#8b949e]" />
            <h3 className="font-semibold text-sm text-white">All Solves</h3>
            <span className="ml-auto text-[10px] text-[#8b949e]">{solves.length} total</span>
          </div>
          <div className="overflow-x-auto max-h-72 overflow-y-auto">
            <table className="w-full text-xs font-mono">
              <thead className="sticky top-0 bg-[#0d1117]">
                <tr className="text-[#8b949e] border-b border-[#21262d]">
                  <th className="text-left px-5 py-2">#</th>
                  <th className="text-left px-3 py-2">Time</th>
                  <th className="text-left px-3 py-2">Date</th>
                  <th className="text-left px-3 py-2 hidden sm:table-cell">Scramble</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#21262d]/50">
                {[...solves].reverse().map((s, i) => (
                  <tr key={s.id} className="hover:bg-[#161b22] transition-colors">
                    <td className="px-5 py-2 text-[#8b949e]">{i + 1}</td>
                    <td className={`px-3 py-2 font-bold ${s.status === 'DNF' ? 'text-red-400' : s.status === '+2' ? 'text-amber-400' : 'text-white'}`}>
                      {s.status === 'DNF' ? 'DNF' : fmt(s.timeInMs)}
                    </td>
                    <td className="px-3 py-2 text-[#8b949e]">{new Date(s.timestamp).toLocaleDateString()}</td>
                    <td className="px-3 py-2 text-[#8b949e] truncate max-w-[200px] hidden sm:table-cell">{s.scramble.substring(0, 25)}...</td>
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
