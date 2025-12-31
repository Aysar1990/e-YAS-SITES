import React from 'react'
import { useNotifications } from '../../context/NotificationContext'
import './Notifications.css'

const NotificationPanel = ({ onClose }) => {
    const { notifications, markAllAsRead, unreadCount, settings, toggleSetting } = useNotifications()

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

    return (
        <div className="notification-panel">
            <div className="notification-header">
                <h3>Notifications</h3>
                {unreadCount > 0 && (
                    <button className="mark-read-btn" onClick={markAllAsRead}>
                        Mark all read
                    </button>
                )}
            </div>

            <div className="notification-content">
                {notifications.length === 0 ? (
                    <div className="empty-notifications">
                        <span className="empty-icon">🔕</span>
                        <p>No new notifications</p>
                    </div>
                ) : (
                    <div className="notification-list">
                        {notifications.slice(0, 10).map((notif) => (
                            <div key={notif.id} className={`notification-item ${notif.type}`}>
                                <span className="notif-icon">{getIcon(notif.type)}</span>
                                <div className="notif-details">
                                    <p className="notif-msg">{notif.message}</p>
                                    <span className="notif-time">{getTimeAgo(notif.time)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="notification-footer">
                <div className="notif-settings">
                    <label className="setting-toggle">
                        <input
                            type="checkbox"
                            checked={settings?.sound || false}
                            onChange={() => toggleSetting('sound')}
                        />
                        <span className="toggle-label">Sound</span>
                    </label>
                    <label className="setting-toggle">
                        <input
                            type="checkbox"
                            checked={settings?.desktop || false}
                            onChange={() => toggleSetting('desktop')}
                        />
                        <span className="toggle-label">Desktop</span>
                    </label>
                </div>
                <button className="view-all-btn" onClick={onClose}>View All Activity</button>
            </div>
        </div>
    )
}

export default NotificationPanel
