/**
 * Batch Processor - Day 6: Excel Import Processing
 *
 * Handles batch import of Excel data into database
 * Basic implementation - edge cases to be added Day 7
 */

const path = require('path')
const {
  IMPORT_STATUS,
  IMPORT_OPERATION,
  DEFAULT_BATCH_CONFIG,
  createImportResult,
  createBatchResult,
  mapExcelRowToDbRecord,
  validateRecord,
  generateInsertSQL
} = require('./importTypes')
const excelReader = require('./excelReader')

class BatchProcessor {
  constructor(db, config = {}) {
    this.db = db
    this.config = { ...DEFAULT_BATCH_CONFIG, ...config }
    this.result = null
    this.onProgress = null
    this.aborted = false
  }

  /**
   * Process Excel file in batches
   * @param {string} filePath - Path to Excel file
   * @param {Function} onProgress - Progress callback(result)
   * @returns {Promise<Object>} Import result
   */
  async processFile(filePath, onProgress = null) {
    this.onProgress = onProgress
    this.result = createImportResult()
    this.result.startTime = new Date().toISOString()
    this.result.status = IMPORT_STATUS.PROCESSING
    this.aborted = false

    try {
      // Read Excel file
      const sites = excelReader.getAllData(filePath)

      if (!sites || sites.length === 0) {
        throw new Error('No valid data found in Excel file')
      }

      this.result.totalRecords = sites.length
      this._emitProgress()

      // Process in batches
      await this._processBatches(sites)

      // Finalize
      this.result.endTime = new Date().toISOString()
      this.result.status = this.result.failed > 0 ? IMPORT_STATUS.PARTIAL : IMPORT_STATUS.COMPLETED

      return this.result
    } catch (error) {
      this.result.status = IMPORT_STATUS.FAILED
      this.result.errors.push({ message: error.message, fatal: true })
      this.result.endTime = new Date().toISOString()
      return this.result
    }
  }

  /**
   * Process array of sites in batches
   * @param {Array} sites - Array of site objects from Excel
   */
  async _processBatches(sites) {
    const { batchSize } = this.config
    const totalBatches = Math.ceil(sites.length / batchSize)

    for (let i = 0; i < totalBatches && !this.aborted; i++) {
      const startIndex = i * batchSize
      const endIndex = Math.min(startIndex + batchSize, sites.length)
      const batchSites = sites.slice(startIndex, endIndex)

      const batchResult = await this._processSingleBatch(batchSites, i + 1, startIndex, endIndex)
      this.result.batches.push(batchResult)

      // Update totals
      this.result.processed += batchResult.processed
      this.result.inserted += batchResult.inserted
      this.result.updated += batchResult.updated
      this.result.skipped += batchResult.skipped
      this.result.failed += batchResult.failed

      this._emitProgress()
    }
  }

  /**
   * Process a single batch of sites
   * @param {Array} sites - Sites in this batch
   * @param {number} batchNumber - Batch number (1-indexed)
   * @param {number} startIndex - Start index in original array
   * @param {number} endIndex - End index in original array
   * @returns {Object} Batch result
   */
  async _processSingleBatch(sites, batchNumber, startIndex, endIndex) {
    const batchResult = createBatchResult(batchNumber)
    batchResult.startIndex = startIndex
    batchResult.endIndex = endIndex
    batchResult.status = IMPORT_STATUS.PROCESSING

    const startTime = Date.now()

    try {
      // Convert sites to DB records
      const records = sites.map(site => this._siteToDbRecord(site))

      // Validate if configured
      if (this.config.validateBeforeInsert) {
        for (const record of records) {
          const validation = validateRecord(record)
          if (!validation.valid) {
            batchResult.errors.push({
              siteId: record.site_id,
              errors: validation.errors
            })
          }
        }
      }

      // Insert/Update records
      const insertResults = await this._insertRecords(records)

      batchResult.processed = records.length
      batchResult.inserted = insertResults.inserted
      batchResult.updated = insertResults.updated
      batchResult.skipped = insertResults.skipped
      batchResult.failed = insertResults.failed

      batchResult.status = IMPORT_STATUS.COMPLETED
    } catch (error) {
      batchResult.status = IMPORT_STATUS.FAILED
      batchResult.errors.push({ message: error.message })
      batchResult.failed = sites.length
    }

    batchResult.duration = Date.now() - startTime
    return batchResult
  }

  /**
   * Convert site object (camelCase) to DB record (snake_case)
   * @param {Object} site - Site from Excel reader
   * @returns {Object} DB record
   */
  _siteToDbRecord(site) {
    return {
      site_id: site.siteId,
      final_site_name: site.finalSiteName,
      site_code: site.siteCode,
      site_type: site.siteType,
      key_number: site.keyNumber,
      longitude: site.longitude,
      latitude: site.latitude,
      governorate: site.governorate,
      structure: site.structure,
      structure_type: site.structureType,
      part_of: site.partOf,
      height_m: site.heightM,
      site_owner: site.siteOwner,
      phase_name: site.phaseName,
      priority: site.priority,
      cluster: site.cluster,
      area: site.area,
      weekly_plan: site.weeklyPlan,
      tss_smp: site.tssSmp,
      tssr_subcon: site.tssrSubcon,
      tssr_po: site.tssrPo,
      ts_survey_ac: site.tsSurveyAc,
      tssr_overall_status: site.tssrOverallStatus,
      tssr_status_date: site.tssrStatusDate,
      tssr_remark: site.tssrRemark,
      action_age: site.actionAge,
      five_g_sectors_names: site.fiveGSectorsNames,
      five_g_solution: site.fiveGSolution,
      site_sectors: site.siteSectors,
      ibs_sector: site.ibsSector,
      tdd_site: site.tddSite,
      version: site.version,
      rec_cab_swap: site.recCabSwap,
      ti_status: site.tiStatus,
      ti_comment: site.tiComment,
      cluster_owner_ti: site.clusterOwnerTi,
      rf_plan_status: site.rfPlanStatus,
      rf_plan_comment: site.rfPlanComment,
      cluster_owner_planning: site.clusterOwnerPlanning,
      rf_opt_status: site.rfOptStatus,
      rf_opt_comment: site.rfOptComment,
      cluster_owner_optimization: site.clusterOwnerOptimization,
      civil_status: site.civilStatus,
      civil_comment: site.civilComment,
      cluster_owner_civil: site.clusterOwnerCivil,
      mw_status: site.mwStatus,
      mw_comment: site.mwComment,
      cluster_owner_mw: site.clusterOwnerMw,
      nokia_npo_status: site.nokiaNpoStatus,
      nokia_npo_comment: site.nokiaNpoComment,
      nokia_site_owner: site.nokiaSiteOwner,
      rfi_status: site.rfiStatus,
      gap_analysis: site.gapAnalysis,
      approved: site.approved,
      tssr_ready: site.tssrReady
    }
  }

  /**
   * Insert/Update records in database
   * @param {Array} records - DB records to insert
   * @returns {Object} {inserted, updated, skipped, failed}
   */
  async _insertRecords(records) {
    const result = { inserted: 0, updated: 0, skipped: 0, failed: 0 }
    const errors = []

    const columns = Object.keys(records[0] || {})
    if (columns.length === 0) return result

    const sql = generateInsertSQL('sites', columns)

    try {
      // Get the actual database adapter (Supabase or SQLite)
      const database = this.db.getDB()
      
      const txn = database.transaction(() => {
        for (const record of records) {
          try {
            const values = columns.map(col => record[col] ?? null)
            const stmt = database.prepare(sql)
            stmt.run(...values)
            result.inserted++
          } catch (err) {
            result.failed++
            errors.push({
              siteId: record.site_id,
              message: err.message
            })
          }
        }
      })

      txn()

      // Add errors to main result if available
      if (this.result && this.result.errors) {
        this.result.errors.push(...errors)
      }
    } catch (error) {
      result.failed = records.length
      throw error
    }

    return result
  }

  /**
   * Apply batch rules - PLACEHOLDER for Day 7
   * @param {Array} records - Records to apply rules to
   * @returns {Array} Modified records
   */
  applyBatchRules(records) {
    // TODO: Implement batch rules in Day 7
    // - Duplicate handling
    // - Field transformations
    // - Business rule validation
    return records
  }

  /**
   * Abort processing
   */
  abort() {
    this.aborted = true
  }

  /**
   * Emit progress update
   */
  _emitProgress() {
    if (this.onProgress && typeof this.onProgress === 'function') {
      this.onProgress({ ...this.result })
    }
  }

  /**
   * Get current result
   */
  getResult() {
    return this.result
  }
}

/**
 * Process multiple Excel files
 * @param {Object} db - Database instance
 * @param {Array<string>} filePaths - Array of file paths
 * @param {Function} onProgress - Progress callback
 * @param {Object} config - Batch config
 * @returns {Promise<Object>} Combined result
 */
async function processMultipleFiles(db, filePaths, onProgress = null, config = {}) {
  const combinedResult = {
    status: IMPORT_STATUS.PENDING,
    files: [],
    totalRecords: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    errors: []
  }

  for (const filePath of filePaths) {
    const processor = new BatchProcessor(db, config)
    const fileResult = await processor.processFile(filePath, (progress) => {
      if (onProgress) {
        onProgress({
          currentFile: path.basename(filePath),
          fileProgress: progress,
          overall: combinedResult
        })
      }
    })

    combinedResult.files.push({
      path: filePath,
      name: path.basename(filePath),
      result: fileResult
    })

    combinedResult.totalRecords += fileResult.totalRecords
    combinedResult.inserted += fileResult.inserted
    combinedResult.updated += fileResult.updated
    combinedResult.skipped += fileResult.skipped
    combinedResult.failed += fileResult.failed
  }

  combinedResult.status = combinedResult.failed > 0 ? IMPORT_STATUS.PARTIAL : IMPORT_STATUS.COMPLETED

  // ✅ CRITICAL FIX: Force save database to disk after batch import
  if (db && typeof db.save === 'function') {
    db.save()
    console.log('💾 Database saved after batch import')
  }

  return combinedResult
}

/**
 * Quick import - simple wrapper for single file
 * @param {Object} db - Database instance
 * @param {string} filePath - Excel file path
 * @returns {Promise<Object>} Import result
 */
async function quickImport(db, filePath) {
  const processor = new BatchProcessor(db)
  const result = await processor.processFile(filePath)

  // ✅ CRITICAL FIX: Force save database to disk after quick import
  if (db && typeof db.save === 'function') {
    db.save()
    console.log('💾 Database saved after quick import')
  }

  return result
}

module.exports = {
  BatchProcessor,
  processMultipleFiles,
  quickImport
}
