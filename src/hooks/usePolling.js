import { useEffect, useRef } from 'react';

export function usePolling(callback, intervalMs = 5000, enabled = true) {
  const callbackRef = useRef(callback);
  const inFlightRef = useRef(false);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled || intervalMs <= 0) return undefined;

    let active = true;
    let timerId = null;

    const scheduleNext = () => {
      if (!active) return;
      timerId = window.setTimeout(runPoll, intervalMs);
    };

    const runPoll = async () => {
      if (!active) return;
      if (inFlightRef.current) {
        scheduleNext();
        return;
      }

      inFlightRef.current = true;
      try {
        await callbackRef.current?.();
      } catch {
        // Polling callers handle their own errors silently
      } finally {
        inFlightRef.current = false;
        scheduleNext();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && active && !inFlightRef.current) {
        if (timerId) {
          window.clearTimeout(timerId);
          timerId = null;
        }
        runPoll();
      }
    };

    scheduleNext();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      active = false;
      if (timerId) {
        window.clearTimeout(timerId);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [intervalMs, enabled]);
}
