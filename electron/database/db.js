/**
 * DatabaseManager - Hybrid SQLite/Supabase interface
 *
 * Supports both SQLite (local) and Supabase (cloud) based on DATABASE_TYPE env var.
 */

const path = require('path')
const SupabaseAdapter = require('./adapters/supabaseAdapter')
const SQLiteAdapter = require('./adapters/sqliteAdapter')

class DatabaseManager {
  constructor() {
    this.adapter = null
  }

  /**
   * Initialize database with SQLite or Supabase adapter
   * @param {Object} config - Configuration
   * @returns {Promise<boolean>} Success status
   */
  async initialize(config = {}) {
    try {
      const dbType = process.env.DATABASE_TYPE || 'sqlite'
      
      console.log(`🔧 Initializing database: ${dbType.toUpperCase()}`)

      if (dbType === 'supabase') {
        // Supabase mode
        this.adapter = new SupabaseAdapter(config)
        const initialized = await this.adapter.initialize()

        if (!initialized) {
          throw new Error('Failed to initialize Supabase adapter')
        }

        console.log('✅ Database initialized with Supabase')
      } else {
        // SQLite mode (default)
        const dbPath = config.path || path.join(__dirname, 'db', 'tssr.db')
        this.adapter = new SQLiteAdapter({ path: dbPath })
        await this.adapter.initialize()
        
        console.log('✅ Database initialized with SQLite:', dbPath)
      }

      return true
    } catch (error) {
      console.error('❌ Database initialization error:', error)
      return false
    }
  }

  /**
   * Get the current database adapter instance
   * @returns {Object} Current adapter
   */
  getAdapter() {
    return this.adapter
  }

  /**
   * Get adapter type
   * @returns {string} 'sqlite' or 'supabase'
   */
  getAdapterType() {
    return this.adapter ? this.adapter.getType() : 'unknown'
  }

  /**
   * Legacy method for compatibility
   * @returns {Object} This instance
   */
  getDB() {
    return this
  }

  /**
   * Prepare a statement
   * @param {string} sql - SQL query string
   * @returns {Object} Statement object
   */
  prepare(sql) {
    if (!this.adapter) {
      throw new Error('Database not initialized')
    }
    return this.adapter.prepare(sql)
  }

  /**
   * Execute SQL directly
   * @param {string} sql - SQL query string
   */
  exec(sql) {
    if (!this.adapter) {
      throw new Error('Database not initialized')
    }
    return this.adapter.exec(sql)
  }

  /**
   * Execute a transaction
   * @param {Function} fn - Transaction function
   * @returns {Function} Transaction wrapper
   */
  transaction(fn) {
    if (!this.adapter) {
      throw new Error('Database not initialized')
    }
    return this.adapter.transaction(fn)
  }

  /**
   * Create a database backup
   * @returns {Promise<string>} Backup identifier
   */
  async backup() {
    if (!this.adapter) {
      throw new Error('Database not initialized')
    }
    return this.adapter.backup()
  }

  /**
   * Close database connection
   */
  close() {
    if (this.adapter) {
      this.adapter.close()
      console.log('✅ Database connection closed')
    }
  }

  /**
   * Save
   */
  save() {
    if (this.adapter && this.adapter.save) {
      return this.adapter.save()
    }
    return true
  }

  /**
   * Pragma (SQLite only)
   */
  pragma(sql) {
    if (this.adapter && this.adapter.pragma) {
      return this.adapter.pragma(sql)
    }
    console.warn('⚠️ PRAGMA commands only supported in SQLite')
  }
}

// Singleton instance
const dbManager = new DatabaseManager()

module.exports = dbManager
