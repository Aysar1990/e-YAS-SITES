import { createContext, useContext, useState } from 'react'

const AppContext = createContext(null)

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}

export const AppProvider = ({ children }) => {
  const [mode, setMode] = useState(null) // 'server' | 'client' | null
  const [serverIP, setServerIP] = useState('')
  const [appReady, setAppReady] = useState(false)
  const [serverStatus, setServerStatus] = useState({
    apiRunning: false,
    wsRunning: false,
    connectedClients: 0
  })

  const initializeMode = async (config) => {
    console.log('🔧 Initializing mode:', config.mode)
    setMode(config.mode)

    if (config.mode === 'server') {
      // Don't start servers automatically - they cause port conflicts
      // The servers are already started in main.js on app ready
      console.log('📡 Server mode selected - using existing servers')
      setServerStatus({
        apiRunning: true,
        wsRunning: true,
        connectedClients: 0
      })
    } else if (config.mode === 'client') {
      setServerIP(config.serverIP)
    }

    setAppReady(true)
    console.log('✅ Mode initialized, appReady:', true)
  }

  const resetMode = async () => {
    setMode(null)
    setServerIP('')
    setAppReady(false)
  }

  const updateConnectedClients = (count) => {
    setServerStatus(prev => ({ ...prev, connectedClients: count }))
  }

  const value = {
    mode,
    serverIP,
    appReady,
    serverStatus,
    initializeMode,
    resetMode,
    updateConnectedClients,
    isServerMode: mode === 'server',
    isClientMode: mode === 'client'
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export default AppContext
