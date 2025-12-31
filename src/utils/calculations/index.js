/**
 * Client-side Calculations Utilities - Day 12
 *
 * Business logic for site calculations, validation, and workflow
 * Used by React components in the renderer process
 */

// Department configuration
export const DEPARTMENTS = [
  { key: 'ti', statusField: 'tiStatus', dbField: 'ti_status', commentField: 'tiComment', label: 'TI', icon: '📡' },
  { key: 'rfPlan', statusField: 'rfPlanStatus', dbField: 'rf_plan_status', commentField: 'rfPlanComment', label: 'RF Planning', icon: '📊' },
  { key: 'rfOptim', statusField: 'rfOptimStatus', dbField: 'rf_optim_status', commentField: 'rfOptimComment', label: 'RF Optimization', icon: '⚡' },
  { key: 'civil', statusField: 'civilStatus', dbField: 'civil_status', commentField: 'civilComment', label: 'Civil', icon: '🏗️' },
  { key: 'mw', statusField: 'mwStatus', dbField: 'mw_status', commentField: 'mwComment', label: 'Microwave', icon: '📶' },
  { key: 'nokiaNpo', statusField: 'nokiaNpoStatus', dbField: 'nokia_npo_status', commentField: 'nokiaNpoComment', label: 'Nokia NPO', icon: '🔧' }
]

// Valid governorates
export const GOVERNORATES = [
  'Amman', 'Irbid', 'Zarqa', 'Balqa', 'Mafraq', 'Karak',
  'Madaba', 'Jerash', 'Ajloun', 'Aqaba', 'Maan', 'Tafilah'
]

// Valid phases
export const PHASES = ['RO4', 'RO3', 'RO2', 'Phase-2', 'Phase-1', 'PO3', 'PO2', 'PO1', 'ALL']

// Status options
export const STATUS_OPTIONS = ['Approved', 'Pending', 'Rejected', 'Released', 'N/A']

// Overall status options
export const OVERALL_STATUS_OPTIONS = [
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

/**
 * Calculate action age (days since TSSR Status Date)
 */
export function calculateActionAge(site) {
  if (!site) return 0

  const statusDate = site.tssrStatusDate || site.tssr_status_date
  if (!statusDate) return 0

  try {
    const date = new Date(statusDate)
    if (isNaN(date.getTime())) return 0

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    date.setHours(0, 0, 0, 0)

    const diffDays = Math.floor((today - date) / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  } catch {
    return 0
  }
}

/**
 * Calculate overall status based on department statuses
 */
export function calculateOverallStatus(formData) {
  const statuses = DEPARTMENTS.map(d => (formData[d.statusField] || '').toLowerCase())

  // If all approved/n/a, overall is approved
  if (statuses.every(s => s === 'approved' || s === 'n/a' || s === 'released' || !s)) {
    if (statuses.some(s => s === 'approved')) {
      return 'Approved'
    }
  }

  // If any rejected, find which department
  const rejectedIndex = statuses.findIndex(s => s === 'rejected')
  if (rejectedIndex !== -1) {
    const rejectedDept = DEPARTMENTS[rejectedIndex]
    if (rejectedDept.key === 'ti' || rejectedDept.key === 'rfPlan') {
      return 'TSSR Under Subcon validation'
    }
    if (rejectedDept.key === 'nokiaNpo') {
      return 'TSSR Under Nokia NPO Validation'
    }
    return 'TSSR Under ROM Review'
  }

  // If any pending, determine stage
  const pendingIndex = statuses.findIndex(s => s === 'pending')
  if (pendingIndex !== -1) {
    const pendingDept = DEPARTMENTS[pendingIndex]
    if (pendingDept.key === 'nokiaNpo') {
      return 'TSSR Under Nokia NPO Validation'
    }
    return 'TSSR Under ROM Review'
  }

  return formData.tssrOverallStatus || 'Site not Surveyed'
}

/**
 * Calculate workflow progress percentage
 */
export function calculateWorkflowProgress(site) {
  if (!site) return 0

  const approvedStatuses = ['approved', 'released', 'n/a']
  let approvedCount = 0

  DEPARTMENTS.forEach(dept => {
    const status = (site[dept.statusField] || site[dept.dbField] || '').toLowerCase()
    if (approvedStatuses.includes(status)) {
      approvedCount++
    }
  })

  return Math.round((approvedCount / DEPARTMENTS.length) * 100)
}

/**
 * Get aging bracket label
 */
export function getAgingBracket(days) {
  if (days <= 7) return '0-7 Days'
  if (days <= 14) return '8-14 Days'
  if (days <= 30) return '15-30 Days'
  if (days <= 60) return '31-60 Days'
  return '60+ Days'
}

/**
 * Get status class for styling
 */
export function getStatusClass(status) {
  if (!status) return ''
  const s = status.toLowerCase()
  if (s === 'approved') return 'status-approved'
  if (s === 'rejected') return 'status-rejected'
  if (s === 'pending') return 'status-pending'
  if (s === 'released') return 'status-released'
  return ''
}

/**
 * Get status color
 */
export function getStatusColor(status) {
  if (!status) return '#64748b'
  const s = status.toLowerCase()
  if (s === 'approved' || s.includes('approved')) return '#22c55e'
  if (s === 'rejected' || s.includes('rejected')) return '#ef4444'
  if (s === 'pending' || s.includes('review') || s.includes('validation')) return '#eab308'
  if (s === 'released') return '#3b82f6'
  return '#64748b'
}

/**
 * Validate a single field
 */
export function validateField(fieldName, value) {
  const result = { valid: true, error: null, warning: null }

  // Required fields
  const required = ['siteId', 'site_id', 'finalSiteName', 'final_site_name', 'phaseName', 'phase_name']
  if (required.includes(fieldName)) {
    if (!value || String(value).trim() === '') {
      result.valid = false
      result.error = `${formatFieldName(fieldName)} is required`
      return result
    }
  }

  if (!value) return result

  const stringValue = String(value).trim()

  // Range validations
  if (fieldName === 'longitude' || fieldName === 'lon') {
    const num = parseFloat(value)
    if (!isNaN(num) && (num < -180 || num > 180)) {
      result.valid = false
      result.error = 'Longitude must be between -180 and 180'
    }
  }

  if (fieldName === 'latitude' || fieldName === 'lat') {
    const num = parseFloat(value)
    if (!isNaN(num) && (num < -90 || num > 90)) {
      result.valid = false
      result.error = 'Latitude must be between -90 and 90'
    }
  }

  if (fieldName === 'height_m' || fieldName === 'heightM') {
    const num = parseFloat(value)
    if (!isNaN(num) && (num < 0 || num > 200)) {
      result.valid = false
      result.error = 'Height must be between 0 and 200 meters'
    }
  }

  // Pattern validations
  if (fieldName === 'siteId' || fieldName === 'site_id') {
    if (!/^[A-Za-z0-9_-]+$/.test(stringValue)) {
      result.valid = false
      result.error = 'Site ID must contain only letters, numbers, dashes, and underscores'
    }
  }

  // Enum validations (warnings only)
  if (fieldName === 'governorate') {
    if (stringValue && !GOVERNORATES.includes(stringValue)) {
      result.warning = `Unrecognized governorate: "${value}"`
    }
  }

  return result
}

/**
 * Validate entire site for save
 */
export function validateSite(site) {
  const errors = []
  const warnings = []

  if (!site) {
    return { valid: false, errors: [{ field: '_site', message: 'Site is required' }], warnings }
  }

  // Check required fields
  const requiredFields = [
    { field: 'siteId', alt: 'site_id' },
    { field: 'finalSiteName', alt: 'final_site_name' }
  ]

  requiredFields.forEach(({ field, alt }) => {
    const value = site[field] || site[alt]
    if (!value || String(value).trim() === '') {
      errors.push({ field, message: `${formatFieldName(field)} is required` })
    }
  })

  // Validate coordinates
  if (site.longitude || site.lon) {
    const lon = parseFloat(site.longitude || site.lon)
    if (!isNaN(lon) && (lon < -180 || lon > 180)) {
      errors.push({ field: 'longitude', message: 'Longitude must be between -180 and 180' })
    }
  }

  if (site.latitude || site.lat) {
    const lat = parseFloat(site.latitude || site.lat)
    if (!isNaN(lat) && (lat < -90 || lat > 90)) {
      errors.push({ field: 'latitude', message: 'Latitude must be between -90 and 90' })
    }
  }

  return { valid: errors.length === 0, errors, warnings }
}

/**
 * Validate workflow status change
 */
export function validateStatusChange(site, departmentKey, newStatus) {
  const result = { allowed: true, reason: '' }
  const normalizedStatus = (newStatus || '').toLowerCase()

  // Allow rejection, pending, N/A at any time
  if (['rejected', 'pending', 'n/a', ''].includes(normalizedStatus)) {
    return result
  }

  // For approval, check previous departments
  if (['approved', 'released'].includes(normalizedStatus)) {
    const deptIndex = DEPARTMENTS.findIndex(d => d.key === departmentKey)

    if (deptIndex > 0) {
      // Check all previous departments
      for (let i = 0; i < deptIndex; i++) {
        const prevDept = DEPARTMENTS[i]
        const prevStatus = (site[prevDept.statusField] || '').toLowerCase()

        if (!['approved', 'released', 'n/a'].includes(prevStatus)) {
          result.allowed = false
          result.reason = `Cannot approve ${DEPARTMENTS[deptIndex].label}: ${prevDept.label} must be approved first`
          return result
        }
      }
    }
  }

  return result
}

/**
 * Get workflow progress summary
 */
export function getWorkflowSummary(site) {
  const steps = DEPARTMENTS.map((dept, index) => {
    const status = (site[dept.statusField] || site[dept.dbField] || '').toLowerCase()
    const isComplete = ['approved', 'released', 'n/a'].includes(status)

    return {
      key: dept.key,
      label: dept.label,
      icon: dept.icon,
      order: index + 1,
      status: status || 'not_started',
      isComplete,
      isCurrent: !isComplete && (index === 0 || ['approved', 'released', 'n/a'].includes(
        (site[DEPARTMENTS[index - 1].statusField] || '').toLowerCase()
      ))
    }
  })

  const completedCount = steps.filter(s => s.isComplete).length
  const percentage = Math.round((completedCount / steps.length) * 100)
  const isComplete = percentage === 100
  const currentStep = steps.find(s => s.isCurrent) || steps.find(s => !s.isComplete)
  const hasRejection = steps.some(s => s.status === 'rejected')

  return {
    steps,
    percentage,
    isComplete,
    currentStep: currentStep?.key || null,
    hasRejection,
    completedCount,
    totalCount: steps.length
  }
}

/**
 * Recalculate all fields before saving
 */
export function recalculateAll(site, updates = {}) {
  const merged = { ...site, ...updates }
  const result = { ...merged }

  // Recalculate overall status
  result.tssrOverallStatus = calculateOverallStatus(result)

  // Recalculate action age
  result.actionAge = calculateActionAge(result)

  // Add workflow progress
  result.workflowProgress = calculateWorkflowProgress(result)

  return result
}

/**
 * Format field name for display
 */
function formatFieldName(field) {
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\w/, c => c.toUpperCase())
    .trim()
}

// Default export
export default {
  DEPARTMENTS,
  GOVERNORATES,
  PHASES,
  STATUS_OPTIONS,
  OVERALL_STATUS_OPTIONS,
  calculateActionAge,
  calculateOverallStatus,
  calculateWorkflowProgress,
  getAgingBracket,
  getStatusClass,
  getStatusColor,
  validateField,
  validateSite,
  validateStatusChange,
  getWorkflowSummary,
  recalculateAll
}
