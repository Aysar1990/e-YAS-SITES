/**
 * Export IPC handlers
 * Handles: export-excel, get-activity-log
 * @module electron/ipc/exportHandlers
 */

const { dialog } = require('electron')
const {
  isNonEmptyString,
  isPositiveInteger,
  isArray,
  sanitizeString
} = require('../utils/validation')

/**
 * Registers export IPC handlers
 * @param {Electron.IpcMain} ipcMain - Electron IPC main instance
 * @param {Object} deps - Dependencies object
 * @param {Object} deps.authQueries - Authentication queries module
 * @param {Function} deps.getMainWindow - Function to get main window
 */
function registerExportHandlers(ipcMain, deps) {
  const { authQueries, getMainWindow } = deps

  ipcMain.handle('export-excel', async (event, { data, filename }) => {
    try {
      // Input validation
      if (!data || !isArray(data)) {
        return {
          success: false,
          error: 'Data must be a valid array',
        }
      }

      if (data.length === 0) {
        return {
          success: false,
          error: 'No data to export',
        }
      }

      // Validate data size (prevent DoS)
      if (data.length > 100000) {
        return {
          success: false,
          error: 'Too many rows. Maximum 100,000 rows per export',
        }
      }

      // Validate filename if provided
      let sanitizedFilename = 'tssr_export.xlsx'
      if (filename) {
        if (!isNonEmptyString(filename)) {
          return {
            success: false,
            error: 'Filename must be a non-empty string',
          }
        }
        sanitizedFilename = sanitizeString(filename)

        // Ensure .xlsx extension
        if (!sanitizedFilename.endsWith('.xlsx')) {
          sanitizedFilename += '.xlsx'
        }
      }

      console.log(`[EXPORT] Exporting ${data.length} rows to Excel`)

      const XLSX = require('xlsx')

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(data)
      XLSX.utils.book_append_sheet(wb, ws, 'Export')

      const mainWindow = getMainWindow()
      const result = await dialog.showSaveDialog(mainWindow, {
        title: 'Export to Excel',
        defaultPath: sanitizedFilename,
        filters: [{ name: 'Excel Files', extensions: ['xlsx'] }],
      })

      if (!result.canceled && result.filePath) {
        XLSX.writeFile(wb, result.filePath)
        console.log(`[EXPORT] Export completed: ${result.filePath}`)
        return {
          success: true,
          filePath: result.filePath,
        }
      }

      return { success: false, error: 'Export cancelled' }
    } catch (error) {
      console.error('[EXPORT] Export error:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  })

  ipcMain.handle('get-activity-log', async (event, { limit }) => {
    try {
      // Input validation
      let logLimit = 100 // Default value

      if (limit !== undefined && limit !== null) {
        if (!isPositiveInteger(limit)) {
          return {
            success: false,
            error: 'Limit must be a positive integer',
            logs: [],
          }
        }

        if (limit < 1 || limit > 10000) {
          return {
            success: false,
            error: 'Limit must be between 1 and 10,000',
            logs: [],
          }
        }

        logLimit = limit
      }

      console.log(`[EXPORT] Getting activity log (limit: ${logLimit})`)

      const logs = authQueries.getActivityLog(logLimit)
      return {
        success: true,
        logs: logs || [],
      }
    } catch (error) {
      console.error('[EXPORT] Get activity log error:', error)
      return {
        success: false,
        error: error.message,
        logs: [],
      }
    }
  })
}

module.exports = { registerExportHandlers }
