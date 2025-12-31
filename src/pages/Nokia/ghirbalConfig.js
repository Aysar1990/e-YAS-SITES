/**
 * Ghirbal Configuration
 * Constants and utilities for Ghirbal page
 * Extracted from Ghirbal.jsx
 */

// Status filters
export const STATUS_FILTERS = [
  { value: 'all', label: 'All', labelAr: 'الكل' },
  { value: 'under_npo', label: 'Under NPO', labelAr: 'تحت NPO', dbValue: 'TSSR Under Nokia NPO Validation' },
  { value: 'under_gsd', label: 'Under GSD', labelAr: 'تحت GSD', dbValue: 'TSSR Under Nokia GSD Validation' },
  { value: 'under_subcon', label: 'Under Subcon', labelAr: 'تحت المقاول', dbValue: 'TSSR Under Subcon validation' },
  { value: 'not_surveyed', label: 'Not Surveyed', labelAr: 'لم يُمسح', dbValue: 'Site not Surveyed' },
]

// Ghirbal statuses to filter
export const GHIRBAL_STATUSES = [
  'TSSR Under Nokia NPO Validation',
  'TSSR Under Nokia GSD Validation',
  'TSSR Under Subcon validation',
  'Site not Surveyed'
]

// Get short status label
export const getShortStatus = (status) => {
  if (!status) return 'N/A'
  if (status.includes('NPO')) return 'Under NPO'
  if (status.includes('GSD')) return 'Under GSD'
  if (status.includes('Subcon')) return 'Under Subcon'
  if (status.includes('not Surveyed')) return 'Not Surveyed'
  return status.substring(0, 20)
}

// Get status class for styling
export const getStatusClass = (status) => {
  if (!status) return ''
  if (status.includes('NPO')) return 'status--npo'
  if (status.includes('GSD')) return 'status--gsd'
  if (status.includes('Subcon')) return 'status--subcon'
  if (status.includes('not Surveyed')) return 'status--not-surveyed'
  return ''
}

// Filter sites based on status and search
export const filterGhirbalSites = (sites, statusFilter, searchTerm) => {
  return sites.filter(site => {
    // Status filter
    if (statusFilter !== 'all') {
      const filterConfig = STATUS_FILTERS.find(f => f.value === statusFilter)
      if (filterConfig?.dbValue && site.tssr_overall_status !== filterConfig.dbValue) {
        return false
      }
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      return (
        (site.site_id && site.site_id.toLowerCase().includes(term)) ||
        (site.final_site_name && site.final_site_name.toLowerCase().includes(term)) ||
        (site.tssr_subcon && site.tssr_subcon.toLowerCase().includes(term)) ||
        (site.nokia_note && site.nokia_note.toLowerCase().includes(term))
      )
    }

    return true
  })
}

export default {
  STATUS_FILTERS,
  GHIRBAL_STATUSES,
  getShortStatus,
  getStatusClass,
  filterGhirbalSites
}
