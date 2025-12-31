/**
 * Sites filter hook
 * Handles search, status, priority, and contractor filtering
 * @module components/Sites/hooks/useSitesFilters
 */

import { useState, useMemo } from 'react'

/**
 * Custom hook for sites filtering
 * @param {Array} sites - Array of sites to filter
 * @param {Object} options - Filter options
 * @returns {Object} Filter state and filtered sites
 */
export const useSitesFilters = (sites, options = {}) => {
  const { defaultSort = 'priority' } = options

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [contractorFilter, setContractorFilter] = useState('all')
  const [governorateFilter, setGovernorateFilter] = useState('all')

  // Filter sites based on current filters
  const filteredSites = useMemo(() => {
    return sites.filter((site) => {
      const siteId = String(site.site_id || '').toLowerCase()
      const siteName = String(site.final_site_name || '').toLowerCase()
      const governorate = String(site.governorate || '').toLowerCase()
      const contractor = String(site.tssr_subcon || '').toLowerCase()
      const search = searchTerm.toLowerCase()

      const matchesSearch =
        siteId.includes(search) ||
        siteName.includes(search) ||
        governorate.includes(search) ||
        contractor.includes(search)

      const matchesStatus = statusFilter === 'all' || site.tssr_overall_status === statusFilter
      const matchesPriority = priorityFilter === 'all' || String(site.priority) === priorityFilter
      const matchesContractor = contractorFilter === 'all' || site.tssr_subcon === contractorFilter
      const matchesGovernorate = governorateFilter === 'all' || site.governorate === governorateFilter

      return matchesSearch && matchesStatus && matchesPriority && matchesContractor && matchesGovernorate
    })
  }, [sites, searchTerm, statusFilter, priorityFilter, contractorFilter, governorateFilter])

  // Sort filtered sites
  const sortedSites = useMemo(() => {
    const sorted = [...filteredSites]

    if (defaultSort === 'priority') {
      return sorted.sort((a, b) => (a.priority || 999) - (b.priority || 999))
    }
    if (defaultSort === 'site_id') {
      return sorted.sort((a, b) => String(a.site_id || '').localeCompare(String(b.site_id || '')))
    }
    if (defaultSort === 'status') {
      return sorted.sort((a, b) => String(a.tssr_overall_status || '').localeCompare(String(b.tssr_overall_status || '')))
    }

    return sorted
  }, [filteredSites, defaultSort])

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setPriorityFilter('all')
    setContractorFilter('all')
    setGovernorateFilter('all')
  }

  // Check if any filter is active
  const hasActiveFilters =
    searchTerm !== '' ||
    statusFilter !== 'all' ||
    priorityFilter !== 'all' ||
    contractorFilter !== 'all' ||
    governorateFilter !== 'all'

  // --- Saved Views Logic ---
  const [savedViews, setSavedViews] = useState(() => {
    try {
      const saved = localStorage.getItem('tssr_saved_views')
      return saved ? JSON.parse(saved) : []
    } catch (e) {
      console.error('Failed to load saved views:', e)
      return []
    }
  })

  // Save views to localStorage whenever they change
  const persistViews = (views) => {
    setSavedViews(views)
    try {
      localStorage.setItem('tssr_saved_views', JSON.stringify(views))
    } catch (e) {
      console.error('Failed to save views:', e)
    }
  }

  const saveCurrentView = (viewName) => {
    const newView = {
      id: Date.now().toString(),
      name: viewName,
      filters: {
        searchTerm,
        statusFilter,
        priorityFilter,
        contractorFilter,
        governorateFilter
      },
      createdAt: new Date().toISOString()
    }
    const updatedViews = [...savedViews, newView]
    persistViews(updatedViews)
    return newView
  }

  const loadView = (viewId) => {
    const view = savedViews.find(v => v.id === viewId)
    if (view && view.filters) {
      setSearchTerm(view.filters.searchTerm || '')
      setStatusFilter(view.filters.statusFilter || 'all')
      setPriorityFilter(view.filters.priorityFilter || 'all')
      setContractorFilter(view.filters.contractorFilter || 'all')
      setGovernorateFilter(view.filters.governorateFilter || 'all')
      return true
    }
    return false
  }

  const deleteView = (viewId) => {
    const updatedViews = savedViews.filter(v => v.id !== viewId)
    persistViews(updatedViews)
  }

  return {
    // Filter state
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    contractorFilter,
    setContractorFilter,
    governorateFilter,
    setGovernorateFilter,

    // Results
    filteredSites,
    sortedSites,
    filteredCount: filteredSites.length,
    totalCount: sites.length,

    // Actions
    resetFilters,
    hasActiveFilters,

    // Saved Views
    savedViews,
    saveCurrentView,
    loadView,
    deleteView
  }
}

export default useSitesFilters
