import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import useWebSocket from '../hooks/useWebSocket'

const NotificationContext = createContext()

/**
 * Provides global access to notifications and activity feed.
 * Handles incoming WebSocket messages and updates local state.
 */
export const NotificationProvider = ({ children }) => {
    const { lastMessage, isConnected } = useWebSocket()

    const [activities, setActivities] = useState([])
    const [notifications, setNotifications] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)

    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('tssr_notification_settings')
        return saved ? JSON.parse(saved) : { sound: true, desktop: true }
    })

    useEffect(() => {
        localStorage.setItem('tssr_notification_settings', JSON.stringify(settings))
    }, [settings])

    const toggleSetting = (key) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }))
    }

    // Notification sound
    const playNotificationSound = () => {
        try {
            const beep = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbqWEzM2Cevt+tYzMzYJ6+361jMzNgnr7frWMzM2Cevt+tYzMzYJ6+361jMzNgnr7frWMzM2Cevt+tYzMzYJ6+361jMzNgAA=="
            const sound = new Audio(beep)
            sound.volume = 0.5
            sound.play().catch(e => console.warn('Audio play failed', e))
        } catch (e) {
            console.error('Sound error', e)
        }
    }

    const showDesktopNotification = (activity) => {
        if (!("Notification" in window)) return

        if (Notification.permission === "granted") {
            new Notification("TSSR Monitor Update", {
                body: activity.message,
                icon: '/vite.svg'
            })
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    new Notification("TSSR Monitor Update", {
                        body: activity.message,
                        icon: '/vite.svg'
                    })
                }
            })
        }
    }

    // Request desktop permission on mount if enabled
    useEffect(() => {
        if (settings.desktop && "Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
            Notification.requestPermission()
        }
    }, [])

    // Handle incoming WS messages
    useEffect(() => {
        if (lastMessage) {
            processMessage(lastMessage)
        }
    }, [lastMessage])

    const processMessage = (msg) => {
        let newActivity = null

        if (msg.type === 'data_update') {
            newActivity = {
                id: Date.now(),
                type: 'update',
                message: `Data Updated: ${msg.data?.updateType || 'General Update'}`,
                time: new Date().toISOString()
            }
        } else if (msg.type === 'sync_complete') {
            newActivity = {
                id: Date.now(),
                type: 'sync',
                message: 'Database Synchronization Complete',
                time: new Date().toISOString()
            }
        } else if (msg.type === 'site_approved') {
            newActivity = {
                id: Date.now(),
                type: 'approval',
                message: `Site ${msg.data?.siteId || ''} Approved`,
                time: new Date().toISOString()
            }
        } else if (msg.type === 'site_rejected') {
            newActivity = {
                id: Date.now(),
                type: 'rejection',
                message: `Site ${msg.data?.siteId || ''} Rejected`,
                time: new Date().toISOString()
            }
        }

        if (newActivity) {
            addActivity(newActivity)
            addNotification(newActivity)
        }
    }

    const addActivity = (activity) => {
        setActivities(prev => [activity, ...prev].slice(0, 50))
    }

    const addNotification = (notification) => {
        setNotifications(prev => [notification, ...prev])
        setUnreadCount(prev => prev + 1)

        if (settings.sound) playNotificationSound()
        if (settings.desktop) showDesktopNotification(notification)
    }

    const markAllAsRead = () => {
        setUnreadCount(0)
    }

    // Debug function - only for development testing
    const simulateEvent = (type) => {
        if (process.env.NODE_ENV !== 'development') return
        
        const msgs = {
            'approve': { type: 'approval', message: 'Test: Site Approved' },
            'reject': { type: 'rejection', message: 'Test: Site Rejected' },
            'upload': { type: 'upload', message: 'Test: Survey Uploaded' }
        }

        const evt = msgs[type] || { type: 'info', message: 'System Test Event' }
        const newActivity = {
            id: Date.now(),
            ...evt,
            time: new Date().toISOString()
        }
        addActivity(newActivity)
        addNotification(newActivity)
    }

    return (
        <NotificationContext.Provider value={{
            isConnected,
            activities,
            notifications,
            unreadCount,
            markAllAsRead,
            simulateEvent,
            settings,
            toggleSetting
        }}>
            {children}
        </NotificationContext.Provider>
    )
}

export const useNotifications = () => {
    const context = useContext(NotificationContext)
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider')
    }
    return context
}
