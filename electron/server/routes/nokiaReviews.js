/**
 * Nokia Reviews (Ghirbal) Routes
 */

const express = require('express')
const WS_EVENTS = require('../utils/wsEvents')

function createNokiaReviewsRoutes(db, authenticateToken, broadcast, logAction) {
  const router = express.Router()

  // Get all Nokia reviews
  router.get('/', authenticateToken, (req, res) => {
    try {
      const reviews = db.prepare('SELECT * FROM nokia_reviews ORDER BY updated_at DESC').all()
      res.json(reviews)
    } catch (error) {
      console.error('[API] Get nokia reviews error:', error)
      res.status(500).json({ error: 'Server error' })
    }
  })

  // Get Nokia review by site_id
  router.get('/:siteId', authenticateToken, (req, res) => {
    try {
      const { siteId } = req.params
      const review = db.prepare('SELECT * FROM nokia_reviews WHERE site_id = ?').get(siteId)
      if (!review) {
        return res.status(404).json({ error: 'Review not found' })
      }
      res.json(review)
    } catch (error) {
      console.error('[API] Get nokia review error:', error)
      res.status(500).json({ error: 'Server error' })
    }
  })

  // Create/Update Nokia review (upsert)
  router.post('/', authenticateToken, (req, res) => {
    try {
      const { site_id, checked, note, rejection_type, rejection_status, rejection_comment } = req.body
      const updated_by = req.user.id

      if (!site_id) {
        return res.status(400).json({ error: 'site_id is required' })
      }

      const existing = db.prepare('SELECT id FROM nokia_reviews WHERE site_id = ?').get(site_id)

      if (existing) {
        db.prepare(`
          UPDATE nokia_reviews SET
            checked = COALESCE(?, checked),
            note = COALESCE(?, note),
            rejection_type = COALESCE(?, rejection_type),
            rejection_status = COALESCE(?, rejection_status),
            rejection_comment = COALESCE(?, rejection_comment),
            updated_by = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE site_id = ?
        `).run(checked, note, rejection_type, rejection_status, rejection_comment, updated_by, site_id)
      } else {
        db.prepare(`
          INSERT INTO nokia_reviews (site_id, checked, note, rejection_type, rejection_status, rejection_comment, updated_by)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(site_id, checked || 0, note, rejection_type, rejection_status, rejection_comment, updated_by)
      }

      broadcast(WS_EVENTS.NOKIA_REVIEW_UPDATED, {
        site_id,
        checked,
        note,
        rejection_type,
        rejection_status,
        rejection_comment,
        updated_by: req.user.username,
        updated_at: new Date().toISOString()
      })

      res.json({ success: true })
    } catch (error) {
      console.error('[API] Upsert nokia review error:', error)
      res.status(500).json({ error: 'Server error' })
    }
  })

  // Update Nokia review check status
  router.put('/:siteId/check', authenticateToken, (req, res) => {
    try {
      const { siteId } = req.params
      const { checked, note } = req.body
      const updated_by = req.user.id
      const ip_address = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress
      const user_agent = req.headers['user-agent']

      // Get old value for audit
      const oldReview = db.prepare('SELECT checked, note FROM nokia_reviews WHERE site_id = ?').get(siteId)
      const existing = db.prepare('SELECT id FROM nokia_reviews WHERE site_id = ?').get(siteId)

      if (existing) {
        db.prepare(`
          UPDATE nokia_reviews SET
            checked = ?,
            note = COALESCE(?, note),
            updated_by = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE site_id = ?
        `).run(checked ? 1 : 0, note, updated_by, siteId)
      } else {
        db.prepare(`
          INSERT INTO nokia_reviews (site_id, checked, note, updated_by)
          VALUES (?, ?, ?, ?)
        `).run(siteId, checked ? 1 : 0, note, updated_by)
      }

      if (logAction) {
        logAction(
          req.user.id,
          req.user.username,
          checked ? 'CHECK_SITE' : 'UNCHECK_SITE',
          'site',
          siteId,
          oldReview || null,
          { checked: checked ? 1 : 0, note },
          ip_address,
          user_agent
        )
      }

      broadcast(WS_EVENTS.NOKIA_REVIEW_UPDATED, {
        site_id: siteId,
        checked: checked ? 1 : 0,
        note,
        updated_by: req.user.username,
        updated_at: new Date().toISOString(),
        action: 'check_updated'
      })

      res.json({ success: true })
    } catch (error) {
      console.error('[API] Update nokia review check error:', error)
      res.status(500).json({ error: 'Server error' })
    }
  })

  // Update Nokia rejection
  router.put('/:siteId/rejection', authenticateToken, (req, res) => {
    try {
      const { siteId } = req.params
      const { rejection_type, rejection_status, rejection_comment } = req.body
      const updated_by = req.user.id

      const existing = db.prepare('SELECT id FROM nokia_reviews WHERE site_id = ?').get(siteId)

      if (existing) {
        db.prepare(`
          UPDATE nokia_reviews SET
            rejection_type = ?,
            rejection_status = ?,
            rejection_comment = ?,
            updated_by = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE site_id = ?
        `).run(rejection_type, rejection_status, rejection_comment, updated_by, siteId)
      } else {
        db.prepare(`
          INSERT INTO nokia_reviews (site_id, rejection_type, rejection_status, rejection_comment, updated_by)
          VALUES (?, ?, ?, ?, ?)
        `).run(siteId, rejection_type, rejection_status, rejection_comment, updated_by)
      }

      broadcast(WS_EVENTS.NOKIA_REVIEW_UPDATED, {
        site_id: siteId,
        rejection_type,
        rejection_status,
        rejection_comment,
        updated_by: req.user.username,
        updated_at: new Date().toISOString(),
        action: 'rejection_updated'
      })

      res.json({ success: true })
    } catch (error) {
      console.error('[API] Update nokia rejection error:', error)
      res.status(500).json({ error: 'Server error' })
    }
  })

  return router
}

// Ghirbal Sites Routes
function createGhirbalRoutes(db, authenticateToken) {
  const router = express.Router()

  // Get Ghirbal sites (sites under Nokia review statuses)
  router.get('/', authenticateToken, (req, res) => {
    try {
      const { phase } = req.query

      let query = `
        SELECT sc.*, nr.checked, nr.note, nr.rejection_type, nr.rejection_status, nr.rejection_comment
        FROM sites_cache sc
        LEFT JOIN nokia_reviews nr ON sc.site_id = nr.site_id
        WHERE sc.tssr_overall_status IN (
          'TSSR Under Nokia NPO Validation',
          'TSSR Under Nokia GSD Validation',
          'TSSR Under Subcon validation',
          'Site not Surveyed'
        )
      `
      const params = []

      if (phase && phase !== 'ALL') {
        query += ' AND sc.phase_name = ?'
        params.push(phase)
      }

      query += ' ORDER BY sc.site_id ASC'

      const sites = db.prepare(query).all(...params)
      res.json(sites)
    } catch (error) {
      console.error('[API] Get ghirbal sites error:', error)
      res.status(500).json({ error: 'Server error' })
    }
  })

  return router
}

// Checked Sites Routes
function createCheckedSitesRoutes(db, authenticateToken) {
  const router = express.Router()

  router.get('/', authenticateToken, (req, res) => {
    try {
      const { phase } = req.query

      let query = `
        SELECT sc.*, nr.checked, nr.note, nr.rejection_type, nr.rejection_status, nr.rejection_comment
        FROM sites_cache sc
        INNER JOIN nokia_reviews nr ON sc.site_id = nr.site_id
        WHERE nr.checked = 1
      `
      const params = []

      if (phase && phase !== 'ALL') {
        query += ' AND sc.phase_name = ?'
        params.push(phase)
      }

      query += ' ORDER BY nr.updated_at DESC'

      const sites = db.prepare(query).all(...params)
      res.json(sites)
    } catch (error) {
      console.error('[API] Get checked sites error:', error)
      res.status(500).json({ error: 'Server error' })
    }
  })

  return router
}

module.exports = {
  createNokiaReviewsRoutes,
  createGhirbalRoutes,
  createCheckedSitesRoutes
}
