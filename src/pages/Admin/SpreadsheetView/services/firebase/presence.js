/**
 * Presence Service - STUB (Firebase Removed)
 *
 * Firebase has been removed from the project.
 * This is a stub implementation for backward compatibility.
 * Real-time presence should be implemented via WebSocket if needed.
 */

class PresenceServiceStub {
  constructor() {
    this.currentUser = null
    this.onlineUsers = []
    this.listeners = []
    this.currentSite = null
  }

  /**
   * Initialize presence tracking (stub - returns resolved promise)
   * @param {string} userId - User ID
   * @param {string} userName - User name
   */
  async initialize(userId, userName) {
    this.currentUser = { id: userId, name: userName }
    console.log('[Presence] Stub: initialize called (Firebase removed)')
    return this
  }

  /**
   * Alias for initialize (backward compatibility)
   */
  init(userId, userName) {
    return this.initialize(userId, userName)
  }

  /**
   * Listen to presence changes (stub - returns unsubscribe function)
   * @param {Function} callback - Called with array of online users
   * @returns {Function} Unsubscribe function
   */
  listen(callback) {
    console.log('[Presence] Stub: listen called')
    // Add to listeners
    this.listeners.push(callback)

    // Immediately call with empty array
    if (callback) {
      setTimeout(() => callback([]), 0)
    }

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * Alias for listen (backward compatibility)
   */
  subscribe(callback) {
    return this.listen(callback)
  }

  /**
   * Set current site being viewed/edited
   * @param {string} siteId - Site ID
   * @param {string} siteName - Site name
   */
  setCurrentSite(siteId, siteName = null) {
    this.currentSite = siteId ? { id: siteId, name: siteName } : null
    console.log('[Presence] Stub: setCurrentSite', siteId)
    return Promise.resolve()
  }

  /**
   * Set user as online (no-op)
   */
  setOnline() {
    console.log('[Presence] Stub: setOnline called')
    return Promise.resolve()
  }

  /**
   * Set user as offline (no-op)
   */
  setOffline() {
    console.log('[Presence] Stub: setOffline called')
    return Promise.resolve()
  }

  /**
   * Get online users (returns empty array)
   */
  getOnlineUsers() {
    return []
  }

  /**
   * Update user activity (no-op)
   */
  updateActivity(activity) {
    console.log('[Presence] Stub: updateActivity called', activity)
    return Promise.resolve()
  }

  /**
   * Track cell being edited (no-op)
   */
  trackCellEdit(cellId, value) {
    console.log('[Presence] Stub: trackCellEdit called', cellId)
    return Promise.resolve()
  }

  /**
   * Stop tracking cell edit (no-op)
   */
  stopCellEdit(cellId) {
    console.log('[Presence] Stub: stopCellEdit called', cellId)
    return Promise.resolve()
  }

  /**
   * Cleanup (no-op)
   */
  cleanup() {
    console.log('[Presence] Stub: cleanup called')
    this.listeners = []
    return Promise.resolve()
  }

  /**
   * Destroy instance (no-op)
   */
  destroy() {
    this.currentUser = null
    this.onlineUsers = []
    this.listeners = []
    this.currentSite = null
    console.log('[Presence] Stub: destroy called')
  }
}

// Export singleton instance
export const presenceService = new PresenceServiceStub()
export default presenceService
