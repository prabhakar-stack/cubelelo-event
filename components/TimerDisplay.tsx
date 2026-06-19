'use client';

import React from 'react';
import { useSpeedcubeTimer, formatTime, TimerStatus } from '../hooks/useSpeedcubeTimer';

interface TimerDisplayProps {
  onSolveComplete?: (time: number) => void;
  onStatusChange?: (status: TimerStatus) => void;
}

export default function TimerDisplay({ onSolveComplete, onStatusChange }: TimerDisplayProps) {
  const { status, time, timeRef, reset } = useSpeedcubeTimer(onSolveComplete);

  React.useEffect(() => {
    if (onStatusChange) {
      onStatusChange(status);
    }
  }, [status, onStatusChange]);

  const getTextColorClass = () => {
    switch (status) {
      case 'holding':
        return 'text-red-500 shadow-red-500/20';
      case 'ready':
        return 'text-[#a3fa00] shadow-[#a3fa00]/20';
      case 'running':
        return 'text-[#00dbe7] animate-pulse';
      case 'idle':
      default:
        return 'text-white';
    }
  };

  const getInstructions = () => {
    switch (status) {
      case 'holding':
        return 'Keep holding spacebar...';
      case 'ready':
        return 'READY! Release spacebar to start';
      case 'running':
        return 'Press ANY key to stop';
      case 'idle':
      default:
        return 'Hold SPACEBAR to prime timer';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-[#15191e]/80 border border-[#2b3139] rounded-2xl w-full max-w-xl mx-auto backdrop-blur-md shadow-2xl relative overflow-hidden group">
      {/* Decorative background glow that changes color according to state */}
      <div 
        className={`absolute -inset-10 rounded-full blur-3xl opacity-5 transition-all duration-300 pointer-events-none ${
          status === 'holding' ? 'bg-red-500 opacity-10' :
          status === 'ready' ? 'bg-[#a3fa00] opacity-10' :
          status === 'running' ? 'bg-[#00dbe7] opacity-10' : 'bg-white/5'
        }`}
      />

      {/* Timer digits display */}
      <div className="relative z-10 text-center font-mono select-none">
        <span
          ref={timeRef as React.RefObject<HTMLSpanElement>}
          className={`text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter drop-shadow-md select-none transition-colors duration-150 ${getTextColorClass()}`}
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {formatTime(time)}
        </span>

        {/* Live instructions */}
        <div className="mt-4 flex items-center justify-center gap-2">
          {status === 'running' && (
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00dbe7] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00dbe7]"></span>
            </span>
          )}
          <p className="text-[11px] font-mono uppercase tracking-widest text-[#b9cacb] font-semibold">
            {getInstructions()}
          </p>
        </div>
      </div>

      {/* Manual Reset action */}
      {status === 'idle' && time > 0 && (
        <button
          onClick={reset}
          className="mt-6 z-10 px-5 py-2 text-xs font-mono font-bold tracking-widest text-red-400 border border-red-500/30 hover:bg-red-500/10 rounded-lg transition-all uppercase cursor-pointer"
        >
          Reset Timer
        </button>
      )}
    </div>
  );
}
