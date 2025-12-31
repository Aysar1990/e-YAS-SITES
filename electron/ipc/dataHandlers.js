/**
 * Data IPC handlers
 * Handles: get-data, get-stats, get-phases, get-stats-by-part-of, get-overview-table,
 *          get-part-of-values, debug-phase-count, get-contractor-detailed-stats, search-sites,
 *          update-site (with validation and workflow checks)
 * @module electron/ipc/dataHandlers
 */

// Import calculations services (Day 12)
const calculations = require('../services/calculations')

/**
 * Registers data-related IPC handlers
 * @param {Electron.IpcMain} ipcMain - Electron IPC main instance
 * @param {Object} deps - Dependencies object
 * @param {Object} deps.sitesQueries - Sites queries module
 * @param {Object} deps.contractorsQueries - Contractors queries module
 */
function registerDataHandlers(ipcMain, deps) {
  const { sitesQueries, contractorsQueries } = deps

  ipcMain.handle('get-data', async (event, { role, contractorName, phase }) => {
    try {
      let sites = []

      console.log(`📥 get-data called: role=${role}, phase=${phase}`)

      if (role === 'contractor') {
        sites = contractorsQueries.getContractorSites(contractorName, phase)
      } else {
        sites = sitesQueries.getAllSites(phase)
      }

      console.log(`📤 get-data returning ${sites.length} sites for phase="${phase}"`)

      return {
        success: true,
        sites,
        count: sites.length,
      }
    } catch (error) {
      console.error('Get data error:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  })

  ipcMain.handle('get-stats', async (event, { role, contractorName, phase }) => {
    try {
      let stats = {}
      console.log(`📊 get-stats called: role=${role}, phase=${phase}`)

      if (role === 'contractor') {
        const statusStats = contractorsQueries.getContractorStats(contractorName, phase)
        const deptStats = contractorsQueries.getContractorDepartmentStats(contractorName, phase)
        const rejections = contractorsQueries.getSitesWithRejections(contractorName, phase)

        stats = {
          statusBreakdown: statusStats,
          departmentStats: deptStats,
          rejectionsCount: rejections.length,
          rejectedSites: rejections,
        }
      } else {
        const overallStats = sitesQueries.getOverallStats(phase)
        const deptStats = sitesQueries.getDepartmentStats(phase)
        const contractorsSummary = sitesQueries.getContractorsSummary(phase)
        const governorateStats = sitesQueries.getGovernorateStats(phase)
        const partOfStats = sitesQueries.getPartOfStats(phase)
        const overviewStats = sitesQueries.getOverviewStats(phase)

        stats = {
          statusBreakdown: overallStats,
          departmentStats: deptStats,
          contractorsSummary,
          governorateStats,
          partOfStats,
          overviewStats,
          totalSites: sitesQueries.getTotalCount(phase),
        }

        // Debug: sum of statusBreakdown
        const sumFromBreakdown = overallStats.reduce((sum, s) => sum + s.count, 0)
        console.log(`📊 get-stats results for phase="${phase}":`)
        console.log(`   - totalSites from getTotalCount: ${stats.totalSites}`)
        console.log(`   - sum from statusBreakdown: ${sumFromBreakdown}`)
        console.log(`   - statusBreakdown:`, overallStats)
      }

      return {
        success: true,
        stats,
      }
    } catch (error) {
      console.error('Get stats error:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  })

  ipcMain.handle('get-phases', async () => {
    try {
      const phases = sitesQueries.getPhases()
      return {
        success: true,
        phases,
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      }
    }
  })

  // Get stats by Part Of category
  ipcMain.handle('get-stats-by-part-of', async (event, { phase }) => {
    try {
      const stats = sitesQueries.getPartOfStats(phase)
      return { success: true, stats }
    } catch (error) {
      console.error('Get stats by part of error:', error)
      return { success: false, error: error.message }
    }
  })

  // Get overview table (pivot table)
  ipcMain.handle('get-overview-table', async (event, { phase }) => {
    try {
      const table = sitesQueries.getOverviewTable(phase)
      return { success: true, table }
    } catch (error) {
      console.error('Get overview table error:', error)
      return { success: false, error: error.message }
    }
  })

  // Get unique Part Of values
  ipcMain.handle('get-part-of-values', async (event, { phase }) => {
    try {
      const values = sitesQueries.getPartOfValues(phase)
      return { success: true, values }
    } catch (error) {
      console.error('Get part of values error:', error)
      return { success: false, error: error.message }
    }
  })

  // Debug endpoint
  ipcMain.handle('debug-phase-count', async () => {
    try {
      const debug = sitesQueries.debugPhaseCount()
      return { success: true, debug }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // Get detailed contractor stats for Contractor Dashboard
  ipcMain.handle('get-contractor-detailed-stats', async (event, data) => {
    try {
      const phase = data?.phase || 'ALL'
      console.log('Getting contractor detailed stats for phase:', phase)
      const contractors = sitesQueries.getContractorDetailedStats(phase)
      console.log('Found contractors:', contractors.length)
      return { success: true, contractors }
    } catch (error) {
      console.error('Get contractor detailed stats error:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('search-sites', async (event, { query, phase }) => {
    try {
      const sites = sitesQueries.searchSites(query, phase)
      return {
        success: true,
        sites,
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      }
    }
  })

  // Update site with validation and workflow checks (Day 12)
  ipcMain.handle('update-site', async (event, { siteId, phaseName, updates, username }) => {
    try {
      console.log(`📝 update-site: siteId=${siteId}, phase=${phaseName}`)

      // 1. Get current site state
      const currentSite = sitesQueries.getSiteById(siteId, phaseName)
      if (!currentSite) {
        return { success: false, error: 'Site not found' }
      }

      // 2. Validate the updates
      const validation = calculations.validateSite({ ...currentSite, ...updates })
      if (!validation.valid) {
        console.log(`❌ Validation failed:`, validation.errors)
        return {
          success: false,
          error: 'Validation failed',
          validationErrors: validation.errors,
          warnings: validation.warnings
        }
      }

      // 3. Check workflow rules for status changes
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

      // Extract only the fields that need updating
      const finalUpdates = {
        ...updates,
        action_age: calculatedUpdates.action_age,
        tssr_overall_status: calculatedUpdates.tssr_overall_status,
        updated_by: username || 'system'
      }

      // 5. Persist to database
      const updatedSite = sitesQueries.updateSite(siteId, phaseName, finalUpdates)

      if (!updatedSite) {
        return { success: false, error: 'Failed to update site' }
      }

      console.log(`✅ Site updated: ${siteId}`)

      return {
        success: true,
        site: updatedSite,
        warnings: [...(validation.warnings || []), ...workflowWarnings],
        calculated: {
          actionAge: calculatedUpdates.action_age,
          overallStatus: calculatedUpdates.tssr_overall_status
        }
      }
    } catch (error) {
      console.error('Update site error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  })
}

module.exports = { registerDataHandlers }
