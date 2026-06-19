import { useEffect, useRef, useState } from 'react';

export type TimerStatus = 'idle' | 'holding' | 'ready' | 'running';

export function useSpeedcubeTimer(onSolveComplete?: (time: number) => void) {
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [time, setTime] = useState<number>(0);

  const workerRef = useRef<Worker | null>(null);
  const timeRef = useRef<HTMLElement | null>(null);
  const statusRef = useRef<TimerStatus>('idle');
  const holdTimeoutRef = useRef<any>(null);

  // Sync ref to avoid stale closures in event listeners
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    // Instantiate web worker safely on the client side
    const worker = new Worker('/timer.worker.js');
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const { type, elapsed } = e.data;
      if (type === 'TICK') {
        if (timeRef.current) {
          timeRef.current.textContent = formatTime(elapsed);
        }
      } else if (type === 'STOPPED') {
        setTime(elapsed);
        if (timeRef.current) {
          timeRef.current.textContent = formatTime(elapsed);
        }
        setStatus('idle');
        if (onSolveComplete) {
          onSolveComplete(elapsed);
        }
      }
    };

    return () => {
      worker.terminate();
    };
  }, [onSolveComplete]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent page scroll on spacebar
      if (e.code === 'Space') {
        e.preventDefault();
      }

      // Ignore keyboard events if user is typing in an input
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      const currentStatus = statusRef.current;

      if (currentStatus === 'running') {
        // Any key down stops the timer
        workerRef.current?.postMessage({ action: 'STOP' });
        return;
      }

      // If spacebar is pressed and we're idle, start priming
      if (e.code === 'Space' && currentStatus === 'idle') {
        setStatus('holding');
        
        if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
        holdTimeoutRef.current = setTimeout(() => {
          setStatus('ready');
        }, 300); // WCA standard Stackmat hold threshold
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
      }

      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      if (holdTimeoutRef.current) {
        clearTimeout(holdTimeoutRef.current);
      }

      const currentStatus = statusRef.current;

      if (currentStatus === 'ready') {
        setStatus('running');
        workerRef.current?.postMessage({ action: 'START' });
      } else if (currentStatus === 'holding') {
        // Released too early, go back to idle
        setStatus('idle');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
    };
  }, []);

  return {
    status,
    time,
    timeRef,
    reset: () => {
      workerRef.current?.postMessage({ action: 'RESET' });
      setStatus('idle');
      setTime(0);
      if (timeRef.current) {
        timeRef.current.textContent = '0.000';
      }
    }
  };
}

export function formatTime(timeInMs: number): string {
  if (timeInMs < 0) return '0.000';
  const totalSeconds = timeInMs / 1000;
  
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const milliseconds = Math.floor((timeInMs % 1000));
  
  const msStr = milliseconds.toString().padStart(3, '0');
  
  if (minutes > 0) {
    const secStr = seconds.toString().padStart(2, '0');
    return `${minutes}:${secStr}.${msStr}`;
  } else {
    return `${seconds}.${msStr}`;
  }
}
