import React, { useState, useRef, useEffect } from 'react'
import { useNotifications } from '../../context/NotificationContext'
import NotificationPanel from './NotificationPanel'
import './Notifications.css'

const NotificationBell = () => {
    const { unreadCount } = useNotifications()
    const [isOpen, setIsOpen] = useState(false)
    const bellRef = useRef(null)

    // Close panel when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (bellRef.current && !bellRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div className="notification-container" ref={bellRef}>
            <button
                className={`notification-bell-btn ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                title="Notifications"
            >
                <span className="bell-icon">🔔</span>
                {unreadCount > 0 && (
                    <span className="notification-badge">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && <NotificationPanel onClose={() => setIsOpen(false)} />}
        </div>
    )
}

export default NotificationBell
