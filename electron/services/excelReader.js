/**
 * TSSR Monitor - Excel Reader Service
 *
 * Reads and parses TSSR Excel files (.xlsm, .xlsx)
 * Handles Auto Filters and validates data integrity
 *
 * @author TSSR Monitor Team
 * @version 2.0.0
 */

const XLSX = require('xlsx')
const fs = require('fs')
const crypto = require('crypto')
const path = require('path')

/**
 * Expected data structure for validation
 */
const EXPECTED = {
  TOTAL_ROWS_MIN: 3000,        // Minimum expected rows (alert if below)
  TOTAL_ROWS_EXPECTED: 3791,   // Expected row count
  TOTAL_COLUMNS_MIN: 50,       // Minimum expected columns
  TOTAL_COLUMNS_EXPECTED: 68,  // Expected column count
  REQUIRED_FIELDS: [
    'Site ID',
    'Final Site Name',
    'Governorate',
    'TSSR Overall Status'
  ],
  HEADER_SEARCH_ROWS: 15       // Max rows to search for header
}

/**
 * Cache for Excel file reads
 */
const fileCache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

class ExcelReader {
  constructor() {
    this.workbook = null
    this.worksheet = null
    this.sheetName = null
    this.headerRow = 0
    this.lastReadStats = null
    this.errors = []
    this.warnings = []
    this.progressCallback = null
    this.useCache = true
  }

  /**
   * Set progress callback for reporting
   * @param {Function} callback - (progress: number, message: string) => void
   */
  setProgressCallback(callback) {
    this.progressCallback = callback
  }

  /**
   * Report progress to callback
   * @param {number} progress - 0-100
   * @param {string} message - Status message
   */
  reportProgress(progress, message) {
    if (this.progressCallback) {
      this.progressCallback(progress, message)
    }
    console.log(`[${progress}%] ${message}`)
  }

  /**
   * Enable or disable caching
   * @param {boolean} enabled
   */
  setCacheEnabled(enabled) {
    this.useCache = enabled
  }

  /**
   * Clear the file cache
   */
  clearCache() {
    fileCache.clear()
    console.log('✅ Excel cache cleared')
  }

  /**
   * Get cached data if available and valid
   * @param {string} filePath
   * @returns {Object|null}
   */
  getCachedData(filePath) {
    if (!this.useCache) return null

    const cacheKey = this.getCacheKey(filePath)
    const cached = fileCache.get(cacheKey)

    if (cached) {
      const now = Date.now()
      if (now - cached.timestamp < CACHE_TTL) {
        // Check if file was modified
        try {
          const stats = fs.statSync(filePath)
          if (stats.mtimeMs <= cached.fileModTime) {
            console.log('📦 Using cached data for:', path.basename(filePath))
            return cached.data
          }
        } catch (e) {
          // File may have been deleted
        }
      }
      // Cache expired or file modified
      fileCache.delete(cacheKey)
    }
    return null
  }

  /**
   * Cache data for file
   * @param {string} filePath
   * @param {Array} data
   */
  setCachedData(filePath, data) {
    if (!this.useCache) return

    try {
      const stats = fs.statSync(filePath)
      const cacheKey = this.getCacheKey(filePath)

      fileCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        fileModTime: stats.mtimeMs
      })

      console.log('💾 Data cached for:', path.basename(filePath))
    } catch (e) {
      console.warn('Failed to cache data:', e.message)
    }
  }

  /**
   * Generate cache key for file
   * @param {string} filePath
   * @returns {string}
   */
  getCacheKey(filePath) {
    return crypto.createHash('md5').update(filePath).digest('hex')
  }

  /**
   * Clear internal state for fresh read
   */
  reset() {
    this.workbook = null
    this.worksheet = null
    this.sheetName = null
    this.headerRow = 0
    this.lastReadStats = null
    this.errors = []
    this.warnings = []
  }

  /**
   * Read Excel file with comprehensive error handling
   * @param {string} filePath - Path to Excel file
   * @returns {boolean} Success status
   */
  readFile(filePath) {
    this.reset()

    try {
      // 1. Validate file exists
      if (!fs.existsSync(filePath)) {
        this.errors.push(`Excel file not found: ${filePath}`)
        console.error('❌ Excel file not found:', filePath)
        return false
      }

      // 2. Check file extension
      const ext = filePath.toLowerCase().split('.').pop()
      if (!['xlsx', 'xlsm', 'xls'].includes(ext)) {
        this.warnings.push(`Unusual file extension: .${ext}`)
        console.warn('⚠️ Unusual file extension:', ext)
      }

      // 3. Check file size
      const stats = fs.statSync(filePath)
      const fileSizeMB = stats.size / (1024 * 1024)
      console.log(`📖 Reading Excel file: ${filePath} (${fileSizeMB.toFixed(2)} MB)`)

      // 4. Read workbook with proper options
      this.workbook = XLSX.readFile(filePath, {
        cellDates: true,
        cellNF: false,      // Don't parse number formats (faster)
        cellText: false,    // Don't generate text (faster)
        type: 'file',
        raw: false,
        sheetStubs: false   // Don't create stubs for empty cells
      })

      // 5. Find target sheet
      const sheetNames = this.workbook.SheetNames
      console.log('📋 Available sheets:', sheetNames.join(', '))

      // Priority: Data > Export > Master > first sheet
      let targetSheet = sheetNames.find(name =>
        name.toLowerCase() === 'data' ||
        name.toLowerCase() === 'export'
      )

      if (!targetSheet) {
        targetSheet = sheetNames.find(name =>
          name.toLowerCase() === 'master' ||
          name.toLowerCase().includes('master')
        )
      }

      if (!targetSheet) {
        targetSheet = sheetNames[0]
        this.warnings.push(`Data/Export/Master sheet not found, using: ${targetSheet}`)
        console.log('⚠️ Data/Export/Master sheet not found, using:', targetSheet)
      }

      this.sheetName = targetSheet
      this.worksheet = this.workbook.Sheets[targetSheet]
      console.log('✅ Using sheet:', targetSheet)

      // 6. CRITICAL: Clear Auto Filters to ensure ALL rows are read
      this.clearAutoFilters()

      // 7. Auto-detect header row
      this.headerRow = this.findHeaderRow()
      console.log(`📍 Header row detected at: Row ${this.headerRow + 1} (index ${this.headerRow})`)

      return true
    } catch (error) {
      this.errors.push(`Excel read error: ${error.message}`)
      console.error('❌ Excel read error:', error.message)
      return false
    }
  }

  /**
   * CRITICAL: Clear Auto Filters from worksheet
   * Auto Filters in .xlsm files can cause XLSX library to read only visible rows
   */
  clearAutoFilters() {
    if (!this.worksheet) return

    // Check for Auto Filter
    if (this.worksheet['!autofilter']) {
      console.log('⚠️ Auto Filter detected - clearing to ensure all rows are read...')
      delete this.worksheet['!autofilter']
      console.log('✅ Auto Filter cleared')
    }

    // Also check for filter mode flag
    if (this.worksheet['!filterMode']) {
      console.log('⚠️ Filter mode detected - clearing...')
      delete this.worksheet['!filterMode']
    }

    // Check for hidden rows and warn
    if (this.worksheet['!rows']) {
      const hiddenRows = this.worksheet['!rows'].filter(r => r && r.hidden)
      if (hiddenRows.length > 0) {
        this.warnings.push(`Found ${hiddenRows.length} hidden rows - these will be included in read`)
        console.log(`⚠️ Found ${hiddenRows.length} hidden rows - will include in read`)
        // Clear hidden flags to ensure all rows are read
        this.worksheet['!rows'].forEach(r => {
          if (r) r.hidden = false
        })
      }
    }
  }

  /**
   * Find header row by searching for "Site ID" column
   * @returns {number} Header row index (0-based)
   */
  findHeaderRow() {
    const range = XLSX.utils.decode_range(this.worksheet['!ref'])

    console.log('🔍 Searching for header row...')

    for (let row = 0; row <= Math.min(EXPECTED.HEADER_SEARCH_ROWS, range.e.r); row++) {
      for (let col = 0; col <= Math.min(70, range.e.c); col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
        const cell = this.worksheet[cellAddress]

        if (cell && cell.v) {
          const cellValue = String(cell.v).trim()

          if (cellValue === 'Site ID' || cellValue.toLowerCase() === 'site id') {
            console.log(`✅ Found "Site ID" at Row ${row + 1}, Column ${XLSX.utils.encode_col(col)}`)
            return row
          }
        }
      }
    }

    this.warnings.push('"Site ID" column not found, defaulting to row 3 (TSSR standard)')
    console.log('⚠️ "Site ID" not found, defaulting to row 3 (TSSR standard)')
    return 2
  }

  /**
   * Helper function to get value with multiple possible column names
   * @param {Object} row - Data row
   * @param {...string} possibleNames - Possible column names
   * @returns {*} Value or empty string
   */
  getValue(row, ...possibleNames) {
    for (const name of possibleNames) {
      if (row[name] !== undefined && row[name] !== '') {
        return row[name]
      }
    }
    return ''
  }

  /**
   * Parse worksheet data with validation
   * @returns {Array} Array of site objects
   */
  parseData() {
    if (!this.worksheet) {
      this.errors.push('No worksheet loaded')
      return []
    }

    try {
      const startTime = Date.now()

      // CRITICAL: Use header: 1 to read ALL rows as raw arrays
      // This bypasses any Auto Filter issues that might remain
      const rawData = XLSX.utils.sheet_to_json(this.worksheet, {
        header: 1,              // Read as array of arrays
        defval: '',             // Default value for empty cells
        blankrows: false,       // Skip completely empty rows
        raw: false              // Format dates/numbers as strings
      })

      console.log(`📊 Raw data rows read: ${rawData.length}`)

      // Validate row count
      if (rawData.length < EXPECTED.TOTAL_ROWS_MIN) {
        this.errors.push(`Only ${rawData.length} rows read, expected at least ${EXPECTED.TOTAL_ROWS_MIN}`)
        console.error(`❌ CRITICAL: Only ${rawData.length} rows read, expected ~${EXPECTED.TOTAL_ROWS_EXPECTED}`)
        console.error('❌ This may indicate Auto Filter is still active or data loss!')
      }

      // Get headers from detected header row
      const headers = rawData[this.headerRow]
      if (!headers || headers.length === 0) {
        this.errors.push('No headers found at detected header row')
        return []
      }

      console.log(`📋 Found ${headers.length} columns`)
      console.log('🔑 First 10 columns:', headers.slice(0, 10).join(', '))

      // Validate required columns
      const missingRequired = EXPECTED.REQUIRED_FIELDS.filter(
        field => !headers.some(h => h && h.trim() === field)
      )
      if (missingRequired.length > 0) {
        this.warnings.push(`Missing recommended columns: ${missingRequired.join(', ')}`)
        console.warn('⚠️ Missing recommended columns:', missingRequired.join(', '))
      }

      // Convert array data to objects, starting after header row
      const jsonData = rawData.slice(this.headerRow + 1).map((row, index) => {
        const obj = { _rowIndex: this.headerRow + 2 + index } // Track original row number
        headers.forEach((header, i) => {
          if (header) {
            obj[header.trim()] = row[i] !== undefined ? row[i] : ''
          }
        })
        return obj
      })

      console.log(`📊 Converted ${jsonData.length} rows to objects`)

      // Store columns for use in mapping
      let allColumns = []
      let partOfColumnName = null

      if (jsonData.length > 0) {
        allColumns = Object.keys(jsonData[0]).filter(k => k !== '_rowIndex')

        const hasPhase = allColumns.includes('Phase Name')
        console.log(`📋 Has "Phase Name" column: ${hasPhase}`)

        // Find Part Of column variations (handles Excel inconsistencies)
        const partOfColumns = allColumns.filter(c => c.toLowerCase().includes('part'))
        console.log('🔍 Part of related columns found:', partOfColumns)

        partOfColumnName = partOfColumns.find(c =>
          c.toLowerCase().replace(/\s+/g, ' ').trim() === 'part of'
        ) || partOfColumns[0] || null

        console.log(`✅ Using Part Of column: "${partOfColumnName}"`)
      }

      // Map data to site objects with robust field matching
      const sites = jsonData.map((row) => ({
        siteId: String(row['Site ID'] || '').trim(),
        finalSiteName: row['Final Site Name'] || '',
        siteCode: row['Site Code'] || '',
        siteType: row['Site Type'] || '',
        keyNumber: row['Key Number'] || '',
        longitude: parseFloat(row['long'] || row['Longitude']) || null,
        latitude: parseFloat(row['lat'] || row['Latitude']) || null,
        governorate: row['Governorate'] || '',
        structure: row['Structure'] || '',
        ownerName: row['Owner Name'] || '',
        ownerContactNumber: row['Owner contact number'] || '',
        structureType: row['Structure Type'] || row['Structure'] || '',
        partOf: (partOfColumnName ? row[partOfColumnName] : null) ||
                row['Part of'] || row['Part Of'] || row['PART OF'] ||
                row['part of'] || row['Part of '] || '',
        heightM: parseFloat(row['Hieght (m)'] || row['Height (m)']) || null,
        siteOwner: row['Site Owner'] || '',
        phaseName: String(row['Phase Name'] || '').trim(),
        priority: parseInt(row['Priority']) || 0,
        cluster: row['Cluster'] || '',
        area: row['Area'] || '',
        weeklyPlan: row['Weekly Plan'] || '',

        // TSSR Fields
        tssSmp: row['TSS SMP'] || '',
        tssrSubcon: row['TSSR Subcon'] || '',
        newAllocation: row['NEW Allocation'] || '',
        tssrPo: row['TSSR PO#'] || row['TSSR PO'] || '',
        tsSurveyAc: row['TS Survey (Ac)'] || row['TS Survey'] || '',
        abcd: row['abcd'] || '',
        ab: row['ab'] || '',
        tssrOverallStatus: row['TSSR Overall Status'] || '',
        tssrStatusDate: row['TSSR status Date'] || row['TSSR Status Date'] || '',
        tssrRemark: row['TSSR Remark '] || row['TSSR Remark'] || '',
        actionAge: parseInt(row['Action Age']) || 0,

        // 5G Fields
        fiveGSectorsNames: row['5G sectors Names'] || row['5G Sectors Names'] || '',
        fiveGSolution: row['5G solution'] || row['5G Solution'] || '',
        siteSectors: row['Site Sectors #'] || row['Site Sectors'] || '',
        ibsSector: row['IBS Sector'] || '',
        tddSite: row['TDD Site'] || '',
        version: row['Version'] || '',
        recCabSwap: row['REC. Cab. Swap'] || row['REC Cab Swap'] || '',

        // Department Statuses
        tiStatus: row['TI Status'] || '',
        tiComment: row['TI Comment'] || '',
        clusterOwnerTi: row['Cluster Owner (TI)'] || '',

        rfPlanStatus: row['RF Plan. Status'] || row['RF Plan Status'] || '',
        rfPlanComment: row['RF Plan Comment'] || row['RF Plan. Comment'] || '',
        clusterOwnerPlanning: row['Cluster Owner (Planing)'] || row['Cluster Owner (Planning)'] || '',

        rfOptStatus: row['RF Optim Status'] || row['RF Opt. Status'] || row['RF Opt Status'] || '',
        rfOptComment: row['RF Opt. comment'] || row['RF Opt. Comment'] || row['RF Opt Comment'] || '',
        clusterOwnerOptimization: row['Cluster Owner (Optimization)'] || '',

        civilStatus: row['Civil Status'] || '',
        civilComment: row['Civil Comment'] || '',
        clusterOwnerCivil: row['Cluster Owner (Civil)'] || '',

        mwStatus: row['MW Status'] || '',
        clusterOwnerMw: row['Cluster Owner (MW)'] || '',

        nokiaNpoStatus: row['NoKia NPO status'] || row['Nokia NPO Status'] || row['Nokia NPO status'] || '',
        nokiaNpoComment: row['Nokia NPO Comment'] || '',
        nokiaSiteOwner: row['Nokia Site Owner'] || '',

        rfiStatus: row['RFI Status'] || '',
        gapAnalysis: row['Gap Analysis'] || '',
        approved: row['Approved'] || '',
        tssrReady: row['TSSR Ready'] || '',
        dismantleStatus: row['Dismantle Status'] || '',
        dismantleDate: row['Dismantle Date'] || '',
        validate: row['Validate'] || '',
        redZoneSites: row['Red Zone Sites'] || row['Red Zone Sites '] || '',
        sequence: parseInt(row['Sequence']) || null,

        // SPOC Fields
        spocReadiness: row['SPOC Readiness'] || '',
        spocStatus: row['SPOC Status'] || '',
        spocReviewed: row['SPOC Reviewed'] || '',
        weekNumber: parseInt(row['Week number']) || null,
      })).filter(site => site.siteId) // Only include rows with valid Site ID

      const parseTime = Date.now() - startTime
      console.log(`✅ Valid sites after filtering: ${sites.length} (parsed in ${parseTime}ms)`)

      // Validate row count against expected
      if (sites.length < EXPECTED.TOTAL_ROWS_MIN) {
        this.errors.push(`Only ${sites.length} valid sites found, expected ~${EXPECTED.TOTAL_ROWS_EXPECTED}`)
        console.error(`❌ WARNING: Only ${sites.length} sites with valid Site ID`)
      } else if (sites.length < EXPECTED.TOTAL_ROWS_EXPECTED * 0.95) {
        this.warnings.push(`${sites.length} sites found, slightly below expected ${EXPECTED.TOTAL_ROWS_EXPECTED}`)
        console.warn(`⚠️ ${sites.length} sites found, expected ~${EXPECTED.TOTAL_ROWS_EXPECTED}`)
      }

      // Generate statistics
      const phaseCount = {}
      sites.forEach(s => {
        const phase = s.phaseName || 'EMPTY'
        phaseCount[phase] = (phaseCount[phase] || 0) + 1
      })
      console.log('📊 Sites by phase:', JSON.stringify(phaseCount, null, 2))

      const partOfCount = {}
      sites.forEach(s => {
        const partOf = s.partOf || 'EMPTY/NULL'
        partOfCount[partOf] = (partOfCount[partOf] || 0) + 1
      })
      console.log('📊 Sites by Part Of:', JSON.stringify(partOfCount, null, 2))

      // Store last read statistics
      this.lastReadStats = {
        totalRawRows: rawData.length,
        totalValidSites: sites.length,
        totalColumns: headers.length,
        phaseBreakdown: phaseCount,
        partOfBreakdown: partOfCount,
        parseTimeMs: parseTime,
        timestamp: new Date().toISOString(),
        checksum: this.calculateChecksum(sites),
        errors: [...this.errors],
        warnings: [...this.warnings]
      }

      return sites
    } catch (error) {
      this.errors.push(`Excel parse error: ${error.message}`)
      console.error('❌ Excel parse error:', error)
      return []
    }
  }

  /**
   * Calculate MD5 checksum for data integrity verification
   * @param {Array} sites - Array of site objects
   * @returns {string} MD5 hash
   */
  calculateChecksum(sites) {
    try {
      // Create a simplified data string for checksum
      const dataString = sites.map(s =>
        `${s.siteId}|${s.phaseName}|${s.tssrOverallStatus}`
      ).join('\n')

      return crypto.createHash('md5').update(dataString).digest('hex')
    } catch (error) {
      console.error('Checksum calculation error:', error)
      return 'error'
    }
  }

  /**
   * Get all data from Excel file (main entry point)
   * @param {string} filePath - Path to Excel file
   * @param {Object} options - Read options
   * @param {boolean} options.useCache - Use cached data if available
   * @param {boolean} options.validate - Validate data after reading
   * @param {Function} options.onProgress - Progress callback
   * @returns {Array} Array of site objects
   */
  getAllData(filePath, options = {}) {
    const { useCache = true, validate = false, onProgress = null } = options

    // Set progress callback if provided
    if (onProgress) {
      this.setProgressCallback(onProgress)
    }

    this.reportProgress(0, 'Starting Excel read...')

    // Check cache first
    if (useCache) {
      const cached = this.getCachedData(filePath)
      if (cached) {
        this.reportProgress(100, 'Data loaded from cache')
        return cached
      }
    }

    this.reportProgress(10, 'Reading file...')
    const success = this.readFile(filePath)
    if (!success) {
      this.reportProgress(100, 'Failed to read file')
      return []
    }

    this.reportProgress(50, 'Parsing data...')
    const data = this.parseData()

    // Validate if requested
    if (validate && data.length > 0) {
      this.reportProgress(80, 'Validating data...')
      const validation = this.validateData(data)
      if (!validation.valid) {
        console.warn('⚠️ Validation issues:', validation.errors)
      }
    }

    // Cache the results
    if (data.length > 0) {
      this.setCachedData(filePath, data)
    }

    this.reportProgress(100, `Read ${data.length} sites successfully`)
    return data
  }

  /**
   * Get all data with extended validation
   * @param {string} filePath - Path to Excel file
   * @returns {Object} Result with data, stats, and validation
   */
  getAllDataWithValidation(filePath) {
    const data = this.getAllData(filePath, { validate: true })
    const validation = this.validateData(data)
    const stats = this.getLastReadStats()

    return {
      success: data.length > 0,
      data,
      stats,
      validation,
      errors: this.getErrors(),
      warnings: this.getWarnings()
    }
  }

  /**
   * Validate column count matches expected (68 columns)
   * @param {Array} headers - Column headers
   * @returns {Object} Validation result
   */
  validateColumnCount(headers) {
    const count = headers.filter(h => h && h.trim()).length
    const expected = EXPECTED.TOTAL_COLUMNS_EXPECTED

    return {
      valid: count >= expected * 0.9, // Allow 10% tolerance
      actual: count,
      expected,
      message: count < expected
        ? `Found ${count} columns, expected ${expected}`
        : `Column count OK: ${count}`
    }
  }

  /**
   * Validate Site ID column exists and has data
   * @param {Array} sites - Parsed sites
   * @returns {Object} Validation result
   */
  validateSiteIds(sites) {
    const withId = sites.filter(s => s.siteId && s.siteId.trim())
    const withoutId = sites.length - withId.length

    return {
      valid: withoutId === 0,
      withId: withId.length,
      withoutId,
      message: withoutId > 0
        ? `${withoutId} rows missing Site ID`
        : 'All rows have Site ID'
    }
  }

  /**
   * Validate data types for critical fields
   * @param {Array} sites - Parsed sites
   * @returns {Object} Validation result
   */
  validateDataTypes(sites) {
    const issues = []

    sites.forEach((site, index) => {
      // Validate coordinates
      if (site.latitude && (isNaN(site.latitude) || site.latitude < -90 || site.latitude > 90)) {
        issues.push({ row: index + 1, field: 'latitude', value: site.latitude, issue: 'Invalid latitude' })
      }
      if (site.longitude && (isNaN(site.longitude) || site.longitude < -180 || site.longitude > 180)) {
        issues.push({ row: index + 1, field: 'longitude', value: site.longitude, issue: 'Invalid longitude' })
      }

      // Validate priority
      if (site.priority && (isNaN(site.priority) || site.priority < 0)) {
        issues.push({ row: index + 1, field: 'priority', value: site.priority, issue: 'Invalid priority' })
      }
    })

    return {
      valid: issues.length === 0,
      issues: issues.slice(0, 20), // Limit to first 20 issues
      totalIssues: issues.length,
      message: issues.length > 0
        ? `Found ${issues.length} data type issues`
        : 'Data types OK'
    }
  }

  /**
   * Get sheet names from workbook
   * @param {string} filePath - Path to Excel file
   * @returns {Array} Array of sheet names
   */
  getSheetNames(filePath) {
    try {
      const workbook = XLSX.readFile(filePath)
      return workbook.SheetNames
    } catch (error) {
      console.error('Error reading sheet names:', error)
      return []
    }
  }

  /**
   * Get last read statistics for validation
   * @returns {Object} Statistics from last read
   */
  getLastReadStats() {
    return this.lastReadStats
  }

  /**
   * Get any errors from last operation
   * @returns {Array} Array of error messages
   */
  getErrors() {
    return [...this.errors]
  }

  /**
   * Get any warnings from last operation
   * @returns {Array} Array of warning messages
   */
  getWarnings() {
    return [...this.warnings]
  }

  /**
   * Validate data integrity
   * @param {Array} sites - Array of site objects
   * @returns {Object} Validation result
   */
  validateData(sites) {
    const errors = []
    const warnings = []

    // Check total count
    if (sites.length < EXPECTED.TOTAL_ROWS_MIN) {
      errors.push(`Only ${sites.length} sites, expected at least ${EXPECTED.TOTAL_ROWS_MIN}`)
    }

    // Check for duplicate Site IDs within same phase
    const sitePhaseMap = new Map()
    const duplicates = []
    sites.forEach(s => {
      const key = `${s.siteId}|${s.phaseName}`
      if (sitePhaseMap.has(key)) {
        duplicates.push(key)
      } else {
        sitePhaseMap.set(key, true)
      }
    })
    if (duplicates.length > 0) {
      warnings.push(`Found ${duplicates.length} duplicate Site ID + Phase combinations`)
    }

    // Check required fields populated
    const missingSiteId = sites.filter(s => !s.siteId).length
    if (missingSiteId > 0) {
      errors.push(`${missingSiteId} rows have no Site ID`)
    }

    const missingPhase = sites.filter(s => !s.phaseName).length
    if (missingPhase > 0) {
      warnings.push(`${missingPhase} sites have no Phase Name`)
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      stats: {
        totalSites: sites.length,
        duplicates: duplicates.length,
        missingSiteId,
        missingPhase
      }
    }
  }
}

// Export singleton instance
module.exports = new ExcelReader()

// Also export the class for testing
module.exports.ExcelReader = ExcelReader
module.exports.EXPECTED = EXPECTED
