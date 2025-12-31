/**
 * Activity Feed Component - Real-time Timeline
 * FIREBASE REMOVED - This is a stub implementation
 * Activities are now handled locally or via WebSocket
 */

import React, { useState, useEffect } from 'react'
import ActivityItem from './ActivityItem'
import './ActivityFeed.css'

const MAX_ACTIVITIES = 50

const ActivityFeed = ({ onClose, currentUser }) => {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all')

  // Load activities from local storage or API
  useEffect(() => {
    // Firebase removed - using local mock data
    setLoading(true)

    // Simulate loading delay
    setTimeout(() => {
      // Load from localStorage if available
      const stored = localStorage.getItem('spreadsheet_activities')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setActivities(parsed.slice(0, MAX_ACTIVITIES))
        } catch (e) {
          console.log('[ActivityFeed] No stored activities')
        }
      }
      setLoading(false)
    }, 300)
  }, [])

  // Filter activities by type
  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true
    if (filter === 'edits') return activity.type === 'edit' || activity.type === 'update'
    if (filter === 'comments') return activity.type === 'comment'
    if (filter === 'status') return activity.type === 'status_change'
    return true
  })

  // Get activity type stats
  const stats = {
    total: activities.length,
    edits: activities.filter(a => a.type === 'edit' || a.type === 'update').length,
    comments: activities.filter(a => a.type === 'comment').length,
    status: activities.filter(a => a.type === 'status_change').length
  }

  return (
    <div className="activity-feed">
      <div className="activity-feed-header">
        <div className="header-title">
          <span className="header-icon">📋</span>
          <h3>Activity Log</h3>
          <span className="activity-count">{activities.length}</span>
        </div>
        <button className="btn-close-feed" onClick={onClose}>&times;</button>
      </div>

      {/* Filter Tabs */}
      <div className="activity-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All <span className="count">{stats.total}</span>
        </button>
        <button
          className={`filter-btn ${filter === 'edits' ? 'active' : ''}`}
          onClick={() => setFilter('edits')}
        >
          Edits <span className="count">{stats.edits}</span>
        </button>
        <button
          className={`filter-btn ${filter === 'comments' ? 'active' : ''}`}
          onClick={() => setFilter('comments')}
        >
          Comments <span className="count">{stats.comments}</span>
        </button>
        <button
          className={`filter-btn ${filter === 'status' ? 'active' : ''}`}
          onClick={() => setFilter('status')}
        >
          Status <span className="count">{stats.status}</span>
        </button>
      </div>

      {/* Activity List */}
      <div className="activity-list">
        {loading && (
          <div className="activity-loading">
            <div className="spinner-small"></div>
            <span>Loading...</span>
          </div>
        )}

        {!loading && filteredActivities.length === 0 && (
          <div className="activity-empty">
            <span className="empty-icon">📭</span>
            <span>No activities {filter !== 'all' ? 'in this category' : 'yet'}</span>
          </div>
        )}

        {!loading && filteredActivities.map((activity, index) => (
          <ActivityItem
            key={activity.id || index}
            activity={activity}
            isNew={index < 3 && Date.now() - new Date(activity.timestamp).getTime() < 60000}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="activity-feed-footer">
        <div className="live-indicator">
          <span className="live-dot" style={{ background: '#666' }}></span>
          <span>Local Mode</span>
        </div>
        <span className="last-update">
          Last {MAX_ACTIVITIES} activities
        </span>
      </div>
    </div>
  )
}

/**
 * Helper function to log an activity locally
 * Stores in localStorage for persistence
 */
export const logActivity = async (activityData) => {
  try {
    const stored = localStorage.getItem('spreadsheet_activities')
    const activities = stored ? JSON.parse(stored) : []

    const activity = {
      id: `act_${Date.now()}`,
      ...activityData,
      timestamp: new Date().toISOString()
    }

    activities.unshift(activity)
    localStorage.setItem('spreadsheet_activities', JSON.stringify(activities.slice(0, 100)))

    console.log('[ActivityFeed] Activity logged locally:', activity.id)
    return activity.id
  } catch (error) {
    console.error('[ActivityFeed] Failed to log activity:', error)
    return null
  }
}

export default ActivityFeed
