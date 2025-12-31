/**
 * Settings IPC handlers
 * Handles: get-settings, update-settings, select-excel-file,
 *          get-database-type, set-database-type, test-database-connection,
 *          get-supabase-config, set-supabase-config
 * @module electron/ipc/settingsHandlers
 */

const { dialog } = require('electron')
const db = require('../database/db')

/**
 * Registers settings IPC handlers
 * @param {Electron.IpcMain} ipcMain - Electron IPC main instance
 * @param {Object} deps - Dependencies object
 * @param {Object} deps.settingsQueries - Settings queries module
 * @param {Object} deps.dataSync - Data sync service
 * @param {Function} deps.getMainWindow - Function to get main window
 * @param {Function} deps.getLiveSyncWatcher - Function to get live sync watcher
 * @param {Function} deps.initializeLiveSync - Function to initialize live sync
 * @param {Function} deps.setLiveSyncWatcher - Function to set live sync watcher
 */
function registerSettingsHandlers(ipcMain, deps) {
  const {
    settingsQueries,
    dataSync,
    getMainWindow,
    getLiveSyncWatcher,
    initializeLiveSync,
    setLiveSyncWatcher
  } = deps

  ipcMain.handle('get-settings', async () => {
    try {
      const settings = settingsQueries.getAllSettings()
      return {
        success: true,
        settings,
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      }
    }
  })

  ipcMain.handle('update-settings', async (event, settings) => {
    try {
      settingsQueries.setMultipleSettings(settings)

      if (settings.sync_interval) {
        dataSync.restart()
      }

      // Handle Live Sync toggle
      if (settings.live_sync_enabled !== undefined) {
        const liveSyncWatcher = getLiveSyncWatcher()
        if (settings.live_sync_enabled && !liveSyncWatcher) {
          initializeLiveSync()
        } else if (!settings.live_sync_enabled && liveSyncWatcher) {
          liveSyncWatcher.stop()
          setLiveSyncWatcher(null)
          console.log('⏹️ Live Sync disabled')
        }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      }
    }
  })

  ipcMain.handle('select-excel-file', async () => {
    try {
      const mainWindow = getMainWindow()
      const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Select TSSR Excel File',
        filters: [
          { name: 'Excel Files', extensions: ['xlsx', 'xlsm', 'xls'] },
        ],
        properties: ['openFile'],
      })

      if (!result.canceled && result.filePaths.length > 0) {
        return {
          success: true,
          filePath: result.filePaths[0],
        }
      }

      return { success: false, error: 'No file selected' }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      }
    }
  })

  // Database Configuration Handlers

  /**
   * Get current database type (sqlite or supabase)
   */
  ipcMain.handle('get-database-type', async () => {
    try {
      const type = db.getAdapterType()
      return {
        success: true,
        type: type || 'sqlite',
        message: `Current database: ${type || 'sqlite'}`
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        type: 'sqlite'
      }
    }
  })

  /**
   * Set database type (requires app restart)
   */
  ipcMain.handle('set-database-type', async (event, type) => {
    try {
      if (type !== 'sqlite' && type !== 'supabase') {
        return {
          success: false,
          message: 'Invalid database type. Must be "sqlite" or "supabase"'
        }
      }

      // Save to settings
      settingsQueries.setSetting('database_type', type)

      return {
        success: true,
        message: `Database type set to ${type}. Please restart the application.`
      }
    } catch (error) {
      return {
        success: false,
        message: error.message
      }
    }
  })

  /**
   * Test database connection
   */
  ipcMain.handle('test-database-connection', async (event, type, config) => {
    try {
      if (type === 'supabase') {
        if (!config || !config.url || !config.key) {
          return {
            success: false,
            message: 'Supabase URL and API key are required'
          }
        }

        // Test Supabase connection
        const { createClient } = require('@supabase/supabase-js')
        const supabase = createClient(config.url, config.key)

        // Try to query a count (lightweight test)
        const { error } = await supabase
          .from('sites_cache')
          .select('count', { count: 'exact', head: true })

        if (error) {
          return {
            success: false,
            message: `Connection failed: ${error.message}`
          }
        }

        return {
          success: true,
          message: 'Supabase connection successful!'
        }
      } else {
        // SQLite is always available (local file)
        return {
          success: true,
          message: 'SQLite database is available'
        }
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Connection test failed'
      }
    }
  })

  /**
   * Get Supabase configuration
   */
  ipcMain.handle('get-supabase-config', async () => {
    try {
      const url = settingsQueries.getSetting('supabase_url') || process.env.SUPABASE_URL || ''
      const key = settingsQueries.getSetting('supabase_key') || process.env.SUPABASE_ANON_KEY || ''

      return {
        success: true,
        config: { url, key }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        config: { url: '', key: '' }
      }
    }
  })

  /**
   * Set Supabase configuration
   */
  ipcMain.handle('set-supabase-config', async (event, url, key) => {
    try {
      if (!url || !key) {
        return {
          success: false,
          message: 'Supabase URL and API key are required'
        }
      }

      // Save to settings
      settingsQueries.setSetting('supabase_url', url)
      settingsQueries.setSetting('supabase_key', key)

      return {
        success: true,
        message: 'Supabase configuration saved successfully'
      }
    } catch (error) {
      return {
        success: false,
        message: error.message
      }
    }
  })
}

module.exports = { registerSettingsHandlers }
