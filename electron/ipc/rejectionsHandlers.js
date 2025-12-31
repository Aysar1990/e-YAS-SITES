/**
 * Rejections IPC handlers
 * Handles: get-rejections, mark-rejections-viewed
 * @module electron/ipc/rejectionsHandlers
 */

/**
 * Registers rejections IPC handlers
 * @param {Electron.IpcMain} ipcMain - Electron IPC main instance
 * @param {Object} deps - Dependencies object
 * @param {Object} deps.contractorsQueries - Contractors queries module
 * @param {Object} deps.rejectionsQueries - Rejections queries module
 */
function registerRejectionsHandlers(ipcMain, deps) {
  const { contractorsQueries, rejectionsQueries } = deps

  ipcMain.handle('get-rejections', async (event, { contractorName, phase }) => {
    try {
      const rejections = contractorsQueries.getSitesWithRejections(contractorName, phase)
      const unviewed = rejectionsQueries.getUnviewedRejections(contractorName)
      const unviewedCount = rejectionsQueries.getUnviewedCount(contractorName)

      return {
        success: true,
        rejections,
        unviewedCount,
        unviewed,
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      }
    }
  })

  ipcMain.handle('mark-rejections-viewed', async (event, { contractorName }) => {
    try {
      rejectionsQueries.markRejectionsAsViewed(contractorName)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      }
    }
  })
}

module.exports = { registerRejectionsHandlers }
