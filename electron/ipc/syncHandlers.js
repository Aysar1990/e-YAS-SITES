/**
 * Sync IPC handlers
 * Handles: manual-sync, get-sync-status, get-live-sync-status, toggle-live-sync
 * @module electron/ipc/syncHandlers
 */

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
}

module.exports = { registerSyncHandlers }
