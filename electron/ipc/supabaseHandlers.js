/**
 * Supabase IPC handlers
 * Handles: supabase:test-connection, supabase:get-info, supabase:sync
 * @module electron/ipc/supabaseHandlers
 */

const { ipcMain } = require('electron')
const supabaseSync = require('../services/supabaseSync')
const db = require('../database/db')

/**
 * Registers Supabase IPC handlers
 * @param {Electron.BrowserWindow} mainWindow - Main Electron window for sending progress updates
 */
function registerSupabaseHandlers(mainWindow) {
  /**
   * Test connection to Supabase
   * Returns: { success: boolean, data?: { message, latency }, error?: string }
   */
  ipcMain.handle('supabase:test-connection', async () => {
    try {
      const result = await supabaseSync.testConnection()

      if (result.success) {
        return {
          success: true,
          data: {
            message: result.message,
            latency: result.latency
          }
        }
      } else {
        return {
          success: false,
          error: result.message
        }
      }
    } catch (error) {
      console.error('❌ supabase:test-connection error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  })

  /**
   * Get sync information for a phase
   * Params: { phase: string }
   * Returns: { success: boolean, data?: { phase, localCount, remoteCount, isReady }, error?: string }
   */
  ipcMain.handle('supabase:get-info', async (event, { phase }) => {
    try {
      // Validate phase parameter
      if (!phase) {
        return {
          success: false,
          error: 'Phase parameter is required'
        }
      }

      // Get local count from SQLite sites table (Fixed: was sites_cache)
      let localCount = 0
      try {
        const database = db.getDB()
        const stmt = database.prepare('SELECT COUNT(*) as count FROM sites WHERE phase_name = ?')
        const result = await stmt.get(phase)
        localCount = result ? result.count : 0
      } catch (dbError) {
        console.warn('⚠️ Could not get local count:', dbError.message)
      }

      // Get remote count and sync stats from Supabase
      const syncStats = await supabaseSync.getSyncStats(phase)

      return {
        success: true,
        data: {
          phase,
          localCount,
          remoteCount: syncStats.remoteCount,
          isReady: supabaseSync.isReady(),
          syncNeeded: localCount !== syncStats.remoteCount
        }
      }
    } catch (error) {
      console.error('❌ supabase:get-info error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  })

  /**
   * Start sync process for a phase
   * Params: { phase: string }
   * Returns: { success: boolean, data?: { summary }, error?: string }
   *
   * Progress updates are sent via: mainWindow.webContents.send('supabase:progress', data)
   * Progress data format: { current: number, total: number, percentage: number, status: string }
   */
  ipcMain.handle('supabase:sync', async (event, { phase }) => {
    try {
      // Validate phase parameter
      if (!phase) {
        return {
          success: false,
          error: 'Phase parameter is required'
        }
      }

      // Check if Supabase is ready
      if (!supabaseSync.isReady()) {
        return {
          success: false,
          error: 'Supabase client not initialized. Check environment variables.'
        }
      }

      // Send initial progress
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('supabase:progress', {
          current: 0,
          total: 0,
          percentage: 0,
          status: 'starting'
        })
      }

      // Progress callback function
      const onProgress = (progress) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('supabase:progress', {
            current: progress.current,
            total: progress.total,
            percentage: progress.percentage,
            status: 'syncing'
          })
        }
      }

      // Start sync
      console.log(`📤 Starting Supabase sync for phase: ${phase}`)
      const summary = await supabaseSync.syncPhaseToSupabase(phase, onProgress)

      // Send completion progress
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('supabase:progress', {
          current: summary.total,
          total: summary.total,
          percentage: 100,
          status: summary.failed > 0 ? 'completed_with_errors' : 'completed'
        })
      }

      // Determine success based on results
      const hasErrors = summary.errors.length > 0 || summary.failed > 0

      return {
        success: !hasErrors,
        data: {
          summary: {
            total: summary.total,
            inserted: summary.inserted,
            updated: summary.updated,
            failed: summary.failed,
            errors: summary.errors.map(e => ({
              batch: e.batch,
              message: e.message,
              recordCount: e.recordCount
            }))
          }
        },
        error: hasErrors ? `${summary.failed} records failed to sync` : undefined
      }
    } catch (error) {
      console.error('❌ supabase:sync error:', error)

      // Send error progress
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('supabase:progress', {
          current: 0,
          total: 0,
          percentage: 0,
          status: 'error',
          error: error.message
        })
      }

      return {
        success: false,
        error: error.message
      }
    }
  })

  /**
   * Get all available phases from local database
   * Returns: { success: boolean, data?: { phases: Array<{name, count}> }, error?: string }
   */
  ipcMain.handle('supabase:get-phases', async () => {
    try {
      const database = db.getDB()
      // Fixed: Read from 'sites' table (was sites_cache)
      const stmt = database.prepare(`
        SELECT DISTINCT phase_name as name, COUNT(*) as count
        FROM sites
        WHERE phase_name IS NOT NULL AND phase_name != ''
        GROUP BY phase_name
        ORDER BY count DESC
      `)
      const phases = await stmt.all()

      return {
        success: true,
        data: {
          phases: phases || []
        }
      }
    } catch (error) {
      console.error('❌ supabase:get-phases error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  })

  /**
   * Cancel ongoing sync (if supported)
   * Note: Currently not implemented as batch processing doesn't support cancellation
   */
  ipcMain.handle('supabase:cancel-sync', async () => {
    return {
      success: false,
      error: 'Sync cancellation not supported in current implementation'
    }
  })

  /**
   * Direct import to Supabase (bypasses SQLite)
   * Params: { sites: Array<Object> }
   * Returns: { success: boolean, data?: { summary }, error?: string }
   */
  ipcMain.handle('supabase:direct-import', async (event, { sites }) => {
    try {
      if (!sites || !Array.isArray(sites)) {
        return {
          success: false,
          error: 'Sites array is required'
        }
      }

      if (!supabaseSync.isReady()) {
        return {
          success: false,
          error: 'Supabase client not initialized. Check SUPABASE_URL and SUPABASE_SERVICE_KEY.'
        }
      }

      // Send initial progress
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('supabase:progress', {
          current: 0,
          total: sites.length,
          percentage: 0,
          status: 'importing'
        })
      }

      // Progress callback
      const onProgress = (progress) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('supabase:progress', {
            current: progress.current,
            total: progress.total,
            percentage: progress.percentage,
            status: 'importing',
            batch: progress.batch,
            totalBatches: progress.totalBatches
          })
        }
      }

      // Execute direct import
      console.log(`📤 Starting direct Supabase import: ${sites.length} sites`)
      const result = await supabaseSync.importDirectToSupabase(sites, onProgress)

      // Send completion
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('supabase:progress', {
          current: result.total,
          total: result.total,
          percentage: 100,
          status: result.success ? 'completed' : 'completed_with_errors'
        })
      }

      return {
        success: result.success,
        data: {
          summary: {
            total: result.total,
            inserted: result.inserted,
            updated: result.updated,
            failed: result.failed,
            errors: result.errors
          }
        },
        error: result.success ? undefined : `${result.failed} records failed to import`
      }
    } catch (error) {
      console.error('❌ supabase:direct-import error:', error)

      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('supabase:progress', {
          current: 0,
          total: 0,
          percentage: 0,
          status: 'error',
          error: error.message
        })
      }

      return {
        success: false,
        error: error.message
      }
    }
  })

  /**
   * Import Excel file directly to Supabase
   * Params: { filePath: string } or { base64Data: string, fileName: string }
   * Returns: { success: boolean, data?: { summary }, error?: string }
   */
  ipcMain.handle('supabase:import-excel', async (event, params) => {
    try {
      const { filePath, base64Data, fileName } = params
      let excelPath = filePath

      // If base64 data provided, write to temp file
      if (base64Data) {
        const fs = require('fs')
        const path = require('path')
        const os = require('os')

        const tempDir = os.tmpdir()
        excelPath = path.join(tempDir, fileName || 'import.xlsx')

        const buffer = Buffer.from(base64Data, 'base64')
        fs.writeFileSync(excelPath, buffer)
      }

      if (!excelPath) {
        return {
          success: false,
          error: 'File path or base64 data is required'
        }
      }

      if (!supabaseSync.isReady()) {
        return {
          success: false,
          error: 'Supabase client not initialized. Check SUPABASE_URL and SUPABASE_SERVICE_KEY.'
        }
      }

      // Read Excel file
      const excelReader = require('../services/excelReader')
      console.log(`📖 Reading Excel file: ${excelPath}`)

      const sites = excelReader.getAllData(excelPath)

      if (!sites || sites.length === 0) {
        return {
          success: false,
          error: 'No data found in Excel file'
        }
      }

      console.log(`✅ Read ${sites.length} sites from Excel`)

      // Send initial progress
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('supabase:progress', {
          current: 0,
          total: sites.length,
          percentage: 0,
          status: 'importing'
        })
      }

      // Progress callback
      const onProgress = (progress) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('supabase:progress', {
            current: progress.current,
            total: progress.total,
            percentage: progress.percentage,
            status: 'importing'
          })
        }
      }

      // Transform sites to DB format
      const { transformSiteData } = require('../services/importProcessors/singleFileProcessor')
      const transformedSites = sites.map(site => transformSiteData(site))

      // Execute direct import
      const result = await supabaseSync.importDirectToSupabase(transformedSites, onProgress)

      // Send completion
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('supabase:progress', {
          current: result.total,
          total: result.total,
          percentage: 100,
          status: result.success ? 'completed' : 'completed_with_errors'
        })
      }

      return {
        success: result.success,
        data: {
          summary: {
            total: result.total,
            inserted: result.inserted,
            updated: result.updated,
            failed: result.failed,
            errors: result.errors
          }
        },
        error: result.success ? undefined : `${result.failed} records failed to import`
      }
    } catch (error) {
      console.error('❌ supabase:import-excel error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  })

  console.log('✅ Supabase IPC handlers registered')
}

module.exports = { registerSupabaseHandlers }
