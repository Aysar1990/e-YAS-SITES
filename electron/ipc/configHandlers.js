/**
 * App configuration IPC handlers
 * Handles: get-app-config, save-app-config
 * @module electron/ipc/configHandlers
 */

const { app } = require('electron')
const path = require('path')
const fs = require('fs')

const configPath = path.join(app.getPath('userData'), 'app-config.json')

/**
 * Registers app configuration IPC handlers
 * @param {Electron.IpcMain} ipcMain - Electron IPC main instance
 * @param {Object} deps - Dependencies object (unused but kept for consistency)
 */
function registerConfigHandlers(ipcMain, deps) {
  ipcMain.handle('get-app-config', () => {
    try {
      if (fs.existsSync(configPath)) {
        return JSON.parse(fs.readFileSync(configPath, 'utf8'))
      }
    } catch (error) {
      console.error('Failed to read config:', error)
    }
    return {}
  })

  ipcMain.handle('save-app-config', (event, config) => {
    try {
      const existing = fs.existsSync(configPath)
        ? JSON.parse(fs.readFileSync(configPath, 'utf8'))
        : {}
      const merged = { ...existing, ...config }
      fs.writeFileSync(configPath, JSON.stringify(merged, null, 2))
      return { success: true }
    } catch (error) {
      console.error('Failed to save config:', error)
      return { success: false, error: error.message }
    }
  })
}

module.exports = { registerConfigHandlers }
