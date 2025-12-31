/**
 * useRealTimeSync Hook
 * Handles real-time WebSocket event subscriptions
 * Extracted from DataContext.jsx
 */

import { useEffect, useCallback, useState, useRef } from 'react'
import { isClientMode } from './apiManager'

export const useRealTimeSync = (api, user, fetchData) => {
  const [connectionStatus, setConnectionStatus] = useState({
    connected: false,
    clientId: null,
    lastSyncTime: null
  })
  const [nokiaReviews, setNokiaReviews] = useState({})
  const [pendingUpdates, setPendingUpdates] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)
  const [syncServiceStatus, setSyncServiceStatus] = useState({
    status: 'unknown',
    mode: null,
    stats: null
  })

  const clientModeRef = useRef(isClientMode())

  // Toast helper
  const showToast = useCallback((message, duration = 3000) => {
    setToastMessage(message)
    setTimeout(() => setToastMessage(null), duration)
  }, [])

  const clearToast = useCallback(() => {
    setToastMessage(null)
  }, [])

  // Site state updater (returned to parent)
  const [siteUpdaters, setSiteUpdaters] = useState({
    onSiteAdded: null,
    onSiteUpdated: null,
    onSiteDeleted: null
  })

  // Setup real-time event listeners
  useEffect(() => {
    // Sync complete handler (works in all modes)
    if (api.onSyncComplete) {
      api.onSyncComplete((data) => {
        console.log('Sync complete:', data)
        if (data.success && fetchData) {
          fetchData()
        }
      })
    }

    // Real-time handlers (only for API Client mode)
    if (!clientModeRef.current) return

    // Connection status
    if (api.onConnectionStatus) {
      api.onConnectionStatus((status) => {
        console.log('[RealTimeSync] Connection status:', status)
        setConnectionStatus(status)
      })
    }

    // Nokia review updates
    if (api.onNokiaReviewUpdated) {
      api.onNokiaReviewUpdated((data) => {
        console.log('[RealTimeSync] Nokia review updated:', data)
        setNokiaReviews(prev => ({
          ...prev,
          [data.site_id]: { ...prev[data.site_id], ...data }
        }))
        showToast(`Site ${data.site_id} updated by ${data.updated_by}`)
        setPendingUpdates(true)
      })
    }

    // Data synced
    if (api.onDataSynced) {
      api.onDataSynced((data) => {
        console.log('[RealTimeSync] Data synced:', data)
        showToast('Data synchronized from server')
        setPendingUpdates(true)
      })
    }

    // User login
    if (api.onUserLoggedIn) {
      api.onUserLoggedIn((data) => {
        console.log('[RealTimeSync] User logged in:', data)
        showToast(`${data.username} has logged in`)
      })
    }

    // General notifications
    if (api.onNotification) {
      api.onNotification((data) => {
        console.log('[RealTimeSync] Notification:', data)
        if (data.type === 'user_connected') {
          showToast(`A user connected (${data.connectedClients} online)`)
        } else if (data.type === 'user_disconnected') {
          showToast(`A user disconnected (${data.connectedClients} online)`)
        }
      })
    }

    // Sync status
    if (api.onSyncStatus) {
      api.onSyncStatus((data) => {
        console.log('[RealTimeSync] Sync status:', data)
        setSyncServiceStatus({
          status: data.status,
          mode: data.mode,
          stats: data.stats
        })
      })
    }

    // Connect WebSocket
    if (api.connectWebSocket) {
      api.connectWebSocket()
    }

    return () => {
      // Cleanup listeners
      if (api.removeAllListeners) {
        api.removeAllListeners('sync-complete')
        api.removeAllListeners('nokia_review_updated')
        api.removeAllListeners('data_synced')
        api.removeAllListeners('user_logged_in')
        api.removeAllListeners('notification')
        api.removeAllListeners('connection_status')
        api.removeAllListeners('site_added')
        api.removeAllListeners('site_updated')
        api.removeAllListeners('site_deleted')
        api.removeAllListeners('sync_status')
      }
      if (api.disconnectWebSocket) {
        api.disconnectWebSocket()
      }
    }
  }, [api, user, fetchData, showToast])

  // Setup site event handlers (separated to allow sites state access)
  const setupSiteHandlers = useCallback((setSites) => {
    if (!clientModeRef.current) return

    // Site added
    if (api.onSiteAdded) {
      api.onSiteAdded((data) => {
        console.log('[RealTimeSync] Site added:', data)
        if (data.site) {
          setSites(prev => {
            const exists = prev.some(s => s.id === data.site.id || s.site_id === data.site.site_id)
            if (exists) return prev
            return [...prev, data.site]
          })
          showToast(`New site added: ${data.site.site_id || data.site.id}`)
        }
      })
    }

    // Site updated
    if (api.onSiteUpdated) {
      api.onSiteUpdated((data) => {
        console.log('[RealTimeSync] Site updated:', data)
        if (data.site) {
          setSites(prev => prev.map(s =>
            (s.id === data.site.id || s.site_id === data.site.site_id)
              ? { ...s, ...data.site }
              : s
          ))
        }
      })
    }

    // Site deleted
    if (api.onSiteDeleted) {
      api.onSiteDeleted((data) => {
        console.log('[RealTimeSync] Site deleted:', data)
        if (data.site) {
          setSites(prev => prev.filter(s =>
            s.id !== data.site.id && s.site_id !== data.site.site_id
          ))
          showToast(`Site removed: ${data.site.site_id || data.site.id}`)
        }
      })
    }
  }, [api, showToast])

  // Apply pending updates
  const applyPendingUpdates = useCallback(async () => {
    setPendingUpdates(false)
    if (fetchData) await fetchData()
    showToast('Data refreshed')
  }, [fetchData, showToast])

  // Dismiss pending updates
  const dismissPendingUpdates = useCallback(() => {
    setPendingUpdates(false)
  }, [])

  // Get formatted last sync time
  const getLastSyncTime = useCallback(() => {
    if (!connectionStatus.lastSyncTime) return null

    const now = new Date()
    const lastSync = new Date(connectionStatus.lastSyncTime)
    const diffSeconds = Math.floor((now - lastSync) / 1000)

    if (diffSeconds < 60) return `${diffSeconds} seconds ago`
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} minutes ago`
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} hours ago`
    return lastSync.toLocaleDateString()
  }, [connectionStatus.lastSyncTime])

  return {
    connectionStatus,
    nokiaReviews,
    pendingUpdates,
    toastMessage,
    syncServiceStatus,
    showToast,
    clearToast,
    applyPendingUpdates,
    dismissPendingUpdates,
    getLastSyncTime,
    setupSiteHandlers
  }
}

export default useRealTimeSync
