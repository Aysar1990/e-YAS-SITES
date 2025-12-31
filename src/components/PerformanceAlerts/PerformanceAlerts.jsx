/**
 * Performance Alerts Component
 * Displays real-time performance alerts with notifications
 *
 * Features:
 * - Real-time alert notifications
 * - Alert history
 * - Dismissible alerts
 * - Sound notifications (optional)
 */

import { useState, useEffect, useCallback, useRef } from 'react'

// Alert type configurations
const ALERT_CONFIG = {
  slowQuery: {
    icon: '🐌',
    title: 'Slow Query Detected',
    severity: 'warning',
    color: '#eab308',
    description: (data) => `Query "${data.query || 'Unknown'}" took ${data.duration}ms (threshold: ${data.threshold}ms)`
  },
  highMemory: {
    icon: '💾',
    title: 'High Memory Usage',
    severity: 'critical',
    color: '#ef4444',
    description: (data) => `Memory usage: ${data.heapUsed}MB exceeds threshold (${data.threshold}MB)`
  },
  largeBundleSize: {
    icon: '📦',
    title: 'Large Bundle Size',
    severity: 'warning',
    color: '#f97316',
    description: (data) => `Bundle size: ${data.size?.toFixed(1)}MB exceeds limit (${data.threshold}MB)`
  },
  slowRender: {
    icon: '🎨',
    title: 'Slow Render',
    severity: 'info',
    color: '#3b82f6',
    description: (data) => `Component "${data.component}" rendered slowly: ${data.duration?.toFixed(1)}ms`
  },
  error: {
    icon: '❌',
    title: 'Error Detected',
    severity: 'critical',
    color: '#ef4444',
    description: (data) => data.message || 'An error occurred'
  }
}

// Default config for unknown alert types
const DEFAULT_CONFIG = {
  icon: '⚠️',
  title: 'Alert',
  severity: 'info',
  color: '#6b7280',
  description: (data) => JSON.stringify(data)
}

/**
 * Single Alert Toast Component
 */
function AlertToast({ alert, onDismiss, onPin }) {
  const config = ALERT_CONFIG[alert.type] || DEFAULT_CONFIG
  const [isHovered, setIsHovered] = useState(false)
  const [countdown, setCountdown] = useState(10)
  const timerRef = useRef(null)

  // Auto-dismiss timer
  useEffect(() => {
    if (!alert.pinned && !isHovered) {
      timerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            onDismiss(alert.id)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [alert.id, alert.pinned, isHovered, onDismiss])

  // Pause timer on hover
  useEffect(() => {
    if (isHovered && timerRef.current) {
      clearInterval(timerRef.current)
    }
  }, [isHovered])

  const timeAgo = getTimeAgo(alert.timestamp)

  return (
    <div
      className="relative flex items-start gap-3 p-4 rounded-lg border shadow-lg mb-3 transition-all duration-300"
      style={{
        backgroundColor: '#1f2937',
        borderColor: config.color,
        borderLeftWidth: '4px'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Icon */}
      <span className="text-2xl flex-shrink-0">{config.icon}</span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-white">{config.title}</span>
          <span
            className="px-2 py-0.5 text-xs rounded-full"
            style={{ backgroundColor: `${config.color}30`, color: config.color }}
          >
            {config.severity}
          </span>
        </div>
        <p className="text-gray-300 text-sm">
          {config.description(alert.data || {})}
        </p>
        <p className="text-gray-500 text-xs mt-1">{timeAgo}</p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1">
        <button
          onClick={() => onDismiss(alert.id)}
          className="p-1 text-gray-400 hover:text-white rounded"
          title="Dismiss"
        >
          ✕
        </button>
        <button
          onClick={() => onPin(alert.id)}
          className={`p-1 rounded ${alert.pinned ? 'text-yellow-400' : 'text-gray-400 hover:text-white'}`}
          title={alert.pinned ? 'Unpin' : 'Pin'}
        >
          📌
        </button>
      </div>

      {/* Countdown indicator */}
      {!alert.pinned && (
        <div
          className="absolute bottom-0 left-0 h-1 transition-all duration-1000"
          style={{
            backgroundColor: config.color,
            width: `${(countdown / 10) * 100}%`,
            opacity: 0.5
          }}
        />
      )}
    </div>
  )
}

/**
 * Main Performance Alerts Component
 */
export default function PerformanceAlerts({
  maxAlerts = 5,
  position = 'bottom-right',
  enableSound = false,
  showIcon = true
}) {
  const [alerts, setAlerts] = useState([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const audioRef = useRef(null)

  // Position styles
  const positionStyles = {
    'top-right': { top: 20, right: 20 },
    'top-left': { top: 20, left: 20 },
    'bottom-right': { bottom: 20, right: 20 },
    'bottom-left': { bottom: 20, left: 20 }
  }

  // Listen for alerts from electron
  useEffect(() => {
    if (window.electron?.onPerformanceAlert) {
      window.electron.onPerformanceAlert(handleNewAlert)
    }

    // Cleanup
    return () => {
      if (window.electron?.removePerformanceAlertListener) {
        window.electron.removePerformanceAlertListener()
      }
    }
  }, [])

  // Handle new alert
  const handleNewAlert = useCallback((alert) => {
    const newAlert = {
      ...alert,
      id: alert.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: alert.timestamp || Date.now(),
      pinned: false,
      read: false
    }

    setAlerts(prev => [newAlert, ...prev].slice(0, 50))
    setUnreadCount(prev => prev + 1)

    // Play sound if enabled
    if (enableSound && audioRef.current) {
      audioRef.current.play().catch(() => {})
    }

    // Show browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      const config = ALERT_CONFIG[alert.type] || DEFAULT_CONFIG
      new Notification(config.title, {
        body: config.description(alert.data || {}),
        icon: config.icon
      })
    }
  }, [enableSound])

  // Dismiss alert
  const handleDismiss = useCallback((id) => {
    setAlerts(prev => prev.filter(a => a.id !== id))
  }, [])

  // Pin/unpin alert
  const handlePin = useCallback((id) => {
    setAlerts(prev =>
      prev.map(a =>
        a.id === id ? { ...a, pinned: !a.pinned } : a
      )
    )
  }, [])

  // Clear all alerts
  const handleClearAll = useCallback(() => {
    setAlerts(prev => prev.filter(a => a.pinned))
    setUnreadCount(0)
  }, [])

  // Mark all as read
  const handleMarkRead = useCallback(() => {
    setUnreadCount(0)
    setAlerts(prev => prev.map(a => ({ ...a, read: true })))
  }, [])

  // Toggle expanded state
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
    if (!isExpanded) {
      handleMarkRead()
    }
  }

  // Get visible alerts
  const visibleAlerts = isExpanded
    ? alerts.slice(0, maxAlerts * 2)
    : alerts.filter(a => a.pinned || !a.read).slice(0, maxAlerts)

  const pinnedCount = alerts.filter(a => a.pinned).length

  return (
    <>
      {/* Notification sound */}
      {enableSound && (
        <audio
          ref={audioRef}
          src="/notification.mp3"
          preload="auto"
        />
      )}

      {/* Alert icon button (collapsed state) */}
      {showIcon && !isExpanded && (
        <button
          onClick={toggleExpanded}
          className="fixed z-50 p-3 bg-gray-800 rounded-full border border-gray-700 shadow-lg hover:bg-gray-700 transition-colors"
          style={positionStyles[position]}
          title={`${unreadCount} unread alerts`}
        >
          <span className="text-xl">🔔</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Alerts panel */}
      {isExpanded && (
        <div
          className="fixed z-50 w-96 max-h-[80vh] flex flex-col bg-gray-900 rounded-lg border border-gray-700 shadow-2xl overflow-hidden"
          style={positionStyles[position]}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔔</span>
              <span className="font-medium text-white">Performance Alerts</span>
              {pinnedCount > 0 && (
                <span className="text-xs text-yellow-400">({pinnedCount} pinned)</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleClearAll}
                className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-800"
              >
                Clear All
              </button>
              <button
                onClick={toggleExpanded}
                className="text-gray-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Alerts list */}
          <div className="flex-1 overflow-y-auto p-3">
            {visibleAlerts.length > 0 ? (
              visibleAlerts.map(alert => (
                <AlertToast
                  key={alert.id}
                  alert={alert}
                  onDismiss={handleDismiss}
                  onPin={handlePin}
                />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <span className="text-3xl block mb-2">✅</span>
                No performance alerts
              </div>
            )}
          </div>

          {/* Footer */}
          {alerts.length > visibleAlerts.length && (
            <div className="p-3 border-t border-gray-700 text-center">
              <span className="text-sm text-gray-400">
                +{alerts.length - visibleAlerts.length} more alerts
              </span>
            </div>
          )}
        </div>
      )}
    </>
  )
}

/**
 * Get relative time string
 */
function getTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

/**
 * Request notification permission
 */
export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
}
