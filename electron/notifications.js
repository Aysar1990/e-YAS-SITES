const { Notification } = require('electron')
const path = require('path')

// Default notification icon
const getIcon = () => {
  try {
    return path.join(__dirname, '../public/icon.png')
  } catch {
    return undefined
  }
}

/**
 * Show a desktop notification
 * @param {Object} options - Notification options
 * @param {string} options.title - Notification title
 * @param {string} options.body - Notification body
 * @param {string} options.icon - Optional icon path
 * @param {boolean} options.silent - Whether to play sound
 * @param {Function} options.onClick - Click handler
 */
function showNotification({ title, body, icon, silent = false, onClick }) {
  // Check if notifications are supported
  if (!Notification.isSupported()) {
    console.log('[Notifications] Not supported on this platform')
    return null
  }

  const notification = new Notification({
    title: title || 'TSSR Monitor',
    body: body || '',
    icon: icon || getIcon(),
    silent: silent
  })

  if (onClick && typeof onClick === 'function') {
    notification.on('click', onClick)
  }

  notification.show()

  return notification
}

/**
 * Notify when a site status changes
 */
function notifySiteStatusChange(siteName, siteId, oldStatus, newStatus) {
  return showNotification({
    title: '🔔 Site Status Changed',
    body: `${siteId} (${siteName})\n${oldStatus} → ${newStatus}`
  })
}

/**
 * Notify when a site is rejected
 */
function notifyRejection(siteName, siteId, department, reason) {
  return showNotification({
    title: '❌ Site Rejected',
    body: `${siteId} (${siteName})\nRejected by ${department}${reason ? `: ${reason}` : ''}`
  })
}

/**
 * Notify when a site is approved
 */
function notifyApproval(siteName, siteId) {
  return showNotification({
    title: '✅ Site Approved',
    body: `${siteId} (${siteName})\nhas been approved!`
  })
}

/**
 * Notify when data sync is complete
 */
function notifySyncComplete(recordsSynced, newRejections = 0) {
  let body = `${recordsSynced} records synced`
  if (newRejections > 0) {
    body += `\n${newRejections} new rejections found`
  }

  return showNotification({
    title: '🔄 Data Sync Complete',
    body
  })
}

/**
 * Notify when a new comment is added
 */
function notifyNewComment(siteName, siteId, commentBy) {
  return showNotification({
    title: '💬 New Comment',
    body: `${siteId} (${siteName})\nComment by ${commentBy}`
  })
}

/**
 * Notify when a user logs in (for admin)
 */
function notifyUserLogin(username, role) {
  return showNotification({
    title: '👤 User Login',
    body: `${username} (${role}) logged in`
  })
}

/**
 * Notify for custom messages
 */
function notifyCustom(title, body, options = {}) {
  return showNotification({
    title,
    body,
    ...options
  })
}

/**
 * Test notification
 */
function testNotification() {
  return showNotification({
    title: '🔔 Test Notification',
    body: 'Notifications are working correctly!'
  })
}

module.exports = {
  showNotification,
  notifySiteStatusChange,
  notifyRejection,
  notifyApproval,
  notifySyncComplete,
  notifyNewComment,
  notifyUserLogin,
  notifyCustom,
  testNotification
}
