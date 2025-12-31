/**
 * Error Boundary Components
 * Centralized error handling for the application
 */

export { default as GlobalErrorBoundary } from './GlobalErrorBoundary'
export { default as AsyncErrorBoundary, useAsyncError, withAsyncErrorBoundary } from './AsyncErrorBoundary'
export { RouteErrorBoundary, RouteErrorBoundaryClass } from './RouteErrorBoundary'

// Legacy export for backwards compatibility
export { default } from './GlobalErrorBoundary'
