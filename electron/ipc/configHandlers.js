/**
 * App configuration IPC handlers
 * Handles: get-app-config, save-app-config
 * @module electron/ipc/configHandlers
 */

const { app } = require('electron')
const path = require('path')
const fs = require('fs')
const { isPlainObject } = require('../utils/validation')

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
      // Input validation
      if (!config || !isPlainObject(config)) {
        return { success: false, error: 'Config must be a valid object' }
      }

      // Validate config size (prevent DoS)
      const configString = JSON.stringify(config)
      if (configString.length > 1024 * 1024) { // 1MB limit
        return { success: false, error: 'Config size exceeds maximum allowed (1MB)' }
      }

      // Sanitize config keys and values
      const sanitizedConfig = {}
      for (const [key, value] of Object.entries(config)) {
        // Only allow alphanumeric keys with underscores
        if (!/^[a-zA-Z0-9_]+$/.test(key)) {
          return { success: false, error: `Invalid config key: ${key}` }
        }
        // Don't allow functions or dangerous types
        if (typeof value === 'function' || typeof value === 'symbol') {
          return { success: false, error: `Invalid config value type for key: ${key}` }
        }
        sanitizedConfig[key] = value
      }

      const existing = fs.existsSync(configPath)
        ? JSON.parse(fs.readFileSync(configPath, 'utf8'))
        : {}
      const merged = { ...existing, ...sanitizedConfig }
      fs.writeFileSync(configPath, JSON.stringify(merged, null, 2))
      return { success: true }
    } catch (error) {
      console.error('Failed to save config:', error)
      return { success: false, error: error.message }
    }
  })
}

module.exports = { registerConfigHandlers }
