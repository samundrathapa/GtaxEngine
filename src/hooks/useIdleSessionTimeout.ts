import { useState, useEffect, useRef, useCallback } from "react";

interface UseIdleSessionTimeoutOptions {
  onTimeout: () => void;
  enabled?: boolean;
  warningSeconds?: number;
}

export const useIdleSessionTimeout = ({
  onTimeout,
  enabled = true,
  warningSeconds = 60
}: UseIdleSessionTimeoutOptions) => {
  // Read timeout duration from env variable VITE_IDLE_SESSION_TIMEOUT_MINUTES
  const envMinutes = import.meta.env.VITE_IDLE_SESSION_TIMEOUT_MINUTES;
  const parsedMinutes = envMinutes ? parseFloat(envMinutes) : 15;
  const timeoutMinutes = isNaN(parsedMinutes) || parsedMinutes <= 0 ? 15 : parsedMinutes;
  const totalTimeoutMs = timeoutMinutes * 60 * 1000;

  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(warningSeconds);

  const lastActivityRef = useRef<number>(Date.now());
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setIsWarningOpen(false);
    setSecondsRemaining(warningSeconds);
  }, [warningSeconds]);

  useEffect(() => {
    if (!enabled || totalTimeoutMs <= 0) {
      setIsWarningOpen(false);
      return;
    }

    lastActivityRef.current = Date.now();

    // Throttled activity listener (records at most once every 1000ms)
    let lastThrottledRecord = 0;
    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastThrottledRecord > 1000) {
        lastThrottledRecord = now;
        // If the warning modal is not currently open, reset the activity timestamp
        // If warning is already open, user must explicitly click "Stay Logged In" or interact
        lastActivityRef.current = now;
      }
    };

    const activityEvents = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "wheel"];
    activityEvents.forEach((event) => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Check interval every 1 second
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastActivityRef.current;
      const remainingMs = totalTimeoutMs - elapsed;
      const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));

      if (remainingMs <= 0) {
        // Time expired! Auto logout
        setIsWarningOpen(false);
        clearInterval(interval);
        onTimeoutRef.current();
      } else if (remainingSec <= warningSeconds) {
        setIsWarningOpen(true);
        setSecondsRemaining(remainingSec);
      } else {
        setIsWarningOpen(false);
      }
    }, 1000);

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
      clearInterval(interval);
    };
  }, [enabled, totalTimeoutMs, warningSeconds]);

  return {
    isWarningOpen,
    secondsRemaining,
    timeoutMinutes,
    resetTimer
  };
};
