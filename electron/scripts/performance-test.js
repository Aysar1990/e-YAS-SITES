/**
 * Performance Test Script
 * Runs performance benchmarks on critical operations
 *
 * Usage: npm run test:perf
 */

const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../../.env') })

const fs = require('fs')

// Performance thresholds (in ms)
const THRESHOLDS = {
  dbQuery: 100,
  dbInsert: 200,
  dbBulkInsert: 2000,
  excelRead: 5000,
  apiResponse: 500,
  memoryMB: 500
}

/**
 * Measure execution time
 */
async function measure(name, fn) {
  const start = process.hrtime.bigint()
  const memBefore = process.memoryUsage().heapUsed

  try {
    await fn()
  } catch (err) {
    return {
      name,
      success: false,
      error: err.message,
      time: 0,
      memory: 0
    }
  }

  const end = process.hrtime.bigint()
  const memAfter = process.memoryUsage().heapUsed

  return {
    name,
    success: true,
    time: Number(end - start) / 1_000_000, // Convert to ms
    memory: (memAfter - memBefore) / 1024 / 1024 // Convert to MB
  }
}

/**
 * Database performance tests
 */
async function testDatabase() {
  console.log('\n--- Database Performance ---')

  const db = require('../database/db')
  db.initialize()

  const results = []

  // Test 1: Simple query
  results.push(await measure('Simple SELECT', () => {
    db.prepare('SELECT COUNT(*) FROM sites').get()
  }))

  // Test 2: Query with index
  results.push(await measure('Indexed query (phase_name)', () => {
    db.prepare('SELECT * FROM sites WHERE phase_name = ? LIMIT 100').all('Phase 1')
  }))

  // Test 3: Full table scan
  results.push(await measure('Full table scan', () => {
    db.prepare('SELECT * FROM sites').all()
  }))

  // Test 4: Complex query with JOIN-like operation
  results.push(await measure('Aggregation query', () => {
    db.prepare(`
      SELECT phase_name, tssr_overall_status, COUNT(*) as count
      FROM sites
      GROUP BY phase_name, tssr_overall_status
    `).all()
  }))

  // Test 5: Single insert
  results.push(await measure('Single INSERT', () => {
    db.prepare(`
      INSERT OR REPLACE INTO sites (site_id, phase_name, site_name, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `).run('PERF-TEST-001', 'Test Phase', 'Performance Test Site')
  }))

  // Test 6: Bulk insert (100 records)
  results.push(await measure('Bulk INSERT (100 records)', () => {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO sites (site_id, phase_name, site_name, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `)

    db.exec('BEGIN TRANSACTION')
    try {
      for (let i = 0; i < 100; i++) {
        stmt.run(`PERF-BULK-${i}`, 'Bulk Test', `Bulk Site ${i}`)
      }
      db.exec('COMMIT')
    } catch (e) {
      db.exec('ROLLBACK')
      throw e
    }
  }))

  // Cleanup test data
  db.exec("DELETE FROM sites WHERE site_id LIKE 'PERF-%'")

  return results
}

/**
 * Excel reader performance tests
 */
async function testExcelReader() {
  console.log('\n--- Excel Reader Performance ---')

  const results = []

  // Check if test file exists
  const testFile = path.join(__dirname, '../../TSSR Tracker Zain Jo 5.xlsm')
  const altFile = path.join(__dirname, '../../../TSSR Tracker Zain Jo 5.xlsm')

  let excelPath = null
  if (fs.existsSync(testFile)) {
    excelPath = testFile
  } else if (fs.existsSync(altFile)) {
    excelPath = altFile
  }

  if (!excelPath) {
    results.push({
      name: 'Excel file read',
      success: false,
      error: 'Test Excel file not found',
      time: 0,
      memory: 0
    })
    return results
  }

  const excelReader = require('../services/excelReader')

  // Test 1: Read worksheet names
  results.push(await measure('Get worksheet names', () => {
    excelReader.getWorksheetNames(excelPath)
  }))

  // Test 2: Read first worksheet
  results.push(await measure('Read first worksheet', () => {
    const names = excelReader.getWorksheetNames(excelPath)
    if (names.length > 0) {
      excelReader.readWorksheet(excelPath, names[0])
    }
  }))

  // Test 3: Read all data
  results.push(await measure('Read all worksheets', () => {
    excelReader.getAllData(excelPath)
  }))

  return results
}

/**
 * Memory usage test
 */
async function testMemory() {
  console.log('\n--- Memory Usage ---')

  const results = []
  const used = process.memoryUsage()

  results.push({
    name: 'Heap Used',
    success: used.heapUsed / 1024 / 1024 < THRESHOLDS.memoryMB,
    time: 0,
    memory: used.heapUsed / 1024 / 1024,
    threshold: THRESHOLDS.memoryMB
  })

  results.push({
    name: 'Heap Total',
    success: true,
    time: 0,
    memory: used.heapTotal / 1024 / 1024
  })

  results.push({
    name: 'RSS (Resident Set Size)',
    success: true,
    time: 0,
    memory: used.rss / 1024 / 1024
  })

  return results
}

/**
 * Print results
 */
function printResults(category, results) {
  console.log()
  for (const r of results) {
    const status = r.success ? '\x1b[32m\u2714\x1b[0m' : '\x1b[31m\u2718\x1b[0m'

    if (r.error) {
      console.log(`${status} ${r.name}: ERROR - ${r.error}`)
    } else if (r.time > 0) {
      const timeColor = r.time > THRESHOLDS[category] ? '\x1b[31m' : '\x1b[32m'
      console.log(`${status} ${r.name}: ${timeColor}${r.time.toFixed(2)}ms\x1b[0m (${r.memory.toFixed(2)}MB)`)
    } else {
      console.log(`${status} ${r.name}: ${r.memory.toFixed(2)}MB`)
    }
  }
}

/**
 * Main performance test
 */
async function runPerformanceTests() {
  console.log('========================================')
  console.log('e-YAS SITES Performance Benchmark')
  console.log('========================================')
  console.log(`Date: ${new Date().toISOString()}`)
  console.log(`Node: ${process.version}`)
  console.log(`Platform: ${process.platform} ${process.arch}`)

  const allResults = {
    timestamp: new Date().toISOString(),
    thresholds: THRESHOLDS,
    tests: {}
  }

  // Run tests
  try {
    const dbResults = await testDatabase()
    printResults('dbQuery', dbResults)
    allResults.tests.database = dbResults
  } catch (err) {
    console.log('\nDatabase tests failed:', err.message)
  }

  try {
    const excelResults = await testExcelReader()
    printResults('excelRead', excelResults)
    allResults.tests.excel = excelResults
  } catch (err) {
    console.log('\nExcel tests failed:', err.message)
  }

  try {
    const memResults = await testMemory()
    printResults('memory', memResults)
    allResults.tests.memory = memResults
  } catch (err) {
    console.log('\nMemory tests failed:', err.message)
  }

  // Summary
  console.log('\n========================================')
  console.log('PERFORMANCE SUMMARY')
  console.log('========================================')

  let totalTests = 0
  let passedTests = 0

  for (const category of Object.values(allResults.tests)) {
    for (const test of category) {
      totalTests++
      if (test.success) passedTests++
    }
  }

  console.log(`Tests Run: ${totalTests}`)
  console.log(`Passed: ${passedTests}`)
  console.log(`Failed: ${totalTests - passedTests}`)
  console.log(`Pass Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`)

  // Warnings
  console.log('\nThresholds:')
  console.log(`  - DB Query: <${THRESHOLDS.dbQuery}ms`)
  console.log(`  - DB Insert: <${THRESHOLDS.dbInsert}ms`)
  console.log(`  - Excel Read: <${THRESHOLDS.excelRead}ms`)
  console.log(`  - Memory: <${THRESHOLDS.memoryMB}MB`)

  // Save report
  const reportsDir = path.join(process.cwd(), 'reports')
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true })
  }

  fs.writeFileSync(
    path.join(reportsDir, 'performance-report.json'),
    JSON.stringify(allResults, null, 2)
  )
  console.log('\nReport saved to: reports/performance-report.json')

  console.log('========================================\n')
}

runPerformanceTests()
