/* Consolidated socket implementation.
   Uses browser WebSocket to connect to the server WS endpoint and
   falls back to no-op behavior if WebSocket isn't available/usable.
*/

const getBaseUrl = () => {
  // Prefer Vite's `import.meta.env.VITE_API_BASE` when available.
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) {
      return import.meta.env.VITE_API_BASE;
    }
  } catch (_) {}

  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin + '/api';
  }

  return '/api';
};

const BASE = getBaseUrl();

let ws = null;
const listeners = new Map();

function buildWsUrl() {
  const token = (typeof window !== 'undefined') ? localStorage.getItem('token') : null;
  const base = (BASE || '/api').replace(/\/api\/?$/, '');
  const url = `${base}/api/ws/products${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  return url.replace(/^http/, 'ws');
}

const socket = {
  connect() {
    if (typeof WebSocket === 'undefined') {
      console.info('WebSocket not available in this environment');
      return;
    }
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;
    const url = buildWsUrl();
    try {
      ws = new WebSocket(url);
    } catch (e) {
      console.error('WebSocket connect failed', e);
      ws = null;
      return;
    }

    ws.onopen = () => { console.info('WebSocket connected'); };

    ws.onmessage = (evt) => {
      let data = null;
      try { data = JSON.parse(evt.data); } catch { return; }

      if (data && data.type === 'initial' && Array.isArray(data.products)) {
        data.products.forEach(p => {
          const cbs = listeners.get('productCreated') || [];
          cbs.forEach(fn => { try { fn(p); } catch(_){} });
        });
        return;
      }

      if (data && data.event) {
        const cbs = listeners.get(data.event) || [];
        cbs.forEach(fn => { try { fn(data.payload); } catch(_){} });
      }
    };

    ws.onclose = () => { ws = null; console.info('WebSocket closed'); };
    ws.onerror = (e) => { console.error('WebSocket error', e); };
  },

  emit(event, payload) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      // not connected; ignore or optionally queue
      return;
    }
    try { ws.send(JSON.stringify({ event, payload })); } catch (e) { console.error('send failed', e); }
  },

  on(event, cb) {
    const arr = listeners.get(event) || [];
    arr.push(cb);
    listeners.set(event, arr);
  },

  off(event, cb) {
    if (!listeners.has(event)) return;
    if (!cb) { listeners.delete(event); return; }
    const arr = listeners.get(event).filter(f => f !== cb);
    listeners.set(event, arr);
  },

  disconnect() {
    try { if (ws) ws.close(); } catch (e) { console.error(e); }
    ws = null;
    listeners.clear();
  }
};

export default socket;
