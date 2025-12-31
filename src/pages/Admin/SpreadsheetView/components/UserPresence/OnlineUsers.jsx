/**
 * Online Users Component - Who's Online
 * Shows online users with avatars and status
 * PHASE 5: Collaboration Features
 */

import React, { useState, useEffect, useMemo } from 'react'
import { presenceService } from '../../services/firebase/presence'
import UserAvatar from './UserAvatar'
import './UserPresence.css'

const OnlineUsers = ({ currentUser, onUserClick, compact = false }) => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isExpanded, setIsExpanded] = useState(false)

  // Initialize presence service and listen to users
  useEffect(() => {
    if (!currentUser?.id) {
      setLoading(false)
      return
    }

    let unsubscribe = null

    const init = async () => {
      try {
        await presenceService.initialize(currentUser.id, currentUser.name || 'مستخدم')

        unsubscribe = presenceService.listen((onlineUsers) => {
          setUsers(onlineUsers)
          setLoading(false)
        })
      } catch (err) {
        console.error('[OnlineUsers] Error:', err)
        setError('فشل في تحميل المستخدمين')
        setLoading(false)
      }
    }

    init()

    // Cleanup on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
      presenceService.cleanup()
    }
  }, [currentUser?.id, currentUser?.name])

  // Separate online and offline users
  const { onlineUsers, offlineUsers } = useMemo(() => {
    const online = users.filter(u => u.status === 'online')
    const offline = users.filter(u => u.status !== 'online')
    return { onlineUsers: online, offlineUsers: offline }
  }, [users])

  // Display count for compact mode
  const onlineCount = onlineUsers.length
  const displayLimit = compact ? 5 : 10

  if (loading) {
    return (
      <div className="online-users-loading">
        <div className="spinner-tiny"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="online-users-error">
        <span>⚠️</span>
      </div>
    )
  }

  // Compact mode - just avatars
  if (compact) {
    return (
      <div className="online-users-compact">
        <div className="compact-avatars">
          {onlineUsers.slice(0, displayLimit).map((user, index) => (
            <UserAvatar
              key={user.id}
              user={user}
              size="small"
              showStatus
              style={{ marginRight: index > 0 ? '-8px' : 0, zIndex: displayLimit - index }}
              onClick={() => onUserClick?.(user)}
            />
          ))}
          {onlineCount > displayLimit && (
            <div className="more-users" onClick={() => setIsExpanded(!isExpanded)}>
              +{onlineCount - displayLimit}
            </div>
          )}
        </div>
        <span className="online-count">{onlineCount} متصل</span>
      </div>
    )
  }

  // Full panel mode
  return (
    <div className="online-users-panel">
      <div className="panel-header">
        <div className="header-info">
          <span className="header-icon">👥</span>
          <h4>المستخدمون المتصلون</h4>
          <span className="count-badge">{onlineCount}</span>
        </div>
        <div className="status-dot online"></div>
      </div>

      {/* Online Users */}
      <div className="users-section">
        <div className="section-label">
          <span className="status-indicator online"></span>
          متصل الآن ({onlineUsers.length})
        </div>
        <div className="users-list">
          {onlineUsers.length === 0 ? (
            <div className="no-users">لا يوجد مستخدمون متصلون</div>
          ) : (
            onlineUsers.map(user => (
              <div
                key={user.id}
                className={`user-item ${user.isCurrentUser ? 'is-current' : ''}`}
                onClick={() => !user.isCurrentUser && onUserClick?.(user)}
              >
                <UserAvatar user={user} size="medium" showStatus />
                <div className="user-info">
                  <span className="user-name">
                    {user.name}
                    {user.isCurrentUser && <span className="you-badge">(أنت)</span>}
                  </span>
                  {user.currentSite && (
                    <span className="user-location">
                      📍 {user.currentSite.name || user.currentSite.id}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Offline Users (collapsed by default) */}
      {offlineUsers.length > 0 && (
        <div className="users-section offline-section">
          <div
            className="section-label clickable"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <span className="status-indicator offline"></span>
            غير متصل ({offlineUsers.length})
            <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
          </div>
          {isExpanded && (
            <div className="users-list">
              {offlineUsers.map(user => (
                <div
                  key={user.id}
                  className="user-item offline"
                  onClick={() => onUserClick?.(user)}
                >
                  <UserAvatar user={user} size="medium" showStatus />
                  <div className="user-info">
                    <span className="user-name">{user.name}</span>
                    <span className="last-seen">
                      {formatLastSeen(user.lastSeenDate)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Format last seen time
const formatLastSeen = (date) => {
  if (!date) return 'غير معروف'

  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 5) return 'منذ لحظات'
  if (minutes < 60) return `منذ ${minutes} دقيقة`
  if (hours < 24) return `منذ ${hours} ساعة`
  return `منذ ${days} يوم`
}

export default OnlineUsers
