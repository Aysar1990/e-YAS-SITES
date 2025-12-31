/**
 * Integration Tests - Day 14/15
 *
 * End-to-end integration tests for:
 * - Full import workflow
 * - Edit workflow with calculations
 * - Database adapter switching
 * - Report generation flow
 * - Error recovery
 *
 * Run with: node tests/integration.test.js
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

// ========== Module Integration Tests ==========
function testModuleIntegration() {
  console.log('\n🔗 Module Integration Tests\n')

  test('All calculation modules can be imported together', () => {
    const calculations = require('../electron/services/calculations')

    assert.ok(calculations.calculateActionAge, 'calculateActionAge should exist')
    assert.ok(calculations.calculateOverallStatus, 'calculateOverallStatus should exist')
    assert.ok(calculations.validateSite, 'validateSite should exist')
    assert.ok(calculations.validateStatusChange, 'validateStatusChange should exist')
    assert.ok(calculations.autoProgressWorkflow, 'autoProgressWorkflow should exist')
  })

  test('Calculations and validation work together', () => {
    const { validateSite, recalculateAll } = require('../electron/services/calculations')

    const site = {
      site_id: 'INT001',
      final_site_name: 'Integration Test Site',
      phase_name: 'RO4',
      governorate: 'Amman',
      ti_status: 'Approved',
      rf_plan_status: 'Approved',
      rf_opt_status: 'Pending'
    }

    // Validate first
    const validation = validateSite(site)
    assert.strictEqual(validation.valid, true, 'Site should be valid')

    // Then calculate
    const calculated = recalculateAll(site)
    assert.ok(calculated.tssr_overall_status, 'Should have calculated status')
    assert.ok(calculated.workflow_progress >= 0, 'Should have workflow progress')
  })

  test('RealtimeSync and calculations integrate', () => {
    const { RealtimeSync } = require('../electron/services/realtimeSync')
    const { recalculateAll } = require('../electron/services/calculations')

    const sync = new RealtimeSync()

    // Simulate receiving an update and calculating
    const site = {
      site_id: 'SYNC001',
      final_site_name: 'Sync Test',
      phase_name: 'RO4',
      tssr_status_date: new Date().toISOString()
    }

    const calculated = recalculateAll(site)

    // Would broadcast this calculated site
    assert.ok(calculated.action_age >= 0, 'Should have action age')
    assert.ok(calculated.tssr_overall_status, 'Should have status')
  })
}

// ========== Edit Workflow Integration Tests ==========
function testEditWorkflow() {
  console.log('\n✏️ Edit Workflow Integration Tests\n')

  const {
    validateSite,
    validateStatusChange,
    recalculateAll,
    autoProgressWorkflow
  } = require('../electron/services/calculations')

  test('Complete edit workflow: validate → calculate → progress', () => {
    // Initial site state
    const site = {
      site_id: 'EDIT001',
      final_site_name: 'Edit Test Site',
      phase_name: 'RO4',
      ti_status: 'Approved'
    }

    // Step 1: Validate site
    const validation = validateSite(site)
    assert.strictEqual(validation.valid, true, 'Initial validation should pass')

    // Step 2: Validate the proposed change
    const statusChange = validateStatusChange(site, 'rf_plan', 'Approved')
    assert.strictEqual(statusChange.allowed, true, 'RF Plan approval should be allowed')

    // Step 3: Apply change and recalculate
    site.rf_plan_status = 'Approved'
    const calculated = recalculateAll(site)

    // Step 4: Auto-progress workflow
    const progressed = autoProgressWorkflow(calculated)

    // RF Opt should now be Pending
    assert.strictEqual(progressed.rf_opt_status, 'Pending', 'RF Opt should be set to Pending')
  })

  test('Edit workflow blocks invalid sequence', () => {
    const site = {
      site_id: 'BLOCK001',
      final_site_name: 'Block Test',
      phase_name: 'RO4',
      ti_status: 'Pending'
    }

    // Try to approve civil without all previous departments approved
    const statusChange = validateStatusChange(site, 'civil', 'Approved')

    assert.strictEqual(statusChange.allowed, false, 'Should not allow out-of-sequence approval')
    assert.ok(statusChange.reason.includes('must be approved first'), 'Reason should explain the block')
  })

  test('Rejection workflow allows bypass', () => {
    const site = {
      site_id: 'REJECT001',
      final_site_name: 'Reject Test',
      phase_name: 'RO4',
      ti_status: 'Pending'
    }

    // Rejection should always be allowed
    const rejection = validateStatusChange(site, 'civil', 'Rejected')
    assert.strictEqual(rejection.allowed, true, 'Rejection should always be allowed')

    // N/A should always be allowed
    const na = validateStatusChange(site, 'mw', 'N/A')
    assert.strictEqual(na.allowed, true, 'N/A should always be allowed')
  })
}

// ========== Database Adapter Integration Tests ==========
async function testDatabaseAdapterIntegration() {
  console.log('\n💾 Database Adapter Integration Tests\n')

  await asyncTest('SQLite adapter can be instantiated', async () => {
    const SQLiteAdapter = require('../electron/database/adapters/sqliteAdapter')
    const adapter = new SQLiteAdapter()

    assert.ok(adapter, 'Adapter should be created')
    assert.strictEqual(typeof adapter.initialize, 'function', 'Should have initialize method')
    assert.strictEqual(typeof adapter.prepare, 'function', 'Should have prepare method')
    assert.strictEqual(typeof adapter.exec, 'function', 'Should have exec method')
  })

  await asyncTest('Database modules export correctly', async () => {
    const db = require('../electron/database/db')

    assert.ok(db, 'db module should exist')
    assert.strictEqual(typeof db.getAdapter, 'function', 'Should have getAdapter')
    assert.strictEqual(typeof db.getAdapterType, 'function', 'Should have getAdapterType')
  })

  test('Adapter types are defined correctly', () => {
    const db = require('../electron/database/db')

    // Get current adapter type - may be null/undefined if not initialized yet
    const type = db.getAdapterType()
    assert.ok(type === null || type === undefined || ['sqlite', 'supabase'].includes(type), 'Type should be sqlite, supabase, null, or undefined')
  })
}

// ========== Report Generation Integration Tests ==========
async function testReportIntegration() {
  console.log('\n📊 Report Generation Integration Tests\n')

  const { generateFullReport, calculateSummary } = require('../electron/services/reportGenerator')
  const { recalculateAll } = require('../electron/services/calculations')

  await asyncTest('Report with calculated fields', async () => {
    // Create sites with calculations applied
    const sites = [
      { site_id: 'RPT001', final_site_name: 'Report Site 1', phase_name: 'RO4',
        tssr_status_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        ti_status: 'Approved', rf_plan_status: 'Approved' },
      { site_id: 'RPT002', final_site_name: 'Report Site 2', phase_name: 'RO4',
        tssr_status_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        ti_status: 'Rejected' }
    ]

    // Apply calculations to all sites
    const calculatedSites = sites.map(site => recalculateAll(site))

    // Verify calculations were applied
    assert.strictEqual(calculatedSites[0].action_age, 5, 'Should have 5 day action age')
    assert.strictEqual(calculatedSites[1].action_age, 10, 'Should have 10 day action age')

    // Generate report with calculated data
    const outputPath = path.join(os.tmpdir(), 'integration_report.xlsx')
    const result = await generateFullReport(calculatedSites, outputPath)

    assert.strictEqual(result.success, true, 'Report should generate successfully')
    assert.strictEqual(result.totalRows, 2, 'Should have 2 rows')

    // Cleanup
    fs.unlinkSync(result.path)
  })

  await asyncTest('Summary statistics match calculated data', async () => {
    const sites = [
      { site_id: 'SUM001', tssr_overall_status: 'Approved', phase_name: 'RO4' },
      { site_id: 'SUM002', tssr_overall_status: 'Approved', phase_name: 'RO4' },
      { site_id: 'SUM003', tssr_overall_status: 'Under Review', phase_name: 'RO3' },
      { site_id: 'SUM004', tssr_overall_status: 'Rejected', phase_name: 'RO3' }
    ]

    const summary = calculateSummary(sites)

    assert.strictEqual(summary.total, 4, 'Total should be 4')
    assert.strictEqual(summary.approved, 2, 'Approved should be 2')
    assert.strictEqual(summary.rejected, 1, 'Rejected should be 1')
    assert.strictEqual(summary.phaseStats['RO4'].total, 2, 'RO4 should have 2')
    assert.strictEqual(summary.phaseStats['RO3'].total, 2, 'RO3 should have 2')
  })
}

// ========== Import Flow Integration Tests ==========
function testImportFlowIntegration() {
  console.log('\n📥 Import Flow Integration Tests\n')

  test('Batch processor module loads correctly', () => {
    const processor = require('../electron/services/batchProcessor')

    assert.ok(processor, 'Batch processor should exist')
    assert.ok(processor.BatchProcessor, 'Should have BatchProcessor class')
    assert.strictEqual(typeof processor.processMultipleFiles, 'function', 'Should have processMultipleFiles')
    assert.strictEqual(typeof processor.quickImport, 'function', 'Should have quickImport')
  })

  test('Single file processor module loads correctly', () => {
    const processor = require('../electron/services/importProcessors/singleFileProcessor')

    assert.ok(processor, 'Single file processor should exist')
    assert.strictEqual(typeof processor.processSingleFile, 'function', 'Should have processSingleFile')
    assert.strictEqual(typeof processor.validateFile, 'function', 'Should have validateFile')
  })

  test('Import handlers integrate with database', () => {
    // Check that all required modules can be loaded together
    const db = require('../electron/database/db')
    const batchProcessor = require('../electron/services/batchProcessor')
    const calculations = require('../electron/services/calculations')

    assert.ok(db, 'DB module loaded')
    assert.ok(batchProcessor, 'Batch processor loaded')
    assert.ok(calculations, 'Calculations loaded')
  })
}

// ========== WebSocket Integration Tests ==========
function testWebSocketIntegration() {
  console.log('\n🌐 WebSocket Integration Tests\n')

  test('WebSocket events are defined', () => {
    const WS_EVENTS = require('../electron/server/utils/wsEvents')

    assert.ok(WS_EVENTS, 'WS_EVENTS should exist')
    assert.ok(WS_EVENTS.SITE_UPDATED, 'SITE_UPDATED event should exist')
  })

  test('RealtimeSync uses WS_EVENTS', () => {
    const { SYNC_EVENTS } = require('../electron/services/realtimeSync')

    assert.ok(SYNC_EVENTS.SITE_ADDED, 'SITE_ADDED should be defined')
    assert.ok(SYNC_EVENTS.SITE_UPDATED, 'SITE_UPDATED should be defined')
    assert.ok(SYNC_EVENTS.SITE_DELETED, 'SITE_DELETED should be defined')
  })
}

// ========== Error Recovery Tests ==========
function testErrorRecovery() {
  console.log('\n🔧 Error Recovery Tests\n')

  test('Validation returns detailed errors', () => {
    const { validateSite } = require('../electron/services/calculations')

    const invalidSite = {}
    const result = validateSite(invalidSite)

    assert.strictEqual(result.valid, false, 'Should be invalid')
    assert.ok(result.errors.length > 0, 'Should have error messages')
    assert.ok(result.errors.every(e => e.field && e.message), 'Errors should have field and message')
  })

  test('Calculation handles malformed data gracefully', () => {
    const { calculateActionAge, calculateOverallStatus, calculateTotals } = require('../electron/services/calculations')

    // Should not throw on null/undefined
    assert.strictEqual(calculateActionAge(null), 0, 'Should return 0 for null')
    assert.ok(calculateOverallStatus(undefined), 'Should return default for undefined')
    assert.ok(calculateTotals(null).totalSites === 0, 'Should return 0 for null array')
  })

  test('Workflow validation provides clear reasons', () => {
    const { validateStatusChange } = require('../electron/services/calculations')

    const site = { ti_status: 'Pending' }
    const result = validateStatusChange(site, 'nokia_npo', 'Approved')

    assert.strictEqual(result.allowed, false, 'Should not be allowed')
    assert.ok(result.reason.length > 0, 'Should have a reason')
  })
}

// ========== Performance Baseline Tests ==========
function testPerformanceBaselines() {
  console.log('\n⚡ Performance Baseline Tests\n')

  test('Calculation performance is acceptable', () => {
    const { recalculateAll } = require('../electron/services/calculations')

    // Create 100 sites
    const sites = Array.from({ length: 100 }, (_, i) => ({
      site_id: `PERF${i.toString().padStart(3, '0')}`,
      final_site_name: `Performance Site ${i}`,
      phase_name: 'RO4',
      tssr_status_date: new Date().toISOString()
    }))

    const start = Date.now()
    sites.forEach(site => recalculateAll(site))
    const elapsed = Date.now() - start

    assert.ok(elapsed < 1000, `100 calculations should complete in <1s (took ${elapsed}ms)`)
  })

  test('Validation performance is acceptable', () => {
    const { validateSite } = require('../electron/services/calculations')

    const sites = Array.from({ length: 100 }, (_, i) => ({
      site_id: `VAL${i.toString().padStart(3, '0')}`,
      final_site_name: `Validation Site ${i}`,
      phase_name: 'RO4'
    }))

    const start = Date.now()
    sites.forEach(site => validateSite(site))
    const elapsed = Date.now() - start

    assert.ok(elapsed < 500, `100 validations should complete in <500ms (took ${elapsed}ms)`)
  })

  test('Summary calculation scales well', () => {
    const { calculateTotals } = require('../electron/services/calculations')

    // Create 1000 sites
    const sites = Array.from({ length: 1000 }, (_, i) => ({
      site_id: `SCALE${i.toString().padStart(4, '0')}`,
      phase_name: ['RO4', 'RO3', 'RO2'][i % 3],
      governorate: ['Amman', 'Irbid', 'Zarqa'][i % 3],
      tssr_overall_status: ['Approved', 'Pending', 'Rejected'][i % 3]
    }))

    const start = Date.now()
    const totals = calculateTotals(sites)
    const elapsed = Date.now() - start

    assert.ok(elapsed < 200, `1000 site totals should complete in <200ms (took ${elapsed}ms)`)
    assert.strictEqual(totals.totalSites, 1000, 'Should count all sites')
  })
}

// ========== Run All Tests ==========
async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════')
  console.log('  Integration Tests - Day 14/15')
  console.log('═══════════════════════════════════════════════════════')

  try {
    testModuleIntegration()
    testEditWorkflow()
    await testDatabaseAdapterIntegration()
    await testReportIntegration()
    testImportFlowIntegration()
    testWebSocketIntegration()
    testErrorRecovery()
    testPerformanceBaselines()
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
