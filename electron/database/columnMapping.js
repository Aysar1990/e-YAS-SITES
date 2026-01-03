/**
 * Excel to Database Column Mapping
 *
 * This file uses columnDefinitions.js as the single source of truth.
 * All mappings are derived from there.
 *
 * @author TSSR Monitor Team
 * @version 2.0
 */

const {
  COLUMNS,
  HEADER_VARIATIONS,
  excelToSQLite,
  getSQLiteColumns,
  getNumericColumns,
  transformExcelToSQLite
} = require('../columnDefinitions')

// Build COLUMN_MAPPING from columnDefinitions
const COLUMN_MAPPING = {}

// Add direct mappings from COLUMNS
COLUMNS.forEach(col => {
  COLUMN_MAPPING[col.excel] = col.sqlite
})

// Add variations
Object.assign(COLUMN_MAPPING, HEADER_VARIATIONS)

// Get DB_COLUMNS from columnDefinitions
const DB_COLUMNS = getSQLiteColumns()

// Get numeric columns from columnDefinitions
const NUMERIC_COLUMNS = getNumericColumns()

// Date columns
const DATE_COLUMNS = ['tssr_status_date', 'dismantle_date']

/**
 * Convert Excel row to database object
 * @param {Array} row - Row data array
 * @param {Array} headers - Header names array
 * @returns {Object} Database object with snake_case keys
 */
function excelRowToDbObject(row, headers) {
  const obj = {}

  headers.forEach((header, index) => {
    if (!header) return

    const dbColumn = COLUMN_MAPPING[header] || COLUMN_MAPPING[header?.toString().trim()]
    if (dbColumn && row[index] !== undefined && row[index] !== null) {
      let value = row[index]

      // Convert Excel date numbers to string
      if (DATE_COLUMNS.includes(dbColumn)) {
        if (typeof value === 'number') {
          // Excel date serial number conversion
          const date = new Date((value - 25569) * 86400 * 1000)
          value = date.toISOString().split('T')[0]
        }
      }

      // Convert priority, sequence, action_age to numbers
      if (['priority', 'action_age', 'sequence'].includes(dbColumn)) {
        value = parseInt(value) || null
      }

      // Convert coordinates to numbers
      if (['longitude', 'latitude', 'height_m'].includes(dbColumn)) {
        value = parseFloat(value) || null
      }

      obj[dbColumn] = value
    }
  })

  return obj
}

/**
 * Validate Excel headers against expected columns
 * @param {Array} headers - Array of Excel headers
 * @returns {Object} { valid: boolean, missing: [], unrecognized: [], mapped: {} }
 */
function validateHeaders(headers) {
  const result = {
    valid: true,
    missing: [],
    unrecognized: [],
    mapped: {}
  }

  const requiredColumns = ['site_id', 'phase_name']
  const foundColumns = new Set()

  headers.forEach(header => {
    if (!header) return

    const dbColumn = COLUMN_MAPPING[header] || COLUMN_MAPPING[header?.toString().trim()]
    if (dbColumn) {
      result.mapped[header] = dbColumn
      foundColumns.add(dbColumn)
    } else {
      result.unrecognized.push(header)
    }
  })

  // Check for required columns
  requiredColumns.forEach(col => {
    if (!foundColumns.has(col)) {
      result.missing.push(col)
      result.valid = false
    }
  })

  return result
}

/**
 * Get all possible Excel header names for a given SQLite column
 * @param {string} sqliteColumn - SQLite column name
 * @returns {string[]} Array of possible Excel headers
 */
function getExcelHeadersForColumn(sqliteColumn) {
  const headers = []

  // Check COLUMNS
  const col = COLUMNS.find(c => c.sqlite === sqliteColumn)
  if (col) {
    headers.push(col.excel)
  }

  // Check variations
  Object.entries(HEADER_VARIATIONS).forEach(([excel, sqlite]) => {
    if (sqlite === sqliteColumn && !headers.includes(excel)) {
      headers.push(excel)
    }
  })

  return headers
}

module.exports = {
  COLUMN_MAPPING,
  DB_COLUMNS,
  NUMERIC_COLUMNS,
  DATE_COLUMNS,
  excelRowToDbObject,
  validateHeaders,
  getExcelHeadersForColumn
}
