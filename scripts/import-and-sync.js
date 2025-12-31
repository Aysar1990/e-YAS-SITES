/**
 * Import Excel to SQLite & Sync to Supabase
 * Run: node scripts/import-and-sync.js "path/to/excel.xlsm"
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const initSqlJs = require('sql.js');
const { createClient } = require('@supabase/supabase-js');
const { COLUMN_MAPPING, DB_COLUMNS, excelRowToDbObject } = require('../electron/database/columnMapping');

// Paths
const dbPath = path.join(__dirname, '..', 'data', 'tssr.db');
const excelPath = process.argv[2];

if (!excelPath) {
  console.log('Usage: node scripts/import-and-sync.js "path/to/excel.xlsm"');
  process.exit(1);
}

if (!fs.existsSync(excelPath)) {
  console.log('❌ Excel file not found:', excelPath);
  process.exit(1);
}

// Supabase setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function importAndSync() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║         Import Excel → SQLite → Supabase                     ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // ═══════════════════════════════════════════════════════════════
  //                    STEP 1: Read Excel
  // ═══════════════════════════════════════════════════════════════
  
  console.log('📖 Reading Excel file...');
  console.log('   Path:', excelPath);
  
  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0]; // Master sheet
  const worksheet = workbook.Sheets[sheetName];
  
  // Read all data as array of arrays
  const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });
  
  // Headers are in row 3 (index 2)
  const headers = rawData[2];
  console.log('   Headers found:', headers.length);
  
  // Data starts from row 4 (index 3)
  const dataRows = rawData.slice(3).filter(row => row[0]); // Filter rows with Site ID
  console.log('   Data rows:', dataRows.length);

  // ═══════════════════════════════════════════════════════════════
  //                    STEP 2: Import to SQLite
  // ═══════════════════════════════════════════════════════════════
  
  console.log('\n💾 Importing to SQLite...');
  
  // Load existing database
  const SQL = await initSqlJs();
  let db;
  
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    console.log('   ❌ Database not found. Run init-database.js first.');
    process.exit(1);
  }
  
  // Clear existing data
  db.run('DELETE FROM sites');
  
  // Prepare insert statement
  const placeholders = DB_COLUMNS.map(() => '?').join(', ');
  const insertSQL = `INSERT OR REPLACE INTO sites (${DB_COLUMNS.join(', ')}) VALUES (${placeholders})`;
  
  let imported = 0;
  
  for (const row of dataRows) {
    const obj = excelRowToDbObject(row, headers);
    if (obj.site_id) {
      const values = DB_COLUMNS.map(col => obj[col] ?? null);
      try {
        db.run(insertSQL, values);
        imported++;
      } catch (err) {
        // Skip errors
      }
    }
  }
  
  // Save database
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
  
  console.log('   ✅ SQLite:', imported, 'sites imported');
  
  // ═══════════════════════════════════════════════════════════════
  //                    STEP 3: Sync to Supabase
  // ═══════════════════════════════════════════════════════════════
  
  console.log('\n☁️  Syncing to Supabase...');
  
  // Get all sites from SQLite
  const result = db.exec('SELECT * FROM sites');
  const columns = result[0] ? result[0].columns : [];
  const rows = result[0] ? result[0].values : [];
  
  // Convert to objects
  const allSites = rows.map(row => {
    const obj = {};
    columns.forEach((col, i) => {
      if (col !== 'id') { // Skip SQLite id
        obj[col] = row[i];
      }
    });
    return obj;
  });
  
  db.close();
  
  // Clear Supabase table
  console.log('   Clearing Supabase table...');
  const { error: deleteError } = await supabase.from('sites').delete().neq('id', 0);
  if (deleteError) {
    console.log('   ⚠️  Clear error:', deleteError.message);
  }
  
  // Upload in batches
  const batchSize = 100;
  let uploaded = 0;
  let errors = 0;
  
  for (let i = 0; i < allSites.length; i += batchSize) {
    const batch = allSites.slice(i, i + batchSize);
    
    const { error } = await supabase.from('sites').insert(batch);
    
    if (error) {
      console.log(`\n   ❌ Batch ${Math.floor(i/batchSize) + 1} error:`, error.message);
      errors++;
    } else {
      uploaded += batch.length;
      process.stdout.write(`\r   Uploaded: ${uploaded}/${allSites.length}`);
    }
  }
  
  console.log('\n   ✅ Supabase:', uploaded, 'sites synced');
  if (errors > 0) console.log('   ⚠️  Errors:', errors, 'batches failed');

  // ═══════════════════════════════════════════════════════════════
  //                    DONE
  // ═══════════════════════════════════════════════════════════════
  
  console.log('\n══════════════════════════════════════════════════════════════');
  console.log('                         ✅ DONE!');
  console.log('══════════════════════════════════════════════════════════════');
  console.log(`   📊 Excel rows:    ${dataRows.length}`);
  console.log(`   💾 SQLite sites:  ${imported}`);
  console.log(`   ☁️  Supabase:      ${uploaded}`);
  console.log('══════════════════════════════════════════════════════════════\n');
}

importAndSync().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
