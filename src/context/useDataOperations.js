/**
 * useDataOperations Hook
 * Data fetching and manipulation operations
 * Extracted from DataContext.jsx
 */

import { useState, useCallback } from 'react'

export const useDataOperations = (api, user, activePhase) => {
  const [sites, setSites] = useState([])
  const [stats, setStats] = useState({})
  const [settings, setSettings] = useState({})
  const [phases, setPhases] = useState([])
  const [loading, setLoading] = useState(false)
  const [syncStatus, setSyncStatus] = useState(null)
  const [error, setError] = useState(null)
  const [statsByPartOf, setStatsByPartOf] = useState([])
  const [overviewTable, setOverviewTable] = useState([])
  const [contractors, setContractors] = useState([])

  // Load settings
  const loadSettings = useCallback(async () => {
    try {
      if (api.getSettings) {
        const result = await api.getSettings()
        if (result.success) {
          setSettings(result.settings)
          return result.settings
        }
      }
      return null
    } catch (err) {
      console.error('Failed to load settings:', err)
      return null
    }
  }, [api])

  // Load phases
  const loadPhases = useCallback(async () => {
    try {
      if (api.getPhases) {
        const result = await api.getPhases()
        if (result.success) {
          setPhases(result.phases)
          return result.phases
        }
      }
      return []
    } catch (err) {
      console.error('Failed to load phases:', err)
      return []
    }
  }, [api])

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!user) {
      console.log('⚠️ fetchData - No user, skipping')
      return
    }

    console.log('📥 fetchData - Starting fetch for phase:', activePhase)
    setLoading(true)
    setError(null)

    try {
      const [dataResult, statsResult] = await Promise.all([
        api.getData({
          role: user.role,
          contractorName: user.contractorName,
          phase: activePhase,
        }),
        api.getStats({
          role: user.role,
          contractorName: user.contractorName,
          phase: activePhase,
        }),
      ])

      console.log('📥 fetchData - dataResult:', dataResult?.success, 'sites:', dataResult?.sites?.length)
      console.log('📥 fetchData - statsResult:', statsResult?.success)
      
      if (statsResult?.success) {
        console.log('📊 Stats breakdown:', statsResult.stats?.statusBreakdown)
        console.log('📊 Overview stats:', statsResult.stats?.overviewStats)
      }

      if (dataResult.success) {
        setSites(dataResult.sites)
      } else {
        console.error('❌ getData failed:', dataResult.error)
        setError(dataResult.error)
      }

      if (statsResult.success) {
        setStats(statsResult.stats)
      } else {
        console.error('❌ getStats failed:', statsResult.error)
      }
    } catch (err) {
      console.error('❌ Data fetch error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [api, user, activePhase])

  // Update settings
  const updateSettings = useCallback(async (newSettings) => {
    try {
      const result = await api.updateSettings(newSettings)
      if (result.success) {
        setSettings(prev => ({ ...prev, ...newSettings }))
        return { success: true }
      }
      return result
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [api])

  // Manual sync
  const manualSync = useCallback(async () => {
    setLoading(true)
    try {
      const result = await api.manualSync()
      if (result.success) {
        await fetchData()
      }
      return result
    } catch (err) {
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [api, fetchData])

  // Search sites
  const searchSites = useCallback(async (query) => {
    try {
      const result = await api.searchSites({ query, phase: activePhase })
      return result
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [api, activePhase])

  // Export to Excel
  const exportToExcel = useCallback(async (data, filename) => {
    try {
      const result = await api.exportExcel({ data, filename })
      return result
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [api])

  // Fetch stats by part of
  const fetchStatsByPartOf = useCallback(async () => {
    try {
      if (api.getStatsByPartOf) {
        const result = await api.getStatsByPartOf({ phase: activePhase })
        if (result.success) {
          setStatsByPartOf(result.stats)
        }
        return result
      }
      return { success: false, error: 'Method not available' }
    } catch (err) {
      console.error('Failed to fetch stats by part of:', err)
      return { success: false, error: err.message }
    }
  }, [api, activePhase])

  // Fetch overview table
  const fetchOverviewTable = useCallback(async () => {
    try {
      if (api.getOverviewTable) {
        const result = await api.getOverviewTable({ phase: activePhase })
        if (result.success) {
          setOverviewTable(result.table)
        }
        return result
      }
      return { success: false, error: 'Method not available' }
    } catch (err) {
      console.error('Failed to fetch overview table:', err)
      return { success: false, error: err.message }
    }
  }, [api, activePhase])

  // Load contractors
  const loadContractors = useCallback(async () => {
    try {
      if (api.getContractors) {
        const result = await api.getContractors()
        if (result.success) {
          setContractors(result.contractors || [])
        }
        return result
      }
      return { success: false, error: 'Method not available' }
    } catch (err) {
      console.error('Failed to load contractors:', err)
      return { success: false, error: err.message }
    }
  }, [api])

  return {
    // State
    sites,
    setSites,
    stats,
    settings,
    setSettings,
    phases,
    loading,
    syncStatus,
    setSyncStatus,
    error,
    statsByPartOf,
    overviewTable,
    contractors,

    // Operations
    loadSettings,
    loadPhases,
    fetchData,
    updateSettings,
    manualSync,
    searchSites,
    exportToExcel,
    fetchStatsByPartOf,
    fetchOverviewTable,
    loadContractors
  }
}

export default useDataOperations
