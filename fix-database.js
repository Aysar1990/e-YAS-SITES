/**
 * Fix database by creating fresh with all required columns
 */

const path = require('path')
const fs = require('fs')
const initSqlJs = require('sql.js')

const DB_PATH = path.join(__dirname, 'data', 'tssr.db')

async function fixDatabase() {
  console.log('=' .repeat(60))
  console.log('DATABASE FIX')
  console.log('=' .repeat(60))

  // Ensure data directory exists
  const dataDir = path.dirname(DB_PATH)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  // Remove old database
  if (fs.existsSync(DB_PATH)) {
    console.log('\n🗑️  Removing old database...')
    fs.unlinkSync(DB_PATH)
  }

  const SQL = await initSqlJs()
  const db = new SQL.Database()

  // Create sites table with ALL columns including mw_comment
  console.log('\n📝 Creating sites table with all columns...')

  const createSitesSQL = `
    CREATE TABLE sites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_id TEXT NOT NULL,
      final_site_name TEXT,
      site_owner TEXT,
      site_code TEXT,
      site_type TEXT,
      key_number TEXT,
      longitude REAL,
      latitude REAL,
      governorate TEXT,
      structure TEXT,
      owner_name TEXT,
      owner_contact_number TEXT,
      structure_type TEXT,
      height_m REAL,
      part_of TEXT,
      phase_name TEXT,
      priority INTEGER,
      cluster TEXT,
      area TEXT,
      weekly_plan TEXT,
      tss_smp TEXT,
      tssr_subcon TEXT,
      new_allocation TEXT,
      tssr_po TEXT,
      ts_survey_ac TEXT,
      abcd TEXT,
      ab TEXT,
      five_g_sectors_names TEXT,
      five_g_solution TEXT,
      site_sectors TEXT,
      ibs_sector TEXT,
      tdd_site TEXT,
      nokia_npo_status TEXT,
      nokia_npo_comment TEXT,
      ti_status TEXT,
      ti_comment TEXT,
      cluster_owner_ti TEXT,
      rf_plan_status TEXT,
      rf_plan_comment TEXT,
      cluster_owner_planning TEXT,
      rf_opt_status TEXT,
      rf_opt_comment TEXT,
      cluster_owner_optimization TEXT,
      civil_status TEXT,
      civil_comment TEXT,
      cluster_owner_civil TEXT,
      mw_status TEXT,
      mw_comment TEXT,
      cluster_owner_mw TEXT,
      rec_cab_swap TEXT,
      spoc_readiness TEXT,
      version TEXT,
      spoc_status TEXT,
      tssr_overall_status TEXT,
      tssr_status_date TEXT,
      spoc_reviewed TEXT,
      week_number INTEGER,
      tssr_remark TEXT,
      action_age INTEGER,
      rfi_status TEXT,
      gap_analysis TEXT,
      approved TEXT,
      nokia_site_owner TEXT,
      tssr_ready TEXT,
      dismantle_status TEXT,
      dismantle_date TEXT,
      validate TEXT,
      red_zone_sites TEXT,
      sequence INTEGER,
      contractor_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(site_id, phase_name)
    )
  `

  db.run(createSitesSQL)
  console.log('   ✅ sites table created')

  // Create other tables
  console.log('\n📝 Creating other tables...')

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  console.log('   ✅ users table created')

  db.run(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_id TEXT NOT NULL,
      user_id INTEGER,
      username TEXT,
      text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  console.log('   ✅ comments table created')

  db.run(`
    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT,
      site_id TEXT,
      user_id INTEGER,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  console.log('   ✅ activity_log table created')

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  console.log('   ✅ settings table created')

  db.run(`
    CREATE TABLE IF NOT EXISTS sync_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sync_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT,
      records_synced INTEGER DEFAULT 0,
      source TEXT,
      error_message TEXT,
      duration_ms INTEGER
    )
  `)
  console.log('   ✅ sync_log table created')

  db.run(`
    CREATE TABLE IF NOT EXISTS sites_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_id TEXT NOT NULL,
      phase_name TEXT,
      data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(site_id, phase_name)
    )
  `)
  console.log('   ✅ sites_cache table created')

  // Create indexes
  console.log('\n📝 Creating indexes...')
  db.run(`CREATE INDEX idx_sites_site_id ON sites(site_id)`)
  db.run(`CREATE INDEX idx_sites_phase_name ON sites(phase_name)`)
  db.run(`CREATE INDEX idx_sites_governorate ON sites(governorate)`)
  db.run(`CREATE INDEX idx_sites_tssr_subcon ON sites(tssr_subcon)`)
  db.run(`CREATE INDEX idx_sites_tssr_overall_status ON sites(tssr_overall_status)`)
  console.log('   ✅ Indexes created')

  // Insert default settings
  console.log('\n📝 Inserting default settings...')
  db.run(`
    INSERT INTO settings (key, value, description) VALUES
      ('excel_path', '', 'Path to Excel source file'),
      ('active_phase', 'RO4', 'Currently active phase filter'),
      ('auto_sync_enabled', 'false', 'Enable automatic Excel sync'),
      ('auto_sync_interval', '300000', 'Sync interval in milliseconds'),
      ('last_sync_time', '', 'Last successful sync timestamp'),
      ('theme', 'dark', 'UI theme preference'),
      ('language', 'en', 'UI language')
  `)
  console.log('   ✅ Default settings inserted')

  // Insert admin user
  console.log('\n📝 Creating admin user...')
  db.run(`
    INSERT INTO users (username, password, role) VALUES
      ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMye7VmAXqJWj9U3dJGlPLlDrfZvNQVEPGW', 'admin')
  `)
  console.log('   ✅ Admin user created (username: admin)')

  // Save to file
  console.log('\n💾 Saving database...')
  const data = db.export()
  const buffer = Buffer.from(data)
  fs.writeFileSync(DB_PATH, buffer)
  console.log(`   Saved ${buffer.length} bytes to ${DB_PATH}`)

  // Verify
  console.log('\n🔍 Verifying columns...')
  const result = db.exec('PRAGMA table_info(sites)')
  const columns = result[0].values.map(row => row[1])
  console.log(`   Total columns: ${columns.length}`)
  console.log(`   Has mw_comment: ${columns.includes('mw_comment') ? 'YES ✅' : 'NO ❌'}`)
  console.log(`   Has mw_status: ${columns.includes('mw_status') ? 'YES ✅' : 'NO ❌'}`)
  console.log(`   Has contractor_name: ${columns.includes('contractor_name') ? 'YES ✅' : 'NO ❌'}`)

  db.close()

  console.log('\n' + '=' .repeat(60))
  console.log('✅ DATABASE FIXED SUCCESSFULLY!')
  console.log('=' .repeat(60))
}

fixDatabase().catch(console.error)
