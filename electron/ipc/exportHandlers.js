/**
 * Export IPC handlers
 * Handles: export-excel, get-activity-log
 * @module electron/ipc/exportHandlers
 */

const { dialog } = require('electron')

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
      const XLSX = require('xlsx')

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(data)
      XLSX.utils.book_append_sheet(wb, ws, 'Export')

      const mainWindow = getMainWindow()
      const result = await dialog.showSaveDialog(mainWindow, {
        title: 'Export to Excel',
        defaultPath: filename || 'tssr_export.xlsx',
        filters: [{ name: 'Excel Files', extensions: ['xlsx'] }],
      })

      if (!result.canceled && result.filePath) {
        XLSX.writeFile(wb, result.filePath)
        return {
          success: true,
          filePath: result.filePath,
        }
      }

      return { success: false, error: 'Export cancelled' }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      }
    }
  })

  ipcMain.handle('get-activity-log', async (event, { limit }) => {
    try {
      const logs = authQueries.getActivityLog(limit || 100)
      return {
        success: true,
        logs,
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      }
    }
  })
}

module.exports = { registerExportHandlers }
