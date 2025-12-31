/**
 * Diagnostic Script - Check why data is not persisting
 */

const path = require('path')
const fs = require('fs')

console.log('═══════════════════════════════════════════════════')
console.log('  🔍 TSSR Data Persistence Diagnostic')
console.log('═══════════════════════════════════════════════════\n')

// 1. Check database file
const dbPath = path.join(__dirname, 'data', 'tssr.db')
console.log('1️⃣ Database File Check:')
console.log('   Path:', dbPath)

if (fs.existsSync(dbPath)) {
  const stats = fs.statSync(dbPath)
  console.log('   ✅ File EXISTS')
  console.log('   Size:', (stats.size / 1024).toFixed(2), 'KB')
  console.log('   Modified:', stats.mtime.toISOString())
} else {
  console.log('   ❌ File NOT FOUND')
}

// 2. Try to read with sql.js
console.log('\n2️⃣ SQL.js Read Test:')
const initSqlJs = require('sql.js')

initSqlJs().then(SQL => {
  try {
    if (fs.existsSync(dbPath)) {
      const buffer = fs.readFileSync(dbPath)
      const db = new SQL.Database(buffer)
      
      // Check tables
      const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table'")
      console.log('   Tables:', tables[0]?.values?.map(v => v[0]).join(', ') || 'None')
      
      // Check sites count
      const sitesCount = db.exec("SELECT COUNT(*) FROM sites")
      const count = sitesCount[0]?.values?.[0]?.[0] || 0
      console.log('   Sites count:', count)
      
      if (count > 0) {
        // Get sample
        const sample = db.exec("SELECT site_id, phase_name FROM sites LIMIT 3")
        console.log('   Sample:', JSON.stringify(sample[0]?.values))
      }
      
      db.close()
    }
  } catch (err) {
    console.log('   ❌ Error:', err.message)
  }
  
  // 3. Check if better-sqlite3 was used instead
  console.log('\n3️⃣ Check for better-sqlite3 database:')
  try {
    const Database = require('better-sqlite3')
    const db2 = new Database(dbPath, { readonly: true })
    const count2 = db2.prepare('SELECT COUNT(*) as cnt FROM sites').get()
    console.log('   better-sqlite3 count:', count2?.cnt || 0)
    db2.close()
  } catch (err) {
    console.log('   better-sqlite3 error:', err.message)
  }
  
  console.log('\n═══════════════════════════════════════════════════')
  console.log('  Diagnostic Complete')
  console.log('═══════════════════════════════════════════════════')
})
