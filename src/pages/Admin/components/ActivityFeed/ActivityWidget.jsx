import React, { useState } from 'react'
import { useNotifications } from '../../../../context/NotificationContext'
import { Card } from '../../../../components/UI'
import './ActivityFeed.css'

const ActivityWidget = () => {
    const { activities, isConnected, simulateEvent } = useNotifications()
    const [filter, setFilter] = useState('all') // all, approval, rejection, upload

    const getIcon = (type) => {
        switch (type) {
            case 'approval': return '✅'
            case 'rejection': return '❌'
            case 'upload': return '📤'
            case 'sync': return '🔄'
            default: return 'ℹ️'
        }
    }

    const getTimeAgo = (dateString) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffInSeconds = Math.floor((now - date) / 1000)

        if (diffInSeconds < 60) return 'Just now'
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
        return `${Math.floor(diffInSeconds / 86400)}d ago`
    }

    const filteredActivities = activities.filter(act => {
        if (filter === 'all') return true
        return act.type === filter
    })

    return (
        <Card className="activity-widget-card" title={
            <div className="activity-header">
                <span>Activity Feed</span>
                <div className={`connection-status ${isConnected ? 'online' : 'offline'}`} title={isConnected ? 'Real-time Connected' : 'Offline'}></div>
            </div>
        }>

            {/* Dev Controls - Visible for Demo */}
            <div className="activity-controls">
                <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
                <button className={`filter-btn ${filter === 'approval' ? 'active' : ''}`} onClick={() => simulateEvent('approve')}>+ Approve</button>
                <button className={`filter-btn ${filter === 'rejection' ? 'active' : ''}`} onClick={() => simulateEvent('reject')}>+ Reject</button>
            </div>

            <div className="activity-list">
                {filteredActivities.length === 0 ? (
                    <div className="empty-state">No recent activity</div>
                ) : (
                    filteredActivities.map((activity) => (
                        <div key={activity.id} className={`activity-item ${activity.type}`}>
                            <div className="activity-icon-wrapper">
                                <span className="activity-icon">{getIcon(activity.type)}</span>
                                {/* Connect line */}
                                <div className="activity-line"></div>
                            </div>
                            <div className="activity-content">
                                <p className="activity-message">{activity.message}</p>
                                <span className="activity-time">{getTimeAgo(activity.time)}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </Card>
    )
}

export default ActivityWidget
