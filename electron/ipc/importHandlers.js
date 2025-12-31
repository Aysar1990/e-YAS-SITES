/**
 * Import IPC Handlers - Day 6 Step 3
 * Handles: batch-import, batch-import-files, validate-excel, get-import-status
 * @module electron/ipc/importHandlers
 */

const path = require('path')
const fs = require('fs')
const { dialog } = require('electron')
const { BatchProcessor, processMultipleFiles, quickImport } = require('../services/batchProcessor')
const { validateRecord, createImportResult, IMPORT_STATUS } = require('../services/importTypes')
const excelReader = require('../services/excelReader')
const {
  validateFile,
  parseFile,
  processSingleFile
} = require('../services/importProcessors/singleFileProcessor')

// Store active import jobs
const activeImports = new Map()

/**
 * Registers import-related IPC handlers
 * @param {Electron.IpcMain} ipcMain - Electron IPC main instance
 * @param {Object} deps - Dependencies object
 * @param {Object} deps.db - Database instance
 * @param {Object} deps.getMainWindow - Function to get main window
 * @param {Function} deps.logAction - Audit logging function
 */
function registerImportHandlers(ipcMain, deps) {
  const { db, getMainWindow, logAction } = deps

  /**
   * Import single Excel file
   * @param {string} filePath - Path to Excel file
   * @param {Object} options - Import options
   */
  ipcMain.handle('batch-import', async (event, { filePath, options = {} }) => {
    const importId = `import_${Date.now()}`

    try {
      console.log(`📥 Starting batch import: ${filePath}`)

      // Validate file exists
      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          error: `File not found: ${filePath}`
        }
      }

      // Create processor
      const processor = new BatchProcessor(db, {
        batchSize: options.batchSize || 500,
        validateBeforeInsert: options.validate !== false
      })

      // Store active import
      activeImports.set(importId, {
        processor,
        status: IMPORT_STATUS.PROCESSING,
        startTime: new Date().toISOString()
      })

      // Progress callback
      const onProgress = (progress) => {
        const mainWindow = getMainWindow()
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('import-progress', {
            importId,
            ...progress
          })
        }
      }

      // Process file
      const result = await processor.processFile(filePath, onProgress)

      // Update status
      activeImports.set(importId, {
        ...activeImports.get(importId),
        status: result.status,
        result
      })

      // Log action
      if (logAction) {
        logAction('BATCH_IMPORT', {
          filePath: path.basename(filePath),
          totalRecords: result.totalRecords,
          inserted: result.inserted,
          failed: result.failed,
          status: result.status
        })
      }

      console.log(`✅ Batch import complete: ${result.inserted} inserted, ${result.failed} failed`)

      return {
        success: true,
        importId,
        result
      }
    } catch (error) {
      console.error('❌ Batch import error:', error)

      activeImports.set(importId, {
        status: IMPORT_STATUS.FAILED,
        error: error.message
      })

      return {
        success: false,
        importId,
        error: error.message
      }
    }
  })

  /**
   * Import multiple Excel files
   * @param {Array<string>} filePaths - Array of file paths
   * @param {Object} options - Import options
   */
  ipcMain.handle('batch-import-files', async (event, { filePaths, options = {} }) => {
    const importId = `multi_import_${Date.now()}`

    try {
      console.log(`📥 Starting multi-file import: ${filePaths.length} files`)

      // Validate all files exist
      const missingFiles = filePaths.filter(f => !fs.existsSync(f))
      if (missingFiles.length > 0) {
        return {
          success: false,
          error: `Files not found: ${missingFiles.join(', ')}`
        }
      }

      // Progress callback
      const onProgress = (progress) => {
        const mainWindow = getMainWindow()
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('import-progress', {
            importId,
            ...progress
          })
        }
      }

      // Process files
      const result = await processMultipleFiles(db, filePaths, onProgress, {
        batchSize: options.batchSize || 500
      })

      // Log action
      if (logAction) {
        logAction('BATCH_IMPORT_MULTI', {
          fileCount: filePaths.length,
          totalRecords: result.totalRecords,
          inserted: result.inserted,
          failed: result.failed
        })
      }

      console.log(`✅ Multi-file import complete: ${result.inserted} total inserted`)

      return {
        success: true,
        importId,
        result
      }
    } catch (error) {
      console.error('❌ Multi-file import error:', error)
      return {
        success: false,
        importId,
        error: error.message
      }
    }
  })

  /**
   * Validate Excel file without importing
   * @param {string} filePath - Path to Excel file
   */
  ipcMain.handle('validate-excel', async (event, { filePath }) => {
    try {
      console.log(`🔍 Validating Excel file: ${filePath}`)

      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          error: `File not found: ${filePath}`
        }
      }

      // Read and parse file
      const sites = excelReader.getAllData(filePath)
      const stats = excelReader.getLastReadStats()
      const errors = excelReader.getErrors()
      const warnings = excelReader.getWarnings()

      // Validate records
      let validCount = 0
      let invalidCount = 0
      const validationErrors = []

      for (const site of sites.slice(0, 100)) { // Check first 100
        const record = {
          site_id: site.siteId,
          phase_name: site.phaseName
        }
        const validation = validateRecord(record)
        if (validation.valid) {
          validCount++
        } else {
          invalidCount++
          if (validationErrors.length < 10) {
            validationErrors.push({
              siteId: site.siteId,
              errors: validation.errors
            })
          }
        }
      }

      return {
        success: true,
        validation: {
          totalRecords: sites.length,
          sampleValid: validCount,
          sampleInvalid: invalidCount,
          validationErrors,
          stats,
          errors,
          warnings
        }
      }
    } catch (error) {
      console.error('❌ Validation error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  })

  /**
   * Get import status
   * @param {string} importId - Import job ID
   */
  ipcMain.handle('get-import-status', async (event, { importId }) => {
    const importJob = activeImports.get(importId)

    if (!importJob) {
      return {
        success: false,
        error: 'Import job not found'
      }
    }

    return {
      success: true,
      status: importJob.status,
      result: importJob.result || null
    }
  })

  /**
   * Cancel active import
   * @param {string} importId - Import job ID
   */
  ipcMain.handle('cancel-import', async (event, { importId }) => {
    const importJob = activeImports.get(importId)

    if (!importJob) {
      return {
        success: false,
        error: 'Import job not found'
      }
    }

    if (importJob.processor) {
      importJob.processor.abort()
    }

    activeImports.set(importId, {
      ...importJob,
      status: 'CANCELLED'
    })

    return {
      success: true,
      message: 'Import cancelled'
    }
  })

  /**
   * Preview Excel file (first N rows)
   * @param {string} filePath - Path to Excel file
   * @param {number} limit - Number of rows to preview
   */
  ipcMain.handle('preview-excel', async (event, { filePath, limit = 10 }) => {
    try {
      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          error: `File not found: ${filePath}`
        }
      }

      const sites = excelReader.getAllData(filePath)
      const stats = excelReader.getLastReadStats()

      return {
        success: true,
        preview: sites.slice(0, limit),
        totalRecords: sites.length,
        stats
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  })

  /**
   * DAY 9: Validate batch of files for import
   * @param {Array<string>} filePaths - Array of file paths to validate
   */
  ipcMain.handle('validate-batch', async (event, filePaths) => {
    try {
      console.log(`🔍 Validating batch: ${filePaths.length} files`)

      const results = []
      let validCount = 0
      let invalidCount = 0

      for (const filePath of filePaths) {
        const validation = validateFile(filePath)

        if (validation.valid) {
          validCount++
        } else {
          invalidCount++
        }

        results.push({
          filePath,
          fileName: path.basename(filePath),
          valid: validation.valid,
          errors: validation.errors,
          warnings: validation.warnings,
          fileInfo: validation.fileInfo
        })
      }

      return {
        success: true,
        valid: invalidCount === 0,
        fileCount: filePaths.length,
        validCount,
        invalidCount,
        results
      }
    } catch (error) {
      console.error('❌ Batch validation error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  })

  /**
   * DAY 9: Import batch of Excel files
   * Uses BatchProcessor with proper transaction handling for better performance
   * @param {Array<string>} filePaths - Array of file paths to import
   */
  ipcMain.handle('import-batch', async (event, filePaths) => {
    const importId = `batch_${Date.now()}`

    try {
      console.log(`📥 Starting batch import: ${filePaths.length} files`)

      const mainWindow = getMainWindow()

      // Store active import for tracking
      activeImports.set(importId, {
        status: IMPORT_STATUS.PROCESSING,
        startTime: new Date().toISOString(),
        fileCount: filePaths.length
      })

      // Progress callback for BatchProcessor
      const onProgress = (progress) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('import-progress', {
            importId,
            stage: 'processing',
            ...progress
          })
        }
      }

      // Use processMultipleFiles which wraps BatchProcessor with transactions
      const result = await processMultipleFiles(db, filePaths, onProgress, {
        batchSize: 500,
        validateBeforeInsert: true
      })

      // ✅ CRITICAL: Force save database after import
      if (db && typeof db.save === 'function') {
        db.save()
        console.log('💾 Database saved after batch import (import handler)')
      }

      // Update active import status
      activeImports.set(importId, {
        ...activeImports.get(importId),
        status: result.status,
        result
      })

      // Send completion event
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('import-progress', {
          importId,
          stage: 'complete',
          percentage: 100,
          totalRecords: result.totalRecords,
          inserted: result.inserted,
          failed: result.failed
        })
      }

      // Log action
      if (logAction) {
        logAction('BATCH_IMPORT', {
          fileCount: filePaths.length,
          totalRecords: result.totalRecords,
          inserted: result.inserted,
          updated: result.updated,
          failed: result.failed
        })
      }

      console.log(`✅ Batch import complete: ${result.inserted} inserted, ${result.failed} failed`)

      return {
        success: true,
        importId,
        fileCount: filePaths.length,
        totalRecords: result.totalRecords,
        inserted: result.inserted,
        updated: result.updated,
        failed: result.failed,
        results: result.files
      }
    } catch (error) {
      console.error('❌ Batch import error:', error)

      activeImports.set(importId, {
        status: IMPORT_STATUS.FAILED,
        error: error.message
      })

      return {
        success: false,
        importId,
        error: error.message
      }
    }
  })

  /**
   * DAY 9: Validate single file for import
   * @param {string} filePath - Path to Excel file
   */
  ipcMain.handle('validate-single', async (event, filePath) => {
    try {
      console.log(`🔍 Validating single file: ${path.basename(filePath)}`)

      const validation = validateFile(filePath)

      if (!validation.valid) {
        return {
          success: true,
          valid: false,
          errors: validation.errors,
          warnings: validation.warnings
        }
      }

      // Parse file to get additional info
      const parseResult = parseFile(filePath)

      return {
        success: true,
        valid: parseResult.success,
        fileInfo: {
          ...validation.fileInfo,
          totalRecords: parseResult.sites?.length || 0,
          sheets: parseResult.stats?.sheetsFound || 0
        },
        errors: [...validation.errors, ...parseResult.errors],
        warnings: [...validation.warnings, ...parseResult.warnings]
      }
    } catch (error) {
      console.error('❌ Single file validation error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  })

  /**
   * Select Excel file for import using native dialog
   * @returns {Object} Object with success status and selected file path
   */
  ipcMain.handle('select-import-files', async () => {
    try {
      const mainWindow = getMainWindow()
      const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Select Excel File to Import',
        filters: [
          { name: 'Excel Files', extensions: ['xlsx', 'xlsm'] }
        ],
        properties: ['openFile']
      })

      if (result.canceled || result.filePaths.length === 0) {
        return {
          success: false,
          error: 'No files selected'
        }
      }

      // Return file info with paths
      const files = result.filePaths.map(filePath => {
        const stats = fs.statSync(filePath)
        return {
          path: filePath,
          name: path.basename(filePath),
          size: stats.size
        }
      })

      return {
        success: true,
        files,
        filePaths: result.filePaths
      }
    } catch (error) {
      console.error('❌ Error selecting import files:', error)
      return {
        success: false,
        error: error.message
      }
    }
  })

  /**
   * DAY 9: Import single Excel file
   * @param {string} filePath - Path to Excel file
   */
  ipcMain.handle('import-single', async (event, filePath) => {
    const importId = `single_${Date.now()}`

    try {
      console.log(`📥 Importing single file: ${path.basename(filePath)}`)

      const mainWindow = getMainWindow()

      // Send progress: validating
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('import-progress', {
          importId,
          stage: 'validating',
          percentage: 10
        })
      }

      // Validate first
      const validation = validateFile(filePath)
      if (!validation.valid) {
        return {
          success: false,
          error: validation.errors[0]?.message || 'File validation failed',
          errors: validation.errors
        }
      }

      // Send progress: parsing
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('import-progress', {
          importId,
          stage: 'parsing',
          percentage: 30
        })
      }

      // Send progress: processing
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('import-progress', {
          importId,
          stage: 'processing',
          percentage: 50
        })
      }

      // Process file
      const result = processSingleFile(filePath, db, {
        wsServer: null,
        broadcastUpdates: false,
        dryRun: false
      })

      // ✅ CRITICAL: Force save database after single file import
      if (db && typeof db.save === 'function') {
        db.save()
        console.log('💾 Database saved after single file import')
      }

      // Send progress: complete
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('import-progress', {
          importId,
          stage: 'complete',
          percentage: 100
        })
      }

      // Log action
      if (logAction) {
        logAction('SINGLE_FILE_IMPORT', {
          fileName: path.basename(filePath),
          totalRecords: result.totalRecords,
          inserted: result.inserted,
          updated: result.updated,
          failed: result.failed,
          status: result.status
        })
      }

      console.log(`✅ Single file import complete: ${result.inserted} inserted, ${result.updated} updated, ${result.failed} failed`)

      return {
        success: result.status !== IMPORT_STATUS.FAILED,
        importId,
        result: {
          totalRecords: result.totalRecords,
          inserted: result.inserted,
          updated: result.updated,
          failed: result.failed,
          errors: result.errors,
          warnings: result.warnings,
          status: result.status
        }
      }
    } catch (error) {
      console.error('❌ Single file import error:', error)
      return {
        success: false,
        importId,
        error: error.message
      }
    }
  })

  /**
   * Import Excel file from base64 data (for Frontend Import Page)
   * @param {string} fileName - Original file name
   * @param {string} base64Data - Base64 encoded file data
   */
  ipcMain.handle('import-excel-from-base64', async (event, { fileName, base64Data }) => {
    const importId = `web_import_${Date.now()}`
    let tempFilePath = null

    try {
      console.log(`📥 Importing from frontend: ${fileName}`)

      const mainWindow = getMainWindow()

      // Decode base64 to buffer
      const buffer = Buffer.from(base64Data, 'base64')

      // Create temp file
      const tempDir = path.join(require('os').tmpdir(), 'tssr-imports')
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true })
      }

      tempFilePath = path.join(tempDir, fileName)
      fs.writeFileSync(tempFilePath, buffer)

      console.log(`📄 Temp file created: ${tempFilePath}`)

      // Send progress: validating
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('import-progress', {
          importId,
          stage: 'validating',
          percentage: 10
        })
      }

      // Validate file
      const validation = validateFile(tempFilePath)
      if (!validation.valid) {
        return {
          success: false,
          error: validation.errors[0]?.message || 'File validation failed',
          errors: validation.errors
        }
      }

      // Send progress: parsing
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('import-progress', {
          importId,
          stage: 'parsing',
          percentage: 30
        })
      }

      // Send progress: processing
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('import-progress', {
          importId,
          stage: 'processing',
          percentage: 50
        })
      }

      // Process file
      const result = processSingleFile(tempFilePath, db, {
        wsServer: null,
        broadcastUpdates: true, // Enable real-time updates
        dryRun: false
      })

      // ✅ CRITICAL: Force save database after web import
      if (db && typeof db.save === 'function') {
        db.save()
        console.log('💾 Database saved after web import')
      }

      // Send progress: complete
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('import-progress', {
          importId,
          stage: 'complete',
          percentage: 100
        })
      }

      // Log action
      if (logAction) {
        logAction('WEB_IMPORT', {
          fileName,
          totalRecords: result.totalRecords,
          inserted: result.inserted,
          updated: result.updated,
          failed: result.failed,
          status: result.status
        })
      }

      console.log(`✅ Web import complete: ${result.inserted} inserted, ${result.updated} updated, ${result.failed} failed`)

      // Clean up temp file
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath)
        console.log(`🗑️ Temp file deleted: ${tempFilePath}`)
      }

      return {
        success: result.status !== IMPORT_STATUS.FAILED,
        importId,
        result: {
          totalRecords: result.totalRecords,
          inserted: result.inserted,
          updated: result.updated,
          failed: result.failed,
          errors: result.errors,
          warnings: result.warnings,
          status: result.status
        }
      }
    } catch (error) {
      console.error('❌ Web import error:', error)

      // Clean up temp file on error
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath)
        } catch (cleanupError) {
          console.error('Error cleaning up temp file:', cleanupError)
        }
      }

      return {
        success: false,
        importId,
        error: error.message
      }
    }
  })
}

module.exports = { registerImportHandlers }
