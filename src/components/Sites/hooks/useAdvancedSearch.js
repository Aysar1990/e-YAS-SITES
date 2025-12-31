/**
 * useAdvancedSearch Hook
 * Advanced multi-field search with Boolean operators, history, and suggestions
 * 
 * Features:
 * - Multi-field search (Site ID, Name, Contractor, Governorate, etc.)
 * - Boolean operators (AND, OR, NOT)
 * - Search history (localStorage)
 * - Auto-complete suggestions
 * - Quick filters
 */

import { useState, useMemo, useEffect, useCallback } from 'react'

const SEARCH_HISTORY_KEY = 'tssr_search_history'
const MAX_HISTORY_ITEMS = 20

export const useAdvancedSearch = (sites = []) => {
  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFields, setSearchFields] = useState(['all']) // 'all', 'site_id', 'name', 'contractor', 'governorate'
  const [searchMode, setSearchMode] = useState('simple') // 'simple', 'boolean'
  const [searchHistory, setSearchHistory] = useState([])
  
  // Quick filters state
  const [quickFilters, setQuickFilters] = useState({
    approved: false,
    zainValidation: false,
    romReview: false,
    nokiaNPO: false,
    nokiaROM: false,
    nokiaGSD: false,
    subconValidation: false,
    notSurveyed: false,
    needAccess: false
  })

  // Load search history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SEARCH_HISTORY_KEY)
      if (saved) {
        setSearchHistory(JSON.parse(saved))
      }
    } catch (error) {
      console.warn('Failed to load search history:', error)
    }
  }, [])

  // Save search to history
  const saveToHistory = useCallback((query) => {
    if (!query.trim()) return
    
    setSearchHistory(prev => {
      // Remove duplicates and add to start
      const filtered = prev.filter(item => item.query !== query)
      const updated = [
        { query, timestamp: Date.now(), fields: searchFields },
        ...filtered
      ].slice(0, MAX_HISTORY_ITEMS)
      
      try {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated))
      } catch (error) {
        console.warn('Failed to save search history:', error)
      }
      
      return updated
    })
  }, [searchFields])

  // Clear search history
  const clearHistory = useCallback(() => {
    setSearchHistory([])
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY)
    } catch (error) {
      console.warn('Failed to clear search history:', error)
    }
  }, [])

  // Parse boolean search query
  const parseBooleanQuery = useCallback((query) => {
    // Simple boolean parser supporting AND, OR, NOT
    const terms = query
      .split(/\s+(AND|OR|NOT)\s+/i)
      .map(term => term.trim())
      .filter(Boolean)
    
    return terms
  }, [])

  // Check if text matches search query
  const matchesSearch = useCallback((text, query) => {
    if (!text || !query) return false
    return text.toString().toLowerCase().includes(query.toLowerCase())
  }, [])

  // Apply search to a single site
  const siteMatchesSearch = useCallback((site, query, fields, mode) => {
    if (!query.trim()) return true
    
    const lowerQuery = query.toLowerCase()
    
    // Boolean search mode
    if (mode === 'boolean') {
      const terms = parseBooleanQuery(query)
      let result = true
      let currentOperator = 'AND'
      
      for (let i = 0; i < terms.length; i++) {
        const term = terms[i]
        
        if (['AND', 'OR', 'NOT'].includes(term.toUpperCase())) {
          currentOperator = term.toUpperCase()
          continue
        }
        
        const matches = siteMatchesSearch(site, term, fields, 'simple')
        
        if (currentOperator === 'AND') {
          result = result && matches
        } else if (currentOperator === 'OR') {
          result = result || matches
        } else if (currentOperator === 'NOT') {
          result = result && !matches
        }
      }
      
      return result
    }
    
    // Simple search mode
    const fieldsToSearch = fields.includes('all') ? 
      ['site_id', 'final_site_name', 'tssr_subcon', 'governorate', 'phase_name', 'tssr_overall_status'] :
      fields
    
    return fieldsToSearch.some(field => {
      const value = site[field]
      return matchesSearch(value, lowerQuery)
    })
  }, [matchesSearch, parseBooleanQuery])

  // Apply quick filters
  const applyQuickFilters = useCallback((site) => {
    // If no quick filters active, return true
    if (!Object.values(quickFilters).some(Boolean)) return true
    
    const status = site.tssr_overall_status?.toLowerCase() || ''
    
    // Match exact status values
    if (quickFilters.approved && status === 'approved') return true
    if (quickFilters.zainValidation && status === 'tssr under zain validation') return true
    if (quickFilters.romReview && status === 'tssr under rom review') return true
    if (quickFilters.nokiaNPO && status === 'tssr under nokia npo validation') return true
    if (quickFilters.nokiaROM && status === 'tssr under nokia rom validation') return true
    if (quickFilters.nokiaGSD && status === 'tssr under nokia gsd validation') return true
    if (quickFilters.subconValidation && status === 'tssr under subcon validation') return true
    if (quickFilters.notSurveyed && status === 'site not surveyed') return true
    if (quickFilters.needAccess && status === 'need access') return true
    
    return false
  }, [quickFilters])

  // Get filtered sites
  const filteredSites = useMemo(() => {
    return sites.filter(site => {
      const matchesSearchQuery = siteMatchesSearch(site, searchQuery, searchFields, searchMode)
      const matchesQuickFilters = applyQuickFilters(site)
      
      return matchesSearchQuery && matchesQuickFilters
    })
  }, [sites, searchQuery, searchFields, searchMode, siteMatchesSearch, applyQuickFilters])

  // Get auto-complete suggestions
  const suggestions = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return []
    
    const lowerQuery = searchQuery.toLowerCase()
    const uniqueSuggestions = new Set()
    
    // Get suggestions from current sites
    sites.forEach(site => {
      const fieldsToCheck = searchFields.includes('all') ?
        ['site_id', 'final_site_name', 'tssr_subcon', 'governorate'] :
        searchFields
      
      fieldsToCheck.forEach(field => {
        const value = site[field]?.toString()
        if (value && value.toLowerCase().includes(lowerQuery)) {
          uniqueSuggestions.add(value)
        }
      })
    })
    
    // Add from search history
    searchHistory.forEach(item => {
      if (item.query.toLowerCase().includes(lowerQuery)) {
        uniqueSuggestions.add(item.query)
      }
    })
    
    return Array.from(uniqueSuggestions).slice(0, 10)
  }, [searchQuery, searchFields, sites, searchHistory])

  // Execute search
  const executeSearch = useCallback((query) => {
    setSearchQuery(query)
    if (query.trim()) {
      saveToHistory(query)
    }
  }, [saveToHistory])

  // Toggle quick filter
  const toggleQuickFilter = useCallback((filterName) => {
    setQuickFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }))
  }, [])

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSearchQuery('')
    setQuickFilters({
      approved: false,
      zainValidation: false,
      romReview: false,
      nokiaNPO: false,
      nokiaROM: false,
      nokiaGSD: false,
      subconValidation: false,
      notSurveyed: false,
      needAccess: false
    })
  }, [])

  return {
    // State
    searchQuery,
    searchFields,
    searchMode,
    quickFilters,
    
    // Results
    filteredSites,
    suggestions,
    searchHistory,
    
    // Actions
    setSearchQuery: executeSearch,
    setSearchFields,
    setSearchMode,
    toggleQuickFilter,
    clearAllFilters,
    clearHistory,
    
    // Stats
    totalResults: filteredSites.length,
    hasActiveFilters: searchQuery.trim() !== '' || Object.values(quickFilters).some(Boolean)
  }
}

export default useAdvancedSearch
