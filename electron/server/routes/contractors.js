/**
 * Contractors Routes
 */

const express = require('express')

function createContractorsRoutes(db, authenticateToken) {
  const router = express.Router()

  // Get contractors with detailed stats (for dashboard)
  router.get('/detailed', authenticateToken, (req, res) => {
    try {
      const { phase } = req.query
      let whereClause = "WHERE tssr_subcon IS NOT NULL AND tssr_subcon != ''"
      const params = []

      if (phase && phase !== 'ALL') {
        whereClause += ' AND phase_name = ?'
        params.push(phase)
      }

      // Get list of contractors
      const contractorNames = db.prepare(`
        SELECT DISTINCT tssr_subcon as name
        FROM sites_cache ${whereClause}
        ORDER BY name
      `).all(...params)

      // Get detailed stats for each contractor
      const contractors = contractorNames.map(c => {
        const contractorWhere = whereClause + ' AND tssr_subcon = ?'
        const contractorParams = [...params, c.name]

        // Get totals
        const totals = db.prepare(`
          SELECT
            COUNT(*) as totalSites,
            SUM(CASE WHEN tssr_overall_status = 'Approved' THEN 1 ELSE 0 END) as approved,
            SUM(CASE WHEN rfi_status IS NOT NULL AND rfi_status != '' THEN 1 ELSE 0 END) as rfiCount,
            SUM(CASE WHEN ts_survey_ac IS NOT NULL AND ts_survey_ac != '' THEN 1 ELSE 0 END) as surveyDone,
            SUM(CASE WHEN version IS NOT NULL AND version != '' THEN 1 ELSE 0 END) as tssrSubmitted
          FROM sites_cache ${contractorWhere}
        `).get(...contractorParams)

        // Get status counts
        const statusCounts = db.prepare(`
          SELECT tssr_overall_status as status, COUNT(*) as count
          FROM sites_cache ${contractorWhere}
          GROUP BY tssr_overall_status
        `).all(...contractorParams)

        // Get part of counts
        const partOfCounts = db.prepare(`
          SELECT
            COALESCE(part_of, 'Not Specified') as category,
            COUNT(*) as total,
            SUM(CASE WHEN tssr_overall_status = 'Approved' THEN 1 ELSE 0 END) as approved
          FROM sites_cache ${contractorWhere}
          GROUP BY part_of
        `).all(...contractorParams)

        // Get rejection count
        const rejections = db.prepare(`
          SELECT COUNT(*) as count
          FROM sites_cache ${contractorWhere}
          AND (ti_status = 'Rejected' OR rf_plan_status = 'Rejected' OR rf_optim_status = 'Rejected' OR civil_status = 'Rejected')
        `).get(...contractorParams)

        return {
          name: c.name,
          totalSites: totals?.totalSites || 0,
          approved: totals?.approved || 0,
          rfiCount: totals?.rfiCount || 0,
          surveyDone: totals?.surveyDone || 0,
          tssrSubmitted: totals?.tssrSubmitted || 0,
          statusCounts,
          partOfCounts,
          rejectionCount: rejections?.count || 0
        }
      })

      res.json(contractors)
    } catch (error) {
      console.error('[API] Contractors detailed error:', error)
      res.status(500).json({ error: 'Server error' })
    }
  })

  // Get contractors (simple list)
  router.get('/', authenticateToken, (req, res) => {
    try {
      const { phase } = req.query
      let whereClause = "WHERE tssr_subcon IS NOT NULL AND tssr_subcon != ''"
      const params = []

      if (phase && phase !== 'ALL') {
        whereClause += ' AND phase_name = ?'
        params.push(phase)
      }

      const contractors = db.prepare(`
        SELECT tssr_subcon as name, COUNT(*) as totalSites,
          SUM(CASE WHEN tssr_overall_status = 'Approved' THEN 1 ELSE 0 END) as approved,
          SUM(CASE WHEN tssr_overall_status = 'Site not Surveyed' THEN 1 ELSE 0 END) as notSurveyed,
          SUM(CASE WHEN rfi_status IS NOT NULL AND rfi_status != '' THEN 1 ELSE 0 END) as rfi
        FROM sites_cache ${whereClause}
        GROUP BY tssr_subcon ORDER BY totalSites DESC
      `).all(...params)

      res.json(contractors)
    } catch (error) {
      res.status(500).json({ error: 'Server error' })
    }
  })

  // Get contractor stats (single contractor)
  router.get('/:name/stats', authenticateToken, (req, res) => {
    try {
      const { name } = req.params
      const { phase } = req.query

      let whereClause = 'WHERE tssr_subcon = ?'
      const params = [name]

      if (phase && phase !== 'ALL') {
        whereClause += ' AND phase_name = ?'
        params.push(phase)
      }

      const statusCounts = db.prepare(`
        SELECT tssr_overall_status as status, COUNT(*) as count
        FROM sites_cache ${whereClause} GROUP BY tssr_overall_status
      `).all(...params)

      const partOfCounts = db.prepare(`
        SELECT COALESCE(part_of, 'Not Specified') as part_of, COUNT(*) as total,
          SUM(CASE WHEN tssr_overall_status = 'Approved' THEN 1 ELSE 0 END) as approved
        FROM sites_cache ${whereClause} GROUP BY part_of
      `).all(...params)

      const totals = db.prepare(`
        SELECT COUNT(*) as totalSites,
          SUM(CASE WHEN tssr_overall_status = 'Approved' THEN 1 ELSE 0 END) as approved,
          SUM(CASE WHEN rfi_status IS NOT NULL AND rfi_status != '' THEN 1 ELSE 0 END) as rfi
        FROM sites_cache ${whereClause}
      `).get(...params)

      res.json({ name, ...totals, statusCounts, partOfCounts })
    } catch (error) {
      res.status(500).json({ error: 'Server error' })
    }
  })

  return router
}

module.exports = createContractorsRoutes
