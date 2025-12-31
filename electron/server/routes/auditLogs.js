/**
 * Audit Logs Routes
 */

const express = require('express')

function createAuditLogAction(db) {
  return (userId, username, action, entityType, entityId, oldValue, newValue, ipAddress, userAgent) => {
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
      console.log(`[Audit] ${action} by ${username} on ${entityType}:${entityId}`)
    } catch (error) {
      console.error('[Audit] Failed to log action:', error)
    }
  }
}

function createAuditLogsRoutes(db, authenticateToken, logAction) {
  const router = express.Router()

  // Create audit log entry
  router.post('/', authenticateToken, (req, res) => {
    try {
      const { action, entity_type, entity_id, old_value, new_value } = req.body
      const user = req.user
      const ip_address = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress
      const user_agent = req.headers['user-agent']

      if (!action) {
        return res.status(400).json({ error: 'Action is required' })
      }

      logAction(user.id, user.username, action, entity_type, entity_id, old_value, new_value, ip_address, user_agent)

      res.json({ success: true })
    } catch (error) {
      console.error('[API] Create audit log error:', error)
      res.status(500).json({ error: 'Server error' })
    }
  })

  // Get audit logs with filters
  router.get('/', authenticateToken, (req, res) => {
    try {
      const { limit = 100, offset = 0, user_id, action, entity_type, startDate, endDate } = req.query

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
      params.push(parseInt(limit), parseInt(offset))

      const logs = db.prepare(query).all(...params)

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

      const totalResult = db.prepare(countQuery).get(...countParams)

      res.json({
        logs,
        total: totalResult?.total || 0,
        limit: parseInt(limit),
        offset: parseInt(offset)
      })
    } catch (error) {
      console.error('[API] Get audit logs error:', error)
      res.status(500).json({ error: 'Server error' })
    }
  })

  // Clear old audit logs (admin only)
  router.delete('/', authenticateToken, (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' })
      }

      const { olderThanDays = 90 } = req.query

      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(olderThanDays))
      const cutoffDateStr = cutoffDate.toISOString()

      const result = db.prepare('DELETE FROM audit_logs WHERE created_at < ?').run(cutoffDateStr)

      logAction(
        req.user.id,
        req.user.username,
        'CLEAR_AUDIT_LOGS',
        'audit_logs',
        null,
        { olderThanDays: parseInt(olderThanDays) },
        { deletedCount: result.changes },
        req.ip,
        req.headers['user-agent']
      )

      res.json({
        success: true,
        deletedCount: result.changes
      })
    } catch (error) {
      console.error('[API] Clear audit logs error:', error)
      res.status(500).json({ error: 'Server error' })
    }
  })

  // Get unique action types (for filters)
  router.get('/actions', authenticateToken, (req, res) => {
    try {
      const actions = db.prepare('SELECT DISTINCT action FROM audit_logs ORDER BY action').all()
      res.json(actions.map(a => a.action))
    } catch (error) {
      console.error('[API] Get audit action types error:', error)
      res.status(500).json({ error: 'Server error' })
    }
  })

  // Get unique entity types (for filters)
  router.get('/entity-types', authenticateToken, (req, res) => {
    try {
      const types = db.prepare('SELECT DISTINCT entity_type FROM audit_logs WHERE entity_type IS NOT NULL ORDER BY entity_type').all()
      res.json(types.map(t => t.entity_type))
    } catch (error) {
      console.error('[API] Get audit entity types error:', error)
      res.status(500).json({ error: 'Server error' })
    }
  })

  return router
}

module.exports = { createAuditLogsRoutes, createAuditLogAction }
