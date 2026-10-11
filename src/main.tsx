import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

window.onerror = function(msg, source, lineno, colno, error) {
  document.body.innerHTML = `<div style="color:red; padding:20px; background:white; z-index:999999; position:relative; min-height:100vh;"><h2>Global Error</h2><pre>${msg}\n${error?.stack}</pre></div>`;
};
window.addEventListener('unhandledrejection', function(event) {
  document.body.innerHTML = `<div style="color:red; padding:20px; background:white; z-index:999999; position:relative; min-height:100vh;"><h2>Unhandled Promise Rejection</h2><pre>${event.reason?.stack || event.reason}</pre></div>`;
});

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: 'red', padding: '20px', background: 'white', minHeight: '100vh', zIndex: 999999, position: 'relative' }}>
          <h2>React Error Boundary</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
