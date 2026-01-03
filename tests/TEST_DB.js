const Database = require('better-sqlite3');
const path = require('path');

console.log('🔍 Testing Database Stats Issue...\n');

try {
  // Open database directly
  const dbPath = path.join(__dirname, 'data', 'tssr.db');
  console.log('📂 DB Path:', dbPath);

  const db = new Database(dbPath, { readonly: true });
  console.log('✅ DB Opened Successfully\n');

  // Check total sites
  const totalStmt = db.prepare('SELECT COUNT(*) as total FROM sites');
  const totalResult = totalStmt.get();
  console.log('📊 Total Sites in DB:', totalResult.total);

  // Check phases
  const phasesStmt = db.prepare('SELECT DISTINCT phase_name, COUNT(*) as count FROM sites GROUP BY phase_name');
  const phases = phasesStmt.all();
  console.log('\n📋 Phases:');
  phases.forEach(p => console.log(`  ${p.phase_name}: ${p.count} sites`));

  // Check stats for RO4
  console.log('\n📊 Stats for RO4:');
  const statsStmt = db.prepare(`
    SELECT tssr_overall_status, COUNT(*) as count
    FROM sites
    WHERE phase_name = 'RO4'
    GROUP BY tssr_overall_status
    ORDER BY count DESC
    LIMIT 10
  `);
  const stats = statsStmt.all();
  
  if (stats.length === 0) {
    console.log('  ❌ NO DATA FOUND FOR RO4!');
  } else {
    let total = 0;
    stats.forEach(s => {
      console.log(`  ${s.tssr_overall_status || 'NULL'}: ${s.count}`);
      total += s.count;
    });
    console.log(`  ---`);
    console.log(`  Total: ${total}`);
  }
  
  // Check overview stats (like Dashboard uses)
  console.log('\n📊 Overview Stats (Dashboard Query):');
  const overviewStmt = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN ts_survey_ac IS NOT NULL AND TRIM(ts_survey_ac) != '' THEN 1 ELSE 0 END) as survey_done,
      SUM(CASE WHEN version IS NOT NULL AND TRIM(version) != '' THEN 1 ELSE 0 END) as tssr_submitted,
      SUM(CASE WHEN tssr_overall_status = 'Approved' THEN 1 ELSE 0 END) as approved
    FROM sites
    WHERE phase_name = 'RO4'
  `);
  const overview = overviewStmt.get();
  console.log(`  Total: ${overview.total}`);
  console.log(`  Survey Done: ${overview.survey_done}`);
  console.log(`  TSSR Submitted: ${overview.tssr_submitted}`);
  console.log(`  Approved: ${overview.approved}`);
  
  db.close();
  console.log('\n✅ Test Complete!');

} catch (error) {
  console.error('\n❌ Error:', error.message);
  console.error(error.stack);
}
