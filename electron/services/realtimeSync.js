/**
 * RealtimeSync Service - Day 11
 *
 * Provides real-time synchronization between database and connected clients.
 * Supports two modes:
 * - Supabase mode: Real-time subscriptions via postgres_changes
 * - SQLite mode: Polling for changes every 2 seconds
 */

const WS_EVENTS = require('../server/utils/wsEvents')

// Extended events for real-time sync
const SYNC_EVENTS = {
  SITE_ADDED: 'site_added',
  SITE_UPDATED: 'site_updated',
  SITE_DELETED: 'site_deleted',
  SYNC_ERROR: 'sync_error',
  SYNC_STATUS: 'sync_status'
}

class RealtimeSync {
  constructor() {
    // Database configuration
    this.dbType = null
    this.adapter = null
    this.db = null

    // WebSocket reference for broadcasting
    this.wsServer = null
    this.broadcast = null

    // Supabase subscription
    this.subscription = null

    // SQLite polling
    this.pollingInterval = null
    this.pollIntervalMs = 2000 // 2 seconds
    this.lastSyncTime = null
    this.isPolling = false

    // Change tracking to prevent duplicates
    this.recentChanges = new Map()
    this.changeRetentionMs = 5000 // Keep changes for 5 seconds to prevent duplicates

    // Table existence flags (to avoid repeated failed queries)
    this.hasDeletedTable = null // null = unknown, true = exists, false = doesn't exist

    // Stats
    this.stats = {
      inserts: 0,
      updates: 0,
      deletes: 0,
      lastEvent: null,
      errors: 0
    }

    // Service state
    this.isInitialized = false
    this.isRunning = false
  }

  /**
   * Initialize the sync service
   * @param {string} dbType - 'sqlite' or 'supabase'
   * @param {Object} adapter - Database adapter instance
   * @param {Object} wsServer - WebSocket server instance (optional)
   * @param {Function} broadcastFn - Broadcast function for WebSocket (optional)
   */
  async initializeSync(dbType, adapter, wsServer = null, broadcastFn = null) {
    if (this.isInitialized) {
      console.log('[RealtimeSync] Already initialized, stopping first...')
      await this.stopSync()
    }

    this.dbType = dbType
    this.adapter = adapter
    this.wsServer = wsServer
    this.broadcast = broadcastFn

    console.log(`[RealtimeSync] Initializing for ${dbType} mode...`)

    try {
      if (dbType === 'supabase') {
        await this.initSupabaseSync()
      } else {
        await this.initSqlitePolling()
      }

      this.isInitialized = true
      this.isRunning = true

      console.log(`[RealtimeSync] ${dbType} sync service started`)
      return true
    } catch (error) {
      console.error('[RealtimeSync] Initialization failed:', error)
      this.stats.errors++
      return false
    }
  }

  /**
   * Initialize Supabase real-time subscriptions
   */
  async initSupabaseSync() {
    if (!this.adapter || !this.adapter.getSupabase) {
      throw new Error('Supabase adapter not available')
    }

    const supabase = this.adapter.getSupabase()
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }

    console.log('[RealtimeSync] Setting up Supabase real-time subscription...')

    // Create a channel for sites table changes
    this.subscription = supabase
      .channel('sites-realtime-changes')
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sites'
        },
        (payload) => this.handleSupabaseChange('INSERT', payload)
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sites'
        },
        (payload) => this.handleSupabaseChange('UPDATE', payload)
      )
      .on('postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'sites'
        },
        (payload) => this.handleSupabaseChange('DELETE', payload)
      )
      .subscribe((status) => {
        console.log(`[RealtimeSync] Supabase subscription status: ${status}`)

        if (status === 'SUBSCRIBED') {
          console.log('[RealtimeSync] Successfully subscribed to Supabase changes')
          this.broadcastSyncStatus('connected', 'supabase')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[RealtimeSync] Supabase channel error')
          this.stats.errors++
          this.broadcastSyncStatus('error', 'supabase')
          // Attempt reconnection
          setTimeout(() => this.reconnectSupabase(), 5000)
        } else if (status === 'CLOSED') {
          console.log('[RealtimeSync] Supabase channel closed')
          this.broadcastSyncStatus('disconnected', 'supabase')
        }
      })
  }

  /**
   * Handle Supabase change events
   */
  handleSupabaseChange(eventType, payload) {
    const changeId = `${eventType}-${payload.new?.id || payload.old?.id}-${Date.now()}`

    // Prevent duplicate processing
    if (this.isDuplicateChange(changeId)) {
      return
    }

    console.log(`[RealtimeSync] Supabase ${eventType}:`, payload.new?.site_id || payload.old?.site_id)

    let event, siteData

    switch (eventType) {
      case 'INSERT':
        event = SYNC_EVENTS.SITE_ADDED
        siteData = payload.new
        this.stats.inserts++
        break
      case 'UPDATE':
        event = SYNC_EVENTS.SITE_UPDATED
        siteData = payload.new
        this.stats.updates++
        break
      case 'DELETE':
        event = SYNC_EVENTS.SITE_DELETED
        siteData = payload.old
        this.stats.deletes++
        break
      default:
        return
    }

    this.stats.lastEvent = new Date().toISOString()
    this.handleRemoteUpdate({ type: eventType.toLowerCase(), data: siteData })
  }

  /**
   * Reconnect Supabase subscription after error
   */
  async reconnectSupabase() {
    if (!this.isRunning) return

    console.log('[RealtimeSync] Attempting Supabase reconnection...')

    if (this.subscription) {
      const supabase = this.adapter.getSupabase()
      if (supabase) {
        await supabase.removeChannel(this.subscription)
      }
      this.subscription = null
    }

    try {
      await this.initSupabaseSync()
    } catch (error) {
      console.error('[RealtimeSync] Reconnection failed:', error)
      // Try again later
      setTimeout(() => this.reconnectSupabase(), 10000)
    }
  }

  /**
   * Initialize SQLite polling for changes
   */
  async initSqlitePolling() {
    console.log('[RealtimeSync] Setting up SQLite polling...')

    // Get initial sync time
    this.lastSyncTime = await this.getLastSyncTime()

    // Check if deleted_sites table exists (once at init)
    this.hasDeletedTable = await this.checkTableExists('deleted_sites')

    // Start polling interval
    this.pollingInterval = setInterval(() => {
      this.pollForChanges()
    }, this.pollIntervalMs)

    console.log(`[RealtimeSync] SQLite polling started (interval: ${this.pollIntervalMs}ms)`)
    this.broadcastSyncStatus('connected', 'sqlite')
  }

  /**
   * Check if a table exists in the database
   * @param {string} tableName - Name of the table to check
   * @returns {boolean} True if table exists
   */
  async checkTableExists(tableName) {
    if (!this.adapter) return false

    try {
      const query = `SELECT name FROM sqlite_master WHERE type='table' AND name=?`
      const stmt = this.adapter.prepare(query)
      const result = stmt.get(tableName)
      return !!result
    } catch (e) {
      return false
    }
  }

  /**
   * Poll SQLite database for changes
   */
  async pollForChanges() {
    // Prevent overlapping polls
    if (this.isPolling) {
      return
    }

    this.isPolling = true

    try {
      const currentTime = new Date().toISOString()

      // Query for changed records since last sync
      const changes = await this.detectChanges(this.lastSyncTime)

      if (changes.length > 0) {
        console.log(`[RealtimeSync] Detected ${changes.length} changes`)

        for (const change of changes) {
          this.handleRemoteUpdate(change)
        }
      }

      // Update last sync time
      this.lastSyncTime = currentTime
      await this.setLastSyncTime(currentTime)

    } catch (error) {
      console.error('[RealtimeSync] Polling error:', error)
      this.stats.errors++
    } finally {
      this.isPolling = false
    }
  }

  /**
   * Detect changes in SQLite since last sync
   * @param {string} sinceTime - ISO timestamp of last sync
   * @returns {Array} Array of change events
   */
  async detectChanges(sinceTime) {
    if (!this.adapter) return []

    const changes = []

    try {
      // Query for updated sites (using sites table)
      let query = `
        SELECT * FROM sites
        WHERE updated_at > ?
        ORDER BY updated_at ASC
        LIMIT 100
      `

      const stmt = this.adapter.prepare(query)
      const updatedSites = stmt.all(sinceTime || '1970-01-01T00:00:00.000Z')

      for (const site of updatedSites) {
        // All detected changes are treated as updates since we can't reliably detect inserts
        // in a polling scenario without tracking created_at separately
        changes.push({
          type: 'update',
          data: site
        })
        this.stats.updates++
      }

      // Check for deleted sites (if we track deletions)
      // Note: This requires a deleted_sites_cache table or soft-delete flag
      // This is optional - only query if the table exists (checked at init)
      if (this.hasDeletedTable === true) {
        const deletedQuery = `
          SELECT * FROM deleted_sites_cache
          WHERE deleted_at > ?
          LIMIT 100
        `
        const deletedStmt = this.adapter.prepare(deletedQuery)
        const deletedSites = deletedStmt.all(sinceTime || '1970-01-01T00:00:00.000Z')

        for (const site of deletedSites) {
          changes.push({
            type: 'delete',
            data: site
          })
          this.stats.deletes++
        }
      }

      if (changes.length > 0) {
        this.stats.lastEvent = new Date().toISOString()
      }

    } catch (error) {
      // Only log if it's not a "table doesn't exist" error
      if (!error.message || !error.message.includes('no such table')) {
        console.error('[RealtimeSync] detectChanges error:', error)
      }
    }

    return changes
  }

  /**
   * Handle a remote update event
   * @param {Object} event - { type: 'insert'|'update'|'delete', data: site }
   */
  handleRemoteUpdate(event) {
    const { type, data } = event

    if (!data) {
      console.warn('[RealtimeSync] Received event without data:', type)
      return
    }

    console.log(`[RealtimeSync] Processing ${type} for site:`, data.site_id || data.id)

    // Map event type to WebSocket event
    let wsEvent
    switch (type) {
      case 'insert':
        wsEvent = SYNC_EVENTS.SITE_ADDED
        break
      case 'update':
        wsEvent = SYNC_EVENTS.SITE_UPDATED
        break
      case 'delete':
        wsEvent = SYNC_EVENTS.SITE_DELETED
        break
      default:
        wsEvent = WS_EVENTS.SITE_UPDATED
    }

    // Broadcast to all connected clients
    this.broadcastToClients(wsEvent, data)
  }

  /**
   * Broadcast event to all connected WebSocket clients
   * @param {string} event - Event type
   * @param {Object} site - Site data
   */
  broadcastToClients(event, site) {
    if (!this.broadcast && !this.wsServer) {
      console.log('[RealtimeSync] No broadcast method available')
      return
    }

    const payload = {
      site,
      timestamp: Date.now(),
      source: this.dbType
    }

    if (this.broadcast) {
      // Use provided broadcast function
      this.broadcast(event, payload)
    } else if (this.wsServer && this.wsServer.broadcast) {
      // Use WebSocket server broadcast
      this.wsServer.broadcast(event, payload)
    }

    console.log(`[RealtimeSync] Broadcast ${event} to clients`)
  }

  /**
   * Broadcast sync status to clients
   */
  broadcastSyncStatus(status, mode) {
    const payload = {
      status,
      mode,
      timestamp: Date.now(),
      stats: this.stats
    }

    if (this.broadcast) {
      this.broadcast(SYNC_EVENTS.SYNC_STATUS, payload)
    } else if (this.wsServer && this.wsServer.broadcast) {
      this.wsServer.broadcast(SYNC_EVENTS.SYNC_STATUS, payload)
    }
  }

  /**
   * Check if this is a duplicate change (prevent loops)
   */
  isDuplicateChange(changeId) {
    if (this.recentChanges.has(changeId)) {
      return true
    }

    // Add to recent changes
    this.recentChanges.set(changeId, Date.now())

    // Clean up old entries
    const now = Date.now()
    for (const [id, timestamp] of this.recentChanges.entries()) {
      if (now - timestamp > this.changeRetentionMs) {
        this.recentChanges.delete(id)
      }
    }

    return false
  }

  /**
   * Get last sync timestamp from database
   */
  async getLastSyncTime() {
    if (!this.adapter) return null

    try {
      const stmt = this.adapter.prepare(
        "SELECT value FROM settings WHERE key = 'last_realtime_sync'"
      )
      const result = stmt.get()
      return result?.value || null
    } catch (error) {
      // Settings table might not have this key yet
      return null
    }
  }

  /**
   * Save last sync timestamp to database
   */
  async setLastSyncTime(timestamp) {
    if (!this.adapter) return

    try {
      // Use UPSERT pattern
      const stmt = this.adapter.prepare(`
        INSERT INTO settings (key, value) VALUES ('last_realtime_sync', ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `)
      stmt.run(timestamp)
    } catch (error) {
      // Try simple INSERT or UPDATE
      try {
        const existing = this.adapter.prepare(
          "SELECT key FROM settings WHERE key = 'last_realtime_sync'"
        ).get()

        if (existing) {
          this.adapter.prepare(
            "UPDATE settings SET value = ? WHERE key = 'last_realtime_sync'"
          ).run(timestamp)
        } else {
          this.adapter.prepare(
            "INSERT INTO settings (key, value) VALUES ('last_realtime_sync', ?)"
          ).run(timestamp)
        }
      } catch (e) {
        console.error('[RealtimeSync] Failed to save sync time:', e)
      }
    }
  }

  /**
   * Stop the sync service
   */
  async stopSync() {
    console.log('[RealtimeSync] Stopping sync service...')

    this.isRunning = false

    // Stop Supabase subscription
    if (this.subscription) {
      try {
        if (this.adapter && this.adapter.getSupabase) {
          const supabase = this.adapter.getSupabase()
          if (supabase) {
            await supabase.removeChannel(this.subscription)
          }
        }
      } catch (error) {
        console.error('[RealtimeSync] Error removing Supabase subscription:', error)
      }
      this.subscription = null
    }

    // Stop SQLite polling
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
    }

    // Clear recent changes
    this.recentChanges.clear()

    this.isInitialized = false
    this.broadcastSyncStatus('stopped', this.dbType)

    console.log('[RealtimeSync] Sync service stopped')
  }

  /**
   * Get sync statistics
   */
  getStats() {
    return {
      ...this.stats,
      dbType: this.dbType,
      isRunning: this.isRunning,
      lastSyncTime: this.lastSyncTime
    }
  }

  /**
   * Manually trigger a sync check (SQLite mode only)
   */
  async triggerSync() {
    if (this.dbType === 'sqlite' && this.isRunning) {
      await this.pollForChanges()
    }
  }

  /**
   * Register a change from local operation (to prevent broadcast loops)
   * Call this when your app makes a local change that shouldn't be re-broadcast
   */
  registerLocalChange(siteId, operation) {
    const changeId = `${operation}-${siteId}-${Date.now()}`
    this.recentChanges.set(changeId, Date.now())
  }
}

// Singleton instance
const realtimeSync = new RealtimeSync()

module.exports = realtimeSync
module.exports.RealtimeSync = RealtimeSync
module.exports.SYNC_EVENTS = SYNC_EVENTS
