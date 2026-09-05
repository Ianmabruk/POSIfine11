// Delivery tracking WebSocket service
// Connects to /api/ws/tracking (flask-sock) and dispatches typed events.

const getBase = () => {
  const base = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || '';
  return base.replace('https://', 'wss://').replace('http://', 'ws://').replace(/\/api$/, '');
};

class TrackingService {
  constructor() {
    this.ws = null;
    this.listeners = {};
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 6;
    this.reconnectDelay = 2500;
    this.isManualClose = false;
    this.token = null;
    this.pongTimeout = null;
  }

  connect(token) {
    return new Promise((resolve) => {
      if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
        resolve();
        return;
      }
      if (!token) { resolve(); return; }
      this.token = token;
      const url = `${getBase()}/api/ws/tracking?token=${encodeURIComponent(token)}`;
      try {
        this.ws = new WebSocket(url);
        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          resolve();
        };
        this.ws.onmessage = (event) => {
          let message;
          try { message = JSON.parse(event.data); } catch { return; }
          const type = (message.type || '').toLowerCase();
          if (type === 'connected') return;
          if (type === 'pong') { this.resetPongTimeout(); return; }
          if (type === 'error') { this.emit('error', message); return; }
          this.emit(type, message.data || message);
        };
        this.ws.onerror = (e) => { this.emit('error', e); };
        this.ws.onclose = () => {
          this.stopHeartbeat();
          if (!this.isManualClose && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(1.7, this.reconnectAttempts - 1);
            setTimeout(() => this.connect(this.token).catch(() => {}), delay);
          }
        };
      } catch (e) {
        this.emit('error', e);
      }
    });
  }

  subscribeDelivery(deliveryId) {
    this._send({ type: 'subscribe_delivery', deliveryId: Number(deliveryId) });
  }

  unsubscribeDelivery(deliveryId) {
    this._send({ type: 'unsubscribe_delivery', deliveryId: Number(deliveryId) });
  }

  sendLocation(loc) {
    this._send({ type: 'location_update', ...loc });
  }

  _send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.pongTimeout = setTimeout(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try { this.ws.send('ping'); } catch { /* ignore */ }
        this.pongTimeout = setTimeout(() => { if (this.ws) this.ws.close(); }, 6000);
      }
    }, 25000);
  }

  stopHeartbeat() {
    if (this.pongTimeout) { clearTimeout(this.pongTimeout); this.pongTimeout = null; }
  }

  resetPongTimeout() {
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = setTimeout(() => { if (this.ws) this.ws.close(); }, 6000);
    }
  }

  on(type, cb) {
    (this.listeners[type] = this.listeners[type] || []).push(cb);
  }

  off(type, cb) {
    if (!this.listeners[type]) return;
    this.listeners[type] = this.listeners[type].filter((fn) => fn !== cb);
  }

  emit(type, data) {
    (this.listeners[type] || []).forEach((cb) => { try { cb(data); } catch { /* ignore */ } });
  }

  disconnect() {
    this.isManualClose = true;
    this.stopHeartbeat();
    if (this.ws) { this.ws.close(); this.ws = null; }
  }

  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

export default new TrackingService();
