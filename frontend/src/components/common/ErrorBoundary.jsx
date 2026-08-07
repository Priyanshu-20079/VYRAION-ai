import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught React Error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 m-6 rounded-3xl bg-slate-900 border border-rose-500/40 text-rose-300 space-y-4 max-w-2xl mx-auto font-mono text-xs">
          <div className="flex items-center gap-3 border-b border-rose-500/30 pb-3">
            <span className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-400 font-bold">
              REACT RENDER ERROR
            </span>
            <span className="text-white font-bold">{this.state.error?.toString()}</span>
          </div>

          <p className="text-slate-300">
            An error occurred while rendering the page component:
          </p>

          <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 overflow-x-auto whitespace-pre-wrap">
            {this.state.errorInfo?.componentStack || this.state.error?.stack}
          </pre>

          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-xl bg-rose-500 text-slate-950 font-bold hover:bg-rose-400 transition-colors cursor-pointer"
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
