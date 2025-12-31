/**
 * Statistics Routes
 */

const express = require('express')

function createStatsRoutes(db, authenticateToken) {
  const router = express.Router()

  // Helper function for part of breakdown
  const getPartOfBreakdown = (db, whereClause, params, additionalWhere = '') => {
    const query = `
      SELECT COALESCE(part_of, 'Not Specified') as part_of, COUNT(*) as count
      FROM sites_cache ${whereClause} ${additionalWhere}
      GROUP BY part_of
    `
    const result = db.prepare(query).all(...params)
    return {
      thin_layer: result.find(r => r.part_of === 'ThinLayer')?.count || 0,
      full_swap: result.find(r => r.part_of === 'Full Swap')?.count || 0,
      swap_existing: result.find(r => r.part_of === 'Swap For Exsting Thin layer')?.count || 0,
      not_specified: result.find(r => !['ThinLayer', 'Full Swap', 'Swap For Exsting Thin layer'].includes(r.part_of))?.count || 0
    }
  }

  // Get statistics - FULL FORMAT
  router.get('/', authenticateToken, (req, res) => {
    try {
      const { phase } = req.query
      const user = req.user

      let whereClause = 'WHERE 1=1'
      const params = []

      if (phase && phase !== 'ALL') {
        whereClause += ' AND phase_name = ?'
        params.push(phase)
      }

      if (user.role === 'contractor' && user.contractor_name) {
        whereClause += ' AND tssr_subcon = ?'
        params.push(user.contractor_name)
      }

      // Status breakdown
      const statusBreakdown = db.prepare(`
        SELECT tssr_overall_status, COUNT(*) as count
        FROM sites_cache ${whereClause}
        GROUP BY tssr_overall_status
      `).all(...params)

      // Part of stats
      const partOfStats = db.prepare(`
        SELECT COALESCE(part_of, 'Not Specified') as part_of, COUNT(*) as count
        FROM sites_cache ${whereClause}
        GROUP BY part_of
      `).all(...params)

      // Get breakdowns
      const totalBreakdown = getPartOfBreakdown(db, whereClause, params)
      const surveyBreakdown = getPartOfBreakdown(db, whereClause, params, "AND ts_survey_ac IS NOT NULL AND ts_survey_ac != ''")
      const readyBreakdown = getPartOfBreakdown(db, whereClause, params, "AND (tssr_ready = 1 OR tssr_ready = 'Yes')")
      const submittedBreakdown = getPartOfBreakdown(db, whereClause, params, "AND version IS NOT NULL AND version != ''")
      const approvedBreakdown = getPartOfBreakdown(db, whereClause, params, "AND tssr_overall_status = 'Approved'")
      const rfiBreakdown = getPartOfBreakdown(db, whereClause, params, "AND rfi_status IS NOT NULL AND rfi_status != ''")

      // Calculate totals
      const total = db.prepare(`SELECT COUNT(*) as count FROM sites_cache ${whereClause}`).get(...params).count
      const surveyDone = db.prepare(`SELECT COUNT(*) as count FROM sites_cache ${whereClause} AND ts_survey_ac IS NOT NULL AND ts_survey_ac != ''`).get(...params).count
      const tssrReady = db.prepare(`SELECT COUNT(*) as count FROM sites_cache ${whereClause} AND (tssr_ready = 1 OR tssr_ready = 'Yes')`).get(...params).count
      const tssrSubmitted = db.prepare(`SELECT COUNT(*) as count FROM sites_cache ${whereClause} AND version IS NOT NULL AND version != ''`).get(...params).count
      const approved = db.prepare(`SELECT COUNT(*) as count FROM sites_cache ${whereClause} AND tssr_overall_status = 'Approved'`).get(...params).count
      const rfi = db.prepare(`SELECT COUNT(*) as count FROM sites_cache ${whereClause} AND rfi_status IS NOT NULL AND rfi_status != ''`).get(...params).count

      // Department stats
      const deptStats = db.prepare(`
        SELECT
          SUM(CASE WHEN ti_status = 'Approved' THEN 1 ELSE 0 END) as ti_approved,
          SUM(CASE WHEN ti_status = 'Rejected' THEN 1 ELSE 0 END) as ti_rejected,
          SUM(CASE WHEN ti_status IS NULL OR ti_status NOT IN ('Approved', 'Rejected') THEN 1 ELSE 0 END) as ti_pending,
          SUM(CASE WHEN rf_plan_status = 'Approved' THEN 1 ELSE 0 END) as rf_plan_approved,
          SUM(CASE WHEN rf_plan_status = 'Rejected' THEN 1 ELSE 0 END) as rf_plan_rejected,
          SUM(CASE WHEN rf_plan_status IS NULL OR rf_plan_status NOT IN ('Approved', 'Rejected') THEN 1 ELSE 0 END) as rf_plan_pending,
          SUM(CASE WHEN rf_optim_status = 'Approved' THEN 1 ELSE 0 END) as rf_opt_approved,
          SUM(CASE WHEN rf_optim_status = 'Rejected' THEN 1 ELSE 0 END) as rf_opt_rejected,
          SUM(CASE WHEN rf_optim_status IS NULL OR rf_optim_status NOT IN ('Approved', 'Rejected') THEN 1 ELSE 0 END) as rf_opt_pending,
          SUM(CASE WHEN civil_status = 'Approved' THEN 1 ELSE 0 END) as civil_approved,
          SUM(CASE WHEN civil_status = 'Rejected' THEN 1 ELSE 0 END) as civil_rejected,
          SUM(CASE WHEN civil_status IS NULL OR civil_status NOT IN ('Approved', 'Rejected') THEN 1 ELSE 0 END) as civil_pending,
          SUM(CASE WHEN mw_status = 'Approved' THEN 1 ELSE 0 END) as mw_approved,
          SUM(CASE WHEN mw_status = 'Rejected' THEN 1 ELSE 0 END) as mw_rejected,
          SUM(CASE WHEN mw_status IS NULL OR mw_status NOT IN ('Approved', 'Rejected') THEN 1 ELSE 0 END) as mw_pending
        FROM sites_cache ${whereClause}
      `).get(...params)

      // Contractors summary
      const contractorsSummary = db.prepare(`
        SELECT
          tssr_subcon as contractor,
          COUNT(*) as total,
          SUM(CASE WHEN tssr_overall_status = 'Approved' THEN 1 ELSE 0 END) as approved,
          SUM(CASE WHEN tssr_overall_status != 'Approved' OR tssr_overall_status IS NULL THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN tssr_overall_status LIKE '%Rejected%' THEN 1 ELSE 0 END) as rejected
        FROM sites_cache ${whereClause}
        AND tssr_subcon IS NOT NULL AND tssr_subcon != ''
        GROUP BY tssr_subcon
        ORDER BY total DESC
      `).all(...params)

      res.json({
        statusBreakdown,
        partOfStats,
        overviewStats: {
          total,
          survey_done: surveyDone,
          tssr_ready_count: tssrReady,
          tssr_submitted: tssrSubmitted,
          approved,
          rfi,
          total_thin_layer: totalBreakdown.thin_layer,
          total_full_swap: totalBreakdown.full_swap,
          total_swap_existing: totalBreakdown.swap_existing,
          survey_thin_layer: surveyBreakdown.thin_layer,
          survey_full_swap: surveyBreakdown.full_swap,
          survey_swap_existing: surveyBreakdown.swap_existing,
          ready_thin_layer: readyBreakdown.thin_layer,
          ready_full_swap: readyBreakdown.full_swap,
          ready_swap_existing: readyBreakdown.swap_existing,
          submitted_thin_layer: submittedBreakdown.thin_layer,
          submitted_full_swap: submittedBreakdown.full_swap,
          submitted_swap_existing: submittedBreakdown.swap_existing,
          approved_thin_layer: approvedBreakdown.thin_layer,
          approved_full_swap: approvedBreakdown.full_swap,
          approved_swap_existing: approvedBreakdown.swap_existing,
          rfi_thin_layer: rfiBreakdown.thin_layer,
          rfi_full_swap: rfiBreakdown.full_swap,
          rfi_swap_existing: rfiBreakdown.swap_existing,
        },
        departmentStats: deptStats,
        contractorsSummary
      })
    } catch (error) {
      console.error('[API] Stats error:', error)
      res.status(500).json({ error: 'Server error' })
    }
  })

  // Get stats breakdown by Part Of
  router.get('/breakdown', authenticateToken, (req, res) => {
    try {
      const { phase } = req.query
      const user = req.user

      let whereClause = 'WHERE 1=1'
      const params = []

      if (phase && phase !== 'ALL') {
        whereClause += ' AND phase_name = ?'
        params.push(phase)
      }

      if (user.role === 'contractor' && user.contractor_name) {
        whereClause += ' AND tssr_subcon = ?'
        params.push(user.contractor_name)
      }

      const getBreakdown = (additionalWhere = '') => {
        const query = `
          SELECT COALESCE(part_of, 'Not Specified') as part_of, COUNT(*) as count
          FROM sites_cache ${whereClause} ${additionalWhere}
          GROUP BY part_of
        `
        const result = db.prepare(query).all(...params)
        return {
          thin_layer: result.find(r => r.part_of === 'ThinLayer')?.count || 0,
          full_swap: result.find(r => r.part_of === 'Full Swap')?.count || 0,
          swap_existing: result.find(r => r.part_of === 'Swap For Exsting Thin layer')?.count || 0,
          not_specified: result.find(r => !['ThinLayer', 'Full Swap', 'Swap For Exsting Thin layer'].includes(r.part_of))?.count || 0,
          total: result.reduce((sum, r) => sum + r.count, 0)
        }
      }

      res.json({
        totalScope: getBreakdown(),
        surveyDone: getBreakdown("AND ts_survey_ac IS NOT NULL AND ts_survey_ac != ''"),
        tssrReady: getBreakdown("AND (tssr_ready = 1 OR tssr_ready = 'Yes')"),
        tssrSubmitted: getBreakdown("AND version IS NOT NULL AND version != ''"),
        approved: getBreakdown("AND tssr_overall_status = 'Approved'"),
        rfi: getBreakdown("AND rfi_status IS NOT NULL AND rfi_status != ''")
      })
    } catch (error) {
      res.status(500).json({ error: 'Server error' })
    }
  })

  // Get overview stats (pivot table)
  router.get('/overview', authenticateToken, (req, res) => {
    try {
      const { phase } = req.query
      const user = req.user

      let whereClause = 'WHERE 1=1'
      const params = []

      if (phase && phase !== 'ALL') {
        whereClause += ' AND phase_name = ?'
        params.push(phase)
      }

      if (user.role === 'contractor' && user.contractor_name) {
        whereClause += ' AND tssr_subcon = ?'
        params.push(user.contractor_name)
      }

      const query = `
        SELECT
          tssr_overall_status as status,
          COALESCE(part_of, 'Not Specified') as part_of,
          COUNT(*) as count
        FROM sites_cache ${whereClause}
        GROUP BY tssr_overall_status, part_of
      `

      const results = db.prepare(query).all(...params)

      const statusOrder = [
        'Approved', 'TSSR Under Zain validation', 'TSSR Under ROM Review',
        'TSSR Under Nokia NPO Validation', 'TSSR Under Nokia ROM Validation',
        'TSSR Under Nokia GSD Validation', 'TSSR Under Subcon validation',
        'Site not Surveyed', 'Need Access'
      ]

      const pivotData = {}
      results.forEach(row => {
        if (!pivotData[row.status]) {
          pivotData[row.status] = { status: row.status, thin_layer: 0, full_swap: 0, swap_existing: 0, not_specified: 0, total: 0 }
        }

        if (row.part_of === 'ThinLayer') pivotData[row.status].thin_layer = row.count
        else if (row.part_of === 'Full Swap') pivotData[row.status].full_swap = row.count
        else if (row.part_of === 'Swap For Exsting Thin layer') pivotData[row.status].swap_existing = row.count
        else pivotData[row.status].not_specified += row.count

        pivotData[row.status].total += row.count
      })

      const sortedData = statusOrder.filter(s => pivotData[s]).map(s => pivotData[s])
      Object.keys(pivotData).forEach(s => {
        if (!statusOrder.includes(s)) sortedData.push(pivotData[s])
      })

      res.json(sortedData)
    } catch (error) {
      res.status(500).json({ error: 'Server error' })
    }
  })

  return router
}

module.exports = createStatsRoutes
