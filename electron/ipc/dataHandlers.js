/**
 * Data IPC handlers
 * Handles: get-data, get-stats, get-phases, get-stats-by-part-of, get-overview-table,
 *          get-part-of-values, debug-phase-count, get-contractor-detailed-stats, search-sites,
 *          update-site (with validation and workflow checks)
 * @module electron/ipc/dataHandlers
 */

// Import calculations services (Day 12)
const calculations = require('../services/calculations')
const {
  isNonEmptyString,
  isValidId,
  isPlainObject,
  sanitizeString,
  validateFilters,
  validateSiteData
} = require('../utils/validation')

/**
 * Registers data-related IPC handlers
 * @param {Electron.IpcMain} ipcMain - Electron IPC main instance
 * @param {Object} deps - Dependencies object
 * @param {Object} deps.db - Database instance
 * @param {Object} deps.sitesQueries - Sites queries module
 * @param {Object} deps.contractorsQueries - Contractors queries module
 */
function registerDataHandlers(ipcMain, deps) {
  const { db, sitesQueries, contractorsQueries } = deps
  
  console.log('📊 [DataHandlers] Registering with db:', db ? 'exists' : 'MISSING!')

  ipcMain.handle('get-data', async (event, { role, contractorName, phase }) => {
    try {
      // Input validation
      const validRoles = ['admin', 'management', 'contractor', 'nokia']
      if (!role || !validRoles.includes(role)) {
        return {
          success: false,
          error: 'Invalid role',
          sites: [],
          count: 0,
        }
      }

      // Validate contractor name for contractor role
      if (role === 'contractor' && (!contractorName || !isNonEmptyString(contractorName))) {
        return {
          success: false,
          error: 'Contractor name is required for contractor role',
          sites: [],
          count: 0,
        }
      }

      // Sanitize inputs
      const sanitizedContractorName = contractorName ? sanitizeString(contractorName) : null
      const sanitizedPhase = phase ? sanitizeString(phase) : null

      let sites = []

      console.log(`📥 IPC - get-data called: role=${role}, phase=${sanitizedPhase}`)

      if (role === 'contractor') {
        sites = await contractorsQueries.getContractorSites(sanitizedContractorName, sanitizedPhase)
      } else {
        sites = await sitesQueries.getAllSites(phase)
      }

      // Ensure sites is an array
      sites = Array.isArray(sites) ? sites : []

      console.log(`📤 IPC - get-data returning ${sites.length} sites for phase="${phase}"`)

      return {
        success: true,
        sites,
        count: sites.length,
      }
    } catch (error) {
      console.error('❌ Get data error:', error)
      return {
        success: false,
        error: error.message,
        sites: [],
        count: 0,
      }
    }
  })

  ipcMain.handle('get-stats', async (event, { role, contractorName, phase }) => {
    console.log('🚀🚀🚀 [IPC] get-stats CALLED!')
    console.log('🚀 Parameters:', { role, contractorName, phase })
    
    try {
      let stats = {}
      console.log(`📊 IPC - get-stats called: role=${role}, phase=${phase}`)

      if (role === 'contractor') {
        console.log('📊 [IPC] get-stats: Taking CONTRACTOR path')
        const statusStats = await contractorsQueries.getContractorStats(contractorName, phase)
        const deptStats = await contractorsQueries.getContractorDepartmentStats(contractorName, phase)
        const rejections = await contractorsQueries.getSitesWithRejections(contractorName, phase)

        stats = {
          statusBreakdown: statusStats || [],
          departmentStats: deptStats || {},
          rejectionsCount: Array.isArray(rejections) ? rejections.length : 0,
          rejectedSites: rejections || [],
        }
      } else {
        console.log('📊 [IPC] get-stats: Taking ADMIN/MANAGEMENT path')
        console.log('📊 [IPC] get-stats: Starting queries for phase:', phase)
        
        const overallStats = await sitesQueries.getOverallStats(phase)
        console.log('📊 [IPC] get-stats: overallStats result:', overallStats?.length, 'items')
        console.log('📊 [IPC] get-stats: overallStats sample:', overallStats?.slice(0, 2))
        
        const deptStats = await sitesQueries.getDepartmentStats(phase)
        console.log('📊 [IPC] get-stats: deptStats keys:', Object.keys(deptStats || {}))
        
        const contractorsSummary = await sitesQueries.getContractorsSummary(phase)
        console.log('📊 [IPC] get-stats: contractorsSummary count:', contractorsSummary?.length)
        
        const governorateStats = await sitesQueries.getGovernorateStats(phase)
        console.log('📊 [IPC] get-stats: governorateStats count:', governorateStats?.length)
        
        const partOfStats = await sitesQueries.getPartOfStats(phase)
        console.log('📊 [IPC] get-stats: partOfStats count:', partOfStats?.length)
        
        const overviewStats = await sitesQueries.getOverviewStats(phase)
        console.log('📊 [IPC] get-stats: overviewStats type:', typeof overviewStats)
        console.log('📊 [IPC] get-stats: overviewStats keys:', Object.keys(overviewStats || {}))
        
        const totalSites = await sitesQueries.getTotalCount(phase)
        console.log('📊 [IPC] get-stats: totalSites:', totalSites)

        console.log(`📊 IPC - Stats breakdown count:`, overallStats?.length)
        console.log(`📊 IPC - Total sites:`, totalSites)
        console.log(`📊 IPC - Overview stats:`, overviewStats)

        stats = {
          statusBreakdown: overallStats || [],
          departmentStats: deptStats || {},
          contractorsSummary: contractorsSummary || [],
          governorateStats: governorateStats || [],
          partOfStats: partOfStats || [],
          overviewStats: overviewStats || {},
          totalSites: totalSites || 0,
        }

        // Debug: sum of statusBreakdown
        const sumFromBreakdown = Array.isArray(overallStats) ? overallStats.reduce((sum, s) => sum + (s.count || 0), 0) : 0
        console.log(`📊 IPC - get-stats results for phase="${phase}":`)
        console.log(`   - totalSites from getTotalCount: ${stats.totalSites}`)
        console.log(`   - sum from statusBreakdown: ${sumFromBreakdown}`)
        console.log(`📊 [IPC] get-stats: FINAL stats object:`, JSON.stringify(stats, null, 2).substring(0, 500))
      }

      return {
        success: true,
        stats,
      }
    } catch (error) {
      console.error('❌ Get stats error:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  })

  ipcMain.handle('get-phases', async () => {
    try {
      const phases = await sitesQueries.getPhases()
      return {
        success: true,
        phases: phases || [],
      }
    } catch (error) {
      console.error('Get phases error:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  })

  // Get stats by Part Of category
  ipcMain.handle('get-stats-by-part-of', async (event, { phase }) => {
    try {
      const stats = await sitesQueries.getPartOfStats(phase)
      return { success: true, stats: stats || [] }
    } catch (error) {
      console.error('Get stats by part of error:', error)
      return { success: false, error: error.message }
    }
  })

  // Get overview table (pivot table)
  ipcMain.handle('get-overview-table', async (event, { phase }) => {
    try {
      const table = await sitesQueries.getOverviewTable(phase)
      return { success: true, table: table || [] }
    } catch (error) {
      console.error('Get overview table error:', error)
      return { success: false, error: error.message }
    }
  })

  // Get unique Part Of values
  ipcMain.handle('get-part-of-values', async (event, { phase }) => {
    try {
      const values = await sitesQueries.getPartOfValues(phase)
      return { success: true, values: values || [] }
    } catch (error) {
      console.error('Get part of values error:', error)
      return { success: false, error: error.message }
    }
  })

  // Debug endpoint
  ipcMain.handle('debug-phase-count', async () => {
    try {
      const debug = await sitesQueries.debugPhaseCount()
      return { success: true, debug: debug || {} }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // Get detailed contractor stats for Contractor Dashboard
  ipcMain.handle('get-contractor-detailed-stats', async (event, data) => {
    try {
      const phase = data?.phase || 'ALL'
      console.log('🔍 IPC Handler - Getting contractor detailed stats for phase:', phase)
      
      const contractors = await sitesQueries.getContractorDetailedStats(phase)
      const contractorsArray = Array.isArray(contractors) ? contractors : []
      
      console.log('🔍 IPC Handler - Result type:', typeof contractors)
      console.log('🔍 IPC Handler - Is Array:', Array.isArray(contractors))
      console.log('🔍 IPC Handler - Found contractors:', contractorsArray.length)
      console.log('🔍 IPC Handler - First contractor sample:', contractorsArray[0])
      
      return { success: true, contractors: contractorsArray }
    } catch (error) {
      console.error('❌ Get contractor detailed stats error:', error)
      return { success: false, error: error.message, contractors: [] }
    }
  })

  ipcMain.handle('search-sites', async (event, { query, phase }) => {
    try {
      // Input validation
      if (query && !isNonEmptyString(query)) {
        return {
          success: false,
          error: 'Search query must be a non-empty string',
          sites: [],
        }
      }

      // Sanitize inputs
      const sanitizedQuery = query ? sanitizeString(query) : ''
      const sanitizedPhase = phase ? sanitizeString(phase) : null

      const sites = await sitesQueries.searchSites(sanitizedQuery, sanitizedPhase)
      return {
        success: true,
        sites: sites || [],
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        sites: [],
      }
    }
  })

  // Update site with validation and workflow checks (Day 12)
  ipcMain.handle('update-site', async (event, { siteId, phaseName, updates, username }) => {
    try {
      // Input validation
      if (!siteId || !isValidId(siteId)) {
        return { success: false, error: 'Valid site ID is required' }
      }

      if (!phaseName || !isNonEmptyString(phaseName)) {
        return { success: false, error: 'Phase name is required' }
      }

      if (!updates || !isPlainObject(updates)) {
        return { success: false, error: 'Updates must be a valid object' }
      }

      // Sanitize phase name
      const sanitizedPhaseName = sanitizeString(phaseName)
      const sanitizedSiteId = typeof siteId === 'string' ? sanitizeString(siteId) : siteId

      // Validate site data updates
      try {
        validateSiteData(updates)
      } catch (validationError) {
        return {
          success: false,
          error: `Validation failed: ${validationError.message}`
        }
      }

      console.log(`📝 update-site: siteId=${sanitizedSiteId}, phase=${sanitizedPhaseName}`)

      // 1. Get current site state
      const currentSite = await sitesQueries.getSiteById(sanitizedSiteId, sanitizedPhaseName)
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
      const updatedSite = await sitesQueries.updateSite(sanitizedSiteId, sanitizedPhaseName, finalUpdates)

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

  // Sync data from Supabase to SQLite
  ipcMain.handle('sync-from-cloud', async () => {
    try {
      console.log('🔄 Manual sync from cloud requested...')
      const mode = db.getMode()

      if (!mode.isOnline) {
        return { success: false, error: 'Not connected to cloud. Check Supabase configuration.' }
      }

      const result = await db.fullSyncFromCloud()
      console.log(`✅ Synced ${result.count} sites from Supabase to SQLite`)

      return {
        success: true,
        count: result.count,
        message: `Successfully synced ${result.count} sites from cloud`
      }
    } catch (error) {
      console.error('❌ Sync from cloud error:', error)
      return { success: false, error: error.message }
    }
  })

  // Get database mode/status
  ipcMain.handle('get-db-mode', async () => {
    try {
      const mode = db.getMode()
      return { success: true, mode }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })
}

module.exports = { registerDataHandlers }
