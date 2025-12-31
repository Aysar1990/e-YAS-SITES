/**
 * Nokia Dashboard Utility Functions
 * Nokia-specific calculations for dashboard
 */

// Calculate contractors summary from Firebase sites
export const calculateContractorsSummary = (sites) => {
  if (!sites || sites.length === 0) return []

  const contractors = {}
  sites.forEach(site => {
    const contractor = site.tssrSubcon || 'Unknown'
    if (!contractors[contractor]) {
      contractors[contractor] = { contractor, approved: 0, pending: 0, rejected: 0, total: 0 }
    }
    contractors[contractor].total++
    if (site.tssrOverallStatus === 'Approved') {
      contractors[contractor].approved++
    } else if (site.tssrOverallStatus?.toLowerCase().includes('rejected')) {
      contractors[contractor].rejected++
    } else {
      contractors[contractor].pending++
    }
  })

  return Object.values(contractors).sort((a, b) => b.total - a.total)
}

// Calculate department stats from Firebase sites
export const calculateDepartmentStats = (sites) => {
  if (!sites || sites.length === 0) return {}

  const stats = {
    ti_approved: 0, ti_rejected: 0, ti_pending: 0,
    rf_plan_approved: 0, rf_plan_rejected: 0, rf_plan_pending: 0,
    rf_opt_approved: 0, rf_opt_rejected: 0, rf_opt_pending: 0,
    civil_approved: 0, civil_rejected: 0, civil_pending: 0,
    mw_approved: 0, mw_rejected: 0, mw_pending: 0,
  }

  sites.forEach(site => {
    // TI
    if (site.tiStatus === 'Approved') stats.ti_approved++
    else if (site.tiStatus?.toLowerCase().includes('rejected')) stats.ti_rejected++
    else if (site.tiStatus) stats.ti_pending++

    // RF Plan
    if (site.rfPlanStatus === 'Approved') stats.rf_plan_approved++
    else if (site.rfPlanStatus?.toLowerCase().includes('rejected')) stats.rf_plan_rejected++
    else if (site.rfPlanStatus) stats.rf_plan_pending++

    // RF Opt
    if (site.rfOptimStatus === 'Approved') stats.rf_opt_approved++
    else if (site.rfOptimStatus?.toLowerCase().includes('rejected')) stats.rf_opt_rejected++
    else if (site.rfOptimStatus) stats.rf_opt_pending++

    // Civil
    if (site.civilStatus === 'Approved') stats.civil_approved++
    else if (site.civilStatus?.toLowerCase().includes('rejected')) stats.civil_rejected++
    else if (site.civilStatus) stats.civil_pending++

    // MW
    if (site.mwStatus === 'Approved') stats.mw_approved++
    else if (site.mwStatus?.toLowerCase().includes('rejected')) stats.mw_rejected++
    else if (site.mwStatus) stats.mw_pending++
  })

  return stats
}

// Transform Firebase sites to stats format
export const transformFirebaseSitesToStats = (firebaseSites, firebaseStats, localStats) => {
  return {
    ...localStats,
    statusBreakdown: firebaseStats.statusBreakdown?.map(s => ({
      tssr_overall_status: s.status,
      count: s.count
    })) || [],
    overviewStats: {
      total: firebaseStats.totalSites || 0,
      approved: firebaseStats.approved || 0,
      survey_done: firebaseSites.filter(s => s.tssrOverallStatus !== 'Site not Surveyed').length,
      tssr_submitted: firebaseSites.filter(s => s.version && s.version > 0).length,
      tssr_ready_count: firebaseSites.filter(s => s.tssrOverallStatus?.includes('Under')).length,
      rfi: firebaseSites.filter(s => s.rfiStatus).length,
      // Part of breakdowns
      total_thin_layer: firebaseSites.filter(s => s.partOf === 'ThinLayer').length,
      total_full_swap: firebaseSites.filter(s => s.partOf === 'Full Swap').length,
      total_swap_existing: firebaseSites.filter(s => s.partOf?.includes('Swap For Existing')).length,
    },
    contractorsSummary: calculateContractorsSummary(firebaseSites),
    departmentStats: calculateDepartmentStats(firebaseSites),
  }
}

// Department configuration
export const DEPARTMENTS = [
  { key: 'ti', name: 'TI', icon: '🔧', gradient: 'ti' },
  { key: 'rf_plan', name: 'RF Planning', icon: '📡', gradient: 'rf-plan' },
  { key: 'rf_opt', name: 'RF Optimization', icon: '📶', gradient: 'rf-opt' },
  { key: 'civil', name: 'Civil', icon: '🏗️', gradient: 'civil' },
  { key: 'mw', name: 'MW', icon: '📻', gradient: 'mw' },
]
