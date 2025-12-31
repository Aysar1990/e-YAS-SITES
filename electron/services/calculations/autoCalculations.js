/**
 * Auto Calculations Service - Day 12
 *
 * Migrated business logic from Excel VBA to JavaScript
 * Handles: Action Age, Overall Status, Totals, Aging Days
 */

/**
 * Department configuration with workflow order
 * Order: TI → RF Planning → RF Optimization → Civil → MW → Nokia NPO
 */
const DEPARTMENTS = [
  { key: 'ti', statusField: 'ti_status', commentField: 'ti_comment', label: 'TI' },
  { key: 'rf_plan', statusField: 'rf_plan_status', commentField: 'rf_plan_comment', label: 'RF Planning' },
  { key: 'rf_opt', statusField: 'rf_opt_status', commentField: 'rf_opt_comment', label: 'RF Optimization' },
  { key: 'civil', statusField: 'civil_status', commentField: 'civil_comment', label: 'Civil' },
  { key: 'mw', statusField: 'mw_status', commentField: 'mw_comment', label: 'Microwave' },
  { key: 'nokia_npo', statusField: 'nokia_npo_status', commentField: 'nokia_npo_comment', label: 'Nokia NPO' }
]

/**
 * Overall status mapping based on department status combinations
 */
const OVERALL_STATUS_MAP = {
  ALL_APPROVED: 'Approved',
  HAS_REJECTED_TI: 'TSSR Under Subcon validation',
  HAS_REJECTED_RF: 'TSSR Under Subcon validation',
  HAS_REJECTED_NOKIA: 'TSSR Under Nokia NPO Validation',
  HAS_REJECTED_OTHER: 'TSSR Under ROM Review',
  PENDING_NOKIA: 'TSSR Under Nokia NPO Validation',
  PENDING_OTHER: 'TSSR Under ROM Review',
  IN_PROGRESS: 'Site not Surveyed',
  DEFAULT: 'Site not Surveyed'
}

/**
 * Calculate the number of days since the TSSR Status Date
 * @param {Object} site - Site object with tssr_status_date field
 * @returns {number} Number of days (integer, 0 if no date)
 */
function calculateActionAge(site) {
  if (!site) return 0

  const statusDate = site.tssr_status_date || site.tssrStatusDate

  if (!statusDate) return 0

  try {
    const date = new Date(statusDate)
    if (isNaN(date.getTime())) return 0

    const today = new Date()
    // Set to start of day for accurate day calculation
    today.setHours(0, 0, 0, 0)
    date.setHours(0, 0, 0, 0)

    const diffTime = today.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    return Math.max(0, diffDays)
  } catch (error) {
    console.error('[AutoCalc] calculateActionAge error:', error)
    return 0
  }
}

/**
 * Calculate overall status based on department statuses
 * Logic:
 * - If ALL departments = "Approved" or "N/A" → "Approved"
 * - If ANY department = "Rejected" → Status based on which department
 * - If ANY department = "Pending" → Status based on which department
 * - Else → "In Progress" / "Site not Surveyed"
 *
 * @param {Object} site - Site object with department status fields
 * @returns {string} Overall status string
 */
function calculateOverallStatus(site) {
  if (!site) return OVERALL_STATUS_MAP.DEFAULT

  // Get all department statuses (handle both snake_case and camelCase)
  const statuses = DEPARTMENTS.map(dept => {
    const status = site[dept.statusField] || site[toCamelCase(dept.statusField)] || ''
    return {
      key: dept.key,
      status: status.toLowerCase().trim()
    }
  })

  // Check if all approved or N/A
  const allApproved = statuses.every(s =>
    s.status === 'approved' || s.status === 'n/a' || s.status === 'released' || !s.status
  )
  if (allApproved && statuses.some(s => s.status === 'approved')) {
    return OVERALL_STATUS_MAP.ALL_APPROVED
  }

  // Check for rejections (priority order)
  const rejected = statuses.find(s => s.status === 'rejected')
  if (rejected) {
    if (rejected.key === 'ti' || rejected.key === 'rf_plan') {
      return OVERALL_STATUS_MAP.HAS_REJECTED_TI
    }
    if (rejected.key === 'nokia_npo') {
      return OVERALL_STATUS_MAP.HAS_REJECTED_NOKIA
    }
    return OVERALL_STATUS_MAP.HAS_REJECTED_OTHER
  }

  // Check for pending statuses
  const pending = statuses.find(s => s.status === 'pending')
  if (pending) {
    if (pending.key === 'nokia_npo') {
      return OVERALL_STATUS_MAP.PENDING_NOKIA
    }
    return OVERALL_STATUS_MAP.PENDING_OTHER
  }

  // Check if any has an active status
  const hasAnyStatus = statuses.some(s => s.status && s.status !== 'n/a')
  if (hasAnyStatus) {
    return OVERALL_STATUS_MAP.PENDING_OTHER
  }

  // Use existing overall status if available
  const existingStatus = site.tssr_overall_status || site.tssrOverallStatus
  return existingStatus || OVERALL_STATUS_MAP.DEFAULT
}

/**
 * Calculate aggregate counts from an array of sites
 * @param {Array} sites - Array of site objects
 * @returns {Object} Aggregated totals
 */
function calculateTotals(sites) {
  if (!Array.isArray(sites) || sites.length === 0) {
    return {
      totalSites: 0,
      byPhase: {},
      byGovernorate: {},
      byStatus: {},
      bySubcon: {},
      byPriority: {}
    }
  }

  const result = {
    totalSites: sites.length,
    byPhase: {},
    byGovernorate: {},
    byStatus: {},
    bySubcon: {},
    byPriority: {}
  }

  sites.forEach(site => {
    // Count by phase
    const phase = site.phase_name || site.phaseName || 'Unknown'
    result.byPhase[phase] = (result.byPhase[phase] || 0) + 1

    // Count by governorate
    const gov = site.governorate || 'Unknown'
    result.byGovernorate[gov] = (result.byGovernorate[gov] || 0) + 1

    // Count by status
    const status = site.tssr_overall_status || site.tssrOverallStatus || 'Unknown'
    result.byStatus[status] = (result.byStatus[status] || 0) + 1

    // Count by subcontractor
    const subcon = site.tssr_subcon || site.tssrSubcon || 'Unassigned'
    result.bySubcon[subcon] = (result.bySubcon[subcon] || 0) + 1

    // Count by priority
    const priority = site.priority || 'Unknown'
    result.byPriority[priority] = (result.byPriority[priority] || 0) + 1
  })

  return result
}

/**
 * Calculate days in current status (aging)
 * @param {Object} site - Site object with status change date
 * @returns {number} Aging days (integer)
 */
function updateAgingDays(site) {
  if (!site) return 0

  // Try to get the last status change date
  const lastChangeDate = site.last_status_change_date ||
                         site.lastStatusChangeDate ||
                         site.tssr_status_date ||
                         site.tssrStatusDate ||
                         site.updated_at ||
                         site.updatedAt

  if (!lastChangeDate) return 0

  try {
    const date = new Date(lastChangeDate)
    if (isNaN(date.getTime())) return 0

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    date.setHours(0, 0, 0, 0)

    const diffTime = today.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    return Math.max(0, diffDays)
  } catch (error) {
    console.error('[AutoCalc] updateAgingDays error:', error)
    return 0
  }
}

/**
 * Run all calculations and return updated site object
 * @param {Object} site - Original site object
 * @param {Object} options - Options for calculation
 * @param {boolean} options.updateStatusDate - Update status date if status changed
 * @returns {Object} Updated site object with calculated fields
 */
function recalculateAll(site, options = {}) {
  if (!site) return site

  const updatedSite = { ...site }
  const previousStatus = site.tssr_overall_status || site.tssrOverallStatus

  // Calculate action age
  updatedSite.action_age = calculateActionAge(site)

  // Calculate overall status
  const newStatus = calculateOverallStatus(site)
  updatedSite.tssr_overall_status = newStatus

  // If status changed and updateStatusDate is true, update the status date
  if (options.updateStatusDate && previousStatus !== newStatus) {
    const now = new Date().toISOString()
    updatedSite.tssr_status_date = now
    updatedSite.last_status_change_date = now
  }

  // Calculate aging days
  updatedSite.aging_days = updateAgingDays(updatedSite)

  // Calculate workflow progress
  updatedSite.workflow_progress = calculateWorkflowProgress(site)

  // Mark as recalculated
  updatedSite._calculated_at = new Date().toISOString()

  return updatedSite
}

/**
 * Calculate workflow completion percentage
 * @param {Object} site - Site object
 * @returns {number} Percentage (0-100)
 */
function calculateWorkflowProgress(site) {
  if (!site) return 0

  const approvedStatuses = ['approved', 'released', 'n/a']
  let approvedCount = 0

  DEPARTMENTS.forEach(dept => {
    const status = (site[dept.statusField] || site[toCamelCase(dept.statusField)] || '').toLowerCase()
    if (approvedStatuses.includes(status)) {
      approvedCount++
    }
  })

  return Math.round((approvedCount / DEPARTMENTS.length) * 100)
}

/**
 * Convert snake_case to camelCase
 * @param {string} str - String in snake_case
 * @returns {string} String in camelCase
 */
function toCamelCase(str) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

/**
 * Get aging bracket for a site
 * @param {number} days - Number of days
 * @returns {string} Aging bracket label
 */
function getAgingBracket(days) {
  if (days <= 7) return '0-7 Days'
  if (days <= 14) return '8-14 Days'
  if (days <= 30) return '15-30 Days'
  if (days <= 60) return '31-60 Days'
  return '60+ Days'
}

/**
 * Calculate aging statistics for a set of sites
 * @param {Array} sites - Array of site objects
 * @returns {Object} Aging statistics by bracket
 */
function calculateAgingStats(sites) {
  if (!Array.isArray(sites) || sites.length === 0) {
    return {
      '0-7 Days': 0,
      '8-14 Days': 0,
      '15-30 Days': 0,
      '31-60 Days': 0,
      '60+ Days': 0
    }
  }

  const stats = {
    '0-7 Days': 0,
    '8-14 Days': 0,
    '15-30 Days': 0,
    '31-60 Days': 0,
    '60+ Days': 0
  }

  sites.forEach(site => {
    const days = site.action_age || calculateActionAge(site)
    const bracket = getAgingBracket(days)
    stats[bracket]++
  })

  return stats
}

// Export all functions
module.exports = {
  DEPARTMENTS,
  OVERALL_STATUS_MAP,
  calculateActionAge,
  calculateOverallStatus,
  calculateTotals,
  updateAgingDays,
  recalculateAll,
  calculateWorkflowProgress,
  getAgingBracket,
  calculateAgingStats,
  toCamelCase
}
