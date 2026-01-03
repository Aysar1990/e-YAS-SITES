/**
 * IPC Handlers for Database Operations
 *
 * Exposes database operations to the Electron renderer process
 * through IPC (Inter-Process Communication).
 *
 * Usage in main process:
 *   const { setupDatabaseIPC } = require('./database/ipcHandlers')
 *   setupDatabaseIPC(ipcMain)
 *
 * Usage in renderer:
 *   const result = await window.electron.database.getMode()
 *
 * @author TSSR Monitor Team
 * @version 2.0
 */

const dbManager = require('./db')
const syncManager = require('./syncManager')

/**
 * Setup all database IPC handlers
 * @param {Object} ipcMain - Electron ipcMain instance
 */
function setupDatabaseIPC(ipcMain) {
  // ============================================
  // Database Status & Mode
  // ============================================

  /**
   * Get current database mode (online/offline)
   */
  ipcMain.handle('db:getMode', async () => {
    return dbManager.getMode()
  })

  /**
   * Get database statistics
   */
  ipcMain.handle('db:getStats', async () => {
    return dbManager.getStats()
  })

  /**
   * Check if database is initialized
   */
  ipcMain.handle('db:isInitialized', async () => {
    return dbManager.isInitialized()
  })

  /**
   * Get adapter type
   */
  ipcMain.handle('db:getAdapterType', async () => {
    return dbManager.getAdapterType()
  })

  // ============================================
  // Sync Operations
  // ============================================

  /**
   * Get sync status
   */
  ipcMain.handle('db:getSyncStatus', async () => {
    return syncManager.getStatus()
  })

  /**
   * Force sync now
   */
  ipcMain.handle('db:forceSync', async () => {
    return dbManager.forceSync()
  })

  /**
   * Full bidirectional sync
   */
  ipcMain.handle('db:fullSync', async (event, options) => {
    return syncManager.fullSync(options)
  })

  /**
   * Pull from cloud to local
   */
  ipcMain.handle('db:pullFromCloud', async () => {
    return dbManager.fullSyncFromCloud()
  })

  /**
   * Push local to cloud
   */
  ipcMain.handle('db:pushToCloud', async () => {
    return dbManager.pushToCloud()
  })

  /**
   * Get pending sync items
   */
  ipcMain.handle('db:getPendingSync', async () => {
    return syncManager.getPendingItems()
  })

  /**
   * Clear sync queue
   */
  ipcMain.handle('db:clearSyncQueue', async () => {
    syncManager.clearQueue()
    return { success: true }
  })

  /**
   * Set conflict resolution strategy
   */
  ipcMain.handle('db:setConflictResolution', async (event, strategy) => {
    syncManager.setConflictResolution(strategy)
    return { success: true }
  })

  // ============================================
  // Data Operations
  // ============================================

  /**
   * Execute query (SELECT)
   */
  ipcMain.handle('db:query', async (event, { sql, params = [] }) => {
    try {
      const result = dbManager.prepare(sql).all(...params)
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  /**
   * Execute single query (SELECT one row)
   */
  ipcMain.handle('db:queryOne', async (event, { sql, params = [] }) => {
    try {
      const result = dbManager.prepare(sql).get(...params)
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  /**
   * Execute mutation (INSERT/UPDATE/DELETE) with sync
   */
  ipcMain.handle('db:execute', async (event, { sql, params = [] }) => {
    try {
      const result = dbManager.prepare(sql).run(...params)
      return { success: true, changes: result.changes }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  /**
   * Execute with sync (writes to both local and cloud)
   */
  ipcMain.handle('db:executeWithSync', async (event, operation) => {
    try {
      await dbManager.executeWithSync(operation)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // ============================================
  // Backup Operations
  // ============================================

  /**
   * Create backup
   */
  ipcMain.handle('db:backup', async () => {
    try {
      const backupPath = await dbManager.backup()
      return { success: true, path: backupPath }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // ============================================
  // Event Forwarding
  // ============================================

  // Forward database events to renderer
  const forwardEvent = (eventName) => {
    dbManager.on(eventName, (data) => {
      // Get all windows and send event
      const { BrowserWindow } = require('electron')
      BrowserWindow.getAllWindows().forEach(window => {
        window.webContents.send(`db:${eventName}`, data)
      })
    })
  }

  forwardEvent('online')
  forwardEvent('offline')
  forwardEvent('modeChanged')
  forwardEvent('syncComplete')
  forwardEvent('fullSyncComplete')
  forwardEvent('pushComplete')

  // Forward sync manager events
  syncManager.on('syncStarted', () => {
    const { BrowserWindow } = require('electron')
    BrowserWindow.getAllWindows().forEach(window => {
      window.webContents.send('db:syncStarted')
    })
  })

  syncManager.on('syncCompleted', (result) => {
    const { BrowserWindow } = require('electron')
    BrowserWindow.getAllWindows().forEach(window => {
      window.webContents.send('db:syncCompleted', result)
    })
  })

  syncManager.on('conflict', (data) => {
    const { BrowserWindow } = require('electron')
    BrowserWindow.getAllWindows().forEach(window => {
      window.webContents.send('db:conflict', data)
    })
  })

  console.log('✅ Database IPC handlers registered')
}

/**
 * Preload script exports for renderer
 * Add this to your preload.js:
 *
 * const { contextBridge, ipcRenderer } = require('electron')
 * contextBridge.exposeInMainWorld('electron', {
 *   database: getDatabaseAPI(ipcRenderer)
 * })
 */
function getDatabaseAPI(ipcRenderer) {
  return {
    // Status
    getMode: () => ipcRenderer.invoke('db:getMode'),
    getStats: () => ipcRenderer.invoke('db:getStats'),
    isInitialized: () => ipcRenderer.invoke('db:isInitialized'),
    getAdapterType: () => ipcRenderer.invoke('db:getAdapterType'),

    // Sync
    getSyncStatus: () => ipcRenderer.invoke('db:getSyncStatus'),
    forceSync: () => ipcRenderer.invoke('db:forceSync'),
    fullSync: (options) => ipcRenderer.invoke('db:fullSync', options),
    pullFromCloud: () => ipcRenderer.invoke('db:pullFromCloud'),
    pushToCloud: () => ipcRenderer.invoke('db:pushToCloud'),
    getPendingSync: () => ipcRenderer.invoke('db:getPendingSync'),
    clearSyncQueue: () => ipcRenderer.invoke('db:clearSyncQueue'),
    setConflictResolution: (strategy) => ipcRenderer.invoke('db:setConflictResolution', strategy),

    // Data
    query: (sql, params) => ipcRenderer.invoke('db:query', { sql, params }),
    queryOne: (sql, params) => ipcRenderer.invoke('db:queryOne', { sql, params }),
    execute: (sql, params) => ipcRenderer.invoke('db:execute', { sql, params }),
    executeWithSync: (operation) => ipcRenderer.invoke('db:executeWithSync', operation),

    // Backup
    backup: () => ipcRenderer.invoke('db:backup'),

    // Events
    onOnline: (callback) => {
      ipcRenderer.on('db:online', callback)
      return () => ipcRenderer.removeListener('db:online', callback)
    },
    onOffline: (callback) => {
      ipcRenderer.on('db:offline', callback)
      return () => ipcRenderer.removeListener('db:offline', callback)
    },
    onModeChanged: (callback) => {
      ipcRenderer.on('db:modeChanged', (event, data) => callback(data))
      return () => ipcRenderer.removeListener('db:modeChanged', callback)
    },
    onSyncStarted: (callback) => {
      ipcRenderer.on('db:syncStarted', callback)
      return () => ipcRenderer.removeListener('db:syncStarted', callback)
    },
    onSyncCompleted: (callback) => {
      ipcRenderer.on('db:syncCompleted', (event, data) => callback(data))
      return () => ipcRenderer.removeListener('db:syncCompleted', callback)
    },
    onConflict: (callback) => {
      ipcRenderer.on('db:conflict', (event, data) => callback(data))
      return () => ipcRenderer.removeListener('db:conflict', callback)
    }
  }
}

module.exports = {
  setupDatabaseIPC,
  getDatabaseAPI
}
