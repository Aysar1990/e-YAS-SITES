/**
 * SupabaseSync - Service for syncing data from SQLite to Supabase
 *
 * Handles uploading site data from local SQLite database to Supabase cloud.
 * Features:
 * - Batch uploads (50 records per batch)
 * - Column name mapping for compatibility
 * - Progress tracking with callbacks
 * - Error handling with continuation on batch failure
 * - User management sync
 *
 * @author TSSR Monitor Team
 */

const { createClient } = require('@supabase/supabase-js')
const db = require('../database/db')

class SupabaseSync {
  constructor() {
    this.supabase = null
    this.connected = false
    this.BATCH_SIZE = 50
    this.columnMapping = {}
    this._initializeClient()
  }

  _initializeClient() {
    try {
      const supabaseUrl = process.env.SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_SERVICE_KEY

      if (!supabaseUrl || !supabaseKey) {
        console.warn('⚠️ SupabaseSync: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY')
        return
      }

      this.supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false, autoRefreshToken: false },
        db: { schema: 'public' }
      })

      console.log('✅ SupabaseSync: Client initialized')
    } catch (error) {
      console.error('❌ SupabaseSync: Failed to initialize client:', error.message)
    }
  }

  async testConnection() {
    if (!this.supabase) {
      return { success: false, message: 'Supabase client not initialized.' }
    }

    try {
      const startTime = Date.now()
      const { error } = await this.supabase.from('sites').select('site_id', { count: 'exact', head: true }).limit(1)
      const latency = Date.now() - startTime

      if (error && error.code !== 'PGRST116') throw error

      this.connected = true
      return { success: true, message: 'Connected to Supabase', latency }
    } catch (error) {
      this.connected = false
      return { success: false, message: `Connection failed: ${error.message}` }
    }
  }

  _transformRecord(record) {
    const transformed = {}
    for (const [key, value] of Object.entries(record)) {
      if (key === 'id') continue
      transformed[this.columnMapping[key] || key] = value
    }
    return transformed
  }

  async _readSitesFromSQLite(phaseName) {
    try {
      const stmt = db.prepare('SELECT * FROM sites WHERE phase_name = ?')
      return stmt.all(phaseName)
    } catch (error) {
      console.error('❌ SupabaseSync: Error reading from SQLite:', error.message)
      throw error
    }
  }

  async _uploadBatch(batch) {
    try {
      const { data, error } = await this.supabase
        .from('sites')
        .upsert(batch, { onConflict: 'site_id,phase_name', ignoreDuplicates: false })
        .select()

      if (error) throw error
      return { success: true, inserted: 0, updated: data ? data.length : batch.length }
    } catch (error) {
      return { success: false, inserted: 0, updated: 0, error: error.message }
    }
  }

  async syncPhaseToSupabase(phaseName, onProgress = null) {
    const summary = { total: 0, inserted: 0, updated: 0, failed: 0, errors: [] }

    if (!this.supabase) {
      summary.errors.push({ batch: 0, message: 'Supabase client not initialized' })
      return summary
    }

    try {
      const sites = await this._readSitesFromSQLite(phaseName)
      summary.total = sites.length

      if (sites.length === 0) return summary

      const transformedSites = sites.map(site => this._transformRecord(site))
      const batches = []
      for (let i = 0; i < transformedSites.length; i += this.BATCH_SIZE) {
        batches.push(transformedSites.slice(i, i + this.BATCH_SIZE))
      }

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i]
        const current = Math.min((i + 1) * this.BATCH_SIZE, summary.total)
        const result = await this._uploadBatch(batch)

        if (result.success) {
          summary.updated += result.updated
        } else {
          summary.failed += batch.length
          summary.errors.push({ batch: i + 1, message: result.error })
        }

        if (onProgress) onProgress({ current, total: summary.total, percentage: Math.round((current / summary.total) * 100) })
      }

      return summary
    } catch (error) {
      summary.errors.push({ batch: 0, message: error.message })
      return summary
    }
  }

  async getSyncStats(phaseName) {
    try {
      const localStmt = db.prepare('SELECT COUNT(*) as count FROM sites WHERE phase_name = ?')
      const localCount = localStmt.get(phaseName)?.count || 0

      let remoteCount = 0
      if (this.supabase) {
        const { count } = await this.supabase.from('sites').select('*', { count: 'exact', head: true }).eq('phase_name', phaseName)
        remoteCount = count || 0
      }

      return { localCount, remoteCount }
    } catch (error) {
      return { localCount: 0, remoteCount: 0 }
    }
  }

  isReady() {
    return this.supabase !== null
  }

  async importDirectToSupabase(sites, onProgress = null) {
    const result = { success: false, total: sites.length, inserted: 0, updated: 0, failed: 0, errors: [] }

    if (!this.supabase) {
      result.errors.push({ message: 'Supabase client not initialized' })
      return result
    }

    if (!sites || sites.length === 0) {
      result.success = true
      return result
    }

    try {
      const transformedSites = sites.map(site => this._transformRecord(site))
      const batches = []
      for (let i = 0; i < transformedSites.length; i += this.BATCH_SIZE) {
        batches.push(transformedSites.slice(i, i + this.BATCH_SIZE))
      }

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i]
        try {
          const { data, error } = await this.supabase
            .from('sites')
            .upsert(batch, { onConflict: 'site_id,phase_name', ignoreDuplicates: false })
            .select()

          if (error) throw error
          result.updated += data ? data.length : batch.length
        } catch (batchError) {
          result.failed += batch.length
          result.errors.push({ batch: i + 1, message: batchError.message })
        }

        if (onProgress) {
          const current = Math.min((i + 1) * this.BATCH_SIZE, result.total)
          onProgress({ current, total: result.total, percentage: Math.round((current / result.total) * 100) })
        }
      }

      result.success = result.failed === 0
      return result
    } catch (error) {
      result.errors.push({ message: error.message })
      return result
    }
  }

  async upsertSite(site) {
    if (!this.supabase) return { success: false, error: 'Supabase client not initialized' }

    try {
      const { error } = await this.supabase
        .from('sites')
        .upsert(this._transformRecord(site), { onConflict: 'site_id,phase_name', ignoreDuplicates: false })

      if (error) throw error
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async deleteSite(siteId) {
    if (!this.supabase) return { success: false, error: 'Supabase client not initialized' }

    try {
      const { error } = await this.supabase.from('sites').delete().eq('site_id', siteId)
      if (error) throw error
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async getSitesFromSupabase(phaseName = null) {
    if (!this.supabase) return []

    try {
      let query = this.supabase.from('sites').select('*')
      if (phaseName) query = query.eq('phase_name', phaseName)

      const { data, error } = await query
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ SupabaseSync: Failed to get sites:', error.message)
      return []
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // USER MANAGEMENT - Supabase Sync
  // ═══════════════════════════════════════════════════════════════════

  async syncUserToSupabase(user) {
    if (!this.supabase) return { success: false, error: 'Supabase client not initialized' }

    try {
      const { error } = await this.supabase
        .from('users')
        .upsert({
          username: user.username,
          password: user.password,
          role: user.role,
          contractor_name: user.contractor_name || null,
          is_active: user.is_active !== undefined ? user.is_active : 1,
          updated_at: new Date().toISOString()
        }, { onConflict: 'username', ignoreDuplicates: false })

      if (error) throw error
      console.log(`✅ User "${user.username}" synced to Supabase`)
      return { success: true }
    } catch (error) {
      console.error(`❌ Failed to sync user to Supabase:`, error.message)
      return { success: false, error: error.message }
    }
  }

  async deleteUserFromSupabase(username) {
    if (!this.supabase) return { success: false, error: 'Supabase client not initialized' }

    try {
      const { error } = await this.supabase.from('users').delete().eq('username', username)
      if (error) throw error
      console.log(`🗑️ User "${username}" deleted from Supabase`)
      return { success: true }
    } catch (error) {
      console.error(`❌ Failed to delete user from Supabase:`, error.message)
      return { success: false, error: error.message }
    }
  }

  async getUsersFromSupabase() {
    if (!this.supabase) return []

    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .order('role', { ascending: true })
        .order('username', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Failed to get users from Supabase:', error.message)
      return []
    }
  }
}

// Singleton instance
const supabaseSync = new SupabaseSync()

module.exports = supabaseSync
