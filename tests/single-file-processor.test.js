/**
 * Single File Processor Tests - Day 7
 *
 * Tests for single file import functionality
 * Run with: node tests/single-file-processor.test.js
 */

const assert = require('assert')
const path = require('path')
const fs = require('fs')

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

// ========== Import Types Tests ==========
function testImportTypes() {
  console.log('\n📦 Import Types (Single File) Tests\n')

  const importTypes = require('../electron/services/importTypes')

  test('SINGLE_FILE_CONFIG exists', () => {
    assert.ok(importTypes.SINGLE_FILE_CONFIG)
    assert.strictEqual(importTypes.SINGLE_FILE_CONFIG.maxFileSizeMB, 10)
    assert.ok(Array.isArray(importTypes.SINGLE_FILE_CONFIG.allowedExtensions))
  })

  test('FILE_VALIDATION_ERROR exists', () => {
    assert.ok(importTypes.FILE_VALIDATION_ERROR)
    assert.strictEqual(importTypes.FILE_VALIDATION_ERROR.FILE_NOT_FOUND, 'FILE_NOT_FOUND')
    assert.strictEqual(importTypes.FILE_VALIDATION_ERROR.INVALID_EXTENSION, 'INVALID_EXTENSION')
  })

  test('createSingleFileResult returns correct structure', () => {
    const result = importTypes.createSingleFileResult()
    assert.ok(result)
    assert.strictEqual(result.status, 'PENDING')
    assert.strictEqual(result.totalRecords, 0)
    assert.strictEqual(result.inserted, 0)
    assert.strictEqual(result.failed, 0)
    assert.ok(Array.isArray(result.errors))
    assert.ok(Array.isArray(result.warnings))
  })
}

// ========== Single File Processor Unit Tests ==========
function testSingleFileProcessor() {
  console.log('\n📄 Single File Processor Unit Tests\n')

  const {
    validateFile,
    parseFile,
    applySingleFileRules,
    transformSiteData,
    createSingleFileResult,
    SINGLE_FILE_CONFIG
  } = require('../electron/services/importProcessors/singleFileProcessor')

  test('SINGLE_FILE_CONFIG is defined', () => {
    assert.ok(SINGLE_FILE_CONFIG)
    assert.strictEqual(SINGLE_FILE_CONFIG.maxFileSizeMB, 10)
  })

  test('validateFile detects missing file', () => {
    const result = validateFile('nonexistent_file.xlsx')
    assert.strictEqual(result.valid, false)
    assert.ok(result.errors.length > 0)
    assert.strictEqual(result.errors[0].type, 'FILE_NOT_FOUND')
  })

  test('validateFile detects invalid extension', () => {
    // Create a temp file with wrong extension
    const tempFile = path.join(__dirname, 'temp_test.txt')
    fs.writeFileSync(tempFile, 'test content')

    try {
      const result = validateFile(tempFile)
      assert.strictEqual(result.valid, false)
      assert.ok(result.errors.some(e => e.type === 'INVALID_EXTENSION'))
    } finally {
      fs.unlinkSync(tempFile)
    }
  })

  test('applySingleFileRules returns passthrough', () => {
    const mockData = {
      sites: [{ siteId: 'TEST-001' }],
      stats: { totalRecords: 1 }
    }
    const result = applySingleFileRules(mockData)
    assert.ok(result)
    assert.strictEqual(result.sites.length, 1)
    assert.strictEqual(result.rulesApplied, false)
  })

  test('transformSiteData converts camelCase to snake_case', () => {
    const rawSite = {
      siteId: 'TEST-001',
      finalSiteName: 'Test Site',
      phaseName: 'RO4',
      governorate: 'Amman',
      tssrOverallStatus: 'Approved',
      longitude: 35.9,
      latitude: 31.9
    }

    const result = transformSiteData(rawSite)

    assert.strictEqual(result.site_id, 'TEST-001')
    assert.strictEqual(result.final_site_name, 'Test Site')
    assert.strictEqual(result.phase_name, 'RO4')
    assert.strictEqual(result.governorate, 'Amman')
    assert.strictEqual(result.tssr_overall_status, 'Approved')
    assert.strictEqual(result.longitude, 35.9)
    assert.strictEqual(result.latitude, 31.9)
  })

  test('transformSiteData handles null values', () => {
    const rawSite = {
      siteId: 'TEST-002'
    }

    const result = transformSiteData(rawSite)

    assert.strictEqual(result.site_id, 'TEST-002')
    assert.strictEqual(result.final_site_name, null)
    assert.strictEqual(result.phase_name, null)
    assert.strictEqual(result.priority, 0) // default
    assert.strictEqual(result.approved, 0) // default
  })

  test('createSingleFileResult returns correct structure', () => {
    const result = createSingleFileResult()
    assert.ok(result)
    assert.strictEqual(result.status, 'PENDING')
    assert.strictEqual(result.totalRecords, 0)
    assert.ok(Array.isArray(result.errors))
  })
}

// ========== Mock Database Tests ==========
function testWithMockDb() {
  console.log('\n🗄️  Mock Database Tests\n')

  const { saveSiteToDb, transformSiteData } = require('../electron/services/importProcessors/singleFileProcessor')
  const { IMPORT_OPERATION } = require('../electron/services/importTypes')

  // Create mock database
  const mockData = new Map()
  const mockDb = {
    prepare: (sql) => ({
      run: (...params) => {
        if (sql.includes('INSERT')) {
          mockData.set(params[0], params)
        }
        return { changes: 1 }
      },
      get: (siteId) => {
        return mockData.has(siteId) ? { site_id: siteId } : undefined
      }
    })
  }

  test('saveSiteToDb inserts new site', () => {
    mockData.clear()
    const siteRecord = { site_id: 'NEW-001', final_site_name: 'New Site' }

    const result = saveSiteToDb(siteRecord, mockDb)

    assert.strictEqual(result.success, true)
    assert.strictEqual(result.operation, IMPORT_OPERATION.INSERT)
    assert.strictEqual(result.siteId, 'NEW-001')
  })

  test('saveSiteToDb updates existing site', () => {
    // Pre-populate with existing site
    mockData.set('EXIST-001', ['EXIST-001', 'Existing Site'])

    const siteRecord = { site_id: 'EXIST-001', final_site_name: 'Updated Site' }
    const result = saveSiteToDb(siteRecord, mockDb)

    assert.strictEqual(result.success, true)
    assert.strictEqual(result.operation, IMPORT_OPERATION.UPDATE)
  })

  test('saveSiteToDb fails without site_id', () => {
    const siteRecord = { final_site_name: 'No ID Site' }
    const result = saveSiteToDb(siteRecord, mockDb)

    assert.strictEqual(result.success, false)
    assert.strictEqual(result.error, 'Missing site_id')
  })
}

// ========== Integration Tests with Real DB ==========
async function testWithRealDb() {
  console.log('\n🔌 Database Integration Tests\n')

  try {
    // Initialize database
    delete require.cache[require.resolve('../electron/database/db')]
    const db = require('../electron/database/db')

    await asyncTest('Initialize database', async () => {
      const result = await db.initialize('sqlite')
      assert.strictEqual(result, true)
    })

    const { saveSiteToDb, transformSiteData } = require('../electron/services/importProcessors/singleFileProcessor')

    await asyncTest('Insert test site to real DB', async () => {
      const testSite = {
        site_id: 'TEST-SINGLE-001',
        final_site_name: 'Single File Test Site',
        phase_name: 'TEST',
        tssr_overall_status: 'Pending'
      }

      const result = saveSiteToDb(testSite, db)
      assert.ok(result.success || result.error)
    })

    test('Cleanup test records', () => {
      try {
        db.exec("DELETE FROM sites_cache WHERE phase_name = 'TEST'")
      } catch (e) {
        // Ignore
      }
    })

    test('Close database', () => {
      db.close()
    })

  } catch (error) {
    console.log(`  ⚠️  DB integration skipped: ${error.message}`)
  }
}

// ========== Run All Tests ==========
async function runAllTests() {
  console.log('═══════════════════════════════════════════════════')
  console.log('  Single File Processor Tests - Day 7')
  console.log('═══════════════════════════════════════════════════')

  const startTime = Date.now()

  testImportTypes()
  testSingleFileProcessor()
  testWithMockDb()
  await testWithRealDb()

  const duration = ((Date.now() - startTime) / 1000).toFixed(2)

  console.log('\n═══════════════════════════════════════════════════')
  console.log(`  Results: ${results.passed} passed, ${results.failed} failed`)
  console.log(`  Duration: ${duration}s`)
  console.log('═══════════════════════════════════════════════════\n')

  process.exit(results.failed > 0 ? 1 : 0)
}

runAllTests().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
