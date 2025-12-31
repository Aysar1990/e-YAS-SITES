/**
 * Single File Processor - Day 7
 *
 * Handles single Excel file import with validation, parsing,
 * transformation, and database operations.
 *
 * Unlike batch processor, this handles one file at a time
 * with detailed error reporting and WebSocket notifications.
 */

const path = require('path')
const fs = require('fs')
const excelReader = require('../excelReader')
const {
  IMPORT_OPERATION,
  IMPORT_STATUS,
  VALIDATION_ERROR,
  COLUMN_MAPPING,
  REQUIRED_FIELDS,
  NUMERIC_FIELDS,
  BOOLEAN_FIELDS,
  convertValue,
  validateRecord,
  generateInsertSQL
} = require('../importTypes')
const { generateUpsertSQL, getSQLiteColumns } = require('../../columnDefinitions')

// Single file configuration
const SINGLE_FILE_CONFIG = {
  maxFileSizeMB: 10,
  allowedExtensions: ['.xlsx', '.xlsm', '.xls'],
  tableName: 'sites'
}

/**
 * Validate single Excel file before processing
 * @param {string} filePath - Path to the Excel file
 * @returns {Object} Validation result { valid, errors, warnings, fileInfo }
 */
function validateFile(filePath) {
  const result = {
    valid: true,
    errors: [],
    warnings: [],
    fileInfo: null
  }

  try {
    // Check file exists
    if (!fs.existsSync(filePath)) {
      result.valid = false
      result.errors.push({
        type: 'FILE_NOT_FOUND',
        message: `File not found: ${filePath}`
      })
      return result
    }

    // Get file info
    const stats = fs.statSync(filePath)
    const fileSizeMB = stats.size / (1024 * 1024)
    const ext = path.extname(filePath).toLowerCase()
    const fileName = path.basename(filePath)

    result.fileInfo = {
      name: fileName,
      path: filePath,
      size: stats.size,
      sizeMB: fileSizeMB.toFixed(2),
      extension: ext,
      modified: stats.mtime.toISOString()
    }

    // Check file extension
    if (!SINGLE_FILE_CONFIG.allowedExtensions.includes(ext)) {
      result.valid = false
      result.errors.push({
        type: 'INVALID_EXTENSION',
        message: `Invalid file extension: ${ext}. Allowed: ${SINGLE_FILE_CONFIG.allowedExtensions.join(', ')}`
      })
    }

    // Check file size
    if (fileSizeMB > SINGLE_FILE_CONFIG.maxFileSizeMB) {
      result.valid = false
      result.errors.push({
        type: 'FILE_TOO_LARGE',
        message: `File size (${fileSizeMB.toFixed(2)} MB) exceeds maximum (${SINGLE_FILE_CONFIG.maxFileSizeMB} MB)`
      })
    }

    // Check if file is readable
    try {
      fs.accessSync(filePath, fs.constants.R_OK)
    } catch (e) {
      result.valid = false
      result.errors.push({
        type: 'FILE_NOT_READABLE',
        message: 'File is not readable. Check permissions.'
      })
    }

    console.log(`📋 File validation: ${fileName} (${fileSizeMB.toFixed(2)} MB) - ${result.valid ? 'VALID' : 'INVALID'}`)

  } catch (error) {
    result.valid = false
    result.errors.push({
      type: 'VALIDATION_ERROR',
      message: error.message
    })
  }

  return result
}

/**
 * Parse Excel file using excelReader
 * @param {string} filePath - Path to the Excel file
 * @returns {Object} Parse result { success, sites, stats, errors }
 */
function parseFile(filePath) {
  const result = {
    success: false,
    sites: [],
    stats: null,
    errors: [],
    warnings: []
  }

  try {
    console.log(`📖 Parsing Excel file: ${path.basename(filePath)}`)

    // Use excelReader to get all data
    const sites = excelReader.getAllData(filePath)
    const stats = excelReader.getLastReadStats()
    const errors = excelReader.getErrors()
    const warnings = excelReader.getWarnings()

    if (!sites || sites.length === 0) {
      result.errors.push({
        type: 'NO_DATA',
        message: 'No valid data found in Excel file'
      })
      return result
    }

    result.success = true
    result.sites = sites
    result.stats = stats
    result.errors = errors.map(e => ({ type: 'PARSE_ERROR', message: e }))
    result.warnings = warnings.map(w => ({ type: 'PARSE_WARNING', message: w }))

    console.log(`✅ Parsed ${sites.length} sites from Excel file`)

  } catch (error) {
    console.error(`❌ Parse error: ${error.message}`)
    result.errors.push({
      type: 'PARSE_EXCEPTION',
      message: error.message
    })
  }

  return result
}

/**
 * Apply single file processing rules - PLACEHOLDER
 *
 * TODO: User will customize single file processing logic here
 * This is different from batch processing rules.
 *
 * Example customizations:
 * - Filter sites by specific criteria
 * - Apply data transformations
 * - Validate business rules
 * - Set default values
 * - Flag sites for review
 *
 * @param {Object} fileData - Parsed file data { sites, stats }
 * @returns {Object} Processed data with applied rules
 */
function applySingleFileRules(fileData) {
  // TODO: User will customize single file processing logic here
  // This function is intentionally left as a passthrough.
  // Implement your custom rules based on your business requirements.
  //
  // Example implementations:
  //
  // 1. Filter by phase:
  //    fileData.sites = fileData.sites.filter(s => s.phaseName === 'RO4')
  //
  // 2. Set default contractor:
  //    fileData.sites.forEach(s => {
  //      if (!s.tssrSubcon) s.tssrSubcon = 'Default Contractor'
  //    })
  //
  // 3. Validate coordinates:
  //    fileData.sites.forEach(s => {
  //      if (!s.longitude || !s.latitude) {
  //        s._validationWarning = 'Missing coordinates'
  //      }
  //    })

  console.log('📋 applySingleFileRules: Passthrough (customize as needed)')

  return {
    ...fileData,
    rulesApplied: false,
    rulesMessage: 'No custom rules applied. Edit applySingleFileRules() to add your logic.'
  }
}

/**
 * Transform raw site data to database format
 * @param {Object} rawSite - Raw site from Excel reader (camelCase)
 * @returns {Object} Database record (snake_case)
 */
function transformSiteData(rawSite) {
  // Get TSSR Overall Status for calculations
  const tssrStatus = rawSite.tssrOverallStatus || ''

  // ═══════════════════════════════════════════════════════════════════
  // CALCULATED FIELDS - Excel Formulas converted to JavaScript
  // ═══════════════════════════════════════════════════════════════════

  // 1. TS Survey (Ac) - Column Y
  // =IF(OR(BA="Approved", BA="TSSR Under Zain validation", ...etc), "Done", "")
  const tsSurveyStatuses = [
    'Approved',
    'TSSR Under Zain validation',
    'TSSR Under ROM Review',
    'TSSR Under Nokia NPO Validation',
    'TSSR Under Nokia ROM Validation',
    'TSSR Under Nokia GSD Validation',
    'TSSR Under Subcon validation'
  ]
  const calculatedTsSurveyAc = tsSurveyStatuses.includes(tssrStatus) ? 'Done' : ''

  // 2. TSSR Ready - Column BK
  // =IF(OR(BA="Approved", BA="TSSR Under Zain validation", ...etc), "TSSR Ready ", "")
  const tssrReadyStatuses = [
    'Approved',
    'TSSR Under Zain validation',
    'TSSR Under ROM Review',
    'TSSR Under Nokia NPO Validation',
    'TSSR Under Nokia ROM Validation',
    'TSSR Under Nokia GSD Validation'
  ]
  const calculatedTssrReady = tssrReadyStatuses.includes(tssrStatus) ? 'TSSR Ready ' : ''

  // 3. SPOC Readiness - Column AX
  // =COUNTIFS(AI:AU,"Released")+COUNTIFS(AI:AU,"Approved")
  // Count department statuses that are "Released" or "Approved"
  const departmentStatuses = [
    rawSite.tiStatus,
    rawSite.rfPlanStatus,
    rawSite.rfOptStatus,
    rawSite.civilStatus,
    rawSite.mwStatus,
    rawSite.nokiaNpoStatus
  ]
  const calculatedSpocReadiness = departmentStatuses.filter(
    status => status === 'Released' || status === 'Approved'
  ).length

  // ═══════════════════════════════════════════════════════════════════

  const record = {
    site_id: rawSite.siteId || null,
    final_site_name: rawSite.finalSiteName || null,
    site_owner: rawSite.siteOwner || null,
    site_code: rawSite.siteCode || null,
    site_type: rawSite.siteType || null,
    key_number: rawSite.keyNumber || null,
    longitude: rawSite.longitude || null,
    latitude: rawSite.latitude || null,
    governorate: rawSite.governorate || null,
    structure: rawSite.structure || null,
    owner_name: rawSite.ownerName || null,
    owner_contact_number: rawSite.ownerContactNumber || null,
    structure_type: rawSite.structureType || null,
    height_m: rawSite.heightM || null,
    part_of: rawSite.partOf || null,
    phase_name: rawSite.phaseName || null,
    priority: rawSite.priority || 0,
    cluster: rawSite.cluster || null,
    area: rawSite.area || null,
    weekly_plan: rawSite.weeklyPlan || null,
    tss_smp: rawSite.tssSmp || null,
    tssr_subcon: rawSite.tssrSubcon || null,
    new_allocation: rawSite.newAllocation || null,
    tssr_po: rawSite.tssrPo || null,
    // ✅ Use calculated value, fallback to Excel value if exists
    ts_survey_ac: calculatedTsSurveyAc || rawSite.tsSurveyAc || null,
    abcd: rawSite.abcd || null,
    ab: rawSite.ab || null,
    five_g_sectors_names: rawSite.fiveGSectorsNames || null,
    five_g_solution: rawSite.fiveGSolution || null,
    site_sectors: rawSite.siteSectors || null,
    ibs_sector: rawSite.ibsSector || null,
    tdd_site: rawSite.tddSite || null,
    nokia_npo_status: rawSite.nokiaNpoStatus || null,
    nokia_npo_comment: rawSite.nokiaNpoComment || null,
    ti_status: rawSite.tiStatus || null,
    ti_comment: rawSite.tiComment || null,
    cluster_owner_ti: rawSite.clusterOwnerTi || null,
    rf_plan_status: rawSite.rfPlanStatus || null,
    rf_plan_comment: rawSite.rfPlanComment || null,
    cluster_owner_planning: rawSite.clusterOwnerPlanning || null,
    rf_opt_status: rawSite.rfOptStatus || null,
    rf_opt_comment: rawSite.rfOptComment || null,
    cluster_owner_optimization: rawSite.clusterOwnerOptimization || null,
    civil_status: rawSite.civilStatus || null,
    civil_comment: rawSite.civilComment || null,
    cluster_owner_civil: rawSite.clusterOwnerCivil || null,
    mw_status: rawSite.mwStatus || null,
    cluster_owner_mw: rawSite.clusterOwnerMw || null,
    rec_cab_swap: rawSite.recCabSwap || null,
    // ✅ Use calculated value
    spoc_readiness: calculatedSpocReadiness || rawSite.spocReadiness || null,
    version: rawSite.version || null,
    spoc_status: rawSite.spocStatus || null,
    tssr_overall_status: rawSite.tssrOverallStatus || null,
    tssr_status_date: rawSite.tssrStatusDate || null,
    spoc_reviewed: rawSite.spocReviewed || null,
    week_number: rawSite.weekNumber || null,
    tssr_remark: rawSite.tssrRemark || null,
    action_age: rawSite.actionAge || 0,
    rfi_status: rawSite.rfiStatus || null,
    gap_analysis: rawSite.gapAnalysis || null,
    approved: rawSite.approved || null,
    nokia_site_owner: rawSite.nokiaSiteOwner || null,
    // ✅ Use calculated value
    tssr_ready: calculatedTssrReady || rawSite.tssrReady || null,
    dismantle_status: rawSite.dismantleStatus || null,
    dismantle_date: rawSite.dismantleDate || null,
    validate: rawSite.validate || null,
    red_zone_sites: rawSite.redZoneSites || null,
    sequence: rawSite.sequence || null
  }

  return record
}

/**
 * Save single site to database (insert or update)
 * Uses composite key: site_id + phase_name (55 sites may have same site_id with different phase_name)
 * @param {Object} siteRecord - Transformed site record
 * @param {Object} db - Database adapter
 * @returns {Object} Operation result { success, operation, error }
 */
function saveSiteToDb(siteRecord, db) {
  const result = {
    success: false,
    operation: null,
    siteId: siteRecord.site_id,
    phaseName: siteRecord.phase_name,
    error: null
  }

  try {
    if (!siteRecord.site_id) {
      result.error = 'Missing site_id'
      return result
    }

    // Check if site exists using composite key (site_id + phase_name)
    const existingStmt = db.prepare('SELECT site_id FROM sites WHERE site_id = ? AND phase_name = ?')
    const existing = existingStmt.get(siteRecord.site_id, siteRecord.phase_name || null)

    // Use UPSERT SQL from columnDefinitions (handles ON CONFLICT)
    const upsertSQL = generateUpsertSQL('sites')
    const columns = getSQLiteColumns()
    const values = columns.map(col => siteRecord[col] ?? null)

    const stmt = db.prepare(upsertSQL)
    stmt.run(...values)

    result.operation = existing ? IMPORT_OPERATION.UPDATE : IMPORT_OPERATION.INSERT
    result.success = true
    console.log(`  ${result.operation === IMPORT_OPERATION.INSERT ? '➕' : '🔄'} ${siteRecord.site_id} (${siteRecord.phase_name || 'no phase'})`)

  } catch (error) {
    result.error = error.message
    console.error(`  ❌ ${siteRecord.site_id}: ${error.message}`)
  }

  return result
}

/**
 * Broadcast site update via WebSocket
 * @param {Object} site - Site data
 * @param {string} operation - 'INSERT' or 'UPDATE'
 * @param {Object} wsServer - WebSocket server instance (optional)
 */
function broadcastSiteUpdate(site, operation, wsServer = null) {
  if (!wsServer) {
    console.log(`📡 Broadcast skipped (no WebSocket server): ${operation} ${site.site_id}`)
    return
  }

  try {
    const eventType = operation === IMPORT_OPERATION.INSERT ? 'site_added' : 'site_updated'

    wsServer.notifyDataUpdate(eventType, {
      site_id: site.site_id,
      phase_name: site.phase_name,
      tssr_overall_status: site.tssr_overall_status,
      timestamp: new Date().toISOString()
    })

    console.log(`📡 Broadcast: ${eventType} - ${site.site_id}`)
  } catch (error) {
    console.error(`📡 Broadcast error: ${error.message}`)
  }
}

/**
 * Process a single Excel file - Main orchestration function
 * @param {string} filePath - Path to Excel file
 * @param {Object} db - Database adapter
 * @param {Object} options - Processing options
 * @param {Object} options.wsServer - WebSocket server (optional)
 * @param {boolean} options.broadcastUpdates - Whether to broadcast updates
 * @param {boolean} options.dryRun - If true, don't save to database
 * @returns {Object} Processing result
 */
function processSingleFile(filePath, db, options = {}) {
  const {
    wsServer = null,
    broadcastUpdates = true,
    dryRun = false
  } = options

  const result = {
    status: IMPORT_STATUS.PENDING,
    filePath,
    fileName: path.basename(filePath),
    startTime: new Date().toISOString(),
    endTime: null,
    totalRecords: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    errors: [],
    warnings: [],
    dryRun
  }

  console.log('\n═══════════════════════════════════════════════════')
  console.log(`  Single File Import: ${result.fileName}`)
  console.log('═══════════════════════════════════════════════════\n')

  try {
    result.status = IMPORT_STATUS.PROCESSING

    // Step 1: Validate file
    console.log('Step 1: Validating file...')
    const validation = validateFile(filePath)

    if (!validation.valid) {
      result.status = IMPORT_STATUS.FAILED
      result.errors.push(...validation.errors)
      result.endTime = new Date().toISOString()
      console.log('❌ Validation failed')
      return result
    }
    result.warnings.push(...validation.warnings)
    console.log('✅ File validation passed\n')

    // Step 2: Parse file
    console.log('Step 2: Parsing Excel file...')
    const parseResult = parseFile(filePath)

    if (!parseResult.success) {
      result.status = IMPORT_STATUS.FAILED
      result.errors.push(...parseResult.errors)
      result.endTime = new Date().toISOString()
      console.log('❌ Parsing failed')
      return result
    }
    result.warnings.push(...parseResult.warnings)
    result.totalRecords = parseResult.sites.length
    console.log(`✅ Parsed ${result.totalRecords} records\n`)

    // Step 3: Apply rules
    console.log('Step 3: Applying single file rules...')
    const processedData = applySingleFileRules(parseResult)
    console.log(`✅ Rules applied: ${processedData.rulesMessage}\n`)

    // Step 4: Transform and save each site
    console.log('Step 4: Transforming and saving to database...')

    if (dryRun) {
      console.log('⚠️  DRY RUN MODE - No changes will be saved\n')
    }

    for (const rawSite of processedData.sites) {
      // Transform to database format
      const siteRecord = transformSiteData(rawSite)

      // Validate record
      const validationResult = validateRecord(siteRecord)

      if (!validationResult.valid) {
        result.failed++
        result.errors.push({
          siteId: siteRecord.site_id,
          errors: validationResult.errors
        })
        continue
      }

      if (dryRun) {
        result.inserted++ // Count as would-be inserted
        continue
      }

      // Save to database
      const saveResult = saveSiteToDb(siteRecord, db)

      if (saveResult.success) {
        if (saveResult.operation === IMPORT_OPERATION.INSERT) {
          result.inserted++
        } else {
          result.updated++
        }

        // Broadcast update
        if (broadcastUpdates && wsServer) {
          broadcastSiteUpdate(siteRecord, saveResult.operation, wsServer)
        }
      } else {
        result.failed++
        result.errors.push({
          siteId: siteRecord.site_id,
          error: saveResult.error
        })
      }
    }

    // Finalize result
    result.status = result.failed > 0 ? IMPORT_STATUS.PARTIAL : IMPORT_STATUS.COMPLETED
    result.endTime = new Date().toISOString()

    // ✅ Force save database to disk
    if (db.save) {
      db.save()
      console.log('💾 Database saved to disk')
    }

    console.log('\n═══════════════════════════════════════════════════')
    console.log('  Import Complete')
    console.log('═══════════════════════════════════════════════════')
    console.log(`  Status: ${result.status}`)
    console.log(`  Total: ${result.totalRecords}`)
    console.log(`  Inserted: ${result.inserted}`)
    console.log(`  Updated: ${result.updated}`)
    console.log(`  Failed: ${result.failed}`)
    console.log('═══════════════════════════════════════════════════\n')

  } catch (error) {
    result.status = IMPORT_STATUS.FAILED
    result.errors.push({
      type: 'FATAL_ERROR',
      message: error.message
    })
    result.endTime = new Date().toISOString()
    console.error(`❌ Fatal error: ${error.message}`)
  }

  return result
}

/**
 * Create a single file result structure
 * @returns {Object} Empty result structure
 */
function createSingleFileResult() {
  return {
    status: IMPORT_STATUS.PENDING,
    filePath: null,
    fileName: null,
    startTime: null,
    endTime: null,
    totalRecords: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    errors: [],
    warnings: []
  }
}

module.exports = {
  // Configuration
  SINGLE_FILE_CONFIG,

  // Core functions
  validateFile,
  parseFile,
  applySingleFileRules,
  transformSiteData,
  saveSiteToDb,
  broadcastSiteUpdate,
  processSingleFile,

  // Helpers
  createSingleFileResult
}
