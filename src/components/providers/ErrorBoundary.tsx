'use client';

/**
 * Error Boundary Component
 * 
 * A React error boundary that catches JavaScript errors in child components,
 * logs them to Sentry, and displays a fallback UI.
 * 
 * Usage:
 * <ErrorBoundary fallback={<ErrorFallback />}>
 *   <YourComponent />
 * </ErrorBoundary>
 * 
 * @module ErrorBoundary
 */

import * as Sentry from '@sentry/nextjs';
import { Component, type ReactNode } from 'react';
import { createLogger } from '@/lib/logger';

const log = createLogger('ErrorBoundary');

// ============================================================================
// Types
// ============================================================================

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback UI to show when an error occurs */
  fallback?: ReactNode;
  /** Called when an error is caught */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Component name for error tracking context */
  componentName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  eventId: string | null;
}

// ============================================================================
// Error Boundary Component
// ============================================================================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      eventId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log to Sentry with component stack
    const eventId = Sentry.captureException(error, {
      tags: {
        component: this.props.componentName ?? 'Unknown',
        errorBoundary: 'true',
      },
      extra: {
        componentStack: errorInfo.componentStack,
      },
    });

    this.setState({ eventId });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      log.error('ErrorBoundary caught an error', error, { data: { componentStack: errorInfo.componentStack } });
    }
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, eventId: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <DefaultErrorFallback
          error={this.state.error}
          eventId={this.state.eventId}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// Default Fallback UI
// ============================================================================

interface DefaultErrorFallbackProps {
  error: Error | null;
  eventId: string | null;
  onReset: () => void;
}

function DefaultErrorFallback({ error, eventId, onReset }: DefaultErrorFallbackProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-600 mb-4">
            We&apos;ve been notified and are working on a fix.
          </p>
          {process.env.NODE_ENV === 'development' && error && (
            <details className="text-left bg-gray-100 rounded-lg p-4 mb-4">
              <summary className="cursor-pointer font-medium text-gray-700">
                Error Details
              </summary>
              <pre className="mt-2 text-xs text-red-600 overflow-auto">
                {error.message}
                {'\n\n'}
                {error.stack}
              </pre>
            </details>
          )}
          {eventId && (
            <p className="text-xs text-gray-500 mb-4">
              Error ID: {eventId}
            </p>
          )}
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onReset}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[var(--primary)] hover:opacity-90 text-white rounded-lg transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// HOC for wrapping components with error boundary
// ============================================================================

/**
 * Higher-order component to wrap a component with an error boundary
 * 
 * @example
 * const SafeComponent = withErrorBoundary(MyComponent, {
 *   componentName: 'MyComponent',
 *   fallback: <CustomFallback />
 * });
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: Omit<ErrorBoundaryProps, 'children'>
) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const ComponentWithErrorBoundary = (props: P) => (
    <ErrorBoundary {...options} componentName={options?.componentName ?? displayName}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;

  return ComponentWithErrorBoundary;
}

export default ErrorBoundary;
