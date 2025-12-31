/**
 * Comments Panel Component - Real-time Comments Per Site
 * Displays comments with @mentions support
 * PHASE 5: Collaboration Features
 * Migrated from Firebase to Supabase/Local API
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import CommentItem from './CommentItem'
import MentionInput from './MentionInput'
import './Comments.css'

const CommentsPanel = ({
  siteId,
  siteName,
  currentUser,
  onlineUsers = [],
  onClose,
  onMention
}) => {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const listRef = useRef(null)

  // Load comments for this site
  useEffect(() => {
    if (!siteId) {
      setLoading(false)
      return
    }

    const loadComments = async () => {
      try {
        // Use Electron API to get comments
        if (window.electron?.getComments) {
          const result = await window.electron.getComments(siteId)
          if (result.success) {
            setComments(result.data || [])
          } else {
            setError(result.error || 'فشل في تحميل التعليقات')
          }
        } else {
          // Fallback: Comments not available
          console.warn('[CommentsPanel] Comments API not available')
          setComments([])
        }
        setLoading(false)
      } catch (err) {
        console.error('[CommentsPanel] Error:', err)
        setError('فشل في تحميل التعليقات')
        setLoading(false)
      }
    }

    loadComments()

    // Set up polling for real-time updates (every 5 seconds)
    const intervalId = setInterval(loadComments, 5000)

    return () => clearInterval(intervalId)
  }, [siteId])

  // Scroll to bottom when comments change
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [comments])

  // Submit new comment
  const handleSubmit = useCallback(async (text, mentions) => {
    if (!text.trim() || !currentUser?.id) return

    setSubmitting(true)

    try {
      const commentData = {
        siteId,
        siteName,
        text: text.trim(),
        userId: currentUser.id,
        userName: currentUser.name || 'مستخدم',
        mentions: mentions || [],
        timestamp: new Date().toISOString()
      }

      // Use Electron API to add comment
      if (window.electron?.addComment) {
        const result = await window.electron.addComment(commentData)
        if (result.success) {
          // Add to local state immediately
          setComments(prev => [...prev, { ...commentData, id: result.id }])
          
          // Notify mentioned users
          if (mentions?.length > 0 && onMention) {
            mentions.forEach(userId => {
              onMention(userId, siteId, siteName, text)
            })
          }
        } else {
          setError('فشل في إضافة التعليق')
        }
      } else {
        console.warn('[CommentsPanel] addComment API not available')
        setError('خدمة التعليقات غير متوفرة')
      }
    } catch (err) {
      console.error('[CommentsPanel] Failed to add comment:', err)
      setError('فشل في إضافة التعليق')
    } finally {
      setSubmitting(false)
    }
  }, [siteId, siteName, currentUser, onMention])

  // Get available users for mentions (excluding current user)
  const mentionUsers = onlineUsers.filter(u => u.id !== currentUser?.id)

  return (
    <div className="comments-panel">
      <div className="comments-header">
        <div className="header-info">
          <span className="header-icon">💬</span>
          <div className="header-text">
            <h4>التعليقات</h4>
            <span className="site-label">{siteName || siteId}</span>
          </div>
        </div>
        <div className="header-actions">
          <span className="comments-count">{comments.length}</span>
          <button className="btn-close-comments" onClick={onClose}>&times;</button>
        </div>
      </div>

      {/* Comments List */}
      <div className="comments-list" ref={listRef}>
        {loading && (
          <div className="comments-loading">
            <div className="spinner-small"></div>
            <span>جاري التحميل...</span>
          </div>
        )}

        {error && (
          <div className="comments-error">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && comments.length === 0 && (
          <div className="comments-empty">
            <span className="empty-icon">💭</span>
            <span>لا توجد تعليقات بعد</span>
            <span className="empty-hint">كن أول من يعلق!</span>
          </div>
        )}

        {!loading && !error && comments.map((comment, index) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            isOwn={comment.userId === currentUser?.id}
            isFirst={index === 0}
            previousComment={comments[index - 1]}
          />
        ))}
      </div>

      {/* Input Area */}
      <div className="comments-input-area">
        <MentionInput
          users={mentionUsers}
          onSubmit={handleSubmit}
          disabled={submitting || !currentUser?.id}
          placeholder={currentUser?.id ? 'اكتب تعليقاً... (@ للإشارة)' : 'سجل دخولك للتعليق'}
        />
        {submitting && (
          <div className="submitting-indicator">
            <div className="spinner-tiny"></div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CommentsPanel
