/**
 * TSSR Monitor - Excel File Watcher Service
 *
 * Watches for changes to the TSSR Excel file and triggers data refresh
 * Uses chokidar for reliable file system watching
 *
 * @author TSSR Monitor Team
 * @version 2.0.0
 */

const chokidar = require('chokidar')
const fs = require('fs')
const path = require('path')

// Import the singleton instance correctly
const excelReader = require('./excelReader')

class ExcelWatcher {
  constructor(excelFilePath) {
    this.excelPath = excelFilePath
    this.watcher = null
    this.mainWindow = null
    this.isReading = false
    this.lastModified = 0
    this.lastChecksum = null
    this.debounceTimer = null
    this.DEBOUNCE_MS = 2000  // Wait 2 seconds after last change
  }

  /**
   * Start watching the Excel file
   * @param {BrowserWindow} mainWindow - Electron main window for IPC
   */
  start(mainWindow) {
    this.mainWindow = mainWindow

    console.log('🔍 Starting Excel Watcher:', this.excelPath)

    if (!fs.existsSync(this.excelPath)) {
      console.error('❌ Excel file not found:', this.excelPath)
      this.sendToFrontend('excel-watcher-error', {
        error: 'Excel file not found',
        path: this.excelPath
      })
      return false
    }

    // Configure chokidar with stability checks
    this.watcher = chokidar.watch(this.excelPath, {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 2000,  // Wait 2s for file to stabilize
        pollInterval: 100
      },
      usePolling: true,           // More reliable on Windows
      interval: 1000              // Poll every 1 second
    })

    // Handle file change event
    this.watcher.on('change', (filePath) => {
      this.onFileChange(filePath)
    })

    // Handle errors
    this.watcher.on('error', (error) => {
      console.error('❌ Watcher error:', error)
      this.sendToFrontend('excel-watcher-error', {
        error: error.message
      })
    })

    // Handle ready event
    this.watcher.on('ready', () => {
      console.log('✅ Excel Watcher started successfully')
      this.sendToFrontend('excel-watcher-ready', {
        path: this.excelPath,
        timestamp: new Date().toISOString()
      })
    })

    return true
  }

  /**
   * Handle file change event with debouncing
   * @param {string} filePath - Path to changed file
   */
  onFileChange(filePath) {
    // Clear any pending debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }

    // Debounce: wait for file to stabilize
    this.debounceTimer = setTimeout(async () => {
      await this.processFileChange(filePath)
    }, this.DEBOUNCE_MS)
  }

  /**
   * Process file change after debounce
   * @param {string} filePath - Path to changed file
   */
  async processFileChange(filePath) {
    if (this.isReading) {
      console.log('⏳ Already reading, skipping...')
      return
    }

    try {
      // Check if file was actually modified
      const stats = fs.statSync(filePath)
      const modified = stats.mtimeMs

      if (modified === this.lastModified) {
        console.log('ℹ️ No actual change detected, skipping...')
        return
      }

      this.lastModified = modified
      this.isReading = true

      console.log('📊 Excel file changed, triggering refresh...')

      // Notify frontend that refresh is starting
      this.sendToFrontend('excel-file-changed', {
        timestamp: new Date().toISOString(),
        path: filePath
      })

      // Wait a moment for Excel to finish writing
      await this.sleep(1000)

      // Refresh data
      await this.refreshData()

    } catch (error) {
      console.error('❌ Error processing file change:', error)
      this.sendToFrontend('sync-error', {
        error: error.message,
        timestamp: new Date().toISOString()
      })
    } finally {
      this.isReading = false
    }
  }

  /**
   * Refresh data from Excel file
   */
  async refreshData() {
    try {
      console.log('📖 Reading Excel file...')

      // Use the singleton excelReader correctly
      const data = excelReader.getAllData(this.excelPath)

      // Get read statistics
      const stats = excelReader.getLastReadStats()
      const errors = excelReader.getErrors()
      const warnings = excelReader.getWarnings()

      if (data.length === 0) {
        throw new Error('No data returned from Excel file')
      }

      // Check if data actually changed using checksum
      const newChecksum = stats?.checksum
      if (newChecksum && newChecksum === this.lastChecksum) {
        console.log('ℹ️ Data unchanged (same checksum), skipping update')
        this.sendToFrontend('data-unchanged', {
          timestamp: new Date().toISOString()
        })
        return
      }

      this.lastChecksum = newChecksum

      console.log(`✅ Read ${data.length} sites from Excel`)

      // Log any warnings
      if (warnings.length > 0) {
        console.warn('⚠️ Warnings during read:', warnings)
      }

      // Notify frontend of successful refresh
      this.sendToFrontend('data-refreshed', {
        rowCount: data.length,
        timestamp: new Date().toISOString(),
        success: true,
        stats: {
          totalRows: stats?.totalRawRows,
          validSites: stats?.totalValidSites,
          columns: stats?.totalColumns,
          parseTime: stats?.parseTimeMs,
          checksum: stats?.checksum
        },
        warnings: warnings.length > 0 ? warnings : undefined,
        errors: errors.length > 0 ? errors : undefined
      })

    } catch (error) {
      console.error('❌ Error reading Excel:', error)
      this.sendToFrontend('sync-error', {
        error: error.message,
        timestamp: new Date().toISOString()
      })
      throw error
    }
  }

  /**
   * Send message to frontend via IPC
   * @param {string} channel - IPC channel name
   * @param {Object} data - Data to send
   */
  sendToFrontend(channel, data) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      try {
        this.mainWindow.webContents.send(channel, data)
      } catch (error) {
        console.error('Failed to send to frontend:', error)
      }
    }
  }

  /**
   * Sleep helper
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Stop watching the Excel file
   */
  stop() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }

    if (this.watcher) {
      this.watcher.close()
      this.watcher = null
      console.log('🛑 Excel Watcher stopped')
    }
  }

  /**
   * Get current watcher status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      watching: !!this.watcher,
      path: this.excelPath,
      isReading: this.isReading,
      lastModified: this.lastModified ? new Date(this.lastModified).toISOString() : null,
      lastChecksum: this.lastChecksum
    }
  }
}

module.exports = ExcelWatcher
