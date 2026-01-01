/**
 * Audit log IPC handlers
 * Handles: log-audit, get-audit-logs, clear-audit-logs, get-audit-action-types
 * @module electron/ipc/auditHandlers
 */

/**
 * Registers audit log IPC handlers
 * @param {Electron.IpcMain} ipcMain - Electron IPC main instance
 * @param {Object} deps - Dependencies object
 * @param {Object} deps.db - Database instance
 * @param {Function} deps.logAction - Audit logging function
 */
function registerAuditHandlers(ipcMain, deps) {
  const { db, logAction } = deps

  // Log audit entry
  ipcMain.handle('log-audit', async (event, data) => {
    try {
      const { user_id, username, action, entity_type, entity_id, old_value, new_value, ip_address, user_agent } = data

      await logAction(user_id, username, action, entity_type, entity_id, old_value, new_value, ip_address, user_agent)

      return { success: true }
    } catch (error) {
      console.error('Log audit error:', error)
      return { success: false, error: error.message }
    }
  })

  // Get audit logs with filters
  ipcMain.handle('get-audit-logs', async (event, filters = {}) => {
    try {
      const { limit = 100, offset = 0, user_id, action, entity_type, startDate, endDate } = filters

      let query = 'SELECT * FROM audit_logs WHERE 1=1'
      const params = []

      if (user_id) {
        query += ' AND user_id = ?'
        params.push(user_id)
      }

      if (action) {
        query += ' AND action = ?'
        params.push(action)
      }

      if (entity_type) {
        query += ' AND entity_type = ?'
        params.push(entity_type)
      }

      if (startDate) {
        query += ' AND created_at >= ?'
        params.push(startDate)
      }

      if (endDate) {
        query += ' AND created_at <= ?'
        params.push(endDate)
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
      params.push(limit, offset)

      const logs = await db.prepare(query).all(...params)

      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) as total FROM audit_logs WHERE 1=1'
      const countParams = []

      if (user_id) {
        countQuery += ' AND user_id = ?'
        countParams.push(user_id)
      }
      if (action) {
        countQuery += ' AND action = ?'
        countParams.push(action)
      }
      if (entity_type) {
        countQuery += ' AND entity_type = ?'
        countParams.push(entity_type)
      }
      if (startDate) {
        countQuery += ' AND created_at >= ?'
        countParams.push(startDate)
      }
      if (endDate) {
        countQuery += ' AND created_at <= ?'
        countParams.push(endDate)
      }

      const totalResult = await db.prepare(countQuery).get(...countParams)

      return {
        success: true,
        logs: logs || [],
        total: totalResult?.total || 0,
        limit,
        offset
      }
    } catch (error) {
      console.error('Get audit logs error:', error)
      return { success: false, error: error.message }
    }
  })

  // Clear old audit logs
  ipcMain.handle('clear-audit-logs', async (event, olderThanDays = 90) => {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)
      const cutoffDateStr = cutoffDate.toISOString()

      const result = await db.prepare('DELETE FROM audit_logs WHERE created_at < ?').run(cutoffDateStr)

      console.log(`🗑️ Cleared ${result?.changes || 0} audit logs older than ${olderThanDays} days`)

      return {
        success: true,
        deletedCount: result?.changes || 0
      }
    } catch (error) {
      console.error('Clear audit logs error:', error)
      return { success: false, error: error.message }
    }
  })

  // Get unique action types (for filters)
  ipcMain.handle('get-audit-action-types', async () => {
    try {
      const actions = await db.prepare('SELECT DISTINCT action FROM audit_logs ORDER BY action').all()
      return {
        success: true,
        actions: Array.isArray(actions) ? actions.map(a => a.action) : []
      }
    } catch (error) {
      console.error('Get audit action types error:', error)
      return { success: false, error: error.message }
    }
  })
}

module.exports = { registerAuditHandlers }
