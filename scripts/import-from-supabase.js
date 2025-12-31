/**
 * Import data from Supabase to local SQLite
 * Run this script to pull all data from Supabase cloud to local database
 * 
 * Usage: node scripts/import-from-supabase.js
 */

const path = require('path')
const fs = require('fs')

// Load environment
const envPath = path.join(__dirname, '../electron/.env.server')
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath })
}

const { createClient } = require('@supabase/supabase-js')

// Supabase configuration
const SUPABASE_URL = 'https://kszdatqbykpodxmnfzfg.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY

async function importFromSupabase() {
  console.log('═══════════════════════════════════════════════════')
  console.log('  Import from Supabase to Local SQLite')
  console.log('═══════════════════════════════════════════════════\n')

  if (!SUPABASE_KEY) {
    console.error('❌ SUPABASE_KEY not found in environment')
    console.log('   Please set SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY in electron/.env.server')
    process.exit(1)
  }

  try {
    // Initialize Supabase client
    console.log('🔌 Connecting to Supabase...')
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

    // Initialize local SQLite
    console.log('💾 Initializing local database...')
    const db = require('../electron/database/db')
    await db.initialize()

    // Fetch all sites from Supabase
    console.log('📥 Fetching sites from Supabase...')
    
    let allSites = []
    let page = 0
    const pageSize = 1000
    
    while (true) {
      const { data, error } = await supabase
        .from('sites')
        .select('*')
        .range(page * pageSize, (page + 1) * pageSize - 1)
        .order('site_id')

      if (error) {
        throw new Error(`Supabase error: ${error.message}`)
      }

      if (!data || data.length === 0) {
        break
      }

      allSites = allSites.concat(data)
      console.log(`   Fetched ${allSites.length} sites...`)
      page++
    }

    console.log(`✅ Total sites fetched: ${allSites.length}`)

    if (allSites.length === 0) {
      console.log('⚠️ No sites found in Supabase')
      process.exit(0)
    }

    // Insert into local SQLite
    console.log('\n💾 Inserting into local SQLite...')

    // Get column names from first record
    const columns = Object.keys(allSites[0]).filter(col => 
      col !== 'id' && col !== 'created_at' && col !== 'updated_at'
    )

    const placeholders = columns.map(() => '?').join(', ')
    const updateSet = columns.map(col => `${col} = excluded.${col}`).join(', ')

    const sql = `
      INSERT INTO sites (${columns.join(', ')})
      VALUES (${placeholders})
      ON CONFLICT(site_id, phase_name) DO UPDATE SET
      ${updateSet},
      updated_at = CURRENT_TIMESTAMP
    `

    const stmt = db.prepare(sql)
    let inserted = 0
    let errors = 0

    for (const site of allSites) {
      try {
        const values = columns.map(col => site[col] ?? null)
        stmt.run(...values)
        inserted++
        
        if (inserted % 500 === 0) {
          console.log(`   Processed ${inserted}/${allSites.length} sites...`)
        }
      } catch (err) {
        errors++
        if (errors <= 5) {
          console.error(`   ❌ Error inserting ${site.site_id}: ${err.message}`)
        }
      }
    }

    // Save database
    if (db.save) {
      db.save()
    }

    console.log('\n═══════════════════════════════════════════════════')
    console.log('  Import Complete')
    console.log('═══════════════════════════════════════════════════')
    console.log(`  ✅ Inserted/Updated: ${inserted}`)
    console.log(`  ❌ Errors: ${errors}`)
    console.log('═══════════════════════════════════════════════════\n')

    // Verify
    const count = db.prepare('SELECT COUNT(*) as count FROM sites').get()
    console.log(`📊 Total sites in local database: ${count?.count || 0}`)

    process.exit(0)

  } catch (error) {
    console.error('\n❌ Import failed:', error.message)
    process.exit(1)
  }
}

importFromSupabase()
