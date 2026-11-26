import { Component, type ErrorInfo, type ReactNode } from 'react';

export interface ErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.onError?.(error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="foundation-shell">
          <section className="foundation-card">
            <h1>Something went wrong</h1>
            <p>Please refresh the page or return later.</p>
            <button type="button" onClick={() => this.setState({ error: null })}>
              Try again
            </button>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}
