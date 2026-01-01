/**
 * API Client for multi-client mode
 * Provides same interface as window.electron for seamless integration
 */

import { AUTH_TOKEN_KEY } from '../utils/constants'

// WebSocket Event Types (must match server)
const WS_EVENTS = {
  SITE_UPDATED: 'site_updated',
  STATUS_CHANGED: 'status_changed',
  NOKIA_REVIEW_UPDATED: 'nokia_review_updated',
  USER_LOGGED_IN: 'user_logged_in',
  DATA_SYNCED: 'data_synced',
  NOTIFICATION: 'notification',
  CONNECTION_STATUS: 'connection_status',
  // Real-time sync events (Day 11)
  SITE_ADDED: 'site_added',
  SITE_DELETED: 'site_deleted',
  SYNC_STATUS: 'sync_status'
}

class ApiClient {
  constructor(serverIP) {
    this.serverIP = serverIP
    this.baseURL = serverIP ? this.buildBaseURL(serverIP) : ''
    this.wsURL = serverIP ? this.buildWsURL(serverIP) : ''
    this.ws = null
    this.syncCallback = null
    this.liveSyncCallback = null

    // Event listeners for real-time updates
    this.eventListeners = {}

    // Connection state
    this.isConnected = false
    this.clientId = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 10
    this.reconnectDelay = 1000 // Start with 1 second
    this.lastSyncTime = null
    this.pingInterval = null

    // Connection status callback
    this.connectionStatusCallback = null
  }

  // Check if IP is a domain or full URL
  isDomain(ip) {
    return ip && (
      ip.includes('.com') ||
      ip.includes('.net') ||
      ip.includes('.io') ||
      ip.includes('.dev') ||
      ip.includes('.app') ||
      ip.includes('.onrender.com') ||
      ip.includes('.vercel.app') ||
      ip.includes('.supabase.co')
    )
  }

  // Build base URL based on IP type
  buildBaseURL(ip) {
    // If already a full URL, just append /api if needed
    if (ip.startsWith('http://') || ip.startsWith('https://')) {
      const url = ip.replace(/\/$/, '')
      return url.endsWith('/api') ? url : `${url}/api`
    }

    const cleanIP = ip.replace(/^https?:\/\//, '').replace(/\/$/, '')

    // Use HTTPS for domains, HTTP for local IPs
    if (this.isDomain(cleanIP)) {
      return `https://${cleanIP}/api`
    }
    return `http://${cleanIP}:3001/api`
  }

  // Build WebSocket URL (now uses Supabase Realtime instead)
  buildWsURL(ip) {
    // For cloud deployment, we use Supabase Realtime instead of WebSocket
    // This method is kept for backward compatibility
    const cleanIP = ip.replace(/^https?:\/\//, '').replace(/\/$/, '')

    if (this.isDomain(cleanIP)) {
      // For cloud, WebSocket is typically not needed (use Supabase Realtime)
      return null
    }
    return `ws://${cleanIP}:3002`
  }

  configure(serverIP) {
    this.serverIP = serverIP
    this.baseURL = this.buildBaseURL(serverIP)
    this.wsURL = this.buildWsURL(serverIP)
  }

  getAuthToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY)
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const token = this.getAuthToken()

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          ...options.headers
        }
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        return { success: false, error: error.error || `HTTP ${response.status}` }
      }

      return await response.json()
    } catch (error) {
      console.error(`[API Client] Error: ${endpoint}`, error)
      return { success: false, error: error.message }
    }
  }

  // ============================================
  // DATA METHODS - Same interface as window.electron
  // ============================================

  async getPhases() {
    try {
      const result = await this.request('/phases')
      if (result.success === false) return result
      return { success: true, phases: Array.isArray(result) ? result : [] }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async getData({ phase, role, contractorName }) {
    try {
      const params = new URLSearchParams()
      if (phase) params.append('phase', phase)
      if (role) params.append('role', role)
      if (contractorName) params.append('contractor', contractorName)

      const result = await this.request(`/sites?${params}`)
      if (result.success === false) return result
      return { success: true, sites: Array.isArray(result) ? result : [], count: result.length || 0 }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async getStats({ phase, role, contractorName }) {
    try {
      const params = new URLSearchParams()
      if (phase) params.append('phase', phase)
      if (role) params.append('role', role)
      if (contractorName) params.append('contractor', contractorName)

      const result = await this.request(`/stats?${params}`)
      if (result.success === false) return result
      
      return {
        success: true,
        stats: {
          statusBreakdown: result.statusBreakdown || [],
          partOfStats: result.partOfStats || [],
          overviewStats: result.overviewStats || {},
          departmentStats: result.departmentStats || {},
          contractorsSummary: result.contractorsSummary || [],
          totalSites: result.overviewStats?.total || 0
        }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async getSettings() {
    try {
      const result = await this.request('/settings')
      if (result.success === false) return { success: true, settings: {} }
      return { success: true, settings: result }
    } catch (error) {
      return { success: true, settings: {} }
    }
  }

  async getStatsByPartOf({ phase }) {
    try {
      const result = await this.request(`/stats/breakdown?phase=${phase || 'ALL'}`)
      if (result.success === false) return result
      return { success: true, stats: result }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async getOverviewTable({ phase }) {
    try {
      const result = await this.request(`/stats/overview?phase=${phase || 'ALL'}`)
      if (result.success === false) return result
      return { success: true, table: Array.isArray(result) ? result : [] }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async getContractors() {
    try {
      const result = await this.request('/contractors')
      if (result.success === false) return result
      return { success: true, contractors: Array.isArray(result) ? result : [], uniqueFromSites: [] }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // THIS IS THE KEY METHOD FOR CONTRACTORS PAGE
  async getContractorDetailedStats({ phase, name }) {
    try {
      if (name) {
        // Single contractor stats
        const result = await this.request(`/contractors/${encodeURIComponent(name)}/stats?phase=${phase || 'ALL'}`)
        if (result.success === false) return result
        return { success: true, stats: result }
      }
      
      // Use /contractors/detailed for full contractor dashboard
      const result = await this.request(`/contractors/detailed?phase=${phase || 'ALL'}`)
      console.log('[API Client] Contractors detailed result:', result)
      if (result.success === false) return result
      return { success: true, contractors: Array.isArray(result) ? result : [] }
    } catch (error) {
      console.error('[API Client] getContractorDetailedStats error:', error)
      return { success: false, error: error.message }
    }
  }

  async searchSites({ query, phase }) {
    try {
      const params = new URLSearchParams({ search: query })
      if (phase) params.append('phase', phase)
      
      const result = await this.request(`/sites?${params}`)
      if (result.success === false) return result
      return { success: true, sites: Array.isArray(result) ? result : [] }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async getRejections({ contractorName, phase }) {
    try {
      const params = new URLSearchParams()
      if (phase) params.append('phase', phase)
      if (contractorName) params.append('contractor', contractorName)

      const result = await this.request(`/rejections?${params}`)
      if (result.success === false) return result
      return { success: true, rejections: Array.isArray(result) ? result : [], unviewedCount: 0 }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Update site with validation (Day 12)
  async updateSite({ siteId, phaseName, updates, username }) {
    try {
      const params = new URLSearchParams()
      if (phaseName) params.append('phase', phaseName)

      const result = await this.request(`/sites/${encodeURIComponent(siteId)}?${params}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      })

      return result
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // ============================================
  // READ-ONLY STUBS (Not available in client mode)
  // ============================================

  async manualSync() {
    return { success: false, error: 'Sync not available in client mode' }
  }

  async updateSettings() {
    return { success: false, error: 'Settings update not available in client mode' }
  }

  async exportExcel() {
    return { success: false, error: 'Export not available in client mode' }
  }

  async selectExcelFile() {
    return { success: false, error: 'File selection not available in client mode' }
  }

  async getSyncStatus() {
    return { success: true, lastSync: null, liveSync: null }
  }

  async getLiveSyncStatus() {
    return { success: true, enabled: false, status: null }
  }

  // ============================================
  // WEBSOCKET CONNECTION
  // ============================================

  connectWebSocket(onMessage) {
    // Skip WebSocket for cloud mode (wsURL is null)
    if (!this.wsURL) {
      console.log('[WS Client] Skipped - cloud mode (using Supabase Realtime)')
      return
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) return

    try {
      console.log('[WS Client] Connecting to:', this.wsURL)
      this.ws = new WebSocket(this.wsURL)

      this.ws.onopen = () => {
        console.log('[WS Client] Connected to server')
        this.isConnected = true
        this.reconnectAttempts = 0
        this.reconnectDelay = 1000 // Reset reconnect delay
        this.lastSyncTime = new Date()

        // Start ping interval to keep connection alive
        this.startPingInterval()

        // Notify connection status change
        this.notifyConnectionStatus(true)
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleMessage(data, onMessage)
        } catch (e) {
          console.error('[WS Client] Parse error:', e)
        }
      }

      this.ws.onclose = () => {
        console.log('[WS Client] Disconnected')
        this.isConnected = false
        this.ws = null
        this.stopPingInterval()
        this.notifyConnectionStatus(false)

        // Reconnect with exponential backoff
        this.scheduleReconnect(onMessage)
      }

      this.ws.onerror = (error) => {
        console.error('[WS Client] Error:', error)
        this.isConnected = false
        this.notifyConnectionStatus(false)
      }
    } catch (error) {
      console.error('[WS Client] Connection failed:', error)
      this.scheduleReconnect(onMessage)
    }
  }

  // Handle incoming WebSocket messages
  handleMessage(data, onMessage) {
    const { event, data: eventData, timestamp } = data

    // Update last sync time
    this.lastSyncTime = new Date(timestamp || Date.now())

    // Handle connection status
    if (event === WS_EVENTS.CONNECTION_STATUS) {
      this.clientId = eventData.clientId
      console.log('[WS Client] Assigned client ID:', this.clientId)
    }

    // Handle sync events (backward compatibility)
    if (data.type === 'sync_complete' && this.syncCallback) {
      this.syncCallback(data.data)
    }

    if (data.type === 'live_sync_complete' && this.liveSyncCallback) {
      this.liveSyncCallback(data.data)
    }

    // Handle pong response
    if (event === 'pong') {
      console.log('[WS Client] Pong received')
      return
    }

    // Call registered event listeners
    if (event && this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => {
        try {
          callback(eventData)
        } catch (e) {
          console.error(`[WS Client] Error in ${event} listener:`, e)
        }
      })
    }

    // Call generic onMessage callback
    if (onMessage) onMessage(data)
  }

  // Schedule reconnection with exponential backoff
  scheduleReconnect(onMessage) {
    // Skip reconnect for cloud mode
    if (!this.wsURL) return

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[WS Client] Max reconnect attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000)

    console.log(`[WS Client] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

    setTimeout(() => this.connectWebSocket(onMessage), delay)
  }

  // Start ping interval to keep connection alive
  startPingInterval() {
    this.stopPingInterval()
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }))
      }
    }, 30000) // Ping every 30 seconds
  }

  // Stop ping interval
  stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
  }

  // Notify connection status change
  notifyConnectionStatus(connected) {
    if (this.connectionStatusCallback) {
      this.connectionStatusCallback({
        connected,
        clientId: this.clientId,
        lastSyncTime: this.lastSyncTime
      })
    }

    // Also notify event listeners
    if (this.eventListeners[WS_EVENTS.CONNECTION_STATUS]) {
      this.eventListeners[WS_EVENTS.CONNECTION_STATUS].forEach(callback => {
        callback({ connected, clientId: this.clientId, lastSyncTime: this.lastSyncTime })
      })
    }
  }

  disconnectWebSocket() {
    this.stopPingInterval()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.isConnected = false
    this.clientId = null
  }

  // ============================================
  // EVENT LISTENER REGISTRATION
  // ============================================

  // Register event listener
  on(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = []
    }
    this.eventListeners[event].push(callback)

    // Auto-connect WebSocket if not connected
    if (!this.ws) {
      this.connectWebSocket()
    }
  }

  // Remove event listener
  off(event, callback) {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback)
    }
  }

  // Convenience methods for specific events
  onSiteUpdated(callback) {
    this.on(WS_EVENTS.SITE_UPDATED, callback)
  }

  onStatusChanged(callback) {
    this.on(WS_EVENTS.STATUS_CHANGED, callback)
  }

  onNokiaReviewUpdated(callback) {
    this.on(WS_EVENTS.NOKIA_REVIEW_UPDATED, callback)
  }

  onUserLoggedIn(callback) {
    this.on(WS_EVENTS.USER_LOGGED_IN, callback)
  }

  onDataSynced(callback) {
    this.on(WS_EVENTS.DATA_SYNCED, callback)
  }

  onNotification(callback) {
    this.on(WS_EVENTS.NOTIFICATION, callback)
  }

  onConnectionStatus(callback) {
    this.connectionStatusCallback = callback
    this.on(WS_EVENTS.CONNECTION_STATUS, callback)
  }

  // Real-time sync event handlers (Day 11)
  onSiteAdded(callback) {
    this.on(WS_EVENTS.SITE_ADDED, callback)
  }

  onSiteDeleted(callback) {
    this.on(WS_EVENTS.SITE_DELETED, callback)
  }

  onSyncStatus(callback) {
    this.on(WS_EVENTS.SYNC_STATUS, callback)
  }

  // Legacy methods for backward compatibility
  onSyncComplete(callback) {
    this.syncCallback = callback
    this.connectWebSocket()
  }

  onLiveSyncComplete(callback) {
    this.liveSyncCallback = callback
    this.connectWebSocket()
  }

  onLiveSyncUpdate(callback) {
    this.onLiveSyncComplete(callback)
  }

  removeAllListeners(channel) {
    if (channel === 'sync-complete') {
      this.syncCallback = null
    }
    if (channel === 'live-sync-complete' || channel === 'live-sync-update') {
      this.liveSyncCallback = null
    }
    // Also remove from eventListeners
    if (this.eventListeners[channel]) {
      this.eventListeners[channel] = []
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      clientId: this.clientId,
      lastSyncTime: this.lastSyncTime,
      reconnectAttempts: this.reconnectAttempts
    }
  }

  // Request sync from server
  requestSync() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'request_sync' }))
    }
  }

  // ============================================
  // HEALTH CHECK
  // ============================================

  async checkHealth() {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)

      const response = await fetch(`${this.baseURL}/health`, {
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      return response.ok
    } catch {
      return false
    }
  }
}

export const createApiClient = (serverIP) => {
  return new ApiClient(serverIP)
}

export default ApiClient
