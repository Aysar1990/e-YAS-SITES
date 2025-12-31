import React from 'react'

/**
 * GlobalErrorBoundary - Catches all React errors
 * Provides user-friendly error UI and logs errors for analysis
 */
class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    this.setState({ errorInfo, errorId })

    // Log to console
    console.error('GlobalErrorBoundary caught an error:', error, errorInfo)

    // Save to localStorage for analysis
    this.saveErrorToStorage({
      id: errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    })

    // Send to Electron main process if available
    if (window.electronAPI?.logError) {
      window.electronAPI.logError({
        type: 'react_error',
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      })
    }
  }

  saveErrorToStorage(errorData) {
    try {
      const errors = JSON.parse(localStorage.getItem('app_errors') || '[]')
      errors.push(errorData)
      // Keep only last 50 errors
      if (errors.length > 50) {
        errors.shift()
      }
      localStorage.setItem('app_errors', JSON.stringify(errors))
    } catch (e) {
      console.warn('Failed to save error to localStorage:', e)
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  handleCopyError = () => {
    const { error, errorInfo, errorId } = this.state
    const errorText = `
Error ID: ${errorId}
Message: ${error?.message}
Stack: ${error?.stack}
Component Stack: ${errorInfo?.componentStack}
    `.trim()

    navigator.clipboard.writeText(errorText)
      .then(() => alert('Error details copied to clipboard'))
      .catch(() => console.error('Failed to copy error'))
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <div style={styles.iconContainer}>
              <svg style={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2"/>
                <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2"/>
              </svg>
            </div>

            <h1 style={styles.title}>Something went wrong</h1>
            <p style={styles.subtitle}>
              An unexpected error occurred. Our team has been notified.
            </p>

            <div style={styles.errorId}>
              Error ID: <code style={styles.code}>{this.state.errorId}</code>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <details style={styles.details}>
                <summary style={styles.summary}>Error Details (Development)</summary>
                <pre style={styles.pre}>
                  {this.state.error?.message}
                  {'\n\n'}
                  {this.state.error?.stack}
                </pre>
              </details>
            )}

            <div style={styles.buttonGroup}>
              <button onClick={this.handleReload} style={styles.primaryButton}>
                Reload Page
              </button>
              <button onClick={this.handleGoHome} style={styles.secondaryButton}>
                Go Home
              </button>
              <button onClick={this.handleCopyError} style={styles.tertiaryButton}>
                Copy Error
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  card: {
    backgroundColor: '#1f2937',
    borderRadius: '12px',
    padding: '40px',
    maxWidth: '500px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
  },
  iconContainer: {
    marginBottom: '20px'
  },
  icon: {
    width: '64px',
    height: '64px',
    color: '#ef4444'
  },
  title: {
    color: '#f9fafb',
    fontSize: '24px',
    fontWeight: '600',
    marginBottom: '10px'
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: '16px',
    marginBottom: '20px'
  },
  errorId: {
    color: '#6b7280',
    fontSize: '14px',
    marginBottom: '20px'
  },
  code: {
    backgroundColor: '#374151',
    padding: '2px 8px',
    borderRadius: '4px',
    fontFamily: 'monospace'
  },
  details: {
    textAlign: 'left',
    marginBottom: '20px',
    backgroundColor: '#374151',
    borderRadius: '8px',
    padding: '12px'
  },
  summary: {
    color: '#9ca3af',
    cursor: 'pointer',
    marginBottom: '10px'
  },
  pre: {
    color: '#fca5a5',
    fontSize: '12px',
    overflow: 'auto',
    maxHeight: '200px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  primaryButton: {
    backgroundColor: '#8FD9D9',
    color: '#111827',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    color: '#8FD9D9',
    border: '1px solid #8FD9D9',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  tertiaryButton: {
    backgroundColor: 'transparent',
    color: '#6b7280',
    border: '1px solid #374151',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  }
}

export default GlobalErrorBoundary
