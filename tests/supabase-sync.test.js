/**
 * Supabase Sync Service Tests
 *
 * Tests for SupabaseSync service including:
 * - Connection testing
 * - Column mapping (transformRecord)
 * - Sync functionality (mocked)
 *
 * Run with: node tests/supabase-sync.test.js
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

// ========== Mock Database ==========
const mockDb = {
  prepare: (sql) => ({
    all: (param) => {
      if (sql.includes('sites_cache') && sql.includes('phase_name')) {
        return [
          { id: 1, site_id: 'SITE001', phase_name: 'RO4', longitude: 35.9, latitude: 31.9, site_sectors: '3', rf_opt_status: 'Approved' },
          { id: 2, site_id: 'SITE002', phase_name: 'RO4', longitude: 36.1, latitude: 32.0, site_sectors: '6', rf_opt_status: 'Pending' },
        ]
      }
      return []
    },
    get: (param) => {
      if (sql.includes('COUNT')) {
        return { count: 2 }
      }
      return null
    }
  }),
  getDB: () => mockDb
}

// ========== SupabaseSync Class (extracted for testing) ==========
class SupabaseSyncTestable {
  constructor() {
    this.supabase = null
    this.connected = false
    this.BATCH_SIZE = 50

    this.columnMapping = {
      longitude: 'long',
      latitude: 'lat',
      site_sectors: 'site_sectors_number',
      rf_opt_status: 'rf_optim_status'
    }
  }

  _transformRecord(record) {
    const transformed = {}

    for (const [key, value] of Object.entries(record)) {
      if (key === 'id') continue
      const newKey = this.columnMapping[key] || key
      transformed[newKey] = value
    }

    return transformed
  }

  async testConnection() {
    if (!this.supabase) {
      return {
        success: false,
        message: 'Supabase client not initialized'
      }
    }
    return {
      success: true,
      message: 'Connected',
      latency: 50
    }
  }

  isReady() {
    return this.supabase !== null
  }
}

// ========== Column Mapping Tests ==========
function testColumnMapping() {
  console.log('\n🔄 Column Mapping Tests\n')

  const sync = new SupabaseSyncTestable()

  test('longitude maps to long', () => {
    const input = { longitude: 35.9 }
    const output = sync._transformRecord(input)
    assert.strictEqual(output.long, 35.9)
    assert.strictEqual(output.longitude, undefined)
  })

  test('latitude maps to lat', () => {
    const input = { latitude: 31.9 }
    const output = sync._transformRecord(input)
    assert.strictEqual(output.lat, 31.9)
    assert.strictEqual(output.latitude, undefined)
  })

  test('site_sectors maps to site_sectors_number', () => {
    const input = { site_sectors: '6' }
    const output = sync._transformRecord(input)
    assert.strictEqual(output.site_sectors_number, '6')
    assert.strictEqual(output.site_sectors, undefined)
  })

  test('rf_opt_status maps to rf_optim_status', () => {
    const input = { rf_opt_status: 'Approved' }
    const output = sync._transformRecord(input)
    assert.strictEqual(output.rf_optim_status, 'Approved')
    assert.strictEqual(output.rf_opt_status, undefined)
  })

  test('id field is removed', () => {
    const input = { id: 123, site_id: 'SITE001' }
    const output = sync._transformRecord(input)
    assert.strictEqual(output.id, undefined)
    assert.strictEqual(output.site_id, 'SITE001')
  })

  test('Unmapped fields pass through unchanged', () => {
    const input = { site_id: 'SITE001', phase_name: 'RO4', governorate: 'Amman' }
    const output = sync._transformRecord(input)
    assert.strictEqual(output.site_id, 'SITE001')
    assert.strictEqual(output.phase_name, 'RO4')
    assert.strictEqual(output.governorate, 'Amman')
  })

  test('Complete record transformation', () => {
    const input = {
      id: 1,
      site_id: 'SITE001',
      phase_name: 'RO4',
      longitude: 35.9,
      latitude: 31.9,
      site_sectors: '3',
      rf_opt_status: 'Approved',
      governorate: 'Amman'
    }
    const output = sync._transformRecord(input)

    assert.strictEqual(output.id, undefined, 'id should be removed')
    assert.strictEqual(output.site_id, 'SITE001')
    assert.strictEqual(output.phase_name, 'RO4')
    assert.strictEqual(output.long, 35.9)
    assert.strictEqual(output.lat, 31.9)
    assert.strictEqual(output.site_sectors_number, '3')
    assert.strictEqual(output.rf_optim_status, 'Approved')
    assert.strictEqual(output.governorate, 'Amman')
  })

  test('Null values are preserved', () => {
    const input = { longitude: null, site_id: 'SITE001' }
    const output = sync._transformRecord(input)
    assert.strictEqual(output.long, null)
    assert.strictEqual(output.site_id, 'SITE001')
  })

  test('Empty string values are preserved', () => {
    const input = { rf_opt_status: '', site_id: 'SITE001' }
    const output = sync._transformRecord(input)
    assert.strictEqual(output.rf_optim_status, '')
    assert.strictEqual(output.site_id, 'SITE001')
  })
}

// ========== Connection Tests ==========
async function testConnection() {
  console.log('\n🔌 Connection Tests\n')

  const sync = new SupabaseSyncTestable()

  await asyncTest('testConnection returns failure when not initialized', async () => {
    const result = await sync.testConnection()
    assert.strictEqual(result.success, false)
    assert.ok(result.message.includes('not initialized'))
  })

  test('isReady returns false when not initialized', () => {
    assert.strictEqual(sync.isReady(), false)
  })

  await asyncTest('testConnection returns success when initialized', async () => {
    sync.supabase = {} // Mock supabase client
    const result = await sync.testConnection()
    assert.strictEqual(result.success, true)
    assert.ok(result.latency !== undefined)
  })

  test('isReady returns true when initialized', () => {
    sync.supabase = {} // Mock supabase client
    assert.strictEqual(sync.isReady(), true)
  })
}

// ========== Sync Function Tests (Mocked) ==========
async function testSyncFunction() {
  console.log('\n📤 Sync Function Tests (Mocked)\n')

  // Mock SupabaseSync with controlled behavior
  class MockSupabaseSync extends SupabaseSyncTestable {
    constructor() {
      super()
      this.supabase = {} // Fake initialized
      this.uploadedBatches = []
    }

    async _readSitesFromSQLite(phaseName) {
      if (phaseName === 'EMPTY') return []
      return [
        { id: 1, site_id: 'SITE001', phase_name: phaseName, longitude: 35.9, latitude: 31.9 },
        { id: 2, site_id: 'SITE002', phase_name: phaseName, longitude: 36.1, latitude: 32.0 },
      ]
    }

    async _uploadBatch(batch) {
      this.uploadedBatches.push(batch)
      // Simulate success
      return { success: true, inserted: 0, updated: batch.length }
    }

    async syncPhaseToSupabase(phaseName, onProgress = null) {
      const summary = {
        total: 0,
        inserted: 0,
        updated: 0,
        failed: 0,
        errors: []
      }

      if (!this.supabase) {
        summary.errors.push({ batch: 0, message: 'Supabase client not initialized' })
        return summary
      }

      const sites = await this._readSitesFromSQLite(phaseName)
      summary.total = sites.length

      if (sites.length === 0) {
        return summary
      }

      const transformedSites = sites.map(site => this._transformRecord(site))

      const batches = []
      for (let i = 0; i < transformedSites.length; i += this.BATCH_SIZE) {
        batches.push(transformedSites.slice(i, i + this.BATCH_SIZE))
      }

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i]
        const current = Math.min((i + 1) * this.BATCH_SIZE, summary.total)
        const percentage = Math.round((current / summary.total) * 100)

        const result = await this._uploadBatch(batch)

        if (result.success) {
          summary.inserted += result.inserted
          summary.updated += result.updated
        } else {
          summary.failed += batch.length
          summary.errors.push({ batch: i + 1, message: result.error })
        }

        if (onProgress) {
          onProgress({ current, total: summary.total, percentage })
        }
      }

      return summary
    }
  }

  const sync = new MockSupabaseSync()

  await asyncTest('syncPhaseToSupabase returns correct summary structure', async () => {
    const summary = await sync.syncPhaseToSupabase('RO4')

    assert.ok(typeof summary.total === 'number')
    assert.ok(typeof summary.inserted === 'number')
    assert.ok(typeof summary.updated === 'number')
    assert.ok(typeof summary.failed === 'number')
    assert.ok(Array.isArray(summary.errors))
  })

  await asyncTest('syncPhaseToSupabase processes all records', async () => {
    sync.uploadedBatches = [] // Reset
    const summary = await sync.syncPhaseToSupabase('RO4')

    assert.strictEqual(summary.total, 2)
    assert.strictEqual(summary.updated, 2)
    assert.strictEqual(summary.failed, 0)
  })

  await asyncTest('syncPhaseToSupabase handles empty phase', async () => {
    const summary = await sync.syncPhaseToSupabase('EMPTY')

    assert.strictEqual(summary.total, 0)
    assert.strictEqual(summary.updated, 0)
    assert.strictEqual(summary.errors.length, 0)
  })

  await asyncTest('syncPhaseToSupabase calls onProgress callback', async () => {
    const progressCalls = []
    const onProgress = (data) => progressCalls.push(data)

    await sync.syncPhaseToSupabase('RO4', onProgress)

    assert.ok(progressCalls.length > 0, 'Should have called progress at least once')
    assert.ok(progressCalls[progressCalls.length - 1].percentage === 100, 'Last progress should be 100%')
  })

  await asyncTest('syncPhaseToSupabase transforms records before upload', async () => {
    sync.uploadedBatches = [] // Reset
    await sync.syncPhaseToSupabase('RO4')

    const uploadedRecord = sync.uploadedBatches[0][0]
    assert.ok(uploadedRecord.long !== undefined, 'Should have long field')
    assert.ok(uploadedRecord.lat !== undefined, 'Should have lat field')
    assert.strictEqual(uploadedRecord.longitude, undefined, 'Should not have longitude field')
    assert.strictEqual(uploadedRecord.latitude, undefined, 'Should not have latitude field')
    assert.strictEqual(uploadedRecord.id, undefined, 'Should not have id field')
  })

  // Test error handling
  await asyncTest('syncPhaseToSupabase handles batch failures', async () => {
    class FailingSync extends MockSupabaseSync {
      async _uploadBatch(batch) {
        return { success: false, inserted: 0, updated: 0, error: 'Network error' }
      }
    }

    const failingSync = new FailingSync()
    failingSync.supabase = {}

    const summary = await failingSync.syncPhaseToSupabase('RO4')

    assert.strictEqual(summary.failed, 2, 'All records should fail')
    assert.ok(summary.errors.length > 0, 'Should have errors')
    assert.ok(summary.errors[0].message.includes('Network error'))
  })

  await asyncTest('syncPhaseToSupabase fails when not initialized', async () => {
    const uninitSync = new MockSupabaseSync()
    uninitSync.supabase = null

    const summary = await uninitSync.syncPhaseToSupabase('RO4')

    assert.ok(summary.errors.length > 0)
    assert.ok(summary.errors[0].message.includes('not initialized'))
  })
}

// ========== Batch Size Tests ==========
function testBatchSize() {
  console.log('\n📦 Batch Size Tests\n')

  const sync = new SupabaseSyncTestable()

  test('Default batch size is 50', () => {
    assert.strictEqual(sync.BATCH_SIZE, 50)
  })

  test('Batch splitting logic', () => {
    const records = Array(125).fill({}).map((_, i) => ({ id: i, site_id: `SITE${i}` }))
    const batchSize = 50
    const expectedBatches = 3

    const batches = []
    for (let i = 0; i < records.length; i += batchSize) {
      batches.push(records.slice(i, i + batchSize))
    }

    assert.strictEqual(batches.length, expectedBatches)
    assert.strictEqual(batches[0].length, 50)
    assert.strictEqual(batches[1].length, 50)
    assert.strictEqual(batches[2].length, 25)
  })
}

// ========== Run All Tests ==========
async function runAllTests() {
  console.log('═══════════════════════════════════════════════════')
  console.log('  Supabase Sync Service Tests')
  console.log('═══════════════════════════════════════════════════')

  const startTime = Date.now()

  testColumnMapping()
  await testConnection()
  await testSyncFunction()
  testBatchSize()

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
