const db = require('../db')

const sitesQueries = {
  getAllSites: (phase) => {
    const database = db.getDB()
    let stmt

    if (phase && phase !== 'ALL') {
      stmt = database.prepare(`
        SELECT * FROM sites
        WHERE phase_name = ?
        ORDER BY priority ASC, site_id ASC
      `)
      return stmt.all(phase)
    } else {
      stmt = database.prepare(`
        SELECT * FROM sites
        ORDER BY priority ASC, site_id ASC
      `)
      return stmt.all()
    }
  },

  getSiteById: (siteId, phaseName) => {
    const database = db.getDB()
    if (phaseName) {
      const stmt = database.prepare('SELECT * FROM sites WHERE site_id = ? AND phase_name = ?')
      return stmt.get(siteId, phaseName)
    } else {
      // Return first match if phase not specified
      const stmt = database.prepare('SELECT * FROM sites WHERE site_id = ? LIMIT 1')
      return stmt.get(siteId)
    }
  },

  getOverallStats: (phase) => {
    const database = db.getDB()
    let whereClause = ''
    let params = []

    console.log('📊 getOverallStats - Input phase:', JSON.stringify(phase), 'Type:', typeof phase)

    if (phase && phase !== 'ALL') {
      whereClause = 'WHERE phase_name = ?'
      params.push(phase)
      console.log('📊 getOverallStats - Using WHERE clause with params:', params)
    } else {
      console.log('📊 getOverallStats - No WHERE clause (ALL phases)')
    }

    const sql = `
      SELECT
        tssr_overall_status,
        COUNT(*) as count
      FROM sites
      ${whereClause}
      GROUP BY tssr_overall_status
      ORDER BY count DESC
    `
    
    console.log('📊 getOverallStats - SQL:', sql)
    console.log('📊 getOverallStats - Params:', params)
    
    const stmt = database.prepare(sql)
    const results = stmt.all(...params)
    
    console.log('📊 getOverallStats - Results type:', typeof results, Array.isArray(results))
    console.log('📊 getOverallStats - Results length:', results?.length)
    console.log('📊 getOverallStats - First 3 results:', results.slice(0, 3))
    
    if (results.length > 0) {
      const total = results.reduce((sum, r) => sum + (r.count || 0), 0)
      console.log('📊 getOverallStats - Total count from results:', total)
    } else {
      console.log('⚠️ getOverallStats - NO RESULTS RETURNED!')
      // Try without WHERE to see if data exists
      const testStmt = database.prepare('SELECT COUNT(*) as total FROM sites')
      const testResult = testStmt.get()
      console.log('⚠️ getOverallStats - Total sites in DB (no filter):', testResult.total)
      
      if (phase && phase !== 'ALL') {
        const phaseStmt = database.prepare('SELECT COUNT(*) as total FROM sites WHERE phase_name = ?')
        const phaseResult = phaseStmt.get(phase)
        console.log('⚠️ getOverallStats - Total sites for phase', phase, ':', phaseResult.total)
      }
    }
    
    return results
  },

  getDepartmentStats: (phase) => {
    const database = db.getDB()
    let whereClause = ''
    let params = []

    if (phase && phase !== 'ALL') {
      whereClause = 'WHERE phase_name = ?'
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
      FROM sites
      ${whereClause}
    `)
    return stmt.get(...params)
  },

  getContractorsSummary: (phase) => {
    const database = db.getDB()
    let whereClause = ''
    let params = []

    if (phase && phase !== 'ALL') {
      whereClause = 'WHERE phase_name = ?'
      params.push(phase)
    }

    const stmt = database.prepare(`
      SELECT
        tssr_subcon as contractor,
        COUNT(*) as total,
        SUM(CASE WHEN tssr_overall_status = 'Approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN tssr_overall_status LIKE '%Rejected%' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN tssr_overall_status NOT IN ('Approved') AND tssr_overall_status NOT LIKE '%Rejected%' THEN 1 ELSE 0 END) as pending
      FROM sites
      ${whereClause}
      GROUP BY tssr_subcon
      ORDER BY total DESC
    `)
    return stmt.all(...params)
  },

  getGovernorateStats: (phase) => {
    const database = db.getDB()
    let whereClause = ''
    let params = []

    if (phase && phase !== 'ALL') {
      whereClause = 'WHERE phase_name = ?'
      params.push(phase)
    }

    const stmt = database.prepare(`
      SELECT
        governorate,
        COUNT(*) as count
      FROM sites
      ${whereClause}
      GROUP BY governorate
      ORDER BY count DESC
    `)
    return stmt.all(...params)
  },

  getPhases: () => {
    const database = db.getDB()
    const stmt = database.prepare(`
      SELECT DISTINCT phase_name, COUNT(*) as count
      FROM sites
      WHERE phase_name IS NOT NULL AND phase_name != ''
      GROUP BY phase_name
      ORDER BY count DESC
    `)
    return stmt.all()
  },

  getTotalCount: (phase) => {
    const database = db.getDB()
    let stmt

    if (phase && phase !== 'ALL') {
      stmt = database.prepare('SELECT COUNT(*) as count FROM sites WHERE phase_name = ?')
      return stmt.get(phase).count
    } else {
      stmt = database.prepare('SELECT COUNT(*) as count FROM sites')
      return stmt.get().count
    }
  },

  getLastSyncTime: () => {
    const database = db.getDB()
    const stmt = database.prepare(`
      SELECT sync_time, status, records_synced
      FROM sync_log
      ORDER BY sync_time DESC
      LIMIT 1
    `)
    return stmt.get()
  },

  searchSites: (query, phase) => {
    const database = db.getDB()
    let whereClause = "WHERE (site_id LIKE ? OR final_site_name LIKE ?)"
    let params = [`%${query}%`, `%${query}%`]

    if (phase && phase !== 'ALL') {
      whereClause += ' AND phase_name = ?'
      params.push(phase)
    }

    const stmt = database.prepare(`
      SELECT * FROM sites
      ${whereClause}
      ORDER BY site_id ASC
      LIMIT 100
    `)
    return stmt.all(...params)
  },
}

// Get statistics by Part Of category
sitesQueries.getPartOfStats = (phase) => {
  const database = db.getDB()
  let whereClause = ''
  let params = []

  if (phase && phase !== 'ALL') {
    whereClause = 'WHERE phase_name = ?'
    params.push(phase)
  }

  const stmt = database.prepare(`
    SELECT
      CASE
        WHEN LOWER(TRIM(part_of)) = 'thinlayer' OR LOWER(TRIM(part_of)) = 'thin layer' THEN 'ThinLayer'
        WHEN LOWER(TRIM(part_of)) = 'full swap' THEN 'Full Swap'
        WHEN LOWER(TRIM(part_of)) LIKE '%swap%exsting%'
          OR LOWER(TRIM(part_of)) LIKE '%swap%existing%'
          OR LOWER(TRIM(part_of)) LIKE '%swap for ex%thin%' THEN 'Swap For Existing Thin layer'
        WHEN part_of IS NULL OR TRIM(part_of) = '' THEN 'Not Specified'
        ELSE TRIM(part_of)
      END as part_of_category,
      COUNT(*) as total,
      SUM(CASE WHEN ts_survey_ac IS NOT NULL AND ts_survey_ac != '' THEN 1 ELSE 0 END) as survey_done,
      SUM(CASE WHEN version IS NOT NULL AND version != '' THEN 1 ELSE 0 END) as tssr_submitted,
      SUM(CASE WHEN tssr_overall_status = 'Approved' THEN 1 ELSE 0 END) as approved,
      SUM(CASE WHEN rfi_status IS NOT NULL AND rfi_status != '' THEN 1 ELSE 0 END) as rfi,
      SUM(CASE WHEN tssr_ready = 1 THEN 1 ELSE 0 END) as tssr_ready_count
    FROM sites
    ${whereClause}
    GROUP BY part_of_category
    ORDER BY total DESC
  `)
  return stmt.all(...params)
}

// Get overview statistics for dashboard with Part Of breakdown
sitesQueries.getOverviewStats = (phase) => {
  // Default values to prevent NaN issues
  const defaults = {
    total: 0, total_thin_layer: 0, total_full_swap: 0, total_swap_existing: 0,
    survey_done: 0, survey_thin_layer: 0, survey_full_swap: 0, survey_swap_existing: 0,
    tssr_ready_count: 0, ready_thin_layer: 0, ready_full_swap: 0, ready_swap_existing: 0,
    tssr_submitted: 0, submitted_thin_layer: 0, submitted_full_swap: 0, submitted_swap_existing: 0,
    approved: 0, approved_thin_layer: 0, approved_full_swap: 0, approved_swap_existing: 0,
    rfi: 0, rfi_thin_layer: 0, rfi_full_swap: 0, rfi_swap_existing: 0
  }

  try {
    const database = db.getDB()
    let whereClause = ''
    let params = []

    if (phase && phase !== 'ALL') {
      whereClause = 'WHERE phase_name = ?'
      params.push(phase)
    }

    // Helper to categorize part_of values (handles 'Exsting' typo in Excel)
    // Actual values: 'ThinLayer', 'Full Swap', 'Swap For Exsting Thin layer'
    const partOfCase = `
      CASE
        WHEN LOWER(TRIM(part_of)) = 'thinlayer' THEN 'thinLayer'
        WHEN LOWER(TRIM(part_of)) = 'full swap' THEN 'fullSwap'
        WHEN LOWER(TRIM(part_of)) LIKE '%swap%for%exsting%'
          OR LOWER(TRIM(part_of)) LIKE '%swap%for%existing%'
          OR LOWER(TRIM(part_of)) LIKE '%swap%existing%'
          OR LOWER(TRIM(part_of)) LIKE '%swap%exsting%' THEN 'swapExisting'
        ELSE 'notSpecified'
      END
    `

    // Helper to check TSSR Ready (handles 'TSSR Ready' text, 'yes', or 1)
    const tssrReadyCheck = `
      (tssr_ready IS NOT NULL AND (
        tssr_ready = 1
        OR LOWER(TRIM(tssr_ready)) = 'yes'
        OR LOWER(TRIM(tssr_ready)) LIKE '%tssr%ready%'
        OR LOWER(TRIM(tssr_ready)) LIKE '%ready%'
      ))
    `

    const stmt = database.prepare(`
      SELECT
        -- Total Scope
        COUNT(*) as total,
        SUM(CASE WHEN ${partOfCase} = 'thinLayer' THEN 1 ELSE 0 END) as total_thin_layer,
        SUM(CASE WHEN ${partOfCase} = 'fullSwap' THEN 1 ELSE 0 END) as total_full_swap,
        SUM(CASE WHEN ${partOfCase} = 'swapExisting' THEN 1 ELSE 0 END) as total_swap_existing,

        -- Survey Done (ts_survey_ac is not empty)
        SUM(CASE WHEN ts_survey_ac IS NOT NULL AND TRIM(ts_survey_ac) != '' THEN 1 ELSE 0 END) as survey_done,
        SUM(CASE WHEN ts_survey_ac IS NOT NULL AND TRIM(ts_survey_ac) != '' AND ${partOfCase} = 'thinLayer' THEN 1 ELSE 0 END) as survey_thin_layer,
        SUM(CASE WHEN ts_survey_ac IS NOT NULL AND TRIM(ts_survey_ac) != '' AND ${partOfCase} = 'fullSwap' THEN 1 ELSE 0 END) as survey_full_swap,
        SUM(CASE WHEN ts_survey_ac IS NOT NULL AND TRIM(ts_survey_ac) != '' AND ${partOfCase} = 'swapExisting' THEN 1 ELSE 0 END) as survey_swap_existing,

        -- TSSR Ready
        SUM(CASE WHEN ${tssrReadyCheck} THEN 1 ELSE 0 END) as tssr_ready_count,
        SUM(CASE WHEN ${tssrReadyCheck} AND ${partOfCase} = 'thinLayer' THEN 1 ELSE 0 END) as ready_thin_layer,
        SUM(CASE WHEN ${tssrReadyCheck} AND ${partOfCase} = 'fullSwap' THEN 1 ELSE 0 END) as ready_full_swap,
        SUM(CASE WHEN ${tssrReadyCheck} AND ${partOfCase} = 'swapExisting' THEN 1 ELSE 0 END) as ready_swap_existing,

        -- TSSR Submitted (version is not empty)
        SUM(CASE WHEN version IS NOT NULL AND TRIM(version) != '' THEN 1 ELSE 0 END) as tssr_submitted,
        SUM(CASE WHEN version IS NOT NULL AND TRIM(version) != '' AND ${partOfCase} = 'thinLayer' THEN 1 ELSE 0 END) as submitted_thin_layer,
        SUM(CASE WHEN version IS NOT NULL AND TRIM(version) != '' AND ${partOfCase} = 'fullSwap' THEN 1 ELSE 0 END) as submitted_full_swap,
        SUM(CASE WHEN version IS NOT NULL AND TRIM(version) != '' AND ${partOfCase} = 'swapExisting' THEN 1 ELSE 0 END) as submitted_swap_existing,

        -- Approved
        SUM(CASE WHEN tssr_overall_status = 'Approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN tssr_overall_status = 'Approved' AND ${partOfCase} = 'thinLayer' THEN 1 ELSE 0 END) as approved_thin_layer,
        SUM(CASE WHEN tssr_overall_status = 'Approved' AND ${partOfCase} = 'fullSwap' THEN 1 ELSE 0 END) as approved_full_swap,
        SUM(CASE WHEN tssr_overall_status = 'Approved' AND ${partOfCase} = 'swapExisting' THEN 1 ELSE 0 END) as approved_swap_existing,

        -- RFI (rfi_status is not empty)
        SUM(CASE WHEN rfi_status IS NOT NULL AND TRIM(rfi_status) != '' THEN 1 ELSE 0 END) as rfi,
        SUM(CASE WHEN rfi_status IS NOT NULL AND TRIM(rfi_status) != '' AND ${partOfCase} = 'thinLayer' THEN 1 ELSE 0 END) as rfi_thin_layer,
        SUM(CASE WHEN rfi_status IS NOT NULL AND TRIM(rfi_status) != '' AND ${partOfCase} = 'fullSwap' THEN 1 ELSE 0 END) as rfi_full_swap,
        SUM(CASE WHEN rfi_status IS NOT NULL AND TRIM(rfi_status) != '' AND ${partOfCase} = 'swapExisting' THEN 1 ELSE 0 END) as rfi_swap_existing
      FROM sites
      ${whereClause}
    `)

    const result = stmt.get(...params)
    console.log('📊 Overview Stats Result:', JSON.stringify(result, null, 2))

    // Return result with defaults for null values
    if (!result) return defaults

    return Object.keys(defaults).reduce((acc, key) => {
      acc[key] = result[key] ?? defaults[key]
      return acc
    }, {})
  } catch (error) {
    console.error('❌ getOverviewStats error:', error)
    return defaults
  }
}

// Get overview table (pivot: status rows x part_of columns)
sitesQueries.getOverviewTable = (phase) => {
  const database = db.getDB()
  let whereClause = ''
  let params = []

  if (phase && phase !== 'ALL') {
    whereClause = 'WHERE phase_name = ?'
    params.push(phase)
  }

  // Debug: Check Part Of values in DB
  const debugStmt = database.prepare(`
    SELECT DISTINCT part_of, COUNT(*) as cnt FROM sites
    ${whereClause}
    GROUP BY part_of ORDER BY cnt DESC
  `)
  const partOfDebug = debugStmt.all(...params)
  console.log('📊 Part Of values in DB:', JSON.stringify(partOfDebug, null, 2))

  const stmt = database.prepare(`
    SELECT
      COALESCE(NULLIF(tssr_overall_status, ''), 'Not Set') as status,
      SUM(CASE
        WHEN LOWER(TRIM(part_of)) = 'thinlayer'
        OR LOWER(TRIM(part_of)) = 'thin layer'
        OR LOWER(TRIM(part_of)) LIKE '%thin%layer%'
        THEN 1 ELSE 0 END) as thin_layer,
      SUM(CASE
        WHEN LOWER(TRIM(part_of)) = 'full swap'
        OR LOWER(TRIM(part_of)) LIKE '%full%swap%'
        THEN 1 ELSE 0 END) as full_swap,
      SUM(CASE
        WHEN LOWER(TRIM(part_of)) LIKE '%swap%exsting%'
        OR LOWER(TRIM(part_of)) LIKE '%swap%existing%'
        OR LOWER(TRIM(part_of)) LIKE '%swap for ex%thin%'
        THEN 1 ELSE 0 END) as swap_existing,
      SUM(CASE WHEN part_of IS NULL OR TRIM(part_of) = '' THEN 1 ELSE 0 END) as not_specified,
      COUNT(*) as total
    FROM sites
    ${whereClause}
    GROUP BY tssr_overall_status
    ORDER BY total DESC
  `)
  return stmt.all(...params)
}

// Get unique Part Of values
sitesQueries.getPartOfValues = (phase) => {
  const database = db.getDB()
  let whereClause = ''
  let params = []

  if (phase && phase !== 'ALL') {
    whereClause = 'WHERE phase_name = ?'
    params.push(phase)
  }

  const stmt = database.prepare(`
    SELECT DISTINCT part_of, COUNT(*) as count
    FROM sites
    ${whereClause}
    GROUP BY part_of
    ORDER BY count DESC
  `)
  return stmt.all(...params)
}

// Debug function to check data
sitesQueries.debugPhaseCount = () => {
  const database = db.getDB()

  // Total count
  const total = database.prepare('SELECT COUNT(*) as count FROM sites').get()

  // Count by phase (including NULL/empty)
  const byPhase = database.prepare(`
    SELECT
      COALESCE(NULLIF(phase_name, ''), 'EMPTY/NULL') as phase,
      COUNT(*) as count
    FROM sites
    GROUP BY phase_name
    ORDER BY count DESC
  `).all()

  // Check for variations of RO4
  const ro4Variations = database.prepare(`
    SELECT phase_name, COUNT(*) as count
    FROM sites
    WHERE phase_name LIKE '%RO4%' OR phase_name LIKE '%ro4%' OR phase_name LIKE '%Ro4%'
    GROUP BY phase_name
  `).all()

  console.log('=== DEBUG: Phase Data ===')
  console.log('Total records:', total.count)
  console.log('By phase:', byPhase)
  console.log('RO4 variations:', ro4Variations)

  return { total: total.count, byPhase, ro4Variations }
}

// Get detailed stats for all contractors
sitesQueries.getContractorDetailedStats = (phase) => {
  const database = db.getDB()
  let whereClause = ''
  let params = []

  console.log('👷 getContractorDetailedStats - Input phase:', JSON.stringify(phase), 'Type:', typeof phase)

  if (phase && phase !== 'ALL') {
    whereClause = 'WHERE phase_name = ?'
    params.push(phase)
  }

  const contractorsSql = `
    SELECT DISTINCT tssr_subcon as name
    FROM sites
    ${whereClause}
    ${whereClause ? 'AND' : 'WHERE'} tssr_subcon IS NOT NULL AND tssr_subcon != ''
    ORDER BY tssr_subcon
  `
  
  console.log('👷 getContractorDetailedStats - SQL:', contractorsSql)
  console.log('👷 getContractorDetailedStats - Params:', params)
  
  const contractorsStmt = database.prepare(contractorsSql)
  const contractors = contractorsStmt.all(...params)
  
  // Ensure contractors is always an array
  const contractorsArray = Array.isArray(contractors) ? contractors : []

  console.log('👷 Found contractors:', contractorsArray.length)
  console.log('👷 First 3 contractor names:', contractorsArray.slice(0, 3).map(c => c.name))

  if (contractorsArray.length === 0) {
    console.log('⚠️ No contractors found!')
    // Test if any contractors exist in DB
    const testStmt = database.prepare(`
      SELECT COUNT(DISTINCT tssr_subcon) as count 
      FROM sites 
      WHERE tssr_subcon IS NOT NULL AND tssr_subcon != ''
    `)
    const testResult = testStmt.get()
    console.log('⚠️ Total unique contractors in DB:', testResult.count)
    
    if (phase && phase !== 'ALL') {
      const phaseTestStmt = database.prepare(`
        SELECT COUNT(DISTINCT tssr_subcon) as count 
        FROM sites 
        WHERE phase_name = ? AND tssr_subcon IS NOT NULL AND tssr_subcon != ''
      `)
      const phaseTestResult = phaseTestStmt.get(phase)
      console.log('⚠️ Contractors for phase', phase, ':', phaseTestResult.count)
    }
  }

  const result = contractorsArray.map((contractor, index) => {
    const contractorName = contractor.name
    const contractorParams = phase && phase !== 'ALL' ? [phase, contractorName] : [contractorName]
    const phaseCondition = phase && phase !== 'ALL' ? 'phase_name = ? AND' : ''

    if (index === 0) {
      console.log('👷 Processing first contractor:', contractorName)
      console.log('👷 Phase condition:', phaseCondition || 'none')
      console.log('👷 Params for queries:', contractorParams)
    }

    // Get counts by status
    const statusStmt = database.prepare(`
      SELECT
        COALESCE(NULLIF(tssr_overall_status, ''), 'Not Set') as status,
        COUNT(*) as count
      FROM sites
      WHERE ${phaseCondition} tssr_subcon = ?
      GROUP BY tssr_overall_status
    `)
    const statusCounts = statusStmt.all(...contractorParams)

    if (index === 0) {
      console.log('👷 Status counts for first contractor:', statusCounts)
    }

    // Get total sites
    const totalStmt = database.prepare(`
      SELECT COUNT(*) as count
      FROM sites
      WHERE ${phaseCondition} tssr_subcon = ?
    `)
    const totalSites = totalStmt.get(...contractorParams)

    // Get RFI count
    const rfiStmt = database.prepare(`
      SELECT COUNT(*) as count
      FROM sites
      WHERE ${phaseCondition} tssr_subcon = ?
        AND rfi_status IS NOT NULL AND rfi_status != ''
    `)
    const rfiCount = rfiStmt.get(...contractorParams)

    // Get survey done count
    const surveyStmt = database.prepare(`
      SELECT COUNT(*) as count
      FROM sites
      WHERE ${phaseCondition} tssr_subcon = ?
        AND ts_survey_ac IS NOT NULL AND ts_survey_ac != ''
    `)
    const surveyDone = surveyStmt.get(...contractorParams)

    // Get TSSR submitted count (version not empty)
    const submittedStmt = database.prepare(`
      SELECT COUNT(*) as count
      FROM sites
      WHERE ${phaseCondition} tssr_subcon = ?
        AND version IS NOT NULL AND version != ''
    `)
    const tssrSubmitted = submittedStmt.get(...contractorParams)

    // Get counts by Part Of with flexible matching for typo
    const partOfStmt = database.prepare(`
      SELECT
        CASE
          WHEN LOWER(TRIM(part_of)) IN ('thinlayer', 'thin layer') THEN 'ThinLayer'
          WHEN LOWER(TRIM(part_of)) = 'full swap' THEN 'Full Swap'
          WHEN LOWER(TRIM(part_of)) LIKE '%swap%exsting%'
            OR LOWER(TRIM(part_of)) LIKE '%swap%existing%' THEN 'Swap Existing'
          ELSE 'Not Specified'
        END as category,
        COUNT(*) as total,
        SUM(CASE WHEN tssr_overall_status = 'Approved' THEN 1 ELSE 0 END) as approved
      FROM sites
      WHERE ${phaseCondition} tssr_subcon = ?
      GROUP BY category
    `)
    const partOfCounts = partOfStmt.all(...contractorParams)

    // Get rejection count from rejections_log if it exists
    let rejectionCount = 0
    try {
      const rejStmt = database.prepare(`
        SELECT COUNT(*) as count
        FROM rejections_log
        WHERE contractor_name = ?
      `)
      const rejResult = rejStmt.get(contractorName)
      rejectionCount = rejResult?.count || 0
    } catch (e) {
      // Table might not exist
      rejectionCount = 0
    }

    return {
      name: contractorName,
      totalSites: totalSites?.count || 0,
      statusCounts: statusCounts,
      rfiCount: rfiCount?.count || 0,
      surveyDone: surveyDone?.count || 0,
      tssrSubmitted: tssrSubmitted?.count || 0,
      partOfCounts: partOfCounts,
      rejectionCount: rejectionCount
    }
  })
  
  console.log('👷 Returning', result.length, 'contractors with detailed stats')
  if (result.length > 0) {
    console.log('👷 First contractor result:', JSON.stringify(result[0], null, 2))
  }
  
  return result
}

/**
 * Update a site by ID and phase
 * @param {string} siteId - Site ID
 * @param {string} phaseName - Phase name
 * @param {Object} updates - Fields to update
 * @returns {Object} Updated site or null
 */
sitesQueries.updateSite = (siteId, phaseName, updates) => {
  const database = db.getDB()

  if (!siteId) {
    throw new Error('Site ID is required')
  }

  // Filter out undefined values and system fields
  const allowedFields = [
    'final_site_name', 'governorate', 'latitude', 'longitude', 'height_m',
    'ti_status', 'ti_comment', 'rf_plan_status', 'rf_plan_comment',
    'rf_opt_status', 'rf_opt_comment', 'civil_status', 'civil_comment',
    'mw_status', 'mw_comment', 'nokia_npo_status', 'nokia_npo_comment',
    'tssr_overall_status', 'tssr_status_date', 'tssr_subcon',
    'action_age', 'tssr_ready', 'version', 'part_of',
    'ts_survey_ac', 'rfi_status', 'tssr_remark', 'priority',
    'updated_at', 'updated_by'
  ]

  const updateFields = []
  const values = []

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key) && value !== undefined) {
      updateFields.push(`${key} = ?`)
      values.push(value)
    }
  }

  if (updateFields.length === 0) {
    throw new Error('No valid fields to update')
  }

  // Add updated_at timestamp
  updateFields.push('updated_at = ?')
  values.push(new Date().toISOString())

  // Build WHERE clause
  let whereClause = 'WHERE site_id = ?'
  values.push(siteId)

  if (phaseName && phaseName !== 'ALL') {
    whereClause += ' AND phase_name = ?'
    values.push(phaseName)
  }

  const sql = `UPDATE sites SET ${updateFields.join(', ')} ${whereClause}`

  try {
    const stmt = database.prepare(sql)
    const result = stmt.run(...values)

    if (result.changes === 0) {
      return null // No site found
    }

    // Return updated site
    return sitesQueries.getSiteById(siteId, phaseName)
  } catch (error) {
    console.error('Update site error:', error)
    throw error
  }
}

/**
 * Get all sites by phase name
 * @param {string} phaseName - Phase name to filter by
 * @returns {Array} Array of site records
 */
sitesQueries.getSitesByPhase = (phaseName) => {
  const database = db.getDB()

  if (!phaseName) {
    throw new Error('Phase name is required')
  }

  const stmt = database.prepare(`
    SELECT * FROM sites
    WHERE phase_name = ?
    ORDER BY priority ASC, site_id ASC
  `)

  return stmt.all(phaseName)
}

/**
 * Get site count by phase name
 * @param {string} phaseName - Phase name to filter by
 * @returns {number} Count of sites
 */
sitesQueries.getSitesCount = (phaseName) => {
  const database = db.getDB()

  if (phaseName) {
    const stmt = database.prepare('SELECT COUNT(*) as count FROM sites WHERE phase_name = ?')
    const result = stmt.get(phaseName)
    return result ? result.count : 0
  } else {
    const stmt = database.prepare('SELECT COUNT(*) as count FROM sites')
    const result = stmt.get()
    return result ? result.count : 0
  }
}

/**
 * Get all phases with counts
 * @returns {Array} Array of {phase_name, count}
 */
sitesQueries.getSitesPhases = () => {
  const database = db.getDB()

  const stmt = database.prepare(`
    SELECT DISTINCT phase_name, COUNT(*) as count
    FROM sites
    WHERE phase_name IS NOT NULL AND phase_name != ''
    GROUP BY phase_name
    ORDER BY count DESC
  `)

  return stmt.all()
}

module.exports = sitesQueries
