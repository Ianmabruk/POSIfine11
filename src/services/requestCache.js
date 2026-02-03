const cacheStore = new Map();
const inFlight = new Map();

const now = () => Date.now();

export const requestWithSWR = async (key, fetcher, options = {}) => {
  const ttlMs = options.ttlMs ?? 5000;
  const swrMs = options.swrMs ?? 30000;

  const cached = cacheStore.get(key);
  const age = cached ? now() - cached.timestamp : Infinity;

  if (cached && age < ttlMs) {
    return cached.data;
  }

  if (inFlight.has(key)) {
    return inFlight.get(key);
  }

  if (cached && age < ttlMs + swrMs) {
    const revalidatePromise = Promise.resolve()
      .then(fetcher)
      .then((data) => {
        cacheStore.set(key, { data, timestamp: now() });
        return data;
      })
      .catch(() => cached.data)
      .finally(() => {
        inFlight.delete(key);
      });

    inFlight.set(key, revalidatePromise);
    return cached.data;
  }

  const requestPromise = Promise.resolve()
    .then(fetcher)
    .then((data) => {
      cacheStore.set(key, { data, timestamp: now() });
      return data;
    })
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, requestPromise);
  return requestPromise;
};

export const invalidateCache = (key) => {
  if (!key) {
    cacheStore.clear();
    return;
  }
  cacheStore.delete(key);
};
