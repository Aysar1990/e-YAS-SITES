/**
 * Connection Indicator Component
 * Shows Online/Offline status with sync queue information
 * Enhanced with database sync status from Electron IPC
 */

import { useState, useEffect, useCallback } from 'react'
import './ConnectionIndicator.css'

const ConnectionIndicator = ({ showLabel = true, size = 'normal' }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showTooltip, setShowTooltip] = useState(false)
  const [status, setStatus] = useState({
    mode: 'online',
    isSyncing: false,
    syncQueue: { pending: 0, failed: 0, total: 0 },
    lastSyncTime: null,
    adapter: 'unknown'
  })
  const [loading, setLoading] = useState(false)

  // Fetch detailed status from Electron IPC
  const fetchStatus = useCallback(async () => {
    if (!window.electron?.getConnectionStatus) return

    try {
      const result = await window.electron.getConnectionStatus()
      if (result.success !== false) {
        setStatus(result)
        setIsOnline(result.isOnline)
      }
    } catch (error) {
      console.error('[Connection] Failed to fetch status:', error)
    }
  }, [])

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      console.log('[Connection] Back online - switching to Supabase')
      fetchStatus()
    }

    const handleOffline = () => {
      setIsOnline(false)
      console.log('[Connection] Offline - switching to SQLite')
      fetchStatus()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initial fetch
    fetchStatus()

    // Periodic refresh
    const interval = setInterval(fetchStatus, 10000) // Every 10 seconds

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [fetchStatus])

  const handleForceSync = async (e) => {
    e.stopPropagation()
    if (!window.electron?.forceSyncQueue) return

    setLoading(true)
    try {
      await window.electron.forceSyncQueue()
      await fetchStatus()
    } catch (error) {
      console.error('[Connection] Force sync failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRetryFailed = async (e) => {
    e.stopPropagation()
    if (!window.electron?.retryFailedOperations) return

    setLoading(true)
    try {
      await window.electron.retryFailedOperations()
      await fetchStatus()
    } catch (error) {
      console.error('[Connection] Retry failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (isoString) => {
    if (!isoString) return 'Never'
    const date = new Date(isoString)
    return date.toLocaleTimeString()
  }

  const hasPendingItems = (status.syncQueue?.pending || 0) > 0 || (status.syncQueue?.failed || 0) > 0
  const isSyncing = status.isSyncing || loading

  return (
    <div
      className={`connection-indicator ${size} ${isSyncing ? 'syncing' : ''}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className={`connection-dot ${isOnline ? 'online' : 'offline'} ${isSyncing ? 'syncing' : ''}`}>
        <span className="connection-pulse"></span>
      </div>

      {showLabel && (
        <span className={`connection-label ${isOnline ? 'online' : 'offline'}`}>
          {isSyncing ? 'Syncing...' : (isOnline ? 'Online' : 'Offline')}
        </span>
      )}

      {hasPendingItems && (
        <span className="pending-badge" title={`${status.syncQueue.pending} pending, ${status.syncQueue.failed} failed`}>
          {status.syncQueue.pending + status.syncQueue.failed}
        </span>
      )}

      {showTooltip && (
        <div className="connection-tooltip">
          <div className="tooltip-content">
            <div className="tooltip-header">
              <span className={`tooltip-status ${isOnline ? 'online' : 'offline'}`}>
                {isSyncing ? '🔄' : (isOnline ? '☁️' : '💾')}
              </span>
              <div className="tooltip-text">
                <strong>{isSyncing ? 'Syncing...' : (isOnline ? 'Connected' : 'Disconnected')}</strong>
                <span>{isOnline ? 'Supabase (Cloud)' : 'SQLite (Local)'}</span>
              </div>
            </div>

            <div className="tooltip-details">
              <div className="tooltip-row">
                <span>Adapter:</span>
                <span>{status.adapter || 'unknown'}</span>
              </div>
              <div className="tooltip-row">
                <span>Last Sync:</span>
                <span>{formatTime(status.lastSyncTime)}</span>
              </div>
              {status.syncQueue?.pending > 0 && (
                <div className="tooltip-row pending">
                  <span>Pending:</span>
                  <span>{status.syncQueue.pending} operations</span>
                </div>
              )}
              {status.syncQueue?.failed > 0 && (
                <div className="tooltip-row failed">
                  <span>Failed:</span>
                  <span>{status.syncQueue.failed} operations</span>
                </div>
              )}
            </div>

            {hasPendingItems && (
              <div className="tooltip-actions">
                {isOnline && status.syncQueue?.pending > 0 && (
                  <button
                    className="tooltip-btn sync"
                    onClick={handleForceSync}
                    disabled={loading}
                  >
                    Sync Now
                  </button>
                )}
                {status.syncQueue?.failed > 0 && (
                  <button
                    className="tooltip-btn retry"
                    onClick={handleRetryFailed}
                    disabled={loading}
                  >
                    Retry Failed
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ConnectionIndicator
