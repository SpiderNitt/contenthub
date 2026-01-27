'use client';

import React, { Component, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Error boundary caught:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-slate-900 rounded-2xl p-8 border border-red-500/20">
                        <div className="flex items-center gap-3 mb-4">
                            <AlertCircle className="w-8 h-8 text-red-500" />
                            <h2 className="text-2xl font-bold text-white">Something went wrong</h2>
                        </div>
                        <p className="text-slate-400 mb-4">
                            We encountered an unexpected error. Please try refreshing the page.
                        </p>
                        {this.state.error && (
                            <details className="text-xs text-slate-500 mb-4">
                                <summary className="cursor-pointer hover:text-slate-400">
                                    Error details
                                </summary>
                                <pre className="mt-2 p-2 bg-slate-950 rounded overflow-auto">
                                    {this.state.error.message}
                                </pre>
                            </details>
                        )}
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-3 rounded-lg bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition-colors"
                        >
                            Refresh Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
