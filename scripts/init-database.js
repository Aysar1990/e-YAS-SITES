/**
 * Initialize SQLite Database
 * Run: node scripts/init-database.js
 */

const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '..', 'data', 'tssr.db');
const migrationPath = path.join(__dirname, '..', 'electron', 'database', 'migrations', '001_initial.sql');

async function initDatabase() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║            Initialize SQLite Database                        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Ensure data directory exists
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('📁 Created data directory');
  }

  // Delete old database if exists
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('🗑️  Deleted old database');
  }

  // Initialize sql.js
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  console.log('✅ Created new database');

  // Read and execute migration
  const migration = fs.readFileSync(migrationPath, 'utf8');
  db.run(migration);
  console.log('✅ Migration applied successfully');

  // Verify tables
  const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
  console.log('\n📋 Tables created:');
  if (tables[0]) {
    tables[0].values.forEach(t => console.log('   - ' + t[0]));
  }

  // Verify sites columns
  const columns = db.exec("PRAGMA table_info(sites)");
  console.log('\n📊 Sites table columns:', columns[0] ? columns[0].values.length : 0);
  
  // Show first 10 columns
  if (columns[0]) {
    console.log('   First columns:');
    columns[0].values.slice(0, 10).forEach(col => console.log(`   - ${col[1]}`));
  }

  // Create default admin user
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  db.run(`
    INSERT OR REPLACE INTO users (username, password, role)
    VALUES (?, ?, ?)
  `, ['admin', hashedPassword, 'admin']);
  console.log('\n👤 Default admin user created (admin/admin123)');

  // Save to file
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
  console.log('💾 Database saved to:', dbPath);

  db.close();

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log('                    ✅ DATABASE READY!');
  console.log('══════════════════════════════════════════════════════════════\n');
}

initDatabase().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
