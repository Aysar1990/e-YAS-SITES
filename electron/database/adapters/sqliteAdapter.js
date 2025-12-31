/**
 * SQLiteAdapter - Database adapter for SQLite (using SQL.js)
 *
 * Wraps the existing SQL.js implementation to conform to BaseAdapter interface.
 * Provides local, offline-first database functionality.
 */

const BaseAdapter = require('./baseAdapter')
const initSqlJs = require('sql.js')
const path = require('path')
const fs = require('fs')

class SQLiteAdapter extends BaseAdapter {
  constructor() {
    super()
    this.db = null
    this.dbPath = null
    this.SQL = null
    this._inTransaction = false
    this.autoSaveInterval = null
  }

  /**
   * Initialize SQLite database connection
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    try {
      // Initialize SQL.js
      this.SQL = await initSqlJs()

      const dataDir = path.join(__dirname, '../../../data')
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true })
      }

      this.dbPath = path.join(dataDir, 'tssr.db')

      // Load existing database or create new one
      if (fs.existsSync(this.dbPath)) {
        const buffer = fs.readFileSync(this.dbPath)
        this.db = new this.SQL.Database(buffer)
        console.log('✅ SQLite database loaded from:', this.dbPath)
      } else {
        this.db = new this.SQL.Database()
        console.log('✅ New SQLite database created')
      }

      // Start auto-save
      this.startAutoSave()

      return true
    } catch (error) {
      console.error('❌ SQLite initialization error:', error)
      return false
    }
  }

  /**
   * Prepare a SQL statement for execution
   * @param {string} sql - SQL query string
   * @returns {Object} Statement object with run(), get(), all() methods
   */
  prepare(sql) {
    const self = this
    return {
      run: (...params) => {
        try {
          const stmt = self.db.prepare(sql)
          if (params.length > 0) {
            stmt.bind(params)
          }
          stmt.step()
          stmt.free()
          if (!self._inTransaction) {
            self.save()
          }
          return { changes: self.db.getRowsModified() }
        } catch (error) {
          console.error('SQL run error:', error.message)
          throw error
        }
      },
      get: (...params) => {
        try {
          const stmt = self.db.prepare(sql)
          stmt.bind(params)
          if (stmt.step()) {
            const row = stmt.getAsObject()
            stmt.free()
            return row
          }
          stmt.free()
          return undefined
        } catch (error) {
          console.error('SQL get error:', error.message)
          return undefined
        }
      },
      all: (...params) => {
        try {
          const results = []
          const stmt = self.db.prepare(sql)
          stmt.bind(params)
          while (stmt.step()) {
            results.push(stmt.getAsObject())
          }
          stmt.free()
          return results
        } catch (error) {
          console.error('SQL all error:', error.message)
          return []
        }
      }
    }
  }

  /**
   * Execute SQL directly
   * @param {string} sql - SQL query string
   */
  exec(sql) {
    try {
      this.db.exec(sql)
      this.save()
    } catch (error) {
      console.error('SQL exec error:', error.message)
      throw error
    }
  }

  /**
   * Execute a transaction
   * @param {Function} fn - Transaction function
   * @returns {Function} Transaction wrapper
   */
  transaction(fn) {
    const self = this
    return (data) => {
      try {
        self._inTransaction = true
        self.db.exec('BEGIN TRANSACTION')
        fn(data)
        self.db.exec('COMMIT')
        self._inTransaction = false
        self.save()
      } catch (error) {
        self._inTransaction = false
        try {
          self.db.exec('ROLLBACK')
        } catch (rollbackError) {
          // Ignore rollback errors
        }
        throw error
      }
    }
  }

  /**
   * Save database to disk
   */
  save() {
    if (this.db && this.dbPath) {
      try {
        const data = this.db.export()
        const buffer = Buffer.from(data)
        fs.writeFileSync(this.dbPath, buffer)
      } catch (error) {
        console.error('Failed to save database:', error)
      }
    }
  }

  /**
   * Start auto-save timer (every 30 seconds)
   */
  startAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval)
    }
    this.autoSaveInterval = setInterval(() => {
      this.save()
    }, 30000)
  }

  /**
   * Close database connection
   */
  close() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval)
      this.autoSaveInterval = null
    }
    if (this.db) {
      this.save()
      this.db.close()
      console.log('✅ SQLite database connection closed')
    }
  }

  /**
   * Create a database backup
   * @returns {Promise<string>} Backup file path
   */
  async backup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupPath = this.dbPath.replace('.db', `_backup_${timestamp}.db`)

      const data = this.db.export()
      const buffer = Buffer.from(data)
      fs.writeFileSync(backupPath, buffer)

      console.log('✅ Backup created:', backupPath)
      return backupPath
    } catch (error) {
      console.error('❌ Backup failed:', error)
      throw error
    }
  }

  /**
   * Get the underlying SQL.js database instance
   * @returns {Object} SQL.js database
   */
  getSqlite() {
    return this.db
  }

  /**
   * Get adapter type identifier
   * @returns {string} Adapter type
   */
  getType() {
    return 'sqlite'
  }
}

module.exports = SQLiteAdapter
