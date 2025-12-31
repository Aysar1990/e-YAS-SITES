/**
 * Centralized Error Handler
 * Logs errors to file and notifies users via IPC
 */

const fs = require('fs')
const path = require('path')
const { ipcMain, BrowserWindow } = require('electron')

class ErrorHandler {
  constructor() {
    this.logDir = path.join(__dirname, '..', '..', 'logs')
    this.logFile = path.join(this.logDir, 'errors.log')
    this.maxLogSize = 5 * 1024 * 1024 // 5MB
    this.maxLogFiles = 5

    this.ensureLogDir()
    this.registerIpcHandlers()
  }

  /**
   * Ensure log directory exists
   */
  ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true })
    }
  }

  /**
   * Register IPC handlers for error logging
   */
  registerIpcHandlers() {
    ipcMain.handle('log-error', async (event, errorData) => {
      return this.logError(errorData)
    })

    ipcMain.handle('get-error-logs', async (event, options = {}) => {
      return this.getErrorLogs(options)
    })

    ipcMain.handle('clear-error-logs', async () => {
      return this.clearErrorLogs()
    })
  }

  /**
   * Log an error to file
   * @param {Object} errorData - Error information
   * @returns {Object} Result
   */
  logError(errorData) {
    try {
      const timestamp = new Date().toISOString()
      const logEntry = {
        timestamp,
        id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...errorData
      }

      // Rotate logs if needed
      this.rotateLogsIfNeeded()

      // Append to log file
      const logLine = JSON.stringify(logEntry) + '\n'
      fs.appendFileSync(this.logFile, logLine)

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.error('[ErrorHandler]', errorData.type, errorData.message)
      }

      // Notify user if critical
      if (errorData.critical) {
        this.notifyUser(errorData)
      }

      return { success: true, errorId: logEntry.id }
    } catch (error) {
      console.error('Failed to log error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get error logs
   * @param {Object} options - Query options
   * @returns {Array} Error logs
   */
  getErrorLogs(options = {}) {
    try {
      if (!fs.existsSync(this.logFile)) {
        return []
      }

      const content = fs.readFileSync(this.logFile, 'utf8')
      const lines = content.trim().split('\n').filter(Boolean)
      let logs = lines.map(line => {
        try {
          return JSON.parse(line)
        } catch {
          return null
        }
      }).filter(Boolean)

      // Apply filters
      if (options.type) {
        logs = logs.filter(log => log.type === options.type)
      }

      if (options.since) {
        const sinceDate = new Date(options.since)
        logs = logs.filter(log => new Date(log.timestamp) >= sinceDate)
      }

      // Sort by timestamp descending
      logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

      // Limit results
      if (options.limit) {
        logs = logs.slice(0, options.limit)
      }

      return logs
    } catch (error) {
      console.error('Failed to get error logs:', error)
      return []
    }
  }

  /**
   * Clear error logs
   */
  clearErrorLogs() {
    try {
      // Archive current log before clearing
      if (fs.existsSync(this.logFile)) {
        const archiveName = `errors_${Date.now()}.log`
        const archivePath = path.join(this.logDir, archiveName)
        fs.renameSync(this.logFile, archivePath)
      }

      // Create empty log file
      fs.writeFileSync(this.logFile, '')

      return { success: true }
    } catch (error) {
      console.error('Failed to clear error logs:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Rotate logs if file is too large
   */
  rotateLogsIfNeeded() {
    try {
      if (!fs.existsSync(this.logFile)) return

      const stats = fs.statSync(this.logFile)
      if (stats.size < this.maxLogSize) return

      // Rotate: errors.log -> errors.1.log -> errors.2.log, etc.
      for (let i = this.maxLogFiles - 1; i >= 1; i--) {
        const oldPath = path.join(this.logDir, `errors.${i}.log`)
        const newPath = path.join(this.logDir, `errors.${i + 1}.log`)

        if (fs.existsSync(oldPath)) {
          if (i === this.maxLogFiles - 1) {
            fs.unlinkSync(oldPath) // Delete oldest
          } else {
            fs.renameSync(oldPath, newPath)
          }
        }
      }

      // Rename current to .1
      const firstBackup = path.join(this.logDir, 'errors.1.log')
      fs.renameSync(this.logFile, firstBackup)

      // Create new empty log
      fs.writeFileSync(this.logFile, '')
    } catch (error) {
      console.error('Failed to rotate logs:', error)
    }
  }

  /**
   * Notify user of critical error
   * @param {Object} errorData - Error information
   */
  notifyUser(errorData) {
    try {
      const windows = BrowserWindow.getAllWindows()
      if (windows.length > 0) {
        windows[0].webContents.send('error-notification', {
          type: 'error',
          title: 'An error occurred',
          message: errorData.message || 'An unexpected error occurred',
          errorId: errorData.id
        })
      }
    } catch (error) {
      console.error('Failed to notify user:', error)
    }
  }

  /**
   * Log uncaught exceptions
   */
  setupGlobalHandlers() {
    process.on('uncaughtException', (error) => {
      this.logError({
        type: 'uncaught_exception',
        message: error.message,
        stack: error.stack,
        critical: true
      })
    })

    process.on('unhandledRejection', (reason, promise) => {
      this.logError({
        type: 'unhandled_rejection',
        message: reason?.message || String(reason),
        stack: reason?.stack,
        critical: false
      })
    })
  }

  /**
   * Log specific error types
   */
  logDatabaseError(error, context = {}) {
    return this.logError({
      type: 'database_error',
      message: error.message,
      stack: error.stack,
      ...context
    })
  }

  logNetworkError(error, context = {}) {
    return this.logError({
      type: 'network_error',
      message: error.message,
      ...context
    })
  }

  logSyncError(error, context = {}) {
    return this.logError({
      type: 'sync_error',
      message: error.message,
      stack: error.stack,
      ...context
    })
  }

  logImportError(error, context = {}) {
    return this.logError({
      type: 'import_error',
      message: error.message,
      stack: error.stack,
      ...context,
      critical: true
    })
  }
}

// Singleton instance
let errorHandler = null

function getErrorHandler() {
  if (!errorHandler) {
    errorHandler = new ErrorHandler()
  }
  return errorHandler
}

function initializeErrorHandler() {
  const handler = getErrorHandler()
  handler.setupGlobalHandlers()
  console.log('✅ Error handler initialized')
  return handler
}

module.exports = {
  ErrorHandler,
  getErrorHandler,
  initializeErrorHandler
}
