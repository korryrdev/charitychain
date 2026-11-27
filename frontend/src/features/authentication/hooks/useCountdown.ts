import { useCallback, useEffect, useState } from 'react';

export interface Countdown {
  /** Whole seconds left (0 when idle). */
  remaining: number;
  active: boolean;
  start: (seconds: number) => void;
  reset: () => void;
}

/** Whole-second countdown driven by a wall-clock deadline, so it stays correct in background tabs. */
export function useCountdown(initialSeconds = 0): Countdown {
  const [endsAt, setEndsAt] = useState<number | null>(() =>
    initialSeconds > 0 ? Date.now() + initialSeconds * 1000 : null,
  );
  const [remaining, setRemaining] = useState(Math.max(0, Math.ceil(initialSeconds)));

  useEffect(() => {
    if (endsAt === null) return undefined;
    const id = setInterval(() => {
      const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) setEndsAt(null);
    }, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  const start = useCallback((seconds: number) => {
    const whole = Math.max(0, Math.ceil(seconds));
    setRemaining(whole);
    setEndsAt(whole > 0 ? Date.now() + whole * 1000 : null);
  }, []);

  const reset = useCallback(() => {
    setRemaining(0);
    setEndsAt(null);
  }, []);

  return { remaining, active: remaining > 0, start, reset };
}
