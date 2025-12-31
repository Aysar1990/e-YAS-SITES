import React from 'react'
import { useNavigate, useRouteError, isRouteErrorResponse } from 'react-router-dom'

/**
 * RouteErrorBoundary - Handles React Router errors
 * Provides 404 handling and navigation error recovery
 */
export function RouteErrorBoundary() {
  const error = useRouteError()
  const navigate = useNavigate()

  // Log error
  React.useEffect(() => {
    console.error('Route Error:', error)

    if (window.electronAPI?.logError) {
      window.electronAPI.logError({
        type: 'route_error',
        message: error?.message || 'Route error',
        status: isRouteErrorResponse(error) ? error.status : null,
        path: window.location.pathname
      })
    }
  }, [error])

  // Determine error type
  const is404 = isRouteErrorResponse(error) && error.status === 404
  const is403 = isRouteErrorResponse(error) && error.status === 403
  const is500 = isRouteErrorResponse(error) && error.status === 500

  const handleGoHome = () => {
    navigate('/', { replace: true })
  }

  const handleGoBack = () => {
    navigate(-1)
  }

  if (is404) {
    return (
      <ErrorPage
        code="404"
        title="Page Not Found"
        message="The page you're looking for doesn't exist or has been moved."
        onGoHome={handleGoHome}
        onGoBack={handleGoBack}
      />
    )
  }

  if (is403) {
    return (
      <ErrorPage
        code="403"
        title="Access Denied"
        message="You don't have permission to access this page."
        onGoHome={handleGoHome}
        onGoBack={handleGoBack}
      />
    )
  }

  if (is500) {
    return (
      <ErrorPage
        code="500"
        title="Server Error"
        message="Something went wrong on our end. Please try again later."
        onGoHome={handleGoHome}
        onGoBack={handleGoBack}
      />
    )
  }

  // Generic error
  return (
    <ErrorPage
      code="Error"
      title="Something Went Wrong"
      message={error?.message || 'An unexpected error occurred while navigating.'}
      onGoHome={handleGoHome}
      onGoBack={handleGoBack}
      showDetails={process.env.NODE_ENV === 'development'}
      details={error?.stack}
    />
  )
}

/**
 * Reusable Error Page Component
 */
function ErrorPage({ code, title, message, onGoHome, onGoBack, showDetails, details }) {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.codeContainer}>
          <span style={styles.code}>{code}</span>
        </div>

        <h1 style={styles.title}>{title}</h1>
        <p style={styles.message}>{message}</p>

        {showDetails && details && (
          <details style={styles.details}>
            <summary style={styles.summary}>Technical Details</summary>
            <pre style={styles.pre}>{details}</pre>
          </details>
        )}

        <div style={styles.buttonGroup}>
          <button onClick={onGoHome} style={styles.primaryButton}>
            Go to Dashboard
          </button>
          <button onClick={onGoBack} style={styles.secondaryButton}>
            Go Back
          </button>
        </div>

        <div style={styles.helpText}>
          <p>If this problem persists, please contact support.</p>
        </div>
      </div>
    </div>
  )
}

/**
 * Class-based Route Error Boundary for legacy support
 */
export class RouteErrorBoundaryClass extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Route Error Boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.container}>
          <div style={styles.content}>
            <div style={styles.codeContainer}>
              <span style={styles.code}>Error</span>
            </div>
            <h1 style={styles.title}>Navigation Error</h1>
            <p style={styles.message}>
              {this.state.error?.message || 'An error occurred during navigation.'}
            </p>
            <div style={styles.buttonGroup}>
              <button
                onClick={() => window.location.href = '/'}
                style={styles.primaryButton}
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => window.location.reload()}
                style={styles.secondaryButton}
              >
                Reload
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
  content: {
    textAlign: 'center',
    maxWidth: '500px'
  },
  codeContainer: {
    marginBottom: '20px'
  },
  code: {
    fontSize: '72px',
    fontWeight: '700',
    color: '#8FD9D9',
    textShadow: '0 0 40px rgba(143, 217, 217, 0.3)'
  },
  title: {
    color: '#f9fafb',
    fontSize: '28px',
    fontWeight: '600',
    marginBottom: '12px'
  },
  message: {
    color: '#9ca3af',
    fontSize: '16px',
    marginBottom: '30px',
    lineHeight: '1.6'
  },
  details: {
    textAlign: 'left',
    marginBottom: '30px',
    backgroundColor: '#1f2937',
    borderRadius: '8px',
    padding: '16px'
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
    gap: '12px',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: '30px'
  },
  primaryButton: {
    backgroundColor: '#8FD9D9',
    color: '#111827',
    border: 'none',
    padding: '14px 28px',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s'
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    color: '#8FD9D9',
    border: '2px solid #8FD9D9',
    padding: '12px 26px',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  helpText: {
    color: '#6b7280',
    fontSize: '14px'
  }
}

export default RouteErrorBoundary
