import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: string | null; }

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '100vh', background: '#0d0d12',
          color: '#f0eff5', fontFamily: 'Inter, sans-serif', padding: 20, textAlign: 'center',
        }}>
          <h1 style={{ fontSize: 42, fontWeight: 800, background: 'linear-gradient(135deg, #d946ef, #f472b6)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 16 }}>chasr</h1>
          <p style={{ color: '#a09eb8', marginBottom: 20 }}>Something went wrong.</p>
          <p style={{ color: '#6b6985', fontSize: 13, marginBottom: 20 }}>{this.state.error}</p>
          <button onClick={() => window.location.reload()}
            style={{ padding: '10px 24px', borderRadius: 10, background: 'linear-gradient(135deg, #d946ef, #f472b6)',
              color: '#fff', border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
