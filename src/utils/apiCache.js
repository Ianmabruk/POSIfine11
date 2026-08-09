const CACHE_PREFIX = 'api_cache_';
const DEFAULT_TTL_MS = 5 * 60 * 1000;

function getCached(key) {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;
    const { value, expiresAt } = JSON.parse(raw);
    if (Date.now() > expiresAt) {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }
    return value;
  } catch {
    return null;
  }
}

function setCached(key, value, ttlMs = DEFAULT_TTL_MS) {
  try {
    const payload = JSON.stringify({ value, expiresAt: Date.now() + ttlMs });
    localStorage.setItem(`${CACHE_PREFIX}${key}`, payload);
  } catch {
    // Storage full or unavailable
  }
}

export function cacheGet(key) {
  return getCached(key);
}

export function cacheSet(key, value, ttlMs) {
  setCached(key, value, ttlMs);
}

export function cacheClear(pattern) {
  if (!pattern) {
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith(CACHE_PREFIX)) localStorage.removeItem(k);
    });
    return;
  }
  const regex = new RegExp(pattern);
  Object.keys(localStorage).forEach((k) => {
    if (k.startsWith(CACHE_PREFIX) && regex.test(k)) {
      localStorage.removeItem(k);
    }
  });
}
