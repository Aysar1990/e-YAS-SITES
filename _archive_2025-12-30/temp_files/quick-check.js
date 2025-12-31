// Quick check database contents
const path = require('path')
const initSqlJs = require('sql.js')
const fs = require('fs')

async function check() {
  const SQL = await initSqlJs()
  const dbPath = path.join(__dirname, 'data/tssr.db')
  
  console.log('DB Path:', dbPath)
  console.log('Exists:', fs.existsSync(dbPath))
  
  const buffer = fs.readFileSync(dbPath)
  const db = new SQL.Database(buffer)
  
  // Check tables
  const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table'")
  console.log('\nTables:', tables[0]?.values.map(v => v[0]))
  
  // Check sites count
  const sites = db.exec('SELECT COUNT(*) FROM sites')
  console.log('Sites count:', sites[0]?.values[0][0])
  
  // Check users
  const users = db.exec('SELECT COUNT(*) FROM users')
  console.log('Users count:', users[0]?.values[0][0])
  
  // Sample site
  const sample = db.exec('SELECT site_id, phase_name, governorate FROM sites LIMIT 3')
  console.log('Sample sites:', sample[0]?.values)
  
  db.close()
}

check().catch(console.error)
