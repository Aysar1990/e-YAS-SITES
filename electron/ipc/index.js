/**
 * IPC Handlers Registration
 * Imports and registers all IPC handlers for the Electron main process
 * @module electron/ipc
 */

const { registerServerHandlers } = require('./serverHandlers')
const { registerConfigHandlers } = require('./configHandlers')
// Firebase handlers removed - migrated to Supabase (see archive/firebase-legacy/)
const { registerStatsHandlers } = require('./statsHandlers')
const { registerAuthHandlers } = require('./authHandlers')
const { registerDataHandlers } = require('./dataHandlers')
const { registerRejectionsHandlers } = require('./rejectionsHandlers')
const { registerSettingsHandlers } = require('./settingsHandlers')
const { registerUserHandlers } = require('./userHandlers')
const { registerNokiaHandlers } = require('./nokiaHandlers')
const { registerAuditHandlers } = require('./auditHandlers')
const { registerNotificationHandlers } = require('./notificationHandlers')
const { registerBackupHandlers } = require('./backupHandlers')
const { registerSyncHandlers } = require('./syncHandlers')
const { registerExportHandlers } = require('./exportHandlers')
const { registerImportHandlers } = require('./importHandlers')
const { registerReportHandlers } = require('./reportHandlers')
const { registerPerformanceHandlers, startPerformanceMonitoring } = require('./performanceHandlers')
const { registerSupabaseHandlers } = require('./supabaseHandlers')
const { registerChangeRequestHandlers } = require('./changeRequestHandlers')
const { registerUnifiedHandlers } = require('./unifiedHandlers')

/**
 * Registers all IPC handlers
 * @param {Electron.IpcMain} ipcMain - Electron IPC main instance
 * @param {Object} deps - Dependencies object containing all shared resources
 * @param {Object} deps.db - Database instance
 * @param {Object} deps.authQueries - Authentication queries module
 * @param {Object} deps.settingsQueries - Settings queries module
 * @param {Object} deps.rejectionsQueries - Rejections queries module
 * @param {Object} deps.contractorsQueries - Contractors queries module
 * @param {Object} deps.sitesQueries - Sites queries module
 * @param {Object} deps.notifications - Notifications module
 * @param {Object} deps.dataSync - Data sync service
 * @param {Function} deps.logAction - Audit logging function
 * @param {Function} deps.getMainWindow - Function to get main window
 * @param {Function} deps.getApiServer - Function to get API server instance
 * @param {Function} deps.setApiServer - Function to set API server instance
 * @param {Function} deps.getWsServer - Function to get WebSocket server instance
 * @param {Function} deps.setWsServer - Function to set WebSocket server instance
 * @param {Function} deps.getBackupService - Function to get backup service
 * @param {Function} deps.getLiveSyncWatcher - Function to get live sync watcher
 * @param {Function} deps.setLiveSyncWatcher - Function to set live sync watcher
 * @param {Function} deps.initializeLiveSync - Function to initialize live sync
 * @param {Object} deps.ApiServer - ApiServer class
 * @param {Object} deps.WebSocketServer - WebSocketServer class
 * @param {string} deps.electronDir - Path to electron directory
 */
function registerAllHandlers(ipcMain, deps) {
  console.log('📡 Registering IPC handlers...')

  // Server handlers
  registerServerHandlers(ipcMain, {
    db: deps.db,
    getApiServer: deps.getApiServer,
    setApiServer: deps.setApiServer,
    getWsServer: deps.getWsServer,
    setWsServer: deps.setWsServer,
    ApiServer: deps.ApiServer,
    WebSocketServer: deps.WebSocketServer
  })

  // Config handlers
  registerConfigHandlers(ipcMain, deps)

  // Stats handlers
  registerStatsHandlers(ipcMain, {
    db: deps.db
  })

  // Auth handlers
  registerAuthHandlers(ipcMain, {
    db: deps.db,
    authQueries: deps.authQueries,
    logAction: deps.logAction
  })

  // Data handlers
  registerDataHandlers(ipcMain, {
    sitesQueries: deps.sitesQueries,
    contractorsQueries: deps.contractorsQueries
  })

  // Rejections handlers
  registerRejectionsHandlers(ipcMain, {
    contractorsQueries: deps.contractorsQueries,
    rejectionsQueries: deps.rejectionsQueries
  })

  // Settings handlers
  registerSettingsHandlers(ipcMain, {
    settingsQueries: deps.settingsQueries,
    dataSync: deps.dataSync,
    getMainWindow: deps.getMainWindow,
    getLiveSyncWatcher: deps.getLiveSyncWatcher,
    initializeLiveSync: deps.initializeLiveSync,
    setLiveSyncWatcher: deps.setLiveSyncWatcher
  })

  // User handlers
  registerUserHandlers(ipcMain, {
    db: deps.db,
    authQueries: deps.authQueries,
    contractorsQueries: deps.contractorsQueries,
    logAction: deps.logAction
  })

  // Nokia handlers
  registerNokiaHandlers(ipcMain, {
    db: deps.db,
    logAction: deps.logAction
  })

  // Audit handlers
  registerAuditHandlers(ipcMain, {
    db: deps.db,
    logAction: deps.logAction
  })

  // Notification handlers
  registerNotificationHandlers(ipcMain, {
    notifications: deps.notifications
  })

  // Backup handlers
  registerBackupHandlers(ipcMain, {
    getBackupService: deps.getBackupService
  })

  // Sync handlers
  registerSyncHandlers(ipcMain, {
    dataSync: deps.dataSync,
    sitesQueries: deps.sitesQueries,
    settingsQueries: deps.settingsQueries,
    getLiveSyncWatcher: deps.getLiveSyncWatcher,
    setLiveSyncWatcher: deps.setLiveSyncWatcher,
    initializeLiveSync: deps.initializeLiveSync
  })

  // Export handlers
  registerExportHandlers(ipcMain, {
    authQueries: deps.authQueries,
    getMainWindow: deps.getMainWindow
  })

  // Import handlers (batch processing)
  registerImportHandlers(ipcMain, {
    db: deps.db,
    getMainWindow: deps.getMainWindow,
    logAction: deps.logAction
  })

  // Report handlers (Excel export - Day 13)
  registerReportHandlers(ipcMain, {
    getMainWindow: deps.getMainWindow
  })

  // Performance handlers
  registerPerformanceHandlers()
  startPerformanceMonitoring()

  // Supabase handlers (cloud sync)
  registerSupabaseHandlers(deps.getMainWindow ? deps.getMainWindow() : null)
  console.log('   ☁️  Supabase sync handlers registered')

  // Change Request handlers (approval workflow)
  registerChangeRequestHandlers(ipcMain, {
    db: deps.db,
    sitesQueries: deps.sitesQueries,
    logAction: deps.logAction,
    getMainWindow: deps.getMainWindow
  })

  // Unified Data handlers (SQLite + Supabase smart switching)
  registerUnifiedHandlers(ipcMain, {
    getMainWindow: deps.getMainWindow,
    logAction: deps.logAction
  })
  console.log('   🔄 Unified Data handlers registered')


  console.log('✅ All IPC handlers registered successfully')
}

module.exports = { registerAllHandlers }
