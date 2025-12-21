'use client';

import { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
    /** Child components to wrap */
    children: ReactNode;
    /** Fallback UI to show on error */
    fallback?: ReactNode;
    /** Section name for error message */
    sectionName?: string;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

/**
 * Error Boundary - Catches errors in child components and displays fallback UI
 * 
 * Fixes Issue #37: No Error Boundaries
 */
export class HomeErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log error to console (could also send to error reporting service)
        console.error('Component error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
                    <p className="text-red-700 font-medium">
                        {this.props.sectionName
                            ? `Error loading ${this.props.sectionName}`
                            : 'Something went wrong'}
                    </p>
                    <p className="text-red-500 text-sm mt-1">
                        Please refresh the page or try again later.
                    </p>
                    <button
                        type="button"
                        onClick={() => this.setState({ hasError: false })}
                        className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
