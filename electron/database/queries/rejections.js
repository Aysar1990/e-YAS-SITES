const db = require('../db')

const rejectionsQueries = {
  insertRejection: (siteId, contractorName, department, rejectionDate, comment) => {
    const database = db.getDB()
    const stmt = database.prepare(`
      INSERT INTO rejections_log
      (site_id, contractor_name, department, rejection_date, comment, is_viewed)
      VALUES (?, ?, ?, ?, ?, 0)
    `)
    return stmt.run(siteId, contractorName, department, rejectionDate, comment)
  },

  getUnviewedRejections: (contractorName) => {
    const database = db.getDB()
    const stmt = database.prepare(`
      SELECT * FROM rejections_log
      WHERE contractor_name = ? AND is_viewed = 0
      ORDER BY rejection_date DESC
    `)
    return stmt.all(contractorName)
  },

  getUnviewedCount: (contractorName) => {
    const database = db.getDB()
    const stmt = database.prepare(`
      SELECT COUNT(*) as count FROM rejections_log
      WHERE contractor_name = ? AND is_viewed = 0
    `)
    return stmt.get(contractorName).count
  },

  markRejectionsAsViewed: (contractorName) => {
    const database = db.getDB()
    const stmt = database.prepare(`
      UPDATE rejections_log
      SET is_viewed = 1
      WHERE contractor_name = ? AND is_viewed = 0
    `)
    return stmt.run(contractorName)
  },

  markSingleAsViewed: (id) => {
    const database = db.getDB()
    const stmt = database.prepare(`
      UPDATE rejections_log
      SET is_viewed = 1
      WHERE id = ?
    `)
    return stmt.run(id)
  },

  getAllRejections: (contractorName) => {
    const database = db.getDB()
    const stmt = database.prepare(`
      SELECT * FROM rejections_log
      WHERE contractor_name = ?
      ORDER BY rejection_date DESC
    `)
    return stmt.all(contractorName)
  },

  getRejectionsHistory: (limit = 100) => {
    const database = db.getDB()
    const stmt = database.prepare(`
      SELECT * FROM rejections_log
      ORDER BY rejection_date DESC
      LIMIT ?
    `)
    return stmt.all(limit)
  },

  getRejectionsStats: () => {
    const database = db.getDB()
    const stmt = database.prepare(`
      SELECT
        contractor_name,
        department,
        COUNT(*) as count,
        SUM(CASE WHEN is_viewed = 0 THEN 1 ELSE 0 END) as unviewed
      FROM rejections_log
      GROUP BY contractor_name, department
      ORDER BY count DESC
    `)
    return stmt.all()
  },
}

module.exports = rejectionsQueries
