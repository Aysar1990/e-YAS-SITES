// Hooks index - Export all custom hooks

export { default as useApi } from './useApi'
export { default as useLocalStorage } from './useLocalStorage'
export { default as useDebounce } from './useDebounce'

// Firebase compatibility wrappers (Firebase REMOVED - now wraps DataContext)
// New code should use: import { useData } from '../context/DataContext'
export { useFirebaseData, calculateDashboardStats } from './useFirebaseData'
export { calculatePhaseBreakdown, calculateContractorStats } from './firebaseStatsCalculator'

// Performance hooks
export {
  usePerformanceTracker,
  withPerformanceTracking,
  useRenderCount,
  useWhyDidYouUpdate
} from './usePerformanceTracker'

// Change Request hooks
export { useChangeRequests, default as useChangeRequestsDefault } from './useChangeRequests'
