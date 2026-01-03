/**
 * useDatabase Hook
 *
 * React hook for database operations with automatic online/offline handling.
 *
 * Features:
 *   - Automatic mode detection (online/offline)
 *   - Sync status tracking
 *   - Event subscriptions
 *   - Query helpers
 *
 * Usage:
 *   const { isOnline, syncStatus, query, forceSync } = useDatabase()
 *
 * @author TSSR Monitor Team
 * @version 2.0
 */

import { useState, useEffect, useCallback } from 'react'

// Get the database API from Electron
const getDbAPI = () => {
  if (typeof window !== 'undefined' && window.electron?.database) {
    return window.electron.database
  }
  // Fallback for development/testing
  return null
}

/**
 * Main database hook
 */
export function useDatabase() {
  const [isOnline, setIsOnline] = useState(true)
  const [mode, setMode] = useState('unknown')
  const [syncStatus, setSyncStatus] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const db = getDbAPI()

  // Initialize and set up event listeners
  useEffect(() => {
    if (!db) return

    // Get initial mode
    const initMode = async () => {
      try {
        const modeInfo = await db.getMode()
        setIsOnline(modeInfo.isOnline)
        setMode(modeInfo.mode)
      } catch (err) {
        console.error('Failed to get database mode:', err)
      }
    }

    initMode()

    // Subscribe to events
    const unsubOnline = db.onOnline(() => {
      setIsOnline(true)
      setMode('online')
    })

    const unsubOffline = db.onOffline(() => {
      setIsOnline(false)
      setMode('offline')
    })

    const unsubModeChanged = db.onModeChanged((data) => {
      setIsOnline(data.mode === 'online')
      setMode(data.mode)
    })

    const unsubSyncCompleted = db.onSyncCompleted((result) => {
      setSyncStatus(prev => ({
        ...prev,
        lastSync: new Date().toISOString(),
        lastResult: result
      }))
    })

    return () => {
      unsubOnline()
      unsubOffline()
      unsubModeChanged()
      unsubSyncCompleted()
    }
  }, [db])

  // Refresh sync status
  const refreshSyncStatus = useCallback(async () => {
    if (!db) return
    try {
      const status = await db.getSyncStatus()
      setSyncStatus(status)
    } catch (err) {
      console.error('Failed to get sync status:', err)
    }
  }, [db])

  // Force sync
  const forceSync = useCallback(async () => {
    if (!db) return { success: false, error: 'Database not available' }

    setIsLoading(true)
    setError(null)

    try {
      const result = await db.forceSync()
      await refreshSyncStatus()
      return result
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setIsLoading(false)
    }
  }, [db, refreshSyncStatus])

  // Full sync
  const fullSync = useCallback(async (options = {}) => {
    if (!db) return { success: false, error: 'Database not available' }

    setIsLoading(true)
    setError(null)

    try {
      const result = await db.fullSync(options)
      await refreshSyncStatus()
      return result
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setIsLoading(false)
    }
  }, [db, refreshSyncStatus])

  // Pull from cloud
  const pullFromCloud = useCallback(async () => {
    if (!db) return { success: false, error: 'Database not available' }

    setIsLoading(true)
    setError(null)

    try {
      const result = await db.pullFromCloud()
      await refreshSyncStatus()
      return result
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setIsLoading(false)
    }
  }, [db, refreshSyncStatus])

  // Push to cloud
  const pushToCloud = useCallback(async () => {
    if (!db) return { success: false, error: 'Database not available' }

    setIsLoading(true)
    setError(null)

    try {
      const result = await db.pushToCloud()
      await refreshSyncStatus()
      return result
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setIsLoading(false)
    }
  }, [db, refreshSyncStatus])

  // Query helper
  const query = useCallback(async (sql, params = []) => {
    if (!db) throw new Error('Database not available')

    const result = await db.query(sql, params)
    if (!result.success) {
      throw new Error(result.error)
    }
    return result.data
  }, [db])

  // Query one helper
  const queryOne = useCallback(async (sql, params = []) => {
    if (!db) throw new Error('Database not available')

    const result = await db.queryOne(sql, params)
    if (!result.success) {
      throw new Error(result.error)
    }
    return result.data
  }, [db])

  // Execute helper
  const execute = useCallback(async (sql, params = []) => {
    if (!db) throw new Error('Database not available')

    const result = await db.execute(sql, params)
    if (!result.success) {
      throw new Error(result.error)
    }
    return result.changes
  }, [db])

  // Execute with sync
  const executeWithSync = useCallback(async (operation) => {
    if (!db) throw new Error('Database not available')

    const result = await db.executeWithSync(operation)
    if (!result.success) {
      throw new Error(result.error)
    }
    return result
  }, [db])

  // Backup
  const backup = useCallback(async () => {
    if (!db) return { success: false, error: 'Database not available' }

    try {
      const result = await db.backup()
      return result
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [db])

  return {
    // Status
    isOnline,
    mode,
    syncStatus,
    isLoading,
    error,
    isAvailable: !!db,

    // Sync operations
    forceSync,
    fullSync,
    pullFromCloud,
    pushToCloud,
    refreshSyncStatus,

    // Data operations
    query,
    queryOne,
    execute,
    executeWithSync,

    // Backup
    backup
  }
}

/**
 * Hook for database sync status indicator
 */
export function useSyncIndicator() {
  const { isOnline, syncStatus, isLoading, refreshSyncStatus } = useDatabase()
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    const interval = setInterval(async () => {
      await refreshSyncStatus()
    }, 10000) // Update every 10 seconds

    return () => clearInterval(interval)
  }, [refreshSyncStatus])

  useEffect(() => {
    if (syncStatus) {
      setPendingCount(syncStatus.pendingCount || 0)
    }
  }, [syncStatus])

  return {
    isOnline,
    isSyncing: isLoading,
    pendingCount,
    lastSyncTime: syncStatus?.lastSyncTime,
    status: isOnline ? (pendingCount > 0 ? 'syncing' : 'synced') : 'offline'
  }
}

/**
 * Hook for conflict resolution UI
 */
export function useConflictResolver() {
  const [conflicts, setConflicts] = useState([])
  const db = getDbAPI()

  useEffect(() => {
    if (!db) return

    const unsubConflict = db.onConflict((data) => {
      setConflicts(prev => [...prev, data])
    })

    return () => unsubConflict()
  }, [db])

  const resolveConflict = useCallback((index, useRemote) => {
    const conflict = conflicts[index]
    if (conflict && conflict.resolve) {
      conflict.resolve(useRemote)
      setConflicts(prev => prev.filter((_, i) => i !== index))
    }
  }, [conflicts])

  const resolveAll = useCallback((useRemote) => {
    conflicts.forEach(conflict => {
      if (conflict.resolve) {
        conflict.resolve(useRemote)
      }
    })
    setConflicts([])
  }, [conflicts])

  return {
    conflicts,
    hasConflicts: conflicts.length > 0,
    resolveConflict,
    resolveAll
  }
}

export default useDatabase
