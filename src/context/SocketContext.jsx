import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { useApp } from './AppContext'

const SocketContext = createContext(null)

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider')
  }
  return context
}

export const SocketProvider = ({ children }) => {
  const { mode, serverIP } = useApp()
  const [connected, setConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState(null)
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const reconnectAttempts = useRef(0)

  const connect = useCallback((token) => {
    if (mode !== 'client' || !serverIP || !token) return

    const wsUrl = `ws://${serverIP}:3002`
    console.log('[WebSocket] Connecting to:', wsUrl)

    try {
      wsRef.current = new WebSocket(wsUrl)

      wsRef.current.onopen = () => {
        console.log('[WebSocket] Connected')
        reconnectAttempts.current = 0

        wsRef.current.send(JSON.stringify({
          type: 'auth',
          token
        }))
      }

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('[WebSocket] Message:', data.type)

          if (data.type === 'auth_success') {
            setConnected(true)
          } else if (data.type === 'auth_failed') {
            console.error('[WebSocket] Auth failed:', data.error)
            setConnected(false)
          } else {
            setLastMessage(data)
          }
        } catch (error) {
          console.error('[WebSocket] Parse error:', error)
        }
      }

      wsRef.current.onclose = (event) => {
        console.log('[WebSocket] Disconnected:', event.code)
        setConnected(false)
        wsRef.current = null

        if (event.code !== 1000 && reconnectAttempts.current < 5) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
          reconnectAttempts.current++
          console.log(`[WebSocket] Reconnecting in ${delay}ms`)

          reconnectTimeoutRef.current = setTimeout(() => {
            connect(token)
          }, delay)
        }
      }

      wsRef.current.onerror = (error) => {
        console.error('[WebSocket] Error:', error)
      }
    } catch (error) {
      console.error('[WebSocket] Connection error:', error)
    }
  }, [mode, serverIP])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnect')
      wsRef.current = null
    }

    setConnected(false)
  }, [])

  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  const value = {
    connected,
    lastMessage,
    connect,
    disconnect
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}

export default SocketContext
