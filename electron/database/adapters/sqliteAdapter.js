/**
 * SQLiteAdapter - Database adapter for SQLite (Desktop/Local)
 *
 * Implements local database functionality using better-sqlite3 or sql.js.
 * Designed for Electron desktop application with offline support.
 *
 * Installation:
 *   npm install better-sqlite3
 *   # OR for web/testing:
 *   npm install sql.js
 *
 * @author TSSR Monitor Team
 */

const BaseAdapter = require('./baseAdapter')
const path = require('path')
const fs = require('fs')

// Check available SQLite modules
let betterSqlite3Available = false
let sqlJsAvailable = false

try {
  require.resolve('better-sqlite3')
  betterSqlite3Available = true
} catch (e) { /* not available */ }

try {
  require.resolve('sql.js')
  sqlJsAvailable = true
} catch (e) { /* not available */ }

class SQLiteAdapter extends BaseAdapter {
  constructor(config = {}) {
    super()
    this.db = null
    this.config = config
    this.dbPath = config.path || path.join(__dirname, '..', 'db', 'tssr.db')
    this.useSqlJs = config.useSqlJs || process.env.USE_SQL_JS === 'true' || false
    this.useInMemory = config.useInMemory || false
    this.adapterType = null // 'better-sqlite3', 'sql.js', or 'in-memory'
    this.autoSaveInterval = null // للحفظ التلقائي
    this.isDirty = false // هل توجد تغييرات غير محفوظة
  }

  /**
   * Initialize SQLite database
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    try {
      // Ensure directory exists
      const dbDir = path.dirname(this.dbPath)
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true })
      }

      // Try initialization in order of preference
      if (!this.useSqlJs && betterSqlite3Available) {
        await this._initializeBetterSqlite()
      } else if (sqlJsAvailable) {
        await this._initializeSqlJs()
      } else {
        // Fallback to in-memory JSON storage
        await this._initializeInMemory()
      }

      // Initialize schema
      await this._initializeSchema()

      console.log(`✅ SQLite database initialized (${this.adapterType}):`, this.dbPath)
      return true
    } catch (error) {
      console.error('❌ SQLite initialization error:', error.message)
      return false
    }
  }

  /**
   * Initialize using better-sqlite3 (preferred for Electron)
   * @private
   */
  async _initializeBetterSqlite() {
    try {
      const Database = require('better-sqlite3')

      // Check if file exists and is corrupted
      if (fs.existsSync(this.dbPath)) {
        try {
          // Try to open and verify the database
          const testDb = new Database(this.dbPath, { readonly: true })
          testDb.pragma('integrity_check')
          testDb.close()
        } catch (corruptError) {
          console.warn('⚠️ Existing database is corrupted, creating new one')
          // Backup corrupted file
          const backupPath = this.dbPath + '.corrupted.' + Date.now()
          fs.renameSync(this.dbPath, backupPath)
          console.log('   Corrupted file backed up to:', backupPath)
        }
      }

      this.db = new Database(this.dbPath)
      this.db.pragma('journal_mode = WAL')
      this.db.pragma('foreign_keys = ON')
      this.adapterType = 'better-sqlite3'
      console.log('✅ better-sqlite3 initialized successfully')
    } catch (error) {
      console.warn('⚠️ better-sqlite3 failed:', error.message)
      if (sqlJsAvailable) {
        this.useSqlJs = true
        await this._initializeSqlJs()
      } else {
        await this._initializeInMemory()
      }
    }
  }

  /**
   * Initialize using sql.js (fallback for web/testing)
   * @private
   */
  async _initializeSqlJs() {
    try {
      const initSqlJs = require('sql.js')
      const SQL = await initSqlJs()

      // Load existing database if exists
      if (fs.existsSync(this.dbPath)) {
        const buffer = fs.readFileSync(this.dbPath)
        this.db = new SQL.Database(buffer)
      } else {
        this.db = new SQL.Database()
      }
      this.adapterType = 'sql.js'
    } catch (error) {
      console.warn('⚠️ sql.js failed, using in-memory:', error.message)
      await this._initializeInMemory()
    }
  }

  /**
   * Initialize in-memory fallback (for testing/development)
   * @private
   */
  async _initializeInMemory() {
    console.warn('⚠️ Using in-memory database (data will not persist)')
    console.warn('   Install better-sqlite3 for persistent storage: npm install better-sqlite3')

    this.adapterType = 'in-memory'
    this.inMemoryData = {
      sites: [],
      users: [],
      rejections: [],
      change_requests: [],
      settings: [],
      phases: [],
      contractors: [],
      import_history: [],
      audit_log: []
    }

    // Create a mock db interface
    this.db = {
      inMemory: true,
      data: this.inMemoryData
    }
  }

  /**
   * Initialize database schema
   * @private
   */
  async _initializeSchema() {
    // Skip schema creation for in-memory mode (tables are already initialized)
    if (this.adapterType === 'in-memory') {
      return
    }

    const { generateCreateTableSQL } = require('../../columnDefinitions')

    // Create sites table
    const createSitesSQL = generateCreateTableSQL('sites')
    this.exec(createSitesSQL)

    // Create additional tables
    this.exec(`
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        contractor_name TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      -- Rejections table
      CREATE TABLE IF NOT EXISTS rejections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        site_id TEXT NOT NULL,
        phase_name TEXT,
        rejection_reason TEXT,
        department TEXT,
        rejected_by TEXT,
        rejection_date TEXT DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'pending',
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      -- Change requests table
      CREATE TABLE IF NOT EXISTS change_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        site_id TEXT NOT NULL,
        request_type TEXT,
        old_value TEXT,
        new_value TEXT,
        field_name TEXT,
        requested_by TEXT,
        approved_by TEXT,
        status TEXT DEFAULT 'pending',
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      -- Settings table
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT,
        category TEXT DEFAULT 'general',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      -- Phases table
      CREATE TABLE IF NOT EXISTS phases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'active',
        priority INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      -- Import history table
      CREATE TABLE IF NOT EXISTS import_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT,
        records_imported INTEGER,
        records_updated INTEGER,
        records_failed INTEGER,
        imported_by TEXT,
        import_date TEXT DEFAULT CURRENT_TIMESTAMP,
        notes TEXT
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_sites_site_id ON sites(site_id);
      CREATE INDEX IF NOT EXISTS idx_sites_phase_name ON sites(phase_name);
      CREATE INDEX IF NOT EXISTS idx_sites_tssr_subcon ON sites(tssr_subcon);
      CREATE INDEX IF NOT EXISTS idx_sites_governorate ON sites(governorate);
      CREATE INDEX IF NOT EXISTS idx_sites_cluster ON sites(cluster);
      CREATE INDEX IF NOT EXISTS idx_rejections_site_id ON rejections(site_id);
      CREATE INDEX IF NOT EXISTS idx_change_requests_site_id ON change_requests(site_id);
    `)
    
    // CRITICAL: Start auto-save interval for sql.js and in-memory modes
    if (this.adapterType === 'sql.js' || this.adapterType === 'in-memory') {
      this._startAutoSave()
    }
  }

  /**
   * Start auto-save interval (for sql.js and in-memory modes)
   * @private
   */
  _startAutoSave() {
    // Auto-save every 30 seconds
    const saveInterval = 30000
    
    this.autoSaveInterval = setInterval(() => {
      if (this.isDirty) {
        this.save()
        this.isDirty = false
        console.log('💾 Auto-save: SQLite data saved to disk')
      }
    }, saveInterval)
    
    console.log('⏰ Auto-save enabled: saving every 30 seconds')
  }

  /**
   * Stop auto-save interval
   * @private
   */
  _stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval)
      this.autoSaveInterval = null
      console.log('⏰ Auto-save disabled')
    }
  }

  /**
   * Mark database as dirty (has unsaved changes)
   * @private
   */
  _markDirty() {
    this.isDirty = true
  }

  /**
   * Prepare a SQL statement
   * @param {string} sql - SQL query string
   * @returns {Object} Statement object with run(), get(), all() methods
   */
  prepare(sql) {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    // In-memory mode
    if (this.adapterType === 'in-memory') {
      return this._prepareInMemory(sql)
    }

    // sql.js mode
    if (this.adapterType === 'sql.js') {
      return this._prepareSqlJs(sql)
    }

    // better-sqlite3 style
    return this.db.prepare(sql)
  }

  /**
   * Prepare statement for in-memory mode
   * @private
   */
  _prepareInMemory(sql) {
    const self = this
    const upperSql = sql.toUpperCase().trim()

    return {
      run: (...params) => {
        // Parse and execute INSERT/UPDATE/DELETE
        let result
        if (upperSql.startsWith('INSERT')) {
          result = self._inMemoryInsert(sql, params)
        } else if (upperSql.startsWith('UPDATE')) {
          result = self._inMemoryUpdate(sql, params)
        } else if (upperSql.startsWith('DELETE')) {
          result = self._inMemoryDelete(sql, params)
        } else {
          result = { changes: 0 }
        }
        
        if (result.changes > 0) {
          self._markDirty() // Mark for auto-save
        }
        
        return result
      },
      get: (...params) => {
        const results = self._inMemorySelect(sql, params)
        return results[0] || undefined
      },
      all: (...params) => {
        return self._inMemorySelect(sql, params)
      }
    }
  }

  /**
   * In-memory SELECT
   * @private
   */
  _inMemorySelect(sql, params) {
    const tableMatch = sql.match(/FROM\s+(\w+)/i)
    if (!tableMatch) return []

    const tableName = tableMatch[1]
    const data = this.inMemoryData[tableName] || []

    // Simple WHERE parsing
    const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|\s*$)/i)
    if (whereMatch) {
      const whereClause = whereMatch[1]
      // Handle simple equality: column = ?
      const conditions = whereClause.split(/\s+AND\s+/i)
      let paramIndex = 0

      return data.filter(row => {
        return conditions.every(cond => {
          const eqMatch = cond.match(/(\w+)\s*=\s*\?/)
          if (eqMatch) {
            const col = eqMatch[1]
            const val = params[paramIndex++]
            return row[col] === val
          }
          return true
        })
      })
    }

    return [...data]
  }

  /**
   * In-memory INSERT
   * @private
   */
  _inMemoryInsert(sql, params) {
    const tableMatch = sql.match(/INTO\s+(\w+)/i)
    if (!tableMatch) return { changes: 0 }

    const tableName = tableMatch[1]
    if (!this.inMemoryData[tableName]) {
      this.inMemoryData[tableName] = []
    }

    const columnsMatch = sql.match(/\(([^)]+)\)\s+VALUES/i)
    if (!columnsMatch) return { changes: 0 }

    const columns = columnsMatch[1].split(',').map(c => c.trim())
    const newRow = { id: this.inMemoryData[tableName].length + 1 }

    columns.forEach((col, i) => {
      newRow[col] = params[i]
    })

    newRow.created_at = new Date().toISOString()
    newRow.updated_at = new Date().toISOString()

    this.inMemoryData[tableName].push(newRow)
    return { changes: 1 }
  }

  /**
   * In-memory UPDATE
   * @private
   */
  _inMemoryUpdate(sql, params) {
    const tableMatch = sql.match(/UPDATE\s+(\w+)/i)
    if (!tableMatch) return { changes: 0 }

    const tableName = tableMatch[1]
    const data = this.inMemoryData[tableName] || []

    // Simple implementation - update all matching rows
    let changes = 0
    data.forEach(row => {
      // In a real implementation, we'd parse the WHERE clause
      changes++
    })

    return { changes }
  }

  /**
   * In-memory DELETE
   * @private
   */
  _inMemoryDelete(sql, params) {
    const tableMatch = sql.match(/FROM\s+(\w+)/i)
    if (!tableMatch) return { changes: 0 }

    const tableName = tableMatch[1]
    const beforeCount = (this.inMemoryData[tableName] || []).length

    // Simple: delete all if no WHERE, otherwise parse WHERE
    const whereMatch = sql.match(/WHERE\s+(.+)/i)
    if (!whereMatch) {
      this.inMemoryData[tableName] = []
    }

    return { changes: beforeCount - (this.inMemoryData[tableName] || []).length }
  }

  /**
   * Prepare statement for sql.js
   * @private
   */
  _prepareSqlJs(sql) {
    const self = this
    return {
      run: (...params) => {
        self.db.run(sql, params)
        self._markDirty() // Mark for auto-save
        return { changes: self.db.getRowsModified() }
      },
      get: (...params) => {
        const stmt = self.db.prepare(sql)
        stmt.bind(params)
        if (stmt.step()) {
          const row = stmt.getAsObject()
          stmt.free()
          return row
        }
        stmt.free()
        return undefined
      },
      all: (...params) => {
        const results = []
        const stmt = self.db.prepare(sql)
        stmt.bind(params)
        while (stmt.step()) {
          results.push(stmt.getAsObject())
        }
        stmt.free()
        return results
      }
    }
  }

  /**
   * Execute SQL directly
   * @param {string} sql - SQL query string
   */
  exec(sql) {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    // In-memory mode - no-op for schema creation
    if (this.adapterType === 'in-memory') {
      return
    }

    if (this.adapterType === 'sql.js') {
      this.db.exec(sql)
    } else {
      this.db.exec(sql)
    }
  }

  /**
   * Execute a transaction
   * @param {Function} fn - Transaction function
   * @returns {Function} Transaction wrapper
   */
  transaction(fn) {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    // In-memory mode - just execute directly
    if (this.adapterType === 'in-memory') {
      return (data) => fn(data)
    }

    if (this.adapterType === 'sql.js') {
      // sql.js doesn't have native transaction support
      return (data) => {
        try {
          this.exec('BEGIN TRANSACTION')
          fn(data)
          this.exec('COMMIT')
        } catch (error) {
          this.exec('ROLLBACK')
          throw error
        }
      }
    }

    // better-sqlite3 transaction
    return this.db.transaction(fn)
  }

  /**
   * Execute PRAGMA command
   * @param {string} pragma - PRAGMA statement
   */
  pragma(pragma) {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    // In-memory mode - no-op
    if (this.adapterType === 'in-memory') {
      return
    }

    if (this.adapterType === 'sql.js') {
      this.db.exec(`PRAGMA ${pragma}`)
    } else {
      return this.db.pragma(pragma)
    }
  }

  /**
   * Save database to disk (for sql.js)
   */
  save() {
    // In-memory mode - save to JSON file
    if (this.adapterType === 'in-memory') {
      try {
        const jsonPath = this.dbPath.replace('.db', '.json')
        fs.writeFileSync(jsonPath, JSON.stringify(this.inMemoryData, null, 2))
        return true
      } catch (e) {
        console.error('Failed to save in-memory data:', e.message)
        return false
      }
    }

    if (this.adapterType === 'sql.js' && this.db) {
      const data = this.db.export()
      const buffer = Buffer.from(data)
      fs.writeFileSync(this.dbPath, buffer)
      return true
    }
    return true // better-sqlite3 auto-saves
  }

  /**
   * Create database backup
   * @returns {Promise<string>} Backup file path
   */
  async backup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupPath = this.dbPath.replace('.db', `_backup_${timestamp}.db`)

      // In-memory mode - save JSON backup
      if (this.adapterType === 'in-memory') {
        const jsonBackupPath = backupPath.replace('.db', '.json')
        fs.writeFileSync(jsonBackupPath, JSON.stringify(this.inMemoryData, null, 2))
        console.log('✅ In-memory backup created:', jsonBackupPath)
        return jsonBackupPath
      }

      if (this.adapterType === 'sql.js') {
        this.save()
        fs.copyFileSync(this.dbPath, backupPath)
      } else if (this.db.backup) {
        await this.db.backup(backupPath)
      } else {
        // Fallback for older better-sqlite3 versions
        fs.copyFileSync(this.dbPath, backupPath)
      }

      console.log('✅ Backup created:', backupPath)
      return backupPath
    } catch (error) {
      console.error('❌ Backup failed:', error.message)
      throw error
    }
  }

  /**
   * Close database connection
   */
  close() {
    // Stop auto-save first
    this._stopAutoSave()
    
    if (this.db) {
      // In-memory mode - save before closing
      if (this.adapterType === 'in-memory') {
        this.save()
        this.db = null
        console.log('✅ In-memory database closed')
        return
      }

      if (this.adapterType === 'sql.js') {
        this.save()
        this.db.close()
      } else if (this.db.close) {
        this.db.close()
      }
      this.db = null
      console.log('✅ SQLite connection closed')
    }
  }

  /**
   * Get adapter type
   * @returns {string}
   */
  getType() {
    return 'sqlite'
  }

  /**
   * Get detailed adapter type
   * @returns {string}
   */
  getAdapterType() {
    return this.adapterType
  }

  /**
   * Get raw database instance
   * @returns {Object}
   */
  getDB() {
    return this.db
  }

  /**
   * Check if database is connected
   * @returns {boolean}
   */
  isConnected() {
    return this.db !== null
  }

  /**
   * Get database file path
   * @returns {string}
   */
  getPath() {
    return this.dbPath
  }

  /**
   * Get database statistics
   * @returns {Object}
   */
  getStats() {
    if (!this.db) return null

    try {
      // In-memory mode
      if (this.adapterType === 'in-memory') {
        return {
          type: 'sqlite',
          adapterType: 'in-memory',
          path: this.dbPath,
          size: 0,
          tables: {
            sites: this.inMemoryData.sites?.length || 0,
            users: this.inMemoryData.users?.length || 0,
            rejections: this.inMemoryData.rejections?.length || 0
          }
        }
      }

      const siteCount = this.prepare('SELECT COUNT(*) as count FROM sites').get()
      const userCount = this.prepare('SELECT COUNT(*) as count FROM users').get()
      const rejectionCount = this.prepare('SELECT COUNT(*) as count FROM rejections').get()

      const fileStats = fs.existsSync(this.dbPath) ? fs.statSync(this.dbPath) : null

      return {
        type: 'sqlite',
        adapterType: this.adapterType,
        path: this.dbPath,
        size: fileStats ? fileStats.size : 0,
        tables: {
          sites: siteCount?.count || 0,
          users: userCount?.count || 0,
          rejections: rejectionCount?.count || 0
        }
      }
    } catch (error) {
      console.error('Error getting stats:', error.message)
      return null
    }
  }
}

module.exports = SQLiteAdapter
