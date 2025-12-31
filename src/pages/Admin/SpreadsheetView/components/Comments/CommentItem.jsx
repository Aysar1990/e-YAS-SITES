/**
 * Comment Item Component
 * Displays individual comment with author and time
 * PHASE 5: Collaboration Features
 */

import React, { useMemo } from 'react'
import { UserAvatar } from '../UserPresence'

// Format timestamp
const formatTime = (date) => {
  if (!date) return ''

  const now = new Date()
  const diff = now - date
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (seconds < 60) return 'الآن'
  if (minutes < 60) return `${minutes} د`
  if (hours < 24) return `${hours} س`

  return date.toLocaleDateString('ar-IQ', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Check if same author as previous comment (for grouping)
const isSameAuthor = (comment, previousComment) => {
  if (!previousComment) return false
  if (comment.userId !== previousComment.userId) return false

  // Check if within 5 minutes
  const timeDiff = comment.timestamp - previousComment.timestamp
  return timeDiff < 5 * 60 * 1000
}

// Parse and highlight @mentions in text
const parseTextWithMentions = (text, mentions = []) => {
  if (!text) return null
  if (!mentions.length) return text

  // Simple regex to find @mentions
  const mentionPattern = /@(\w+)/g
  const parts = []
  let lastIndex = 0
  let match

  while ((match = mentionPattern.exec(text)) !== null) {
    // Add text before mention
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index))
    }

    // Add mention with highlighting
    const mentionName = match[1]
    parts.push(
      <span key={match.index} className="mention-highlight">
        @{mentionName}
      </span>
    )

    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex))
  }

  return parts.length > 0 ? parts : text
}

const CommentItem = ({ comment, isOwn, isFirst, previousComment }) => {
  const {
    text,
    userName,
    userId,
    timestamp,
    mentions = []
  } = comment

  const isGrouped = useMemo(
    () => isSameAuthor(comment, previousComment),
    [comment, previousComment]
  )

  const parsedText = useMemo(
    () => parseTextWithMentions(text, mentions),
    [text, mentions]
  )

  const timeStr = useMemo(
    () => formatTime(timestamp),
    [timestamp]
  )

  return (
    <div className={`comment-item ${isOwn ? 'own' : ''} ${isGrouped ? 'grouped' : ''}`}>
      {/* Avatar (only show if not grouped) */}
      {!isGrouped && (
        <UserAvatar
          user={{ id: userId, name: userName, status: 'online' }}
          size="small"
          showStatus={false}
        />
      )}

      {/* Comment Content */}
      <div className={`comment-content ${isGrouped ? 'grouped' : ''}`}>
        {/* Author name (only show if not grouped) */}
        {!isGrouped && (
          <div className="comment-author">
            <span className="author-name">{userName}</span>
            <span className="comment-time">{timeStr}</span>
          </div>
        )}

        {/* Comment bubble */}
        <div className="comment-bubble">
          <p className="comment-text">{parsedText}</p>

          {/* Time for grouped comments */}
          {isGrouped && (
            <span className="comment-time-inline">{timeStr}</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default CommentItem
