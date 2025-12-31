/**
 * User Avatar Component
 * Circular avatar with initials and online status
 * PHASE 5: Collaboration Features
 */

import React, { useMemo } from 'react'

// Color palette for avatars (based on user ID hash)
const AVATAR_COLORS = [
  '#8FD9D9', // YAS Primary
  '#FF8566', // YAS Secondary
  '#4CAF50', // Green
  '#9C27B0', // Purple
  '#2196F3', // Blue
  '#FF9800', // Orange
  '#E91E63', // Pink
  '#00BCD4', // Cyan
  '#795548', // Brown
  '#607D8B', // Blue Grey
]

// Get initials from name
const getInitials = (name) => {
  if (!name) return '؟'
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

// Generate consistent color from user ID
const getAvatarColor = (userId) => {
  if (!userId) return AVATAR_COLORS[0]

  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

// Status colors
const STATUS_COLORS = {
  online: '#4CAF50',
  away: '#FFC107',
  busy: '#F44336',
  offline: '#9E9E9E'
}

const UserAvatar = ({
  user,
  size = 'medium',
  showStatus = false,
  showTooltip = true,
  onClick,
  style = {},
  className = ''
}) => {
  const { name, userId, id, status = 'offline', avatar } = user || {}
  const finalUserId = userId || id

  // Calculate initials and color
  const initials = useMemo(() => getInitials(name), [name])
  const bgColor = useMemo(() => getAvatarColor(finalUserId), [finalUserId])
  const statusColor = STATUS_COLORS[status] || STATUS_COLORS.offline

  // Size configurations
  const sizes = {
    tiny: { width: 24, height: 24, fontSize: 10, statusSize: 6 },
    small: { width: 32, height: 32, fontSize: 12, statusSize: 8 },
    medium: { width: 40, height: 40, fontSize: 14, statusSize: 10 },
    large: { width: 48, height: 48, fontSize: 16, statusSize: 12 },
    xlarge: { width: 64, height: 64, fontSize: 20, statusSize: 16 }
  }

  const sizeConfig = sizes[size] || sizes.medium

  const avatarStyle = {
    width: sizeConfig.width,
    height: sizeConfig.height,
    fontSize: sizeConfig.fontSize,
    backgroundColor: bgColor,
    ...style
  }

  const statusStyle = {
    width: sizeConfig.statusSize,
    height: sizeConfig.statusSize,
    backgroundColor: statusColor
  }

  // Tooltip content
  const tooltipText = name ? `${name}${status === 'online' ? ' (متصل)' : ''}` : ''

  return (
    <div
      className={`user-avatar size-${size} ${onClick ? 'clickable' : ''} ${className}`}
      style={avatarStyle}
      onClick={onClick}
      title={showTooltip ? tooltipText : ''}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Avatar Image or Initials */}
      {avatar ? (
        <img src={avatar} alt={name} className="avatar-image" />
      ) : (
        <span className="avatar-initials">{initials}</span>
      )}

      {/* Status Indicator */}
      {showStatus && (
        <span
          className={`avatar-status status-${status}`}
          style={statusStyle}
        />
      )}
    </div>
  )
}

// Avatar Stack Component for multiple users
export const AvatarStack = ({
  users = [],
  max = 5,
  size = 'small',
  onMoreClick,
  className = ''
}) => {
  const displayUsers = users.slice(0, max)
  const remainingCount = users.length - max

  return (
    <div className={`avatar-stack ${className}`}>
      {displayUsers.map((user, index) => (
        <UserAvatar
          key={user.id || user.userId || index}
          user={user}
          size={size}
          showStatus
          style={{
            marginRight: index > 0 ? `-${size === 'small' ? 8 : 12}px` : 0,
            zIndex: max - index
          }}
        />
      ))}
      {remainingCount > 0 && (
        <div
          className="avatar-more"
          onClick={onMoreClick}
          style={{
            marginRight: `-${size === 'small' ? 8 : 12}px`,
            zIndex: 0
          }}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  )
}

export default UserAvatar
