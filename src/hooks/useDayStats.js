import { useEffect, useState } from 'react';

const normalizeValue = (defaultValue, storedValue) => {
  if (typeof defaultValue === 'number') {
    return Number.isFinite(storedValue) ? storedValue : defaultValue;
  }
  if (typeof defaultValue === 'string') {
    return typeof storedValue === 'string' ? storedValue : defaultValue;
  }
  if (typeof defaultValue === 'boolean') {
    return typeof storedValue === 'boolean' ? storedValue : defaultValue;
  }
  return storedValue ?? defaultValue;
};

export const useDayStats = (defaults, storageKey = 'dayStats') => {
  const [stats, setStats] = useState(defaults);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || '{}');
      const next = Object.keys(defaults).reduce((acc, key) => {
        acc[key] = normalizeValue(defaults[key], stored?.[key]);
        return acc;
      }, {});
      setStats(next);
      setError('');
    } catch (err) {
      setStats(defaults);
      setError("Unable to load today's stats");
    }
  }, [storageKey, JSON.stringify(defaults)]);

  return { stats, error };
};
