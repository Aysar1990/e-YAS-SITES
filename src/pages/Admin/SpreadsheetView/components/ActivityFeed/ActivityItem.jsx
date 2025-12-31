/**
 * Activity Item Component
 * Displays individual activity with icon, message, and time
 * PHASE 5: Collaboration Features
 */

import React, { useMemo } from 'react'

// Activity type configurations
const ACTIVITY_TYPES = {
  edit: {
    icon: '✏️',
    color: '#8FD9D9',
    label: 'تعديل'
  },
  update: {
    icon: '📝',
    color: '#8FD9D9',
    label: 'تحديث'
  },
  comment: {
    icon: '💬',
    color: '#FF8566',
    label: 'تعليق'
  },
  status_change: {
    icon: '🔄',
    color: '#4CAF50',
    label: 'تغيير حالة'
  },
  view: {
    icon: '👁️',
    color: '#9E9E9E',
    label: 'عرض'
  },
  export: {
    icon: '📥',
    color: '#2196F3',
    label: 'تصدير'
  },
  import: {
    icon: '📤',
    color: '#9C27B0',
    label: 'استيراد'
  },
  login: {
    icon: '🔓',
    color: '#4CAF50',
    label: 'دخول'
  },
  logout: {
    icon: '🔒',
    color: '#FF5722',
    label: 'خروج'
  },
  mention: {
    icon: '@',
    color: '#FF8566',
    label: 'إشارة'
  },
  default: {
    icon: '📌',
    color: '#8FD9D9',
    label: 'نشاط'
  }
}

// Format relative time in Arabic
const formatRelativeTime = (date) => {
  if (!date) return ''

  const now = new Date()
  const diff = now - date
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return 'الآن'
  if (minutes < 60) return `منذ ${minutes} ${minutes === 1 ? 'دقيقة' : 'دقائق'}`
  if (hours < 24) return `منذ ${hours} ${hours === 1 ? 'ساعة' : 'ساعات'}`
  if (days < 7) return `منذ ${days} ${days === 1 ? 'يوم' : 'أيام'}`

  // Format as date for older activities
  return date.toLocaleDateString('ar-IQ', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Get user initials
const getInitials = (name) => {
  if (!name) return '؟'
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return parts[0][0] + parts[1][0]
  }
  return name.substring(0, 2).toUpperCase()
}

const ActivityItem = ({ activity, isNew }) => {
  const {
    type = 'default',
    siteId,
    siteName,
    userId,
    userName,
    timestamp,
    details = {}
  } = activity

  const config = ACTIVITY_TYPES[type] || ACTIVITY_TYPES.default

  // Build activity message based on type
  const message = useMemo(() => {
    const user = userName || 'مستخدم'
    const site = siteName || siteId || 'موقع'

    switch (type) {
      case 'edit':
      case 'update':
        if (details.field && details.newValue !== undefined) {
          const field = details.fieldLabel || details.field
          return (
            <>
              <strong>{user}</strong> عدّل <span className="field-name">{field}</span> في <span className="site-name">{site}</span>
              {details.oldValue !== undefined && (
                <span className="value-change">
                  <span className="old-value">{String(details.oldValue || 'فارغ')}</span>
                  <span className="arrow">←</span>
                  <span className="new-value">{String(details.newValue || 'فارغ')}</span>
                </span>
              )}
            </>
          )
        }
        return <><strong>{user}</strong> عدّل <span className="site-name">{site}</span></>

      case 'status_change':
        return (
          <>
            <strong>{user}</strong> غيّر حالة <span className="site-name">{site}</span> إلى{' '}
            <span className="status-value" style={{ color: getStatusColor(details.newValue) }}>
              {details.newValue}
            </span>
          </>
        )

      case 'comment':
        return (
          <>
            <strong>{user}</strong> علّق على <span className="site-name">{site}</span>
            {details.text && (
              <span className="comment-preview">"{details.text.substring(0, 50)}{details.text.length > 50 ? '...' : ''}"</span>
            )}
          </>
        )

      case 'mention':
        return (
          <>
            <strong>{user}</strong> أشار إليك في <span className="site-name">{site}</span>
          </>
        )

      case 'export':
        return <><strong>{user}</strong> صدّر البيانات ({details.format || 'Excel'})</>

      case 'import':
        return <><strong>{user}</strong> استورد {details.count || ''} موقع</>

      case 'login':
        return <><strong>{user}</strong> سجل دخول</>

      case 'logout':
        return <><strong>{user}</strong> سجل خروج</>

      case 'view':
        return <><strong>{user}</strong> شاهد <span className="site-name">{site}</span></>

      default:
        return <><strong>{user}</strong> قام بنشاط على <span className="site-name">{site}</span></>
    }
  }, [type, userName, siteName, siteId, details])

  return (
    <div className={`activity-item ${isNew ? 'is-new' : ''}`}>
      {/* User Avatar */}
      <div
        className="activity-avatar"
        style={{ backgroundColor: config.color + '30', borderColor: config.color }}
      >
        {getInitials(userName)}
      </div>

      {/* Activity Content */}
      <div className="activity-content">
        <div className="activity-message">
          <span className="activity-icon" style={{ color: config.color }}>
            {config.icon}
          </span>
          {message}
        </div>
        <div className="activity-meta">
          <span className="activity-time">{formatRelativeTime(timestamp)}</span>
          <span className="activity-type" style={{ backgroundColor: config.color + '20', color: config.color }}>
            {config.label}
          </span>
        </div>
      </div>

      {/* New indicator */}
      {isNew && <span className="new-indicator"></span>}
    </div>
  )
}

// Helper to get status color
const getStatusColor = (status) => {
  if (!status) return '#9E9E9E'
  const s = status.toLowerCase()
  if (s === 'approved' || s.includes('approved')) return '#4CAF50'
  if (s.includes('pending') || s.includes('under')) return '#FFC107'
  if (s === 'rejected' || s.includes('reject')) return '#F44336'
  return '#8FD9D9'
}

export default ActivityItem
