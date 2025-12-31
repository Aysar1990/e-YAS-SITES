/**
 * Column Definitions - Single Source of Truth
 * 
 * This file maps ALL column names between Excel, SQLite, and Supabase.
 * ALL code must read from this file. No hardcoded column names anywhere else.
 * 
 * Excel headers are from row 3 of the Master sheet.
 * 
 * @author TSSR Monitor Team
 */

const COLUMNS = [
  // Site Identification
  { excel: 'Site ID', sqlite: 'site_id', supabase: 'site_id', type: 'text', required: true },
  { excel: 'Final Site Name', sqlite: 'final_site_name', supabase: 'final_site_name', type: 'text' },
  { excel: 'Site Owner', sqlite: 'site_owner', supabase: 'site_owner', type: 'text' },
  { excel: 'Site Code', sqlite: 'site_code', supabase: 'site_code', type: 'text' },
  { excel: 'Site Type', sqlite: 'site_type', supabase: 'site_type', type: 'text' },
  { excel: 'Key Number', sqlite: 'key_number', supabase: 'key_number', type: 'text' },
  
  // Location
  { excel: 'long', sqlite: 'longitude', supabase: 'longitude', type: 'number' },
  { excel: 'lat', sqlite: 'latitude', supabase: 'latitude', type: 'number' },
  { excel: 'Governorate', sqlite: 'governorate', supabase: 'governorate', type: 'text' },
  
  // Structure & Owner Info
  { excel: 'Structure', sqlite: 'structure', supabase: 'structure', type: 'text' },
  { excel: 'Owner Name', sqlite: 'owner_name', supabase: 'owner_name', type: 'text' },
  { excel: 'Owner contact number', sqlite: 'owner_contact_number', supabase: 'owner_contact_number', type: 'text' },
  { excel: 'Structure Type', sqlite: 'structure_type', supabase: 'structure_type', type: 'text' },
  { excel: 'Hieght (m)', sqlite: 'height_m', supabase: 'height_m', type: 'number' },
  { excel: 'Part of', sqlite: 'part_of', supabase: 'part_of', type: 'text' },
  
  // Project Info
  { excel: 'Phase Name', sqlite: 'phase_name', supabase: 'phase_name', type: 'text', required: true },
  { excel: 'Priority', sqlite: 'priority', supabase: 'priority', type: 'number' },
  { excel: 'Cluster', sqlite: 'cluster', supabase: 'cluster', type: 'text' },
  { excel: 'Area', sqlite: 'area', supabase: 'area', type: 'text' },
  { excel: 'Weekly Plan', sqlite: 'weekly_plan', supabase: 'weekly_plan', type: 'text' },
  
  // TSSR Info
  { excel: 'TSS SMP', sqlite: 'tss_smp', supabase: 'tss_smp', type: 'text' },
  { excel: 'TSSR Subcon', sqlite: 'tssr_subcon', supabase: 'tssr_subcon', type: 'text' },
  { excel: 'NEW Allocation', sqlite: 'new_allocation', supabase: 'new_allocation', type: 'text' },
  { excel: 'TSSR PO#', sqlite: 'tssr_po', supabase: 'tssr_po', type: 'text' },
  { excel: 'TS Survey (Ac)', sqlite: 'ts_survey_ac', supabase: 'ts_survey_ac', type: 'text' },
  
  // Unknown/Custom Fields
  { excel: 'abcd', sqlite: 'abcd', supabase: 'abcd', type: 'text' },
  { excel: 'ab', sqlite: 'ab', supabase: 'ab', type: 'text' },
  
  // 5G Info
  { excel: '5G sectors Names', sqlite: 'five_g_sectors_names', supabase: 'five_g_sectors_names', type: 'text' },
  { excel: '5G solution', sqlite: 'five_g_solution', supabase: 'five_g_solution', type: 'text' },
  { excel: 'Site Sectors #', sqlite: 'site_sectors', supabase: 'site_sectors', type: 'text' },
  { excel: 'IBS Sector', sqlite: 'ibs_sector', supabase: 'ibs_sector', type: 'text' },
  { excel: 'TDD Site', sqlite: 'tdd_site', supabase: 'tdd_site', type: 'text' },
  
  // Nokia Status
  { excel: 'NoKia NPO status', sqlite: 'nokia_npo_status', supabase: 'nokia_npo_status', type: 'text' },
  { excel: 'Nokia NPO Comment', sqlite: 'nokia_npo_comment', supabase: 'nokia_npo_comment', type: 'text' },
  
  // TI Department
  { excel: 'TI Status', sqlite: 'ti_status', supabase: 'ti_status', type: 'text' },
  { excel: 'TI Comment', sqlite: 'ti_comment', supabase: 'ti_comment', type: 'text' },
  { excel: 'Cluster Owner (TI)', sqlite: 'cluster_owner_ti', supabase: 'cluster_owner_ti', type: 'text' },
  
  // RF Planning Department
  { excel: 'RF Plan. Status', sqlite: 'rf_plan_status', supabase: 'rf_plan_status', type: 'text' },
  { excel: 'RF Plan Comment', sqlite: 'rf_plan_comment', supabase: 'rf_plan_comment', type: 'text' },
  { excel: 'Cluster Owner (Planing)', sqlite: 'cluster_owner_planning', supabase: 'cluster_owner_planning', type: 'text' },
  
  // RF Optimization Department
  { excel: 'RF Optim Status', sqlite: 'rf_opt_status', supabase: 'rf_opt_status', type: 'text' },
  { excel: 'RF Opt. comment', sqlite: 'rf_opt_comment', supabase: 'rf_opt_comment', type: 'text' },
  { excel: 'Cluster Owner (Optimization)', sqlite: 'cluster_owner_optimization', supabase: 'cluster_owner_optimization', type: 'text' },
  
  // Civil Department
  { excel: 'Civil Status', sqlite: 'civil_status', supabase: 'civil_status', type: 'text' },
  { excel: 'Civil Comment', sqlite: 'civil_comment', supabase: 'civil_comment', type: 'text' },
  { excel: 'Cluster Owner (Civil)', sqlite: 'cluster_owner_civil', supabase: 'cluster_owner_civil', type: 'text' },
  
  // MW Department
  { excel: 'MW Status', sqlite: 'mw_status', supabase: 'mw_status', type: 'text' },
  { excel: 'Cluster Owner (MW)', sqlite: 'cluster_owner_mw', supabase: 'cluster_owner_mw', type: 'text' },
  
  // Additional Info
  { excel: 'REC. Cab. Swap', sqlite: 'rec_cab_swap', supabase: 'rec_cab_swap', type: 'text' },
  { excel: 'SPOC Readiness', sqlite: 'spoc_readiness', supabase: 'spoc_readiness', type: 'text' },
  { excel: 'Version', sqlite: 'version', supabase: 'version', type: 'text' },
  { excel: 'SPOC Status', sqlite: 'spoc_status', supabase: 'spoc_status', type: 'text' },
  
  // TSSR Status
  { excel: 'TSSR Overall Status', sqlite: 'tssr_overall_status', supabase: 'tssr_overall_status', type: 'text' },
  { excel: 'TSSR status Date', sqlite: 'tssr_status_date', supabase: 'tssr_status_date', type: 'text' },
  { excel: 'SPOC Reviewed', sqlite: 'spoc_reviewed', supabase: 'spoc_reviewed', type: 'text' },
  { excel: 'Week number', sqlite: 'week_number', supabase: 'week_number', type: 'text' },
  { excel: 'TSSR Remark', sqlite: 'tssr_remark', supabase: 'tssr_remark', type: 'text' },
  { excel: 'Action Age', sqlite: 'action_age', supabase: 'action_age', type: 'number' },
  
  // RFI & Approval
  { excel: 'RFI Status', sqlite: 'rfi_status', supabase: 'rfi_status', type: 'text' },
  { excel: 'Gap Analysis', sqlite: 'gap_analysis', supabase: 'gap_analysis', type: 'text' },
  { excel: 'Approved', sqlite: 'approved', supabase: 'approved', type: 'boolean' },
  { excel: 'Nokia Site Owner', sqlite: 'nokia_site_owner', supabase: 'nokia_site_owner', type: 'text' },
  { excel: 'TSSR Ready', sqlite: 'tssr_ready', supabase: 'tssr_ready', type: 'boolean' },
  
  // Dismantle Info
  { excel: 'Dismantle Status', sqlite: 'dismantle_status', supabase: 'dismantle_status', type: 'text' },
  { excel: 'Dismantle Date', sqlite: 'dismantle_date', supabase: 'dismantle_date', type: 'text' },
  
  // Validation & Zone
  { excel: 'Validate', sqlite: 'validate', supabase: 'validate', type: 'text' },
  { excel: 'Red Zone Sites', sqlite: 'red_zone_sites', supabase: 'red_zone_sites', type: 'text' },
  { excel: 'Sequence', sqlite: 'sequence', supabase: 'sequence', type: 'number' }
]

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get all Excel headers in order
 * @returns {string[]}
 */
function getExcelHeaders() {
  return COLUMNS.map(col => col.excel)
}

/**
 * Get all SQLite column names in order
 * @returns {string[]}
 */
function getSQLiteColumns() {
  return COLUMNS.map(col => col.sqlite)
}

/**
 * Get all Supabase column names in order
 * @returns {string[]}
 */
function getSupabaseColumns() {
  return COLUMNS.map(col => col.supabase)
}

/**
 * Convert Excel header to SQLite column name
 * @param {string} excelHeader - Excel header name
 * @returns {string|null} SQLite column name or null if not found
 */
function excelToSQLite(excelHeader) {
  const col = COLUMNS.find(c => c.excel === excelHeader)
  return col ? col.sqlite : null
}

/**
 * Convert SQLite column to Supabase column name
 * @param {string} sqliteCol - SQLite column name
 * @returns {string|null} Supabase column name or null if not found
 */
function sqliteToSupabase(sqliteCol) {
  const col = COLUMNS.find(c => c.sqlite === sqliteCol)
  return col ? col.supabase : null
}

/**
 * Convert Supabase column to SQLite column name
 * @param {string} supabaseCol - Supabase column name
 * @returns {string|null} SQLite column name or null if not found
 */
function supabaseToSQLite(supabaseCol) {
  const col = COLUMNS.find(c => c.supabase === supabaseCol)
  return col ? col.sqlite : null
}

/**
 * Convert Excel header to Supabase column name
 * @param {string} excelHeader - Excel header name
 * @returns {string|null} Supabase column name or null if not found
 */
function excelToSupabase(excelHeader) {
  const col = COLUMNS.find(c => c.excel === excelHeader)
  return col ? col.supabase : null
}

/**
 * Get column type by any name (excel, sqlite, or supabase)
 * @param {string} name - Column name
 * @returns {string|null} Column type or null if not found
 */
function getColumnType(name) {
  const col = COLUMNS.find(c => 
    c.excel === name || c.sqlite === name || c.supabase === name
  )
  return col ? col.type : null
}

/**
 * Get required columns
 * @returns {Object[]} Array of required column definitions
 */
function getRequiredColumns() {
  return COLUMNS.filter(col => col.required === true)
}

/**
 * Get numeric columns
 * @returns {string[]} Array of SQLite column names that are numeric
 */
function getNumericColumns() {
  return COLUMNS.filter(col => col.type === 'number').map(col => col.sqlite)
}

/**
 * Get boolean columns
 * @returns {string[]} Array of SQLite column names that are boolean
 */
function getBooleanColumns() {
  return COLUMNS.filter(col => col.type === 'boolean').map(col => col.sqlite)
}

/**
 * Get column definition by any name
 * @param {string} name - Column name (excel, sqlite, or supabase)
 * @returns {Object|null} Column definition or null if not found
 */
function getColumnDef(name) {
  return COLUMNS.find(c => 
    c.excel === name || c.sqlite === name || c.supabase === name
  ) || null
}

/**
 * Transform Excel row object to SQLite format
 * @param {Object} excelRow - Row with Excel headers as keys
 * @returns {Object} Row with SQLite column names as keys
 */
function transformExcelToSQLite(excelRow) {
  const result = {}
  for (const [key, value] of Object.entries(excelRow)) {
    const sqliteCol = excelToSQLite(key)
    if (sqliteCol) {
      result[sqliteCol] = value
    }
  }
  return result
}

/**
 * Transform SQLite row object to Supabase format
 * @param {Object} sqliteRow - Row with SQLite column names as keys
 * @returns {Object} Row with Supabase column names as keys
 */
function transformSQLiteToSupabase(sqliteRow) {
  const result = {}
  for (const [key, value] of Object.entries(sqliteRow)) {
    const supabaseCol = sqliteToSupabase(key)
    if (supabaseCol) {
      result[supabaseCol] = value
    }
  }
  return result
}

/**
 * Generate SQLite CREATE TABLE statement
 * @param {string} tableName - Table name
 * @returns {string} SQL CREATE TABLE statement
 */
function generateCreateTableSQL(tableName = 'sites') {
  const columnDefs = COLUMNS.map(col => {
    let type = 'TEXT'
    if (col.type === 'number') type = 'REAL'
    if (col.type === 'boolean') type = 'INTEGER'
    
    let def = `${col.sqlite} ${type}`
    if (col.required) def += ' NOT NULL'
    return def
  })
  
  return `CREATE TABLE IF NOT EXISTS ${tableName} (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ${columnDefs.join(',\n  ')},
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(site_id, phase_name)
)`
}

/**
 * Generate INSERT SQL with all columns
 * @param {string} tableName - Table name
 * @returns {string} SQL INSERT statement with placeholders
 */
function generateInsertSQL(tableName = 'sites') {
  const columns = getSQLiteColumns()
  const placeholders = columns.map(() => '?').join(', ')
  
  return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`
}

/**
 * Generate UPSERT SQL (INSERT OR REPLACE)
 * @param {string} tableName - Table name
 * @returns {string} SQL UPSERT statement
 */
function generateUpsertSQL(tableName = 'sites') {
  const columns = getSQLiteColumns()
  const placeholders = columns.map(() => '?').join(', ')
  const updateClauses = columns
    .filter(col => col !== 'site_id' && col !== 'phase_name')
    .map(col => `${col} = excluded.${col}`)
    .join(',\n    ')
  
  return `INSERT INTO ${tableName} (${columns.join(', ')})
VALUES (${placeholders})
ON CONFLICT(site_id, phase_name) DO UPDATE SET
    ${updateClauses},
    updated_at = CURRENT_TIMESTAMP`
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  COLUMNS,
  getExcelHeaders,
  getSQLiteColumns,
  getSupabaseColumns,
  excelToSQLite,
  sqliteToSupabase,
  supabaseToSQLite,
  excelToSupabase,
  getColumnType,
  getRequiredColumns,
  getNumericColumns,
  getBooleanColumns,
  getColumnDef,
  transformExcelToSQLite,
  transformSQLiteToSupabase,
  generateCreateTableSQL,
  generateInsertSQL,
  generateUpsertSQL
}
