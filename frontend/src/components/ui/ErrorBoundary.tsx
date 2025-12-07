/**
 * ErrorBoundary - Graceful error handling for React components
 * Requirements: 6.4 - Implement error boundaries for graceful error handling
 */
import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Log to external error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error tracking service (e.g., Sentry)
      // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
    }
    
    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  getErrorMessage(): string {
    const error = this.state.error;
    if (!error) return 'An unexpected error occurred';

    // Network errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return 'Network connection error. Please check your internet connection and try again.';
    }

    // Chunk loading errors (code splitting)
    if (error.message.includes('Loading chunk') || error.message.includes('ChunkLoadError')) {
      return 'Failed to load page resources. Please refresh the page.';
    }

    // WebSocket errors
    if (error.message.includes('WebSocket') || error.message.includes('ws://')) {
      return 'Real-time connection error. Some features may not update automatically.';
    }

    // Blockchain/Wallet errors
    if (error.message.includes('wallet') || error.message.includes('transaction')) {
      return 'Blockchain connection error. Please check your wallet connection and try again.';
    }

    // File upload errors
    if (error.message.includes('upload') || error.message.includes('file')) {
      return 'File upload error. Please check the file size and format, then try again.';
    }

    // Default message
    return 'We encountered an unexpected error. Please try again or contact support if the problem persists.';
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    // Clear error state first
    this.setState({ hasError: false, error: null, errorInfo: null });
    // Force full page reload to clear any corrupted state
    window.location.replace('/');
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div 
          className="min-h-[400px] flex items-center justify-center p-8"
          role="alert"
          aria-live="assertive"
        >
          <div className="max-w-md w-full text-center">
            {/* Error Icon */}
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>

            {/* Error Title */}
            <h2 className="text-2xl font-bold text-white mb-2">
              Something went wrong
            </h2>

            {/* Error Message */}
            <p className="text-slate-400 mb-6">
              {this.getErrorMessage()}
            </p>

            {/* Error Details (Development only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm text-slate-500 hover:text-slate-400 flex items-center gap-2">
                  <Bug className="w-4 h-4" />
                  Error Details
                </summary>
                <div className="mt-2 p-4 bg-slate-900 border border-slate-700 rounded-lg overflow-auto max-h-48">
                  <pre className="text-xs text-red-400 whitespace-pre-wrap">
                    {this.state.error.toString()}
                  </pre>
                  {this.state.errorInfo && (
                    <pre className="text-xs text-slate-500 mt-2 whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={this.handleGoHome}
                className="flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Go Home
              </Button>
              <Button
                variant="primary"
                onClick={this.handleRetry}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based error boundary wrapper for functional components
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}

export default ErrorBoundary;

