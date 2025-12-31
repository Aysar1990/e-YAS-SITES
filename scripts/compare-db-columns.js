/**
 * Compare SQLite vs Supabase Columns
 * Run: node scripts/compare-db-columns.js
 */

require('dotenv').config()
const path = require('path')
const fs = require('fs')
const initSqlJs = require('sql.js')
const { createClient } = require('@supabase/supabase-js')

const dbPath = path.join(__dirname, '..', 'data', 'tssr.db')

async function compareColumns() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗')
  console.log('║       COMPARE SQLite vs Supabase COLUMNS                     ║')
  console.log('╚══════════════════════════════════════════════════════════════╝\n')

  // ═══════════════════════════════════════════════════════════════
  //                    GET SQLite COLUMNS
  // ═══════════════════════════════════════════════════════════════
  
  console.log('📂 Reading SQLite database...\n')
  
  let sqliteColumns = []
  
  if (fs.existsSync(dbPath)) {
    const SQL = await initSqlJs()
    const fileBuffer = fs.readFileSync(dbPath)
    const db = new SQL.Database(fileBuffer)
    
    // Get columns from sites table
    const result = db.exec("PRAGMA table_info(sites)")
    
    if (result[0]) {
      sqliteColumns = result[0].values.map(row => ({
        name: row[1],
        type: row[2],
        notnull: row[3],
        default: row[4]
      }))
    }
    
    db.close()
    console.log(`✅ Found ${sqliteColumns.length} columns in SQLite\n`)
  } else {
    console.log('❌ SQLite database not found at:', dbPath)
    return
  }

  // ═══════════════════════════════════════════════════════════════
  //                    GET Supabase COLUMNS
  // ═══════════════════════════════════════════════════════════════
  
  console.log('📡 Fetching Supabase columns...\n')
  
  let supabaseColumns = []
  
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Get one row to see columns
    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .limit(1)

    if (error && error.code !== 'PGRST116') {
      console.log('❌ Supabase error:', error.message)
    } else if (data && data.length > 0) {
      supabaseColumns = Object.keys(data[0]).map(name => ({ name }))
      console.log(`✅ Found ${supabaseColumns.length} columns in Supabase\n`)
    } else {
      console.log('⚠️  Supabase table is empty.')
      console.log('   Inserting test row to detect columns...\n')
      
      // Try inserting a dummy row
      const { data: insertData, error: insertError } = await supabase
        .from('sites')
        .insert({ site_id: '__test_column_check__', phase_name: '__test__' })
        .select()

      if (insertError) {
        console.log('❌ Insert error:', insertError.message)
        console.log('\n💡 Run this SQL in Supabase to see columns:')
        console.log("   SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'sites';")
      } else if (insertData && insertData.length > 0) {
        supabaseColumns = Object.keys(insertData[0]).map(name => ({ name }))
        console.log(`✅ Found ${supabaseColumns.length} columns in Supabase\n`)
        
        // Delete the test row
        await supabase.from('sites').delete().eq('site_id', '__test_column_check__')
        console.log('🗑️  Test row deleted\n')
      }
    }
  } else {
    console.log('❌ Supabase not configured in .env')
    return
  }

  // ═══════════════════════════════════════════════════════════════
  //                    COMPARE & DISPLAY
  // ═══════════════════════════════════════════════════════════════

  const sqliteColNames = sqliteColumns.map(c => c.name)
  const supabaseColNames = supabaseColumns.map(c => c.name)

  // Find differences
  const onlyInSqlite = sqliteColNames.filter(c => !supabaseColNames.includes(c))
  const onlyInSupabase = supabaseColNames.filter(c => !sqliteColNames.includes(c))
  const inBoth = sqliteColNames.filter(c => supabaseColNames.includes(c))

  // ═══════════════════════════════════════════════════════════════
  //                    PRINT RESULTS
  // ═══════════════════════════════════════════════════════════════

  console.log('╔══════════════════════════════════════════════════════════════╗')
  console.log('║                    SQLite COLUMNS                            ║')
  console.log('╚══════════════════════════════════════════════════════════════╝')
  console.log(`Total: ${sqliteColumns.length} columns\n`)
  
  sqliteColumns.forEach((col, i) => {
    const status = supabaseColNames.includes(col.name) ? '✅' : '❌'
    console.log(`  ${String(i+1).padStart(2)}. ${status} ${col.name.padEnd(30)} [${col.type || 'TEXT'}]`)
  })

  console.log('\n╔══════════════════════════════════════════════════════════════╗')
  console.log('║                   SUPABASE COLUMNS                           ║')
  console.log('╚══════════════════════════════════════════════════════════════╝')
  console.log(`Total: ${supabaseColumns.length} columns\n`)
  
  supabaseColumns.forEach((col, i) => {
    const status = sqliteColNames.includes(col.name) ? '✅' : '⚠️'
    console.log(`  ${String(i+1).padStart(2)}. ${status} ${col.name}`)
  })

  console.log('\n╔══════════════════════════════════════════════════════════════╗')
  console.log('║                      COMPARISON                              ║')
  console.log('╚══════════════════════════════════════════════════════════════╝\n')

  console.log(`📊 SQLite columns:   ${sqliteColNames.length}`)
  console.log(`📊 Supabase columns: ${supabaseColNames.length}`)
  console.log(`✅ In both:          ${inBoth.length}`)
  console.log(`❌ Only in SQLite:   ${onlyInSqlite.length}`)
  console.log(`⚠️  Only in Supabase: ${onlyInSupabase.length}`)

  if (onlyInSqlite.length > 0) {
    console.log('\n┌──────────────────────────────────────────────────────────────┐')
    console.log('│  ❌ MISSING IN SUPABASE (need to add):                       │')
    console.log('└──────────────────────────────────────────────────────────────┘')
    onlyInSqlite.forEach(col => console.log(`     - ${col}`))
    
    // Generate SQL
    console.log('\n📝 SQL to add missing columns:\n')
    console.log('```sql')
    onlyInSqlite.forEach(col => {
      const sqliteCol = sqliteColumns.find(c => c.name === col)
      let pgType = 'TEXT'
      if (sqliteCol) {
        if (sqliteCol.type === 'INTEGER') pgType = 'INTEGER'
        else if (sqliteCol.type === 'REAL') pgType = 'NUMERIC'
        else if (sqliteCol.type === 'DATETIME') pgType = 'TIMESTAMPTZ'
      }
      console.log(`ALTER TABLE sites ADD COLUMN IF NOT EXISTS ${col} ${pgType};`)
    })
    console.log('```')
  }

  if (onlyInSupabase.length > 0) {
    console.log('\n┌──────────────────────────────────────────────────────────────┐')
    console.log('│  ⚠️  ONLY IN SUPABASE (extra columns):                        │')
    console.log('└──────────────────────────────────────────────────────────────┘')
    onlyInSupabase.forEach(col => console.log(`     + ${col}`))
  }

  if (onlyInSqlite.length === 0 && onlyInSupabase.length === 0) {
    console.log('\n✅ PERFECT! Both databases have identical columns!')
  }

  console.log('\n══════════════════════════════════════════════════════════════')
  console.log('                         DONE!')
  console.log('══════════════════════════════════════════════════════════════\n')
}

compareColumns().catch(err => {
  console.error('❌ Error:', err.message)
})
