import { Component } from 'react';
export class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { this.props.onError?.(error, info); }
  render() { if (this.state.error) return <main className="foundation-shell"><section className="foundation-card"><h1>Something went wrong</h1><p>Please refresh the page or return later.</p><button type="button" onClick={() => this.setState({ error: null })}>Try again</button></section></main>; return this.props.children; }
}
