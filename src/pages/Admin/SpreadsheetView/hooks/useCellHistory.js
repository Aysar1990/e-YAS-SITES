/**
 * useCellHistory - Hook for tracking cell changes and audit trail
 * Stores change history in localStorage with FIFO limit
 */

import { useState, useCallback, useEffect } from 'react'

const HISTORY_STORAGE_KEY = 'spreadsheet_cell_history'
const MAX_HISTORY_ENTRIES = 1000

/**
 * Load history from localStorage
 */
const loadHistoryFromStorage = () => {
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Validate structure
      if (Array.isArray(parsed)) {
        return parsed.filter(entry =>
          entry && entry.id && entry.siteId && entry.field && entry.timestamp
        )
      }
    }
    return []
  } catch (error) {
    console.error('Failed to load cell history:', error)
    return []
  }
}

export const useCellHistory = () => {
  const [history, setHistory] = useState(() => loadHistoryFromStorage())

  /**
   * Save history to localStorage
   */
  const saveToStorage = useCallback((newHistory) => {
    try {
      const toSave = newHistory.slice(0, MAX_HISTORY_ENTRIES)
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(toSave))
    } catch (error) {
      console.error('Failed to save cell history:', error)
      // If localStorage is full, try clearing old entries
      if (error.name === 'QuotaExceededError') {
        try {
          const reduced = newHistory.slice(0, Math.floor(MAX_HISTORY_ENTRIES / 2))
          localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(reduced))
        } catch {
          console.error('Could not save even reduced history')
        }
      }
    }
  }, [])

  /**
   * Add a new history entry
   * @param {string} siteId - The site ID
   * @param {string} field - The field name that was changed
   * @param {any} oldValue - The previous value
   * @param {any} newValue - The new value
   * @param {string} user - User who made the change
   * @returns {Object} - The created history entry
   */
  const addHistoryEntry = useCallback((siteId, field, oldValue, newValue, user = 'Current User') => {
    // Don't record if values are the same
    if (oldValue === newValue) return null

    const entry = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      siteId: String(siteId),
      field: String(field),
      oldValue: oldValue ?? null,
      newValue: newValue ?? null,
      user: String(user),
      timestamp: new Date().toISOString()
    }

    setHistory(prev => {
      // Add to front, limit to max entries
      const updated = [entry, ...prev].slice(0, MAX_HISTORY_ENTRIES)
      saveToStorage(updated)
      return updated
    })

    return entry
  }, [saveToStorage])

  /**
   * Get history for a specific cell
   * @param {string} siteId - The site ID
   * @param {string} field - The field name
   * @returns {Array} - Sorted history entries (newest first)
   */
  const getCellHistory = useCallback((siteId, field) => {
    if (!siteId || !field) return []

    return history
      .filter(h => h.siteId === String(siteId) && h.field === String(field))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }, [history])

  /**
   * Get all history for a site
   * @param {string} siteId - The site ID
   * @returns {Array} - Sorted history entries (newest first)
   */
  const getSiteHistory = useCallback((siteId) => {
    if (!siteId) return []

    return history
      .filter(h => h.siteId === String(siteId))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }, [history])

  /**
   * Get recent history across all cells
   * @param {number} limit - Max entries to return
   * @returns {Array} - Sorted history entries (newest first)
   */
  const getRecentHistory = useCallback((limit = 50) => {
    return history
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit)
  }, [history])

  /**
   * Get revert configuration for a history entry
   * @param {string} entryId - The history entry ID
   * @returns {Object|null} - Revert config with siteId, field, and value
   */
  const revertChange = useCallback((entryId) => {
    const entry = history.find(h => h.id === entryId)
    if (!entry) return null

    return {
      siteId: entry.siteId,
      field: entry.field,
      value: entry.oldValue
    }
  }, [history])

  /**
   * Get a specific history entry by ID
   * @param {string} entryId - The entry ID
   * @returns {Object|null} - The history entry or null
   */
  const getEntryById = useCallback((entryId) => {
    return history.find(h => h.id === entryId) || null
  }, [history])

  /**
   * Clear all history
   */
  const clearHistory = useCallback(() => {
    setHistory([])
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY)
    } catch (error) {
      console.error('Failed to clear history from storage:', error)
    }
  }, [])

  /**
   * Get history statistics
   */
  const getHistoryStats = useCallback(() => {
    const uniqueSites = new Set(history.map(h => h.siteId)).size
    const uniqueFields = new Set(history.map(h => h.field)).size

    return {
      totalEntries: history.length,
      maxEntries: MAX_HISTORY_ENTRIES,
      uniqueSites,
      uniqueFields,
      oldestEntry: history.length > 0
        ? history[history.length - 1].timestamp
        : null,
      newestEntry: history.length > 0
        ? history[0].timestamp
        : null
    }
  }, [history])

  /**
   * Check if history has entries for a specific cell
   * @param {string} siteId - The site ID
   * @param {string} field - The field name
   * @returns {boolean}
   */
  const hasCellHistory = useCallback((siteId, field) => {
    return history.some(
      h => h.siteId === String(siteId) && h.field === String(field)
    )
  }, [history])

  return {
    history,
    addHistoryEntry,
    getCellHistory,
    getSiteHistory,
    getRecentHistory,
    revertChange,
    getEntryById,
    clearHistory,
    getHistoryStats,
    hasCellHistory
  }
}

export default useCellHistory
