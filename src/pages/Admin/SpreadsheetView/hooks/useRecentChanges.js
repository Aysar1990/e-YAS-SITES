/**
 * useRecentChanges - Track recent cell changes for highlighting
 * Manages timestamps of cell edits to enable visual feedback
 */

import { useState, useCallback, useRef, useEffect } from 'react'

export const useRecentChanges = (autoCleanupMinutes = 10) => {
  // Format: { "siteId-field": timestamp }
  const [recentChanges, setRecentChanges] = useState({})
  const timeoutsRef = useRef({})

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(timeoutsRef.current).forEach(clearTimeout)
    }
  }, [])

  /**
   * Mark a cell as changed
   * @param {string} siteId - The site ID
   * @param {string} field - The field name that was changed
   */
  const markChanged = useCallback((siteId, field) => {
    if (!siteId || !field) return

    const key = `${siteId}-${field}`
    const now = Date.now()

    setRecentChanges(prev => ({
      ...prev,
      [key]: now
    }))

    // Clear any existing timeout for this key
    if (timeoutsRef.current[key]) {
      clearTimeout(timeoutsRef.current[key])
    }

    // Auto-remove after specified minutes
    timeoutsRef.current[key] = setTimeout(() => {
      setRecentChanges(prev => {
        const next = { ...prev }
        delete next[key]
        return next
      })
      delete timeoutsRef.current[key]
    }, autoCleanupMinutes * 60 * 1000)
  }, [autoCleanupMinutes])

  /**
   * Check if a cell was recently changed
   * @param {string} siteId - The site ID
   * @param {string} field - The field name
   * @param {number} minutes - Time threshold in minutes (default: 60)
   * @returns {boolean} - True if changed within the specified time
   */
  const isRecentlyChanged = useCallback((siteId, field, minutes = 60) => {
    if (!siteId || !field) return false

    const key = `${siteId}-${field}`
    const changeTime = recentChanges[key]

    if (!changeTime) return false

    const elapsed = Date.now() - changeTime
    return elapsed < minutes * 60 * 1000
  }, [recentChanges])

  /**
   * Get a human-readable age string for a change
   * @param {string} siteId - The site ID
   * @param {string} field - The field name
   * @returns {string|null} - Age string or null if not changed
   */
  const getChangeAge = useCallback((siteId, field) => {
    if (!siteId || !field) return null

    const key = `${siteId}-${field}`
    const changeTime = recentChanges[key]

    if (!changeTime) return null

    const minutes = Math.floor((Date.now() - changeTime) / 60000)

    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`

    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }, [recentChanges])

  /**
   * Clear all tracked changes
   */
  const clearAllChanges = useCallback(() => {
    Object.values(timeoutsRef.current).forEach(clearTimeout)
    timeoutsRef.current = {}
    setRecentChanges({})
  }, [])

  /**
   * Get the count of recent changes
   * @returns {number} - Number of tracked changes
   */
  const getChangeCount = useCallback(() => {
    return Object.keys(recentChanges).length
  }, [recentChanges])

  return {
    markChanged,
    isRecentlyChanged,
    getChangeAge,
    clearAllChanges,
    getChangeCount,
    recentChanges
  }
}

export default useRecentChanges
