let startTime = 0;
let timerInterval = null;
let isRunning = false;

self.onmessage = function (e) {
  const { action } = e.data;

  if (action === 'START') {
    if (isRunning) return;
    isRunning = true;
    startTime = performance.now();
    timerInterval = setInterval(() => {
      const elapsed = performance.now() - startTime;
      self.postMessage({ type: 'TICK', elapsed });
    }, 10);
  } else if (action === 'STOP') {
    if (!isRunning) return;
    isRunning = false;
    clearInterval(timerInterval);
    const finalElapsed = performance.now() - startTime;
    self.postMessage({ type: 'STOPPED', elapsed: finalElapsed });
  } else if (action === 'RESET') {
    isRunning = false;
    clearInterval(timerInterval);
    self.postMessage({ type: 'TICK', elapsed: 0 });
  }
};
