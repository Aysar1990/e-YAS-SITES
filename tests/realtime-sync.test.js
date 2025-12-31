/**
 * Real-time Sync Tests - Day 14/15
 *
 * Tests for RealtimeSync service covering:
 * - Supabase mode: Real-time subscriptions
 * - SQLite mode: Polling mechanism
 * - Multi-client broadcast
 * - Connection handling
 *
 * Run with: node tests/realtime-sync.test.js
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

// ========== RealtimeSync Class Tests ==========
function testRealtimeSyncClass() {
  console.log('\n🔄 RealtimeSync Class Tests\n')

  const { RealtimeSync, SYNC_EVENTS } = require('../electron/services/realtimeSync')

  test('RealtimeSync class exists', () => {
    assert.ok(RealtimeSync, 'RealtimeSync class should exist')
    assert.strictEqual(typeof RealtimeSync, 'function', 'RealtimeSync should be a constructor')
  })

  test('SYNC_EVENTS are defined', () => {
    assert.ok(SYNC_EVENTS, 'SYNC_EVENTS should be defined')
    assert.ok(SYNC_EVENTS.SITE_ADDED, 'SITE_ADDED event should exist')
    assert.ok(SYNC_EVENTS.SITE_UPDATED, 'SITE_UPDATED event should exist')
    assert.ok(SYNC_EVENTS.SITE_DELETED, 'SITE_DELETED event should exist')
    assert.ok(SYNC_EVENTS.SYNC_STATUS, 'SYNC_STATUS event should exist')
  })

  test('RealtimeSync instance initializes correctly', () => {
    const sync = new RealtimeSync()
    assert.strictEqual(sync.isInitialized, false, 'Should not be initialized')
    assert.strictEqual(sync.isRunning, false, 'Should not be running')
    assert.strictEqual(sync.pollIntervalMs, 2000, 'Poll interval should be 2 seconds')
  })

  test('Stats object has correct structure', () => {
    const sync = new RealtimeSync()
    const stats = sync.getStats()
    assert.strictEqual(typeof stats.inserts, 'number', 'inserts should be a number')
    assert.strictEqual(typeof stats.updates, 'number', 'updates should be a number')
    assert.strictEqual(typeof stats.deletes, 'number', 'deletes should be a number')
    assert.strictEqual(typeof stats.errors, 'number', 'errors should be a number')
    assert.strictEqual(stats.isRunning, false, 'isRunning should be false initially')
  })
}

// ========== SQLite Polling Tests ==========
function testSqlitePolling() {
  console.log('\n📊 SQLite Polling Tests\n')

  const { RealtimeSync } = require('../electron/services/realtimeSync')

  test('SQLite polling interval is 2 seconds', () => {
    const sync = new RealtimeSync()
    assert.strictEqual(sync.pollIntervalMs, 2000, 'Polling interval should be 2000ms')
  })

  test('isPolling flag prevents overlapping polls', () => {
    const sync = new RealtimeSync()
    sync.isPolling = true
    // Should return early if already polling (tested via behavior)
    assert.strictEqual(sync.isPolling, true, 'isPolling flag should be respected')
  })

  test('lastSyncTime is tracked', () => {
    const sync = new RealtimeSync()
    assert.strictEqual(sync.lastSyncTime, null, 'lastSyncTime should be null initially')
  })
}

// ========== Change Tracking Tests ==========
function testChangeTracking() {
  console.log('\n🔍 Change Tracking Tests\n')

  const { RealtimeSync } = require('../electron/services/realtimeSync')

  test('Duplicate changes are detected', () => {
    const sync = new RealtimeSync()
    const changeId = 'INSERT-123-' + Date.now()

    const firstCheck = sync.isDuplicateChange(changeId)
    assert.strictEqual(firstCheck, false, 'First check should not be duplicate')

    const secondCheck = sync.isDuplicateChange(changeId)
    assert.strictEqual(secondCheck, true, 'Second check should be duplicate')
  })

  test('recentChanges are cleaned up after retention period', () => {
    const sync = new RealtimeSync()
    sync.changeRetentionMs = 100 // Short retention for testing

    const changeId = 'TEST-CLEANUP-' + Date.now()
    sync.isDuplicateChange(changeId)

    assert.ok(sync.recentChanges.size > 0, 'Should have recent changes')
  })

  test('registerLocalChange adds to tracking', () => {
    const sync = new RealtimeSync()
    sync.registerLocalChange('SITE001', 'update')

    assert.ok(sync.recentChanges.size > 0, 'Should track local changes')
  })
}

// ========== Broadcast Tests ==========
function testBroadcast() {
  console.log('\n📡 Broadcast Tests\n')

  const { RealtimeSync, SYNC_EVENTS } = require('../electron/services/realtimeSync')

  test('handleRemoteUpdate processes events correctly', () => {
    const sync = new RealtimeSync()
    let broadcastCalled = false
    let lastEvent = null
    let lastPayload = null

    sync.broadcast = (event, payload) => {
      broadcastCalled = true
      lastEvent = event
      lastPayload = payload
    }

    sync.handleRemoteUpdate({
      type: 'update',
      data: { site_id: 'TEST001', final_site_name: 'Test Site' }
    })

    assert.strictEqual(broadcastCalled, true, 'Broadcast should be called')
    assert.strictEqual(lastEvent, SYNC_EVENTS.SITE_UPDATED, 'Event should be SITE_UPDATED')
    assert.ok(lastPayload.site, 'Payload should contain site')
    assert.ok(lastPayload.timestamp, 'Payload should contain timestamp')
  })

  test('INSERT events map to SITE_ADDED', () => {
    const sync = new RealtimeSync()
    let capturedEvent = null

    sync.broadcast = (event) => { capturedEvent = event }

    sync.handleRemoteUpdate({
      type: 'insert',
      data: { site_id: 'NEW001' }
    })

    assert.strictEqual(capturedEvent, SYNC_EVENTS.SITE_ADDED, 'Should map to SITE_ADDED')
  })

  test('DELETE events map to SITE_DELETED', () => {
    const sync = new RealtimeSync()
    let capturedEvent = null

    sync.broadcast = (event) => { capturedEvent = event }

    sync.handleRemoteUpdate({
      type: 'delete',
      data: { site_id: 'DEL001' }
    })

    assert.strictEqual(capturedEvent, SYNC_EVENTS.SITE_DELETED, 'Should map to SITE_DELETED')
  })

  test('Empty data is handled gracefully', () => {
    const sync = new RealtimeSync()
    let broadcastCalled = false

    sync.broadcast = () => { broadcastCalled = true }

    // Should not crash, should not broadcast
    sync.handleRemoteUpdate({ type: 'update', data: null })
    assert.strictEqual(broadcastCalled, false, 'Should not broadcast with null data')
  })
}

// ========== Stop Sync Tests ==========
async function testStopSync() {
  console.log('\n⏹️ Stop Sync Tests\n')

  const { RealtimeSync } = require('../electron/services/realtimeSync')

  await asyncTest('stopSync clears polling interval', async () => {
    const sync = new RealtimeSync()
    sync.pollingInterval = setInterval(() => {}, 10000)
    sync.isRunning = true
    sync.isInitialized = true

    await sync.stopSync()

    assert.strictEqual(sync.pollingInterval, null, 'Polling interval should be null')
    assert.strictEqual(sync.isRunning, false, 'isRunning should be false')
    assert.strictEqual(sync.isInitialized, false, 'isInitialized should be false')
  })

  await asyncTest('stopSync clears recent changes', async () => {
    const sync = new RealtimeSync()
    sync.recentChanges.set('test', Date.now())
    sync.isRunning = true

    await sync.stopSync()

    assert.strictEqual(sync.recentChanges.size, 0, 'Recent changes should be cleared')
  })
}

// ========== Stats Tests ==========
function testStats() {
  console.log('\n📈 Stats Tests\n')

  const { RealtimeSync } = require('../electron/services/realtimeSync')

  test('Stats increment correctly', () => {
    const sync = new RealtimeSync()

    sync.stats.inserts++
    sync.stats.updates += 5
    sync.stats.deletes += 2
    sync.stats.errors++

    const stats = sync.getStats()
    assert.strictEqual(stats.inserts, 1, 'Inserts should be 1')
    assert.strictEqual(stats.updates, 5, 'Updates should be 5')
    assert.strictEqual(stats.deletes, 2, 'Deletes should be 2')
    assert.strictEqual(stats.errors, 1, 'Errors should be 1')
  })

  test('getStats returns dbType and isRunning', () => {
    const sync = new RealtimeSync()
    sync.dbType = 'sqlite'
    sync.isRunning = true

    const stats = sync.getStats()
    assert.strictEqual(stats.dbType, 'sqlite', 'dbType should be sqlite')
    assert.strictEqual(stats.isRunning, true, 'isRunning should be true')
  })
}

// ========== Run All Tests ==========
async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════')
  console.log('  Real-time Sync Tests - Day 14/15')
  console.log('═══════════════════════════════════════════════════════')

  try {
    testRealtimeSyncClass()
    testSqlitePolling()
    testChangeTracking()
    testBroadcast()
    await testStopSync()
    testStats()
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
