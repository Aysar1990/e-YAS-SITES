/**
 * Unified Data IPC Handlers
 * 
 * Handles smart data operations with automatic online/offline switching
 * 
 * Endpoints:
 * - unified:get-data - Get sites from best available source
 * - unified:import - Import Excel to SQLite + Supabase
 * - unified:sync - Sync SQLite to Supabase
 * - unified:status - Get data source status
 * - unified:update-site - Update site in both databases
 */

const unifiedDataService = require('../services/unifiedDataService')
const { transformSiteData } = require('../services/importProcessors/singleFileProcessor')
const excelReader = require('../services/excelReader')
const path = require('path')
const fs = require('fs')

function registerUnifiedHandlers(ipcMain, deps) {
  const { getMainWindow, logAction } = deps

  /**
   * Get data from best available source (Supabase if online, SQLite if offline)
   */
  ipcMain.handle('unified:get-data', async (event, { phase, forceSource }) => {
    try {
      console.log(`📥 unified:get-data: phase=${phase}, forceSource=${forceSource}`)

      let result

      if (forceSource === 'sqlite') {
        // Force SQLite
        const sitesQueries = require('../database/queries/sites')
        const sites = sitesQueries.getAllSites(phase)
        result = { success: true, sites, source: 'sqlite_forced' }
      } else if (forceSource === 'supabase') {
        // Force Supabase
        const sites = await unifiedDataService.getFromSupabase(phase)
        result = { success: true, sites, source: 'supabase_forced' }
      } else {
        // Auto-select best source
        result = await unifiedDataService.getAllSites(phase)
      }

      console.log(`📤 Returning ${result.sites?.length || 0} sites from ${result.source}`)

      return result

    } catch (error) {
      console.error('❌ unified:get-data error:', error)
      return { success: false, error: error.message, sites: [] }
    }
  })

  /**
   * Import Excel file to BOTH SQLite and Supabase
   */
  ipcMain.handle('unified:import', async (event, { filePath, base64Data, fileName }) => {
    const importId = `unified_${Date.now()}`
    let tempFilePath = null

    try {
      console.log(`📥 unified:import started`)
      const mainWindow = getMainWindow()

      // Handle base64 data (from frontend upload)
      let excelPath = filePath
      if (base64Data) {
        const os = require('os')
        const tempDir = path.join(os.tmpdir(), 'tssr-imports')
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true })
        }
        tempFilePath = path.join(tempDir, fileName || 'import.xlsx')
        const buffer = Buffer.from(base64Data, 'base64')
        fs.writeFileSync(tempFilePath, buffer)
        excelPath = tempFilePath
      }

      if (!excelPath || !fs.existsSync(excelPath)) {
        return { success: false, error: 'File not found' }
      }

      // Send progress: Reading Excel
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('unified:progress', {
          importId,
          stage: 'reading',
          percentage: 5,
          message: 'Reading Excel file...'
        })
      }

      // Read Excel file
      console.log(`📖 Reading Excel: ${path.basename(excelPath)}`)
      const rawSites = excelReader.getAllData(excelPath)
      const stats = excelReader.getLastReadStats()

      if (!rawSites || rawSites.length === 0) {
        return { success: false, error: 'No data found in Excel file' }
      }

      console.log(`✅ Read ${rawSites.length} sites from Excel`)

      // Send progress: Transforming
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('unified:progress', {
          importId,
          stage: 'transforming',
          percentage: 10,
          message: `Transforming ${rawSites.length} records...`
        })
      }

      // Transform to DB format
      const sites = rawSites.map(site => transformSiteData(site))
      console.log(`✅ Transformed ${sites.length} sites`)

      // Import to BOTH databases
      const result = await unifiedDataService.importToBoth(sites, (progress) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('unified:progress', {
            importId,
            stage: progress.stage,
            percentage: 10 + Math.round(progress.percentage * 0.9),
            message: progress.stage === 'sqlite' 
              ? `Saving to local database... ${progress.current}/${progress.total}`
              : `Syncing to cloud... ${progress.current}/${progress.total}`,
            current: progress.current,
            total: progress.total
          })
        }
      })

      // Send completion
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('unified:progress', {
          importId,
          stage: 'complete',
          percentage: 100,
          message: 'Import complete!'
        })
      }

      // Log action
      if (logAction) {
        logAction('UNIFIED_IMPORT', {
          fileName: path.basename(excelPath),
          total: result.total,
          sqlite: result.sqlite,
          supabase: result.supabase
        })
      }

      // Cleanup temp file
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath)
      }

      console.log(`✅ Unified import complete:`)
      console.log(`   SQLite: ${result.sqlite.inserted} inserted, ${result.sqlite.updated} updated`)
      console.log(`   Supabase: ${result.supabase.inserted} inserted, ${result.supabase.updated} updated`)

      return {
        success: result.success,
        importId,
        result: {
          total: result.total,
          sqlite: result.sqlite,
          supabase: result.supabase,
          errors: result.errors
        }
      }

    } catch (error) {
      console.error('❌ unified:import error:', error)

      // Cleanup temp file on error
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try { fs.unlinkSync(tempFilePath) } catch (e) {}
      }

      return { success: false, importId, error: error.message }
    }
  })

  /**
   * Sync SQLite to Supabase
   */
  ipcMain.handle('unified:sync', async (event, { phase }) => {
    try {
      console.log(`📤 unified:sync: phase=${phase}`)
      const mainWindow = getMainWindow()

      const result = await unifiedDataService.syncToSupabase(phase, (progress) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('unified:progress', {
            stage: 'syncing',
            percentage: progress.percentage,
            current: progress.current,
            total: progress.total
          })
        }
      })

      if (logAction) {
        logAction('UNIFIED_SYNC', {
          phase,
          synced: result.synced,
          failed: result.failed
        })
      }

      return result

    } catch (error) {
      console.error('❌ unified:sync error:', error)
      return { success: false, error: error.message }
    }
  })

  /**
   * Get data source status
   */
  ipcMain.handle('unified:status', async () => {
    try {
      const status = await unifiedDataService.getDataSourceInfo()
      return { success: true, ...status }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  /**
   * Update site in both databases
   */
  ipcMain.handle('unified:update-site', async (event, { siteId, phaseName, updates, username }) => {
    try {
      console.log(`📝 unified:update-site: ${siteId}`)

      const result = await unifiedDataService.updateSite(siteId, phaseName, {
        ...updates,
        updated_by: username || 'system',
        updated_at: new Date().toISOString()
      })

      if (logAction && result.success) {
        logAction('SITE_UPDATE', {
          siteId,
          phaseName,
          fields: Object.keys(updates),
          sqlite: result.sqlite.success,
          supabase: result.supabase.success
        })
      }

      return result

    } catch (error) {
      console.error('❌ unified:update-site error:', error)
      return { success: false, error: error.message }
    }
  })

  /**
   * Force check online status
   */
  ipcMain.handle('unified:check-online', async () => {
    try {
      const online = await unifiedDataService.forceCheckOnline()
      return { success: true, online }
    } catch (error) {
      return { success: false, online: false, error: error.message }
    }
  })

  console.log('✅ Unified Data IPC handlers registered')
}

module.exports = { registerUnifiedHandlers }
