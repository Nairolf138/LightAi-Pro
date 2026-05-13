import { Component, type ErrorInfo, type ReactNode } from 'react';

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  error: Error | null;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Application failed to start', error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="min-h-screen bg-gray-950 px-6 py-16 text-gray-100">
          <section className="mx-auto max-w-2xl rounded-2xl border border-red-500/40 bg-red-950/30 p-8 shadow-2xl shadow-red-950/20">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-300">Startup error</p>
            <h1 className="mt-3 text-3xl font-bold text-white">Application failed to start</h1>
            <div className="mt-6 rounded-xl border border-red-400/30 bg-black/30 p-4">
              <p className="text-sm font-medium text-red-100">Error message</p>
              <p className="mt-2 whitespace-pre-wrap break-words font-mono text-sm text-red-50">
                {this.state.error.message || 'An unknown error occurred.'}
              </p>
            </div>
            <p className="mt-6 text-sm leading-6 text-gray-200">
              Check <code className="rounded bg-white/10 px-1.5 py-0.5 text-red-100">.env.local</code> and the browser
              console for more details.
            </p>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
