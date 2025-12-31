import React, { useState, useEffect, useCallback } from 'react'

/**
 * AsyncErrorBoundary - Handles async operations and Promise rejections
 * Provides retry mechanism for failed async operations
 */
class AsyncErrorBoundaryClass extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('AsyncErrorBoundary caught an error:', error)

    // Log async error
    if (window.electronAPI?.logError) {
      window.electronAPI.logError({
        type: 'async_error',
        message: error.message,
        stack: error.stack
      })
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      retryCount: prevState.retryCount + 1
    }))

    // Call onRetry callback if provided
    if (this.props.onRetry) {
      this.props.onRetry()
    }
  }

  render() {
    const { hasError, error, retryCount } = this.state
    const { maxRetries = 3, fallback, children } = this.props

    if (hasError) {
      if (fallback) {
        return fallback({ error, retry: this.handleRetry, retryCount })
      }

      return (
        <div style={styles.container}>
          <div style={styles.icon}>!</div>
          <h3 style={styles.title}>Failed to load data</h3>
          <p style={styles.message}>{error?.message || 'An error occurred while loading data'}</p>

          {retryCount < maxRetries && (
            <button onClick={this.handleRetry} style={styles.retryButton}>
              Retry ({maxRetries - retryCount} attempts left)
            </button>
          )}

          {retryCount >= maxRetries && (
            <p style={styles.maxRetries}>
              Maximum retry attempts reached. Please refresh the page.
            </p>
          )}
        </div>
      )
    }

    // Pass retryCount as key to force re-render on retry
    return React.cloneElement(children, { key: retryCount })
  }
}

/**
 * Hook-based async error handling wrapper
 */
export function useAsyncError() {
  const [error, setError] = useState(null)

  const handleError = useCallback((e) => {
    setError(e)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  useEffect(() => {
    // Global unhandled promise rejection handler
    const handleUnhandledRejection = (event) => {
      console.error('Unhandled Promise Rejection:', event.reason)
      setError(event.reason)

      // Prevent default browser handling
      event.preventDefault()
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  return { error, handleError, clearError }
}

/**
 * HOC for wrapping async components
 */
export function withAsyncErrorBoundary(WrappedComponent, options = {}) {
  return function AsyncBoundaryWrapper(props) {
    return (
      <AsyncErrorBoundaryClass {...options}>
        <WrappedComponent {...props} />
      </AsyncErrorBoundaryClass>
    )
  }
}

const styles = {
  container: {
    padding: '40px 20px',
    textAlign: 'center',
    backgroundColor: '#1f2937',
    borderRadius: '8px',
    margin: '20px'
  },
  icon: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: '#fbbf24',
    color: '#1f2937',
    fontSize: '24px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px'
  },
  title: {
    color: '#f9fafb',
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '8px'
  },
  message: {
    color: '#9ca3af',
    fontSize: '14px',
    marginBottom: '20px'
  },
  retryButton: {
    backgroundColor: '#8FD9D9',
    color: '#111827',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  maxRetries: {
    color: '#ef4444',
    fontSize: '14px'
  }
}

export default AsyncErrorBoundaryClass
