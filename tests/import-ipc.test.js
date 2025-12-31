/**
 * Import IPC Handler Tests - Day 10
 *
 * Tests IPC handler registration and functionality
 * Run with: node tests/import-ipc.test.js
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

// ========== IPC Handler Module Tests ==========
function testIpcHandlerModule() {
  console.log('\n📡 IPC Handler Module Tests\n')

  const { registerImportHandlers } = require('../electron/ipc/importHandlers')

  test('registerImportHandlers function exists', () => {
    assert.ok(registerImportHandlers)
    assert.strictEqual(typeof registerImportHandlers, 'function')
  })

  test('registerImportHandlers accepts ipcMain and deps', () => {
    // Mock ipcMain
    const handlers = {}
    const mockIpcMain = {
      handle: (channel, handler) => {
        handlers[channel] = handler
      }
    }

    const db = require('../electron/database/db')
    const deps = {
      db,
      getMainWindow: () => null,
      logAction: () => {}
    }

    // Should not throw
    registerImportHandlers(mockIpcMain, deps)

    // Verify handlers were registered
    assert.ok(handlers['validate-batch'])
    assert.ok(handlers['import-batch'])
    assert.ok(handlers['validate-single'])
    assert.ok(handlers['import-single'])
    assert.ok(handlers['preview-excel'])
  })
}

// ========== validate-batch Handler Tests ==========
function testValidateBatchHandler() {
  console.log('\n✅ validate-batch Handler Tests\n')

  test('validate-batch handler can be invoked', async () => {
    const handlers = {}
    const mockIpcMain = {
      handle: (channel, handler) => {
        handlers[channel] = handler
      }
    }

    const db = require('../electron/database/db')
    const { registerImportHandlers } = require('../electron/ipc/importHandlers')

    registerImportHandlers(mockIpcMain, {
      db,
      getMainWindow: () => null,
      logAction: () => {}
    })

    // Create test file
    const testFile = path.join(__dirname, 'test-validate.xlsx')
    fs.writeFileSync(testFile, Buffer.alloc(100))

    // Invoke handler
    const result = await handlers['validate-batch'](null, [testFile])

    assert.ok(result)
    assert.strictEqual(result.success, true)
    assert.ok(result.results)
    assert.ok(Array.isArray(result.results))
    assert.strictEqual(result.results.length, 1)
    assert.strictEqual(result.results[0].valid, true)

    // Clean up
    fs.unlinkSync(testFile)
  })

  test('validate-batch rejects invalid files', async () => {
    const handlers = {}
    const mockIpcMain = {
      handle: (channel, handler) => {
        handlers[channel] = handler
      }
    }

    const db = require('../electron/database/db')
    const { registerImportHandlers } = require('../electron/ipc/importHandlers')

    registerImportHandlers(mockIpcMain, {
      db,
      getMainWindow: () => null,
      logAction: () => {}
    })

    // Invoke with non-existent file
    const result = await handlers['validate-batch'](null, ['/nonexistent/file.xlsx'])

    assert.ok(result)
    assert.strictEqual(result.success, true)
    assert.strictEqual(result.valid, false)
    assert.strictEqual(result.invalidCount, 1)
  })
}

// ========== validate-single Handler Tests ==========
function testValidateSingleHandler() {
  console.log('\n📄 validate-single Handler Tests\n')

  test('validate-single handler exists', () => {
    const handlers = {}
    const mockIpcMain = {
      handle: (channel, handler) => {
        handlers[channel] = handler
      }
    }

    const db = require('../electron/database/db')
    const { registerImportHandlers } = require('../electron/ipc/importHandlers')

    registerImportHandlers(mockIpcMain, {
      db,
      getMainWindow: () => null,
      logAction: () => {}
    })

    assert.ok(handlers['validate-single'])
    assert.strictEqual(typeof handlers['validate-single'], 'function')
  })

  test('validate-single accepts valid file', async () => {
    const handlers = {}
    const mockIpcMain = {
      handle: (channel, handler) => {
        handlers[channel] = handler
      }
    }

    const db = require('../electron/database/db')
    const { registerImportHandlers } = require('../electron/ipc/importHandlers')

    registerImportHandlers(mockIpcMain, {
      db,
      getMainWindow: () => null,
      logAction: () => {}
    })

    // Create test file
    const testFile = path.join(__dirname, 'test-single.xlsx')
    fs.writeFileSync(testFile, Buffer.alloc(100))

    // Invoke handler
    const result = await handlers['validate-single'](null, testFile)

    assert.ok(result)
    assert.strictEqual(result.success, true)

    // Clean up
    fs.unlinkSync(testFile)
  })
}

// ========== preview-excel Handler Tests ==========
function testPreviewExcelHandler() {
  console.log('\n👁️  preview-excel Handler Tests\n')

  test('preview-excel handler exists', () => {
    const handlers = {}
    const mockIpcMain = {
      handle: (channel, handler) => {
        handlers[channel] = handler
      }
    }

    const db = require('../electron/database/db')
    const { registerImportHandlers } = require('../electron/ipc/importHandlers')

    registerImportHandlers(mockIpcMain, {
      db,
      getMainWindow: () => null,
      logAction: () => {}
    })

    assert.ok(handlers['preview-excel'])
    assert.strictEqual(typeof handlers['preview-excel'], 'function')
  })

  test('preview-excel returns error for missing file', async () => {
    const handlers = {}
    const mockIpcMain = {
      handle: (channel, handler) => {
        handlers[channel] = handler
      }
    }

    const db = require('../electron/database/db')
    const { registerImportHandlers } = require('../electron/ipc/importHandlers')

    registerImportHandlers(mockIpcMain, {
      db,
      getMainWindow: () => null,
      logAction: () => {}
    })

    // Invoke with non-existent file
    const result = await handlers['preview-excel'](null, {
      filePath: '/nonexistent/file.xlsx',
      limit: 10
    })

    assert.ok(result)
    assert.strictEqual(result.success, false)
    assert.ok(result.error)
  })
}

// ========== Error Response Tests ==========
function testErrorResponses() {
  console.log('\n⚠️  Error Response Tests\n')

  test('Handlers return success: false on error', async () => {
    const handlers = {}
    const mockIpcMain = {
      handle: (channel, handler) => {
        handlers[channel] = handler
      }
    }

    const db = require('../electron/database/db')
    const { registerImportHandlers } = require('../electron/ipc/importHandlers')

    registerImportHandlers(mockIpcMain, {
      db,
      getMainWindow: () => null,
      logAction: () => {}
    })

    // Test validate-batch with invalid input
    const result = await handlers['validate-batch'](null, null)

    assert.ok(result)
    assert.strictEqual(result.success, false)
    assert.ok(result.error)
  })

  test('Error messages are descriptive', async () => {
    const handlers = {}
    const mockIpcMain = {
      handle: (channel, handler) => {
        handlers[channel] = handler
      }
    }

    const db = require('../electron/database/db')
    const { registerImportHandlers } = require('../electron/ipc/importHandlers')

    registerImportHandlers(mockIpcMain, {
      db,
      getMainWindow: () => null,
      logAction: () => {}
    })

    const result = await handlers['validate-batch'](null, null)

    assert.ok(result.error)
    assert.ok(typeof result.error === 'string')
    assert.ok(result.error.length > 0)
  })
}

// ========== IPC Index Tests ==========
function testIpcIndex() {
  console.log('\n📦 IPC Index Tests\n')

  // Mock Electron app before requiring IPC modules
  // This prevents "Cannot read properties of undefined (reading 'getPath')" errors
  if (!process.versions.electron) {
    const mockApp = {
      getPath: (name) => {
        if (name === 'userData') return path.join(__dirname, '.test-data')
        return __dirname
      }
    }

    // Mock electron module
    require.cache[require.resolve('electron')] = {
      exports: { app: mockApp }
    }
  }

  const { registerAllHandlers } = require('../electron/ipc')

  test('registerAllHandlers function exists', () => {
    assert.ok(registerAllHandlers)
    assert.strictEqual(typeof registerAllHandlers, 'function')
  })

  test('registerAllHandlers registers import handlers', () => {
    const handlers = {}
    const mockIpcMain = {
      handle: (channel, handler) => {
        handlers[channel] = handler
      }
    }

    const db = require('../electron/database/db')

    // Mock dependencies
    const deps = {
      db,
      getMainWindow: () => null,
      getApiServer: () => null,
      setApiServer: () => {},
      getWsServer: () => null,
      setWsServer: () => {},
      getBackupService: () => null,
      getLiveSyncWatcher: () => null,
      setLiveSyncWatcher: () => {},
      initializeLiveSync: () => {},
      authQueries: {},
      settingsQueries: {},
      rejectionsQueries: {},
      contractorsQueries: {},
      sitesQueries: {},
      notifications: {},
      dataSync: {},
      logAction: () => {},
      ApiServer: class {},
      WebSocketServer: class {},
      electronDir: __dirname
    }

    // Should not throw
    registerAllHandlers(mockIpcMain, deps)

    // Verify import handlers are registered
    assert.ok(handlers['validate-batch'])
    assert.ok(handlers['import-batch'])
    assert.ok(handlers['validate-single'])
    assert.ok(handlers['import-single'])
  })
}

// ========== Run All Tests ==========
function runAllTests() {
  console.log('\n═══════════════════════════════════════════════════')
  console.log('   IMPORT IPC HANDLER TESTS')
  console.log('═══════════════════════════════════════════════════')

  testIpcHandlerModule()
  testValidateBatchHandler()
  testValidateSingleHandler()
  testPreviewExcelHandler()
  testErrorResponses()
  testIpcIndex()

  console.log('\n═══════════════════════════════════════════════════')
  console.log('   TEST SUMMARY')
  console.log('═══════════════════════════════════════════════════')
  console.log(`   ✅ Passed: ${results.passed}`)
  console.log(`   ❌ Failed: ${results.failed}`)
  console.log('═══════════════════════════════════════════════════\n')

  if (results.failed > 0) {
    console.log('❌ SOME TESTS FAILED\n')
    process.exit(1)
  } else {
    console.log('🎉 ALL TESTS PASSED!\n')
    process.exit(0)
  }
}

// Run tests
runAllTests()
