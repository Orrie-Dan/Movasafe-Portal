import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import 'leaflet/dist/leaflet.css'
import '@/app/globals.css'

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('App error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          fontFamily: 'system-ui, sans-serif',
          background: '#0f172a',
          color: '#e2e8f0',
        }}>
          <h1 style={{ marginBottom: 16 }}>Something went wrong</h1>
          <pre style={{
            padding: 16,
            background: '#1e293b',
            borderRadius: 8,
            overflow: 'auto',
            maxWidth: '100%',
            fontSize: 12,
          }}>
            {this.state.error.message}
          </pre>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: 16,
              padding: '8px 16px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            Reload page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>
)
