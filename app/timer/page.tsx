'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import {
  Play, Trash2, Plus, Settings, Volume2, VolumeX, Share2, HelpCircle,
  Download, Timer, BookOpen, History, BarChart4, ChevronRight, Check, X, Copy,
  RefreshCw, FolderDot, Dribbble, BrainCircuit, Info, Cloud, CloudOff
} from 'lucide-react';
import {
  generateScramble, getInitialCubeState3, getScrambled3x3, getScrambled2x2,
  CubeState3x3, CubeState2x2, CUBE_COLORS
} from '@/lib/cube';

const ScrambleVisualizer = dynamic(
  () => import('@/components/ScrambleVisualizer'),
  { ssr: false }
);

const TimerDisplay = dynamic(
  () => import('@/components/TimerDisplay'),
  { ssr: false }
);

interface Solve {
  id: string;
  puzzle: string;
  timeInMs: number;
  scramble: string;
  timestamp: number;
  status: 'OK' | '+2' | 'DNF';
}

interface Session {
  id: string;
  name: string;
  created: number;
}

interface CubeAlg {
  id: string;
  category: 'F2L' | 'OLL' | 'PLL';
  name: string;
  sequence: string;
  description: string;
}

const CONSTANT_ALGORITHMS: CubeAlg[] = [
  { id: 'f2l-1', category: 'F2L', name: 'Corner & Edge Separated', sequence: "U R U' R'", description: "Insert corner and edge pairs into front-right slot." },
  { id: 'f2l-2', category: 'F2L', name: 'Corner on U, Edge in middle', sequence: "R U R' U' R U R'", description: "Isolate pair on top, orient properly, and insert." },
  { id: 'f2l-3', category: 'F2L', name: 'Corner facing Upwards', sequence: "U' R U2 R' U R U' R'", description: "Solve white sticker facing upwards on top." },
  { id: 'oll-21', category: 'OLL', name: 'OLL 21 // Cross (H-Shape)', sequence: "F (R U R' U')3 F'", description: "All 4 corners oriented incorrectly, facing outwards in headlights pairs." },
  { id: 'oll-22', category: 'OLL', name: 'OLL 22 // Cross (Pi-Shape)', sequence: "R U2 R2' U' R2 U' R2' U2 R", description: "Standard headlights with two adjacent side-facing stickers." },
  { id: 'oll-33', category: 'OLL', name: 'OLL 33 // T-Shape Corner orientation', sequence: "R U R' U' R' F R F'", description: "Beautiful simple T-shape bar with corner facing front." },
  { id: 'oll-37', category: 'OLL', name: 'OLL 37 // Line Shape', sequence: "F R U' R' U' R U R' F'", description: "Single straight line cross-section on last layer." },
  { id: 'pll-t', category: 'PLL', name: 'T-Permutation', sequence: "R U R' U' R' F R2 U' R' U' R U R' F'", description: "Swaps adjacent corners on front-right and adjacent edges." },
  { id: 'pll-h', category: 'PLL', name: 'H-Permutation', sequence: "M2' U M2' U2 M2' U M2'", description: "Performs opposing edges crosses swap across the center layer." },
  { id: 'pll-y', category: 'PLL', name: 'Y-Permutation', sequence: "F R U' R' U' R U R' F' R U R' U' R' F R F'", description: "Swaps two opposite corners and two adjacent edges." },
  { id: 'pll-ja', category: 'PLL', name: 'J-Permutation (Jb-style)', sequence: "R U R' F' R U R' U' R' F R2 U' R' U'", description: "Swaps side corners and front edge pairs seamlessly." },
  { id: 'pll-u', category: 'PLL', name: 'U-Permutation (Ua-style)', sequence: "R U' R U R U R U' R' U' R2", description: "Cycle 3 edges clockwise around the top face without touching corners." },
];

const getNow = () => Date.now();

export default function TimerTerminal() {
  const { data: session } = useSession();
  const [lastSavePB, setLastSavePB] = useState(false);
  const [saveIndicator, setSaveIndicator] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const [solves, setSolves] = useState<Solve[]>([]);
  const [sessions, setSessions] = useState<Session[]>(() => [
    { id: 'session-1', name: 'Main Session 3x3x3', created: 1718000000000 },
    { id: 'session-2', name: 'Speed 2x2x2 Run', created: 1718000000001 },
    { id: 'session-3', name: 'Algorithms Sandbox', created: 1718000000002 },
  ]);
  const [activeSessionId, setActiveSessionId] = useState<string>('session-1');
  const [puzzleType, setPuzzleType] = useState<string>('3x3x3');
  const [scramble, setScramble] = useState<string>('');
  const [currentView, setCurrentView] = useState<'dashboard' | 'sessions' | 'algorithms' | 'statistics' | 'train' | 'support' | 'exit'>('dashboard');
  const [soundOn, setSoundOn] = useState<boolean>(true);
  const [inspectionOn, setInspectionOn] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('Pro_Cuber');
  const [globalRank, setGlobalRank] = useState<number>(422);
  const [manualMinutes, setManualMinutes] = useState<string>('');
  const [manualSeconds, setManualSeconds] = useState<string>('');
  const [manualMs, setManualMs] = useState<string>('');
  const [isManualOpen, setIsManualOpen] = useState<boolean>(false);
  const [algSearch, setAlgSearch] = useState<string>('');
  const [activeAlgCategory, setActiveAlgCategory] = useState<'ALL' | 'F2L' | 'OLL' | 'PLL'>('ALL');
  const [copiedAlgId, setCopiedAlgId] = useState<string | null>(null);
  const [trainAlgId, setTrainAlgId] = useState<string>('pll-t');
  const [trainState, setTrainState] = useState<'idle' | 'ready' | 'timing' | 'completed'>('idle');
  const [trainTimer, setTrainTimer] = useState<number>(0);
  const [trainSolves, setTrainSolves] = useState<number[]>([]);
  const [timerBlurred, setTimerBlurred] = useState<boolean>(false);

  const startTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<any>(null);
  const trainIntervalRef = useRef<any>(null);

  const triggerNewScramble = useCallback(() => {
    const s = generateScramble(puzzleType);
    setTimeout(() => { setScramble(s); }, 0);
  }, [puzzleType]);

  // Load from localStorage
  useEffect(() => {
    const initTimer = setTimeout(() => {
      if (typeof window !== 'undefined') {
        try {
          const storedSolves = localStorage.getItem('neo_cube_solves');
          const storedSessions = localStorage.getItem('neo_cube_sessions');
          const storedActiveSession = localStorage.getItem('neo_cube_active_session_id');
          const storedUserName = localStorage.getItem('neo_cube_user_name');
          const storedRank = localStorage.getItem('neo_cube_global_rank');
          const storedSound = localStorage.getItem('neo_cube_sound');
          const storedInspection = localStorage.getItem('neo_cube_inspection');
          const storedType = localStorage.getItem('neo_cube_puzzle_type');
          if (storedSolves) setSolves(JSON.parse(storedSolves));
          if (storedSessions) setSessions(JSON.parse(storedSessions));
          if (storedActiveSession) setActiveSessionId(storedActiveSession);
          if (storedUserName) setUserName(storedUserName);
          if (storedRank) setGlobalRank(Number(storedRank));
          if (storedSound) setSoundOn(storedSound === 'true');
          if (storedInspection) setInspectionOn(storedInspection === 'true');
          if (storedType) setPuzzleType(storedType);
        } catch (e) {}
      }
    }, 0);
    return () => clearTimeout(initTimer);
  }, []);

  const saveSolvesToStorage = (updatedSolves: Solve[]) => {
    setSolves(updatedSolves);
    localStorage.setItem('neo_cube_solves', JSON.stringify(updatedSolves));
  };

  const saveSessionsToStorage = (updatedSessions: Session[]) => {
    setSessions(updatedSessions);
    localStorage.setItem('neo_cube_sessions', JSON.stringify(updatedSessions));
  };

  useEffect(() => {
    triggerNewScramble();
    localStorage.setItem('neo_cube_puzzle_type', puzzleType);
  }, [puzzleType, triggerNewScramble]);

  const playBeep = (freq = 800, duration = 0.08, type: 'sine' | 'square' | 'triangle' = 'sine') => {
    if (!soundOn) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.type = type;
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  };

  const activeSessionSolves = solves.filter(s => s.puzzle === puzzleType);

  const getSingleBest = () => {
    const sList = activeSessionSolves.filter(s => s.status !== 'DNF');
    if (sList.length === 0) return '—';
    const computedTimes = sList.map(s => s.status === '+2' ? s.timeInMs + 2000 : s.timeInMs);
    const minVal = Math.min(...computedTimes);
    return formatTime(minVal);
  };

  const getMean = () => {
    const validSolves = activeSessionSolves.filter(s => s.status !== 'DNF');
    if (validSolves.length === 0) return '—';
    const total = validSolves.reduce((acc, s) => acc + (s.status === '+2' ? s.timeInMs + 2000 : s.timeInMs), 0);
    return formatTime(Math.round(total / validSolves.length));
  };

  const getAvgN = (n: number) => {
    const validForAvg = activeSessionSolves.slice(-n);
    if (validForAvg.length < n) return '—';
    const dnfCount = validForAvg.filter(s => s.status === 'DNF').length;
    if (dnfCount > 1) return 'DNF';
    const sorted = [...validForAvg].sort((a, b) => {
      const ta = a.status === 'DNF' ? Infinity : a.status === '+2' ? a.timeInMs + 2000 : a.timeInMs;
      const tb = b.status === 'DNF' ? Infinity : b.status === '+2' ? b.timeInMs + 2000 : b.timeInMs;
      return ta - tb;
    });
    const trimmed = sorted.slice(1, n - 1);
    const total = trimmed.reduce((acc, s) => acc + (s.status === '+2' ? s.timeInMs + 2000 : s.timeInMs), 0);
    return formatTime(Math.round(total / trimmed.length));
  };

  function formatTime(ms: number): string {
    if (ms <= 0) return '0.000';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const millis = ms % 1000;
    const msStr = millis.toString().padStart(3, '0');
    if (minutes > 0) return `${minutes}:${seconds.toString().padStart(2, '0')}.${msStr}`;
    return `${seconds}.${msStr}`;
  }

  const handleSolveComplete = useCallback(async (timeMs: number) => {
    const newSolve: Solve = {
      id: `solve-${getNow()}-${Math.random().toString(36).substr(2, 5)}`,
      puzzle: puzzleType,
      timeInMs: timeMs,
      scramble: scramble,
      timestamp: getNow(),
      status: 'OK',
    };
    const updated = [newSolve, ...solves];
    saveSolvesToStorage(updated);
    triggerNewScramble();
    playBeep(1200, 0.06);

    // ── Save to DB if user is logged in ────────────────────────────────────
    if (session?.user?.id) {
      setSaveIndicator('saving');
      try {
        const res = await fetch('/api/solves', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            puzzleType,
            timeInMs: timeMs,
            scramble,
            status: 'OK',
            sessionName: activeSessionId,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setLastSavePB(data.isPB);
          setSaveIndicator('saved');
          setTimeout(() => setSaveIndicator('idle'), 2500);
        } else {
          setSaveIndicator('error');
          setTimeout(() => setSaveIndicator('idle'), 3000);
        }
      } catch {
        setSaveIndicator('error');
        setTimeout(() => setSaveIndicator('idle'), 3000);
      }
    }
  }, [puzzleType, scramble, solves, triggerNewScramble, session, activeSessionId]);

  const handleStatusChange = useCallback((status: string) => {
    setTimerBlurred(status === 'holding' || status === 'ready' || status === 'running');
  }, []);

  const applyPenalty = (solveId: string, penalty: 'OK' | '+2' | 'DNF') => {
    const updated = solves.map(s => s.id === solveId ? { ...s, status: penalty } : s);
    saveSolvesToStorage(updated);
  };

  const deleteSolve = (solveId: string) => {
    const updated = solves.filter(s => s.id !== solveId);
    saveSolvesToStorage(updated);
  };

  const addManualTime = () => {
    const mins = parseInt(manualMinutes || '0');
    const secs = parseInt(manualSeconds || '0');
    const ms = parseInt(manualMs || '0');
    const totalMs = mins * 60000 + secs * 1000 + ms;
    if (totalMs <= 0) return;
    const newSolve: Solve = {
      id: `solve-${getNow()}-manual`,
      puzzle: puzzleType,
      timeInMs: totalMs,
      scramble: scramble || '(manual entry)',
      timestamp: getNow(),
      status: 'OK',
    };
    saveSolvesToStorage([newSolve, ...solves]);
    setManualMinutes('');
    setManualSeconds('');
    setManualMs('');
    setIsManualOpen(false);
  };

  const exportCSV = () => {
    const header = 'Solve #,Time,Scramble,Puzzle,Status,Date\n';
    const rows = [...activeSessionSolves].reverse().map((s, i) => {
      const date = new Date(s.timestamp).toLocaleString();
      const t = s.status === '+2' ? formatTime(s.timeInMs + 2000) + '+' : s.status === 'DNF' ? 'DNF' : formatTime(s.timeInMs);
      return `${i + 1},${t},"${s.scramble.replace(/"/g, '""')}",${s.puzzle},${s.status},"${date}"`;
    }).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cubelelo-session-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyAlg = (alg: CubeAlg) => {
    navigator.clipboard.writeText(alg.sequence).then(() => {
      setCopiedAlgId(alg.id);
      setTimeout(() => setCopiedAlgId(null), 1500);
    });
  };

  const filteredAlgs = CONSTANT_ALGORITHMS.filter(a => {
    const matchesCategory = activeAlgCategory === 'ALL' || a.category === activeAlgCategory;
    const matchesSearch = algSearch === '' || a.name.toLowerCase().includes(algSearch.toLowerCase()) || a.sequence.toLowerCase().includes(algSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Training mode
  const startTrainTimer = () => {
    setTrainState('timing');
    const start = performance.now();
    trainIntervalRef.current = setInterval(() => {
      setTrainTimer(performance.now() - start);
    }, 16);
  };

  const stopTrainTimer = () => {
    clearInterval(trainIntervalRef.current);
    setTrainState('completed');
    setTrainSolves(prev => [...prev, trainTimer]);
  };

  const resetTrainTimer = () => {
    clearInterval(trainIntervalRef.current);
    setTrainState('idle');
    setTrainTimer(0);
  };

  useEffect(() => {
    return () => clearInterval(trainIntervalRef.current);
  }, []);

  const PUZZLE_TYPES = ['3x3x3', '2x2x2', '4x4x4', 'OH', 'Pyraminx', 'Megaminx'];

  const navItems = [
    { id: 'dashboard', icon: Timer, label: 'Timer' },
    { id: 'sessions', icon: History, label: 'Sessions' },
    { id: 'algorithms', icon: BookOpen, label: 'Algorithms' },
    { id: 'statistics', icon: BarChart4, label: 'Analytics' },
    { id: 'train', icon: BrainCircuit, label: 'Train' },
    { id: 'support', icon: HelpCircle, label: 'Help' },
  ] as const;

  return (
    <div className="min-h-screen bg-[#0b0e11] text-white flex flex-col">
      {/* Sub-nav for timer views */}
      <div className="bg-[#0d1117] border-b border-[#21262d] px-4 sticky top-14 z-30">
        <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto py-1 scrollbar-hide">
          {navItems.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setCurrentView(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                currentView === id
                  ? 'bg-[#21262d] text-[#00dbe7]'
                  : 'text-[#8b949e] hover:text-white hover:bg-[#21262d]/50'
              }`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setSoundOn(!soundOn)}
              className="p-1.5 rounded-lg text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-all"
              title={soundOn ? 'Sound On' : 'Sound Off'}
            >
              {soundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="p-1.5 rounded-lg text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-all"
            >
              <Settings size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">

        {/* ── DASHBOARD / TIMER VIEW ── */}
        {currentView === 'dashboard' && (
          <div className="space-y-4">
            {/* Puzzle selector */}
            <div className="flex flex-wrap gap-2 items-center">
              {PUZZLE_TYPES.map(pt => (
                <button
                  key={pt}
                  onClick={() => setPuzzleType(pt)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all ${
                    puzzleType === pt
                      ? 'bg-[#00dbe7] text-black'
                      : 'bg-[#161b22] text-[#8b949e] border border-[#30363d] hover:text-white hover:border-[#8b949e]'
                  }`}
                >
                  {pt}
                </button>
              ))}
              <button
                onClick={triggerNewScramble}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono text-[#8b949e] hover:text-white border border-[#30363d] hover:border-[#8b949e] transition-all"
              >
                <RefreshCw size={12} />
                New Scramble
              </button>
            </div>

            {/* Scramble display */}
            <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-[#8b949e] mb-1.5">Scramble</p>
                  <p className="font-mono text-sm text-white leading-relaxed break-all">{scramble || 'Generating...'}</p>
                </div>
                <button
                  onClick={() => { if (scramble) navigator.clipboard.writeText(scramble); }}
                  className="p-2 rounded-lg text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-all flex-shrink-0"
                  title="Copy scramble"
                >
                  <Copy size={13} />
                </button>
              </div>
            </div>

            {/* Main grid: visualizer + timer */}
            <div className="grid lg:grid-cols-5 gap-4">
              {/* Scramble Visualizer */}
              <div className={`lg:col-span-2 transition-all duration-300 ${timerBlurred ? 'opacity-20 blur-sm pointer-events-none' : ''}`}>
                <ScrambleVisualizer puzzleType={puzzleType} scramble={scramble} />
              </div>

              {/* Timer */}
              <div className="lg:col-span-3 flex flex-col gap-4">
                <TimerDisplay
                  onSolveComplete={handleSolveComplete}
                  onStatusChange={handleStatusChange}
                />

                {/* Quick stats */}
                <div className={`grid grid-cols-4 gap-2 transition-all duration-300 ${timerBlurred ? 'opacity-20 blur-sm pointer-events-none' : ''}`}>
                  {[
                    { label: 'Best', value: getSingleBest() },
                    { label: 'Mean', value: getMean() },
                    { label: 'Ao5', value: getAvgN(5) },
                    { label: 'Ao12', value: getAvgN(12) },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-[#0d1117] border border-[#21262d] rounded-xl p-3 text-center">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-[#8b949e] mb-1">{label}</p>
                      <p className="font-mono font-bold text-sm text-white">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Solve list */}
            <div className={`transition-all duration-300 ${timerBlurred ? 'opacity-20 blur-sm pointer-events-none' : ''}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">
                    Solves <span className="text-[#8b949e] font-normal">({activeSessionSolves.length})</span>
                  </h3>
                  {/* Cloud save indicator */}
                  {session?.user?.id ? (
                    <span className={`flex items-center gap-1 text-[10px] font-mono transition-all ${
                      saveIndicator === 'saving' ? 'text-amber-400' :
                      saveIndicator === 'saved' ? 'text-emerald-400' :
                      saveIndicator === 'error' ? 'text-red-400' :
                      'text-[#30363d]'
                    }`}>
                      {saveIndicator === 'saving' ? <RefreshCw size={10} className="animate-spin" /> : <Cloud size={10} />}
                      {saveIndicator === 'saving' && 'Saving...'}
                      {saveIndicator === 'saved' && (lastSavePB ? '🎉 PB saved!' : 'Saved')}
                      {saveIndicator === 'error' && 'Save failed'}
                      {saveIndicator === 'idle' && 'Cloud sync on'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-[#30363d]">
                      <CloudOff size={10} /> Local only
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsManualOpen(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-[#8b949e] hover:text-white border border-[#30363d] hover:border-[#8b949e] transition-all"
                  >
                    <Plus size={11} /> Manual
                  </button>
                  <button
                    onClick={exportCSV}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-[#8b949e] hover:text-white border border-[#30363d] hover:border-[#8b949e] transition-all"
                  >
                    <Download size={11} /> CSV
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Clear all solves for this puzzle type?')) {
                        saveSolvesToStorage(solves.filter(s => s.puzzle !== puzzleType));
                      }
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-red-400/70 hover:text-red-400 border border-red-500/20 hover:border-red-500/40 transition-all"
                  >
                    <Trash2 size={11} /> Clear
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {activeSessionSolves.length === 0 ? (
                  <div className="text-center py-8 text-[#8b949e] text-sm">
                    No solves yet. Hold spacebar to start timing!
                  </div>
                ) : (
                  activeSessionSolves.map((solve, index) => {
                    const displayTime = solve.status === 'DNF'
                      ? 'DNF'
                      : solve.status === '+2'
                        ? formatTime(solve.timeInMs + 2000) + '+'
                        : formatTime(solve.timeInMs);

                    return (
                      <div
                        key={solve.id}
                        className="flex items-center gap-3 px-3 py-2 bg-[#0d1117] border border-[#21262d] rounded-xl hover:border-[#30363d] transition-all group"
                      >
                        <span className="text-[10px] text-[#8b949e] font-mono w-6 text-right flex-shrink-0">
                          {activeSessionSolves.length - index}
                        </span>
                        <span className={`font-mono text-sm font-semibold flex-1 ${
                          solve.status === 'DNF' ? 'text-red-400' :
                          solve.status === '+2' ? 'text-amber-400' : 'text-white'
                        }`}>
                          {displayTime}
                        </span>
                        <span className="text-[10px] text-[#8b949e] hidden sm:block truncate max-w-[200px]">
                          {new Date(solve.timestamp).toLocaleTimeString()}
                        </span>
                        {/* Penalty buttons */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => applyPenalty(solve.id, 'OK')}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-all ${solve.status === 'OK' ? 'bg-emerald-500/20 text-emerald-400' : 'text-[#8b949e] hover:text-emerald-400'}`}
                          >OK</button>
                          <button
                            onClick={() => applyPenalty(solve.id, '+2')}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-all ${solve.status === '+2' ? 'bg-amber-500/20 text-amber-400' : 'text-[#8b949e] hover:text-amber-400'}`}
                          >+2</button>
                          <button
                            onClick={() => applyPenalty(solve.id, 'DNF')}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-all ${solve.status === 'DNF' ? 'bg-red-500/20 text-red-400' : 'text-[#8b949e] hover:text-red-400'}`}
                          >DNF</button>
                          <button
                            onClick={() => deleteSolve(solve.id)}
                            className="p-0.5 text-[#8b949e] hover:text-red-400 transition-colors ml-1"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── SESSIONS VIEW ── */}
        {currentView === 'sessions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Sessions</h2>
              <button
                onClick={() => {
                  const name = prompt('Session name:');
                  if (!name) return;
                  const newSession: Session = { id: `session-${getNow()}`, name, created: getNow() };
                  saveSessionsToStorage([...sessions, newSession]);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00dbe7]/10 border border-[#00dbe7]/30 text-[#00dbe7] text-xs font-medium hover:bg-[#00dbe7]/20 transition-all"
              >
                <Plus size={13} /> New Session
              </button>
            </div>
            <div className="space-y-2">
              {sessions.map(session => {
                const sessionSolves = solves.filter(s => true); // simplified
                return (
                  <div
                    key={session.id}
                    onClick={() => { setActiveSessionId(session.id); localStorage.setItem('neo_cube_active_session_id', session.id); }}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      activeSessionId === session.id
                        ? 'bg-[#00dbe7]/5 border-[#00dbe7]/30'
                        : 'bg-[#0d1117] border-[#21262d] hover:border-[#30363d]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm text-white">{session.name}</p>
                        <p className="text-xs text-[#8b949e] mt-0.5">
                          Created {new Date(session.created).toLocaleDateString()}
                        </p>
                      </div>
                      {activeSessionId === session.id && (
                        <span className="text-[10px] font-mono text-[#00dbe7] border border-[#00dbe7]/30 px-2 py-0.5 rounded-full">ACTIVE</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ALGORITHMS VIEW ── */}
        {currentView === 'algorithms' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-lg font-bold text-white">Algorithms Vault</h2>
              <input
                type="text"
                value={algSearch}
                onChange={e => setAlgSearch(e.target.value)}
                placeholder="Search algorithms..."
                className="px-3 py-1.5 bg-[#161b22] border border-[#30363d] rounded-xl text-sm text-white placeholder-[#8b949e] focus:outline-none focus:border-[#00dbe7] transition-colors font-mono"
              />
            </div>
            <div className="flex gap-2">
              {(['ALL', 'F2L', 'OLL', 'PLL'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveAlgCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold font-mono transition-all ${
                    activeAlgCategory === cat
                      ? 'bg-[#00dbe7] text-black'
                      : 'bg-[#161b22] text-[#8b949e] border border-[#30363d] hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredAlgs.map(alg => (
                <div key={alg.id} className="bg-[#0d1117] border border-[#21262d] rounded-xl p-4 hover:border-[#30363d] transition-all group">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        alg.category === 'F2L' ? 'bg-blue-500/10 text-blue-400' :
                        alg.category === 'OLL' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-emerald-500/10 text-emerald-400'
                      }`}>{alg.category}</span>
                      <p className="text-xs font-semibold text-white mt-1">{alg.name}</p>
                    </div>
                    <button
                      onClick={() => copyAlg(alg)}
                      className="p-1.5 rounded-lg text-[#8b949e] hover:text-[#00dbe7] hover:bg-[#00dbe7]/10 transition-all opacity-0 group-hover:opacity-100"
                    >
                      {copiedAlgId === alg.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    </button>
                  </div>
                  <p className="font-mono text-[11px] text-[#00dbe7] mb-2 break-all">{alg.sequence}</p>
                  <p className="text-[10px] text-[#8b949e] leading-relaxed">{alg.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STATISTICS VIEW ── */}
        {currentView === 'statistics' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">Performance Analytics</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Total Solves', value: activeSessionSolves.length.toString() },
                { label: 'Personal Best', value: getSingleBest() },
                { label: 'Session Mean', value: getMean() },
                { label: 'Ao12', value: getAvgN(12) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-[#0d1117] border border-[#21262d] rounded-2xl p-5 text-center">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-[#8b949e] mb-2">{label}</p>
                  <p className="font-mono font-black text-2xl text-white">{value}</p>
                </div>
              ))}
            </div>
            {activeSessionSolves.length > 0 && (
              <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-white mb-4">Solve History</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono">
                    <thead>
                      <tr className="text-[#8b949e] border-b border-[#21262d]">
                        <th className="text-left pb-2 pr-4">#</th>
                        <th className="text-left pb-2 pr-4">Time</th>
                        <th className="text-left pb-2 pr-4">Status</th>
                        <th className="text-left pb-2 pr-4">Date</th>
                        <th className="text-left pb-2">Scramble</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...activeSessionSolves].reverse().map((s, i) => (
                        <tr key={s.id} className="border-b border-[#21262d]/50 hover:bg-[#161b22] transition-colors">
                          <td className="py-1.5 pr-4 text-[#8b949e]">{i + 1}</td>
                          <td className={`py-1.5 pr-4 font-bold ${s.status === 'DNF' ? 'text-red-400' : s.status === '+2' ? 'text-amber-400' : 'text-white'}`}>
                            {s.status === 'DNF' ? 'DNF' : formatTime(s.status === '+2' ? s.timeInMs + 2000 : s.timeInMs)}
                          </td>
                          <td className="py-1.5 pr-4 text-[#8b949e]">{s.status}</td>
                          <td className="py-1.5 pr-4 text-[#8b949e]">{new Date(s.timestamp).toLocaleDateString()}</td>
                          <td className="py-1.5 text-[#8b949e] truncate max-w-[200px]">{s.scramble.substring(0, 40)}...</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TRAINING VIEW ── */}
        {currentView === 'train' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">Training Sandbox</h2>
            <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl p-6">
              <div className="mb-4">
                <label className="text-xs font-mono text-[#8b949e] uppercase tracking-widest mb-2 block">Select Algorithm to Drill</label>
                <select
                  value={trainAlgId}
                  onChange={e => { setTrainAlgId(e.target.value); resetTrainTimer(); }}
                  className="w-full px-3 py-2 bg-[#161b22] border border-[#30363d] rounded-xl text-sm text-white focus:outline-none focus:border-[#00dbe7] transition-colors"
                >
                  {CONSTANT_ALGORITHMS.map(a => (
                    <option key={a.id} value={a.id}>{a.category} · {a.name}</option>
                  ))}
                </select>
              </div>

              {(() => {
                const alg = CONSTANT_ALGORITHMS.find(a => a.id === trainAlgId);
                return alg ? (
                  <div className="mb-6 p-4 bg-[#161b22] rounded-xl border border-[#30363d]">
                    <p className="text-xs text-[#8b949e] mb-1">{alg.description}</p>
                    <p className="font-mono text-sm text-[#00dbe7] font-bold">{alg.sequence}</p>
                  </div>
                ) : null;
              })()}

              <div className="text-center">
                <div className="font-mono text-6xl font-black text-white mb-6">
                  {(trainTimer / 1000).toFixed(2)}
                </div>
                <div className="flex items-center justify-center gap-3">
                  {trainState === 'idle' && (
                    <button onClick={startTrainTimer} className="px-6 py-2.5 rounded-xl bg-[#00dbe7]/10 border border-[#00dbe7]/30 text-[#00dbe7] font-bold text-sm hover:bg-[#00dbe7]/20 transition-all">
                      Start
                    </button>
                  )}
                  {trainState === 'timing' && (
                    <button onClick={stopTrainTimer} className="px-6 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-sm hover:bg-red-500/20 transition-all">
                      Stop
                    </button>
                  )}
                  {trainState === 'completed' && (
                    <>
                      <button onClick={startTrainTimer} className="px-6 py-2.5 rounded-xl bg-[#00dbe7]/10 border border-[#00dbe7]/30 text-[#00dbe7] font-bold text-sm hover:bg-[#00dbe7]/20 transition-all">
                        Again
                      </button>
                      <button onClick={resetTrainTimer} className="px-4 py-2.5 rounded-xl bg-[#21262d] text-[#8b949e] text-sm hover:text-white transition-all">
                        Reset
                      </button>
                    </>
                  )}
                </div>
                {trainSolves.length > 0 && (
                  <div className="mt-4 text-xs text-[#8b949e]">
                    Best: {Math.min(...trainSolves) < 1000 ? `${Math.min(...trainSolves).toFixed(0)}ms` : `${(Math.min(...trainSolves)/1000).toFixed(2)}s`}
                    {' · '}Attempts: {trainSolves.length}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── SUPPORT VIEW ── */}
        {currentView === 'support' && (
          <div className="space-y-4 max-w-2xl">
            <h2 className="text-lg font-bold text-white">Help & Support</h2>
            <div className="space-y-3">
              {[
                { q: 'How do I start the timer?', a: 'Hold the spacebar until it turns green, then release to start timing. Press any key to stop.' },
                { q: 'How are Ao5/Ao12 calculated?', a: 'Average of 5/12 removes the best and worst time, then averages the remaining. DNF counts as infinity.' },
                { q: 'How do I apply a +2 penalty?', a: 'Hover over a solve in the list and click "+2". The time will display with a + suffix.' },
                { q: 'Can I export my solves?', a: 'Yes! Click the CSV button in the Timer view to download all solves for the current puzzle type.' },
                { q: 'Is my data saved?', a: 'All solves are saved to your browser\'s localStorage. Clearing browser data will remove them. Cloud sync coming soon.' },
              ].map(({ q, a }) => (
                <div key={q} className="bg-[#0d1117] border border-[#21262d] rounded-xl p-4">
                  <div className="flex items-start gap-2">
                    <HelpCircle size={14} className="text-[#00dbe7] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-white mb-1">{q}</p>
                      <p className="text-xs text-[#8b949e] leading-relaxed">{a}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Manual time entry modal */}
      {isManualOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsManualOpen(false)} />
          <div className="relative bg-[#0d1117] border border-[#30363d] rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Manual Time Entry</h3>
              <button onClick={() => setIsManualOpen(false)} className="p-1 text-[#8b949e] hover:text-white"><X size={15} /></button>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <input type="number" value={manualMinutes} onChange={e => setManualMinutes(e.target.value)} placeholder="MM" className="w-16 px-2 py-2 bg-[#161b22] border border-[#30363d] rounded-lg text-center text-white text-sm font-mono focus:outline-none focus:border-[#00dbe7]" min="0" max="99" />
              <span className="text-[#8b949e]">:</span>
              <input type="number" value={manualSeconds} onChange={e => setManualSeconds(e.target.value)} placeholder="SS" className="w-16 px-2 py-2 bg-[#161b22] border border-[#30363d] rounded-lg text-center text-white text-sm font-mono focus:outline-none focus:border-[#00dbe7]" min="0" max="59" />
              <span className="text-[#8b949e]">.</span>
              <input type="number" value={manualMs} onChange={e => setManualMs(e.target.value)} placeholder="000" className="w-20 px-2 py-2 bg-[#161b22] border border-[#30363d] rounded-lg text-center text-white text-sm font-mono focus:outline-none focus:border-[#00dbe7]" min="0" max="999" />
            </div>
            <button onClick={addManualTime} className="w-full py-2.5 rounded-xl bg-[#00dbe7]/10 border border-[#00dbe7]/30 text-[#00dbe7] font-bold text-sm hover:bg-[#00dbe7]/20 transition-all">
              Add Solve
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
