/**
 * Create sites_cache view from sites table
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, 'db', 'tssr.db')

console.log('📊 Creating sites_cache view...')
console.log('DB Path:', dbPath)

try {
  const db = new Database(dbPath)

  // Drop existing view
  db.exec('DROP VIEW IF EXISTS sites_cache')

  // Create view
  db.exec(`
    CREATE VIEW sites_cache AS
    SELECT * FROM sites
  `)

  // Test view
  const count = db.prepare('SELECT COUNT(*) as count FROM sites_cache').get()
  console.log('✅ sites_cache created successfully')
  console.log('✅ Total records:', count.count)

  db.close()
} catch (error) {
  console.error('❌ Error:', error.message)
}
