/**
 * useFirebaseData - DEPRECATED COMPATIBILITY WRAPPER
 *
 * Firebase has been removed. This hook now wraps useData from DataContext.
 * New code should use: import { useData } from '../context/DataContext'
 *
 * @deprecated Use useData from DataContext instead
 */

import { useData } from '../context/DataContext'

/**
 * Legacy compatibility wrapper for useFirebaseData
 * Returns the same structure as the old Firebase hook for backward compatibility
 */
export const useFirebaseData = () => {
  const dataContext = useData()

  // Map to old Firebase hook structure for compatibility
  return {
    // Data
    sites: dataContext.sites || [],
    stats: dataContext.stats || {},
    loading: dataContext.loading,
    error: dataContext.error,

    // Phase
    activePhase: dataContext.activePhase,
    setActivePhase: dataContext.setActivePhase,
    phases: dataContext.phases || [],

    // Operations
    refreshData: dataContext.fetchData,
    fetchData: dataContext.fetchData,

    // Status
    syncStatus: dataContext.syncStatus,
    connectionStatus: dataContext.connectionStatus || 'connected',

    // Legacy flags (Firebase removed)
    isFirebaseEnabled: false,
    firebaseConnected: false,

    // Stats helpers
    statsByPartOf: dataContext.statsByPartOf,
    overviewTable: dataContext.overviewTable,
  }
}

// Calculate dashboard stats helper (moved from firebaseStatsCalculator)
export const calculateDashboardStats = (sites) => {
  if (!sites || sites.length === 0) {
    return {
      total: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
      inProgress: 0,
      completed: 0,
      approvalRate: 0
    }
  }

  const stats = {
    total: sites.length,
    approved: 0,
    pending: 0,
    rejected: 0,
    inProgress: 0,
    completed: 0
  }

  sites.forEach(site => {
    const status = (site.tssr_overall_status || site.tssrOverallStatus || '').toLowerCase()
    if (status.includes('approved') || status.includes('tssr approved')) {
      stats.approved++
    } else if (status.includes('reject')) {
      stats.rejected++
    } else if (status.includes('pending') || status.includes('under review')) {
      stats.pending++
    } else if (status.includes('progress') || status.includes('ongoing')) {
      stats.inProgress++
    } else if (status.includes('complete') || status.includes('done')) {
      stats.completed++
    }
  })

  stats.approvalRate = stats.total > 0
    ? Math.round((stats.approved / stats.total) * 100)
    : 0

  return stats
}

export default useFirebaseData
