/**
 * Calculations Tests - Day 14/15
 *
 * Tests for calculation, validation, and workflow services:
 * - Action Age calculation
 * - Overall Status calculation
 * - Totals aggregation
 * - Site validation
 * - Workflow sequence enforcement
 *
 * Run with: node tests/calculations.test.js
 */

const assert = require('assert')

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

// ========== Action Age Tests ==========
function testActionAge() {
  console.log('\n📅 Action Age Tests\n')

  const { calculateActionAge } = require('../electron/services/calculations')

  test('calculateActionAge returns correct days', () => {
    const fiveDaysAgo = new Date()
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5)

    const site = { tssr_status_date: fiveDaysAgo.toISOString() }
    const age = calculateActionAge(site)

    assert.strictEqual(age, 5, 'Should return 5 days')
  })

  test('calculateActionAge handles null dates (returns 0)', () => {
    const site = { tssr_status_date: null }
    const age = calculateActionAge(site)

    assert.strictEqual(age, 0, 'Should return 0 for null date')
  })

  test('calculateActionAge handles undefined dates (returns 0)', () => {
    const site = {}
    const age = calculateActionAge(site)

    assert.strictEqual(age, 0, 'Should return 0 for undefined date')
  })

  test('calculateActionAge handles null site (returns 0)', () => {
    const age = calculateActionAge(null)
    assert.strictEqual(age, 0, 'Should return 0 for null site')
  })

  test('calculateActionAge handles invalid dates (returns 0)', () => {
    const site = { tssr_status_date: 'not-a-date' }
    const age = calculateActionAge(site)

    assert.strictEqual(age, 0, 'Should return 0 for invalid date')
  })

  test('calculateActionAge handles today (returns 0)', () => {
    const site = { tssr_status_date: new Date().toISOString() }
    const age = calculateActionAge(site)

    assert.strictEqual(age, 0, 'Should return 0 for today')
  })

  test('calculateActionAge handles camelCase field', () => {
    const fiveDaysAgo = new Date()
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5)

    const site = { tssrStatusDate: fiveDaysAgo.toISOString() }
    const age = calculateActionAge(site)

    assert.strictEqual(age, 5, 'Should handle camelCase field')
  })
}

// ========== Overall Status Tests ==========
function testOverallStatus() {
  console.log('\n📊 Overall Status Tests\n')

  const { calculateOverallStatus } = require('../electron/services/calculations')

  test('All approved departments returns "Approved"', () => {
    const site = {
      ti_status: 'Approved',
      rf_plan_status: 'Approved',
      rf_opt_status: 'Approved',
      civil_status: 'Approved',
      mw_status: 'Approved',
      nokia_npo_status: 'Approved'
    }

    const status = calculateOverallStatus(site)
    assert.strictEqual(status, 'Approved', 'Should return Approved')
  })

  test('Any rejected department returns appropriate status', () => {
    const site = {
      ti_status: 'Rejected',
      rf_plan_status: 'Pending',
      rf_opt_status: '',
      civil_status: '',
      mw_status: '',
      nokia_npo_status: ''
    }

    const status = calculateOverallStatus(site)
    assert.ok(status.includes('Subcon'), 'TI rejection should mention Subcon')
  })

  test('Nokia NPO rejected returns Nokia validation status', () => {
    const site = {
      ti_status: 'Approved',
      rf_plan_status: 'Approved',
      rf_opt_status: 'Approved',
      civil_status: 'Approved',
      mw_status: 'Approved',
      nokia_npo_status: 'Rejected'
    }

    const status = calculateOverallStatus(site)
    assert.ok(status.includes('Nokia'), 'Nokia rejection should mention Nokia')
  })

  test('Pending department returns review status', () => {
    const site = {
      ti_status: 'Approved',
      rf_plan_status: 'Pending',
      rf_opt_status: '',
      civil_status: '',
      mw_status: '',
      nokia_npo_status: ''
    }

    const status = calculateOverallStatus(site)
    assert.ok(status.includes('Review') || status.includes('Under'), 'Should indicate under review')
  })

  test('Null site returns default status', () => {
    const status = calculateOverallStatus(null)
    assert.strictEqual(status, 'Site not Surveyed', 'Should return default')
  })

  test('N/A departments are treated as approved', () => {
    const site = {
      ti_status: 'Approved',
      rf_plan_status: 'N/A',
      rf_opt_status: 'Approved',
      civil_status: 'N/A',
      mw_status: 'Approved',
      nokia_npo_status: 'Approved'
    }

    const status = calculateOverallStatus(site)
    assert.strictEqual(status, 'Approved', 'N/A should count as approved')
  })
}

// ========== Calculate Totals Tests ==========
function testCalculateTotals() {
  console.log('\n📈 Calculate Totals Tests\n')

  const { calculateTotals } = require('../electron/services/calculations')

  test('calculateTotals returns correct counts', () => {
    const sites = [
      { phase_name: 'RO4', governorate: 'Amman', tssr_overall_status: 'Approved' },
      { phase_name: 'RO4', governorate: 'Amman', tssr_overall_status: 'Approved' },
      { phase_name: 'RO3', governorate: 'Irbid', tssr_overall_status: 'Pending' }
    ]

    const totals = calculateTotals(sites)

    assert.strictEqual(totals.totalSites, 3, 'Total should be 3')
    assert.strictEqual(totals.byPhase['RO4'], 2, 'RO4 count should be 2')
    assert.strictEqual(totals.byPhase['RO3'], 1, 'RO3 count should be 1')
  })

  test('calculateTotals counts by governorate correctly', () => {
    const sites = [
      { governorate: 'Amman' },
      { governorate: 'Amman' },
      { governorate: 'Irbid' },
      { governorate: 'Zarqa' }
    ]

    const totals = calculateTotals(sites)

    assert.strictEqual(totals.byGovernorate['Amman'], 2, 'Amman count should be 2')
    assert.strictEqual(totals.byGovernorate['Irbid'], 1, 'Irbid count should be 1')
    assert.strictEqual(totals.byGovernorate['Zarqa'], 1, 'Zarqa count should be 1')
  })

  test('calculateTotals handles empty array', () => {
    const totals = calculateTotals([])

    assert.strictEqual(totals.totalSites, 0, 'Total should be 0')
    assert.deepStrictEqual(totals.byPhase, {}, 'byPhase should be empty')
  })

  test('calculateTotals handles null/undefined', () => {
    const totals = calculateTotals(null)

    assert.strictEqual(totals.totalSites, 0, 'Total should be 0')
  })
}

// ========== Validation Tests ==========
function testValidation() {
  console.log('\n✅ Validation Tests\n')

  const { validateSite, validateField, GOVERNORATES, PHASES } = require('../electron/services/calculations')

  test('validateSite requires site_id', () => {
    const site = { final_site_name: 'Test', phase_name: 'RO4' }
    const result = validateSite(site)

    assert.strictEqual(result.valid, false, 'Should be invalid')
    assert.ok(result.errors.some(e => e.field === 'site_id'), 'Should have site_id error')
  })

  test('validateSite requires final_site_name', () => {
    const site = { site_id: 'TEST001', phase_name: 'RO4' }
    const result = validateSite(site)

    assert.strictEqual(result.valid, false, 'Should be invalid')
    assert.ok(result.errors.some(e => e.field === 'final_site_name'), 'Should have final_site_name error')
  })

  test('validateSite requires phase_name', () => {
    const site = { site_id: 'TEST001', final_site_name: 'Test' }
    const result = validateSite(site)

    assert.strictEqual(result.valid, false, 'Should be invalid')
    assert.ok(result.errors.some(e => e.field === 'phase_name'), 'Should have phase_name error')
  })

  test('validateSite passes with valid data', () => {
    const site = {
      site_id: 'TEST001',
      final_site_name: 'Test Site',
      phase_name: 'RO4',
      governorate: 'Amman'
    }
    const result = validateSite(site)

    assert.strictEqual(result.valid, true, 'Should be valid')
    assert.strictEqual(result.errors.length, 0, 'Should have no errors')
  })

  test('validateField validates governorate enum', () => {
    const result = validateField('governorate', 'InvalidCity')
    // Should have warning, not error (for flexibility)
    assert.ok(result.warning || !result.valid, 'Should warn about invalid governorate')
  })

  test('validateField validates phase enum', () => {
    const result = validateField('phase_name', 'RO4')
    assert.strictEqual(result.valid, true, 'RO4 should be valid phase')
  })

  test('GOVERNORATES includes Jordan governorates', () => {
    assert.ok(GOVERNORATES.includes('Amman'), 'Should include Amman')
    assert.ok(GOVERNORATES.includes('Irbid'), 'Should include Irbid')
    assert.ok(GOVERNORATES.includes('Zarqa'), 'Should include Zarqa')
    assert.strictEqual(GOVERNORATES.length, 12, 'Jordan has 12 governorates')
  })

  test('PHASES includes expected phases', () => {
    assert.ok(PHASES.includes('RO4'), 'Should include RO4')
    assert.ok(PHASES.includes('RO3'), 'Should include RO3')
    assert.ok(PHASES.includes('ALL'), 'Should include ALL')
  })
}

// ========== Workflow Tests ==========
function testWorkflow() {
  console.log('\n🔄 Workflow Tests\n')

  const {
    validateStatusChange,
    autoProgressWorkflow,
    isWorkflowComplete,
    getWorkflowProgress,
    WORKFLOW_SEQUENCE
  } = require('../electron/services/calculations')

  test('validateStatusChange enforces workflow sequence', () => {
    // Cannot approve rf_plan if ti is not approved
    const site = { ti_status: 'Pending' }
    const result = validateStatusChange(site, 'rf_plan', 'Approved')

    assert.strictEqual(result.allowed, false, 'Should not allow approval')
    assert.ok(result.reason.includes('TI'), 'Reason should mention TI')
  })

  test('validateStatusChange allows rejection at any time', () => {
    const site = { ti_status: 'Pending' }
    const result = validateStatusChange(site, 'rf_plan', 'Rejected')

    assert.strictEqual(result.allowed, true, 'Should allow rejection')
  })

  test('validateStatusChange allows N/A at any time', () => {
    const site = { ti_status: 'Pending' }
    const result = validateStatusChange(site, 'rf_plan', 'N/A')

    assert.strictEqual(result.allowed, true, 'Should allow N/A')
  })

  test('validateStatusChange allows approval after previous approved', () => {
    const site = { ti_status: 'Approved' }
    const result = validateStatusChange(site, 'rf_plan', 'Approved')

    assert.strictEqual(result.allowed, true, 'Should allow approval after TI approved')
  })

  test('autoProgressWorkflow sets next department to Pending', () => {
    const site = {
      ti_status: 'Approved',
      rf_plan_status: ''
    }

    const updated = autoProgressWorkflow(site)
    assert.strictEqual(updated.rf_plan_status, 'Pending', 'RF Plan should be set to Pending')
  })

  test('isWorkflowComplete returns true when all approved', () => {
    const site = {
      ti_status: 'Approved',
      rf_plan_status: 'Approved',
      rf_opt_status: 'N/A',
      civil_status: 'Approved',
      mw_status: 'Released',
      nokia_npo_status: 'Approved'
    }

    const complete = isWorkflowComplete(site)
    assert.strictEqual(complete, true, 'Should be complete')
  })

  test('isWorkflowComplete returns false when any pending', () => {
    const site = {
      ti_status: 'Approved',
      rf_plan_status: 'Pending',
      rf_opt_status: '',
      civil_status: '',
      mw_status: '',
      nokia_npo_status: ''
    }

    const complete = isWorkflowComplete(site)
    assert.strictEqual(complete, false, 'Should not be complete')
  })

  test('getWorkflowProgress returns correct percentage', () => {
    const site = {
      ti_status: 'Approved',
      rf_plan_status: 'Approved',
      rf_opt_status: 'Approved',
      civil_status: '',
      mw_status: '',
      nokia_npo_status: ''
    }

    const progress = getWorkflowProgress(site)
    assert.strictEqual(progress.percentage, 50, 'Should be 50% (3/6)')
    assert.strictEqual(progress.completedDepartments.length, 3, 'Should have 3 completed')
  })

  test('WORKFLOW_SEQUENCE has 6 departments', () => {
    assert.strictEqual(WORKFLOW_SEQUENCE.length, 6, 'Should have 6 departments')
    assert.strictEqual(WORKFLOW_SEQUENCE[0].key, 'ti', 'First should be TI')
    assert.strictEqual(WORKFLOW_SEQUENCE[5].key, 'nokia_npo', 'Last should be Nokia NPO')
  })
}

// ========== Aging Stats Tests ==========
function testAgingStats() {
  console.log('\n📆 Aging Stats Tests\n')

  const { getAgingBracket, calculateAgingStats, updateAgingDays } = require('../electron/services/calculations')

  test('getAgingBracket returns correct bracket for 0-7 days', () => {
    assert.strictEqual(getAgingBracket(0), '0-7 Days', 'Day 0')
    assert.strictEqual(getAgingBracket(5), '0-7 Days', 'Day 5')
    assert.strictEqual(getAgingBracket(7), '0-7 Days', 'Day 7')
  })

  test('getAgingBracket returns correct bracket for 8-14 days', () => {
    assert.strictEqual(getAgingBracket(8), '8-14 Days', 'Day 8')
    assert.strictEqual(getAgingBracket(14), '8-14 Days', 'Day 14')
  })

  test('getAgingBracket returns correct bracket for 60+ days', () => {
    assert.strictEqual(getAgingBracket(61), '60+ Days', 'Day 61')
    assert.strictEqual(getAgingBracket(100), '60+ Days', 'Day 100')
  })

  test('calculateAgingStats counts brackets correctly', () => {
    const sites = [
      { action_age: 2 },  // 0-7
      { action_age: 5 },  // 0-7
      { action_age: 10 }, // 8-14
      { action_age: 45 }, // 31-60
      { action_age: 90 }  // 60+
    ]

    const stats = calculateAgingStats(sites)
    assert.strictEqual(stats['0-7 Days'], 2, '0-7 Days should be 2')
    assert.strictEqual(stats['8-14 Days'], 1, '8-14 Days should be 1')
    assert.strictEqual(stats['31-60 Days'], 1, '31-60 Days should be 1')
    assert.strictEqual(stats['60+ Days'], 1, '60+ Days should be 1')
  })

  test('updateAgingDays handles null site', () => {
    const days = updateAgingDays(null)
    assert.strictEqual(days, 0, 'Should return 0 for null')
  })
}

// ========== Run All Tests ==========
function runAllTests() {
  console.log('═══════════════════════════════════════════════════════')
  console.log('  Calculations Tests - Day 14/15')
  console.log('═══════════════════════════════════════════════════════')

  try {
    testActionAge()
    testOverallStatus()
    testCalculateTotals()
    testValidation()
    testWorkflow()
    testAgingStats()
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
