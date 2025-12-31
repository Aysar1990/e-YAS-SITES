/**
 * Database Adapter Tests - Day 5: Week 1 Integration Testing
 *
 * Tests SQLite and Supabase adapters, adapter switching, and error handling
 * Run with: node tests/database-adapter.test.js
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

// ========== SQLite Adapter Tests ==========
async function testSQLiteAdapter() {
  console.log('\n📦 SQLite Adapter Tests\n')

  const SQLiteAdapter = require('../electron/database/adapters/sqliteAdapter')
  const adapter = new SQLiteAdapter()

  await asyncTest('Initialize SQLite adapter', async () => {
    const result = await adapter.initialize()
    assert.strictEqual(result, true)
  })

  test('getType() returns sqlite', () => {
    assert.strictEqual(adapter.getType(), 'sqlite')
  })

  test('Create test table', () => {
    adapter.exec(`
      CREATE TABLE IF NOT EXISTS adapter_test (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        value INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)
  })

  test('Insert data with prepare().run()', () => {
    const stmt = adapter.prepare('INSERT INTO adapter_test (name, value) VALUES (?, ?)')
    const result = stmt.run('Test1', 100)
    // Verify data was inserted by querying it
    const verify = adapter.prepare('SELECT * FROM adapter_test WHERE name = ?').get('Test1')
    assert.ok(verify, 'Data should be inserted')
    assert.strictEqual(verify.name, 'Test1')
  })

  test('Query single row with prepare().get()', () => {
    const stmt = adapter.prepare('SELECT * FROM adapter_test WHERE name = ?')
    const row = stmt.get('Test1')
    assert.strictEqual(row.name, 'Test1')
    assert.strictEqual(row.value, 100)
  })

  test('Query all rows with prepare().all()', () => {
    const insertStmt = adapter.prepare('INSERT INTO adapter_test (name, value) VALUES (?, ?)')
    insertStmt.run('Test2', 200)
    insertStmt.run('Test3', 300)

    const stmt = adapter.prepare('SELECT * FROM adapter_test ORDER BY id')
    const rows = stmt.all()
    assert.strictEqual(rows.length, 3)
  })

  test('Update data', () => {
    const stmt = adapter.prepare('UPDATE adapter_test SET value = ? WHERE name = ?')
    stmt.run(150, 'Test1')
    // Verify update by querying
    const verify = adapter.prepare('SELECT value FROM adapter_test WHERE name = ?').get('Test1')
    assert.strictEqual(verify.value, 150)
  })

  test('Delete data', () => {
    const countBefore = adapter.prepare('SELECT COUNT(*) as c FROM adapter_test').get().c
    const stmt = adapter.prepare('DELETE FROM adapter_test WHERE name = ?')
    stmt.run('Test3')
    const countAfter = adapter.prepare('SELECT COUNT(*) as c FROM adapter_test').get().c
    assert.strictEqual(countAfter, countBefore - 1)
  })

  test('Transaction commits on success', () => {
    const txn = adapter.transaction(() => {
      const stmt = adapter.prepare('INSERT INTO adapter_test (name, value) VALUES (?, ?)')
      stmt.run('TxnTest1', 400)
      stmt.run('TxnTest2', 500)
    })
    txn()

    const countStmt = adapter.prepare('SELECT COUNT(*) as count FROM adapter_test WHERE name LIKE ?')
    const result = countStmt.get('Txn%')
    assert.strictEqual(result.count, 2)
  })

  test('Transaction rollback on error', () => {
    const initialCount = adapter.prepare('SELECT COUNT(*) as count FROM adapter_test').get().count

    try {
      const txn = adapter.transaction(() => {
        const stmt = adapter.prepare('INSERT INTO adapter_test (name, value) VALUES (?, ?)')
        stmt.run('RollbackTest', 600)
        throw new Error('Simulated error')
      })
      txn()
    } catch (e) {
      // Expected error
    }

    const finalCount = adapter.prepare('SELECT COUNT(*) as count FROM adapter_test').get().count
    assert.strictEqual(initialCount, finalCount)
  })

  await asyncTest('Backup creates file', async () => {
    const backupPath = await adapter.backup()
    assert.ok(fs.existsSync(backupPath))
    fs.unlinkSync(backupPath) // Cleanup
  })

  test('Cleanup test table', () => {
    adapter.exec('DROP TABLE IF EXISTS adapter_test')
  })

  test('Close adapter', () => {
    adapter.close()
  })
}

// ========== Supabase Adapter Tests ==========
async function testSupabaseAdapter() {
  console.log('\n☁️  Supabase Adapter Tests\n')

  const SupabaseAdapter = require('../electron/database/adapters/supabaseAdapter')

  test('Create Supabase adapter without config', () => {
    const adapter = new SupabaseAdapter()
    assert.strictEqual(adapter.getType(), 'supabase')
  })

  test('Supabase adapter has required methods', () => {
    const adapter = new SupabaseAdapter()
    assert.strictEqual(typeof adapter.initialize, 'function')
    assert.strictEqual(typeof adapter.prepare, 'function')
    assert.strictEqual(typeof adapter.exec, 'function')
    assert.strictEqual(typeof adapter.transaction, 'function')
    assert.strictEqual(typeof adapter.close, 'function')
    assert.strictEqual(typeof adapter.backup, 'function')
  })

  await asyncTest('Initialize fails without credentials (expected)', async () => {
    const adapter = new SupabaseAdapter()
    const result = await adapter.initialize()
    assert.strictEqual(result, false) // No credentials, should fail gracefully
  })

  await asyncTest('Initialize with mock config (no connection)', async () => {
    const adapter = new SupabaseAdapter({
      url: 'https://mock.supabase.co',
      key: 'mock-key'
    })
    // Will fail to connect but shouldn't throw
    const result = await adapter.initialize()
    assert.strictEqual(result, false)
  })

  test('subscribeToChanges method exists', () => {
    const adapter = new SupabaseAdapter()
    assert.strictEqual(typeof adapter.subscribeToChanges, 'function')
  })
}

// ========== Database Manager Tests ==========
async function testDatabaseManager() {
  console.log('\n🔄 Database Manager Tests\n')

  // Clear require cache to get fresh instance
  delete require.cache[require.resolve('../electron/database/db')]
  const dbManager = require('../electron/database/db')

  await asyncTest('Initialize with SQLite (default)', async () => {
    const result = await dbManager.initialize('sqlite')
    assert.strictEqual(result, true)
  })

  test('getAdapterType returns sqlite', () => {
    assert.strictEqual(dbManager.getAdapterType(), 'sqlite')
  })

  test('getAdapter returns adapter instance', () => {
    const adapter = dbManager.getAdapter()
    assert.ok(adapter)
    assert.strictEqual(adapter.getType(), 'sqlite')
  })

  test('prepare works through manager', () => {
    dbManager.exec('CREATE TABLE IF NOT EXISTS mgr_test (id INTEGER PRIMARY KEY, name TEXT)')
    const stmt = dbManager.prepare('INSERT INTO mgr_test (name) VALUES (?)')
    stmt.run('ManagerTest')
    // Verify insert by querying
    const verify = dbManager.prepare('SELECT * FROM mgr_test WHERE name = ?').get('ManagerTest')
    assert.ok(verify, 'Data should be inserted')
    assert.strictEqual(verify.name, 'ManagerTest')
  })

  test('transaction works through manager', () => {
    const txn = dbManager.transaction(() => {
      const stmt = dbManager.prepare('INSERT INTO mgr_test (name) VALUES (?)')
      stmt.run('TxnMgr1')
      stmt.run('TxnMgr2')
    })
    txn()

    const count = dbManager.prepare('SELECT COUNT(*) as c FROM mgr_test').get().c
    assert.strictEqual(count, 3)
  })

  test('getDB returns manager instance (legacy)', () => {
    const db = dbManager.getDB()
    assert.strictEqual(db, dbManager)
  })

  test('Cleanup manager test table', () => {
    dbManager.exec('DROP TABLE IF EXISTS mgr_test')
  })

  await asyncTest('switchAdapter to Supabase (will fail, no creds)', async () => {
    const result = await dbManager.switchAdapter('supabase')
    assert.strictEqual(result, false) // Expected to fail without credentials
  })

  await asyncTest('switchAdapter back to SQLite', async () => {
    const result = await dbManager.switchAdapter('sqlite')
    assert.strictEqual(result, true)
    assert.strictEqual(dbManager.getAdapterType(), 'sqlite')
  })

  test('Close database manager', () => {
    dbManager.close()
  })
}

// ========== Error Handling Tests ==========
async function testErrorHandling() {
  console.log('\n⚠️  Error Handling Tests\n')

  const SQLiteAdapter = require('../electron/database/adapters/sqliteAdapter')
  const adapter = new SQLiteAdapter()
  await adapter.initialize()

  test('Invalid SQL throws error', () => {
    assert.throws(() => {
      adapter.exec('INVALID SQL STATEMENT')
    })
  })

  test('Query non-existent table returns empty/undefined', () => {
    const stmt = adapter.prepare('SELECT * FROM nonexistent_table WHERE id = ?')
    const result = stmt.get(1)
    assert.strictEqual(result, undefined)
  })

  test('Insert with missing required field throws', () => {
    adapter.exec('CREATE TABLE err_test (id INTEGER PRIMARY KEY, required_field TEXT NOT NULL)')
    assert.throws(() => {
      const stmt = adapter.prepare('INSERT INTO err_test (id) VALUES (?)')
      stmt.run(1)
    })
    adapter.exec('DROP TABLE IF EXISTS err_test')
  })

  adapter.close()
}

// ========== Run All Tests ==========
async function runAllTests() {
  console.log('═══════════════════════════════════════════════════')
  console.log('  Database Adapter Integration Tests')
  console.log('  Day 5 - Week 1 Integration Testing')
  console.log('═══════════════════════════════════════════════════')

  const startTime = Date.now()

  await testSQLiteAdapter()
  await testSupabaseAdapter()
  await testDatabaseManager()
  await testErrorHandling()

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
