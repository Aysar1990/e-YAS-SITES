/**
 * Excel to Database Column Mapping
 *
 * This file uses columnDefinitions.js as the single source of truth.
 * All mappings are derived from there.
 */

const {
  COLUMNS,
  excelToSQLite,
  getSQLiteColumns,
  getNumericColumns,
  transformExcelToSQLite
} = require('../columnDefinitions')

// Build COLUMN_MAPPING from columnDefinitions
// Include common variations of Excel headers
const COLUMN_MAPPING = {}

COLUMNS.forEach(col => {
  COLUMN_MAPPING[col.excel] = col.sqlite
})

// Add common variations
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
    const dbColumn = COLUMN_MAPPING[header] || COLUMN_MAPPING[header?.trim()]
    if (dbColumn && row[index] !== undefined && row[index] !== null) {
      let value = row[index]

      // Convert Excel date numbers to string
      if (DATE_COLUMNS.includes(dbColumn)) {
        if (typeof value === 'number') {
          const date = new Date((value - 25569) * 86400 * 1000)
          value = date.toISOString().split('T')[0]
        }
      }

      // Convert numbers
      if (['priority', 'week_number', 'action_age', 'sequence'].includes(dbColumn)) {
        value = parseInt(value) || null
      }

      if (['longitude', 'latitude', 'height_m'].includes(dbColumn)) {
        value = parseFloat(value) || null
      }

      obj[dbColumn] = value
    }
  })

  return obj
}

module.exports = {
  COLUMN_MAPPING,
  DB_COLUMNS,
  NUMERIC_COLUMNS,
  DATE_COLUMNS,
  excelRowToDbObject
}
