/**
 * firebaseStatsCalculator - DEPRECATED
 *
 * Firebase has been removed. These functions now work with local data.
 * @deprecated Use calculateDashboardStats from useFirebaseData instead
 */

/**
 * Calculate dashboard statistics from sites array
 * @param {Array} sites - Array of site objects
 * @returns {Object} Stats object
 */
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

/**
 * Calculate phase breakdown
 * @param {Array} sites - Array of site objects
 * @returns {Object} Phase breakdown
 */
export const calculatePhaseBreakdown = (sites) => {
  if (!sites || sites.length === 0) return {}

  const breakdown = {}
  sites.forEach(site => {
    const phase = site.phase_name || site.phaseName || 'Unknown'
    breakdown[phase] = (breakdown[phase] || 0) + 1
  })

  return breakdown
}

/**
 * Calculate contractor performance
 * @param {Array} sites - Array of site objects
 * @returns {Array} Contractor stats
 */
export const calculateContractorStats = (sites) => {
  if (!sites || sites.length === 0) return []

  const contractorMap = {}
  sites.forEach(site => {
    const contractor = site.tssr_subcon || site.tssrSubcon || 'Unassigned'
    if (!contractorMap[contractor]) {
      contractorMap[contractor] = { name: contractor, total: 0, approved: 0, rejected: 0 }
    }
    contractorMap[contractor].total++

    const status = (site.tssr_overall_status || site.tssrOverallStatus || '').toLowerCase()
    if (status.includes('approved')) {
      contractorMap[contractor].approved++
    } else if (status.includes('reject')) {
      contractorMap[contractor].rejected++
    }
  })

  return Object.values(contractorMap).sort((a, b) => b.total - a.total)
}

export default {
  calculateDashboardStats,
  calculatePhaseBreakdown,
  calculateContractorStats
}
