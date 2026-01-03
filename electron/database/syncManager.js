/**
 * SyncManager - Handles data synchronization between SQLite and Supabase
 *
 * Features:
 *   - Conflict resolution strategies
 *   - Incremental sync (only changed records)
 *   - Background sync
 *   - Sync status tracking
 *
 * @author TSSR Monitor Team
 * @version 2.0
 */

const EventEmitter = require('events')
const dbManager = require('./db')

class SyncManager extends EventEmitter {
  constructor() {
    super()
    this.syncInProgress = false
    this.lastSyncTime = null
    this.syncErrors = []
    this.conflictResolution = 'server-wins' // 'server-wins', 'client-wins', 'manual'
  }

  /**
   * Set conflict resolution strategy
   * @param {string} strategy - 'server-wins', 'client-wins', or 'manual'
   */
  setConflictResolution(strategy) {
    this.conflictResolution = strategy
  }

  /**
   * Get sync status
   * @returns {Object} Status info
   */
  getStatus() {
    return {
      inProgress: this.syncInProgress,
      lastSyncTime: this.lastSyncTime,
      pendingCount: dbManager.syncQueue?.length || 0,
      errors: this.syncErrors,
      isOnline: dbManager.isOnline,
      conflictResolution: this.conflictResolution
    }
  }

  /**
   * Perform full bidirectional sync
   * @param {Object} options - Sync options
   * @returns {Promise<Object>} Sync result
   */
  async fullSync(options = {}) {
    if (this.syncInProgress) {
      return { success: false, error: 'Sync already in progress' }
    }

    if (!dbManager.isOnline) {
      return { success: false, error: 'Currently offline' }
    }

    this.syncInProgress = true
    this.emit('syncStarted')
    this.syncErrors = []

    const result = {
      success: true,
      pulled: 0,
      pushed: 0,
      conflicts: 0,
      errors: []
    }

    try {
      // Step 1: Push local pending changes
      console.log('🔄 Step 1: Pushing local changes...')
      const pushResult = await this._pushChanges()
      result.pushed = pushResult.count

      // Step 2: Pull remote changes
      console.log('🔄 Step 2: Pulling remote changes...')
      const pullResult = await this._pullChanges(options)
      result.pulled = pullResult.count
      result.conflicts = pullResult.conflicts

      this.lastSyncTime = new Date().toISOString()

      console.log(`✅ Sync complete: ${result.pushed} pushed, ${result.pulled} pulled`)
    } catch (error) {
      result.success = false
      result.errors.push(error.message)
      this.syncErrors.push({ time: new Date().toISOString(), error: error.message })
      console.error('❌ Sync failed:', error.message)
    }

    this.syncInProgress = false
    this.emit('syncCompleted', result)

    return result
  }

  /**
   * Push local changes to server
   * @private
   */
  async _pushChanges() {
    const sqlite = dbManager.getSQLiteAdapter()
    const supabase = dbManager.getSupabaseClient()

    if (!supabase) throw new Error('Supabase not available')

    // Get locally modified records (those with updated_at > last sync)
    let modifiedSites = []

    if (this.lastSyncTime) {
      modifiedSites = sqlite.prepare(
        `SELECT * FROM sites WHERE updated_at > ?`
      ).all(this.lastSyncTime)
    } else {
      // First sync - push all
      modifiedSites = sqlite.prepare('SELECT * FROM sites').all()
    }

    if (modifiedSites.length === 0) {
      return { count: 0 }
    }

    // Upsert to Supabase
    const { error } = await supabase
      .from('sites')
      .upsert(modifiedSites, {
        onConflict: 'site_id,phase_name'
      })

    if (error) throw error

    return { count: modifiedSites.length }
  }

  /**
   * Pull remote changes to local
   * @private
   */
  async _pullChanges(options = {}) {
    const sqlite = dbManager.getSQLiteAdapter()
    const supabase = dbManager.getSupabaseClient()

    if (!supabase) throw new Error('Supabase not available')

    let query = supabase.from('sites').select('*')

    // Incremental sync - only get records modified since last sync
    if (this.lastSyncTime && !options.fullRefresh) {
      query = query.gt('updated_at', this.lastSyncTime)
    }

    const { data: remoteSites, error } = await query

    if (error) throw error

    if (!remoteSites || remoteSites.length === 0) {
      return { count: 0, conflicts: 0 }
    }

    let conflicts = 0
    const { getSQLiteColumns } = require('../columnDefinitions')
    const columns = getSQLiteColumns()

    for (const remoteSite of remoteSites) {
      // Check if exists locally
      const localSite = sqlite.prepare(
        'SELECT * FROM sites WHERE site_id = ? AND phase_name = ?'
      ).get(remoteSite.site_id, remoteSite.phase_name)

      if (localSite) {
        // Conflict resolution
        const shouldUpdate = await this._resolveConflict(localSite, remoteSite)
        if (shouldUpdate) {
          this._updateLocalSite(sqlite, remoteSite, columns)
        } else {
          conflicts++
        }
      } else {
        // Insert new record
        this._insertLocalSite(sqlite, remoteSite, columns)
      }
    }

    return { count: remoteSites.length, conflicts }
  }

  /**
   * Resolve conflict between local and remote
   * @private
   */
  async _resolveConflict(localSite, remoteSite) {
    switch (this.conflictResolution) {
      case 'server-wins':
        // Remote always wins
        return true

      case 'client-wins':
        // Local always wins
        return false

      case 'newest-wins':
        // Most recently updated wins
        const localTime = new Date(localSite.updated_at).getTime()
        const remoteTime = new Date(remoteSite.updated_at).getTime()
        return remoteTime > localTime

      case 'manual':
        // Emit event for manual resolution
        return new Promise(resolve => {
          this.emit('conflict', {
            local: localSite,
            remote: remoteSite,
            resolve: (useRemote) => resolve(useRemote)
          })
        })

      default:
        return true // Default to server-wins
    }
  }

  /**
   * Update local site record
   * @private
   */
  _updateLocalSite(sqlite, site, columns) {
    const setClauses = columns.map(col => `${col} = ?`).join(', ')
    const values = columns.map(col => site[col] ?? null)

    sqlite.prepare(`
      UPDATE sites SET ${setClauses}, updated_at = CURRENT_TIMESTAMP
      WHERE site_id = ? AND phase_name = ?
    `).run(...values, site.site_id, site.phase_name)
  }

  /**
   * Insert local site record
   * @private
   */
  _insertLocalSite(sqlite, site, columns) {
    const values = columns.map(col => site[col] ?? null)
    const placeholders = columns.map(() => '?').join(', ')

    sqlite.prepare(`
      INSERT INTO sites (${columns.join(', ')})
      VALUES (${placeholders})
    `).run(...values)
  }

  /**
   * Sync specific tables
   * @param {string[]} tables - Tables to sync
   */
  async syncTables(tables) {
    const results = {}

    for (const table of tables) {
      try {
        results[table] = await this._syncTable(table)
      } catch (error) {
        results[table] = { success: false, error: error.message }
      }
    }

    return results
  }

  /**
   * Sync a specific table
   * @private
   */
  async _syncTable(table) {
    const supabase = dbManager.getSupabaseClient()
    const sqlite = dbManager.getSQLiteAdapter()

    // Pull from server
    const { data, error } = await supabase.from(table).select('*')
    if (error) throw error

    // Clear and repopulate
    sqlite.exec(`DELETE FROM ${table}`)

    for (const row of data) {
      const columns = Object.keys(row).filter(k => k !== 'id')
      const values = columns.map(c => row[c])
      const placeholders = columns.map(() => '?').join(', ')

      sqlite.prepare(`
        INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})
      `).run(...values)
    }

    return { success: true, count: data.length }
  }

  /**
   * Clear sync queue
   */
  clearQueue() {
    if (dbManager.syncQueue) {
      dbManager.syncQueue = []
    }
    this.emit('queueCleared')
  }

  /**
   * Get pending sync items
   */
  getPendingItems() {
    return dbManager.syncQueue || []
  }
}

// Singleton instance
const syncManager = new SyncManager()

module.exports = syncManager
