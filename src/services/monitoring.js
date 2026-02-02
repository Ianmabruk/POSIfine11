// Frontend Performance & Analytics
class FrontendMonitor {
  constructor() {
    this.metrics = [];
    this.errors = [];
    this.userActions = [];
  }

  // Track API call performance
  trackApiCall(endpoint, duration, success = true) {
    this.metrics.push({
      type: 'api_call',
      endpoint,
      duration,
      success,
      timestamp: Date.now()
    });
  }

  // Track user actions
  trackUserAction(action, metadata = {}) {
    this.userActions.push({
      action,
      metadata,
      timestamp: Date.now(),
      url: window.location.pathname
    });
  }

  // Track errors
  trackError(error, context = {}) {
    this.errors.push({
      message: error.message,
      stack: error.stack,
      context,
      timestamp: Date.now(),
      url: window.location.pathname
    });
  }

  // Get performance summary
  getPerformanceSummary() {
    const apiCalls = this.metrics.filter(m => m.type === 'api_call');
    const avgDuration = apiCalls.reduce((sum, call) => sum + call.duration, 0) / apiCalls.length;
    const successRate = apiCalls.filter(call => call.success).length / apiCalls.length * 100;

    return {
      totalApiCalls: apiCalls.length,
      avgResponseTime: avgDuration,
      successRate,
      totalErrors: this.errors.length,
      totalUserActions: this.userActions.length
    };
  }

  // Send metrics to backend
  async sendMetrics() {
    try {
      const summary = this.getPerformanceSummary();
      await fetch('/api/analytics/frontend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(summary)
      });
    } catch (error) {
      console.warn('Failed to send metrics:', error);
    }
  }
}

// Enhanced API client with monitoring
const monitoredRequest = async (endpoint, options = {}) => {
  const monitor = window.frontendMonitor || new FrontendMonitor();
  const startTime = performance.now();
  
  try {
    const response = await fetch(endpoint, options);
    const duration = performance.now() - startTime;
    
    monitor.trackApiCall(endpoint, duration, response.ok);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    const duration = performance.now() - startTime;
    monitor.trackApiCall(endpoint, duration, false);
    monitor.trackError(error, { endpoint, options });
    throw error;
  }
};

// Initialize global monitor
window.frontendMonitor = new FrontendMonitor();

// Send metrics every 5 minutes
setInterval(() => {
  window.frontendMonitor.sendMetrics();
}, 5 * 60 * 1000);

export { FrontendMonitor, monitoredRequest };