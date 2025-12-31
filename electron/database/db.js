/**
 * DatabaseManager - Unified database interface using adapter pattern
 *
 * Supports both SQLite (offline, local) and Supabase (cloud, real-time) databases.
 * The adapter can be switched via configuration without changing application code.
 */

const path = require('path')
const fs = require('fs')
const SQLiteAdapter = require('./adapters/sqliteAdapter')
const SupabaseAdapter = require('./adapters/supabaseAdapter')

class DatabaseManager {
  constructor() {
    this.adapter = null
    this.adapterType = null
  }

  /**
   * Initialize database with selected adapter
   * @param {string} type - Adapter type: 'sqlite' or 'supabase'
   * @param {Object} config - Configuration for the adapter
   * @returns {Promise<boolean>} Success status
   */
  async initialize(type = 'sqlite', config = {}) {
    try {
      // Determine adapter type from environment or parameter
      this.adapterType = type || process.env.DATABASE_TYPE || 'sqlite'

      console.log(`🔧 Initializing database with ${this.adapterType} adapter...`)

      // Create appropriate adapter
      if (this.adapterType === 'supabase') {
        this.adapter = new SupabaseAdapter(config)
      } else {
        this.adapter = new SQLiteAdapter()
      }

      // Initialize the adapter
      const initialized = await this.adapter.initialize()

      if (!initialized) {
        throw new Error(`Failed to initialize ${this.adapterType} adapter`)
      }

      // Run migrations (SQLite only for now)
      if (this.adapterType === 'sqlite') {
        this.runMigrations()
      }

      console.log(`✅ Database initialized with ${this.adapterType} adapter`)
      return true
    } catch (error) {
      console.error('❌ Database initialization error:', error)
      return false
    }
  }

  /**
   * Run database migrations (SQLite only)
   * For Supabase, migrations should be managed through Supabase dashboard
   */
  runMigrations() {
    if (this.adapterType !== 'sqlite') {
      console.log('ℹ️ Migrations for Supabase should be managed through Supabase dashboard')
      return
    }

    const migrationsDir = path.join(__dirname, 'migrations')

    if (!fs.existsSync(migrationsDir)) {
      console.log('No migrations directory found')
      return
    }

    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort()

    migrationFiles.forEach((file) => {
      const migrationPath = path.join(migrationsDir, file)
      const sql = fs.readFileSync(migrationPath, 'utf8')

      // Remove comments and split into statements
      const cleanSql = sql
        .split('\n')
        .map(line => line.replace(/--.*$/, '').trim())
        .join('\n')

      const statements = cleanSql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0)

      let successCount = 0
      statements.forEach((statement) => {
        try {
          this.adapter.exec(statement)
          successCount++
        } catch (error) {
          // Ignore "already exists" or "duplicate column" errors
          if (!error.message.includes('already exists') &&
              !error.message.includes('duplicate column') &&
              !error.message.includes('UNIQUE constraint failed')) {
            console.error(`❌ Migration ${file} statement failed:`, error.message)
          }
        }
      })
      console.log(`✅ Migration ${file}: ${successCount}/${statements.length} statements executed`)
    })

    // Save after migrations (SQLite only)
    if (this.adapter.save) {
      this.adapter.save()
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
    return this.adapterType
  }

  /**
   * Legacy method for compatibility
   * @returns {Object} This instance
   */
  getDB() {
    return this
  }

  /**
   * Prepare a SQL statement
   * @param {string} sql - SQL query string
   * @returns {Object} Statement object with run(), get(), all() methods
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
   * @returns {Promise<string>} Backup path or identifier
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
   * Switch database adapter
   * WARNING: This will close current connection and reinitialize
   * @param {string} newType - New adapter type ('sqlite' or 'supabase')
   * @param {Object} config - Configuration for new adapter
   * @returns {Promise<boolean>} Success status
   */
  async switchAdapter(newType, config = {}) {
    console.log(`🔄 Switching from ${this.adapterType} to ${newType} adapter...`)

    // Close current adapter
    if (this.adapter) {
      this.adapter.close()
    }

    // Reinitialize with new adapter
    return await this.initialize(newType, config)
  }

  /**
   * Save database to disk (SQLite only)
   * CRITICAL: Must be called after data modifications!
   */
  save() {
    if (this.adapter && this.adapter.save) {
      this.adapter.save()
      console.log('💾 Database saved to disk')
      return true
    }
    return false
  }

  pragma(sql) {
    // Only supported in SQLite
    if (this.adapterType === 'sqlite' && this.adapter.getSqlite) {
      try {
        const db = this.adapter.getSqlite()
        db.run(`PRAGMA ${sql}`)
      } catch (error) {
        console.error('Pragma error:', error.message)
      }
    } else {
      console.warn('⚠️ PRAGMA commands are SQLite-specific and not supported in Supabase')
    }
  }
}

// Singleton instance
const dbManager = new DatabaseManager()

module.exports = dbManager
