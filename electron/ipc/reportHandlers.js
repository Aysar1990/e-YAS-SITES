/**
 * Report IPC Handlers - Day 13
 *
 * Handles Excel report generation requests from the renderer process
 * @module electron/ipc/reportHandlers
 */

const { dialog, shell } = require('electron')
const path = require('path')
const os = require('os')
const fs = require('fs')
const reportGenerator = require('../services/reportGenerator')
const {
  isNonEmptyString,
  isArray,
  isPlainObject,
  sanitizeString
} = require('../utils/validation')

/**
 * Registers report-related IPC handlers
 * @param {Electron.IpcMain} ipcMain - Electron IPC main instance
 * @param {Object} deps - Dependencies object
 * @param {Function} deps.getMainWindow - Function to get main window
 */
function registerReportHandlers(ipcMain, deps) {
  const { getMainWindow } = deps

  /**
   * Generate full report with all sheets
   * Input: { sites, outputPath? }
   * Output: { success, path, sheetsCreated, totalRows, error? }
   */
  ipcMain.handle('generate-full-report', async (event, { sites, outputPath }) => {
    try {
      // Input validation
      if (!sites || !isArray(sites)) {
        return {
          success: false,
          error: 'Sites must be a valid array'
        }
      }

      if (sites.length === 0) {
        return {
          success: false,
          error: 'No sites data to generate report'
        }
      }

      // Validate sites array size (prevent DoS)
      if (sites.length > 100000) {
        return {
          success: false,
          error: 'Too many sites. Maximum 100,000 sites per report'
        }
      }

      // Validate output path if provided
      let finalPath = path.join(
        os.homedir(),
        'Downloads',
        reportGenerator.generateFilename('TSSR_Full_Report')
      )

      if (outputPath) {
        if (!isNonEmptyString(outputPath)) {
          return {
            success: false,
            error: 'Output path must be a non-empty string'
          }
        }
        finalPath = sanitizeString(outputPath)

        // Ensure .xlsx extension
        if (!finalPath.endsWith('.xlsx')) {
          finalPath += '.xlsx'
        }
      }

      console.log(`📊 Generating full report for ${sites.length} sites`)

      const result = await reportGenerator.generateFullReport(sites, finalPath)

      if (result.success) {
        console.log(`✅ Full report generated: ${result.path}`)
      }

      return result
    } catch (error) {
      console.error('Generate full report error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  })

  /**
   * Generate phase-specific report
   * Input: { sites, phase, outputPath? }
   * Output: { success, path, phase, totalRows, error? }
   */
  ipcMain.handle('generate-phase-report', async (event, { sites, phase, outputPath }) => {
    try {
      // Input validation
      if (!sites || !isArray(sites)) {
        return {
          success: false,
          error: 'Sites must be a valid array'
        }
      }

      if (sites.length === 0) {
        return {
          success: false,
          error: 'No sites data to generate report'
        }
      }

      // Validate sites array size
      if (sites.length > 100000) {
        return {
          success: false,
          error: 'Too many sites. Maximum 100,000 sites per report'
        }
      }

      // Validate phase if provided
      let sanitizedPhase = 'ALL'
      if (phase) {
        if (!isNonEmptyString(phase)) {
          return {
            success: false,
            error: 'Phase must be a non-empty string'
          }
        }
        sanitizedPhase = sanitizeString(phase)
      }

      // Validate output path if provided
      let finalPath = path.join(
        os.homedir(),
        'Downloads',
        reportGenerator.generateFilename(`TSSR_Phase_${sanitizedPhase}`)
      )

      if (outputPath) {
        if (!isNonEmptyString(outputPath)) {
          return {
            success: false,
            error: 'Output path must be a non-empty string'
          }
        }
        finalPath = sanitizeString(outputPath)

        // Ensure .xlsx extension
        if (!finalPath.endsWith('.xlsx')) {
          finalPath += '.xlsx'
        }
      }

      console.log(`📊 Generating phase report for ${sanitizedPhase}: ${sites.length} sites`)

      const result = await reportGenerator.generatePhaseReport(sites, sanitizedPhase, finalPath)

      if (result.success) {
        console.log(`✅ Phase report generated: ${result.path}`)
      }

      return result
    } catch (error) {
      console.error('Generate phase report error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  })

  /**
   * Generate custom report with filters and column selection
   * Input: { sites, config: { filters, columns, groupBy }, outputPath? }
   * Output: { success, path, totalRows, sheetsCreated, error? }
   */
  ipcMain.handle('generate-custom-report', async (event, { sites, config, outputPath }) => {
    try {
      console.log(`📊 Generating custom report with config:`, JSON.stringify(config))

      const finalPath = outputPath || path.join(
        os.homedir(),
        'Downloads',
        reportGenerator.generateFilename('TSSR_Custom_Report')
      )

      const result = await reportGenerator.generateCustomReport(sites, config, finalPath)

      if (result.success) {
        console.log(`✅ Custom report generated: ${result.path}`)
      }

      return result
    } catch (error) {
      console.error('Generate custom report error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  })

  /**
   * Open file dialog for selecting export location
   * Output: { success, filePath?, canceled? }
   */
  ipcMain.handle('select-export-location', async (event, { defaultFilename }) => {
    try {
      const mainWindow = getMainWindow()

      const result = await dialog.showSaveDialog(mainWindow, {
        title: 'Save Excel Report',
        defaultPath: path.join(
          os.homedir(),
          'Downloads',
          defaultFilename || reportGenerator.generateFilename()
        ),
        filters: [
          { name: 'Excel Files', extensions: ['xlsx'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      })

      if (result.canceled) {
        return { success: false, canceled: true }
      }

      return {
        success: true,
        filePath: result.filePath
      }
    } catch (error) {
      console.error('Select export location error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  })

  /**
   * Open exported file with default application (Excel)
   * Input: filePath
   * Output: { success, error? }
   */
  ipcMain.handle('open-exported-file', async (event, { filePath }) => {
    try {
      // Input validation
      if (!filePath || !isNonEmptyString(filePath)) {
        return {
          success: false,
          error: 'File path is required and must be a non-empty string'
        }
      }

      const sanitizedPath = sanitizeString(filePath)

      // Validate file exists
      if (!fs.existsSync(sanitizedPath)) {
        return {
          success: false,
          error: 'File not found'
        }
      }

      // Validate file extension (only allow safe file types)
      const ext = path.extname(sanitizedPath).toLowerCase()
      const allowedExtensions = ['.xlsx', '.xls', '.csv', '.pdf', '.txt']

      if (!allowedExtensions.includes(ext)) {
        return {
          success: false,
          error: `File type not allowed. Only ${allowedExtensions.join(', ')} files can be opened`
        }
      }

      console.log(`📂 Opening file: ${sanitizedPath}`)
      await shell.openPath(sanitizedPath)
      return { success: true }
    } catch (error) {
      console.error('Open exported file error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  })

  /**
   * Get available columns for custom export
   * Output: { success, columns }
   */
  ipcMain.handle('get-export-columns', async () => {
    try {
      return {
        success: true,
        columns: reportGenerator.COLUMN_HEADERS.map(col => ({
          key: col.key,
          header: col.header,
          width: col.width
        }))
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  })

  /**
   * Get export statistics preview
   * Input: { sites, config }
   * Output: { success, stats }
   */
  ipcMain.handle('get-export-preview', async (event, { sites, config = {} }) => {
    try {
      const { filters = {} } = config
      let filteredSites = [...sites]

      // Apply filters for preview
      if (filters.governorate && filters.governorate.length > 0) {
        filteredSites = filteredSites.filter(s => filters.governorate.includes(s.governorate))
      }
      if (filters.phase && filters.phase.length > 0) {
        filteredSites = filteredSites.filter(s => filters.phase.includes(s.phase_name))
      }
      if (filters.status && filters.status.length > 0) {
        filteredSites = filteredSites.filter(s => filters.status.includes(s.tssr_overall_status))
      }
      if (filters.contractor && filters.contractor.length > 0) {
        filteredSites = filteredSites.filter(s => filters.contractor.includes(s.tssr_subcon))
      }

      const summary = reportGenerator.calculateSummary(filteredSites)

      return {
        success: true,
        stats: {
          totalSites: filteredSites.length,
          ...summary
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  })
}

module.exports = { registerReportHandlers }
