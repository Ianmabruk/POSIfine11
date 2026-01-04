import { useEffect, useState, useRef, useCallback } from 'react';

export default function useInactivity(timeout = 45000) {
  const [isLocked, setIsLocked] = useState(false);
  const timerRef = useRef(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => setIsLocked(true), timeout);
  }, [timeout]);

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });

    resetTimer();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, resetTimer, true);
      });
    };
  }, [resetTimer]);

  const unlock = useCallback(() => {
    setIsLocked(false);
    resetTimer();
  }, [resetTimer]);

  return [isLocked, unlock];
}
