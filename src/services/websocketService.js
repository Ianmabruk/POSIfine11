// WebSocket Service for Real-Time Product Updates

const getWebSocketUrl = () => {
  const baseUrl = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');
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
  }

  /**
   * Connect to WebSocket and listen for product updates
   */
  connect(token, onStockUpdate) {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (!token) {
        reject(new Error('No token provided for WebSocket connection'));
        return;
      }

      // Connect to /ws endpoint (NOT /ws/products)
      const wsUrl = `${getWebSocketUrl()}/ws`;

      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected for real-time updates');
          this.reconnectAttempts = 0;
          
          // Send authentication message (backend expects this format)
          this.ws.send(JSON.stringify({ token: token }));
          console.log('🔐 Authentication sent');
          
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            const messageType = message.type ? message.type.toLowerCase() : 'unknown';

            // Handle authentication confirmation
            if (messageType === 'connected') {
              console.log('✅ WebSocket authenticated:', message.account_id);
              return;
            }

            // Normalize event names and handle all message types
            if (messageType === 'stock_updated') {
              console.log('📦 Stock update received:', message.data);
              // Call the provided callback with stock update
              if (onStockUpdate) {
                onStockUpdate(message.data);
              }
              this.emit('stock_updated', message.data);
            } else if (messageType === 'sale_completed') {
              console.log('💰 Sale completed - stock deducted:', message.data);
              // Emit with updated products for UI refresh
              this.emit('sale_completed', message.data);
              // Also call the stock update callback if provided
              if (onStockUpdate && message.data.updatedProducts) {
                onStockUpdate({ allProducts: message.data.updatedProducts });
              }
            } else if (messageType === 'admin_sale_completed') {
              console.log('👨‍💼 Admin sale completed:', message.data);
              this.emit('admin_sale_completed', message.data);
              // Also emit as sale_completed for components listening to general sales
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
            } else if (messageType === 'initial') {
              console.log('📦 Initial products loaded via WebSocket');
              this.emit('initial', message.products);
            } else if (messageType === 'heartbeat') {
              // Silent heartbeat - keep connection alive
              this.emit('heartbeat', message);
            } else {
              // Log other message types for debugging
              console.log(`📨 Message received (${messageType}):`, message.data);
              // Emit generic event for any unknown message type
              if (messageType !== 'unknown') {
                this.emit(messageType, message.data);
              }
            }
          } catch (e) {
            console.error('Error parsing WebSocket message:', e);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.emit('error', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('🔌 WebSocket disconnected');
          if (!this.isManualClose) {
            this.attemptReconnect(token, onStockUpdate);
          }
        };
      } catch (error) {
        console.error('Failed to create WebSocket:', error);
        reject(error);
      }
    });
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

    setTimeout(() => {
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
