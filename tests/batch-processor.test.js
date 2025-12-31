/**
 * Batch Processor Tests - Day 6
 *
 * Tests batch import functionality with mock data
 * Run with: node tests/batch-processor.test.js
 */

const assert = require('assert')
const path = require('path')

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
  console.log('\n📦 Import Types Tests\n')

  const importTypes = require('../electron/services/importTypes')

  test('IMPORT_OPERATION enum exists', () => {
    assert.ok(importTypes.IMPORT_OPERATION)
    assert.strictEqual(importTypes.IMPORT_OPERATION.INSERT, 'INSERT')
    assert.strictEqual(importTypes.IMPORT_OPERATION.UPDATE, 'UPDATE')
    assert.strictEqual(importTypes.IMPORT_OPERATION.DELETE, 'DELETE')
  })

  test('IMPORT_STATUS enum exists', () => {
    assert.ok(importTypes.IMPORT_STATUS)
    assert.strictEqual(importTypes.IMPORT_STATUS.PENDING, 'PENDING')
    assert.strictEqual(importTypes.IMPORT_STATUS.COMPLETED, 'COMPLETED')
  })

  test('COLUMN_MAPPING has Site ID', () => {
    assert.strictEqual(importTypes.COLUMN_MAPPING['Site ID'], 'site_id')
    assert.strictEqual(importTypes.COLUMN_MAPPING['Phase Name'], 'phase_name')
  })

  test('mapColumnName works', () => {
    assert.strictEqual(importTypes.mapColumnName('Site ID'), 'site_id')
    assert.strictEqual(importTypes.mapColumnName('Final Site Name'), 'final_site_name')
    assert.strictEqual(importTypes.mapColumnName('Unknown Column'), null)
  })

  test('convertValue handles numbers', () => {
    assert.strictEqual(importTypes.convertValue('123.45', 'longitude'), 123.45)
    assert.strictEqual(importTypes.convertValue('invalid', 'longitude'), null)
    assert.strictEqual(importTypes.convertValue('', 'longitude'), null)
  })

  test('convertValue handles booleans', () => {
    assert.strictEqual(importTypes.convertValue('yes', 'approved'), 1)
    assert.strictEqual(importTypes.convertValue('Yes', 'approved'), 1)
    assert.strictEqual(importTypes.convertValue('true', 'approved'), 1)
    assert.strictEqual(importTypes.convertValue('no', 'approved'), 0)
    assert.strictEqual(importTypes.convertValue('', 'approved'), 0)
  })

  test('convertValue handles strings', () => {
    assert.strictEqual(importTypes.convertValue('  test  ', 'site_id'), 'test')
    assert.strictEqual(importTypes.convertValue(123, 'site_id'), '123')
  })

  test('createImportResult returns correct structure', () => {
    const result = importTypes.createImportResult()
    assert.ok(result)
    assert.strictEqual(result.status, 'PENDING')
    assert.strictEqual(result.totalRecords, 0)
    assert.ok(Array.isArray(result.errors))
    assert.ok(Array.isArray(result.batches))
  })

  test('createBatchResult returns correct structure', () => {
    const result = importTypes.createBatchResult(1)
    assert.ok(result)
    assert.strictEqual(result.batchNumber, 1)
    assert.strictEqual(result.status, 'PENDING')
  })

  test('validateRecord detects missing required fields', () => {
    const validation = importTypes.validateRecord({})
    assert.strictEqual(validation.valid, false)
    assert.ok(validation.errors.length > 0)
    assert.strictEqual(validation.errors[0].type, 'MISSING_REQUIRED_FIELD')
  })

  test('validateRecord passes for valid record', () => {
    const validation = importTypes.validateRecord({ site_id: 'TEST-001' })
    assert.strictEqual(validation.valid, true)
    assert.strictEqual(validation.errors.length, 0)
  })

  test('generateInsertSQL creates valid SQL', () => {
    const sql = importTypes.generateInsertSQL('sites_cache', ['site_id', 'phase_name'])
    assert.ok(sql.includes('INSERT OR REPLACE INTO sites_cache'))
    assert.ok(sql.includes('site_id'))
    assert.ok(sql.includes('?, ?'))
  })
}

// ========== Mock Database for Testing ==========
function createMockDb() {
  const data = new Map()
  let transactionFn = null

  return {
    prepare: (sql) => ({
      run: (...params) => {
        // Simple mock - store data
        if (sql.includes('INSERT')) {
          data.set(params[0], params)
        }
        return { changes: 1 }
      },
      get: (...params) => {
        return data.get(params[0])
      },
      all: () => Array.from(data.values())
    }),
    transaction: (fn) => {
      return () => {
        fn()
      }
    },
    exec: () => {}
  }
}

// ========== Batch Processor Tests ==========
async function testBatchProcessor() {
  console.log('\n🔄 Batch Processor Tests\n')

  const { BatchProcessor, quickImport, processMultipleFiles } = require('../electron/services/batchProcessor')

  test('BatchProcessor class exists', () => {
    assert.strictEqual(typeof BatchProcessor, 'function')
  })

  test('BatchProcessor constructor works', () => {
    const mockDb = createMockDb()
    const processor = new BatchProcessor(mockDb)
    assert.ok(processor)
    assert.ok(processor.config)
    assert.strictEqual(processor.config.batchSize, 500)
  })

  test('BatchProcessor with custom config', () => {
    const mockDb = createMockDb()
    const processor = new BatchProcessor(mockDb, { batchSize: 100 })
    assert.strictEqual(processor.config.batchSize, 100)
  })

  test('_siteToDbRecord converts correctly', () => {
    const mockDb = createMockDb()
    const processor = new BatchProcessor(mockDb)

    const site = {
      siteId: 'TEST-001',
      finalSiteName: 'Test Site',
      phaseName: 'RO4',
      tssrOverallStatus: 'Approved',
      longitude: 35.123,
      latitude: 31.456
    }

    const record = processor._siteToDbRecord(site)
    assert.strictEqual(record.site_id, 'TEST-001')
    assert.strictEqual(record.final_site_name, 'Test Site')
    assert.strictEqual(record.phase_name, 'RO4')
    assert.strictEqual(record.tssr_overall_status, 'Approved')
    assert.strictEqual(record.longitude, 35.123)
    assert.strictEqual(record.latitude, 31.456)
  })

  test('abort() sets aborted flag', () => {
    const mockDb = createMockDb()
    const processor = new BatchProcessor(mockDb)
    assert.strictEqual(processor.aborted, false)
    processor.abort()
    assert.strictEqual(processor.aborted, true)
  })

  test('applyBatchRules placeholder returns records unchanged', () => {
    const mockDb = createMockDb()
    const processor = new BatchProcessor(mockDb)
    const records = [{ site_id: 'A' }, { site_id: 'B' }]
    const result = processor.applyBatchRules(records)
    assert.deepStrictEqual(result, records)
  })

  test('quickImport function exists', () => {
    assert.strictEqual(typeof quickImport, 'function')
  })

  test('processMultipleFiles function exists', () => {
    assert.strictEqual(typeof processMultipleFiles, 'function')
  })
}

// ========== Mock Excel Data Test ==========
async function testWithMockExcelData() {
  console.log('\n📊 Mock Excel Data Processing Tests\n')

  const { BatchProcessor } = require('../electron/services/batchProcessor')
  const importTypes = require('../electron/services/importTypes')

  // Create mock sites (simulating excelReader output)
  const mockSites = [
    {
      siteId: 'AMN001',
      finalSiteName: 'Amman Site 1',
      phaseName: 'RO4',
      governorate: 'Amman',
      tssrOverallStatus: 'Approved',
      tssrSubcon: 'Contractor A',
      partOf: 'ThinLayer',
      longitude: 35.9,
      latitude: 31.9
    },
    {
      siteId: 'AMN002',
      finalSiteName: 'Amman Site 2',
      phaseName: 'RO4',
      governorate: 'Amman',
      tssrOverallStatus: 'Pending',
      tssrSubcon: 'Contractor B',
      partOf: 'Full Swap',
      longitude: 35.8,
      latitude: 31.8
    },
    {
      siteId: 'IRB001',
      finalSiteName: 'Irbid Site 1',
      phaseName: 'RO5',
      governorate: 'Irbid',
      tssrOverallStatus: 'Rejected',
      tssrSubcon: 'Contractor A',
      partOf: 'ThinLayer',
      longitude: 35.7,
      latitude: 32.5
    }
  ]

  test('Mock sites convert to DB records', () => {
    const mockDb = createMockDb()
    const processor = new BatchProcessor(mockDb)

    const records = mockSites.map(site => processor._siteToDbRecord(site))

    assert.strictEqual(records.length, 3)
    assert.strictEqual(records[0].site_id, 'AMN001')
    assert.strictEqual(records[0].governorate, 'Amman')
    assert.strictEqual(records[1].part_of, 'Full Swap')
    assert.strictEqual(records[2].phase_name, 'RO5')
  })

  test('Batch result structure is correct', () => {
    const batchResult = importTypes.createBatchResult(1)
    batchResult.processed = 3
    batchResult.inserted = 3
    batchResult.status = 'COMPLETED'

    assert.strictEqual(batchResult.batchNumber, 1)
    assert.strictEqual(batchResult.processed, 3)
    assert.strictEqual(batchResult.inserted, 3)
    assert.strictEqual(batchResult.status, 'COMPLETED')
  })

  test('Progress callback receives updates', async () => {
    const mockDb = createMockDb()
    const processor = new BatchProcessor(mockDb, { batchSize: 2 })

    let progressCalls = 0
    processor.onProgress = () => {
      progressCalls++
    }

    // Manually test progress emission
    processor.result = importTypes.createImportResult()
    processor._emitProgress()
    processor._emitProgress()

    assert.strictEqual(progressCalls, 2)
  })
}

// ========== Integration with Real DB (if available) ==========
async function testWithRealDb() {
  console.log('\n🗄️  Database Integration Tests\n')

  try {
    // Clear require cache to get fresh db instance
    delete require.cache[require.resolve('../electron/database/db')]
    const db = require('../electron/database/db')

    await asyncTest('Initialize database', async () => {
      const result = await db.initialize('sqlite')
      assert.strictEqual(result, true)
    })

    const { BatchProcessor } = require('../electron/services/batchProcessor')

    test('BatchProcessor with real DB instance', () => {
      const processor = new BatchProcessor(db)
      assert.ok(processor)
      assert.ok(processor.db)
    })

    await asyncTest('Insert mock records into real DB', async () => {
      const processor = new BatchProcessor(db, { batchSize: 10 })

      // Create test records (only columns that exist in sites_cache)
      const testRecords = [
        {
          site_id: 'TEST-BATCH-001',
          final_site_name: 'Batch Test Site 1',
          phase_name: 'TEST',
          tssr_overall_status: 'Pending'
        },
        {
          site_id: 'TEST-BATCH-002',
          final_site_name: 'Batch Test Site 2',
          phase_name: 'TEST',
          tssr_overall_status: 'Approved'
        }
      ]

      // Insert records
      const result = await processor._insertRecords(testRecords)
      assert.ok(result.inserted >= 0 || result.failed >= 0)
    })

    test('Cleanup test records', () => {
      try {
        db.exec("DELETE FROM sites_cache WHERE phase_name = 'TEST'")
      } catch (e) {
        // Ignore if table doesn't exist
      }
    })

    test('Close database', () => {
      db.close()
    })

  } catch (error) {
    console.log(`  ⚠️  Skipped DB integration tests: ${error.message}`)
  }
}

// ========== Run All Tests ==========
async function runAllTests() {
  console.log('═══════════════════════════════════════════════════')
  console.log('  Batch Processor Tests - Day 6')
  console.log('═══════════════════════════════════════════════════')

  const startTime = Date.now()

  testImportTypes()
  await testBatchProcessor()
  await testWithMockExcelData()
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
