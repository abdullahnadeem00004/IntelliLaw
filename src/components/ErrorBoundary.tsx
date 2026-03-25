import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      let errorDetails = null;
      try {
        if (this.state.error?.message) {
          errorDetails = JSON.parse(this.state.error.message);
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-neutral-200 p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-error/10 rounded-2xl flex items-center justify-center text-error mx-auto">
              <AlertCircle className="w-10 h-10" />
            </div>
            
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Something went wrong</h1>
              <p className="text-neutral-500 mt-2">
                {errorDetails ? 'A database error occurred. Please check your permissions or try again later.' : 'An unexpected error occurred while rendering this page.'}
              </p>
            </div>

            {errorDetails && (
              <div className="bg-neutral-50 rounded-xl p-4 text-left border border-neutral-100">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Error Details</p>
                <div className="space-y-1">
                  <p className="text-xs text-neutral-600"><span className="font-bold">Operation:</span> {errorDetails.operationType}</p>
                  <p className="text-xs text-neutral-600"><span className="font-bold">Path:</span> {errorDetails.path}</p>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button 
                onClick={this.handleReset}
                className="btn btn-primary w-full py-3"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="btn btn-secondary w-full py-3"
              >
                <Home className="w-4 h-4 mr-2" />
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
