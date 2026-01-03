const path = require('path')
const fs = require('fs')

// Test better-sqlite3
console.log('\n🔍 Testing better-sqlite3...\n')

try {
  const Database = require('better-sqlite3')
  console.log('✅ better-sqlite3 module found')
  
  const testDbPath = path.join(__dirname, 'data', 'test.db')
  const testDir = path.dirname(testDbPath)
  
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true })
  }
  
  // Create test database
  const db = new Database(testDbPath)
  console.log('✅ Database created:', testDbPath)
  
  // Create test table
  db.exec('CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, value TEXT)')
  console.log('✅ Table created')
  
  // Insert data
  const insert = db.prepare('INSERT INTO test (value) VALUES (?)')
  insert.run('test data')
  console.log('✅ Data inserted')
  
  // Query data
  const row = db.prepare('SELECT * FROM test').get()
  console.log('✅ Data retrieved:', row)
  
  db.close()
  console.log('✅ Database closed')
  
  // Check file size
  const stats = fs.statSync(testDbPath)
  console.log('✅ Database file size:', stats.size, 'bytes')
  
  if (stats.size > 0) {
    console.log('\n✅ SUCCESS: better-sqlite3 is working correctly!')
  } else {
    console.log('\n❌ ERROR: Database file is empty!')
  }
  
} catch (error) {
  console.log('❌ better-sqlite3 test failed:', error.message)
  console.log('\n⚠️ Recommended action:')
  console.log('   1. npm install better-sqlite3')
  console.log('   2. Or: npm rebuild better-sqlite3')
}
