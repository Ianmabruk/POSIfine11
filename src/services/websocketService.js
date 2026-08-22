// WebSocket Service for Real-Time Product Updates

const getWebSocketUrl = () => {
  const baseUrl = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  return baseUrl
    .replace('https://', 'wss://')
    .replace('http://', 'ws://')
    .replace('/api', '');
};

class WebSocketService {
  constructor() {
    this.ws = null;
    this.listeners = {
      stock_updated: [],
      sale_completed: [],
      admin_sale_completed: [],
      product_created: [],
      product_updated: [],
      product_deleted: [],
      heartbeat: [],
      initial: [],
      error: []
    };
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.isManualClose = false;
    this.token = null;
    this.pongTimeout = null;
    this.reconnectTimeoutId = null;
  }

  /**
   * Connect to WebSocket and listen for product updates
   */
  connect(token, onStockUpdate) {
    return new Promise((resolve) => {
      if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
        resolve();
        return;
      }

      if (!token) {
        resolve();
        return;
      }

      this.clearReconnectTimeout();
      this.token = token;
      const wsUrl = `${getWebSocketUrl()}/api/ws/products?token=${encodeURIComponent(token)}`;

      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected for real-time updates');
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            const messageType = message.type ? message.type.toLowerCase() : 'unknown';

            if (messageType === 'connected') {
              console.log('✅ WebSocket authenticated:', message.account_id);
              return;
            }

            if (messageType === 'products_snapshot') {
              console.log('📦 Initial products loaded via WebSocket');
              this.emit('initial', message.data?.allProducts || []);
              return;
            }

            if (messageType === 'pong') {
              this.resetPongTimeout();
              return;
            }

            if (messageType === 'error') {
              console.error('WebSocket server error:', message.message);
              this.emit('error', message);
              return;
            }

            if (messageType === 'stock_updated') {
              console.log('📦 Stock update received:', message.data);
              if (onStockUpdate) {
                onStockUpdate(message.data);
              }
              this.emit('stock_updated', message.data);
            } else if (messageType === 'sale_completed') {
              console.log('💰 Sale completed - stock deducted:', message.data);
              this.emit('sale_completed', message.data);
              if (onStockUpdate && message.data.updatedProducts) {
                onStockUpdate({ allProducts: message.data.updatedProducts });
              }
            } else if (messageType === 'admin_sale_completed') {
              console.log('👨‍💼 Admin sale completed:', message.data);
              this.emit('admin_sale_completed', message.data);
              this.emit('sale_completed', message.data);
              if (onStockUpdate && message.data.updatedProducts) {
                onStockUpdate({ allProducts: message.data.updatedProducts });
              }
            } else if (messageType === 'product_created') {
              console.log('✨ Product created:', message.data);
              this.emit('product_created', message.data);
            } else if (messageType === 'product_updated') {
              console.log('📝 Product updated:', message.data);
              this.emit('product_updated', message.data);
              if (onStockUpdate && message.data.allProducts) {
                onStockUpdate({ allProducts: message.data.allProducts });
              }
            } else if (messageType === 'product_deleted') {
              console.log('🗑️ Product deleted:', message.data);
              this.emit('product_deleted', message.data);
              if (onStockUpdate && message.data.allProducts) {
                onStockUpdate({ allProducts: message.data.allProducts });
              }
            } else if (messageType === 'heartbeat') {
              this.emit('heartbeat', message);
            } else {
              console.log(`📨 Message received (${messageType}):`, message.data);
              if (messageType !== 'unknown') {
                this.emit(messageType, message.data);
              }
            }
          } catch (e) {
            console.error('Error parsing WebSocket message:', e);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket connection error:', error);
          this.emit('error', error);
        };

        this.ws.onclose = (event) => {
          console.log('🔌 WebSocket disconnected:', event.reason || event.code);
          this.stopHeartbeat();
          this.clearReconnectTimeout();
          if (!this.isManualClose && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnect(token, onStockUpdate);
          }
        };
      } catch (error) {
        console.error('Failed to create WebSocket:', error);
      }
    });
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.pongTimeout = setTimeout(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.send('ping');
          this.pongTimeout = setTimeout(() => {
            console.warn('WebSocket pong timeout - closing connection');
            this.ws.close();
          }, 5000);
        } catch (e) {
          console.error('Heartbeat ping failed:', e);
        }
      }
    }, 30000);
  }

  stopHeartbeat() {
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = null;
    }
  }

  resetPongTimeout() {
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = setTimeout(() => {
        console.warn('WebSocket pong timeout - closing connection');
        if (this.ws) {
          this.ws.close();
        }
      }, 5000);
    }
  }

  clearReconnectTimeout() {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  attemptReconnect(token, onStockUpdate) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimeoutId = setTimeout(() => {
      this.connect(token, onStockUpdate).catch((error) => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }

  /**
   * Register a listener for a specific message type
   */
  on(messageType, callback) {
    if (!this.listeners[messageType]) {
      this.listeners[messageType] = [];
    }
    this.listeners[messageType].push(callback);
  }

  /**
   * Emit a message to all listeners
   */
  emit(messageType, data) {
    if (this.listeners[messageType]) {
      this.listeners[messageType].forEach((callback) => {
        try {
          callback(data);
        } catch (e) {
          console.error(`Error in ${messageType} listener:`, e);
        }
      });
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    this.isManualClose = true;
    this.clearReconnectTimeout();
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

// Export singleton instance
export default new WebSocketService();
