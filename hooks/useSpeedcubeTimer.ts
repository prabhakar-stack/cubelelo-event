import { useEffect, useRef, useState, useCallback } from 'react';

export type TimerStatus = 'idle' | 'holding' | 'ready' | 'inspection' | 'running';

export interface SpeedcubeTimerResult {
  status: TimerStatus;
  time: number;
  inspectionTime: number;   // seconds elapsed during inspection (0 when not in inspection)
  inspectionPenalty: 'none' | '+2' | 'DNF';
  timeRef: React.RefObject<HTMLElement | null>;
  reset: () => void;
}

interface UseSpeedcubeTimerOptions {
  inspectionEnabled?: boolean;
  onSolveComplete?: (time: number, penalty: 'none' | '+2' | 'DNF') => void;
  onStatusChange?: (status: TimerStatus) => void;
}

export function useSpeedcubeTimer(
  onSolveComplete?: (time: number, penalty?: 'none' | '+2' | 'DNF') => void,
  options?: UseSpeedcubeTimerOptions
): SpeedcubeTimerResult {
  const inspectionEnabled = options?.inspectionEnabled ?? false;

  const [status, setStatus] = useState<TimerStatus>('idle');
  const [time, setTime] = useState<number>(0);
  const [inspectionTime, setInspectionTime] = useState<number>(0);
  const [inspectionPenalty, setInspectionPenalty] = useState<'none' | '+2' | 'DNF'>('none');

  const workerRef = useRef<Worker | null>(null);
  const timeRef = useRef<HTMLElement | null>(null);
  const statusRef = useRef<TimerStatus>('idle');
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inspectionStartRef = useRef<number>(0);
  const inspectionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const penaltyRef = useRef<'none' | '+2' | 'DNF'>('none');
  const activeTouchesRef = useRef<number>(0);

  // Keep statusRef in sync
  useEffect(() => { statusRef.current = status; }, [status]);

  // Notify parent of status changes
  useEffect(() => { options?.onStatusChange?.(status); }, [status, options]);

  // ── Web Worker ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const worker = new Worker('/timer.worker.js');
    workerRef.current = worker;
    worker.onmessage = (e) => {
      const { type, elapsed } = e.data;
      if (type === 'TICK') {
        if (timeRef.current) timeRef.current.textContent = formatTime(elapsed);
      } else if (type === 'STOPPED') {
        setTime(elapsed);
        if (timeRef.current) timeRef.current.textContent = formatTime(elapsed);
        setStatus('idle');
        const penalty = penaltyRef.current;
        setInspectionPenalty(penalty);
        onSolveComplete?.(elapsed, penalty);
      }
    };
    return () => worker.terminate();
  }, [onSolveComplete]);

  // ── Inspection countdown ─────────────────────────────────────────────────────
  const startInspection = useCallback(() => {
    penaltyRef.current = 'none';
    setInspectionPenalty('none');
    setInspectionTime(0);
    inspectionStartRef.current = performance.now();
    setStatus('inspection');

    inspectionIntervalRef.current = setInterval(() => {
      const elapsed = (performance.now() - inspectionStartRef.current) / 1000;
      setInspectionTime(elapsed);

      if (elapsed >= 17) {
        // Auto DNF
        clearInterval(inspectionIntervalRef.current!);
        penaltyRef.current = 'DNF';
        setInspectionPenalty('DNF');
        // Auto submit DNF
        setStatus('idle');
        onSolveComplete?.(0, 'DNF');
      } else if (elapsed >= 15) {
        penaltyRef.current = '+2';
        setInspectionPenalty('+2');
      }
    }, 50);
  }, [onSolveComplete]);

  const stopInspection = useCallback(() => {
    if (inspectionIntervalRef.current) {
      clearInterval(inspectionIntervalRef.current);
      inspectionIntervalRef.current = null;
    }
  }, []);

  // ── Start timer (after inspection or directly) ──────────────────────────────
  const startTimer = useCallback(() => {
    stopInspection();
    setStatus('running');
    workerRef.current?.postMessage({ action: 'START' });
  }, [stopInspection]);

  const stopTimer = useCallback(() => {
    workerRef.current?.postMessage({ action: 'STOP' });
  }, []);

  // ── Arm / Ready logic shared by keyboard + touch ────────────────────────────
  const onArm = useCallback(() => {
    if (statusRef.current !== 'idle') return;
    setStatus('holding');
    holdTimeoutRef.current = setTimeout(() => {
      setStatus('ready');
    }, 300);
  }, []);

  const onRelease = useCallback(() => {
    if (holdTimeoutRef.current) { clearTimeout(holdTimeoutRef.current); holdTimeoutRef.current = null; }
    const cur = statusRef.current;
    if (cur === 'ready') {
      if (inspectionEnabled) {
        startInspection();
      } else {
        startTimer();
      }
    } else if (cur === 'holding') {
      setStatus('idle');
    }
  }, [inspectionEnabled, startInspection, startTimer]);

  const onStop = useCallback(() => {
    const cur = statusRef.current;
    if (cur === 'running') {
      stopTimer();
    } else if (cur === 'inspection') {
      startTimer();
    }
  }, [stopTimer, startTimer]);

  // ── Keyboard events ──────────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT','TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.code === 'Space') e.preventDefault();

      const cur = statusRef.current;
      if (cur === 'running') { stopTimer(); return; }
      if (cur === 'inspection') { startTimer(); return; }
      if (e.code === 'Space' && cur === 'idle') onArm();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['INPUT','TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.code === 'Space') { e.preventDefault(); onRelease(); }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onArm, onRelease, stopTimer, startTimer]);

  // ── Touch events (two-finger) ────────────────────────────────────────────────
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      activeTouchesRef.current = e.touches.length;
      const cur = statusRef.current;

      if (cur === 'running' || cur === 'inspection') {
        onStop();
        return;
      }

      // Two or more fingers → arm
      if (e.touches.length >= 2 && cur === 'idle') {
        e.preventDefault();
        onArm();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      activeTouchesRef.current = e.touches.length;
      const cur = statusRef.current;

      // All fingers lifted
      if (e.touches.length === 0) {
        if (cur === 'ready' || cur === 'holding') {
          e.preventDefault();
          onRelease();
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: false });
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onArm, onRelease, onStop]);

  // Cleanup inspection on unmount
  useEffect(() => () => {
    if (inspectionIntervalRef.current) clearInterval(inspectionIntervalRef.current);
    if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
  }, []);

  const reset = useCallback(() => {
    stopInspection();
    workerRef.current?.postMessage({ action: 'RESET' });
    setStatus('idle');
    setTime(0);
    setInspectionTime(0);
    setInspectionPenalty('none');
    penaltyRef.current = 'none';
    if (timeRef.current) timeRef.current.textContent = '0.000';
  }, [stopInspection]);

  return { status, time, inspectionTime, inspectionPenalty, timeRef, reset };
}

export function formatTime(timeInMs: number): string {
  if (timeInMs < 0) return '0.000';
  const minutes = Math.floor(timeInMs / 60000);
  const seconds = Math.floor((timeInMs % 60000) / 1000);
  const ms = Math.floor(timeInMs % 1000);
  const msStr = ms.toString().padStart(3, '0');
  if (minutes > 0) return `${minutes}:${seconds.toString().padStart(2, '0')}.${msStr}`;
  return `${seconds}.${msStr}`;
}
