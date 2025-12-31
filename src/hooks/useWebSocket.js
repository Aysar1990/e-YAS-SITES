import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'

const WS_URL = 'ws://localhost:3002'
const RECONNECT_DELAY = 3000

export const useWebSocket = () => {
    const { user, getAuthToken, loading } = useAuth()
    const [socket, setSocket] = useState(null)
    const [isConnected, setIsConnected] = useState(false)
    const [lastMessage, setLastMessage] = useState(null)

    // Connection refs to avoid closures issues
    const wsRef = useRef(null)
    const reconnectTimeoutRef = useRef(null)

    const connect = useCallback(() => {
        if (loading) return
        if (wsRef.current?.readyState === WebSocket.OPEN) return

        // Clear any pending reconnects
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
            reconnectTimeoutRef.current = null
        }

        const ws = new WebSocket(WS_URL)
        wsRef.current = ws

        ws.onopen = () => {
            console.log('[WebSocket] Connected')
            setIsConnected(true)

            // Authenticate
            const token = getAuthToken()
            if (token) {
                ws.send(JSON.stringify({ type: 'auth', token }))
            } else if (user) {
                // If we are in Electron/Mock mode without a token, we might send user info directly 
                // OR rely on the server being lenient. 
                // Based on server code, it expects a token. 
                // For development/mock, we might need a workaround or just skip auth if no token.
                console.warn('[WebSocket] No auth token found, sending mock auth')
                ws.send(JSON.stringify({ type: 'auth', token: 'mock-token' }))
            }
        }

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data)
                setLastMessage(message)

                // Handle ping/pong if needed (not implemented in server yet)
            } catch (e) {
                console.error('[WebSocket] Message parse error', e)
            }
        }

        ws.onclose = () => {
            console.log('[WebSocket] Disconnected')
            setIsConnected(false)
            wsRef.current = null

            // Attempt reconnect
            reconnectTimeoutRef.current = setTimeout(() => {
                connect()
            }, RECONNECT_DELAY)
        }

        ws.onerror = (error) => {
            console.error('[WebSocket] Error:', error)
            ws.close()
        }

        setSocket(ws)
    }, [user, getAuthToken, loading])

    useEffect(() => {
        connect()

        return () => {
            if (wsRef.current) {
                wsRef.current.close()
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current)
            }
        }
    }, [connect])

    const sendMessage = useCallback((type, data) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type, data }))
        } else {
            console.warn('[WebSocket] Cannot send, socket not open')
        }
    }, [])

    return { isConnected, lastMessage, sendMessage }
}

export default useWebSocket
