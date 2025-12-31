/**
 * Notification Service
 * Handles desktop notifications for both Electron and browser environments
 */

class NotificationService {
  /**
   * Show a notification
   * @param {string} title - Notification title
   * @param {string} body - Notification body
   * @param {Object} options - Additional options
   */
  static async notify(title, body, options = {}) {
    // Try Electron notification first
    if (window.electron?.showNotification) {
      try {
        return await window.electron.showNotification({ title, body, ...options })
      } catch (error) {
        console.error('Electron notification failed:', error)
      }
    }

    // Fallback to browser notification
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        return new Notification(title, { body, ...options })
      }

      if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission()
        if (permission === 'granted') {
          return new Notification(title, { body, ...options })
        }
      }
    }

    // Console fallback
    console.log(`[Notification] ${title}: ${body}`)
    return null
  }

  /**
   * Request notification permission
   */
  static async requestPermission() {
    if ('Notification' in window) {
      return await Notification.requestPermission()
    }
    return 'denied'
  }

  /**
   * Check if notifications are enabled
   */
  static async isEnabled() {
    const settings = await this.getSettings()
    return settings?.enabled !== false
  }

  /**
   * Get notification settings
   */
  static async getSettings() {
    try {
      if (window.electron?.getNotificationSettings) {
        return await window.electron.getNotificationSettings()
      }
      // Fallback to localStorage
      const saved = localStorage.getItem('notificationSettings')
      return saved ? JSON.parse(saved) : this.getDefaultSettings()
    } catch (error) {
      console.error('Failed to get notification settings:', error)
      return this.getDefaultSettings()
    }
  }

  /**
   * Update notification settings
   */
  static async updateSettings(settings) {
    try {
      if (window.electron?.updateNotificationSettings) {
        return await window.electron.updateNotificationSettings(settings)
      }
      // Fallback to localStorage
      localStorage.setItem('notificationSettings', JSON.stringify(settings))
      return { success: true }
    } catch (error) {
      console.error('Failed to update notification settings:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get default settings
   */
  static getDefaultSettings() {
    return {
      enabled: true,
      sound: true,
      statusChanges: true,
      rejections: true,
      approvals: true,
      newComments: true,
      syncComplete: false,
      userLogins: false
    }
  }

  /**
   * Notify site status change
   */
  static async notifyStatusChange(siteName, siteId, oldStatus, newStatus) {
    const settings = await this.getSettings()
    if (!settings.enabled || !settings.statusChanges) return

    return this.notify(
      '🔔 Site Status Changed',
      `${siteId} (${siteName})\n${oldStatus} → ${newStatus}`,
      { silent: !settings.sound }
    )
  }

  /**
   * Notify rejection
   */
  static async notifyRejection(siteName, siteId, department, reason = '') {
    const settings = await this.getSettings()
    if (!settings.enabled || !settings.rejections) return

    return this.notify(
      '❌ Site Rejected',
      `${siteId} (${siteName})\nRejected by ${department}${reason ? `: ${reason}` : ''}`,
      { silent: !settings.sound }
    )
  }

  /**
   * Notify approval
   */
  static async notifyApproval(siteName, siteId) {
    const settings = await this.getSettings()
    if (!settings.enabled || !settings.approvals) return

    return this.notify(
      '✅ Site Approved',
      `${siteId} (${siteName})\nhas been approved!`,
      { silent: !settings.sound }
    )
  }

  /**
   * Notify sync complete
   */
  static async notifySyncComplete(recordsSynced, newRejections = 0) {
    const settings = await this.getSettings()
    if (!settings.enabled || !settings.syncComplete) return

    let body = `${recordsSynced} records synced`
    if (newRejections > 0) {
      body += `\n${newRejections} new rejections found`
    }

    return this.notify('🔄 Data Sync Complete', body, { silent: !settings.sound })
  }

  /**
   * Notify new comment
   */
  static async notifyNewComment(siteName, siteId, commentBy) {
    const settings = await this.getSettings()
    if (!settings.enabled || !settings.newComments) return

    return this.notify(
      '💬 New Comment',
      `${siteId} (${siteName})\nComment by ${commentBy}`,
      { silent: !settings.sound }
    )
  }

  /**
   * Test notification
   */
  static async testNotification() {
    if (window.electron?.testNotification) {
      return await window.electron.testNotification()
    }
    return this.notify(
      '🔔 Test Notification',
      'Notifications are working correctly!'
    )
  }
}

export default NotificationService
