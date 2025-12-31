/**
 * Database Cleanup Script
 *
 * Identifies and cleans up ghost data, orphaned records, and data integrity issues.
 *
 * Usage:
 *   node electron/scripts/database-cleanup.js [--dry-run] [--verbose] [--fix]
 *
 * Options:
 *   --dry-run   Only report issues, don't make changes (default)
 *   --verbose   Show detailed output
 *   --fix       Apply fixes (use with caution)
 */

const path = require('path')
const fs = require('fs')

// Initialize SQL.js
async function initDatabase() {
  const initSqlJs = require('sql.js')
  const SQL = await initSqlJs()

  const dbPath = path.join(__dirname, '../../data/tssr.db')

  if (!fs.existsSync(dbPath)) {
    console.error('Database file not found:', dbPath)
    process.exit(1)
  }

  const buffer = fs.readFileSync(dbPath)
  return { db: new SQL.Database(buffer), dbPath, SQL }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2)
  return {
    dryRun: !args.includes('--fix'),
    verbose: args.includes('--verbose'),
    fix: args.includes('--fix')
  }
}

// Utility to run a query and get results
function runQuery(db, sql, params = []) {
  try {
    const stmt = db.prepare(sql)
    stmt.bind(params)
    const results = []
    while (stmt.step()) {
      results.push(stmt.getAsObject())
    }
    stmt.free()
    return results
  } catch (e) {
    return { error: e.message }
  }
}

// Check if a table exists
function tableExists(db, tableName) {
  const result = runQuery(db,
    "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
    [tableName]
  )
  return !result.error && result.length > 0
}

// Check if a view exists
function viewExists(db, viewName) {
  const result = runQuery(db,
    "SELECT name FROM sqlite_master WHERE type='view' AND name=?",
    [viewName]
  )
  return !result.error && result.length > 0
}

// Audit functions
const audits = {
  // Check for table naming issues
  checkTableNames: (db, opts) => {
    console.log('\n=== Checking Table Names ===')

    const issues = []

    // Check if sites_cache exists (it should)
    const sitesCacheExists = tableExists(db, 'sites_cache')
    console.log(`  sites_cache table: ${sitesCacheExists ? 'EXISTS' : 'MISSING!'} `)

    if (!sitesCacheExists) {
      issues.push({
        type: 'CRITICAL',
        message: 'sites_cache table does not exist - schema not applied',
        fix: 'Run migrations'
      })
    }

    // Check if sites table exists (it shouldn't, unless it's a view)
    const sitesTableExists = tableExists(db, 'sites')
    const sitesViewExists = viewExists(db, 'sites')

    if (sitesTableExists) {
      console.log('  sites TABLE: EXISTS (potential ghost data source)')
      issues.push({
        type: 'WARNING',
        message: 'sites table exists as a separate table (should be view or not exist)',
        fix: 'Migrate data from sites to sites_cache, then drop table'
      })

      // Check if it has data
      const sitesCount = runQuery(db, 'SELECT COUNT(*) as cnt FROM sites')
      if (!sitesCount.error && sitesCount[0]?.cnt > 0) {
        console.log(`    - Contains ${sitesCount[0].cnt} records (ghost data!)`)
        issues.push({
          type: 'CRITICAL',
          message: `sites table contains ${sitesCount[0].cnt} orphaned records`,
          fix: 'Migrate to sites_cache'
        })
      }
    } else if (sitesViewExists) {
      console.log('  sites VIEW: EXISTS (correct alias setup)')
    } else {
      console.log('  sites: NOT FOUND (may cause import errors)')
      issues.push({
        type: 'HIGH',
        message: 'sites view alias does not exist - imports will fail',
        fix: 'Run migration 005_sites_table_alias.sql'
      })
    }

    return issues
  },

  // Check for duplicate records
  checkDuplicates: (db, opts) => {
    console.log('\n=== Checking for Duplicates ===')

    const issues = []

    // Check for duplicate site_id + phase_name combinations
    const duplicates = runQuery(db, `
      SELECT site_id, phase_name, COUNT(*) as cnt
      FROM sites_cache
      GROUP BY site_id, phase_name
      HAVING cnt > 1
    `)

    if (duplicates.error) {
      console.log('  Could not check duplicates:', duplicates.error)
      return issues
    }

    if (duplicates.length > 0) {
      console.log(`  Found ${duplicates.length} duplicate combinations:`)
      if (opts.verbose) {
        duplicates.slice(0, 10).forEach(d => {
          console.log(`    - site_id: ${d.site_id}, phase: ${d.phase_name || 'EMPTY'}, count: ${d.cnt}`)
        })
      }
      issues.push({
        type: 'HIGH',
        message: `${duplicates.length} duplicate site_id + phase_name combinations`,
        fix: 'Keep most recent, delete older duplicates'
      })
    } else {
      console.log('  No duplicates found')
    }

    // Check for same site_id with multiple phases (not necessarily a problem)
    const multiPhase = runQuery(db, `
      SELECT site_id, COUNT(DISTINCT phase_name) as phase_count
      FROM sites_cache
      GROUP BY site_id
      HAVING phase_count > 1
    `)

    if (!multiPhase.error && multiPhase.length > 0) {
      console.log(`  ${multiPhase.length} sites have multiple phases (OK if intentional)`)
    }

    return issues
  },

  // Check for empty/null required fields
  checkRequiredFields: (db, opts) => {
    console.log('\n=== Checking Required Fields ===')

    const issues = []

    // Sites without site_id (shouldn't happen)
    const noSiteId = runQuery(db, `
      SELECT COUNT(*) as cnt FROM sites_cache
      WHERE site_id IS NULL OR site_id = ''
    `)

    if (!noSiteId.error && noSiteId[0]?.cnt > 0) {
      console.log(`  ${noSiteId[0].cnt} records have no site_id (INVALID!)`)
      issues.push({
        type: 'CRITICAL',
        message: `${noSiteId[0].cnt} records without site_id`,
        fix: 'Delete these invalid records'
      })
    }

    // Sites without phase_name
    const noPhase = runQuery(db, `
      SELECT COUNT(*) as cnt FROM sites_cache
      WHERE phase_name IS NULL OR phase_name = ''
    `)

    if (!noPhase.error && noPhase[0]?.cnt > 0) {
      console.log(`  ${noPhase[0].cnt} records have empty phase_name`)
      issues.push({
        type: 'MEDIUM',
        message: `${noPhase[0].cnt} records without phase_name`,
        fix: 'Review and assign default phase or delete'
      })
    }

    return issues
  },

  // Check for orphaned relationships
  checkOrphanedRelationships: (db, opts) => {
    console.log('\n=== Checking Orphaned Relationships ===')

    const issues = []

    // Check nokia_reviews for orphaned site_id references
    const orphanedNokia = runQuery(db, `
      SELECT COUNT(*) as cnt FROM nokia_reviews nr
      LEFT JOIN sites_cache sc ON nr.site_id = sc.site_id
      WHERE sc.site_id IS NULL
    `)

    if (!orphanedNokia.error && orphanedNokia[0]?.cnt > 0) {
      console.log(`  ${orphanedNokia[0].cnt} orphaned nokia_reviews records`)
      issues.push({
        type: 'MEDIUM',
        message: `${orphanedNokia[0].cnt} nokia_reviews reference non-existent sites`,
        fix: 'Delete orphaned nokia_reviews'
      })
    }

    // Check rejections_log for orphaned references
    const orphanedRejections = runQuery(db, `
      SELECT COUNT(*) as cnt FROM rejections_log rl
      LEFT JOIN sites_cache sc ON rl.site_id = sc.site_id
      WHERE sc.site_id IS NULL
    `)

    if (!orphanedRejections.error && orphanedRejections[0]?.cnt > 0) {
      console.log(`  ${orphanedRejections[0].cnt} orphaned rejections_log records`)
      issues.push({
        type: 'LOW',
        message: `${orphanedRejections[0].cnt} rejections_log entries reference non-existent sites`,
        fix: 'Keep for audit trail or delete'
      })
    }

    if (issues.length === 0) {
      console.log('  No orphaned relationships found')
    }

    return issues
  },

  // Check data quality
  checkDataQuality: (db, opts) => {
    console.log('\n=== Checking Data Quality ===')

    const issues = []

    // Check for invalid coordinates
    const invalidCoords = runQuery(db, `
      SELECT COUNT(*) as cnt FROM sites_cache
      WHERE (longitude IS NOT NULL AND (longitude < -180 OR longitude > 180))
         OR (latitude IS NOT NULL AND (latitude < -90 OR latitude > 90))
    `)

    if (!invalidCoords.error && invalidCoords[0]?.cnt > 0) {
      console.log(`  ${invalidCoords[0].cnt} records with invalid coordinates`)
      issues.push({
        type: 'MEDIUM',
        message: `${invalidCoords[0].cnt} records have out-of-range coordinates`,
        fix: 'Set invalid coordinates to NULL'
      })
    }

    // Check for suspicious Part Of values
    const partOfStats = runQuery(db, `
      SELECT part_of, COUNT(*) as cnt FROM sites_cache
      GROUP BY part_of
      ORDER BY cnt DESC
      LIMIT 20
    `)

    if (!partOfStats.error) {
      console.log('  Part Of value distribution:')
      partOfStats.slice(0, 5).forEach(p => {
        console.log(`    - "${p.part_of || 'NULL/EMPTY'}": ${p.cnt}`)
      })
    }

    return issues
  },

  // Summary statistics
  getSummaryStats: (db, opts) => {
    console.log('\n=== Database Summary ===')

    // Total records
    const total = runQuery(db, 'SELECT COUNT(*) as cnt FROM sites_cache')
    console.log(`  Total sites: ${total.error ? 'ERROR' : total[0]?.cnt || 0}`)

    // Records by phase
    const byPhase = runQuery(db, `
      SELECT COALESCE(NULLIF(phase_name, ''), 'EMPTY') as phase, COUNT(*) as cnt
      FROM sites_cache
      GROUP BY phase_name
      ORDER BY cnt DESC
    `)

    if (!byPhase.error && byPhase.length > 0) {
      console.log('  By phase:')
      byPhase.forEach(p => {
        console.log(`    - ${p.phase}: ${p.cnt}`)
      })
    }

    // Records by contractor
    const byContractor = runQuery(db, `
      SELECT COALESCE(NULLIF(tssr_subcon, ''), 'UNASSIGNED') as contractor, COUNT(*) as cnt
      FROM sites_cache
      GROUP BY tssr_subcon
      ORDER BY cnt DESC
      LIMIT 10
    `)

    if (!byContractor.error && byContractor.length > 0) {
      console.log('  Top contractors:')
      byContractor.forEach(c => {
        console.log(`    - ${c.contractor}: ${c.cnt}`)
      })
    }

    // Last sync
    const lastSync = runQuery(db, `
      SELECT sync_time, status, records_synced
      FROM sync_log
      ORDER BY sync_time DESC
      LIMIT 1
    `)

    if (!lastSync.error && lastSync.length > 0) {
      console.log(`  Last sync: ${lastSync[0].sync_time} (${lastSync[0].status}, ${lastSync[0].records_synced} records)`)
    }

    return []
  }
}

// Apply fixes
const fixes = {
  createSitesView: (db, opts) => {
    console.log('\n  Creating sites view alias...')
    try {
      db.run('CREATE VIEW IF NOT EXISTS sites AS SELECT * FROM sites_cache')
      console.log('    View created successfully')
      return true
    } catch (e) {
      console.error('    Failed:', e.message)
      return false
    }
  },

  migrateSitesTable: (db, opts) => {
    console.log('\n  Migrating data from sites table to sites_cache...')
    try {
      // Get column names from sites_cache
      const cols = runQuery(db, "PRAGMA table_info(sites_cache)")
      if (cols.error) throw new Error(cols.error)

      const columnNames = cols.map(c => c.name).filter(n => n !== 'id')

      // Insert data
      db.run(`
        INSERT OR IGNORE INTO sites_cache (${columnNames.join(', ')})
        SELECT ${columnNames.join(', ')} FROM sites
      `)

      console.log('    Data migrated successfully')
      return true
    } catch (e) {
      console.error('    Failed:', e.message)
      return false
    }
  },

  deleteInvalidRecords: (db, opts) => {
    console.log('\n  Deleting records without site_id...')
    try {
      const result = db.run("DELETE FROM sites_cache WHERE site_id IS NULL OR site_id = ''")
      console.log('    Deleted invalid records')
      return true
    } catch (e) {
      console.error('    Failed:', e.message)
      return false
    }
  },

  fixInvalidCoordinates: (db, opts) => {
    console.log('\n  Setting invalid coordinates to NULL...')
    try {
      db.run(`
        UPDATE sites_cache
        SET longitude = NULL
        WHERE longitude IS NOT NULL AND (longitude < -180 OR longitude > 180)
      `)
      db.run(`
        UPDATE sites_cache
        SET latitude = NULL
        WHERE latitude IS NOT NULL AND (latitude < -90 OR latitude > 90)
      `)
      console.log('    Coordinates fixed')
      return true
    } catch (e) {
      console.error('    Failed:', e.message)
      return false
    }
  }
}

// Main execution
async function main() {
  const opts = parseArgs()

  console.log('='.repeat(60))
  console.log('TSSR Monitor - Database Cleanup Script')
  console.log('='.repeat(60))
  console.log(`Mode: ${opts.dryRun ? 'DRY RUN (no changes)' : 'FIX MODE (applying changes!)'}`)
  console.log(`Verbose: ${opts.verbose}`)

  const { db, dbPath, SQL } = await initDatabase()
  console.log(`\nDatabase: ${dbPath}`)

  // Run all audits
  const allIssues = []

  for (const [name, auditFn] of Object.entries(audits)) {
    const issues = auditFn(db, opts)
    allIssues.push(...issues)
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('AUDIT SUMMARY')
  console.log('='.repeat(60))

  const critical = allIssues.filter(i => i.type === 'CRITICAL')
  const high = allIssues.filter(i => i.type === 'HIGH')
  const medium = allIssues.filter(i => i.type === 'MEDIUM')
  const low = allIssues.filter(i => i.type === 'LOW')
  const warnings = allIssues.filter(i => i.type === 'WARNING')

  console.log(`\nIssues found:`)
  console.log(`  CRITICAL: ${critical.length}`)
  console.log(`  HIGH:     ${high.length}`)
  console.log(`  MEDIUM:   ${medium.length}`)
  console.log(`  LOW:      ${low.length}`)
  console.log(`  WARNINGS: ${warnings.length}`)

  if (allIssues.length > 0) {
    console.log('\nDetailed issues:')
    allIssues.forEach((issue, i) => {
      console.log(`\n  ${i + 1}. [${issue.type}] ${issue.message}`)
      console.log(`     Fix: ${issue.fix}`)
    })
  }

  // Apply fixes if requested
  if (opts.fix && allIssues.length > 0) {
    console.log('\n' + '='.repeat(60))
    console.log('APPLYING FIXES')
    console.log('='.repeat(60))

    // Create backup first
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupPath = dbPath.replace('.db', `_backup_${timestamp}.db`)

    console.log(`\nCreating backup: ${backupPath}`)
    const data = db.export()
    fs.writeFileSync(backupPath, Buffer.from(data))
    console.log('Backup created successfully')

    // Apply fixes based on issues found
    if (!viewExists(db, 'sites') && !tableExists(db, 'sites')) {
      fixes.createSitesView(db, opts)
    }

    if (tableExists(db, 'sites') && !viewExists(db, 'sites')) {
      fixes.migrateSitesTable(db, opts)
    }

    if (critical.some(i => i.message.includes('without site_id'))) {
      fixes.deleteInvalidRecords(db, opts)
    }

    if (medium.some(i => i.message.includes('coordinates'))) {
      fixes.fixInvalidCoordinates(db, opts)
    }

    // Save changes
    console.log('\nSaving changes...')
    const finalData = db.export()
    fs.writeFileSync(dbPath, Buffer.from(finalData))
    console.log('Changes saved successfully')
  } else if (!opts.fix && allIssues.length > 0) {
    console.log('\n' + '='.repeat(60))
    console.log('To apply fixes, run with --fix flag:')
    console.log('  node electron/scripts/database-cleanup.js --fix')
    console.log('='.repeat(60))
  }

  db.close()
  console.log('\nDone.')
}

main().catch(console.error)
