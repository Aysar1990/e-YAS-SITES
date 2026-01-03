/**
 * Sync IPC handlers
 * Handles: manual-sync, get-sync-status, get-live-sync-status, toggle-live-sync
 * Connection status handlers for online/offline indicator
 * @module electron/ipc/syncHandlers
 */

const db = require('../database/db')
const {
  isNonEmptyString,
  isPositiveInteger,
  isPlainObject,
  isValidId,
  sanitizeString
} = require('../utils/validation')

/**
 * Registers sync IPC handlers
 * @param {Electron.IpcMain} ipcMain - Electron IPC main instance
 * @param {Object} deps - Dependencies object
 * @param {Object} deps.dataSync - Data sync service
 * @param {Object} deps.sitesQueries - Sites queries module
 * @param {Object} deps.settingsQueries - Settings queries module
 * @param {Function} deps.getLiveSyncWatcher - Function to get live sync watcher
 * @param {Function} deps.setLiveSyncWatcher - Function to set live sync watcher
 * @param {Function} deps.initializeLiveSync - Function to initialize live sync
 */
function registerSyncHandlers(ipcMain, deps) {
  const {
    dataSync,
    sitesQueries,
    settingsQueries,
    getLiveSyncWatcher,
    setLiveSyncWatcher,
    initializeLiveSync
  } = deps

  ipcMain.handle('manual-sync', async () => {
    try {
      const result = await dataSync.manualSync()
      return result
    } catch (error) {
      return {
        success: false,
        error: error.message,
      }
    }
  })

  ipcMain.handle('get-sync-status', async () => {
    try {
      const lastSync = sitesQueries.getLastSyncTime()
      const liveSyncWatcher = getLiveSyncWatcher()
      const liveSyncStatus = liveSyncWatcher ? liveSyncWatcher.getStatus() : null

      return {
        success: true,
        lastSync,
        liveSync: liveSyncStatus
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      }
    }
  })

  ipcMain.handle('get-live-sync-status', async () => {
    try {
      const liveSyncWatcher = getLiveSyncWatcher()
      if (!liveSyncWatcher) {
        return {
          success: true,
          enabled: false,
          status: null
        }
      }

      return {
        success: true,
        enabled: true,
        status: liveSyncWatcher.getStatus()
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      }
    }
  })

  ipcMain.handle('toggle-live-sync', async (event, { enabled }) => {
    try {
      // Input validation
      if (typeof enabled !== 'boolean') {
        return {
          success: false,
          error: 'Enabled must be a boolean value',
        }
      }

      settingsQueries.setSetting('live_sync_enabled', enabled ? '1' : '0')

      const liveSyncWatcher = getLiveSyncWatcher()
      if (enabled && !liveSyncWatcher) {
        initializeLiveSync()
      } else if (!enabled && liveSyncWatcher) {
        liveSyncWatcher.stop()
        setLiveSyncWatcher(null)
      }

      console.log(`[SYNC] Live sync ${enabled ? 'enabled' : 'disabled'}`)

      return { success: true, enabled }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      }
    }
  })

  // ============================================
  // Connection Status Handlers
  // ============================================

  /**
   * Get comprehensive connection status for UI indicator
   */
  ipcMain.handle('get-connection-status', async () => {
    try {
      return {
        success: true,
        ...db.getConnectionStatus()
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        isOnline: false,
        mode: 'unknown'
      }
    }
  })

  /**
   * Get sync queue items for display
   */
  ipcMain.handle('get-sync-queue-items', async () => {
    try {
      const items = db.getSyncQueueItems()
      const status = db.getSyncQueueStatus()
      return {
        success: true,
        items,
        status
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        items: [],
        status: { total: 0, pending: 0, failed: 0 }
      }
    }
  })

  /**
   * Force sync pending operations
   */
  ipcMain.handle('force-sync-queue', async () => {
    try {
      const result = await db.forceSync()
      return { success: true, ...result }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  })

  /**
   * Retry failed operations
   */
  ipcMain.handle('retry-failed-operations', async () => {
    try {
      const result = await db.retryFailedOperations()
      return { success: true, ...result }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  })

  /**
   * Clear sync queue
   */
  ipcMain.handle('clear-sync-queue', async () => {
    try {
      const result = db.clearSyncQueue()
      return { success: true, ...result }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  })

  /**
   * Force check online status
   */
  ipcMain.handle('check-online-status', async () => {
    try {
      const isOnline = await db.checkOnlineStatus()
      return {
        success: true,
        isOnline,
        mode: isOnline ? 'online' : 'offline'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        isOnline: false
      }
    }
  })

  /**
   * Set conflict resolution strategy
   */
  ipcMain.handle('set-conflict-strategy', async (event, { strategy }) => {
    try {
      // Input validation
      if (!strategy || !isNonEmptyString(strategy)) {
        return {
          success: false,
          error: 'Strategy is required and must be a non-empty string'
        }
      }

      // Validate strategy value
      const validStrategies = ['local', 'remote', 'manual', 'latest', 'oldest']
      const sanitizedStrategy = sanitizeString(strategy).toLowerCase()

      if (!validStrategies.includes(sanitizedStrategy)) {
        return {
          success: false,
          error: `Invalid strategy. Must be one of: ${validStrategies.join(', ')}`
        }
      }

      console.log(`[SYNC] Conflict strategy set to: ${sanitizedStrategy}`)

      const result = db.setConflictStrategy(sanitizedStrategy)
      return { success: true, ...result }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  })

  // ============================================
  // Conflict Resolution Handlers
  // ============================================

  /**
   * Get pending conflicts
   */
  ipcMain.handle('get-pending-conflicts', async () => {
    try {
      const conflicts = db.getPendingConflicts()
      const counts = db.getConflictCounts()
      return {
        success: true,
        conflicts,
        counts
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        conflicts: [],
        counts: { pending: 0, resolved: 0, total: 0 }
      }
    }
  })

  /**
   * Resolve a single conflict
   */
  ipcMain.handle('resolve-conflict', async (event, { conflictId, resolution, mergedData }) => {
    try {
      // Input validation
      if (!conflictId || !isValidId(conflictId)) {
        return {
          success: false,
          error: 'Valid conflict ID is required'
        }
      }

      if (!resolution || !isNonEmptyString(resolution)) {
        return {
          success: false,
          error: 'Resolution is required and must be a non-empty string'
        }
      }

      // Validate resolution value
      const validResolutions = ['local', 'remote', 'merged']
      const sanitizedResolution = sanitizeString(resolution).toLowerCase()

      if (!validResolutions.includes(sanitizedResolution)) {
        return {
          success: false,
          error: `Invalid resolution. Must be one of: ${validResolutions.join(', ')}`
        }
      }

      // Validate merged data if resolution is 'merged'
      if (sanitizedResolution === 'merged') {
        if (!mergedData || !isPlainObject(mergedData)) {
          return {
            success: false,
            error: 'Merged data must be a valid object when resolution is "merged"'
          }
        }
      }

      const sanitizedConflictId = typeof conflictId === 'string' ? sanitizeString(conflictId) : conflictId

      console.log(`[SYNC] Resolving conflict ${sanitizedConflictId} with: ${sanitizedResolution}`)

      const result = await db.resolveConflict(sanitizedConflictId, sanitizedResolution, mergedData)
      return result
    } catch (error) {
      console.error('[SYNC] Resolve conflict error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  })

  /**
   * Resolve all conflicts with a strategy
   */
  ipcMain.handle('resolve-all-conflicts', async (event, { strategy }) => {
    try {
      // Input validation
      if (!strategy || !isNonEmptyString(strategy)) {
        return {
          success: false,
          error: 'Strategy is required and must be a non-empty string'
        }
      }

      // Validate strategy value
      const validStrategies = ['local', 'remote', 'latest', 'oldest']
      const sanitizedStrategy = sanitizeString(strategy).toLowerCase()

      if (!validStrategies.includes(sanitizedStrategy)) {
        return {
          success: false,
          error: `Invalid strategy. Must be one of: ${validStrategies.join(', ')}`
        }
      }

      console.log(`[SYNC] Resolving all conflicts with: ${sanitizedStrategy}`)

      const result = await db.resolveAllConflicts(sanitizedStrategy)
      return result
    } catch (error) {
      console.error('[SYNC] Resolve all conflicts error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  })

  /**
   * Get conflict counts
   */
  ipcMain.handle('get-conflict-counts', async () => {
    try {
      const counts = db.getConflictCounts()
      return { success: true, ...counts }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        pending: 0,
        resolved: 0,
        total: 0
      }
    }
  })

  /**
   * Clear resolved conflicts
   */
  ipcMain.handle('clear-resolved-conflicts', async (event, { olderThanDays }) => {
    try {
      // Input validation
      let days = 7 // Default value

      if (olderThanDays !== undefined && olderThanDays !== null) {
        if (!isPositiveInteger(olderThanDays)) {
          return {
            success: false,
            error: 'olderThanDays must be a positive integer'
          }
        }

        if (olderThanDays < 1 || olderThanDays > 365) {
          return {
            success: false,
            error: 'olderThanDays must be between 1 and 365'
          }
        }

        days = olderThanDays
      }

      console.log(`[SYNC] Clearing resolved conflicts older than ${days} days`)

      const result = db.clearResolvedConflicts(days)
      return result
    } catch (error) {
      console.error('[SYNC] Clear resolved conflicts error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  })
}

module.exports = { registerSyncHandlers }
