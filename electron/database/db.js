/**
 * DatabaseManager - Hybrid SQLite/Supabase with Auto-Switching
 *
 * Automatically switches between:
 *   - Online: Supabase (cloud database)
 *   - Offline: SQLite (local database)
 *
 * Features:
 *   - Auto-detection of network status
 *   - Automatic failover to SQLite when offline
 *   - Data synchronization when coming back online
 *   - Queue for offline operations
 *
 * @author TSSR Monitor Team
 * @version 2.0
 */

const path = require('path')
const fs = require('fs')
const EventEmitter = require('events')

class DatabaseManager extends EventEmitter {
  constructor() {
    super()
    this.sqliteAdapter = null
    this.supabaseAdapter = null
    this.currentAdapter = null
    this.initialized = false
    this.isOnline = true
    this.config = {}
    this.syncQueue = []
    this.isSyncing = false
    this.networkCheckInterval = null
    this.lastSyncTime = null

    // Retry configuration
    this.maxRetries = 5
    this.baseRetryDelay = 1000  // 1 second
    this.maxRetryDelay = 60000  // 1 minute max

    // Conflict resolution
    this.conflictStrategy = 'server-wins'  // 'server-wins', 'client-wins', 'newest-wins', 'manual'
    this.pendingConflicts = []
  }

  /**
   * Initialize database with automatic online/offline switching
   * @param {Object} config - Configuration options
   * @returns {Promise<boolean>} Success status
   */
  async initialize(config = {}) {
    try {
      this.config = config

      console.log('🔧 Initializing Hybrid Database Manager...')

      // Always initialize SQLite first (for offline support)
      await this._initializeSQLite(config)

      // Try to initialize Supabase (for online support)
      const supabaseReady = await this._initializeSupabase(config)

      // Check initial network status
      this.isOnline = await this._checkNetworkStatus()

      if (this.isOnline && supabaseReady) {
        this.currentAdapter = this.supabaseAdapter
        console.log('✅ Database Mode: ONLINE (Supabase)')
      } else {
        this.currentAdapter = this.sqliteAdapter
        console.log('✅ Database Mode: OFFLINE (SQLite)')
      }

      // Start network monitoring
      this._startNetworkMonitoring()

      // Load pending sync queue
      await this._loadSyncQueue()

      this.initialized = true
      this.emit('initialized', { mode: this.isOnline ? 'online' : 'offline' })

      return true
    } catch (error) {
      console.error('❌ Database initialization error:', error.message)
      this.initialized = false
      return false
    }
  }

  /**
   * Initialize SQLite adapter
   * @private
   */
  async _initializeSQLite(config) {
    const SQLiteAdapter = require('./adapters/sqliteAdapter')

    const dbPath = config.sqlitePath ||
      process.env.SQLITE_PATH ||
      path.join(__dirname, '..', '..', 'data', 'tssr.db')

    const dataDir = path.dirname(dbPath)
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }

    this.sqliteAdapter = new SQLiteAdapter({
      path: dbPath,
      useSqlJs: config.useSqlJs || false
    })

    const initialized = await this.sqliteAdapter.initialize()
    if (!initialized) {
      throw new Error('Failed to initialize SQLite adapter')
    }

    console.log('✅ SQLite adapter ready:', dbPath)

    // Initialize sync_queue table
    this._initSyncQueueTable()

    // Initialize conflicts table
    this._initConflictsTable()

    return true
  }

  /**
   * Initialize sync queue table in SQLite
   * @private
   */
  _initSyncQueueTable() {
    try {
      this.sqliteAdapter.exec(`
        CREATE TABLE IF NOT EXISTS sync_queue (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          table_name TEXT NOT NULL,
          data TEXT,
          where_clause TEXT,
          conflict_columns TEXT,
          retry_count INTEGER DEFAULT 0,
          max_retries INTEGER DEFAULT 5,
          last_error TEXT,
          next_retry_at TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT
        )
      `)
      console.log('✅ Sync queue table ready')
    } catch (error) {
      console.error('❌ Failed to create sync_queue table:', error.message)
    }
  }

  /**
   * Initialize conflicts table in SQLite
   * @private
   */
  _initConflictsTable() {
    try {
      this.sqliteAdapter.exec(`
        CREATE TABLE IF NOT EXISTS sync_conflicts (
          id TEXT PRIMARY KEY,
          table_name TEXT NOT NULL,
          record_id TEXT NOT NULL,
          local_data TEXT NOT NULL,
          server_data TEXT NOT NULL,
          conflict_type TEXT NOT NULL,
          field_conflicts TEXT,
          status TEXT DEFAULT 'pending',
          resolved_by TEXT,
          resolution TEXT,
          created_at TEXT NOT NULL,
          resolved_at TEXT
        )
      `)
      console.log('✅ Conflicts table ready')
    } catch (error) {
      console.error('❌ Failed to create sync_conflicts table:', error.message)
    }
  }

  /**
   * Initialize Supabase adapter
   * @private
   */
  async _initializeSupabase(config) {
    try {
      const SupabaseAdapter = require('./adapters/supabaseAdapter')

      const url = config.supabaseUrl || process.env.SUPABASE_URL
      const key = config.supabaseKey || process.env.SUPABASE_ANON_KEY

      if (!url || !key) {
        console.warn('⚠️ Supabase credentials not configured. Online mode disabled.')
        return false
      }

      this.supabaseAdapter = new SupabaseAdapter({ url, key })
      const initialized = await this.supabaseAdapter.initialize()

      if (initialized) {
        console.log('✅ Supabase adapter ready')
        return true
      }

      console.warn('⚠️ Supabase connection failed. Online mode disabled.')
      return false
    } catch (error) {
      console.warn('⚠️ Supabase initialization error:', error.message)
      return false
    }
  }

  /**
   * Check network status
   * @private
   */
  async _checkNetworkStatus() {
    // If no Supabase adapter, always offline
    if (!this.supabaseAdapter) return false

    try {
      // Try a simple query to check connection
      const supabase = this.supabaseAdapter.getSupabase()
      if (!supabase) return false

      const { error } = await supabase
        .from('sites')
        .select('count', { count: 'exact', head: true })
        .limit(1)

      return !error
    } catch (error) {
      return false
    }
  }

  /**
   * Start network monitoring
   * @private
   */
  _startNetworkMonitoring() {
    // Check every 30 seconds
    const checkInterval = this.config.networkCheckInterval || 30000

    this.networkCheckInterval = setInterval(async () => {
      const wasOnline = this.isOnline
      this.isOnline = await this._checkNetworkStatus()

      if (wasOnline !== this.isOnline) {
        await this._handleNetworkChange(this.isOnline)
      }
    }, checkInterval)

    // Also listen to Electron's online/offline events if available
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this._handleNetworkChange(true))
      window.addEventListener('offline', () => this._handleNetworkChange(false))
    }
  }

  /**
   * Handle network status change
   * @private
   */
  async _handleNetworkChange(isOnline) {
    console.log(`🔄 Network status changed: ${isOnline ? 'ONLINE' : 'OFFLINE'}`)

    if (isOnline && this.supabaseAdapter) {
      // Switch to Supabase
      this.currentAdapter = this.supabaseAdapter
      this.isOnline = true
      console.log('✅ Switched to ONLINE mode (Supabase)')

      // Sync pending operations
      await this._syncPendingOperations()

      this.emit('online')
    } else {
      // Switch to SQLite
      this.currentAdapter = this.sqliteAdapter
      this.isOnline = false
      console.log('✅ Switched to OFFLINE mode (SQLite)')

      this.emit('offline')
    }

    this.emit('modeChanged', { mode: isOnline ? 'online' : 'offline' })
  }

  /**
   * Add operation to sync queue (using SQLite for persistence)
   * @param {Object} operation - Operation details
   */
  async _addToSyncQueue(operation) {
    const id = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()

    try {
      this.sqliteAdapter.prepare(`
        INSERT INTO sync_queue (id, type, table_name, data, where_clause, conflict_columns, retry_count, max_retries, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)
      `).run(
        id,
        operation.type,
        operation.table,
        JSON.stringify(operation.data || {}),
        JSON.stringify(operation.where || {}),
        operation.conflictColumns || 'site_id,phase_name',
        this.maxRetries,
        now
      )

      console.log(`📝 Added to sync queue: ${operation.type} on ${operation.table} (ID: ${id})`)
      this.emit('syncQueueChanged', { action: 'added', id })
    } catch (error) {
      console.error('❌ Failed to add to sync queue:', error.message)
    }
  }

  /**
   * Load sync queue from SQLite
   * @private
   */
  async _loadSyncQueue() {
    try {
      const rows = this.sqliteAdapter.prepare(`
        SELECT * FROM sync_queue
        WHERE retry_count < max_retries
        ORDER BY created_at ASC
      `).all()

      this.syncQueue = rows.map(row => ({
        id: row.id,
        type: row.type,
        table: row.table_name,
        data: JSON.parse(row.data || '{}'),
        where: JSON.parse(row.where_clause || '{}'),
        conflictColumns: row.conflict_columns,
        retryCount: row.retry_count,
        maxRetries: row.max_retries,
        lastError: row.last_error,
        nextRetryAt: row.next_retry_at,
        createdAt: row.created_at
      }))

      console.log(`📋 Loaded ${this.syncQueue.length} pending sync operations from SQLite`)
    } catch (error) {
      console.warn('⚠️ Failed to load sync queue:', error.message)
      this.syncQueue = []
    }
  }

  /**
   * Calculate exponential backoff delay
   * @param {number} retryCount - Current retry count
   * @returns {number} Delay in milliseconds
   */
  _calculateBackoffDelay(retryCount) {
    const delay = Math.min(
      this.baseRetryDelay * Math.pow(2, retryCount),
      this.maxRetryDelay
    )
    // Add jitter (±20%)
    const jitter = delay * 0.2 * (Math.random() - 0.5)
    return Math.round(delay + jitter)
  }

  /**
   * Update sync queue item in SQLite
   * @private
   */
  _updateSyncQueueItem(id, updates) {
    try {
      const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ')
      const values = [...Object.values(updates), id]

      this.sqliteAdapter.prepare(`
        UPDATE sync_queue SET ${setClauses}, updated_at = ? WHERE id = ?
      `).run(...values, new Date().toISOString(), id)
    } catch (error) {
      console.error('❌ Failed to update sync queue item:', error.message)
    }
  }

  /**
   * Remove sync queue item from SQLite
   * @private
   */
  _removeSyncQueueItem(id) {
    try {
      this.sqliteAdapter.prepare('DELETE FROM sync_queue WHERE id = ?').run(id)
      this.emit('syncQueueChanged', { action: 'removed', id })
    } catch (error) {
      console.error('❌ Failed to remove sync queue item:', error.message)
    }
  }

  /**
   * Get sync queue status
   * @returns {Object} Queue status
   */
  getSyncQueueStatus() {
    try {
      const total = this.sqliteAdapter.prepare('SELECT COUNT(*) as count FROM sync_queue').get()
      const pending = this.sqliteAdapter.prepare('SELECT COUNT(*) as count FROM sync_queue WHERE retry_count < max_retries').get()
      const failed = this.sqliteAdapter.prepare('SELECT COUNT(*) as count FROM sync_queue WHERE retry_count >= max_retries').get()
      const nextRetry = this.sqliteAdapter.prepare('SELECT MIN(next_retry_at) as next FROM sync_queue WHERE retry_count < max_retries').get()

      return {
        total: total?.count || 0,
        pending: pending?.count || 0,
        failed: failed?.count || 0,
        nextRetryAt: nextRetry?.next || null
      }
    } catch (error) {
      return { total: 0, pending: 0, failed: 0, nextRetryAt: null }
    }
  }

  /**
   * Sync pending operations to Supabase with exponential backoff
   * @private
   */
  async _syncPendingOperations() {
    if (this.isSyncing) return

    // Reload queue from SQLite
    await this._loadSyncQueue()

    // Filter operations that are ready for retry
    const now = new Date()
    const readyOperations = this.syncQueue.filter(op => {
      if (!op.nextRetryAt) return true
      return new Date(op.nextRetryAt) <= now
    })

    if (readyOperations.length === 0) {
      console.log('📋 No operations ready for sync')
      return
    }

    this.isSyncing = true
    console.log(`🔄 Syncing ${readyOperations.length} pending operations...`)

    let successCount = 0
    let failCount = 0
    let skippedCount = 0

    for (const operation of readyOperations) {
      // Check if max retries exceeded
      if (operation.retryCount >= operation.maxRetries) {
        console.warn(`⚠️ Operation ${operation.id} exceeded max retries (${operation.maxRetries}), marking as failed`)
        skippedCount++
        continue
      }

      try {
        await this._executeSync(operation)
        console.log(`✅ Synced: ${operation.type} on ${operation.table}`)

        // Success - remove from queue
        this._removeSyncQueueItem(operation.id)
        successCount++

      } catch (error) {
        console.error(`❌ Sync failed for ${operation.id} (attempt ${operation.retryCount + 1}/${operation.maxRetries}):`, error.message)

        // Calculate next retry time with exponential backoff
        const delay = this._calculateBackoffDelay(operation.retryCount)
        const nextRetryAt = new Date(Date.now() + delay).toISOString()

        // Update retry count and next retry time
        this._updateSyncQueueItem(operation.id, {
          retry_count: operation.retryCount + 1,
          last_error: error.message,
          next_retry_at: nextRetryAt
        })

        console.log(`⏰ Next retry for ${operation.id} in ${Math.round(delay / 1000)}s`)
        failCount++
      }
    }

    this.lastSyncTime = new Date().toISOString()
    this.isSyncing = false

    const status = this.getSyncQueueStatus()

    this.emit('syncComplete', {
      success: successCount,
      failed: failCount,
      skipped: skippedCount,
      pending: status.pending,
      totalFailed: status.failed
    })

    console.log(`✅ Sync complete: ${successCount} success, ${failCount} failed, ${skippedCount} skipped`)
  }

  /**
   * Retry failed operations (reset retry count)
   * @returns {Object} Result
   */
  async retryFailedOperations() {
    try {
      const result = this.sqliteAdapter.prepare(`
        UPDATE sync_queue SET retry_count = 0, next_retry_at = NULL, last_error = NULL
        WHERE retry_count >= max_retries
      `).run()

      console.log(`🔄 Reset ${result.changes} failed operations for retry`)

      if (this.isOnline) {
        await this._syncPendingOperations()
      }

      return { success: true, reset: result.changes }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Clear all sync queue
   * @returns {Object} Result
   */
  clearSyncQueue() {
    try {
      const result = this.sqliteAdapter.prepare('DELETE FROM sync_queue').run()
      this.syncQueue = []
      console.log(`🗑️ Cleared ${result.changes} items from sync queue`)
      this.emit('syncQueueChanged', { action: 'cleared' })
      return { success: true, cleared: result.changes }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Execute a single sync operation
   * @private
   */
  async _executeSync(operation) {
    const supabase = this.supabaseAdapter.getSupabase()

    switch (operation.type) {
      case 'INSERT':
        await supabase.from(operation.table).insert(operation.data)
        break

      case 'UPDATE':
        await supabase.from(operation.table).update(operation.data).match(operation.where)
        break

      case 'DELETE':
        await supabase.from(operation.table).delete().match(operation.where)
        break

      case 'UPSERT':
        await supabase.from(operation.table).upsert(operation.data, {
          onConflict: operation.conflictColumns || 'site_id,phase_name'
        })
        break

      default:
        throw new Error(`Unknown operation type: ${operation.type}`)
    }
  }

  /**
   * Execute operation with offline support
   * Writes to both SQLite and Supabase (or queues for sync)
   */
  async executeWithSync(operation) {
    // Always write to SQLite first
    await this._executeOnSQLite(operation)

    if (this.isOnline && this.supabaseAdapter) {
      // Online: execute on Supabase immediately
      try {
        await this._executeSync(operation)
      } catch (error) {
        console.warn('Supabase operation failed, added to sync queue:', error.message)
        await this._addToSyncQueue(operation)
      }
    } else {
      // Offline: add to sync queue
      await this._addToSyncQueue(operation)
    }
  }

  /**
   * Execute operation on SQLite
   * @private
   */
  async _executeOnSQLite(operation) {
    switch (operation.type) {
      case 'INSERT':
        const insertCols = Object.keys(operation.data).join(', ')
        const insertPlaceholders = Object.keys(operation.data).map(() => '?').join(', ')
        const insertValues = Object.values(operation.data)
        this.sqliteAdapter.prepare(
          `INSERT INTO ${operation.table} (${insertCols}) VALUES (${insertPlaceholders})`
        ).run(...insertValues)
        break

      case 'UPDATE':
        const setClauses = Object.keys(operation.data).map(k => `${k} = ?`).join(', ')
        const whereClauses = Object.keys(operation.where).map(k => `${k} = ?`).join(' AND ')
        const updateValues = [...Object.values(operation.data), ...Object.values(operation.where)]
        this.sqliteAdapter.prepare(
          `UPDATE ${operation.table} SET ${setClauses} WHERE ${whereClauses}`
        ).run(...updateValues)
        break

      case 'DELETE':
        const deleteWhere = Object.keys(operation.where).map(k => `${k} = ?`).join(' AND ')
        this.sqliteAdapter.prepare(
          `DELETE FROM ${operation.table} WHERE ${deleteWhere}`
        ).run(...Object.values(operation.where))
        break

      case 'UPSERT':
        const { generateUpsertSQL } = require('../columnDefinitions')
        // Handle upsert logic
        break
    }
  }

  /**
   * Force sync now
   * @returns {Promise<Object>} Sync result
   */
  async forceSync() {
    if (!this.isOnline) {
      return { success: false, error: 'Currently offline' }
    }

    await this._syncPendingOperations()
    return {
      success: this.syncQueue.length === 0,
      pending: this.syncQueue.length
    }
  }

  /**
   * Get current database mode
   * @returns {Object} Mode info
   */
  getMode() {
    return {
      isOnline: this.isOnline,
      mode: this.isOnline ? 'online' : 'offline',
      adapter: this.currentAdapter ? this.currentAdapter.getType() : 'none',
      pendingSyncCount: this.syncQueue.length,
      lastSyncTime: this.lastSyncTime
    }
  }

  /**
   * Get the current database adapter instance
   * @returns {Object} Current adapter
   */
  getAdapter() {
    if (!this.currentAdapter) {
      throw new Error('Database not initialized. Call initialize() first.')
    }
    return this.currentAdapter
  }

  /**
   * Get SQLite adapter (always available)
   * @returns {Object} SQLite adapter
   */
  getSQLiteAdapter() {
    return this.sqliteAdapter
  }

  /**
   * Get Supabase adapter (may be null if not configured)
   * @returns {Object|null} Supabase adapter
   */
  getSupabaseAdapter() {
    return this.supabaseAdapter
  }

  /**
   * Get adapter type
   * @returns {string} 'sqlite' or 'supabase'
   */
  getAdapterType() {
    return this.currentAdapter ? this.currentAdapter.getType() : 'unknown'
  }

  /**
   * Check if database is initialized
   * @returns {boolean}
   */
  isInitialized() {
    return this.initialized && this.currentAdapter !== null
  }

  /**
   * Legacy method for compatibility
   * @returns {Object} This DatabaseManager instance
   */
  getDB() {
    return this
  }

  /**
   * Prepare a SQL statement (uses current adapter)
   * For complex aggregate queries (SUM, GROUP BY, etc.), uses SQLite
   * For local-only tables (settings, users, phases, etc.), uses SQLite
   * Wraps Supabase calls with automatic SQLite fallback on network errors
   * @param {string} sql - SQL query string
   * @returns {Object} Statement object
   */
  prepare(sql) {
    if (!this.currentAdapter) {
      throw new Error('Database not initialized')
    }

    // Tables that should always use SQLite (local-only, not synced to Supabase)
    const localOnlyTables = ['settings', 'users', 'phases', 'import_history', 'change_requests', 'audit_logs', 'rejections', 'rejections_log', 'nokia_reviews', 'sites_cache', 'sync_queue', 'sync_conflicts', 'sites']
    const sqlLower = sql.toLowerCase()
    const usesLocalTable = localOnlyTables.some(table =>
      sqlLower.includes(`from ${table}`) ||
      sqlLower.includes(`into ${table}`) ||
      sqlLower.includes(`update ${table}`) ||
      sqlLower.includes(`join ${table}`)
    )

    // Check if this is a complex aggregate query that Supabase can't handle
    // Includes COUNT with GROUP BY, SUM, AVG, etc.
    const isComplexAggregate = /\b(SUM|AVG|MIN|MAX|COUNT\s*\(|GROUP\s+BY)\b/i.test(sql)

    // If using Supabase and (query is complex OR uses local table), fallback to SQLite
    if ((isComplexAggregate || usesLocalTable) && this.currentAdapter === this.supabaseAdapter && this.sqliteAdapter) {
      console.log('✅ [DB.prepare] Using SQLite (fallback for complex/local query)')
      return this.sqliteAdapter.prepare(sql)
    }

    // If using Supabase, wrap the result with automatic fallback
    if (this.currentAdapter === this.supabaseAdapter && this.sqliteAdapter) {
      const supabaseStmt = this.supabaseAdapter.prepare(sql)
      const sqliteStmt = this.sqliteAdapter.prepare(sql)
      const self = this

      // Return a wrapper that falls back to SQLite on network errors
      return {
        run: async (...params) => {
          try {
            return await supabaseStmt.run(...params)
          } catch (error) {
            if (error.isNetworkError || error.message?.includes('SUPABASE_NETWORK_ERROR')) {
              console.log('🔄 [DB.prepare] Supabase failed, falling back to SQLite for run()')
              self._markOffline()
              return sqliteStmt.run(...params)
            }
            throw error
          }
        },
        get: async (...params) => {
          try {
            return await supabaseStmt.get(...params)
          } catch (error) {
            if (error.isNetworkError || error.message?.includes('SUPABASE_NETWORK_ERROR')) {
              console.log('🔄 [DB.prepare] Supabase failed, falling back to SQLite for get()')
              self._markOffline()
              return sqliteStmt.get(...params)
            }
            throw error
          }
        },
        all: async (...params) => {
          try {
            return await supabaseStmt.all(...params)
          } catch (error) {
            if (error.isNetworkError || error.message?.includes('SUPABASE_NETWORK_ERROR')) {
              console.log('🔄 [DB.prepare] Supabase failed, falling back to SQLite for all()')
              self._markOffline()
              return sqliteStmt.all(...params)
            }
            throw error
          }
        }
      }
    }

    return this.currentAdapter.prepare(sql)
  }

  /**
   * Mark the database as offline (used when network errors are detected)
   * @private
   */
  _markOffline() {
    if (this.isOnline) {
      console.log('⚠️ [DB] Network error detected, switching to offline mode')
      this.isOnline = false
      this.currentAdapter = this.sqliteAdapter
      this.emit('offline')
      this.emit('modeChanged', { mode: 'offline' })
    }
  }

  /**
   * Execute SQL directly (uses current adapter)
   * For local-only tables, uses SQLite
   * @param {string} sql - SQL query string
   */
  exec(sql) {
    if (!this.currentAdapter) {
      throw new Error('Database not initialized')
    }

    // Tables that should always use SQLite (local-only)
    const localOnlyTables = ['settings', 'users', 'phases', 'import_history', 'change_requests', 'audit_logs', 'rejections', 'rejections_log', 'nokia_reviews', 'sites_cache']
    const sqlLower = sql.toLowerCase()
    const usesLocalTable = localOnlyTables.some(table =>
      sqlLower.includes(`from ${table}`) ||
      sqlLower.includes(`into ${table}`) ||
      sqlLower.includes(`update ${table}`) ||
      sqlLower.includes(`table ${table}`)
    )

    if (usesLocalTable && this.currentAdapter === this.supabaseAdapter && this.sqliteAdapter) {
      return this.sqliteAdapter.exec(sql)
    }

    return this.currentAdapter.exec(sql)
  }

  /**
   * Execute a transaction
   * @param {Function} fn - Transaction function
   * @returns {Function} Transaction wrapper
   */
  transaction(fn) {
    if (!this.currentAdapter) {
      throw new Error('Database not initialized')
    }
    return this.currentAdapter.transaction(fn)
  }

  /**
   * Create a database backup
   * @returns {Promise<string>} Backup identifier
   */
  async backup() {
    // Always backup SQLite
    return this.sqliteAdapter.backup()
  }

  /**
   * Close all database connections
   */
  close() {
    if (this.networkCheckInterval) {
      clearInterval(this.networkCheckInterval)
    }

    if (this.sqliteAdapter) {
      this.sqliteAdapter.close()
    }

    if (this.supabaseAdapter) {
      this.supabaseAdapter.close()
    }

    this.currentAdapter = null
    this.initialized = false
    console.log('✅ All database connections closed')
  }

  /**
   * Save database (for sql.js mode)
   */
  save() {
    if (this.sqliteAdapter && this.sqliteAdapter.save) {
      return this.sqliteAdapter.save()
    }
    return true
  }

  /**
   * Execute PRAGMA (SQLite only)
   * @param {string} sql - PRAGMA statement
   */
  pragma(sql) {
    if (this.sqliteAdapter && this.sqliteAdapter.pragma) {
      return this.sqliteAdapter.pragma(sql)
    }
  }

  /**
   * Get database statistics
   * @returns {Object} Stats
   */
  getStats() {
    return {
      mode: this.getMode(),
      sqlite: this.sqliteAdapter ? this.sqliteAdapter.getStats() : null,
      supabase: this.supabaseAdapter ? { connected: this.isOnline } : null
    }
  }

  /**
   * Get comprehensive connection status for UI
   * @returns {Object} Connection status for display
   */
  getConnectionStatus() {
    const syncStatus = this.getSyncQueueStatus()

    return {
      // Connection state
      isOnline: this.isOnline,
      mode: this.isOnline ? 'online' : 'offline',
      adapter: this.currentAdapter?.getType?.() || 'unknown',

      // Sync status
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,

      // Queue status
      syncQueue: {
        pending: syncStatus.pending,
        failed: syncStatus.failed,
        total: syncStatus.total,
        nextRetryAt: syncStatus.nextRetryAt
      },

      // Conflicts
      pendingConflicts: this.pendingConflicts.length,
      conflictStrategy: this.conflictStrategy,

      // Adapters availability
      hasSupabase: !!this.supabaseAdapter,
      hasSQLite: !!this.sqliteAdapter,

      // Config
      maxRetries: this.maxRetries,
      initialized: this.initialized
    }
  }

  /**
   * Get pending sync queue items for UI display
   * @returns {Array} Queue items
   */
  getSyncQueueItems() {
    try {
      const rows = this.sqliteAdapter.prepare(`
        SELECT id, type, table_name, retry_count, max_retries, last_error, next_retry_at, created_at
        FROM sync_queue
        ORDER BY created_at DESC
        LIMIT 50
      `).all()

      return rows.map(row => ({
        id: row.id,
        type: row.type,
        table: row.table_name,
        retryCount: row.retry_count,
        maxRetries: row.max_retries,
        lastError: row.last_error,
        nextRetryAt: row.next_retry_at,
        createdAt: row.created_at,
        status: row.retry_count >= row.max_retries ? 'failed' : 'pending'
      }))
    } catch (error) {
      console.error('Failed to get sync queue items:', error.message)
      return []
    }
  }

  /**
   * Set conflict resolution strategy
   * @param {string} strategy - 'server-wins', 'client-wins', 'newest-wins', 'manual'
   */
  setConflictStrategy(strategy) {
    const validStrategies = ['server-wins', 'client-wins', 'newest-wins', 'manual']
    if (!validStrategies.includes(strategy)) {
      throw new Error(`Invalid conflict strategy: ${strategy}. Valid options: ${validStrategies.join(', ')}`)
    }
    this.conflictStrategy = strategy
    console.log(`📋 Conflict strategy set to: ${strategy}`)
    return { success: true, strategy }
  }

  /**
   * Force check online status and emit event
   * @returns {Promise<boolean>} Online status
   */
  async checkOnlineStatus() {
    const wasOnline = this.isOnline
    this.isOnline = await this._checkNetworkStatus()

    if (wasOnline !== this.isOnline) {
      await this._handleNetworkChange(this.isOnline)
    }

    return this.isOnline
  }

  // ============================================
  // Conflict Resolution Methods
  // ============================================

  /**
   * Add a conflict to the conflicts table
   * @param {Object} conflict - Conflict details
   * @returns {string} Conflict ID
   */
  addConflict(conflict) {
    const id = `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()

    try {
      this.sqliteAdapter.prepare(`
        INSERT INTO sync_conflicts (id, table_name, record_id, local_data, server_data, conflict_type, field_conflicts, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
      `).run(
        id,
        conflict.table,
        conflict.recordId,
        JSON.stringify(conflict.localData),
        JSON.stringify(conflict.serverData),
        conflict.type || 'update',
        JSON.stringify(conflict.fieldConflicts || []),
        now
      )

      this.pendingConflicts.push({ id, ...conflict })
      this.emit('conflictDetected', { id, ...conflict })
      console.log(`⚠️ Conflict detected for ${conflict.table}:${conflict.recordId}`)

      return id
    } catch (error) {
      console.error('❌ Failed to add conflict:', error.message)
      return null
    }
  }

  /**
   * Get all pending conflicts
   * @returns {Array} List of pending conflicts
   */
  getPendingConflicts() {
    try {
      const rows = this.sqliteAdapter.prepare(`
        SELECT * FROM sync_conflicts WHERE status = 'pending' ORDER BY created_at DESC
      `).all()

      return rows.map(row => ({
        id: row.id,
        table: row.table_name,
        recordId: row.record_id,
        localData: JSON.parse(row.local_data),
        serverData: JSON.parse(row.server_data),
        type: row.conflict_type,
        fieldConflicts: JSON.parse(row.field_conflicts || '[]'),
        createdAt: row.created_at
      }))
    } catch (error) {
      console.error('❌ Failed to get pending conflicts:', error.message)
      return []
    }
  }

  /**
   * Get conflict count by status
   * @returns {Object} Conflict counts
   */
  getConflictCounts() {
    try {
      const pending = this.sqliteAdapter.prepare(`SELECT COUNT(*) as count FROM sync_conflicts WHERE status = 'pending'`).get()
      const resolved = this.sqliteAdapter.prepare(`SELECT COUNT(*) as count FROM sync_conflicts WHERE status = 'resolved'`).get()

      return {
        pending: pending?.count || 0,
        resolved: resolved?.count || 0,
        total: (pending?.count || 0) + (resolved?.count || 0)
      }
    } catch (error) {
      return { pending: 0, resolved: 0, total: 0 }
    }
  }

  /**
   * Resolve a conflict
   * @param {string} conflictId - Conflict ID
   * @param {string} resolution - 'use-local', 'use-server', 'merge'
   * @param {Object} mergedData - Merged data (if resolution is 'merge')
   * @returns {Object} Result
   */
  async resolveConflict(conflictId, resolution, mergedData = null) {
    try {
      // Get the conflict
      const conflict = this.sqliteAdapter.prepare(`
        SELECT * FROM sync_conflicts WHERE id = ?
      `).get(conflictId)

      if (!conflict) {
        return { success: false, error: 'Conflict not found' }
      }

      const localData = JSON.parse(conflict.local_data)
      const serverData = JSON.parse(conflict.server_data)

      let finalData
      switch (resolution) {
        case 'use-local':
          finalData = localData
          break
        case 'use-server':
          finalData = serverData
          break
        case 'merge':
          finalData = mergedData || { ...serverData, ...localData }
          break
        default:
          return { success: false, error: 'Invalid resolution type' }
      }

      // Apply the resolution to both databases
      if (resolution === 'use-local' || resolution === 'merge') {
        // Update Supabase with local/merged data
        if (this.isOnline && this.supabaseAdapter) {
          const supabase = this.supabaseAdapter.getSupabase()
          await supabase.from(conflict.table_name).upsert(finalData, {
            onConflict: 'site_id,phase_name'
          })
        }
      }

      if (resolution === 'use-server' || resolution === 'merge') {
        // Update SQLite with server/merged data
        const columns = Object.keys(finalData)
        const setClauses = columns.map(col => `${col} = ?`).join(', ')
        const values = columns.map(col => finalData[col])

        this.sqliteAdapter.prepare(`
          UPDATE ${conflict.table_name} SET ${setClauses}
          WHERE site_id = ? AND phase_name = ?
        `).run(...values, finalData.site_id, finalData.phase_name)
      }

      // Mark conflict as resolved
      this.sqliteAdapter.prepare(`
        UPDATE sync_conflicts SET status = 'resolved', resolution = ?, resolved_at = ?
        WHERE id = ?
      `).run(resolution, new Date().toISOString(), conflictId)

      // Remove from pending conflicts array
      this.pendingConflicts = this.pendingConflicts.filter(c => c.id !== conflictId)

      this.emit('conflictResolved', { id: conflictId, resolution })
      console.log(`✅ Conflict ${conflictId} resolved with: ${resolution}`)

      return { success: true, resolution, data: finalData }
    } catch (error) {
      console.error('❌ Failed to resolve conflict:', error.message)
      return { success: false, error: error.message }
    }
  }

  /**
   * Resolve all conflicts with a specific strategy
   * @param {string} strategy - 'use-local', 'use-server'
   * @returns {Object} Result
   */
  async resolveAllConflicts(strategy) {
    const conflicts = this.getPendingConflicts()
    let resolved = 0
    let failed = 0

    for (const conflict of conflicts) {
      const result = await this.resolveConflict(conflict.id, strategy)
      if (result.success) {
        resolved++
      } else {
        failed++
      }
    }

    return { success: true, resolved, failed, total: conflicts.length }
  }

  /**
   * Detect conflicts between local and server data
   * @param {string} table - Table name
   * @param {Object} localData - Local record
   * @param {Object} serverData - Server record
   * @returns {Object|null} Conflict details or null if no conflict
   */
  detectConflict(table, localData, serverData) {
    if (!localData || !serverData) return null

    const fieldConflicts = []
    const ignoreFields = ['created_at', 'updated_at', 'synced_at', 'id']

    for (const key of Object.keys(localData)) {
      if (ignoreFields.includes(key)) continue

      const localValue = localData[key]
      const serverValue = serverData[key]

      if (localValue !== serverValue && localValue != null && serverValue != null) {
        fieldConflicts.push({
          field: key,
          localValue,
          serverValue
        })
      }
    }

    if (fieldConflicts.length === 0) return null

    return {
      table,
      recordId: localData.site_id || localData.id,
      localData,
      serverData,
      type: 'update',
      fieldConflicts
    }
  }

  /**
   * Clear resolved conflicts (cleanup)
   * @param {number} olderThanDays - Clear conflicts older than X days
   * @returns {Object} Result
   */
  clearResolvedConflicts(olderThanDays = 7) {
    try {
      const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000).toISOString()
      const result = this.sqliteAdapter.prepare(`
        DELETE FROM sync_conflicts WHERE status = 'resolved' AND resolved_at < ?
      `).run(cutoff)

      console.log(`🗑️ Cleared ${result.changes} old resolved conflicts`)
      return { success: true, cleared: result.changes }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Subscribe to real-time changes (Supabase only, when online)
   */
  subscribeToChanges(table, callback) {
    if (this.isOnline && this.supabaseAdapter && this.supabaseAdapter.subscribeToChanges) {
      return this.supabaseAdapter.subscribeToChanges(table, callback)
    }
    console.warn('⚠️ Real-time subscriptions only available when online')
    return null
  }

  /**
   * Get Supabase client
   * @returns {Object|null} Supabase client
   */
  getSupabaseClient() {
    if (this.supabaseAdapter && this.supabaseAdapter.getSupabase) {
      return this.supabaseAdapter.getSupabase()
    }
    return null
  }

  /**
   * Full sync from Supabase to SQLite
   * Use this to download all cloud data to local
   */
  async fullSyncFromCloud() {
    if (!this.isOnline || !this.supabaseAdapter) {
      throw new Error('Must be online for full sync')
    }

    console.log('🔄 Starting full sync from cloud...')

    try {
      const supabase = this.supabaseAdapter.getSupabase()

      // Fetch all sites from Supabase
      const { data: sites, error } = await supabase
        .from('sites')
        .select('*')

      if (error) throw error

      // Clear local sites and insert new ones
      this.sqliteAdapter.exec('DELETE FROM sites')

      const { generateUpsertSQL, getSQLiteColumns } = require('../columnDefinitions')
      const columns = getSQLiteColumns()

      // Track skipped sites
      let insertedCount = 0
      let skippedCount = 0

      for (const site of sites) {
        // Skip sites with NULL phase_name (required field)
        if (!site.phase_name) {
          skippedCount++
          continue
        }

        const values = columns.map(col => {
          const value = site[col]
          // Handle NULL values for required fields
          if (col === 'phase_name' && !value) return 'UNKNOWN'
          if (col === 'site_id' && !value) return `unknown_${Date.now()}_${Math.random()}`
          return value ?? null
        })
        const placeholders = columns.map(() => '?').join(', ')

        try {
          this.sqliteAdapter.prepare(
            `INSERT INTO sites (${columns.join(', ')}) VALUES (${placeholders})`
          ).run(...values)
          insertedCount++
        } catch (insertError) {
          console.warn(`⚠️ Failed to insert site ${site.site_id || 'unknown'}:`, insertError.message)
          skippedCount++
        }
      }

      if (skippedCount > 0) {
        console.log(`⚠️ Skipped ${skippedCount} sites with missing required fields`)
      }

      console.log(`✅ Synced ${insertedCount} sites from cloud (${skippedCount} skipped)`)

      this.lastSyncTime = new Date().toISOString()
      this.emit('fullSyncComplete', { count: insertedCount, skipped: skippedCount })

      return { success: true, count: insertedCount, skipped: skippedCount }
    } catch (error) {
      console.error('❌ Full sync failed:', error.message)
      throw error
    }
  }

  /**
   * Push local changes to cloud
   * Use this to upload local data to Supabase
   */
  async pushToCloud() {
    if (!this.isOnline || !this.supabaseAdapter) {
      throw new Error('Must be online to push to cloud')
    }

    console.log('🔄 Pushing local data to cloud...')

    try {
      const supabase = this.supabaseAdapter.getSupabase()

      // Get all local sites
      const sites = this.sqliteAdapter.prepare('SELECT * FROM sites').all()

      // Upsert to Supabase
      const { error } = await supabase
        .from('sites')
        .upsert(sites, {
          onConflict: 'site_id,phase_name'
        })

      if (error) throw error

      console.log(`✅ Pushed ${sites.length} sites to cloud`)

      this.emit('pushComplete', { count: sites.length })

      return { success: true, count: sites.length }
    } catch (error) {
      console.error('❌ Push to cloud failed:', error.message)
      throw error
    }
  }
}

// Singleton instance
const dbManager = new DatabaseManager()

module.exports = dbManager
