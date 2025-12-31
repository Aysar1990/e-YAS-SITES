/**
 * Report Generation Tests - Day 14/15
 *
 * Tests for Excel report generation:
 * - generateFullReport: 8 sheets
 * - generatePhaseReport: Filtered by phase
 * - generateCustomReport: Filters and column selection
 * - Formatting and styling
 *
 * Run with: node tests/report-generation.test.js
 */

const assert = require('assert')
const path = require('path')
const fs = require('fs')
const os = require('os')

// Test results tracker
const results = { passed: 0, failed: 0, tests: [] }

function test(name, fn) {
  try {
    fn()
    results.passed++
    results.tests.push({ name, status: 'PASS' })
    console.log(`  ✅ ${name}`)
  } catch (error) {
    results.failed++
    results.tests.push({ name, status: 'FAIL', error: error.message })
    console.log(`  ❌ ${name}: ${error.message}`)
  }
}

async function asyncTest(name, fn) {
  try {
    await fn()
    results.passed++
    results.tests.push({ name, status: 'PASS' })
    console.log(`  ✅ ${name}`)
  } catch (error) {
    results.failed++
    results.tests.push({ name, status: 'FAIL', error: error.message })
    console.log(`  ❌ ${name}: ${error.message}`)
  }
}

// Test data
const testSites = [
  { site_id: 'TEST001', final_site_name: 'Site Alpha', phase_name: 'RO4', governorate: 'Amman', tssr_overall_status: 'Approved', tssr_subcon: 'Contractor A' },
  { site_id: 'TEST002', final_site_name: 'Site Beta', phase_name: 'RO4', governorate: 'Irbid', tssr_overall_status: 'Under Review', tssr_subcon: 'Contractor B' },
  { site_id: 'TEST003', final_site_name: 'Site Gamma', phase_name: 'RO3', governorate: 'Zarqa', tssr_overall_status: 'Rejected', tssr_subcon: 'Contractor A' },
  { site_id: 'TEST004', final_site_name: 'Site Delta', phase_name: 'RO4', governorate: 'Amman', tssr_overall_status: 'Pending', weekly_plan: 'Week 1' },
  { site_id: 'TEST005', final_site_name: 'Site Epsilon', phase_name: 'RO3', governorate: 'Irbid', tssr_overall_status: 'Approved', nokia_npo_status: 'Approved' }
]

// ========== Module Tests ==========
function testModule() {
  console.log('\n📦 Module Tests\n')

  const reportGenerator = require('../electron/services/reportGenerator')

  test('reportGenerator module exists', () => {
    assert.ok(reportGenerator, 'Module should exist')
  })

  test('generateFullReport function exists', () => {
    assert.strictEqual(typeof reportGenerator.generateFullReport, 'function', 'generateFullReport should be a function')
  })

  test('generatePhaseReport function exists', () => {
    assert.strictEqual(typeof reportGenerator.generatePhaseReport, 'function', 'generatePhaseReport should be a function')
  })

  test('generateCustomReport function exists', () => {
    assert.strictEqual(typeof reportGenerator.generateCustomReport, 'function', 'generateCustomReport should be a function')
  })

  test('COLUMN_HEADERS is exported', () => {
    assert.ok(Array.isArray(reportGenerator.COLUMN_HEADERS), 'COLUMN_HEADERS should be an array')
    assert.ok(reportGenerator.COLUMN_HEADERS.length > 0, 'COLUMN_HEADERS should not be empty')
  })

  test('COLORS is exported', () => {
    assert.ok(reportGenerator.COLORS, 'COLORS should be exported')
    assert.ok(reportGenerator.COLORS.headerBg, 'headerBg color should exist')
    assert.ok(reportGenerator.COLORS.approved, 'approved color should exist')
    assert.ok(reportGenerator.COLORS.rejected, 'rejected color should exist')
  })
}

// ========== Column Headers Tests ==========
function testColumnHeaders() {
  console.log('\n📋 Column Headers Tests\n')

  const { COLUMN_HEADERS, getColumnHeaders } = require('../electron/services/reportGenerator')

  test('COLUMN_HEADERS has expected columns', () => {
    const keys = COLUMN_HEADERS.map(c => c.key)
    assert.ok(keys.includes('site_id'), 'Should have site_id')
    assert.ok(keys.includes('final_site_name'), 'Should have final_site_name')
    assert.ok(keys.includes('phase_name'), 'Should have phase_name')
    assert.ok(keys.includes('governorate'), 'Should have governorate')
    assert.ok(keys.includes('tssr_overall_status'), 'Should have tssr_overall_status')
  })

  test('Each column has key, header, and width', () => {
    COLUMN_HEADERS.forEach((col, index) => {
      assert.ok(col.key, `Column ${index} should have key`)
      assert.ok(col.header, `Column ${index} should have header`)
      assert.ok(typeof col.width === 'number', `Column ${index} should have numeric width`)
    })
  })

  test('getColumnHeaders returns header strings', () => {
    const headers = getColumnHeaders()
    assert.ok(Array.isArray(headers), 'Should return array')
    assert.ok(headers.every(h => typeof h === 'string'), 'All headers should be strings')
    assert.strictEqual(headers.length, COLUMN_HEADERS.length, 'Should match COLUMN_HEADERS length')
  })
}

// ========== Calculate Summary Tests ==========
function testCalculateSummary() {
  console.log('\n📊 Calculate Summary Tests\n')

  const { calculateSummary } = require('../electron/services/reportGenerator')

  test('calculateSummary returns correct totals', () => {
    const summary = calculateSummary(testSites)

    assert.strictEqual(summary.total, 5, 'Total should be 5')
    assert.strictEqual(summary.approved, 2, 'Approved should be 2')
    assert.strictEqual(summary.rejected, 1, 'Rejected should be 1')
  })

  test('calculateSummary calculates approval rate', () => {
    const summary = calculateSummary(testSites)

    assert.ok(summary.approvalRate, 'Should have approval rate')
    assert.strictEqual(summary.approvalRate, '40.0', 'Approval rate should be 40%')
  })

  test('calculateSummary groups by phase', () => {
    const summary = calculateSummary(testSites)

    assert.ok(summary.phaseStats, 'Should have phaseStats')
    assert.strictEqual(summary.phaseStats['RO4'].total, 3, 'RO4 should have 3 sites')
    assert.strictEqual(summary.phaseStats['RO3'].total, 2, 'RO3 should have 2 sites')
  })

  test('calculateSummary groups by contractor', () => {
    const summary = calculateSummary(testSites)

    assert.ok(summary.contractorStats, 'Should have contractorStats')
    assert.strictEqual(summary.contractorStats['Contractor A'].total, 2, 'Contractor A should have 2')
  })

  test('calculateSummary handles empty array', () => {
    const summary = calculateSummary([])

    assert.strictEqual(summary.total, 0, 'Total should be 0')
    assert.strictEqual(summary.approvalRate, 0, 'Approval rate should be 0')
  })
}

// ========== Map Site To Row Tests ==========
function testMapSiteToRow() {
  console.log('\n🗺️ Map Site To Row Tests\n')

  const { mapSiteToRow, COLUMN_HEADERS } = require('../electron/services/reportGenerator')

  test('mapSiteToRow returns array with correct length', () => {
    const row = mapSiteToRow(testSites[0])

    assert.ok(Array.isArray(row), 'Should return array')
    assert.strictEqual(row.length, COLUMN_HEADERS.length, 'Should match column count')
  })

  test('mapSiteToRow handles missing fields', () => {
    const site = { site_id: 'MINIMAL' }
    const row = mapSiteToRow(site)

    assert.ok(Array.isArray(row), 'Should return array')
    assert.strictEqual(row[0], 'MINIMAL', 'First column should be site_id')
  })
}

// ========== Generate Full Report Tests ==========
async function testGenerateFullReport() {
  console.log('\n📄 Generate Full Report Tests\n')

  const { generateFullReport } = require('../electron/services/reportGenerator')
  const testOutputPath = path.join(os.tmpdir(), 'test_full_report.xlsx')

  await asyncTest('generateFullReport creates file successfully', async () => {
    const result = await generateFullReport(testSites, testOutputPath)

    assert.strictEqual(result.success, true, 'Should succeed')
    assert.ok(fs.existsSync(result.path), 'File should exist')

    // Cleanup
    fs.unlinkSync(result.path)
  })

  await asyncTest('generateFullReport creates 8 sheets', async () => {
    const result = await generateFullReport(testSites, testOutputPath)

    assert.strictEqual(result.sheetsCreated, 8, 'Should have 8 sheets')

    // Cleanup
    fs.unlinkSync(result.path)
  })

  await asyncTest('generateFullReport reports correct row count', async () => {
    const result = await generateFullReport(testSites, testOutputPath)

    assert.strictEqual(result.totalRows, testSites.length, 'Should match input count')

    // Cleanup
    fs.unlinkSync(result.path)
  })

  await asyncTest('generateFullReport handles empty sites array', async () => {
    const result = await generateFullReport([], testOutputPath)

    assert.strictEqual(result.success, true, 'Should succeed even with empty array')
    assert.strictEqual(result.totalRows, 0, 'Row count should be 0')

    // Cleanup
    fs.unlinkSync(result.path)
  })
}

// ========== Generate Phase Report Tests ==========
async function testGeneratePhaseReport() {
  console.log('\n📁 Generate Phase Report Tests\n')

  const { generatePhaseReport } = require('../electron/services/reportGenerator')
  const testOutputPath = path.join(os.tmpdir(), 'test_phase_report.xlsx')

  await asyncTest('generatePhaseReport filters by phase correctly', async () => {
    const result = await generatePhaseReport(testSites, 'RO4', testOutputPath)

    assert.strictEqual(result.success, true, 'Should succeed')
    assert.strictEqual(result.phase, 'RO4', 'Should report correct phase')
    assert.strictEqual(result.totalRows, 3, 'Should have 3 RO4 sites')

    // Cleanup
    fs.unlinkSync(result.path)
  })

  await asyncTest('generatePhaseReport ALL phase includes all sites', async () => {
    const result = await generatePhaseReport(testSites, 'ALL', testOutputPath)

    assert.strictEqual(result.totalRows, 5, 'ALL should include all sites')

    // Cleanup
    fs.unlinkSync(result.path)
  })
}

// ========== Generate Custom Report Tests ==========
async function testGenerateCustomReport() {
  console.log('\n⚙️ Generate Custom Report Tests\n')

  const { generateCustomReport } = require('../electron/services/reportGenerator')
  const testOutputPath = path.join(os.tmpdir(), 'test_custom_report.xlsx')

  await asyncTest('generateCustomReport applies governorate filter', async () => {
    const config = { filters: { governorate: ['Amman'] } }
    const result = await generateCustomReport(testSites, config, testOutputPath)

    assert.strictEqual(result.success, true, 'Should succeed')
    assert.strictEqual(result.totalRows, 2, 'Should have 2 Amman sites')

    // Cleanup
    fs.unlinkSync(result.path)
  })

  await asyncTest('generateCustomReport applies phase filter', async () => {
    const config = { filters: { phase: ['RO3'] } }
    const result = await generateCustomReport(testSites, config, testOutputPath)

    assert.strictEqual(result.totalRows, 2, 'Should have 2 RO3 sites')

    // Cleanup
    fs.unlinkSync(result.path)
  })

  await asyncTest('generateCustomReport applies status filter', async () => {
    const config = { filters: { status: ['Approved'] } }
    const result = await generateCustomReport(testSites, config, testOutputPath)

    assert.strictEqual(result.totalRows, 2, 'Should have 2 Approved sites')

    // Cleanup
    fs.unlinkSync(result.path)
  })

  await asyncTest('generateCustomReport groups by governorate', async () => {
    const config = { groupBy: 'governorate' }
    const result = await generateCustomReport(testSites, config, testOutputPath)

    assert.strictEqual(result.success, true, 'Should succeed')
    assert.strictEqual(result.sheetsCreated, 3, 'Should have 3 sheets (Amman, Irbid, Zarqa)')

    // Cleanup
    fs.unlinkSync(result.path)
  })

  await asyncTest('generateCustomReport uses selected columns only', async () => {
    const config = { columns: ['site_id', 'final_site_name', 'phase_name'] }
    const result = await generateCustomReport(testSites, config, testOutputPath)

    assert.strictEqual(result.success, true, 'Should succeed with limited columns')

    // Cleanup
    fs.unlinkSync(result.path)
  })
}

// ========== Error Handling Tests ==========
async function testErrorHandling() {
  console.log('\n⚠️ Error Handling Tests\n')

  const { generateFullReport } = require('../electron/services/reportGenerator')

  await asyncTest('Invalid output path returns error', async () => {
    // Use an invalid path
    const invalidPath = '/nonexistent/directory/that/does/not/exist/report.xlsx'
    const result = await generateFullReport(testSites, invalidPath)

    assert.strictEqual(result.success, false, 'Should fail with invalid path')
    assert.ok(result.error, 'Should have error message')
  })
}

// ========== Filename Generation Tests ==========
function testFilenameGeneration() {
  console.log('\n📛 Filename Generation Tests\n')

  const { generateFilename } = require('../electron/services/reportGenerator')

  test('generateFilename creates valid filename', () => {
    const filename = generateFilename()

    assert.ok(filename.includes('TSSR_Report'), 'Should include default prefix')
    assert.ok(filename.endsWith('.xlsx'), 'Should end with .xlsx')
  })

  test('generateFilename uses custom prefix', () => {
    const filename = generateFilename('Custom_Export')

    assert.ok(filename.includes('Custom_Export'), 'Should include custom prefix')
  })

  test('generateFilename includes timestamp', () => {
    const filename = generateFilename()
    // Should have numbers in the filename for timestamp
    assert.ok(/\d{8}/.test(filename), 'Should include date numbers')
  })
}

// ========== Run All Tests ==========
async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════')
  console.log('  Report Generation Tests - Day 14/15')
  console.log('═══════════════════════════════════════════════════════')

  try {
    testModule()
    testColumnHeaders()
    testCalculateSummary()
    testMapSiteToRow()
    await testGenerateFullReport()
    await testGeneratePhaseReport()
    await testGenerateCustomReport()
    await testErrorHandling()
    testFilenameGeneration()
  } catch (error) {
    console.error('\n❌ Test suite error:', error)
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════')
  console.log(`  Results: ${results.passed} passed, ${results.failed} failed`)
  console.log('═══════════════════════════════════════════════════════\n')

  if (results.failed > 0) {
    console.log('Failed tests:')
    results.tests
      .filter(t => t.status === 'FAIL')
      .forEach(t => console.log(`  - ${t.name}: ${t.error}`))
    process.exit(1)
  }
}

runAllTests()
