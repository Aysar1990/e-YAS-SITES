/**
 * Sites Routes
 */

const express = require('express')
const calculations = require('../../services/calculations')

function createSitesRoutes(db, authenticateToken) {
  const router = express.Router()

  // Get phases
  router.get('/phases', authenticateToken, (req, res) => {
    try {
      const phases = db.prepare(
        'SELECT phase_name, COUNT(*) as count FROM sites WHERE phase_name IS NOT NULL GROUP BY phase_name ORDER BY phase_name'
      ).all()
      res.json(phases)
    } catch (error) {
      res.status(500).json({ error: 'Server error' })
    }
  })

  // Get sites
  router.get('/', authenticateToken, (req, res) => {
    try {
      const { phase, contractor } = req.query
      const user = req.user

      let query = 'SELECT * FROM sites WHERE 1=1'
      const params = []

      if (phase && phase !== 'ALL') {
        query += ' AND phase_name = ?'
        params.push(phase)
      }

      if (user.role === 'contractor' && user.contractor_name) {
        query += ' AND tssr_subcon = ?'
        params.push(user.contractor_name)
      } else if (contractor) {
        query += ' AND tssr_subcon = ?'
        params.push(contractor)
      }

      const sites = db.prepare(query).all(...params)
      res.json(sites)
    } catch (error) {
      res.status(500).json({ error: 'Server error' })
    }
  })

  // Get single site
  router.get('/:siteId', authenticateToken, (req, res) => {
    try {
      const { siteId } = req.params
      const { phase } = req.query

      let query = 'SELECT * FROM sites WHERE site_id = ?'
      const params = [siteId]

      if (phase && phase !== 'ALL') {
        query += ' AND phase_name = ?'
        params.push(phase)
      }

      const site = db.prepare(query).get(...params)
      if (!site) return res.status(404).json({ error: 'Site not found' })
      res.json(site)
    } catch (error) {
      res.status(500).json({ error: 'Server error' })
    }
  })

  // Update site with validation and workflow checks (Day 12)
  router.put('/:siteId', authenticateToken, (req, res) => {
    try {
      const { siteId } = req.params
      const { phase } = req.query
      const updates = req.body
      const username = req.user?.username || 'api'

      console.log(`📝 PUT /sites/${siteId}: phase=${phase}`)

      // 1. Get current site
      let query = 'SELECT * FROM sites WHERE site_id = ?'
      const queryParams = [siteId]
      if (phase && phase !== 'ALL') {
        query += ' AND phase_name = ?'
        queryParams.push(phase)
      }

      const currentSite = db.prepare(query).get(...queryParams)
      if (!currentSite) {
        return res.status(404).json({ success: false, error: 'Site not found' })
      }

      // 2. Validate updates
      const validation = calculations.validateSite({ ...currentSite, ...updates })
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          validationErrors: validation.errors,
          warnings: validation.warnings
        })
      }

      // 3. Check workflow rules
      const workflowWarnings = []
      const statusFields = ['ti_status', 'rf_plan_status', 'rf_opt_status', 'civil_status', 'mw_status', 'nokia_npo_status']

      for (const field of statusFields) {
        if (updates[field] && updates[field] !== currentSite[field]) {
          const deptKey = calculations.getDepartmentByField(field)?.key
          if (deptKey) {
            const workflowCheck = calculations.validateStatusChange(currentSite, deptKey, updates[field])
            if (!workflowCheck.allowed) {
              workflowWarnings.push(workflowCheck.reason)
            }
          }
        }
      }

      // 4. Run auto-calculations
      const calculatedUpdates = calculations.recalculateAll(currentSite, updates)

      // 5. Build and execute update
      const allowedFields = [
        'final_site_name', 'governorate', 'lat', 'lon', 'height_m',
        'ti_status', 'ti_comment', 'rf_plan_status', 'rf_plan_comment',
        'rf_opt_status', 'rf_opt_comment', 'civil_status', 'civil_comment',
        'mw_status', 'mw_comment', 'nokia_npo_status', 'nokia_npo_comment',
        'tssr_overall_status', 'tssr_status_date', 'tssr_subcon',
        'action_age', 'tssr_ready', 'version', 'part_of',
        'ts_survey_ac', 'rfi_status', 'remarks', 'priority'
      ]

      const finalUpdates = {
        ...updates,
        action_age: calculatedUpdates.action_age,
        tssr_overall_status: calculatedUpdates.tssr_overall_status,
        updated_by: username,
        updated_at: new Date().toISOString()
      }

      const setClauses = []
      const values = []

      for (const [key, value] of Object.entries(finalUpdates)) {
        if (allowedFields.includes(key) || key === 'updated_by' || key === 'updated_at') {
          if (value !== undefined) {
            setClauses.push(`${key} = ?`)
            values.push(value)
          }
        }
      }

      if (setClauses.length === 0) {
        return res.status(400).json({ success: false, error: 'No valid fields to update' })
      }

      // Build WHERE clause
      let whereClause = 'WHERE site_id = ?'
      values.push(siteId)
      if (phase && phase !== 'ALL') {
        whereClause += ' AND phase_name = ?'
        values.push(phase)
      }

      const updateSql = `UPDATE sites SET ${setClauses.join(', ')} ${whereClause}`
      const result = db.prepare(updateSql).run(...values)

      if (result.changes === 0) {
        return res.status(500).json({ success: false, error: 'Failed to update site' })
      }

      // Get updated site
      const updatedSite = db.prepare(query).get(...queryParams)

      // CRITICAL: Save to disk immediately after update
      const sqliteAdapter = db.getSQLiteAdapter()
      if (sqliteAdapter && sqliteAdapter.save) {
        sqliteAdapter.save()
        console.log('💾 SQLite data saved after site update')
      }

      console.log(`✅ Site updated via API: ${siteId}`)

      res.json({
        success: true,
        site: updatedSite,
        warnings: [...(validation.warnings || []), ...workflowWarnings],
        calculated: {
          actionAge: calculatedUpdates.action_age,
          overallStatus: calculatedUpdates.tssr_overall_status
        }
      })
    } catch (error) {
      console.error('Update site error:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  return router
}

module.exports = createSitesRoutes
