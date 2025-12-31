const db = require('../db')

const contractorsQueries = {
  getContractorSites: (contractorName, phase) => {
    const database = db.getDB()
    let stmt

    if (phase && phase !== 'ALL') {
      stmt = database.prepare(`
        SELECT * FROM sites_cache
        WHERE tssr_subcon = ? AND phase_name = ?
        ORDER BY priority ASC, site_id ASC
      `)
      return stmt.all(contractorName, phase)
    } else {
      stmt = database.prepare(`
        SELECT * FROM sites_cache
        WHERE tssr_subcon = ?
        ORDER BY priority ASC, site_id ASC
      `)
      return stmt.all(contractorName)
    }
  },

  getContractorStats: (contractorName, phase) => {
    const database = db.getDB()
    let stmt

    if (phase && phase !== 'ALL') {
      stmt = database.prepare(`
        SELECT
          tssr_overall_status,
          COUNT(*) as count
        FROM sites_cache
        WHERE tssr_subcon = ? AND phase_name = ?
        GROUP BY tssr_overall_status
      `)
      return stmt.all(contractorName, phase)
    } else {
      stmt = database.prepare(`
        SELECT
          tssr_overall_status,
          COUNT(*) as count
        FROM sites_cache
        WHERE tssr_subcon = ?
        GROUP BY tssr_overall_status
      `)
      return stmt.all(contractorName)
    }
  },

  getContractorDepartmentStats: (contractorName, phase) => {
    const database = db.getDB()
    let whereClause = 'WHERE tssr_subcon = ?'
    let params = [contractorName]

    if (phase && phase !== 'ALL') {
      whereClause += ' AND phase_name = ?'
      params.push(phase)
    }

    const stmt = database.prepare(`
      SELECT
        SUM(CASE WHEN ti_status = 'Approved' THEN 1 ELSE 0 END) as ti_approved,
        SUM(CASE WHEN ti_status = 'Rejected' THEN 1 ELSE 0 END) as ti_rejected,
        SUM(CASE WHEN ti_status = 'Pending' THEN 1 ELSE 0 END) as ti_pending,
        SUM(CASE WHEN rf_plan_status = 'Approved' THEN 1 ELSE 0 END) as rf_plan_approved,
        SUM(CASE WHEN rf_plan_status = 'Rejected' THEN 1 ELSE 0 END) as rf_plan_rejected,
        SUM(CASE WHEN rf_plan_status = 'Pending' THEN 1 ELSE 0 END) as rf_plan_pending,
        SUM(CASE WHEN rf_opt_status = 'Approved' THEN 1 ELSE 0 END) as rf_opt_approved,
        SUM(CASE WHEN rf_opt_status = 'Rejected' THEN 1 ELSE 0 END) as rf_opt_rejected,
        SUM(CASE WHEN rf_opt_status = 'Pending' THEN 1 ELSE 0 END) as rf_opt_pending,
        SUM(CASE WHEN civil_status = 'Approved' THEN 1 ELSE 0 END) as civil_approved,
        SUM(CASE WHEN civil_status = 'Rejected' THEN 1 ELSE 0 END) as civil_rejected,
        SUM(CASE WHEN civil_status = 'Pending' THEN 1 ELSE 0 END) as civil_pending,
        SUM(CASE WHEN mw_status = 'Approved' THEN 1 ELSE 0 END) as mw_approved,
        SUM(CASE WHEN mw_status = 'Rejected' THEN 1 ELSE 0 END) as mw_rejected,
        SUM(CASE WHEN mw_status = 'Pending' THEN 1 ELSE 0 END) as mw_pending,
        COUNT(*) as total
      FROM sites_cache
      ${whereClause}
    `)
    return stmt.get(...params)
  },

  getSitesWithRejections: (contractorName, phase) => {
    const database = db.getDB()
    let whereClause = 'WHERE tssr_subcon = ?'
    let params = [contractorName]

    if (phase && phase !== 'ALL') {
      whereClause += ' AND phase_name = ?'
      params.push(phase)
    }

    const stmt = database.prepare(`
      SELECT * FROM sites_cache
      ${whereClause}
        AND (
          ti_status = 'Rejected' OR
          rf_plan_status = 'Rejected' OR
          rf_opt_status = 'Rejected' OR
          civil_status = 'Rejected' OR
          mw_status = 'Rejected'
        )
      ORDER BY priority ASC, site_id ASC
    `)
    return stmt.all(...params)
  },

  getUniqueContractors: () => {
    const database = db.getDB()
    const stmt = database.prepare(`
      SELECT DISTINCT tssr_subcon as name, COUNT(*) as sites_count
      FROM sites_cache
      WHERE tssr_subcon IS NOT NULL AND tssr_subcon != ''
      GROUP BY tssr_subcon
      ORDER BY sites_count DESC
    `)
    return stmt.all()
  },
}

module.exports = contractorsQueries
