/**
 * Helper utilities for the Electron main process
 * @module electron/utils/helpers
 */

/**
 * Logs an action to the audit_logs table
 * @param {Object} db - Database instance
 * @param {number|null} userId - User ID performing the action
 * @param {string} username - Username performing the action
 * @param {string} action - Action type (e.g., 'LOGIN', 'CREATE_USER')
 * @param {string} entityType - Type of entity being acted upon (e.g., 'user', 'site')
 * @param {string|null} entityId - ID of the entity
 * @param {Object|null} oldValue - Previous value before the action
 * @param {Object|null} newValue - New value after the action
 * @param {string|null} ipAddress - IP address of the request
 * @param {string|null} userAgent - User agent string
 */
function logAction(db, userId, username, action, entityType, entityId, oldValue, newValue, ipAddress = null, userAgent = null) {
  try {
    db.prepare(`
      INSERT INTO audit_logs (user_id, username, action, entity_type, entity_id, old_value, new_value, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      username,
      action,
      entityType,
      entityId,
      oldValue ? JSON.stringify(oldValue) : null,
      newValue ? JSON.stringify(newValue) : null,
      ipAddress,
      userAgent
    )
    console.log(`📝 Audit: ${action} by ${username} on ${entityType}:${entityId}`)
  } catch (error) {
    console.error('Failed to log action:', error)
  }
}

/**
 * Creates a bound logAction function with the db instance
 * @param {Object} db - Database instance
 * @returns {Function} Bound logAction function
 */
function createLogAction(db) {
  return (userId, username, action, entityType, entityId, oldValue, newValue, ipAddress, userAgent) => {
    logAction(db, userId, username, action, entityType, entityId, oldValue, newValue, ipAddress, userAgent)
  }
}

module.exports = {
  logAction,
  createLogAction
}
