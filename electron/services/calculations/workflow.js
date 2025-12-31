/**
 * Workflow Service - Day 12
 *
 * Manages the TSSR review workflow sequence
 * Enforces: TI → RF Planning → RF Optimization → Civil → MW → Nokia NPO
 */

/**
 * Workflow sequence definition
 * Order is critical: each department can only approve after the previous is approved
 */
const WORKFLOW_SEQUENCE = [
  {
    key: 'ti',
    statusField: 'ti_status',
    label: 'TI (Transmission Integration)',
    order: 1,
    canReject: true,
    autoAdvance: true
  },
  {
    key: 'rf_plan',
    statusField: 'rf_plan_status',
    label: 'RF Planning',
    order: 2,
    canReject: true,
    autoAdvance: true
  },
  {
    key: 'rf_opt',
    statusField: 'rf_opt_status',
    label: 'RF Optimization',
    order: 3,
    canReject: true,
    autoAdvance: true
  },
  {
    key: 'civil',
    statusField: 'civil_status',
    label: 'Civil',
    order: 4,
    canReject: true,
    autoAdvance: true
  },
  {
    key: 'mw',
    statusField: 'mw_status',
    label: 'Microwave (MW)',
    order: 5,
    canReject: true,
    autoAdvance: true
  },
  {
    key: 'nokia_npo',
    statusField: 'nokia_npo_status',
    label: 'Nokia NPO',
    order: 6,
    canReject: true,
    autoAdvance: false // Final step
  }
]

/**
 * Approved status values (case-insensitive matching)
 */
const APPROVED_STATUSES = ['approved', 'released', 'n/a']

/**
 * Get department info by key
 * @param {string} key - Department key
 * @returns {Object|null} Department info
 */
function getDepartment(key) {
  return WORKFLOW_SEQUENCE.find(d => d.key === key) || null
}

/**
 * Get department info by status field name
 * @param {string} fieldName - Status field name
 * @returns {Object|null} Department info
 */
function getDepartmentByField(fieldName) {
  // Handle both snake_case and camelCase
  const snakeField = fieldName.replace(/([A-Z])/g, '_$1').toLowerCase()
  return WORKFLOW_SEQUENCE.find(d => d.statusField === snakeField || d.statusField === fieldName) || null
}

/**
 * Check if a department is approved
 * @param {Object} site - Site object
 * @param {string} deptKey - Department key
 * @returns {boolean}
 */
function isDepartmentApproved(site, deptKey) {
  const dept = getDepartment(deptKey)
  if (!dept) return false

  const status = (site[dept.statusField] || site[toCamelCase(dept.statusField)] || '').toLowerCase()
  return APPROVED_STATUSES.includes(status)
}

/**
 * Get the previous department in the workflow
 * @param {string} deptKey - Current department key
 * @returns {Object|null} Previous department info
 */
function getPreviousDepartment(deptKey) {
  const dept = getDepartment(deptKey)
  if (!dept || dept.order === 1) return null

  return WORKFLOW_SEQUENCE.find(d => d.order === dept.order - 1) || null
}

/**
 * Get the next department in the workflow
 * @param {string} deptKey - Current department key
 * @returns {Object|null} Next department info
 */
function getNextDepartment(deptKey) {
  const dept = getDepartment(deptKey)
  if (!dept) return null

  return WORKFLOW_SEQUENCE.find(d => d.order === dept.order + 1) || null
}

/**
 * Validate if a status change is allowed
 * Rules:
 * - Cannot approve if previous department not approved
 * - Can always reject or set to pending
 * - N/A is allowed at any time
 *
 * @param {Object} site - Current site object
 * @param {string} department - Department key being changed
 * @param {string} newStatus - Proposed new status
 * @returns {Object} { allowed: boolean, reason: string }
 */
function validateStatusChange(site, department, newStatus) {
  const result = { allowed: true, reason: '' }

  if (!site || !department || !newStatus) {
    result.allowed = false
    result.reason = 'Missing required parameters'
    return result
  }

  const normalizedStatus = newStatus.toLowerCase().trim()
  const dept = getDepartment(department)

  if (!dept) {
    result.allowed = false
    result.reason = `Unknown department: ${department}`
    return result
  }

  // Allow rejection, pending, N/A at any time
  if (['rejected', 'pending', 'n/a', ''].includes(normalizedStatus)) {
    return result
  }

  // For approval/released, check previous departments
  if (['approved', 'released'].includes(normalizedStatus)) {
    const prevDept = getPreviousDepartment(department)

    if (prevDept) {
      const prevApproved = isDepartmentApproved(site, prevDept.key)
      if (!prevApproved) {
        result.allowed = false
        result.reason = `Cannot approve ${dept.label}: ${prevDept.label} must be approved first`
        return result
      }
    }

    // Check all previous departments in sequence
    for (const seqDept of WORKFLOW_SEQUENCE) {
      if (seqDept.order >= dept.order) break

      if (!isDepartmentApproved(site, seqDept.key)) {
        result.allowed = false
        result.reason = `Cannot approve ${dept.label}: ${seqDept.label} must be approved first`
        return result
      }
    }
  }

  return result
}

/**
 * Auto-progress the workflow to the next department
 * When a department is approved, set the next department to "Pending"
 *
 * @param {Object} site - Site object
 * @returns {Object} Updated site with next department set to pending
 */
function autoProgressWorkflow(site) {
  if (!site) return site

  const updatedSite = { ...site }
  let progressMade = false

  // Find the first non-approved department that can be advanced
  for (const dept of WORKFLOW_SEQUENCE) {
    const status = (site[dept.statusField] || site[toCamelCase(dept.statusField)] || '').toLowerCase()

    if (APPROVED_STATUSES.includes(status)) {
      // This department is approved, check if next can be advanced
      const nextDept = getNextDepartment(dept.key)
      if (nextDept && nextDept.autoAdvance !== false) {
        const nextStatus = (site[nextDept.statusField] || site[toCamelCase(nextDept.statusField)] || '').toLowerCase()

        // If next department has no status, set to Pending
        if (!nextStatus || nextStatus === '') {
          updatedSite[nextDept.statusField] = 'Pending'
          progressMade = true
        }
      }
    } else {
      // Stop at first non-approved department
      break
    }
  }

  if (progressMade) {
    updatedSite._workflow_advanced_at = new Date().toISOString()
  }

  return updatedSite
}

/**
 * Get workflow progress information
 * @param {Object} site - Site object
 * @returns {Object} Progress info
 */
function getWorkflowProgress(site) {
  if (!site) {
    return {
      percentage: 0,
      currentDepartment: null,
      completedDepartments: [],
      pendingDepartments: [],
      remainingDepartments: []
    }
  }

  const completed = []
  const pending = []
  const remaining = []
  let currentDept = null

  for (const dept of WORKFLOW_SEQUENCE) {
    const status = (site[dept.statusField] || site[toCamelCase(dept.statusField)] || '').toLowerCase()

    if (APPROVED_STATUSES.includes(status)) {
      completed.push(dept.key)
    } else if (status === 'pending' || status === 'rejected') {
      pending.push(dept.key)
      if (!currentDept) currentDept = dept.key
    } else {
      remaining.push(dept.key)
      if (!currentDept && completed.length > 0) {
        currentDept = dept.key
      }
    }
  }

  // If nothing pending but not all complete, first incomplete is current
  if (!currentDept && remaining.length > 0) {
    currentDept = remaining[0]
  }

  const percentage = Math.round((completed.length / WORKFLOW_SEQUENCE.length) * 100)

  return {
    percentage,
    currentDepartment: currentDept,
    completedDepartments: completed,
    pendingDepartments: pending,
    remainingDepartments: remaining
  }
}

/**
 * Get workflow status summary for display
 * @param {Object} site - Site object
 * @returns {Object} Summary object
 */
function getWorkflowSummary(site) {
  const progress = getWorkflowProgress(site)

  const summary = {
    ...progress,
    isComplete: progress.percentage === 100,
    isBlocked: progress.pendingDepartments.some(d => {
      const status = (site[getDepartment(d)?.statusField] || '').toLowerCase()
      return status === 'rejected'
    }),
    steps: WORKFLOW_SEQUENCE.map(dept => {
      const status = (site[dept.statusField] || site[toCamelCase(dept.statusField)] || '').toLowerCase()
      return {
        key: dept.key,
        label: dept.label,
        order: dept.order,
        status: status || 'not_started',
        isComplete: APPROVED_STATUSES.includes(status),
        isCurrent: dept.key === progress.currentDepartment
      }
    })
  }

  return summary
}

/**
 * Check if the entire workflow is complete
 * @param {Object} site - Site object
 * @returns {boolean}
 */
function isWorkflowComplete(site) {
  if (!site) return false

  return WORKFLOW_SEQUENCE.every(dept => isDepartmentApproved(site, dept.key))
}

/**
 * Get the current blocking issue in the workflow
 * @param {Object} site - Site object
 * @returns {Object|null} Blocking issue info
 */
function getBlockingIssue(site) {
  if (!site) return null

  for (const dept of WORKFLOW_SEQUENCE) {
    const status = (site[dept.statusField] || site[toCamelCase(dept.statusField)] || '').toLowerCase()

    if (status === 'rejected') {
      return {
        department: dept.key,
        label: dept.label,
        status: 'rejected',
        message: `Workflow blocked: ${dept.label} is rejected`
      }
    }

    if (!APPROVED_STATUSES.includes(status) && status !== 'pending') {
      return {
        department: dept.key,
        label: dept.label,
        status: status || 'not_started',
        message: `Workflow paused at ${dept.label}`
      }
    }
  }

  return null
}

/**
 * Convert snake_case to camelCase
 */
function toCamelCase(str) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

// Export
module.exports = {
  WORKFLOW_SEQUENCE,
  APPROVED_STATUSES,
  getDepartment,
  getDepartmentByField,
  isDepartmentApproved,
  getPreviousDepartment,
  getNextDepartment,
  validateStatusChange,
  autoProgressWorkflow,
  getWorkflowProgress,
  getWorkflowSummary,
  isWorkflowComplete,
  getBlockingIssue
}
