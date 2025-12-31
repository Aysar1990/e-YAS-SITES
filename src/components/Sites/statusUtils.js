/**
 * Status utility functions shared across Sites components
 * @module components/Sites/statusUtils
 */

/**
 * Get status colors for a given status string
 * @param {string} status - TSSR status
 * @returns {Object} - { hex: string, rgb: string }
 */
export const getStatusColors = (status) => {
  if (!status) return { hex: '#6b7280', rgb: '107, 114, 128' }
  const s = status.toLowerCase()

  if (s.includes('approved')) return { hex: '#8FD9D9', rgb: '143, 217, 217' }
  if (s.includes('rejected')) return { hex: '#ef4444', rgb: '239, 68, 68' }
  if (s.includes('under zain')) return { hex: '#f59e0b', rgb: '245, 158, 11' }
  if (s.includes('under nokia npo')) return { hex: '#8b5cf6', rgb: '139, 92, 246' }
  if (s.includes('under nokia rom')) return { hex: '#f97316', rgb: '249, 115, 22' }
  if (s.includes('under nokia gsd')) return { hex: '#06b6d4', rgb: '6, 182, 212' }
  if (s.includes('under subcon')) return { hex: '#FF8566', rgb: '255, 133, 102' }
  if (s.includes('not surveyed')) return { hex: '#6b7280', rgb: '107, 114, 128' }

  return { hex: '#FF8566', rgb: '255, 133, 102' }
}

/**
 * Check if any department status indicates rejection
 * @param {Object} site - Site object
 * @returns {boolean}
 */
export const hasRejection = (site) => {
  const depts = [site.ti_status, site.rf_plan_status, site.rf_optim_status, site.civil_status, site.mw_status]
  return depts.some(d => d && d.toLowerCase().includes('rejected'))
}

/**
 * Get department status CSS class
 * @param {string} status - Department status
 * @returns {string} - CSS class name
 */
export const getDeptClass = (status) => {
  if (!status) return ''
  const s = status.toLowerCase()
  if (s.includes('rejected')) return 'rejected'
  if (s.includes('approved')) return 'approved'
  if (s.includes('released')) return 'released'
  if (s.includes('pending')) return 'pending'
  return ''
}

/**
 * Get card status CSS class for smoke effects
 * @param {string} status - TSSR overall status
 * @returns {string} - CSS class name
 */
export const getStatusClass = (status) => {
  if (!status) return 'status-not-surveyed'
  const s = status.toLowerCase()

  // Check for specific statuses in priority order
  if (s.includes('approved')) return 'status-approved'
  if (s.includes('zain')) return 'status-under-zain'
  if (s.includes('rom review') || s.includes('under rom')) return 'status-under-rom'
  if (s.includes('npo')) return 'status-under-nokia-npo'
  if (s.includes('gsd')) return 'status-under-nokia-gsd'
  if (s.includes('subcon')) return 'status-under-subcon'
  if (s.includes('not surveyed')) return 'status-not-surveyed'
  if (s.includes('rejected')) return 'status-rejected'
  if (s.includes('need access')) return 'status-need-access'
  if (s.includes('pending')) return 'status-pending'

  return 'status-not-surveyed'
}

/**
 * Map Firebase field names to local field names
 * @param {Object} firebaseSite - Firebase site document
 * @returns {Object} - Site with local field names
 */
export const mapFirebaseToLocal = (s) => ({
  site_id: s.siteId,
  final_site_name: s.finalSiteName,
  tssr_overall_status: s.tssrOverallStatus,
  tssr_subcon: s.tssrSubcon,
  governorate: s.governorate,
  ti_status: s.tiStatus,
  rf_plan_status: s.rfPlanStatus,
  rf_optim_status: s.rfOptimStatus,
  civil_status: s.civilStatus,
  mw_status: s.mwStatus,
  priority: s.priority,
  phase_name: s.phaseName,
  id: s.id,
  ...s
})

/**
 * Map local field names to Firebase field names
 * @param {Object} site - Site with local field names
 * @returns {Object} - Site with Firebase field names
 */
export const mapLocalToFirebase = (site) => ({
  id: site.id,
  siteId: site.site_id,
  finalSiteName: site.final_site_name,
  tssrOverallStatus: site.tssr_overall_status,
  tssrSubcon: site.tssr_subcon,
  governorate: site.governorate,
  tiStatus: site.ti_status,
  rfPlanStatus: site.rf_plan_status,
  rfOptimStatus: site.rf_optim_status,
  civilStatus: site.civil_status,
  mwStatus: site.mw_status,
  nokiaNpoStatus: site.nokiaNpoStatus,
  priority: site.priority,
  phaseName: site.phase_name,
  tiComment: site.tiComment,
  rfPlanComment: site.rfPlanComment,
  rfOptimComment: site.rfOptimComment,
  civilComment: site.civilComment,
  mwComment: site.mwComment,
  nokiaNpoComment: site.nokiaNpoComment,
  rfiStatus: site.rfiStatus,
  version: site.version,
  tssrRemark: site.tssrRemark,
  comments: site.comments || [],
  editHistory: site.editHistory || [],
  ...site
})
