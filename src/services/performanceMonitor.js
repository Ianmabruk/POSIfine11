// Performance Monitoring Service
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.errors = [];
    this.userActions = [];
    this.apiCalls = [];
    this.maxStoredItems = 100;
    
    this.init();
  }

  init() {
    // Track page load performance
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        this.trackPageLoad();
      });

      // Track unhandled errors
      window.addEventListener('error', (event) => {
        this.trackError('javascript_error', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack
        });
      });

      // Track unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        this.trackError('unhandled_promise_rejection', {
          reason: event.reason,
          stack: event.reason?.stack
        });
      });

      // Expose to global scope
      window.frontendMonitor = this;
    }
  }

  // Track page load metrics
  trackPageLoad() {
    try {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        this.trackMetric('page_load', {
          loadTime: navigation.loadEventEnd - navigation.loadEventStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          firstPaint: this.getFirstPaint(),
          firstContentfulPaint: this.getFirstContentfulPaint()
        });
      }
    } catch (error) {
      console.warn('Failed to track page load metrics:', error);
    }
  }

  getFirstPaint() {
    try {
      const paintEntries = performance.getEntriesByType('paint');
      const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
      return firstPaint ? firstPaint.startTime : null;
    } catch {
      return null;
    }
  }

  getFirstContentfulPaint() {
    try {
      const paintEntries = performance.getEntriesByType('paint');
      const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      return fcp ? fcp.startTime : null;
    } catch {
      return null;
    }
  }

  // Track custom metrics
  trackMetric(name, data) {
    const metric = {
      name,
      data,
      timestamp: Date.now(),
      url: window.location.pathname
    };

    this.metrics.set(`${name}_${Date.now()}`, metric);
    this.cleanup('metrics');
  }

  // Track errors
  trackError(type, details) {
    const error = {
      type,
      details,
      timestamp: Date.now(),
      url: window.location.pathname,
      userAgent: navigator.userAgent
    };

    this.errors.push(error);
    this.cleanup('errors');

    // Send critical errors immediately
    if (type === 'javascript_error' || type === 'api_error') {
      this.sendErrorToServer(error);
    }
  }

  // Track user actions
  trackUserAction(action, data = {}) {
    const userAction = {
      action,
      data,
      timestamp: Date.now(),
      url: window.location.pathname
    };

    this.userActions.push(userAction);
    this.cleanup('userActions');
  }

  // Track API calls
  trackApiCall(url, method, duration, status, error = null) {
    const apiCall = {
      url,
      method,
      duration,
      status,
      error,
      timestamp: Date.now()
    };

    this.apiCalls.push(apiCall);
    this.cleanup('apiCalls');

    // Track slow API calls
    if (duration > 2000) {
      this.trackError('slow_api_call', {
        url,
        method,
        duration,
        status
      });
    }

    // Track API errors
    if (error || status >= 400) {
      this.trackError('api_error', {
        url,
        method,
        status,
        error: error?.message || 'HTTP Error'
      });
    }
  }

  // Measure function execution time
  measureFunction(name, fn) {
    const start = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - start;
      
      this.trackMetric('function_execution', {
        name,
        duration,
        success: true
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      
      this.trackMetric('function_execution', {
        name,
        duration,
        success: false,
        error: error.message
      });
      
      throw error;
    }
  }

  // Measure async function execution time
  async measureAsyncFunction(name, fn) {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      
      this.trackMetric('async_function_execution', {
        name,
        duration,
        success: true
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      
      this.trackMetric('async_function_execution', {
        name,
        duration,
        success: false,
        error: error.message
      });
      
      throw error;
    }
  }

  // Get performance summary
  getPerformanceSummary() {
    return {
      metrics: Array.from(this.metrics.values()),
      errors: this.errors,
      userActions: this.userActions,
      apiCalls: this.apiCalls,
      memoryUsage: this.getMemoryUsage(),
      connectionInfo: this.getConnectionInfo()
    };
  }

  getMemoryUsage() {
    try {
      if (performance.memory) {
        return {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        };
      }
    } catch {
      return null;
    }
  }

  getConnectionInfo() {
    try {
      if (navigator.connection) {
        return {
          effectiveType: navigator.connection.effectiveType,
          downlink: navigator.connection.downlink,
          rtt: navigator.connection.rtt
        };
      }
    } catch {
      return null;
    }
  }

  // Send error to server
  async sendErrorToServer(error) {
    try {
      await fetch('/api/frontend-errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(error)
      });
    } catch (sendError) {
      console.warn('Failed to send error to server:', sendError);
    }
  }

  // Cleanup old data
  cleanup(type) {
    if (this[type] && this[type].length > this.maxStoredItems) {
      if (type === 'metrics') {
        const entries = Array.from(this.metrics.entries());
        entries.slice(0, entries.length - this.maxStoredItems).forEach(([key]) => {
          this.metrics.delete(key);
        });
      } else {
        this[type] = this[type].slice(-this.maxStoredItems);
      }
    }
  }

  // Clear all data
  clear() {
    this.metrics.clear();
    this.errors = [];
    this.userActions = [];
    this.apiCalls = [];
  }
}

// Enhanced API client with monitoring
export const monitoredFetch = async (url, options = {}) => {
  const start = performance.now();
  const method = options.method || 'GET';
  
  try {
    const response = await fetch(url, options);
    const duration = performance.now() - start;
    
    if (window.frontendMonitor) {
      window.frontendMonitor.trackApiCall(url, method, duration, response.status);
    }
    
    return response;
  } catch (error) {
    const duration = performance.now() - start;
    
    if (window.frontendMonitor) {
      window.frontendMonitor.trackApiCall(url, method, duration, 0, error);
    }
    
    throw error;
  }
};

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
  const trackMetric = (name, data) => {
    if (window.frontendMonitor) {
      window.frontendMonitor.trackMetric(name, data);
    }
  };

  const trackUserAction = (action, data) => {
    if (window.frontendMonitor) {
      window.frontendMonitor.trackUserAction(action, data);
    }
  };

  const measureFunction = (name, fn) => {
    if (window.frontendMonitor) {
      return window.frontendMonitor.measureFunction(name, fn);
    }
    return fn();
  };

  const measureAsyncFunction = async (name, fn) => {
    if (window.frontendMonitor) {
      return await window.frontendMonitor.measureAsyncFunction(name, fn);
    }
    return await fn();
  };

  return {
    trackMetric,
    trackUserAction,
    measureFunction,
    measureAsyncFunction
  };
};

// Initialize performance monitor
const performanceMonitor = new PerformanceMonitor();

export default performanceMonitor;