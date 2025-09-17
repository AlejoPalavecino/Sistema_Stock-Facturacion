
import React from 'react';

type Props = { children: React.ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error in ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div role="alert" style={{ 
            padding: '2rem', 
            margin: '2rem auto', 
            maxWidth: '800px', 
            textAlign: 'center', 
            backgroundColor: '#FFFBEB', 
            color: '#92400E', 
            border: '1px solid #FBBF24', 
            borderRadius: '0.5rem' 
        }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Algo salió mal.</h1>
          <p style={{ marginTop: '0.5rem' }}>
            Ocurrió un error inesperado en la aplicación. Intenta recargar la página.
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{ 
                marginTop: '1rem', 
                padding: '0.5rem 1rem', 
                backgroundColor: '#FBBF24', 
                color: '#92400E', 
                border: 'none', 
                borderRadius: '0.25rem', 
                cursor: 'pointer',
                fontWeight: '600'
            }}
          >
            Recargar Página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
