/**
 * Nokia Reviews (Ghirbal) IPC handlers
 * Handles: get-nokia-reviews, get-nokia-review-by-site-id, upsert-nokia-review,
 *          update-nokia-review-check, update-nokia-rejection, clear-nokia-rejection,
 *          get-ghirbal-sites, get-checked-sites
 * @module electron/ipc/nokiaHandlers
 */

/**
 * Registers Nokia reviews IPC handlers
 * @param {Electron.IpcMain} ipcMain - Electron IPC main instance
 * @param {Object} deps - Dependencies object
 * @param {Object} deps.db - Database instance
 * @param {Function} deps.logAction - Audit logging function
 */
function registerNokiaHandlers(ipcMain, deps) {
  const { db, logAction } = deps

  // Get all Nokia reviews
  ipcMain.handle('get-nokia-reviews', async () => {
    try {
      const reviews = await db.prepare('SELECT * FROM nokia_reviews ORDER BY updated_at DESC').all()
      return { success: true, reviews: reviews || [] }
    } catch (error) {
      console.error('Get nokia reviews error:', error)
      return { success: false, error: error.message }
    }
  })

  // Get Nokia review by site_id
  ipcMain.handle('get-nokia-review-by-site-id', async (event, siteId) => {
    try {
      const review = await db.prepare('SELECT * FROM nokia_reviews WHERE site_id = ?').get(siteId)
      return { success: true, review }
    } catch (error) {
      console.error('Get nokia review error:', error)
      return { success: false, error: error.message }
    }
  })

  // Upsert Nokia review (insert or update)
  ipcMain.handle('upsert-nokia-review', async (event, data) => {
    try {
      const { site_id, checked, note, rejection_type, rejection_status, rejection_comment, updated_by } = data

      // Check if exists
      const existing = await db.prepare('SELECT id FROM nokia_reviews WHERE site_id = ?').get(site_id)

      if (existing) {
        // Update
        await db.prepare(`
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
        // Insert
        await db.prepare(`
          INSERT INTO nokia_reviews (site_id, checked, note, rejection_type, rejection_status, rejection_comment, updated_by)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(site_id, checked || 0, note, rejection_type, rejection_status, rejection_comment, updated_by)
      }

      return { success: true }
    } catch (error) {
      console.error('Upsert nokia review error:', error)
      return { success: false, error: error.message }
    }
  })

  // Update Nokia review check status
  ipcMain.handle('update-nokia-review-check', async (event, data) => {
    try {
      const { site_id, checked, note, updated_by } = data

      // Get old value for audit
      const oldReview = await db.prepare('SELECT checked, note FROM nokia_reviews WHERE site_id = ?').get(site_id)

      // Check if exists
      const existing = await db.prepare('SELECT id FROM nokia_reviews WHERE site_id = ?').get(site_id)

      if (existing) {
        await db.prepare(`
          UPDATE nokia_reviews SET
            checked = ?,
            note = COALESCE(?, note),
            updated_by = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE site_id = ?
        `).run(checked ? 1 : 0, note, updated_by, site_id)
      } else {
        await db.prepare(`
          INSERT INTO nokia_reviews (site_id, checked, note, updated_by)
          VALUES (?, ?, ?, ?)
        `).run(site_id, checked ? 1 : 0, note, updated_by)
      }

      // Audit log for nokia review update
      if (logAction) {
        await logAction(
          null,
          updated_by || 'system',
          checked ? 'CHECK_SITE' : 'UNCHECK_SITE',
          'site',
          site_id,
          oldReview || null,
          { checked: checked ? 1 : 0, note }
        )
      }

      return { success: true }
    } catch (error) {
      console.error('Update nokia review check error:', error)
      return { success: false, error: error.message }
    }
  })

  // Update Nokia rejection
  ipcMain.handle('update-nokia-rejection', async (event, data) => {
    try {
      const { site_id, rejection_type, rejection_status, rejection_comment, updated_by } = data

      // Check if exists
      const existing = await db.prepare('SELECT id FROM nokia_reviews WHERE site_id = ?').get(site_id)

      if (existing) {
        await db.prepare(`
          UPDATE nokia_reviews SET
            rejection_type = ?,
            rejection_status = ?,
            rejection_comment = ?,
            updated_by = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE site_id = ?
        `).run(rejection_type, rejection_status, rejection_comment, updated_by, site_id)
      } else {
        await db.prepare(`
          INSERT INTO nokia_reviews (site_id, rejection_type, rejection_status, rejection_comment, updated_by)
          VALUES (?, ?, ?, ?, ?)
        `).run(site_id, rejection_type, rejection_status, rejection_comment, updated_by)
      }

      return { success: true }
    } catch (error) {
      console.error('Update nokia rejection error:', error)
      return { success: false, error: error.message }
    }
  })

  // Clear Nokia rejection (set to Approved)
  ipcMain.handle('clear-nokia-rejection', async (event, data) => {
    try {
      const { site_id, updated_by } = data

      const existing = await db.prepare('SELECT id FROM nokia_reviews WHERE site_id = ?').get(site_id)

      if (existing) {
        await db.prepare(`
          UPDATE nokia_reviews SET
            rejection_status = 'Approved',
            rejection_comment = NULL,
            updated_by = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE site_id = ?
        `).run(updated_by, site_id)
      } else {
        await db.prepare(`
          INSERT INTO nokia_reviews (site_id, rejection_status, updated_by)
          VALUES (?, 'Approved', ?)
        `).run(site_id, updated_by)
      }

      return { success: true }
    } catch (error) {
      console.error('Clear nokia rejection error:', error)
      return { success: false, error: error.message }
    }
  })

  // Get Ghirbal sites (sites under Nokia review statuses)
  ipcMain.handle('get-ghirbal-sites', async (event, phase) => {
    try {
      let query = `
        SELECT sc.*, nr.checked, nr.note, nr.rejection_type, nr.rejection_status, nr.rejection_comment
        FROM sites sc
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

      const sites = await db.prepare(query).all(...params)
      return { success: true, sites: sites || [] }
    } catch (error) {
      console.error('Get ghirbal sites error:', error)
      return { success: false, error: error.message }
    }
  })

  // Get checked sites
  ipcMain.handle('get-checked-sites', async (event, phase) => {
    try {
      let query = `
        SELECT sc.*, nr.checked, nr.note, nr.rejection_type, nr.rejection_status, nr.rejection_comment
        FROM sites sc
        INNER JOIN nokia_reviews nr ON sc.site_id = nr.site_id
        WHERE nr.checked = 1
      `
      const params = []

      if (phase && phase !== 'ALL') {
        query += ' AND sc.phase_name = ?'
        params.push(phase)
      }

      query += ' ORDER BY nr.updated_at DESC'

      const sites = await db.prepare(query).all(...params)
      return { success: true, sites: sites || [] }
    } catch (error) {
      console.error('Get checked sites error:', error)
      return { success: false, error: error.message }
    }
  })
}

module.exports = { registerNokiaHandlers }
