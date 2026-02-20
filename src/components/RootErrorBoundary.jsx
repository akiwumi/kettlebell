import { Component } from 'react';

/**
 * Catches render errors so the app doesn't show a blank screen.
 * Shows the error message in production to help debug mount failures.
 */
export default class RootErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('RootErrorBoundary:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            padding: 24,
            fontFamily: 'system-ui, sans-serif',
            maxWidth: 480,
            margin: '40px auto',
            background: '#1a1a1a',
            color: '#fff',
            borderRadius: 8,
          }}
        >
          <h1 style={{ fontSize: 18, marginBottom: 8 }}>Something went wrong</h1>
          <pre
            style={{
              fontSize: 12,
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {this.state.error?.message ?? String(this.state.error)}
          </pre>
          <p style={{ fontSize: 12, marginTop: 16, opacity: 0.8 }}>
            Check the browser console for more details.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
