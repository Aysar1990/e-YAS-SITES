/**
 * Sites data fetching hook
 * Handles Firebase/local data switching and mapping
 * @module components/Sites/hooks/useSitesData
 */

import { useState, useEffect, useMemo } from 'react'
import { useData } from '../../../context/DataContext'
import { useFirebaseData } from '../../../hooks/useFirebaseData'
import { mapFirebaseToLocal } from '../statusUtils'

/**
 * Custom hook for sites data management
 * @param {Object} options - Hook options
 * @param {boolean} options.enableFirebaseToggle - Whether to show Firebase toggle (default: true)
 * @returns {Object} Sites data and controls
 */
export const useSitesData = (options = {}) => {
  const { enableFirebaseToggle = true } = options
  const { sites: localSites, loading: localLoading, activePhase, phases, setActivePhase } = useData()

  const [useFirebase, setUseFirebase] = useState(() => {
    if (!enableFirebaseToggle) return false
    const saved = localStorage.getItem('tssr_use_firebase')
    return saved === 'true'
  })

  // Save Firebase toggle preference
  useEffect(() => {
    if (enableFirebaseToggle) {
      localStorage.setItem('tssr_use_firebase', useFirebase.toString())
    }
  }, [useFirebase, enableFirebaseToggle])

  // Firebase data hook
  const {
    sites: firebaseSites,
    loading: firebaseLoading,
    connected: firebaseConnected,
    updateSite: updateFirebaseSite,
    addSite: addFirebaseSite,
    lastUpdate: firebaseLastUpdate
  } = useFirebaseData({ phase: activePhase, enabled: useFirebase })

  // Map Firebase sites to local field names
  const sites = useMemo(() => {
    if (useFirebase && firebaseConnected) {
      return firebaseSites.map(mapFirebaseToLocal)
    }
    return localSites
  }, [useFirebase, firebaseConnected, firebaseSites, localSites])

  const loading = useFirebase ? firebaseLoading : localLoading

  // Get unique values for filters
  const uniqueStatuses = useMemo(() => {
    return [...new Set(sites.map(s => s.tssr_overall_status).filter(Boolean))]
  }, [sites])

  const uniquePriorities = useMemo(() => {
    return [...new Set(sites.map(s => s.priority).filter(p => p !== null && p !== undefined))].sort((a, b) => a - b)
  }, [sites])

  const uniqueContractors = useMemo(() => {
    return [...new Set(sites.map(s => s.tssr_subcon).filter(Boolean))].sort()
  }, [sites])

  const uniqueGovernorates = useMemo(() => {
    return [...new Set(sites.map(s => s.governorate).filter(Boolean))].sort()
  }, [sites])

  return {
    // Data
    sites,
    loading,
    phases,
    activePhase,
    setActivePhase,

    // Firebase controls
    useFirebase,
    setUseFirebase,
    firebaseConnected,
    firebaseLastUpdate,
    updateFirebaseSite,
    addFirebaseSite,
    firebaseSites,

    // Filter options
    uniqueStatuses,
    uniquePriorities,
    uniqueContractors,
    uniqueGovernorates
  }
}

export default useSitesData
