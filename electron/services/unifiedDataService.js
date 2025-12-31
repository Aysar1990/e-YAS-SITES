/**
 * UnifiedDataService - Smart Data Layer
 * 
 * Handles data flow between SQLite (offline) and Supabase (online)
 * 
 * Priority:
 * 1. Online → Read from Supabase
 * 2. Offline → Read from SQLite
 * 3. Import → Save to BOTH
 * 4. Update → Sync to BOTH
 */

const db = require('../database/db')
const sitesQueries = require('../database/queries/sites')
const supabaseSync = require('./supabaseSync')

class UnifiedDataService {
  constructor() {
    this.isOnline = false
    this.lastOnlineCheck = null
    this.checkInterval = 30000 // Check every 30 seconds
  }

  /**
   * Check if Supabase is reachable
   */
  async checkOnlineStatus() {
    try {
      const now = Date.now()
      
      // Use cached status if checked recently
      if (this.lastOnlineCheck && (now - this.lastOnlineCheck) < this.checkInterval) {
        return this.isOnline
      }

      // Check Supabase connection
      if (supabaseSync.isReady()) {
        const result = await supabaseSync.testConnection()
        this.isOnline = result.success
      } else {
        this.isOnline = false
      }

      this.lastOnlineCheck = now
      console.log(`🌐 Online status: ${this.isOnline ? 'ONLINE' : 'OFFLINE'}`)
      
      return this.isOnline
    } catch (error) {
      this.isOnline = false
      console.log('🔴 Offline mode (connection check failed)')
      return false
    }
  }

  /**
   * Force online status check
   */
  async forceCheckOnline() {
    this.lastOnlineCheck = null
    return await this.checkOnlineStatus()
  }

  /**
   * Get all sites - Smart data source selection
   */
  async getAllSites(phase) {
    try {
      const online = await this.checkOnlineStatus()

      if (online) {
        console.log('📡 Reading from Supabase (online)...')
        const sites = await this.getFromSupabase(phase)
        if (sites && sites.length > 0) {
          return { success: true, sites, source: 'supabase' }
        }
        // Fallback to SQLite if Supabase returns empty
        console.log('⚠️ Supabase empty, falling back to SQLite...')
      }

      console.log('💾 Reading from SQLite (offline/fallback)...')
      const sites = sitesQueries.getAllSites(phase)
      return { success: true, sites, source: 'sqlite' }

    } catch (error) {
      console.error('❌ UnifiedDataService.getAllSites error:', error)
      
      // Final fallback to SQLite
      try {
        const sites = sitesQueries.getAllSites(phase)
        return { success: true, sites, source: 'sqlite_fallback' }
      } catch (sqliteError) {
        return { success: false, error: sqliteError.message, sites: [] }
      }
    }
  }

  /**
   * Get sites from Supabase
   */
  async getFromSupabase(phase) {
    try {
      if (!supabaseSync.isReady()) {
        return []
      }

      const client = supabaseSync.getClient()
      let query = client.from('sites').select('*')

      if (phase && phase !== 'ALL') {
        query = query.eq('phase_name', phase)
      }

      const { data, error } = await query.order('priority', { ascending: true })

      if (error) {
        console.error('Supabase query error:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('getFromSupabase error:', error)
      return []
    }
  }

  /**
   * Import data to BOTH SQLite and Supabase
   */
  async importToBoth(sites, onProgress) {
    const result = {
      success: true,
      sqlite: { inserted: 0, updated: 0, failed: 0 },
      supabase: { inserted: 0, updated: 0, failed: 0 },
      total: sites.length,
      errors: []
    }

    try {
      // Step 1: Import to SQLite
      console.log('💾 Step 1: Importing to SQLite...')
      if (onProgress) onProgress({ stage: 'sqlite', percentage: 0 })

      const sqliteResult = await this.importToSQLite(sites, (progress) => {
        if (onProgress) {
          onProgress({
            stage: 'sqlite',
            percentage: Math.round(progress.percentage / 2), // 0-50%
            current: progress.current,
            total: progress.total
          })
        }
      })

      result.sqlite = sqliteResult
      console.log(`✅ SQLite: ${sqliteResult.inserted} inserted, ${sqliteResult.updated} updated`)

      // Step 2: Import to Supabase (if online)
      const online = await this.checkOnlineStatus()
      
      if (online) {
        console.log('☁️ Step 2: Importing to Supabase...')
        if (onProgress) onProgress({ stage: 'supabase', percentage: 50 })

        const supabaseResult = await this.importToSupabase(sites, (progress) => {
          if (onProgress) {
            onProgress({
              stage: 'supabase',
              percentage: 50 + Math.round(progress.percentage / 2), // 50-100%
              current: progress.current,
              total: progress.total
            })
          }
        })

        result.supabase = supabaseResult
        console.log(`✅ Supabase: ${supabaseResult.inserted} inserted, ${supabaseResult.updated} updated`)
      } else {
        console.log('⚠️ Offline - Supabase sync skipped (will sync when online)')
        result.supabase = { inserted: 0, updated: 0, failed: 0, skipped: true }
      }

      if (onProgress) onProgress({ stage: 'complete', percentage: 100 })

      // Determine overall success
      result.success = result.sqlite.failed === 0

    } catch (error) {
      result.success = false
      result.errors.push(error.message)
      console.error('❌ importToBoth error:', error)
    }

    return result
  }

  /**
   * Import sites to SQLite
   */
  async importToSQLite(sites, onProgress) {
    const result = { inserted: 0, updated: 0, failed: 0, errors: [] }
    const database = db.getDB()
    const { generateUpsertSQL, getSQLiteColumns } = require('../columnDefinitions')

    try {
      const upsertSQL = generateUpsertSQL('sites')
      const columns = getSQLiteColumns()

      for (let i = 0; i < sites.length; i++) {
        try {
          const site = sites[i]
          
          // Check if exists
          const existingStmt = database.prepare(
            'SELECT site_id FROM sites WHERE site_id = ? AND phase_name = ?'
          )
          const existing = existingStmt.get(site.site_id, site.phase_name || null)

          // Prepare values
          const values = columns.map(col => site[col] ?? null)

          // Execute upsert
          const stmt = database.prepare(upsertSQL)
          stmt.run(...values)

          if (existing) {
            result.updated++
          } else {
            result.inserted++
          }
        } catch (err) {
          result.failed++
          result.errors.push({ siteId: sites[i]?.site_id, error: err.message })
        }

        // Progress callback
        if (onProgress && i % 100 === 0) {
          onProgress({
            current: i + 1,
            total: sites.length,
            percentage: Math.round(((i + 1) / sites.length) * 100)
          })
        }
      }

      // Save to disk
      if (database.save) {
        database.save()
        console.log('💾 SQLite saved to disk')
      }

    } catch (error) {
      result.errors.push({ error: error.message })
      console.error('importToSQLite error:', error)
    }

    return result
  }

  /**
   * Import sites to Supabase
   */
  async importToSupabase(sites, onProgress) {
    try {
      if (!supabaseSync.isReady()) {
        return { inserted: 0, updated: 0, failed: sites.length, error: 'Supabase not configured' }
      }

      return await supabaseSync.importDirectToSupabase(sites, onProgress)
    } catch (error) {
      return { inserted: 0, updated: 0, failed: sites.length, error: error.message }
    }
  }

  /**
   * Update a single site in BOTH databases
   */
  async updateSite(siteId, phaseName, updates) {
    const result = {
      success: true,
      sqlite: { success: false },
      supabase: { success: false }
    }

    try {
      // Update SQLite first
      const updatedSite = sitesQueries.updateSite(siteId, phaseName, updates)
      result.sqlite.success = !!updatedSite
      result.sqlite.site = updatedSite

      // Sync to Supabase if online
      const online = await this.checkOnlineStatus()
      if (online && supabaseSync.isReady()) {
        try {
          const client = supabaseSync.getClient()
          const { error } = await client
            .from('sites')
            .update(updates)
            .eq('site_id', siteId)
            .eq('phase_name', phaseName)

          result.supabase.success = !error
          if (error) result.supabase.error = error.message
        } catch (supError) {
          result.supabase.error = supError.message
        }
      }

      result.success = result.sqlite.success
      return result

    } catch (error) {
      result.success = false
      result.error = error.message
      return result
    }
  }

  /**
   * Get stats - Smart source selection
   */
  async getStats(phase) {
    try {
      const online = await this.checkOnlineStatus()

      // Always use SQLite for stats (faster for aggregations)
      // Supabase stats would require multiple queries
      const overallStats = sitesQueries.getOverallStats(phase)
      const deptStats = sitesQueries.getDepartmentStats(phase)
      const totalSites = sitesQueries.getTotalCount(phase)

      return {
        success: true,
        stats: {
          statusBreakdown: overallStats,
          departmentStats: deptStats,
          totalSites,
          source: online ? 'sqlite_cached' : 'sqlite'
        }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Sync SQLite to Supabase (manual trigger)
   */
  async syncToSupabase(phase, onProgress) {
    try {
      const online = await this.forceCheckOnline()
      
      if (!online) {
        return { success: false, error: 'No internet connection' }
      }

      // Get all sites from SQLite
      const sites = sitesQueries.getAllSites(phase)
      
      if (!sites || sites.length === 0) {
        return { success: false, error: 'No sites to sync' }
      }

      console.log(`📤 Syncing ${sites.length} sites to Supabase...`)

      // Import to Supabase
      const result = await this.importToSupabase(sites, onProgress)

      return {
        success: result.failed === 0,
        synced: result.inserted + result.updated,
        failed: result.failed,
        errors: result.errors
      }

    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Get current data source info
   */
  async getDataSourceInfo() {
    const online = await this.checkOnlineStatus()
    const sqliteCount = sitesQueries.getTotalCount()
    
    let supabaseCount = 0
    if (online && supabaseSync.isReady()) {
      try {
        const client = supabaseSync.getClient()
        const { count } = await client.from('sites').select('*', { count: 'exact', head: true })
        supabaseCount = count || 0
      } catch (e) {
        supabaseCount = 0
      }
    }

    return {
      online,
      activeSource: online ? 'supabase' : 'sqlite',
      sqlite: {
        count: sqliteCount,
        available: true
      },
      supabase: {
        count: supabaseCount,
        available: online && supabaseSync.isReady()
      },
      syncNeeded: sqliteCount !== supabaseCount
    }
  }
}

// Singleton instance
const unifiedDataService = new UnifiedDataService()

module.exports = unifiedDataService
