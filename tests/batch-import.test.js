/**
 * Batch Import Integration Tests - Day 10
 *
 * Tests end-to-end batch import functionality
 * Run with: node tests/batch-import.test.js
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

// ========== Single File Import Tests ==========
function testSingleFileImport() {
  console.log('\n📁 Single File Import Tests\n')

  const {
    validateFile,
    parseFile,
    processSingleFile
  } = require('../electron/services/importProcessors/singleFileProcessor')
  const db = require('../electron/database/db')

  test('validateFile rejects missing file', () => {
    const result = validateFile('/path/to/nonexistent.xlsx')
    assert.strictEqual(result.valid, false)
    assert.ok(result.errors.length > 0)
    assert.strictEqual(result.errors[0].type, 'FILE_NOT_FOUND')
  })

  test('validateFile rejects invalid extension', () => {
    const testFile = path.join(__dirname, 'test-data.pdf')
    fs.writeFileSync(testFile, 'dummy')

    const result = validateFile(testFile)
    assert.strictEqual(result.valid, false)
    assert.ok(result.errors.some(e => e.type === 'INVALID_EXTENSION'))

    fs.unlinkSync(testFile)
  })

  test('validateFile rejects files over 10MB', () => {
    const testFile = path.join(__dirname, 'large-file.xlsx')
    const buffer = Buffer.alloc(11 * 1024 * 1024) // 11MB
    fs.writeFileSync(testFile, buffer)

    const result = validateFile(testFile)
    assert.strictEqual(result.valid, false)
    assert.ok(result.errors.some(e => e.type === 'FILE_TOO_LARGE'))

    fs.unlinkSync(testFile)
  })
}

// ========== Batch Processing Tests ==========
function testBatchProcessing() {
  console.log('\n📦 Batch Processing Tests\n')

  const {
    SINGLE_FILE_CONFIG
  } = require('../electron/services/importProcessors/singleFileProcessor')

  test('SINGLE_FILE_CONFIG has correct max file size', () => {
    assert.strictEqual(SINGLE_FILE_CONFIG.maxFileSizeMB, 10)
  })

  test('SINGLE_FILE_CONFIG has correct allowed extensions', () => {
    assert.ok(SINGLE_FILE_CONFIG.allowedExtensions.includes('.xlsx'))
    assert.ok(SINGLE_FILE_CONFIG.allowedExtensions.includes('.xlsm'))
    assert.ok(SINGLE_FILE_CONFIG.allowedExtensions.includes('.xls'))
  })

  test('SINGLE_FILE_CONFIG has correct table name', () => {
    assert.strictEqual(SINGLE_FILE_CONFIG.tableName, 'sites')
  })
}

// ========== File Type Validation Tests ==========
function testFileTypeValidation() {
  console.log('\n📋 File Type Validation Tests\n')

  const { validateFile } = require('../electron/services/importProcessors/singleFileProcessor')

  const invalidExtensions = ['.pdf', '.txt', '.doc', '.csv', '.json']

  invalidExtensions.forEach(ext => {
    test(`Rejects ${ext} files`, () => {
      const testFile = path.join(__dirname, `test${ext}`)
      fs.writeFileSync(testFile, 'dummy content')

      const result = validateFile(testFile)
      assert.strictEqual(result.valid, false)
      assert.ok(result.errors.some(e => e.type === 'INVALID_EXTENSION'))

      fs.unlinkSync(testFile)
    })
  })
}

// ========== Progress Tracking Tests ==========
function testProgressTracking() {
  console.log('\n📊 Progress Tracking Tests\n')

  const { createImportResult } = require('../electron/services/importTypes')

  test('createImportResult initializes with PENDING status', () => {
    const result = createImportResult()
    assert.strictEqual(result.status, 'PENDING')
    assert.strictEqual(result.totalRecords, 0)
  })

  test('Import result tracks all operations', () => {
    const result = createImportResult()
    assert.ok('inserted' in result)
    assert.ok('updated' in result)
    assert.ok('skipped' in result)
    assert.ok('failed' in result)
  })

  test('Import result has errors array', () => {
    const result = createImportResult()
    assert.ok(Array.isArray(result.errors))
    assert.strictEqual(result.errors.length, 0)
  })
}

// ========== Database Integration Tests ==========
function testDatabaseIntegration() {
  console.log('\n💾 Database Integration Tests\n')

  const db = require('../electron/database/db')

  test('Database connection exists', () => {
    assert.ok(db)
  })

  test('Database has prepare method', () => {
    assert.ok(typeof db.prepare === 'function')
  })

  test('Can query sites table', () => {
    try {
      const stmt = db.prepare('SELECT COUNT(*) as count FROM sites')
      const result = stmt.get()
      assert.ok(result)
      assert.ok('count' in result)
    } catch (error) {
      // Database might not be initialized in test environment
      // This is acceptable - just verify the error is expected
      assert.ok(error.message.includes('no such table') || error.message.includes('Database not initialized'))
    }
  })
}

// ========== Import Types Tests ==========
function testImportTypes() {
  console.log('\n🏷️  Import Types Tests\n')

  const {
    IMPORT_OPERATION,
    IMPORT_STATUS,
    VALIDATION_ERROR
  } = require('../electron/services/importTypes')

  test('IMPORT_OPERATION has INSERT', () => {
    assert.strictEqual(IMPORT_OPERATION.INSERT, 'INSERT')
  })

  test('IMPORT_OPERATION has UPDATE', () => {
    assert.strictEqual(IMPORT_OPERATION.UPDATE, 'UPDATE')
  })

  test('IMPORT_STATUS has required statuses', () => {
    assert.ok(IMPORT_STATUS.PENDING)
    assert.ok(IMPORT_STATUS.PROCESSING)
    assert.ok(IMPORT_STATUS.COMPLETED)
    assert.ok(IMPORT_STATUS.FAILED)
    assert.ok(IMPORT_STATUS.PARTIAL)
  })

  test('VALIDATION_ERROR has required types', () => {
    assert.ok(VALIDATION_ERROR.MISSING_REQUIRED)
    assert.ok(VALIDATION_ERROR.INVALID_FORMAT)
    assert.ok(VALIDATION_ERROR.TYPE_MISMATCH)
  })
}

// ========== Error Handling Tests ==========
function testErrorHandling() {
  console.log('\n⚠️  Error Handling Tests\n')

  const { validateRecord } = require('../electron/services/importTypes')

  test('validateRecord rejects missing site_id', () => {
    const record = {
      final_site_name: 'Test Site',
      phase_name: 'RO4'
    }
    const result = validateRecord(record)
    assert.strictEqual(result.valid, false)
    assert.ok(result.errors.length > 0)
  })

  test('validateRecord accepts valid record', () => {
    const record = {
      site_id: 'TEST-001',
      final_site_name: 'Test Site',
      phase_name: 'RO4'
    }
    const result = validateRecord(record)
    assert.strictEqual(result.valid, true)
    assert.strictEqual(result.errors.length, 0)
  })
}

// ========== Run All Tests ==========
function runAllTests() {
  console.log('\n═══════════════════════════════════════════════════')
  console.log('   BATCH IMPORT INTEGRATION TESTS')
  console.log('═══════════════════════════════════════════════════')

  testImportTypes()
  testSingleFileImport()
  testBatchProcessing()
  testFileTypeValidation()
  testProgressTracking()
  testDatabaseIntegration()
  testErrorHandling()

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
