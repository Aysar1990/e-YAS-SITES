/**
 * Statistics IPC handlers
 * Handles: get-stats-breakdown, get-overview-stats, get-contractors-list, get-contractor-stats
 * @module electron/ipc/statsHandlers
 */

/**
 * Registers statistics IPC handlers
 * @param {Electron.IpcMain} ipcMain - Electron IPC main instance
 * @param {Object} deps - Dependencies object
 * @param {Object} deps.db - Database instance
 */
function registerStatsHandlers(ipcMain, deps) {
  const { db } = deps

  ipcMain.handle('get-stats-breakdown', async (event, phase) => {
    console.log('📊 [IPC] get-stats-breakdown called with phase:', phase)
    try {
      console.log('📊 [IPC] Database instance:', db ? 'exists' : 'null')
      console.log('📊 [IPC] Database initialized:', db?.isInitialized?.())
      
      const getBreakdown = async (additionalWhere = '', params = []) => {
        let whereClause = 'WHERE phase_name = ?'
        const queryParams = [phase, ...params]

        const query = `
          SELECT COALESCE(part_of, 'Not Specified') as part_of, COUNT(*) as count
          FROM sites ${whereClause} ${additionalWhere}
          GROUP BY part_of
        `
        
        console.log('📊 [IPC] Executing query:', query.substring(0, 100) + '...')
        console.log('📊 [IPC] Query params:', queryParams)
        
        const stmt = db.prepare(query)
        console.log('📊 [IPC] Statement prepared:', stmt ? 'yes' : 'no')
        
        const result = await stmt.all(...queryParams)
        console.log('📊 [IPC] Query result type:', typeof result, Array.isArray(result))
        console.log('📊 [IPC] Query result length:', result?.length)
        console.log('📊 [IPC] Query result:', result)
        
        const resultArray = Array.isArray(result) ? result : []

        return {
          thinLayer: resultArray.find(r => r.part_of === 'ThinLayer')?.count || 0,
          fullSwap: resultArray.find(r => r.part_of === 'Full Swap')?.count || 0,
          swapExisting: resultArray.find(r => r.part_of === 'Swap For Exsting Thin layer')?.count || 0,
          notSpecified: resultArray.find(r => r.part_of === 'Not Specified')?.count || 0,
          total: resultArray.reduce((sum, r) => sum + (r.count || 0), 0)
        }
      }

      const breakdown = {
        totalScope: await getBreakdown(),
        surveyDone: await getBreakdown("AND ts_survey_ac IS NOT NULL AND ts_survey_ac != ''"),
        tssrReady: await getBreakdown("AND (tssr_ready = 1 OR tssr_ready = 'Yes')"),
        tssrSubmitted: await getBreakdown("AND version IS NOT NULL AND version != ''"),
        approved: await getBreakdown("AND tssr_overall_status = 'Approved'"),
        rfi: await getBreakdown("AND rfi_status IS NOT NULL AND rfi_status != ''")
      }
      
      console.log('📊 [IPC] Final breakdown result:', breakdown)
      return breakdown
    } catch (error) {
      console.error('❌ [IPC] get-stats-breakdown error:', error)
      console.error('❌ [IPC] Error stack:', error.stack)
      return null
    }
  })

  ipcMain.handle('get-overview-stats', async (event, phase) => {
    console.log('📊 [IPC] get-overview-stats called with phase:', phase)
    try {
      const query = `
        SELECT tssr_overall_status as status, COALESCE(part_of, 'Not Specified') as part_of, COUNT(*) as count
        FROM sites WHERE phase_name = ?
        GROUP BY tssr_overall_status, part_of
      `
      
      console.log('📊 [IPC] Executing overview query for phase:', phase)
      const stmt = db.prepare(query)
      const results = await stmt.all(phase)
      
      console.log('📊 [IPC] Overview query results type:', typeof results, Array.isArray(results))
      console.log('📊 [IPC] Overview query results length:', results?.length)
      console.log('📊 [IPC] Overview query first 3 results:', results?.slice(0, 3))
      
      const resultsArray = Array.isArray(results) ? results : []

      const statusOrder = [
        'Approved', 'TSSR Under Zain validation', 'TSSR Under ROM Review',
        'TSSR Under Nokia NPO Validation', 'TSSR Under Nokia ROM Validation',
        'TSSR Under Nokia GSD Validation', 'TSSR Under Subcon validation',
        'Site not Surveyed', 'Need Access'
      ]

      const pivotData = {}
      resultsArray.forEach(row => {
        if (!pivotData[row.status]) {
          pivotData[row.status] = { status: row.status, thinLayer: 0, fullSwap: 0, swapExisting: 0, notSpecified: 0, total: 0 }
        }

        if (row.part_of === 'ThinLayer') pivotData[row.status].thinLayer = row.count
        else if (row.part_of === 'Full Swap') pivotData[row.status].fullSwap = row.count
        else if (row.part_of === 'Swap For Exsting Thin layer') pivotData[row.status].swapExisting = row.count
        else pivotData[row.status].notSpecified = row.count

        pivotData[row.status].total += row.count
      })

      const sortedData = statusOrder.filter(s => pivotData[s]).map(s => pivotData[s])
      Object.keys(pivotData).forEach(s => {
        if (!statusOrder.includes(s)) sortedData.push(pivotData[s])
      })

      console.log('📊 [IPC] Overview final sorted data length:', sortedData?.length)
      console.log('📊 [IPC] Overview final sorted data:', sortedData)
      
      return sortedData
    } catch (error) {
      console.error('❌ [IPC] get-overview-stats error:', error)
      console.error('❌ [IPC] Error stack:', error.stack)
      return []
    }
  })

  ipcMain.handle('get-contractors-list', async (event, phase) => {
    try {
      const contractors = await db.prepare(`
        SELECT tssr_subcon as name, COUNT(*) as totalSites,
          SUM(CASE WHEN tssr_overall_status = 'Approved' THEN 1 ELSE 0 END) as approved,
          SUM(CASE WHEN tssr_overall_status = 'Site not Surveyed' THEN 1 ELSE 0 END) as notSurveyed,
          SUM(CASE WHEN rfi_status IS NOT NULL AND rfi_status != '' THEN 1 ELSE 0 END) as rfi
        FROM sites
        WHERE phase_name = ? AND tssr_subcon IS NOT NULL AND tssr_subcon != ''
        GROUP BY tssr_subcon ORDER BY totalSites DESC
      `).all(phase)

      return contractors || []
    } catch (error) {
      console.error('get-contractors-list error:', error)
      return []
    }
  })

  ipcMain.handle('get-contractor-stats', async (event, name, phase) => {
    try {
      const statusCounts = await db.prepare(`
        SELECT tssr_overall_status as status, COUNT(*) as count
        FROM sites WHERE phase_name = ? AND tssr_subcon = ?
        GROUP BY tssr_overall_status
      `).all(phase, name)

      const partOfCounts = await db.prepare(`
        SELECT COALESCE(part_of, 'Not Specified') as part_of, COUNT(*) as total,
          SUM(CASE WHEN tssr_overall_status = 'Approved' THEN 1 ELSE 0 END) as approved
        FROM sites WHERE phase_name = ? AND tssr_subcon = ?
        GROUP BY part_of
      `).all(phase, name)

      const totals = await db.prepare(`
        SELECT COUNT(*) as totalSites,
          SUM(CASE WHEN tssr_overall_status = 'Approved' THEN 1 ELSE 0 END) as approved,
          SUM(CASE WHEN rfi_status IS NOT NULL AND rfi_status != '' THEN 1 ELSE 0 END) as rfi
        FROM sites WHERE phase_name = ? AND tssr_subcon = ?
      `).get(phase, name)

      return { name, ...(totals || {}), statusCounts: statusCounts || [], partOfCounts: partOfCounts || [] }
    } catch (error) {
      console.error('get-contractor-stats error:', error)
      return null
    }
  })
}

module.exports = { registerStatsHandlers }
