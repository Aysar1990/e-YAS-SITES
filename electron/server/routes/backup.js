/**
 * Backup Routes
 */

const express = require('express')

function createBackupRoutes(authenticateToken) {
  const router = express.Router()

  // Create backup
  router.post('/', authenticateToken, (req, res) => {
    try {
      const { description } = req.body
      res.json({
        success: true,
        message: 'Backup request received. Full backup functionality available in desktop mode.',
        backup: {
          name: `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.db`,
          description: description || 'Manual backup',
          createdAt: new Date().toISOString()
        }
      })
    } catch (error) {
      console.error('[API] Create backup error:', error)
      res.status(500).json({ error: error.message })
    }
  })

  // Get backups list
  router.get('/', authenticateToken, (req, res) => {
    try {
      res.json([])
    } catch (error) {
      console.error('[API] Get backups error:', error)
      res.status(500).json({ error: error.message })
    }
  })

  // Restore backup
  router.post('/restore/:name', authenticateToken, (req, res) => {
    try {
      res.json({
        success: false,
        message: 'Restore functionality is only available in desktop mode'
      })
    } catch (error) {
      console.error('[API] Restore backup error:', error)
      res.status(500).json({ error: error.message })
    }
  })

  // Delete backup
  router.delete('/:name', authenticateToken, (req, res) => {
    try {
      res.json({
        success: false,
        message: 'Delete functionality is only available in desktop mode'
      })
    } catch (error) {
      console.error('[API] Delete backup error:', error)
      res.status(500).json({ error: error.message })
    }
  })

  return router
}

// Backup settings routes
function createBackupSettingsRoutes(authenticateToken) {
  const router = express.Router()

  // Get backup settings
  router.get('/', authenticateToken, (req, res) => {
    try {
      res.json({
        enabled: true,
        frequency: 'daily',
        keepDays: 30,
        lastBackup: null
      })
    } catch (error) {
      console.error('[API] Get backup settings error:', error)
      res.status(500).json({ error: error.message })
    }
  })

  // Update backup settings
  router.put('/', authenticateToken, (req, res) => {
    try {
      res.json({
        ...req.body,
        message: 'Settings update received. Full functionality available in desktop mode.'
      })
    } catch (error) {
      console.error('[API] Update backup settings error:', error)
      res.status(500).json({ error: error.message })
    }
  })

  return router
}

module.exports = { createBackupRoutes, createBackupSettingsRoutes }
