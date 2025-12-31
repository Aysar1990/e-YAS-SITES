/**
 * Initialize fresh database with proper schema
 */

const path = require('path')
const fs = require('fs')
const initSqlJs = require('sql.js')

const DB_PATH = path.join(__dirname, 'data', 'tssr.db')
const MIGRATION_PATH = path.join(__dirname, 'electron', 'database', 'migrations', '001_initial.sql')

async function initializeDatabase() {
  console.log('=' .repeat(60))
  console.log('DATABASE INITIALIZATION')
  console.log('=' .repeat(60))

  // Ensure data directory exists
  const dataDir = path.dirname(DB_PATH)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  // Remove old corrupted database if exists
  if (fs.existsSync(DB_PATH)) {
    console.log('\n🗑️  Removing corrupted database...')
    fs.unlinkSync(DB_PATH)
    console.log('   Done')
  }

  const SQL = await initSqlJs()

  // Create new database
  console.log('\n📝 Creating fresh database...')
  const db = new SQL.Database()

  // Read migration file
  console.log('\n📄 Reading migration file...')
  const migrationSQL = fs.readFileSync(MIGRATION_PATH, 'utf8')

  // Remove comments and split into statements
  const cleanSQL = migrationSQL
    .split('\n')
    .map(line => line.replace(/--.*$/, '').trim())
    .join('\n')

  const statements = cleanSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0)

  console.log(`   Found ${statements.length} SQL statements`)

  // Execute each statement
  console.log('\n🚀 Executing migrations...')
  let successCount = 0
  let errorCount = 0

  for (const statement of statements) {
    try {
      db.exec(statement)
      successCount++
    } catch (error) {
      // Ignore "already exists" errors
      if (!error.message.includes('already exists') &&
          !error.message.includes('UNIQUE constraint')) {
        console.log(`   ⚠️  ${error.message.substring(0, 50)}...`)
        errorCount++
      }
    }
  }

  console.log(`   ✅ ${successCount} statements executed`)
  if (errorCount > 0) {
    console.log(`   ⚠️  ${errorCount} statements had errors`)
  }

  // Verify tables created
  console.log('\n📊 Verifying database structure...')
  const tables = db.exec(`
    SELECT name FROM sqlite_master
    WHERE type='table'
    ORDER BY name
  `)

  if (tables[0]) {
    console.log('   Tables created:')
    tables[0].values.forEach(row => {
      const countResult = db.exec(`SELECT COUNT(*) FROM "${row[0]}"`)
      const count = countResult[0]?.values[0]?.[0] || 0
      console.log(`   - ${row[0]}: ${count} rows`)
    })
  }

  // Verify admin user
  const adminUser = db.exec(`SELECT id, username, role FROM users WHERE username = 'admin'`)
  if (adminUser[0]) {
    console.log(`\n👤 Admin user created: ${adminUser[0].values[0][1]} (${adminUser[0].values[0][2]})`)
  }

  // Save to file
  console.log('\n💾 Saving database to disk...')
  const data = db.export()
  const buffer = Buffer.from(data)
  fs.writeFileSync(DB_PATH, buffer)
  console.log(`   Saved ${buffer.length} bytes`)

  // Verify by reopening
  console.log('\n🔍 Verifying persistence...')
  const verifyBuffer = fs.readFileSync(DB_PATH)
  const verifyDB = new SQL.Database(verifyBuffer)

  const verifyTables = verifyDB.exec(`
    SELECT name FROM sqlite_master WHERE type='table'
  `)
  console.log(`   Tables after reopen: ${verifyTables[0]?.values?.length || 0}`)

  const verifySettings = verifyDB.exec(`SELECT COUNT(*) FROM settings`)
  console.log(`   Settings count: ${verifySettings[0]?.values[0]?.[0] || 0}`)

  db.close()
  verifyDB.close()

  console.log('\n' + '=' .repeat(60))
  console.log('✅ DATABASE INITIALIZED SUCCESSFULLY!')
  console.log('=' .repeat(60))
  console.log('\nYou can now start the application and import Excel data.')
}

initializeDatabase().catch(console.error)
