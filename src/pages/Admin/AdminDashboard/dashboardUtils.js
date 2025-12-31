/**
 * Dashboard Utility Functions
 * Extracted from AdminDashboard.jsx
 */

// Status order for overview table
export const STATUS_ORDER = [
  'Approved',
  'TSSR Under Zain validation',
  'TSSR Under ROM Review',
  'TSSR Under Nokia NPO Validation',
  'TSSR Under Nokia ROM Validation',
  'TSSR Under Nokia GSD Validation',
  'TSSR Under Subcon validation',
  'Site not Surveyed',
  'Need Access'
]

// Status mapping function for grouping statuses
export const mapContractorStatus = (status) => {
  if (!status) return 'Not Submitted'
  const s = status.toLowerCase()

  // Exact matches first
  if (s === 'approved') return 'Approved'
  if (s === 'need access') return 'Need Access'
  if (s === 'site not surveyed') return 'Site not Surveyed'

  // Under validation/review statuses
  if (s.includes('under zain')) return 'Under Zain Validation'
  if (s.includes('under rom review')) return 'Under ROM Review'
  if (s.includes('nokia npo')) return 'Under Nokia NPO'
  if (s.includes('nokia rom')) return 'Under Nokia ROM'
  if (s.includes('nokia gsd')) return 'Under Nokia GSD'
  if (s.includes('under subcon')) return 'Under Subcon'

  // General patterns
  if (s.includes('approved')) return 'Approved'
  if (s.includes('rejected')) return 'Rejected'
  if (s.includes('rfi') || s.includes('info')) return 'RFI'
  if (s.includes('submitted') || s.includes('resubmit')) return 'Submitted'
  if (s === '' || s === 'not submitted' || s === 'not set') return 'Not Submitted'

  return status
}

// Get status color based on status type - YAS COLORS ONLY
export const getStatusColorByType = (status) => {
  const s = status?.toLowerCase() || ''

  // Approved - Turquoise
  if (s === 'approved') return '#8FD9D9'

  // Rejected / Need Access - Orange
  if (s === 'rejected' || s.includes('rejected')) return '#FF8566'
  if (s === 'need access') return '#FF8566'

  // Site not surveyed - Gray
  if (s === 'site not surveyed' || s.includes('not surveyed')) return '#6b7280'

  // All "Under" statuses - Turquoise
  if (s.includes('zain')) return '#8FD9D9'
  if (s.includes('rom')) return '#8FD9D9'
  if (s.includes('npo')) return '#8FD9D9'
  if (s.includes('gsd')) return '#8FD9D9'
  if (s.includes('subcon')) return '#8FD9D9'
  if (s.includes('rfi')) return '#8FD9D9'

  return '#9ca3af'  // Default gray
}

// Sort function for status rows - more flexible matching
export const sortByStatusOrder = (data) => {
  if (!data || data.length === 0) return []

  const getStatusIndex = (status) => {
    if (!status) return 999
    const s = status.toLowerCase()

    // Direct match first
    const directIndex = STATUS_ORDER.findIndex(order =>
      order.toLowerCase() === s
    )
    if (directIndex !== -1) return directIndex

    // Partial match
    for (let i = 0; i < STATUS_ORDER.length; i++) {
      const order = STATUS_ORDER[i].toLowerCase()
      if (s.includes(order) || order.includes(s)) return i
    }

    // Special cases
    if (s === 'not set' || s === '' || s === 'not submitted') return 998

    return 999
  }

  return [...data].sort((a, b) => {
    const indexA = getStatusIndex(a.status)
    const indexB = getStatusIndex(b.status)

    if (indexA !== indexB) return indexA - indexB

    // If same order, sort by count descending
    return (b.total || 0) - (a.total || 0)
  })
}

// Calculate Part Of breakdown from status breakdown data
export const calculatePartOfBreakdown = (partOfStats) => {
  if (!partOfStats || partOfStats.length === 0) return {}

  const breakdown = {
    thinLayer: { total: 0, survey: 0, submitted: 0, approved: 0 },
    fullSwap: { total: 0, survey: 0, submitted: 0, approved: 0 },
    swapExisting: { total: 0, survey: 0, submitted: 0, approved: 0 },
    notSpecified: { total: 0, survey: 0, submitted: 0, approved: 0 },
  }

  partOfStats.forEach(row => {
    const category = row.part_of_category?.toLowerCase() || ''
    let target

    if (category.includes('thin') && category.includes('layer')) {
      target = breakdown.thinLayer
    } else if (category.includes('full') && category.includes('swap')) {
      target = breakdown.fullSwap
    } else if (category.includes('swap') && (category.includes('existing') || category.includes('thin'))) {
      target = breakdown.swapExisting
    } else if (category === 'not specified' || category === '') {
      target = breakdown.notSpecified
    } else {
      target = breakdown.notSpecified
    }

    target.total += row.total || 0
    target.survey += row.survey_done || 0
    target.submitted += row.tssr_submitted || 0
    target.approved += row.approved || 0
  })

  return breakdown
}

// Status colors mapping for charts
export const STATUS_COLORS = {
  'Approved': '#8FD9D9',                  // Turquoise
  'Under Zain Validation': '#8FD9D9',     // Turquoise
  'Under ROM Review': '#8FD9D9',          // Turquoise
  'Under Nokia NPO': '#8FD9D9',           // Turquoise
  'Under Nokia ROM': '#8FD9D9',           // Turquoise
  'Under Nokia GSD': '#8FD9D9',           // Turquoise
  'Under Subcon': '#8FD9D9',              // Turquoise
  'Need Access': '#FF8566',               // Orange
  'Site not Surveyed': '#6b7280',         // Gray
  'RFI': '#8FD9D9',                       // Turquoise
  'Submitted': '#8FD9D9',                 // Turquoise
  'Rejected': '#FF8566',                  // Orange
  'Not Submitted': '#9ca3af'              // Gray
}
