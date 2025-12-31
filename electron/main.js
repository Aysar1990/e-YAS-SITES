/**
 * TSSR Monitor - Electron Main Process
 * Entry point for the Electron application
 * @module electron/main
 */

const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')

// Database and queries
const db = require('./database/db')
const dataSync = require('./services/dataSync')
const authQueries = require('./database/queries/auth')
const settingsQueries = require('./database/queries/settings')
const rejectionsQueries = require('./database/queries/rejections')
const contractorsQueries = require('./database/queries/contractors')
const sitesQueries = require('./database/queries/sites')
const notifications = require('./notifications')

// Services
const LiveSyncWatcher = require('./services/liveSyncWatcher')
const liveSyncProcessor = require('./services/liveSyncProcessor')
const BackupService = require('./services/BackupService')
const ApiServer = require('./server/apiServer')
const WebSocketServer = require('./server/websocketServer')
const ExcelWatcher = require('./services/excelWatcher')

// Modular components
const { createWindow, getMainWindow, setMainWindow } = require('./window/windowManager')
const { registerAllHandlers } = require('./ipc')
const { createLogAction } = require('./utils/helpers')

// Global service instances
let mainWindow = null
let liveSyncWatcher = null
let excelWatcher = null
let apiServer = null
let wsServer = null
let backupService = null
let detachedWindows = new Map()

// Check if running in development mode
const isDev = !app.isPackaged

// Create bound logAction function
const logAction = createLogAction(db)

/**
 * Initialize Live Sync Watcher
 */
function initializeLiveSync() {
  const liveSyncEnabled = settingsQueries.getSetting('live_sync_enabled')

  if (liveSyncEnabled === '1' || liveSyncEnabled === 'true') {
    const jsonPath = settingsQueries.getSetting('live_sync_path') ||
      path.join(__dirname, '../data/live_sync.json')

    liveSyncWatcher = new LiveSyncWatcher({ jsonPath })

    // Handle data updates from Excel
    liveSyncWatcher.on('data-update', (jsonData) => {
      console.log('📥 Live sync data received from Excel')

      // Process and save to database
      const result = liveSyncProcessor.processData(jsonData)

      // Notify renderer with full update
      const window = getMainWindow()
      if (window && !window.isDestroyed()) {
        window.webContents.send('live-sync-complete', {
          success: result.success,
          recordsSynced: result.recordsSynced,
          newRejections: result.newRejections,
          timestamp: new Date().toISOString()
        })
      }
    })

    liveSyncWatcher.on('error', (error) => {
      console.error('❌ Live sync error:', error.message)
    })

    liveSyncWatcher.start(getMainWindow())
    console.log('👁️ Live Sync enabled and watching for Excel changes')
  } else {
    console.log('ℹ️ Live Sync is disabled. Enable it in settings.')
  }
}

/**
 * Initialize Excel Watcher
 */
function startExcelWatcher() {
  try {
    const excelPath = path.join(__dirname, '..', 'TSSR Tracker Zain Jo 5.xlsm')

    if (fs.existsSync(excelPath)) {
      excelWatcher = new ExcelWatcher(excelPath)
      excelWatcher.start(getMainWindow())
      console.log('✅ Excel Watcher initialized')
    } else {
      console.warn('⚠️ Excel file not found:', excelPath)
    }
  } catch (error) {
    console.error('❌ Error starting Excel Watcher:', error)
  }
}

/**
 * Detached Window IPC Handlers
 */
ipcMain.handle('open-detached-window', async (event, { route, title }) => {
  const { screen } = require('electron')
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.workAreaSize

  const detachedWin = new BrowserWindow({
    width: width,
    height: height,
    title: title || 'e-YAS SITES - Spreadsheet',
    icon: path.join(__dirname, '../public/icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    frame: true,
    resizable: true,
    minimizable: true,
    maximizable: true,
    show: false
  })

  // Load the same app but with route parameter
  const url = isDev
    ? `http://localhost:3000/#${route}?detached=true`
    : `file://${path.join(__dirname, '../dist/index.html')}#${route}?detached=true`

  detachedWin.loadURL(url)
  detachedWin.once('ready-to-show', () => {
    detachedWin.show()
    detachedWin.maximize()
  })

  const winId = Date.now().toString()
  detachedWindows.set(winId, detachedWin)

  detachedWin.on('closed', () => {
    detachedWindows.delete(winId)
  })

  return { success: true, windowId: winId }
})

ipcMain.handle('close-detached-window', async (event, windowId) => {
  const win = detachedWindows.get(windowId)
  if (win) {
    win.close()
    return { success: true }
  }
  return { success: false }
})

// Application ready
app.whenReady().then(async () => {
  console.log('🚀 Starting YAS TSSR Monitor...')

  // Initialize database
  await db.initialize()

  // Create main window
  mainWindow = createWindow(startExcelWatcher)

  // Initialize backup service
  const DATABASE_PATH = db.dbPath || path.join(__dirname, 'database', '..', '..', 'data', 'tssr.db')
  backupService = new BackupService(DATABASE_PATH)
  console.log('💾 Backup database path:', DATABASE_PATH)

  // Schedule backup check every hour
  setInterval(() => {
    backupService.runScheduledBackup()
  }, 60 * 60 * 1000)

  // Run initial backup check after 5 seconds
  setTimeout(() => {
    backupService.runScheduledBackup()
  }, 5000)

  console.log('💾 Backup service initialized')

  // Register all IPC handlers
  registerAllHandlers(ipcMain, {
    // Database and queries
    db,
    authQueries,
    settingsQueries,
    rejectionsQueries,
    contractorsQueries,
    sitesQueries,
    notifications,
    dataSync,
    logAction,

    // Window management
    getMainWindow,

    // Server management
    getApiServer: () => apiServer,
    setApiServer: (server) => { apiServer = server },
    getWsServer: () => wsServer,
    setWsServer: (server) => { wsServer = server },
    ApiServer,
    WebSocketServer,

    // Backup management
    getBackupService: () => backupService,

    // Live sync management
    getLiveSyncWatcher: () => liveSyncWatcher,
    setLiveSyncWatcher: (watcher) => { liveSyncWatcher = watcher },
    initializeLiveSync,

    // Paths
    electronDir: __dirname
  })

  // Start traditional cron-based sync
  dataSync.start(mainWindow)

  // Start Live Sync (file watcher)
  initializeLiveSync()

  // Start API & WebSocket Server (only if not already running)
  try {
    const net = require('net')
    
    // Check if API port is already in use (standalone server running)
    const isApiPortInUse = await new Promise((resolve) => {
      const tester = net.createServer()
      tester.once('error', () => resolve(true))
      tester.once('listening', () => {
        tester.close()
        resolve(false)
      })
      tester.listen(3001)
    })

    if (isApiPortInUse) {
      console.log('ℹ️ API Server already running (standalone mode) - skipping')
    } else {
      apiServer = new ApiServer(db)
      await apiServer.start()
      console.log('✅ API Server started')
    }

    // Check if WebSocket port is already in use
    const isWsPortInUse = await new Promise((resolve) => {
      const tester = net.createServer()
      tester.once('error', () => resolve(true))
      tester.once('listening', () => {
        tester.close()
        resolve(false)
      })
      tester.listen(3002)
    })

    if (isWsPortInUse) {
      console.log('ℹ️ WebSocket Server already running (standalone mode) - skipping')
    } else {
      wsServer = new WebSocketServer()
      await wsServer.start()
      console.log('✅ WebSocket Server started')
    }
  } catch (error) {
    console.error('❌ Failed to start Servers:', error)
  }

  // Handle app activation (macOS)
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow(startExcelWatcher)
    }
  })
})

// Window closed
app.on('window-all-closed', () => {
  dataSync.stop()

  // Stop live sync watcher
  if (liveSyncWatcher) {
    liveSyncWatcher.stop()
  }

  // Stop Excel Watcher
  if (excelWatcher) {
    excelWatcher.stop()
  }

  db.close()

  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Before quit
app.on('before-quit', async () => {
  if (apiServer) await apiServer.stop()
  if (wsServer) await wsServer.stop()

  // Stop Excel Watcher
  if (excelWatcher) {
    excelWatcher.stop()
  }
})
