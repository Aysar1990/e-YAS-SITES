/**
 * Backup IPC handlers
 * Handles: create-backup, get-backups, restore-backup, delete-backup,
 *          get-backup-settings, update-backup-settings, clean-old-backups
 * @module electron/ipc/backupHandlers
 */

/**
 * Default backup settings
 */
const DEFAULT_BACKUP_SETTINGS = {
  enabled: true,
  frequency: 'daily',
  keepDays: 30,
  lastBackup: null
}

/**
 * Registers backup IPC handlers
 * @param {Electron.IpcMain} ipcMain - Electron IPC main instance
 * @param {Object} deps - Dependencies object
 * @param {Function} deps.getBackupService - Function to get backup service instance
 */
function registerBackupHandlers(ipcMain, deps) {
  const { getBackupService } = deps

  ipcMain.handle('create-backup', async (event, description) => {
    try {
      const backupService = getBackupService()
      if (!backupService) {
        return { success: false, error: 'Backup service not initialized' }
      }
      return backupService.createBackup(description)
    } catch (error) {
      console.error('Create backup error:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('get-backups', async () => {
    try {
      const backupService = getBackupService()
      if (!backupService) {
        return []
      }
      return backupService.getBackups()
    } catch (error) {
      console.error('Get backups error:', error)
      return []
    }
  })

  ipcMain.handle('restore-backup', async (event, backupName) => {
    try {
      const backupService = getBackupService()
      if (!backupService) {
        return { success: false, error: 'Backup service not initialized' }
      }
      return backupService.restoreBackup(backupName)
    } catch (error) {
      console.error('Restore backup error:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('delete-backup', async (event, backupName) => {
    try {
      const backupService = getBackupService()
      if (!backupService) {
        return { success: false, error: 'Backup service not initialized' }
      }
      return backupService.deleteBackup(backupName)
    } catch (error) {
      console.error('Delete backup error:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('get-backup-settings', async () => {
    try {
      const backupService = getBackupService()
      if (!backupService) {
        return DEFAULT_BACKUP_SETTINGS
      }
      return backupService.getSettings()
    } catch (error) {
      console.error('Get backup settings error:', error)
      return DEFAULT_BACKUP_SETTINGS
    }
  })

  ipcMain.handle('update-backup-settings', async (event, settings) => {
    try {
      const backupService = getBackupService()
      if (!backupService) {
        return { success: false, error: 'Backup service not initialized' }
      }
      return backupService.updateSettings(settings)
    } catch (error) {
      console.error('Update backup settings error:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('clean-old-backups', async () => {
    try {
      const backupService = getBackupService()
      if (!backupService) {
        return { success: false, error: 'Backup service not initialized' }
      }
      return backupService.cleanOldBackups()
    } catch (error) {
      console.error('Clean old backups error:', error)
      return { success: false, error: error.message }
    }
  })
}

module.exports = { registerBackupHandlers }
