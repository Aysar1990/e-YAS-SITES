/**
 * Notification IPC handlers
 * Handles: get-notification-settings, update-notification-settings, show-notification,
 *          test-notification, notify-status-change, notify-rejection, notify-approval, notify-sync-complete
 * @module electron/ipc/notificationHandlers
 */

const { app, Notification } = require('electron')
const path = require('path')
const fs = require('fs')

const notificationSettingsPath = path.join(app.getPath('userData'), 'notification-settings.json')

/**
 * Default notification settings
 */
const DEFAULT_SETTINGS = {
  enabled: true,
  sound: true,
  statusChanges: true,
  rejections: true,
  approvals: true,
  newComments: true,
  syncComplete: false,
  userLogins: false
}

/**
 * Registers notification IPC handlers
 * @param {Electron.IpcMain} ipcMain - Electron IPC main instance
 * @param {Object} deps - Dependencies object
 * @param {Object} deps.notifications - Notifications module
 */
function registerNotificationHandlers(ipcMain, deps) {
  const { notifications } = deps

  // Get notification settings
  ipcMain.handle('get-notification-settings', async () => {
    try {
      if (fs.existsSync(notificationSettingsPath)) {
        const data = fs.readFileSync(notificationSettingsPath, 'utf8')
        return JSON.parse(data)
      }
      return DEFAULT_SETTINGS
    } catch (error) {
      console.error('Get notification settings error:', error)
      return DEFAULT_SETTINGS
    }
  })

  // Update notification settings
  ipcMain.handle('update-notification-settings', async (event, settings) => {
    try {
      fs.writeFileSync(notificationSettingsPath, JSON.stringify(settings, null, 2))
      return { success: true }
    } catch (error) {
      console.error('Update notification settings error:', error)
      return { success: false, error: error.message }
    }
  })

  // Show notification
  ipcMain.handle('show-notification', async (event, options) => {
    try {
      // Check if notifications are supported
      if (!Notification.isSupported()) {
        return { success: false, error: 'Notifications not supported' }
      }

      notifications.showNotification(options)
      return { success: true }
    } catch (error) {
      console.error('Show notification error:', error)
      return { success: false, error: error.message }
    }
  })

  // Test notification
  ipcMain.handle('test-notification', async () => {
    try {
      if (!Notification.isSupported()) {
        return { success: false, error: 'Notifications not supported' }
      }

      notifications.testNotification()
      return { success: true }
    } catch (error) {
      console.error('Test notification error:', error)
      return { success: false, error: error.message }
    }
  })

  // Notify site status change
  ipcMain.handle('notify-status-change', async (event, { siteName, siteId, oldStatus, newStatus }) => {
    try {
      notifications.notifySiteStatusChange(siteName, siteId, oldStatus, newStatus)
      return { success: true }
    } catch (error) {
      console.error('Notify status change error:', error)
      return { success: false, error: error.message }
    }
  })

  // Notify rejection
  ipcMain.handle('notify-rejection', async (event, { siteName, siteId, department, reason }) => {
    try {
      notifications.notifyRejection(siteName, siteId, department, reason)
      return { success: true }
    } catch (error) {
      console.error('Notify rejection error:', error)
      return { success: false, error: error.message }
    }
  })

  // Notify approval
  ipcMain.handle('notify-approval', async (event, { siteName, siteId }) => {
    try {
      notifications.notifyApproval(siteName, siteId)
      return { success: true }
    } catch (error) {
      console.error('Notify approval error:', error)
      return { success: false, error: error.message }
    }
  })

  // Notify sync complete
  ipcMain.handle('notify-sync-complete', async (event, { recordsSynced, newRejections }) => {
    try {
      notifications.notifySyncComplete(recordsSynced, newRejections)
      return { success: true }
    } catch (error) {
      console.error('Notify sync complete error:', error)
      return { success: false, error: error.message }
    }
  })
}

module.exports = { registerNotificationHandlers }
