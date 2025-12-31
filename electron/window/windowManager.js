/**
 * Window management for the Electron application
 * @module electron/window/windowManager
 */

const { BrowserWindow, app } = require('electron')
const path = require('path')

let mainWindow = null

/**
 * Creates the main application window
 * @param {Function} onReadyCallback - Callback to execute when window is ready to show
 * @returns {BrowserWindow} The created window instance
 */
function createWindow(onReadyCallback) {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    title: 'e-YAS SITES',
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, '..', '..', 'public', 'icon.png'),
    show: false,
    backgroundColor: '#0a0e27',
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()

    // Execute callback when window is ready (e.g., start Excel watcher)
    if (onReadyCallback) {
      onReadyCallback()
    }
  })

  // Load the app
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', '..', 'dist', 'index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  return mainWindow
}

/**
 * Gets the main window instance
 * @returns {BrowserWindow|null} The main window or null if not created
 */
function getMainWindow() {
  return mainWindow
}

/**
 * Sets the main window instance (for external control)
 * @param {BrowserWindow|null} window - The window instance
 */
function setMainWindow(window) {
  mainWindow = window
}

module.exports = {
  createWindow,
  getMainWindow,
  setMainWindow
}
