/**
 * TSSR Monitor - Excel Reader Unit Tests
 *
 * Tests for excelReader.js functionality
 * Run with: npm test
 *
 * @author TSSR Monitor Team
 */

const path = require('path')
const fs = require('fs')

// Import the module
const excelReader = require('./excelReader')
const { ExcelReader, EXPECTED } = require('./excelReader')

// Test file path (update to your actual test file)
const TEST_FILE_PATH = path.join(__dirname, '../../TSSR Tracker Zain Jo 5.xlsm')
const TEMPLATE_FILE_PATH = path.join(__dirname, '../../TSSR_Template_RO4.xlsx')

// Mock console for cleaner test output
const originalConsole = { ...console }
const mockConsole = () => {
  console.log = jest.fn()
  console.warn = jest.fn()
  console.error = jest.fn()
}
const restoreConsole = () => {
  console.log = originalConsole.log
  console.warn = originalConsole.warn
  console.error = originalConsole.error
}

describe('ExcelReader Module', () => {
  beforeEach(() => {
    excelReader.reset()
  })

  describe('EXPECTED configuration', () => {
    test('should have correct expected values', () => {
      expect(EXPECTED.TOTAL_ROWS_MIN).toBe(3000)
      expect(EXPECTED.TOTAL_ROWS_EXPECTED).toBe(3791)
      expect(EXPECTED.REQUIRED_FIELDS).toContain('Site ID')
      expect(EXPECTED.REQUIRED_FIELDS).toContain('Final Site Name')
    })
  })

  describe('File validation', () => {
    test('should return false for non-existent file', () => {
      const result = excelReader.readFile('/nonexistent/file.xlsx')
      expect(result).toBe(false)
      expect(excelReader.getErrors()).toContain(expect.stringContaining('not found'))
    })

    test('should handle invalid file gracefully', () => {
      // Create a temp invalid file
      const tempPath = path.join(__dirname, 'temp_invalid.txt')
      fs.writeFileSync(tempPath, 'not an excel file')

      try {
        const result = excelReader.readFile(tempPath)
        expect(result).toBe(false)
      } finally {
        fs.unlinkSync(tempPath)
      }
    })
  })

  describe('Auto Filter handling', () => {
    test('should clear auto filters from worksheet', () => {
      // Create a mock worksheet with auto filter
      excelReader.worksheet = {
        '!autofilter': { ref: 'A1:Z100' },
        '!ref': 'A1:Z100'
      }

      excelReader.clearAutoFilters()

      expect(excelReader.worksheet['!autofilter']).toBeUndefined()
    })

    test('should clear hidden rows', () => {
      excelReader.worksheet = {
        '!rows': [
          { hidden: true },
          { hidden: false },
          { hidden: true }
        ],
        '!ref': 'A1:Z100'
      }

      excelReader.clearAutoFilters()

      excelReader.worksheet['!rows'].forEach(row => {
        if (row) {
          expect(row.hidden).toBe(false)
        }
      })
    })
  })

  describe('Header detection', () => {
    test('should find Site ID header', () => {
      // Mock worksheet with Site ID at row 3
      excelReader.worksheet = {
        '!ref': 'A1:E10',
        'A3': { v: 'Site ID' },
        'B3': { v: 'Final Site Name' }
      }

      const headerRow = excelReader.findHeaderRow()
      expect(headerRow).toBe(2) // 0-indexed
    })

    test('should default to row 3 if Site ID not found', () => {
      excelReader.worksheet = {
        '!ref': 'A1:E10',
        'A1': { v: 'Something else' }
      }

      const headerRow = excelReader.findHeaderRow()
      expect(headerRow).toBe(2) // Default TSSR standard
    })
  })

  describe('Data validation', () => {
    test('should validate data correctly', () => {
      const validData = [
        { siteId: 'SITE001', phaseName: 'RO4', tssrOverallStatus: 'Approved' },
        { siteId: 'SITE002', phaseName: 'RO4', tssrOverallStatus: 'Pending' },
        { siteId: 'SITE003', phaseName: 'RO5', tssrOverallStatus: 'Approved' }
      ]

      const result = excelReader.validateData(validData)
      expect(result.errors.length).toBeGreaterThan(0) // Less than 3000 rows
      expect(result.stats.totalSites).toBe(3)
    })

    test('should detect duplicate site IDs within same phase', () => {
      const dataWithDuplicates = [
        { siteId: 'SITE001', phaseName: 'RO4' },
        { siteId: 'SITE001', phaseName: 'RO4' }, // Duplicate
        { siteId: 'SITE001', phaseName: 'RO5' }  // Different phase, OK
      ]

      const result = excelReader.validateData(dataWithDuplicates)
      expect(result.warnings).toContain(expect.stringContaining('duplicate'))
    })
  })

  describe('Checksum calculation', () => {
    test('should generate consistent checksums', () => {
      const data = [
        { siteId: 'SITE001', phaseName: 'RO4', tssrOverallStatus: 'Approved' },
        { siteId: 'SITE002', phaseName: 'RO4', tssrOverallStatus: 'Pending' }
      ]

      const checksum1 = excelReader.calculateChecksum(data)
      const checksum2 = excelReader.calculateChecksum(data)

      expect(checksum1).toBe(checksum2)
      expect(checksum1).toHaveLength(32) // MD5 hash length
    })

    test('should generate different checksums for different data', () => {
      const data1 = [{ siteId: 'SITE001', phaseName: 'RO4', tssrOverallStatus: 'Approved' }]
      const data2 = [{ siteId: 'SITE001', phaseName: 'RO4', tssrOverallStatus: 'Pending' }]

      const checksum1 = excelReader.calculateChecksum(data1)
      const checksum2 = excelReader.calculateChecksum(data2)

      expect(checksum1).not.toBe(checksum2)
    })
  })
})

// Integration tests (only run if test file exists)
describe('ExcelReader Integration Tests', () => {
  const testFilePath = fs.existsSync(TEST_FILE_PATH) ? TEST_FILE_PATH :
                       fs.existsSync(TEMPLATE_FILE_PATH) ? TEMPLATE_FILE_PATH : null

  beforeEach(() => {
    excelReader.reset()
  })

  if (testFilePath) {
    test('should read actual Excel file', () => {
      const data = excelReader.getAllData(testFilePath)

      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)

      // Check first site has required fields
      const firstSite = data[0]
      expect(firstSite).toHaveProperty('siteId')
      expect(firstSite.siteId).toBeTruthy()
    })

    test('should generate read statistics', () => {
      excelReader.getAllData(testFilePath)
      const stats = excelReader.getLastReadStats()

      expect(stats).not.toBeNull()
      expect(stats.totalValidSites).toBeGreaterThan(0)
      expect(stats.checksum).toBeTruthy()
      expect(stats.timestamp).toBeTruthy()
    })

    test('should handle Phase Name correctly', () => {
      const data = excelReader.getAllData(testFilePath)
      const stats = excelReader.getLastReadStats()

      if (stats.phaseBreakdown) {
        expect(Object.keys(stats.phaseBreakdown).length).toBeGreaterThan(0)
      }
    })

    test('should handle Part Of column correctly', () => {
      const data = excelReader.getAllData(testFilePath)
      const stats = excelReader.getLastReadStats()

      if (stats.partOfBreakdown) {
        expect(Object.keys(stats.partOfBreakdown).length).toBeGreaterThan(0)
      }
    })

    test('should read all expected rows (no Auto Filter issue)', () => {
      const data = excelReader.getAllData(testFilePath)
      const stats = excelReader.getLastReadStats()

      console.log(`Read ${data.length} sites from ${testFilePath}`)

      // Check that we read a reasonable number of rows
      // This would fail if Auto Filters were hiding rows
      expect(data.length).toBeGreaterThan(100)
    })
  } else {
    test.skip('Skipping integration tests - no test file available', () => {})
  }
})

// Performance tests
describe('ExcelReader Performance', () => {
  const testFilePath = fs.existsSync(TEST_FILE_PATH) ? TEST_FILE_PATH :
                       fs.existsSync(TEMPLATE_FILE_PATH) ? TEMPLATE_FILE_PATH : null

  if (testFilePath) {
    test('should read file in reasonable time', () => {
      const startTime = Date.now()
      excelReader.getAllData(testFilePath)
      const endTime = Date.now()

      const duration = endTime - startTime
      console.log(`Read completed in ${duration}ms`)

      // Should complete in less than 30 seconds
      expect(duration).toBeLessThan(30000)
    })
  } else {
    test.skip('Skipping performance tests - no test file available', () => {})
  }
})
