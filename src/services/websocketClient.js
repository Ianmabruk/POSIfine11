/**
 * WebSocket Client - Standardized Real-time Communication
 * =======================================================
 * Handles WebSocket connections with automatic reconnection and message protocol.
 */

const WS_BASE_URL = (import.meta.env.VITE_API_BASE || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/^http/, 'ws');
const WS_URL = `${WS_BASE_URL.replace(/\/$/, '')}/api/ws/products`;

/**
 * Standard WebSocket Message Format
 * {
 *   type: 'update' | 'notification' | 'error' | 'ping' | 'pong',
 *   action: string,
 *   data: any,
 *   account_id?: string,
 *   user_id?: number,
 *   timestamp: string
 * }
 */

class WebSocketClient {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
    this.pingInterval = null;
  }

  /**
   * Connect to WebSocket server
   */
  connect(token) {
    if (this.ws && this.isConnected) {
      console.log('🔌 Already connected to WebSocket');
      return;
    }

    console.log('🔌 Connecting to WebSocket...');

    try {
      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;

        // Authenticate
        this.send({
          type: 'auth',
          data: { token }
        });

        // Start ping interval
        this.startPing();

        // Notify listeners
        this.emit('connected', {});
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('❌ Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        this.emit('error', error);
      };

      this.ws.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        this.isConnected = false;
        this.stopPing();

        // Notify listeners
        this.emit('disconnected', {});

        // Attempt reconnection
        this.attemptReconnect(token);
      };

    } catch (error) {
      console.error('❌ WebSocket connection failed:', error);
      this.attemptReconnect(token);
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    console.log('🔌 Disconnecting WebSocket...');
    this.stopPing();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.isConnected = false;
    this.reconnectAttempts = 0;
  }

  /**
   * Attempt to reconnect
   */
  attemptReconnect(token) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);

    console.log(`🔄 Reconnecting in ${delay}ms... (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect(token);
    }, delay);
  }

  /**
   * Send message through WebSocket
   */
  send(message) {
    if (!this.ws || !this.isConnected) {
      console.warn('⚠️  WebSocket not connected, queuing message');
      // Could implement message queue here
      return false;
    }

    // Add timestamp if not present
    if (!message.timestamp) {
      message.timestamp = new Date().toISOString();
    }

    try {
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('❌ Failed to send WebSocket message:', error);
      return false;
    }
  }

  /**
   * Handle incoming message
   */
  handleMessage(message) {
    const { type, action, data } = message;

    console.log(`📨 WebSocket message: ${type}${action ? `:${action}` : ''}`, data);

    // Handle ping/pong
    if (type === 'ping') {
      this.send({ type: 'pong' });
      return;
    }

    // Route to specific listeners
    if (action) {
      this.emit(action, data);
    }

    // Route to type listeners
    this.emit(type, data);

    // Global listener
    this.emit('*', message);
  }

  /**
   * Subscribe to messages
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    
    this.listeners.get(event).push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Emit event to listeners
   */
  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Error in WebSocket listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Start ping interval to keep connection alive
   */
  startPing() {
    this.pingInterval = setInterval(() => {
      if (this.isConnected) {
        this.send({ type: 'ping' });
      }
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Stop ping interval
   */
  stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      listeners: this.listeners.size
    };
  }
}

// Create singleton instance
const wsClient = new WebSocketClient();

export default wsClient;

/**
 * React Hook for WebSocket
 */
export function useWebSocket() {
  const [connected, setConnected] = React.useState(wsClient.isConnected);
  const [lastMessage, setLastMessage] = React.useState(null);

  React.useEffect(() => {
    // Subscribe to connection status
    const unsubscribeConnected = wsClient.on('connected', () => {
      setConnected(true);
    });

    const unsubscribeDisconnected = wsClient.on('disconnected', () => {
      setConnected(false);
    });

    // Subscribe to all messages
    const unsubscribeMessages = wsClient.on('*', (message) => {
      setLastMessage(message);
    });

    return () => {
      unsubscribeConnected();
      unsubscribeDisconnected();
      unsubscribeMessages();
    };
  }, []);

  return {
    connected,
    lastMessage,
    send: wsClient.send.bind(wsClient),
    subscribe: wsClient.on.bind(wsClient)
  };
}
