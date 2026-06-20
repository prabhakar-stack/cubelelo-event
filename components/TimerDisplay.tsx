'use client';

import React from 'react';
import { useSpeedcubeTimer, formatTime, TimerStatus } from '../hooks/useSpeedcubeTimer';

interface TimerDisplayProps {
  onSolveComplete?: (time: number, penalty?: 'none' | '+2' | 'DNF') => void;
  onStatusChange?: (status: TimerStatus) => void;
  inspectionEnabled?: boolean;
}

export default function TimerDisplay({ onSolveComplete, onStatusChange, inspectionEnabled }: TimerDisplayProps) {
  const { status, time, inspectionTime, inspectionPenalty, timeRef, reset } =
    useSpeedcubeTimer(onSolveComplete, { inspectionEnabled, onStatusChange });

  // Inspection state helpers
  const inspSecs = Math.floor(inspectionTime);
  const inspRemaining = Math.max(0, 15 - inspSecs);
  const inspWarning  = inspSecs >= 8 && inspSecs < 15;
  const inspPlus2    = inspSecs >= 15 && inspSecs < 17;
  const inspDNF      = inspSecs >= 17;

  const getTextColorClass = () => {
    if (status === 'inspection') {
      if (inspDNF)    return 'text-red-500';
      if (inspPlus2)  return 'text-amber-400';
      if (inspWarning) return 'text-amber-300';
      return 'text-[#a3fa00]';
    }
    switch (status) {
      case 'holding': return 'text-red-500';
      case 'ready':   return 'text-[#a3fa00]';
      case 'running': return 'text-[#00dbe7] animate-pulse';
      default:        return 'text-white';
    }
  };

  const getInstructions = () => {
    if (status === 'inspection') {
      if (inspDNF)   return '⚠ DNF — time exceeded';
      if (inspPlus2) return `+2 penalty — press SPACE to start`;
      if (inspWarning) return `8 SECONDS — press SPACE to start`;
      return `Inspecting — ${inspRemaining}s remaining — press SPACE to start`;
    }
    switch (status) {
      case 'holding': return 'Keep holding…';
      case 'ready':   return 'READY — release to start';
      case 'running': return 'Press SPACE to stop';
      default:        return inspectionEnabled
        ? 'Hold SPACE to prime · inspection enabled'
        : 'Hold SPACE to prime · tap 2 fingers on mobile';
    }
  };

  const getDisplayValue = () => {
    if (status === 'inspection') {
      // Show countdown from 15 (or 17 after 15)
      if (inspDNF)   return 'DNF';
      if (inspPlus2) return `${inspSecs}s (+2)`;
      return `${inspRemaining}s`;
    }
    return null; // use the ref-driven DOM update for running
  };

  const displayOverride = getDisplayValue();

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-[#15191e]/80 border border-[#2b3139] rounded-2xl w-full max-w-xl mx-auto backdrop-blur-md shadow-2xl relative overflow-hidden">
      {/* Background glow */}
      <div className={`absolute -inset-10 rounded-full blur-3xl pointer-events-none transition-all duration-300 ${
        status === 'holding'    ? 'bg-red-500 opacity-10' :
        status === 'ready'      ? 'bg-[#a3fa00] opacity-10' :
        status === 'inspection' ? (inspPlus2 || inspDNF ? 'bg-amber-500 opacity-10' : 'bg-[#a3fa00] opacity-5') :
        status === 'running'    ? 'bg-[#00dbe7] opacity-10' : 'bg-white/0'
      }`} />

      {/* Inspection progress bar */}
      {status === 'inspection' && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#21262d] rounded-t-2xl overflow-hidden">
          <div
            className={`h-full transition-all duration-100 ${inspPlus2 || inspDNF ? 'bg-amber-400' : 'bg-[#a3fa00]'}`}
            style={{ width: `${Math.min(100, (inspectionTime / 17) * 100)}%` }}
          />
        </div>
      )}

      <div className="relative z-10 text-center font-mono select-none">
        {displayOverride !== null ? (
          <div className={`text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter drop-shadow-md transition-colors duration-150 ${getTextColorClass()}`}
            style={{ fontVariantNumeric: 'tabular-nums' }}>
            {displayOverride}
          </div>
        ) : (
          <span
            ref={timeRef as React.RefObject<HTMLSpanElement>}
            className={`text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter drop-shadow-md select-none transition-colors duration-150 ${getTextColorClass()}`}
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {formatTime(time)}
          </span>
        )}

        <div className="mt-4 flex items-center justify-center gap-2">
          {status === 'running' && (
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00dbe7] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00dbe7]" />
            </span>
          )}
          <p className={`text-[11px] font-mono uppercase tracking-widest font-semibold transition-colors ${
            status === 'inspection' && (inspPlus2 || inspDNF) ? 'text-amber-400' : 'text-[#b9cacb]'
          }`}>
            {getInstructions()}
          </p>
        </div>

        {/* Penalty badge after inspection */}
        {status === 'idle' && inspectionPenalty !== 'none' && time > 0 && (
          <div className="mt-2 text-xs font-mono text-amber-400">
            {inspectionPenalty === '+2' ? '+2 penalty applied' : 'DNF — inspection exceeded 17s'}
          </div>
        )}
      </div>

      {status === 'idle' && time > 0 && (
        <button onClick={reset}
          className="mt-6 z-10 px-5 py-2 text-xs font-mono font-bold tracking-widest text-red-400 border border-red-500/30 hover:bg-red-500/10 rounded-lg transition-all uppercase cursor-pointer">
          Reset Timer
        </button>
      )}
    </div>
  );
}
