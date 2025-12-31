/**
 * Sync SQLite to Supabase Script
 * Run: node scripts/sync-to-supabase.js
 */

require('dotenv').config()

const path = require('path')
const fs = require('fs')
const initSqlJs = require('sql.js')
const { createClient } = require('@supabase/supabase-js')

// Configuration
const dbPath = path.join(__dirname, '..', 'data', 'tssr.db')
const BATCH_SIZE = 50

console.log('\n══════════════════════════════════════════════════════════════')
console.log('           Sync to Supabase - TSSR Monitor')
console.log('══════════════════════════════════════════════════════════════\n')

async function syncToSupabase() {
  // Check Supabase config
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Supabase not configured!')
    console.log('   Add SUPABASE_URL and SUPABASE_SERVICE_KEY to .env file')
    return
  }

  console.log('📡 Supabase URL:', supabaseUrl)

  // Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  })

  // Test connection
  console.log('🔗 Testing connection...')
  const { error: testError } = await supabase.from('sites').select('site_id', { count: 'exact', head: true }).limit(1)

  if (testError && testError.code !== 'PGRST116') {
    console.log('❌ Connection failed:', testError.message)
    return
  }
  console.log('✅ Connected to Supabase!\n')

  // Check database file
  if (!fs.existsSync(dbPath)) {
    console.log('❌ SQLite database not found!')
    return
  }

  // Initialize SQL.js
  const SQL = await initSqlJs()
  const fileBuffer = fs.readFileSync(dbPath)
  const db = new SQL.Database(fileBuffer)

  // Get all sites
  console.log('📖 Reading sites from SQLite...')
  const result = db.exec('SELECT * FROM sites')

  if (!result[0]) {
    console.log('⚠️  No sites found in database')
    return
  }

  const columns = result[0].columns
  const rows = result[0].values
  console.log(`✅ Found ${rows.length} sites\n`)

  // Column mapping: SQLite → Supabase
  const columnMapping = {
    'longitude': 'long',
    'latitude': 'lat'
  }

  // Convert rows to objects
  const sites = rows.map(row => {
    const site = {}
    columns.forEach((col, i) => {
      if (col === 'id') return // Skip auto-increment id
      const mappedCol = columnMapping[col] || col
      site[mappedCol] = row[i]
    })
    return site
  })

  // Upload in batches
  console.log(`📤 Uploading to Supabase in batches of ${BATCH_SIZE}...`)

  let uploaded = 0
  let failed = 0

  for (let i = 0; i < sites.length; i += BATCH_SIZE) {
    const batch = sites.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(sites.length / BATCH_SIZE)

    try {
      const { error } = await supabase
        .from('sites')
        .upsert(batch, { onConflict: 'site_id' })

      if (error) {
        console.log(`   ❌ Batch ${batchNum}/${totalBatches} failed: ${error.message}`)
        failed += batch.length
      } else {
        uploaded += batch.length
        const percent = Math.round((uploaded / sites.length) * 100)
        console.log(`   ✅ Batch ${batchNum}/${totalBatches} - ${percent}% complete`)
      }
    } catch (err) {
      console.log(`   ❌ Batch ${batchNum} error: ${err.message}`)
      failed += batch.length
    }
  }

  // Summary
  console.log('\n══════════════════════════════════════════════════════════════')
  console.log('   SYNC COMPLETE')
  console.log('══════════════════════════════════════════════════════════════')
  console.log(`   ✅ Uploaded: ${uploaded}`)
  console.log(`   ❌ Failed: ${failed}`)
  console.log(`   📊 Total: ${sites.length}`)
  console.log('══════════════════════════════════════════════════════════════\n')

  db.close()
}

syncToSupabase().catch(err => {
  console.error('❌ Error:', err.message)
})
