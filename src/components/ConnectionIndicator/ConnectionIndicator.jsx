/**
 * Connection Indicator Component
 * Shows Online/Offline status automatically based on internet connectivity
 */

import { useState, useEffect } from 'react'
import './ConnectionIndicator.css'

const ConnectionIndicator = ({ showLabel = true, size = 'normal' }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showTooltip, setShowTooltip] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // Show brief notification
      console.log('[Connection] ✅ Back online - switching to Supabase')
    }

    const handleOffline = () => {
      setIsOnline(false)
      console.log('[Connection] ⚠️ Offline - switching to SQLite')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <div 
      className={`connection-indicator ${size}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className={`connection-dot ${isOnline ? 'online' : 'offline'}`}>
        <span className="connection-pulse"></span>
      </div>
      
      {showLabel && (
        <span className={`connection-label ${isOnline ? 'online' : 'offline'}`}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      )}

      {showTooltip && (
        <div className="connection-tooltip">
          <div className="tooltip-content">
            <span className={`tooltip-status ${isOnline ? 'online' : 'offline'}`}>
              {isOnline ? '☁️' : '💾'}
            </span>
            <div className="tooltip-text">
              <strong>{isOnline ? 'Connected' : 'Disconnected'}</strong>
              <span>{isOnline ? 'Syncing with Supabase' : 'Using local SQLite'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConnectionIndicator
