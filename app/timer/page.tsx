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
  generateScramble, generateScrambleAsync, WCA_EVENT_MAP
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
  note?: string;
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
  const [bldPhase, setBldPhase] = useState<'memo' | 'solve'>('memo');
  const [bldMemoMs, setBldMemoMs] = useState<number>(0);
  const [bldMemoRunning, setBldMemoRunning] = useState<boolean>(false);
  const bldMemoStartRef = React.useRef<number>(0);
  const bldMemoIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const [targetTime, setTargetTime] = useState<string>('');
  const [noteEditId, setNoteEditId] = useState<string | null>(null);
  const [noteEditText, setNoteEditText] = useState<string>('');

  const startTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<any>(null);
  const trainIntervalRef = useRef<any>(null);

  const triggerNewScramble = useCallback(async () => {
    const s = await generateScrambleAsync(puzzleType);
    setScramble(s);
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
    if (puzzleType === 'BLD') { setBldPhase('memo'); setBldMemoMs(0); }
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

  const handleSolveComplete = useCallback(async (timeMs: number, penalty?: 'none' | '+2' | 'DNF') => {
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

  // Keyboard shortcuts: D=DNF, P=+2, Z=undo for last solve
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Don't fire when typing in input/textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      const key = e.key.toLowerCase();
      if (key === 'z') {
        // Undo last solve
        setSolves(prev => {
          const filtered = prev.filter(s => s.puzzle === puzzleType);
          if (!filtered.length) return prev;
          const lastId = filtered[0].id;
          const updated = prev.filter(s => s.id !== lastId);
          localStorage.setItem('neo_cube_solves', JSON.stringify(updated));
          return updated;
        });
        return;
      }
      setSolves(prev => {
        const filtered = prev.filter(s => s.puzzle === puzzleType);
        if (!filtered.length) return prev;
        const lastId = filtered[0].id;
        let penalty: 'OK' | '+2' | 'DNF' | null = null;
        if (key === 'd') penalty = 'DNF';
        else if (key === 'p') penalty = '+2';
        if (!penalty) return prev;
        const updated = prev.map(s => s.id === lastId ? { ...s, status: penalty! } : s);
        localStorage.setItem('neo_cube_solves', JSON.stringify(updated));
        return updated;
      });
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [puzzleType]);

  const startBldMemo = () => {
    setBldMemoMs(0);
    setBldMemoRunning(true);
    bldMemoStartRef.current = performance.now();
    bldMemoIntervalRef.current = setInterval(() => {
      setBldMemoMs(performance.now() - bldMemoStartRef.current);
    }, 16);
  };

  const stopBldMemo = () => {
    if (bldMemoIntervalRef.current) clearInterval(bldMemoIntervalRef.current);
    setBldMemoRunning(false);
    setBldPhase('solve');
  };

  // Reset BLD phase when puzzle changes away from BLD
  React.useEffect(() => {
    if (puzzleType !== 'BLD') { setBldPhase('memo'); setBldMemoMs(0); setBldMemoRunning(false); }
  }, [puzzleType]);

  const applyPenalty = (solveId: string, penalty: 'OK' | '+2' | 'DNF') => {
    const updated = solves.map(s => s.id === solveId ? { ...s, status: penalty } : s);
    saveSolvesToStorage(updated);
  };

  const saveNote = (solveId: string, note: string) => {
    const updated = solves.map(s => s.id === solveId ? { ...s, note } : s);
    saveSolvesToStorage(updated);
    setNoteEditId(null);
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

  const PUZZLE_TYPES = ['3x3x3', '2x2x2', '4x4x4', '5x5x5', '6x6x6', '7x7x7', 'OH', 'BLD', 'Pyraminx', 'Megaminx', 'Skewb', 'Square-1', 'Clock'];

  const navItems = [
    { id: 'dashboard', icon: Timer, label: 'Timer' },
    { id: 'sessions', icon: History, label: 'Sessions' },
    { id: 'algorithms', icon: BookOpen, label: 'Algorithms' },
    { id: 'statistics', icon: BarChart4, label: 'Analytics' },
    { id: 'train', icon: BrainCircuit, label: 'Train' },
    { id: 'support', icon: HelpCircle, label: 'Help' },
  ] as const;

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col">
      {/* Sub-nav for timer views */}
      <div className="bg-surface border-b border-line px-4 sticky top-14 z-30">
        <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto py-1 scrollbar-hide">
          {navItems.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setCurrentView(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                currentView === id
                  ? 'bg-line text-accent'
                  : 'text-muted hover:text-fg hover:bg-line/50'
              }`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setSoundOn(!soundOn)}
              className="p-1.5 rounded-lg text-muted hover:text-fg hover:bg-line transition-all"
              title={soundOn ? 'Sound On' : 'Sound Off'}
            >
              {soundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="p-1.5 rounded-lg text-muted hover:text-fg hover:bg-line transition-all"
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
                      ? 'bg-accent text-black'
                      : 'bg-elevated text-muted border border-line-strong hover:text-fg hover:border-muted'
                  }`}
                >
                  {pt}
                </button>
              ))}
              <button
                onClick={triggerNewScramble}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono text-muted hover:text-fg border border-line-strong hover:border-muted transition-all"
              >
                <RefreshCw size={12} />
                New Scramble
              </button>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted font-mono">Target:</span>
                <input
                  type="text"
                  value={targetTime}
                  onChange={e => setTargetTime(e.target.value)}
                  placeholder="e.g. 15.00"
                  className="w-20 px-2 py-1 rounded-lg bg-elevated border border-line-strong text-xs font-mono text-fg placeholder-line-strong focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            {/* Scramble display */}
            <div className="bg-surface border border-line rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-1.5">Scramble</p>
                  <p className="font-mono text-sm text-fg leading-relaxed break-all">{scramble || 'Generating...'}</p>
                </div>
                <button
                  onClick={() => { if (scramble) navigator.clipboard.writeText(scramble); }}
                  className="p-2 rounded-lg text-muted hover:text-fg hover:bg-line transition-all flex-shrink-0"
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
                {puzzleType === 'BLD' && bldPhase === 'memo' ? (
                  <div className="flex flex-col items-center gap-4 p-8 bg-[#15191e]/80 border border-[#2b3139] rounded-2xl w-full">
                    <div className="text-center">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-1">BLD · Memo Phase</p>
                      <p className="text-xs text-muted mb-4">Study the scramble carefully. Start memo timer when ready.</p>
                    </div>
                    <div className="font-mono font-black text-6xl text-lime">
                      {bldMemoRunning ? formatTime(bldMemoMs) : '0.000'}
                    </div>
                    <div className="text-[11px] font-mono uppercase tracking-widest text-muted">
                      {bldMemoRunning ? 'Memorizing… press Stop to begin solve' : 'Press Start to begin memorization'}
                    </div>
                    <div className="flex gap-3">
                      {!bldMemoRunning ? (
                        <button onClick={startBldMemo}
                          className="px-6 py-2.5 rounded-xl bg-lime text-black font-bold text-sm hover:bg-lime/80 transition-all">
                          Start Memo
                        </button>
                      ) : (
                        <button onClick={stopBldMemo}
                          className="px-6 py-2.5 rounded-xl bg-accent text-black font-bold text-sm hover:bg-accent/80 transition-all">
                          Stop Memo → Begin Solve
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    {puzzleType === 'BLD' && bldPhase === 'solve' && bldMemoMs > 0 && (
                      <div className="flex items-center justify-between px-4 py-2 bg-lime/10 border border-lime/20 rounded-xl text-xs font-mono">
                        <span className="text-muted">Memo time</span>
                        <span className="text-lime font-bold">{formatTime(bldMemoMs)}</span>
                      </div>
                    )}
                    <TimerDisplay
                      onSolveComplete={handleSolveComplete}
                      onStatusChange={handleStatusChange}
                      inspectionEnabled={inspectionOn && puzzleType !== 'BLD'}
                    />
                  </>
                )}

                {/* Quick stats */}
                <div className={`grid grid-cols-4 gap-2 transition-all duration-300 ${timerBlurred ? 'opacity-20 blur-sm pointer-events-none' : ''}`}>
                  {[
                    { label: 'Best', value: getSingleBest() },
                    { label: 'Mean', value: getMean() },
                    { label: 'Ao5', value: getAvgN(5) },
                    { label: 'Ao12', value: getAvgN(12) },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-surface border border-line rounded-xl p-3 text-center">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-1">{label}</p>
                      <p className="font-mono font-bold text-sm text-fg">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Solve list */}
            <div className={`transition-all duration-300 ${timerBlurred ? 'opacity-20 blur-sm pointer-events-none' : ''}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-fg">
                    Solves <span className="text-muted font-normal">({activeSessionSolves.length})</span>
                  </h3>
                  <span className="text-[9px] text-line-strong font-mono ml-2 hidden sm:inline">D=DNF · P=+2 · Z=undo</span>
                  {/* Cloud save indicator */}
                  {session?.user?.id ? (
                    <span className={`flex items-center gap-1 text-[10px] font-mono transition-all ${
                      saveIndicator === 'saving' ? 'text-amber-400' :
                      saveIndicator === 'saved' ? 'text-emerald-400' :
                      saveIndicator === 'error' ? 'text-red-400' :
                      'text-line-strong'
                    }`}>
                      {saveIndicator === 'saving' ? <RefreshCw size={10} className="animate-spin" /> : <Cloud size={10} />}
                      {saveIndicator === 'saving' && 'Saving...'}
                      {saveIndicator === 'saved' && (lastSavePB ? '🎉 PB saved!' : 'Saved')}
                      {saveIndicator === 'error' && 'Save failed'}
                      {saveIndicator === 'idle' && 'Cloud sync on'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-line-strong">
                      <CloudOff size={10} /> Local only
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsManualOpen(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-muted hover:text-fg border border-line-strong hover:border-muted transition-all"
                  >
                    <Plus size={11} /> Manual
                  </button>
                  <button
                    onClick={exportCSV}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-muted hover:text-fg border border-line-strong hover:border-muted transition-all"
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
                  <div className="text-center py-8 text-muted text-sm">
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
                        className="flex flex-wrap items-center gap-3 px-3 py-2 bg-surface border border-line rounded-xl hover:border-line-strong transition-all group"
                      >
                        <span className="text-[10px] text-muted font-mono w-6 text-right flex-shrink-0">
                          {activeSessionSolves.length - index}
                        </span>
                        <span className={`font-mono text-sm font-semibold flex-1 ${
                          solve.status === 'DNF' ? 'text-red-400' :
                          solve.status === '+2' ? 'text-amber-400' :
                          (() => {
                            const tMs = parseFloat(targetTime) * 1000;
                            if (targetTime && !isNaN(tMs)) {
                              return solve.timeInMs <= tMs ? 'text-emerald-400' : 'text-red-400';
                            }
                            return 'text-fg';
                          })()
                        }`}>
                          {displayTime}
                        </span>
                        {solve.note && (
                          <span className="text-[10px] text-muted italic truncate max-w-[120px] hidden sm:block">{solve.note}</span>
                        )}
                        <span className="text-[10px] text-muted hidden sm:block truncate max-w-[100px]">
                          {new Date(solve.timestamp).toLocaleTimeString()}
                        </span>
                        {/* Penalty buttons */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => applyPenalty(solve.id, 'OK')}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-all ${solve.status === 'OK' ? 'bg-emerald-500/20 text-emerald-400' : 'text-muted hover:text-emerald-400'}`}
                          >OK</button>
                          <button
                            onClick={() => applyPenalty(solve.id, '+2')}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-all ${solve.status === '+2' ? 'bg-amber-500/20 text-amber-400' : 'text-muted hover:text-amber-400'}`}
                          >+2</button>
                          <button
                            onClick={() => applyPenalty(solve.id, 'DNF')}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-all ${solve.status === 'DNF' ? 'bg-red-500/20 text-red-400' : 'text-muted hover:text-red-400'}`}
                          >DNF</button>
                          <button
                            onClick={() => { setNoteEditId(solve.id); setNoteEditText(solve.note ?? ''); }}
                            className="px-1.5 py-0.5 rounded text-[10px] font-mono text-muted hover:text-accent transition-all"
                            title="Add note"
                          >✎</button>
                          <button
                            onClick={() => deleteSolve(solve.id)}
                            className="p-0.5 text-muted hover:text-red-400 transition-colors ml-1"
                          >
                            <X size={11} />
                          </button>
                        </div>
                        {/* Inline note editor */}
                        {noteEditId === solve.id && (
                          <div className="w-full mt-1 flex gap-1" onClick={e => e.stopPropagation()}>
                            <input
                              autoFocus
                              type="text"
                              value={noteEditText}
                              onChange={e => setNoteEditText(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') saveNote(solve.id, noteEditText); if (e.key === 'Escape') setNoteEditId(null); }}
                              placeholder="Add note (Enter to save)"
                              className="flex-1 px-2 py-0.5 rounded bg-elevated border border-line-strong text-[11px] text-fg placeholder-muted focus:outline-none focus:border-accent font-mono"
                            />
                            <button onClick={() => saveNote(solve.id, noteEditText)} className="px-2 py-0.5 rounded bg-accent/10 text-accent text-[10px]">Save</button>
                            <button onClick={() => setNoteEditId(null)} className="px-2 py-0.5 rounded text-muted text-[10px]">✕</button>
                          </div>
                        )}
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
              <h2 className="text-lg font-bold text-fg">Sessions</h2>
              <button
                onClick={() => {
                  const name = prompt('Session name:');
                  if (!name) return;
                  const newSession: Session = { id: `session-${getNow()}`, name, created: getNow() };
                  saveSessionsToStorage([...sessions, newSession]);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent/10 border border-accent/30 text-accent text-xs font-medium hover:bg-accent/20 transition-all"
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
                        ? 'bg-accent/5 border-accent/30'
                        : 'bg-surface border-line hover:border-line-strong'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm text-fg">{session.name}</p>
                        <p className="text-xs text-muted mt-0.5">
                          Created {new Date(session.created).toLocaleDateString()}
                        </p>
                      </div>
                      {activeSessionId === session.id && (
                        <span className="text-[10px] font-mono text-accent border border-accent/30 px-2 py-0.5 rounded-full">ACTIVE</span>
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
              <h2 className="text-lg font-bold text-fg">Algorithms Vault</h2>
              <input
                type="text"
                value={algSearch}
                onChange={e => setAlgSearch(e.target.value)}
                placeholder="Search algorithms..."
                className="px-3 py-1.5 bg-elevated border border-line-strong rounded-xl text-sm text-fg placeholder-muted focus:outline-none focus:border-accent transition-colors font-mono"
              />
            </div>
            <div className="flex gap-2">
              {(['ALL', 'F2L', 'OLL', 'PLL'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveAlgCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold font-mono transition-all ${
                    activeAlgCategory === cat
                      ? 'bg-accent text-black'
                      : 'bg-elevated text-muted border border-line-strong hover:text-fg'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredAlgs.map(alg => (
                <div key={alg.id} className="bg-surface border border-line rounded-xl p-4 hover:border-line-strong transition-all group">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        alg.category === 'F2L' ? 'bg-blue-500/10 text-blue-400' :
                        alg.category === 'OLL' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-emerald-500/10 text-emerald-400'
                      }`}>{alg.category}</span>
                      <p className="text-xs font-semibold text-fg mt-1">{alg.name}</p>
                    </div>
                    <button
                      onClick={() => copyAlg(alg)}
                      className="p-1.5 rounded-lg text-muted hover:text-accent hover:bg-accent/10 transition-all opacity-0 group-hover:opacity-100"
                    >
                      {copiedAlgId === alg.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    </button>
                  </div>
                  <p className="font-mono text-[11px] text-accent mb-2 break-all">{alg.sequence}</p>
                  <p className="text-[10px] text-muted leading-relaxed">{alg.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STATISTICS VIEW ── */}
        {currentView === 'statistics' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-fg">Performance Analytics</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Total Solves', value: activeSessionSolves.length.toString() },
                { label: 'Personal Best', value: getSingleBest() },
                { label: 'Session Mean', value: getMean() },
                { label: 'Ao12', value: getAvgN(12) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-surface border border-line rounded-2xl p-5 text-center">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-2">{label}</p>
                  <p className="font-mono font-black text-2xl text-fg">{value}</p>
                </div>
              ))}
            </div>
            {activeSessionSolves.length > 0 && (
              <div className="bg-surface border border-line rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-fg mb-4">Solve History</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono">
                    <thead>
                      <tr className="text-muted border-b border-line">
                        <th className="text-left pb-2 pr-4">#</th>
                        <th className="text-left pb-2 pr-4">Time</th>
                        <th className="text-left pb-2 pr-4">Status</th>
                        <th className="text-left pb-2 pr-4">Date</th>
                        <th className="text-left pb-2">Scramble</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...activeSessionSolves].reverse().map((s, i) => (
                        <tr key={s.id} className="border-b border-line/50 hover:bg-elevated transition-colors">
                          <td className="py-1.5 pr-4 text-muted">{i + 1}</td>
                          <td className={`py-1.5 pr-4 font-bold ${s.status === 'DNF' ? 'text-red-400' : s.status === '+2' ? 'text-amber-400' : 'text-fg'}`}>
                            {s.status === 'DNF' ? 'DNF' : formatTime(s.status === '+2' ? s.timeInMs + 2000 : s.timeInMs)}
                          </td>
                          <td className="py-1.5 pr-4 text-muted">{s.status}</td>
                          <td className="py-1.5 pr-4 text-muted">{new Date(s.timestamp).toLocaleDateString()}</td>
                          <td className="py-1.5 text-muted truncate max-w-[200px]">{s.scramble.substring(0, 40)}...</td>
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
            <h2 className="text-lg font-bold text-fg">Training Sandbox</h2>
            <div className="bg-surface border border-line rounded-2xl p-6">
              <div className="mb-4">
                <label className="text-xs font-mono text-muted uppercase tracking-widest mb-2 block">Select Algorithm to Drill</label>
                <select
                  value={trainAlgId}
                  onChange={e => { setTrainAlgId(e.target.value); resetTrainTimer(); }}
                  className="w-full px-3 py-2 bg-elevated border border-line-strong rounded-xl text-sm text-fg focus:outline-none focus:border-accent transition-colors"
                >
                  {CONSTANT_ALGORITHMS.map(a => (
                    <option key={a.id} value={a.id}>{a.category} · {a.name}</option>
                  ))}
                </select>
              </div>

              {(() => {
                const alg = CONSTANT_ALGORITHMS.find(a => a.id === trainAlgId);
                return alg ? (
                  <div className="mb-6 p-4 bg-elevated rounded-xl border border-line-strong">
                    <p className="text-xs text-muted mb-1">{alg.description}</p>
                    <p className="font-mono text-sm text-accent font-bold">{alg.sequence}</p>
                  </div>
                ) : null;
              })()}

              <div className="text-center">
                <div className="font-mono text-6xl font-black text-fg mb-6">
                  {(trainTimer / 1000).toFixed(2)}
                </div>
                <div className="flex items-center justify-center gap-3">
                  {trainState === 'idle' && (
                    <button onClick={startTrainTimer} className="px-6 py-2.5 rounded-xl bg-accent/10 border border-accent/30 text-accent font-bold text-sm hover:bg-accent/20 transition-all">
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
                      <button onClick={startTrainTimer} className="px-6 py-2.5 rounded-xl bg-accent/10 border border-accent/30 text-accent font-bold text-sm hover:bg-accent/20 transition-all">
                        Again
                      </button>
                      <button onClick={resetTrainTimer} className="px-4 py-2.5 rounded-xl bg-line text-muted text-sm hover:text-fg transition-all">
                        Reset
                      </button>
                    </>
                  )}
                </div>
                {trainSolves.length > 0 && (
                  <div className="mt-4 text-xs text-muted">
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
            <h2 className="text-lg font-bold text-fg">Help & Support</h2>
            <div className="space-y-3">
              {[
                { q: 'How do I start the timer?', a: 'Hold the spacebar until it turns green, then release to start timing. Press any key to stop.' },
                { q: 'How are Ao5/Ao12 calculated?', a: 'Average of 5/12 removes the best and worst time, then averages the remaining. DNF counts as infinity.' },
                { q: 'How do I apply a +2 penalty?', a: 'Hover over a solve in the list and click "+2". The time will display with a + suffix.' },
                { q: 'Can I export my solves?', a: 'Yes! Click the CSV button in the Timer view to download all solves for the current puzzle type.' },
                { q: 'Is my data saved?', a: 'All solves are saved to your browser\'s localStorage. Clearing browser data will remove them. Cloud sync coming soon.' },
              ].map(({ q, a }) => (
                <div key={q} className="bg-surface border border-line rounded-xl p-4">
                  <div className="flex items-start gap-2">
                    <HelpCircle size={14} className="text-muted mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-fg mb-1">{q}</p>
                      <p className="text-xs text-muted leading-relaxed">{a}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
