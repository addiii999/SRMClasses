import { Component } from 'react';

/**
 * Global ErrorBoundary — wraps the entire app.
 * Catches any unhandled JS runtime error and shows
 * a user-friendly fallback screen instead of a white page.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log to console for debugging — replace with Sentry/LogRocket in production
    console.error('[ErrorBoundary] Caught error:', error, info?.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8fafc',
            fontFamily: 'Inter, sans-serif',
            padding: '2rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '1.5rem',
              boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
              padding: '3rem 2rem',
              textAlign: 'center',
              maxWidth: '480px',
              width: '100%',
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ffe4e6, #fecdd3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                fontSize: '2rem',
              }}
            >
              ⚠️
            </div>

            <h2 style={{ margin: '0 0 0.5rem', color: '#1e293b', fontSize: '1.4rem', fontWeight: 700 }}>
              Something went wrong
            </h2>
            <p style={{ margin: '0 0 1.5rem', color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>
              The app encountered an unexpected error. Your data is safe — please reload the page to continue.
            </p>

            {/* Error detail (only in dev) */}
            {import.meta.env.DEV && this.state.error && (
              <pre
                style={{
                  textAlign: 'left',
                  background: '#f1f5f9',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  fontSize: '0.75rem',
                  color: '#dc2626',
                  overflowX: 'auto',
                  marginBottom: '1.5rem',
                  maxHeight: 150,
                  overflow: 'auto',
                }}
              >
                {this.state.error.toString()}
              </pre>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={this.handleReload}
                style={{
                  padding: '0.6rem 1.5rem',
                  borderRadius: '0.75rem',
                  background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                🔄 Reload Page
              </button>
              <button
                onClick={this.handleGoHome}
                style={{
                  padding: '0.6rem 1.5rem',
                  borderRadius: '0.75rem',
                  background: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                🏠 Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
