/**
 * ErrorDisplay - Show API/data errors to users
 * A dismissible error alert component
 */

import { useState, useEffect } from 'react'
import './ErrorDisplay.css'

const ErrorDisplay = ({
  error,
  onDismiss,
  onRetry,
  title = 'Error',
  autoHide = false,
  autoHideDelay = 5000
}) => {
  const [visible, setVisible] = useState(!!error)

  useEffect(() => {
    setVisible(!!error)

    if (error && autoHide) {
      const timer = setTimeout(() => {
        handleDismiss()
      }, autoHideDelay)
      return () => clearTimeout(timer)
    }
  }, [error, autoHide, autoHideDelay])

  const handleDismiss = () => {
    setVisible(false)
    if (onDismiss) onDismiss()
  }

  if (!visible || !error) return null

  const errorMessage = typeof error === 'string'
    ? error
    : error.message || 'An unexpected error occurred'

  return (
    <div className="error-display" role="alert">
      <div className="error-display__icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>

      <div className="error-display__content">
        <h4 className="error-display__title">{title}</h4>
        <p className="error-display__message">{errorMessage}</p>
      </div>

      <div className="error-display__actions">
        {onRetry && (
          <button
            className="error-display__retry"
            onClick={onRetry}
            type="button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 12a9 9 0 11-9-9"/>
              <polyline points="21 3 21 9 15 9"/>
            </svg>
            Retry
          </button>
        )}
        <button
          className="error-display__dismiss"
          onClick={handleDismiss}
          type="button"
          aria-label="Dismiss"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

/**
 * useErrorDisplay Hook - Manage error display state
 */
export const useErrorDisplay = () => {
  const [error, setError] = useState(null)

  const showError = (errorMessage) => {
    setError(errorMessage)
  }

  const clearError = () => {
    setError(null)
  }

  return { error, showError, clearError }
}

export default ErrorDisplay
