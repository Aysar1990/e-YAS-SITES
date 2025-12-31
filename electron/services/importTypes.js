/**
 * Import Types - Batch & Single File Processors
 *
 * Uses columnDefinitions.js as the single source of truth.
 */

const {
  COLUMNS,
  excelToSQLite,
  getSQLiteColumns,
  getNumericColumns,
  getBooleanColumns,
  getRequiredColumns,
  generateUpsertSQL
} = require('../columnDefinitions')

// Import operation types
const IMPORT_OPERATION = {
  INSERT: 'INSERT',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  SKIP: 'SKIP'
}

// Import status codes
const IMPORT_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  PARTIAL: 'PARTIAL'
}

// Validation error types
const VALIDATION_ERROR = {
  MISSING_REQUIRED: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  DUPLICATE_KEY: 'DUPLICATE_KEY',
  CONSTRAINT_VIOLATION: 'CONSTRAINT_VIOLATION',
  TYPE_MISMATCH: 'TYPE_MISMATCH'
}

// Build COLUMN_MAPPING from columnDefinitions
const COLUMN_MAPPING = {}
COLUMNS.forEach(col => {
  COLUMN_MAPPING[col.excel] = col.sqlite
})

// Add common variations of Excel headers
const VARIATIONS = {
  'Longitude': 'longitude',
  'Latitude': 'latitude',
  'Height (m)': 'height_m',
  'Part Of': 'part_of',
  'PART OF': 'part_of',
  'part of': 'part_of',
  'Part of ': 'part_of',
  'TSSR PO': 'tssr_po',
  'TS Survey': 'ts_survey_ac',
  '5G Sectors Names': 'five_g_sectors_names',
  '5G Solution': 'five_g_solution',
  'Site Sectors': 'site_sectors',
  'Nokia NPO Status': 'nokia_npo_status',
  'Nokia NPO status': 'nokia_npo_status',
  'RF Plan Status': 'rf_plan_status',
  'RF Plan. Comment': 'rf_plan_comment',
  'Cluster Owner (Planning)': 'cluster_owner_planning',
  'RF Opt. Status': 'rf_opt_status',
  'RF Opt Status': 'rf_opt_status',
  'RF Opt. Comment': 'rf_opt_comment',
  'RF Opt Comment': 'rf_opt_comment',
  'TSSR Status Date': 'tssr_status_date',
  'TSSR Remark ': 'tssr_remark',
  'Red Zone Sites ': 'red_zone_sites',
  'REC Cab Swap': 'rec_cab_swap'
}
Object.assign(COLUMN_MAPPING, VARIATIONS)

// Get from columnDefinitions
const REQUIRED_FIELDS = getRequiredColumns().map(col => col.sqlite)
const NUMERIC_FIELDS = getNumericColumns()
const BOOLEAN_FIELDS = getBooleanColumns()
const DATE_FIELDS = ['tssr_status_date', 'dismantle_date']

// Default batch configuration
const DEFAULT_BATCH_CONFIG = {
  batchSize: 500,
  maxRetries: 3,
  retryDelayMs: 1000,
  transactionSize: 100,
  progressIntervalMs: 500,
  validateBeforeInsert: true,
  skipDuplicates: false,
  updateExisting: true
}

// Single file import configuration
const SINGLE_FILE_CONFIG = {
  maxFileSizeMB: 10,
  allowedExtensions: ['.xlsx', '.xlsm', '.xls'],
  tableName: 'sites',
  validateBeforeInsert: true,
  broadcastUpdates: true
}

// File validation error types
const FILE_VALIDATION_ERROR = {
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  INVALID_EXTENSION: 'INVALID_EXTENSION',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  FILE_NOT_READABLE: 'FILE_NOT_READABLE',
  NO_DATA: 'NO_DATA',
  PARSE_ERROR: 'PARSE_ERROR'
}

// Import result structure
const createImportResult = () => ({
  status: IMPORT_STATUS.PENDING,
  startTime: null,
  endTime: null,
  totalRecords: 0,
  processed: 0,
  inserted: 0,
  updated: 0,
  skipped: 0,
  failed: 0,
  errors: [],
  warnings: [],
  batches: []
})

// Batch result structure
const createBatchResult = (batchNumber) => ({
  batchNumber,
  startIndex: 0,
  endIndex: 0,
  status: IMPORT_STATUS.PENDING,
  processed: 0,
  inserted: 0,
  updated: 0,
  skipped: 0,
  failed: 0,
  errors: [],
  duration: 0
})

// Record result structure
const createRecordResult = (siteId, operation) => ({
  siteId,
  operation,
  success: false,
  error: null,
  timestamp: null
})

// Single file result structure
const createSingleFileResult = () => ({
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
  warnings: [],
  dryRun: false
})

// Map Excel column name to DB column
function mapColumnName(excelColumn) {
  if (!excelColumn) return null
  return COLUMN_MAPPING[excelColumn] || COLUMN_MAPPING[excelColumn.trim()] || null
}

// Convert value to appropriate type
function convertValue(value, dbColumn) {
  // Handle boolean fields first (empty = false)
  if (BOOLEAN_FIELDS.includes(dbColumn)) {
    if (value === null || value === undefined || value === '') return 0
    if (typeof value === 'boolean') return value ? 1 : 0
    if (typeof value === 'number') return value ? 1 : 0
    const str = String(value).toLowerCase().trim()
    return ['yes', 'true', '1', 'y'].includes(str) ? 1 : 0
  }

  if (value === null || value === undefined || value === '') {
    return null
  }

  if (NUMERIC_FIELDS.includes(dbColumn)) {
    const num = parseFloat(value)
    return isNaN(num) ? null : num
  }

  return String(value).trim()
}

// Map Excel row to database record
function mapExcelRowToDbRecord(excelRow, headers) {
  const record = {}

  headers.forEach((header, index) => {
    if (!header) return

    const dbColumn = mapColumnName(header)
    if (dbColumn) {
      record[dbColumn] = convertValue(excelRow[index], dbColumn)
    }
  })

  return record
}

// Validate a single record
function validateRecord(record) {
  const errors = []

  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (!record[field]) {
      errors.push({
        type: VALIDATION_ERROR.MISSING_REQUIRED,
        field,
        message: `Missing required field: ${field}`
      })
    }
  }

  // Validate numeric fields
  for (const field of NUMERIC_FIELDS) {
    if (record[field] !== null && record[field] !== undefined) {
      if (typeof record[field] !== 'number') {
        errors.push({
          type: VALIDATION_ERROR.TYPE_MISMATCH,
          field,
          message: `Field ${field} should be numeric`
        })
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

// Get all database columns from columnDefinitions
function getAllDbColumns() {
  return getSQLiteColumns()
}

// Generate INSERT SQL placeholders
function generateInsertSQL(tableName, columns) {
  const placeholders = columns.map(() => '?').join(', ')
  return `INSERT OR REPLACE INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`
}

// Generate UPDATE SQL
function generateUpdateSQL(tableName, columns, keyColumn = 'site_id') {
  const setClauses = columns.filter(c => c !== keyColumn).map(c => `${c} = ?`).join(', ')
  return `UPDATE ${tableName} SET ${setClauses} WHERE ${keyColumn} = ?`
}

module.exports = {
  // Enums
  IMPORT_OPERATION,
  IMPORT_STATUS,
  VALIDATION_ERROR,
  FILE_VALIDATION_ERROR,

  // Mappings (from columnDefinitions)
  COLUMN_MAPPING,
  REQUIRED_FIELDS,
  NUMERIC_FIELDS,
  BOOLEAN_FIELDS,
  DATE_FIELDS,

  // Config
  DEFAULT_BATCH_CONFIG,
  SINGLE_FILE_CONFIG,

  // Factory functions
  createImportResult,
  createBatchResult,
  createRecordResult,
  createSingleFileResult,

  // Utility functions
  mapColumnName,
  convertValue,
  mapExcelRowToDbRecord,
  validateRecord,
  getAllDbColumns,
  generateInsertSQL,
  generateUpdateSQL
}
