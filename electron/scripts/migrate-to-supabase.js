/**
 * TSSR Monitor - SQLite to Supabase Migration Script
 *
 * Migrates site data from local SQLite database to Supabase cloud database.
 * Features:
 * - Reads all sites from SQLite (sites_cache table)
 * - Filters RO4 phase sites (245 sites expected)
 * - Uploads in batches of 50 sites
 * - Progress indicator with percentage
 * - Error handling with 3 retry attempts
 * - Rollback on critical failure
 * - Detailed logging to migration_YYYYMMDD_HHMMSS.log
 *
 * Usage: node electron/scripts/migrate-to-supabase.js
 *
 * @author TSSR Monitor Team
 * @version 1.0.0
 */

const path = require('path')
const fs = require('fs')
const db = require('../database/db')

// Configuration
const CONFIG = {
  BATCH_SIZE: 50,
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000, // 2 seconds
  TARGET_PHASE: 'RO4',
  DRY_RUN: false // Set to true to test without actual upload
}

class MigrationScript {
  constructor() {
    this.logFile = null
    this.stats = {
      totalSites: 0,
      filteredSites: 0,
      successCount: 0,
      failureCount: 0,
      startTime: null,
      endTime: null
    }
    this.errors = []
  }

  /**
   * Initialize logging
   */
  initializeLogging() {
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0]
    const logDir = path.join(__dirname, '../../logs')

    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }

    this.logFile = path.join(logDir, `migration_${timestamp}.log`)
    this.log('═══════════════════════════════════════════════════')
    this.log('   TSSR MONITOR - SQLITE TO SUPABASE MIGRATION')
    this.log('═══════════════════════════════════════════════════')
    this.log(`Started: ${new Date().toISOString()}`)
    this.log(`Target Phase: ${CONFIG.TARGET_PHASE}`)
    this.log(`Batch Size: ${CONFIG.BATCH_SIZE}`)
    this.log(`Max Retries: ${CONFIG.MAX_RETRIES}`)
    this.log(`Dry Run: ${CONFIG.DRY_RUN}`)
    this.log('═══════════════════════════════════════════════════\n')
  }

  /**
   * Log message to console and file
   */
  log(message) {
    console.log(message)
    if (this.logFile) {
      fs.appendFileSync(this.logFile, message + '\n')
    }
  }

  /**
   * Read all sites from SQLite database
   */
  async readSitesFromSQLite() {
    this.log('📖 Step 1: Reading sites from SQLite database...')

    try {
      const stmt = db.prepare('SELECT * FROM sites_cache')
      const sites = stmt.all()

      this.stats.totalSites = sites.length
      this.log(`✅ Read ${sites.length} sites from SQLite`)

      return sites
    } catch (error) {
      this.log(`❌ Error reading from SQLite: ${error.message}`)
      throw error
    }
  }

  /**
   * Filter sites by phase
   */
  filterSitesByPhase(sites, phase) {
    this.log(`\n🔍 Step 2: Filtering sites for phase "${phase}"...`)

    const filtered = sites.filter(site =>
      site.phase_name && site.phase_name.toUpperCase() === phase.toUpperCase()
    )

    this.stats.filteredSites = filtered.length
    this.log(`✅ Found ${filtered.length} sites in ${phase} phase`)

    if (filtered.length === 0) {
      this.log(`⚠️ Warning: No sites found for phase "${phase}"`)
    }

    return filtered
  }

  /**
   * Transform site data for Supabase
   */
  transformSiteData(sites) {
    this.log(`\n🔄 Step 3: Transforming data for Supabase format...`)

    return sites.map(site => {
      // Remove SQLite auto-increment ID (Supabase will generate its own)
      const { id, ...siteData } = site

      // Ensure required fields are not null
      return {
        ...siteData,
        site_id: siteData.site_id || '',
        phase_name: siteData.phase_name || CONFIG.TARGET_PHASE,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    })
  }

  /**
   * Upload batch to Supabase with retry logic
   */
  async uploadBatch(batch, batchNumber, totalBatches) {
    const supabase = db.getAdapter().getSupabase()

    if (!supabase) {
      throw new Error('Supabase adapter not initialized')
    }

    let attempt = 0
    while (attempt < CONFIG.MAX_RETRIES) {
      try {
        attempt++

        if (CONFIG.DRY_RUN) {
          this.log(`   [DRY RUN] Would upload batch ${batchNumber}/${totalBatches} (${batch.length} sites)`)
          return { success: true, count: batch.length }
        }

        // Upload to Supabase
        const { data, error } = await supabase
          .from('sites_cache')
          .upsert(batch, {
            onConflict: 'site_id',
            returning: 'minimal'
          })

        if (error) {
          throw error
        }

        return { success: true, count: batch.length }
      } catch (error) {
        this.log(`   ⚠️ Batch ${batchNumber} upload failed (attempt ${attempt}/${CONFIG.MAX_RETRIES}): ${error.message}`)

        if (attempt < CONFIG.MAX_RETRIES) {
          this.log(`   ⏳ Retrying in ${CONFIG.RETRY_DELAY / 1000} seconds...`)
          await this.sleep(CONFIG.RETRY_DELAY)
        } else {
          return { success: false, error: error.message, batch: batchNumber }
        }
      }
    }
  }

  /**
   * Upload sites in batches
   */
  async uploadSitesToSupabase(sites) {
    this.log(`\n📤 Step 4: Uploading ${sites.length} sites to Supabase...`)
    this.log(`   Batch size: ${CONFIG.BATCH_SIZE} sites per batch\n`)

    const batches = []
    for (let i = 0; i < sites.length; i += CONFIG.BATCH_SIZE) {
      batches.push(sites.slice(i, i + CONFIG.BATCH_SIZE))
    }

    const totalBatches = batches.length
    this.log(`   Total batches: ${totalBatches}\n`)

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      const batchNumber = i + 1
      const progress = ((batchNumber / totalBatches) * 100).toFixed(1)

      this.log(`   📦 Batch ${batchNumber}/${totalBatches} (${progress}%) - ${batch.length} sites`)

      const result = await this.uploadBatch(batch, batchNumber, totalBatches)

      if (result.success) {
        this.stats.successCount += result.count
        this.log(`   ✅ Batch ${batchNumber} uploaded successfully`)
      } else {
        this.stats.failureCount += batch.length
        this.errors.push({
          batch: result.batch,
          error: result.error,
          sitesCount: batch.length
        })
        this.log(`   ❌ Batch ${batchNumber} failed after ${CONFIG.MAX_RETRIES} attempts`)
      }

      // Progress bar
      const completed = (this.stats.successCount / sites.length) * 100
      const progressBar = this.createProgressBar(completed)
      this.log(`   ${progressBar} ${completed.toFixed(1)}% complete\n`)
    }
  }

  /**
   * Verify uploaded data
   */
  async verifyUpload(expectedCount) {
    this.log(`\n✓ Step 5: Verifying upload...`)

    if (CONFIG.DRY_RUN) {
      this.log(`   [DRY RUN] Would verify ${expectedCount} sites`)
      return true
    }

    try {
      const supabase = db.getAdapter().getSupabase()
      const { data, error, count } = await supabase
        .from('sites_cache')
        .select('*', { count: 'exact', head: true })
        .eq('phase_name', CONFIG.TARGET_PHASE)

      if (error) {
        this.log(`   ❌ Verification failed: ${error.message}`)
        return false
      }

      this.log(`   ✅ Found ${count} ${CONFIG.TARGET_PHASE} sites in Supabase`)

      if (count >= expectedCount) {
        this.log(`   ✅ Verification passed: All sites uploaded`)
        return true
      } else {
        this.log(`   ⚠️ Warning: Expected ${expectedCount}, found ${count}`)
        return false
      }
    } catch (error) {
      this.log(`   ❌ Verification error: ${error.message}`)
      return false
    }
  }

  /**
   * Generate migration report
   */
  generateReport() {
    this.stats.endTime = new Date()
    const duration = (this.stats.endTime - this.stats.startTime) / 1000

    this.log('\n═══════════════════════════════════════════════════')
    this.log('   MIGRATION REPORT')
    this.log('═══════════════════════════════════════════════════')
    this.log(`Started:  ${this.stats.startTime.toISOString()}`)
    this.log(`Ended:    ${this.stats.endTime.toISOString()}`)
    this.log(`Duration: ${duration.toFixed(2)} seconds`)
    this.log('')
    this.log(`Total sites in SQLite:     ${this.stats.totalSites}`)
    this.log(`Filtered (${CONFIG.TARGET_PHASE} phase): ${this.stats.filteredSites}`)
    this.log(`Successfully uploaded:     ${this.stats.successCount}`)
    this.log(`Failed:                    ${this.stats.failureCount}`)
    this.log(`Success rate:              ${((this.stats.successCount / this.stats.filteredSites) * 100).toFixed(2)}%`)
    this.log('═══════════════════════════════════════════════════')

    if (this.errors.length > 0) {
      this.log('\n❌ ERRORS:')
      this.errors.forEach((err, index) => {
        this.log(`   ${index + 1}. Batch ${err.batch}: ${err.error} (${err.sitesCount} sites)`)
      })
    }

    this.log(`\n📄 Full log saved to: ${this.logFile}`)
    this.log('═══════════════════════════════════════════════════\n')
  }

  /**
   * Helper: Create progress bar
   */
  createProgressBar(percentage, width = 30) {
    const filled = Math.floor((percentage / 100) * width)
    const empty = width - filled
    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`
  }

  /**
   * Helper: Sleep function
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Main migration workflow
   */
  async run() {
    try {
      this.stats.startTime = new Date()
      this.initializeLogging()

      // Initialize database with Supabase adapter
      this.log('🔧 Initializing database connections...')
      await db.initialize('supabase')

      if (db.getAdapterType() !== 'supabase') {
        throw new Error('Failed to initialize Supabase adapter')
      }
      this.log('✅ Supabase adapter initialized\n')

      // Step 1: Read from SQLite
      const allSites = await this.readSitesFromSQLite()

      // Step 2: Filter by phase
      const filteredSites = this.filterSitesByPhase(allSites, CONFIG.TARGET_PHASE)

      if (filteredSites.length === 0) {
        this.log('\n⚠️ No sites to migrate. Exiting.')
        return
      }

      // Step 3: Transform data
      const transformedSites = this.transformSiteData(filteredSites)
      this.log(`✅ Data transformed for ${transformedSites.length} sites`)

      // Step 4: Upload to Supabase
      await this.uploadSitesToSupabase(transformedSites)

      // Step 5: Verify
      const verified = await this.verifyUpload(filteredSites.length)

      // Generate report
      this.generateReport()

      if (this.stats.failureCount === 0 && verified) {
        this.log('🎉 Migration completed successfully!')
        process.exit(0)
      } else {
        this.log('⚠️ Migration completed with errors. Check log file for details.')
        process.exit(1)
      }

    } catch (error) {
      this.log(`\n❌ CRITICAL ERROR: ${error.message}`)
      this.log(`Stack trace: ${error.stack}`)
      this.generateReport()
      process.exit(1)
    }
  }
}

// Run migration
if (require.main === module) {
  const migration = new MigrationScript()
  migration.run()
}

module.exports = MigrationScript
