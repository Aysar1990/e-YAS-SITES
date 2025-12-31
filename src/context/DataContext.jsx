/**
 * DataContext V2.0
 * REFACTORED: Extracted hooks and utilities
 * Original: 485 lines → Refactored: ~120 lines
 */

import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { getApiInstance } from './apiManager'
import { useDataOperations } from './useDataOperations'
import { useRealTimeSync } from './useRealTimeSync'

const DataContext = createContext()

// Get API instance (singleton)
const api = getApiInstance()

export const useData = () => {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within DataProvider')
  }
  return context
}

export const DataProvider = ({ children }) => {
  const { user } = useAuth()
  const [activePhase, setActivePhase] = useState('RO4')

  // Data operations
  const dataOps = useDataOperations(api, user, activePhase)
  const {
    sites, setSites, stats, settings, setSettings, phases, loading,
    syncStatus, error, statsByPartOf, overviewTable, contractors,
    loadSettings, loadPhases, fetchData, updateSettings, manualSync,
    searchSites, exportToExcel, fetchStatsByPartOf, fetchOverviewTable, loadContractors
  } = dataOps

  // Real-time sync
  const realTimeSync = useRealTimeSync(api, user, fetchData)
  const {
    connectionStatus, nokiaReviews, pendingUpdates, toastMessage, syncServiceStatus,
    showToast, clearToast, applyPendingUpdates, dismissPendingUpdates, getLastSyncTime,
    setupSiteHandlers
  } = realTimeSync

  // Load settings and phases on mount
  useEffect(() => {
    const init = async () => {
      const loadedSettings = await loadSettings()
      if (loadedSettings?.active_phase) {
        setActivePhase(loadedSettings.active_phase)
      }
      await loadPhases()
    }
    init()
  }, [loadSettings, loadPhases])

  // Fetch data when user or phase changes
  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user, activePhase, fetchData])

  // Setup site handlers for real-time updates
  useEffect(() => {
    setupSiteHandlers(setSites)
  }, [setupSiteHandlers, setSites])

  // Enhanced updateSettings with phase handling
  const handleUpdateSettings = async (newSettings) => {
    const result = await updateSettings(newSettings)
    if (result.success && newSettings.active_phase) {
      setActivePhase(newSettings.active_phase)
    }
    return result
  }

  const value = {
    // Data state
    sites,
    stats,
    settings,
    phases,
    activePhase,
    setActivePhase,
    loading,
    error,
    syncStatus,
    statsByPartOf,
    overviewTable,
    contractors,

    // Data operations
    fetchData,
    updateSettings: handleUpdateSettings,
    manualSync,
    searchSites,
    exportToExcel,
    loadPhases,
    fetchStatsByPartOf,
    fetchOverviewTable,
    loadContractors,

    // Real-time sync state
    connectionStatus,
    nokiaReviews,
    pendingUpdates,
    toastMessage,
    syncServiceStatus,

    // Real-time sync methods
    applyPendingUpdates,
    dismissPendingUpdates,
    getLastSyncTime,
    showToast,
    clearToast,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export default DataContext
