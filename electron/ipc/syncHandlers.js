/**
 * Sync IPC handlers
 * Handles: manual-sync, get-sync-status, get-live-sync-status, toggle-live-sync
 * Connection status handlers for online/offline indicator
 * @module electron/ipc/syncHandlers
 */

const db = require('../database/db')

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
      settingsQueries.setSetting('live_sync_enabled', enabled ? '1' : '0')

      const liveSyncWatcher = getLiveSyncWatcher()
      if (enabled && !liveSyncWatcher) {
        initializeLiveSync()
      } else if (!enabled && liveSyncWatcher) {
        liveSyncWatcher.stop()
        setLiveSyncWatcher(null)
      }

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
      const result = db.setConflictStrategy(strategy)
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
      const result = await db.resolveConflict(conflictId, resolution, mergedData)
      return result
    } catch (error) {
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
      const result = await db.resolveAllConflicts(strategy)
      return result
    } catch (error) {
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
      const result = db.clearResolvedConflicts(olderThanDays || 7)
      return result
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  })
}

module.exports = { registerSyncHandlers }
