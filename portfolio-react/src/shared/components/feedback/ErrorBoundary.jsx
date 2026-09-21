import { Component } from 'react';

/** Aísla crashes por sección sin tumbar toda la app. */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    if (import.meta.env?.DEV) console.error('[ErrorBoundary]', error, info);
    this.props.onError?.(error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      const fallback = this.props.fallback;
      if (fallback) return fallback;
      return (
        <div className="rounded-3xl bg-surface-dark border border-red-500/20 p-6 text-center">
          <p className="text-white font-bold mb-1">Algo salió mal en esta sección</p>
          <p className="text-gray-400 text-sm mb-4">{this.state.error?.message}</p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-bold transition-colors"
          >
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
