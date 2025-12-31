const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
  // Authentication
  login: (credentials) => ipcRenderer.invoke('login', credentials),
  updatePassword: (data) => ipcRenderer.invoke('update-password', data),

  // Data
  getData: (filters) => ipcRenderer.invoke('get-data', filters),
  getStats: (filters) => ipcRenderer.invoke('get-stats', filters),
  getPhases: () => ipcRenderer.invoke('get-phases'),
  searchSites: (data) => ipcRenderer.invoke('search-sites', data),
  debugPhaseCount: () => ipcRenderer.invoke('debug-phase-count'),
  getStatsByPartOf: (data) => ipcRenderer.invoke('get-stats-by-part-of', data),
  getOverviewTable: (data) => ipcRenderer.invoke('get-overview-table', data),
  getPartOfValues: (data) => ipcRenderer.invoke('get-part-of-values', data),

  // Rejections
  getRejections: (data) => ipcRenderer.invoke('get-rejections', data),
  markRejectionsViewed: (data) => ipcRenderer.invoke('mark-rejections-viewed', data),

  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSettings: (settings) => ipcRenderer.invoke('update-settings', settings),
  selectExcelFile: () => ipcRenderer.invoke('select-excel-file'),

  // Database Configuration
  getDatabaseType: () => ipcRenderer.invoke('get-database-type'),
  setDatabaseType: (type) => ipcRenderer.invoke('set-database-type', type),
  testDatabaseConnection: (type, config) => ipcRenderer.invoke('test-database-connection', type, config),
  getSupabaseConfig: () => ipcRenderer.invoke('get-supabase-config'),
  setSupabaseConfig: (url, key) => ipcRenderer.invoke('set-supabase-config', url, key),

  // Contractors
  getContractors: () => ipcRenderer.invoke('get-contractors'),
  updateContractor: (data) => ipcRenderer.invoke('update-contractor', data),
  createContractor: (data) => ipcRenderer.invoke('create-contractor', data),
  deleteContractor: (data) => ipcRenderer.invoke('delete-contractor', data),
  getContractorDetailedStats: (data) => ipcRenderer.invoke('get-contractor-detailed-stats', data),

  // Sync
  manualSync: () => ipcRenderer.invoke('manual-sync'),
  getSyncStatus: () => ipcRenderer.invoke('get-sync-status'),

  // Live Sync
  getLiveSyncStatus: () => ipcRenderer.invoke('get-live-sync-status'),
  toggleLiveSync: (data) => ipcRenderer.invoke('toggle-live-sync', data),

  // Export
  exportExcel: (data) => ipcRenderer.invoke('export-excel', data),

  // Activity Log
  getActivityLog: (data) => ipcRenderer.invoke('get-activity-log', data),

  // Server mode
  startServers: () => ipcRenderer.invoke('start-servers'),
  stopServers: () => ipcRenderer.invoke('stop-servers'),
  getServerInfo: () => ipcRenderer.invoke('get-server-info'),
  getConnectedClients: () => ipcRenderer.invoke('get-connected-clients'),
  broadcastUpdate: (type, data) => ipcRenderer.invoke('broadcast-update', type, data),

  // App config
  getAppConfig: () => ipcRenderer.invoke('get-app-config'),
  saveAppConfig: (config) => ipcRenderer.invoke('save-app-config', config),

  // Stats
  getStatsBreakdown: (phase) => ipcRenderer.invoke('get-stats-breakdown', phase),
  getOverviewStats: (phase) => ipcRenderer.invoke('get-overview-stats', phase),
  getContractorsList: (phase) => ipcRenderer.invoke('get-contractors-list', phase),
  getContractorStatsDetail: (name, phase) => ipcRenderer.invoke('get-contractor-stats', name, phase),

  // User Management
  getUsers: () => ipcRenderer.invoke('get-users'),
  createUser: (data) => ipcRenderer.invoke('create-user', data),
  updateUser: (data) => ipcRenderer.invoke('update-user', data),
  deleteUser: (data) => ipcRenderer.invoke('delete-user', data),

  // Role Permissions
  getRolePermissions: () => ipcRenderer.invoke('get-role-permissions'),
  updateRolePermissions: (data) => ipcRenderer.invoke('update-role-permissions', data),

  // Contractors from Sites
  getUniqueContractorsFromSites: (phase) => ipcRenderer.invoke('get-unique-contractors-from-sites', phase),

  // Nokia Reviews (Ghirbal)
  getNokiaReviews: () => ipcRenderer.invoke('get-nokia-reviews'),
  getNokiaReviewBySiteId: (siteId) => ipcRenderer.invoke('get-nokia-review-by-site-id', siteId),
  upsertNokiaReview: (data) => ipcRenderer.invoke('upsert-nokia-review', data),
  updateNokiaReviewCheck: (data) => ipcRenderer.invoke('update-nokia-review-check', data),
  updateNokiaRejection: (data) => ipcRenderer.invoke('update-nokia-rejection', data),
  clearNokiaRejection: (data) => ipcRenderer.invoke('clear-nokia-rejection', data),
  getGhirbalSites: (phase) => ipcRenderer.invoke('get-ghirbal-sites', phase),
  getCheckedSites: (phase) => ipcRenderer.invoke('get-checked-sites', phase),

  // Notifications
  getNotificationSettings: () => ipcRenderer.invoke('get-notification-settings'),
  updateNotificationSettings: (settings) => ipcRenderer.invoke('update-notification-settings', settings),
  showNotification: (options) => ipcRenderer.invoke('show-notification', options),
  testNotification: () => ipcRenderer.invoke('test-notification'),
  notifyStatusChange: (data) => ipcRenderer.invoke('notify-status-change', data),
  notifyRejection: (data) => ipcRenderer.invoke('notify-rejection', data),
  notifyApproval: (data) => ipcRenderer.invoke('notify-approval', data),
  notifySyncComplete: (data) => ipcRenderer.invoke('notify-sync-complete', data),

  // Backup functions
  createBackup: (description) => ipcRenderer.invoke('create-backup', description),
  getBackups: () => ipcRenderer.invoke('get-backups'),
  restoreBackup: (backupName) => ipcRenderer.invoke('restore-backup', backupName),
  deleteBackup: (backupName) => ipcRenderer.invoke('delete-backup', backupName),
  getBackupSettings: () => ipcRenderer.invoke('get-backup-settings'),
  updateBackupSettings: (settings) => ipcRenderer.invoke('update-backup-settings', settings),
  cleanOldBackups: () => ipcRenderer.invoke('clean-old-backups'),

  // Event listeners
  onSyncComplete: (callback) => {
    ipcRenderer.on('sync-complete', (event, data) => callback(data))
  },

  // Live Sync event listeners
  onLiveSyncUpdate: (callback) => {
    ipcRenderer.on('live-sync-update', (event, data) => callback(data))
  },

  onLiveSyncComplete: (callback) => {
    ipcRenderer.on('live-sync-complete', (event, data) => callback(data))
  },
  
  // 🆕 Excel Watcher event listeners
  onExcelChanged: (callback) => {
    ipcRenderer.on('excel-file-changed', (event, data) => callback(data))
  },
  
  onDataRefreshed: (callback) => {
    ipcRenderer.on('data-refreshed', (event, data) => callback(data))
  },
  
  onSyncError: (callback) => {
    ipcRenderer.on('sync-error', (event, data) => callback(data))
  },
  
  removeAllSyncListeners: () => {
    ipcRenderer.removeAllListeners('excel-file-changed')
    ipcRenderer.removeAllListeners('data-refreshed')
    ipcRenderer.removeAllListeners('sync-error')
  },

  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel)
  },

  // DAY 9: Import IPC methods
  // Select import files using native dialog
  selectImportFiles: () => ipcRenderer.invoke('select-import-files'),

  // Validate batch of files
  validateBatch: (filePaths) => ipcRenderer.invoke('validate-batch', filePaths),

  // Import batch of files (DAY 9 - uses processMultipleFiles with transactions)
  importBatch: (filePaths) => ipcRenderer.invoke('import-batch', filePaths),

  // Validate single file
  validateSingle: (filePath) => ipcRenderer.invoke('validate-single', filePath),

  // Import single file
  importSingle: (filePath) => ipcRenderer.invoke('import-single', filePath),

  // Preview Excel file
  previewExcel: (filePath, limit) => ipcRenderer.invoke('preview-excel', { filePath, limit }),

  // I1: Batch import single file with BatchProcessor (original implementation)
  batchImport: (filePath, options) => ipcRenderer.invoke('batch-import', { filePath, options }),

  // I2: Batch import multiple files with BatchProcessor
  batchImportFiles: (filePaths, options) => ipcRenderer.invoke('batch-import-files', { filePaths, options }),

  // I3: Validate Excel file without importing (detailed validation)
  validateExcel: (filePath) => ipcRenderer.invoke('validate-excel', { filePath }),

  // I4: Get status of an active import job
  getImportStatus: (importId) => ipcRenderer.invoke('get-import-status', { importId }),

  // I5: Cancel an active import job
  cancelImport: (importId) => ipcRenderer.invoke('cancel-import', { importId }),

  // Listen to import progress events
  onImportProgress: (callback) => {
    ipcRenderer.on('import-progress', (event, data) => callback(data))
  },

  // Remove import progress listener
  removeImportProgressListener: () => {
    ipcRenderer.removeAllListeners('import-progress')
  },

  // DAY 13: Report Generation methods
  // Generate full report with all sheets
  generateFullReport: (sites, outputPath) => ipcRenderer.invoke('generate-full-report', { sites, outputPath }),

  // Generate phase-specific report
  generatePhaseReport: (sites, phase, outputPath) => ipcRenderer.invoke('generate-phase-report', { sites, phase, outputPath }),

  // Generate custom report with filters and column selection
  generateCustomReport: (sites, config, outputPath) => ipcRenderer.invoke('generate-custom-report', { sites, config, outputPath }),

  // Select export location (file dialog)
  selectExportLocation: (defaultFilename) => ipcRenderer.invoke('select-export-location', { defaultFilename }),

  // Open exported file with default application
  openExportedFile: (filePath) => ipcRenderer.invoke('open-exported-file', { filePath }),

  // Get available columns for custom export
  getExportColumns: () => ipcRenderer.invoke('get-export-columns'),

  // Get export preview stats
  getExportPreview: (sites, config) => ipcRenderer.invoke('get-export-preview', { sites, config }),

  // Performance Monitoring
  getPerformanceMetrics: () => ipcRenderer.invoke('performance:getMetrics'),
  getPerformanceSummary: () => ipcRenderer.invoke('performance:getSummary'),
  getPerformanceTimeSeries: (type, hours) => ipcRenderer.invoke('performance:getTimeSeries', { type, hours }),
  reportPerformance: (type, data) => ipcRenderer.invoke('performance:report', { type, data }),
  dismissAlert: (alertId) => ipcRenderer.invoke('performance:dismissAlert', alertId),
  clearAlerts: () => ipcRenderer.invoke('performance:clearAlerts'),
  getPerformanceHistory: (date) => ipcRenderer.invoke('performance:getHistory', date),
  getAvailablePerformanceDates: () => ipcRenderer.invoke('performance:getAvailableDates'),
  exportPerformanceMetrics: () => ipcRenderer.invoke('performance:export'),
  getPerformanceThresholds: () => ipcRenderer.invoke('performance:getThresholds'),
  setPerformanceThreshold: (key, value) => ipcRenderer.invoke('performance:setThreshold', { key, value }),
  analyzeBundleSize: () => ipcRenderer.invoke('performance:analyzeBundleSize'),

  // Performance Alert listeners
  onPerformanceAlert: (callback) => {
    ipcRenderer.on('performance-alert', (event, data) => callback(data))
  },
  removePerformanceAlertListener: () => {
    ipcRenderer.removeAllListeners('performance-alert')
  },

  // Supabase Sync
  supabaseTestConnection: () => ipcRenderer.invoke('supabase:test-connection'),
  supabaseGetInfo: (phase) => ipcRenderer.invoke('supabase:get-info', { phase }),
  supabaseSync: (phase) => ipcRenderer.invoke('supabase:sync', { phase }),
  supabaseGetPhases: () => ipcRenderer.invoke('supabase:get-phases'),
  supabaseCancelSync: () => ipcRenderer.invoke('supabase:cancel-sync'),

  // Direct Supabase Import (bypasses SQLite)
  supabaseDirectImport: (sites) => ipcRenderer.invoke('supabase:direct-import', { sites }),
  supabaseImportExcel: (params) => ipcRenderer.invoke('supabase:import-excel', params),

  // Supabase Progress listener
  onSupabaseProgress: (callback) => {
    ipcRenderer.on('supabase:progress', (event, data) => callback(data))
  },
  removeSupabaseProgressListener: () => {
    ipcRenderer.removeAllListeners('supabase:progress')
  },

  // Import from Frontend (base64)
  invoke: (channel, data) => ipcRenderer.invoke(channel, data),

  // Direct method for base64 import (fixes I6)
  importExcelFromBase64: (data) => ipcRenderer.invoke('import-excel-from-base64', data),

  // ============================================
  // Change Request Approval System
  // ============================================

  // Create a new change request (Contractor/Client)
  createChangeRequest: (data) => ipcRenderer.invoke('create-change-request', data),

  // Get all pending requests (Admin)
  getPendingRequests: (data) => ipcRenderer.invoke('get-pending-requests', data),

  // Get my own requests (Contractor view)
  getMyRequests: (data) => ipcRenderer.invoke('get-my-requests', data),

  // Approve a change request (Admin)
  approveChangeRequest: (data) => ipcRenderer.invoke('approve-change-request', data),

  // Reject a change request (Admin)
  rejectChangeRequest: (data) => ipcRenderer.invoke('reject-change-request', data),

  // Get request history with filters
  getRequestHistory: (data) => ipcRenderer.invoke('get-request-history', data),

  // Get pending request count (for badges)
  getRequestCounts: () => ipcRenderer.invoke('get-request-counts'),

  // Subscribe to real-time change request updates
  subscribeChangeRequests: () => ipcRenderer.invoke('subscribe-change-requests'),

  // Listen for change request events
  onChangeRequestCreated: (callback) => {
    ipcRenderer.on('change-request-created', (event, data) => callback(data))
  },
  onChangeRequestReviewed: (callback) => {
    ipcRenderer.on('change-request-reviewed', (event, data) => callback(data))
  },
  onChangeRequestUpdate: (callback) => {
    ipcRenderer.on('change-request-update', (event, data) => callback(data))
  },
  removeChangeRequestListeners: () => {
    ipcRenderer.removeAllListeners('change-request-created')
    ipcRenderer.removeAllListeners('change-request-reviewed')
    ipcRenderer.removeAllListeners('change-request-update')
  },

  // ============================================
  // Detached Window (Spreadsheet Pop-out)
  // ============================================

  // Open a route in a separate detached window
  openDetachedWindow: (options) => ipcRenderer.invoke('open-detached-window', options),

  // Close a detached window by ID
  closeDetachedWindow: (windowId) => ipcRenderer.invoke('close-detached-window', windowId),

  // Check if current window is detached
  isDetachedWindow: () => window.location.search.includes('detached=true') || window.location.hash.includes('detached=true'),

  // ============================================
  // 🔄 Unified Data Service (Smart Online/Offline)
  // ============================================

  // Get data from best source (Supabase if online, SQLite if offline)
  unifiedGetData: (options) => ipcRenderer.invoke('unified:get-data', options),

  // Import Excel to BOTH SQLite and Supabase
  unifiedImport: (data) => ipcRenderer.invoke('unified:import', data),

  // Sync SQLite to Supabase
  unifiedSync: (options) => ipcRenderer.invoke('unified:sync', options),

  // Get data source status (online/offline, counts)
  unifiedStatus: () => ipcRenderer.invoke('unified:status'),

  // Update site in both databases
  unifiedUpdateSite: (data) => ipcRenderer.invoke('unified:update-site', data),

  // Force check online status
  unifiedCheckOnline: () => ipcRenderer.invoke('unified:check-online'),

  // Listen to unified import progress
  onUnifiedProgress: (callback) => {
    ipcRenderer.on('unified:progress', (event, data) => callback(data))
  },
  removeUnifiedProgressListener: () => {
    ipcRenderer.removeAllListeners('unified:progress')
  },

})
