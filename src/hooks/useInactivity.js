import { useState, useEffect, useCallback } from 'react';

export default function useInactivity(timeout = 60000) { // Default 1 minute
  const [isLocked, setIsLocked] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());

  const resetTimer = useCallback(() => {
    setLastActivity(Date.now());
    if (isLocked) {
      setIsLocked(false);
    }
  }, [isLocked]);

  const unlock = useCallback(() => {
    setIsLocked(false);
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    const handleActivity = () => {
      resetTimer();
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Set up interval to check for inactivity
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastActivity > timeout && !isLocked) {
        setIsLocked(true);
      }
    }, 1000); // Check every second

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      clearInterval(interval);
    };
  }, [lastActivity, timeout, isLocked, resetTimer]);

  return [isLocked, unlock, resetTimer];
}