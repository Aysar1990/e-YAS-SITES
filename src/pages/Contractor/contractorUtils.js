/**
 * Contractor Utilities
 * Helper functions for contractor pages
 * Extracted from ContractorSites.jsx
 */

// Status colors mapping
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

// Check if any department is rejected
export const hasRejection = (site) => {
  const depts = [site.ti_status, site.rf_plan_status, site.rf_optim_status, site.civil_status, site.mw_status]
  return depts.some(d => d && d.toLowerCase().includes('rejected'))
}

// Get department status class based on status
export const getDeptClass = (status) => {
  if (!status) return ''
  const s = status.toLowerCase()
  if (s.includes('rejected')) return 'rejected'
  if (s.includes('approved')) return 'approved'
  if (s.includes('released')) return 'released'
  if (s.includes('pending')) return 'pending'
  return ''
}

// Get card status class for smoke effects
export const getStatusClass = (status) => {
  if (!status) return 'status-not-surveyed'
  const s = status.toLowerCase()
  if (s.includes('approved')) return 'status-approved'
  if (s.includes('under zain')) return 'status-under-zain'
  if (s.includes('under nokia npo')) return 'status-under-nokia-npo'
  if (s.includes('under nokia gsd')) return 'status-under-nokia-gsd'
  if (s.includes('under subcon')) return 'status-under-subcon'
  if (s.includes('not surveyed')) return 'status-not-surveyed'
  return ''
}

// Map Firebase site fields to local field names
export const mapFirebaseSiteToLocal = (site) => ({
  site_id: site.siteId,
  final_site_name: site.finalSiteName,
  tssr_overall_status: site.tssrOverallStatus,
  tssr_subcon: site.tssrSubcon,
  governorate: site.governorate,
  ti_status: site.tiStatus,
  rf_plan_status: site.rfPlanStatus,
  rf_optim_status: site.rfOptimStatus,
  civil_status: site.civilStatus,
  mw_status: site.mwStatus,
  priority: site.priority,
  phase_name: site.phaseName,
  part_of: site.partOf,
  id: site.id,
  ...site
})

// Filter and search sites
export const filterContractorSites = (sites, { searchTerm, statusFilter, priorityFilter }) => {
  return sites.filter((site) => {
    const siteId = String(site.site_id || '').toLowerCase()
    const siteName = String(site.final_site_name || '').toLowerCase()
    const governorate = String(site.governorate || '').toLowerCase()
    const search = searchTerm.toLowerCase()

    const matchesSearch =
      siteId.includes(search) ||
      siteName.includes(search) ||
      governorate.includes(search)

    const matchesStatus = statusFilter === 'all' || site.tssr_overall_status === statusFilter
    const matchesPriority = priorityFilter === 'all' || String(site.priority) === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })
}

export default {
  getStatusColors,
  hasRejection,
  getDeptClass,
  getStatusClass,
  mapFirebaseSiteToLocal,
  filterContractorSites
}
