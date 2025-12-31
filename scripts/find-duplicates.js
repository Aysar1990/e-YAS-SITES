/**
 * Find duplicate sites (same site_id + phase_name)
 */

const XLSX = require('xlsx');
const path = require('path');

const excelPath = process.argv[2] || path.join(__dirname, '..', 'Book1 (1).xlsx');

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║            Find Duplicate Sites                              ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// Read Excel
const workbook = XLSX.readFile(excelPath);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

// Headers in row 3, data from row 4
const headers = rawData[2];
const dataRows = rawData.slice(3).filter(row => row[0]);

// Find site_id and phase_name column indexes
const siteIdIdx = headers.findIndex(h => h === 'Site ID');
const phaseIdx = headers.findIndex(h => h === 'Phase Name');

console.log('📊 Total rows:', dataRows.length);
console.log('📍 Site ID column:', siteIdIdx + 1);
console.log('📍 Phase Name column:', phaseIdx + 1);
console.log('');

// Track combinations
const seen = new Map();
const duplicates = [];

dataRows.forEach((row, index) => {
  const siteId = row[siteIdIdx];
  const phase = row[phaseIdx] || 'NULL';
  const key = `${siteId}|||${phase}`;
  
  if (seen.has(key)) {
    duplicates.push({
      rowNum: index + 4, // Excel row number
      siteId,
      phase,
      firstRow: seen.get(key)
    });
  } else {
    seen.set(key, index + 4);
  }
});

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║            DUPLICATE SITES                                   ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

console.log(`Found ${duplicates.length} duplicates:\n`);

if (duplicates.length > 0) {
  console.log('┌─────────┬────────────┬─────────────────────┬───────────────┐');
  console.log('│ Row #   │ Site ID    │ Phase Name          │ First in Row  │');
  console.log('├─────────┼────────────┼─────────────────────┼───────────────┤');
  
  duplicates.forEach(d => {
    const row = String(d.rowNum).padEnd(7);
    const site = String(d.siteId).padEnd(10);
    const phase = String(d.phase).padEnd(19);
    const first = String(d.firstRow).padEnd(13);
    console.log(`│ ${row} │ ${site} │ ${phase} │ ${first} │`);
  });
  
  console.log('└─────────┴────────────┴─────────────────────┴───────────────┘');
  
  // Summary by phase
  console.log('\n📊 Summary by Phase:\n');
  const byPhase = {};
  duplicates.forEach(d => {
    byPhase[d.phase] = (byPhase[d.phase] || 0) + 1;
  });
  Object.entries(byPhase).sort((a,b) => b[1] - a[1]).forEach(([phase, count]) => {
    console.log(`   ${phase}: ${count} duplicates`);
  });
}

console.log('\n══════════════════════════════════════════════════════════════\n');
