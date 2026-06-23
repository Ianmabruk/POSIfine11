import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

const isDev = Boolean(import.meta?.env?.DEV);

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    this.logError(error, errorInfo);
  }

  logError = (error, errorInfo) => {
    try {
      if (window.frontendMonitor) {
        window.frontendMonitor.trackError('error_boundary', {
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          retryCount: this.state.retryCount
        });
      }
      if (isDev) {
        console.error('Error Boundary caught an error:', error, errorInfo);
      }
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
    }
  };

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            
            <h1 className="text-2xl font-bold text-slate-900 mb-3">
              Oops! Something went wrong
            </h1>
            
            <p className="text-slate-500 mb-8 leading-relaxed">
              We encountered an unexpected error. Don't worry, our team has been notified and we're working on it.
            </p>

            {isDev && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm text-slate-400 mb-2">
                  Error Details (Development)
                </summary>
                <div className="bg-slate-50 p-4 rounded-xl text-xs font-mono overflow-auto max-h-32 border border-slate-100">
                  <div className="text-red-600 mb-2">{this.state.error.message}</div>
                  <div className="text-slate-500">{this.state.error.stack}</div>
                </div>
              </details>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="btn-primary flex items-center justify-center gap-2 px-6 py-3"
                disabled={this.state.retryCount >= 3}
              >
                <RefreshCw className="w-4 h-4" />
                {this.state.retryCount >= 3 ? 'Max Retries' : 'Try Again'}
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="btn-secondary flex items-center justify-center gap-2 px-6 py-3"
              >
                <Home className="w-4 h-4" />
                Go Home
              </button>
            </div>

            <p className="text-xs text-slate-400 mt-6">
              Error ID: {Date.now().toString(36)}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;