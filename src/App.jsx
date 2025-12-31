import { useState, useEffect } from 'react'
import { HashRouter as Router } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import { LanguageProvider } from './context/LanguageContext'
import { NotificationProvider } from './context/NotificationContext'
import { ThemeProvider } from './context/ThemeContext'
import { GlobalErrorBoundary, AsyncErrorBoundary } from './components/ErrorBoundary'
import ClientSetup from './pages/ClientSetup'
import AppRoutes from './routes'
import SyncIndicator from './components/SyncIndicator'
import './styles/global.css'
import './styles/themes.css'

// Check if running in Cloud Mode (Vercel)
const isCloudMode = () => {
  return import.meta.env.VITE_API_URL || 
         window.location.hostname.includes('vercel.app') ||
         window.location.hostname.includes('netlify.app')
}

function App() {
  const [appMode, setAppMode] = useState(null)
  const [loading, setLoading] = useState(true)

  // Helper function to build correct URL
  const getServerUrl = (ip) => {
    const cleanIP = ip.replace(/^https?:\/\//, '').replace(/\/$/, '')
    if (cleanIP.includes('.com') || cleanIP.includes('.net') || cleanIP.includes('.io') || cleanIP.includes('.dev') || cleanIP.includes('.app')) {
      return `https://${cleanIP}`
    }
    return `http://${cleanIP}:3001`
  }

  useEffect(() => {
    checkMode()
  }, [])

  const checkMode = async () => {
    // Cloud Mode - skip setup
    if (isCloudMode()) {
      console.log('[App] Cloud mode detected, skipping setup')
      setAppMode('cloud')
      setLoading(false)
      return
    }

    const savedMode = localStorage.getItem('tssr_mode')
    const serverIP = localStorage.getItem('tssr_server_ip')

    // If client mode, verify server is reachable
    if (savedMode === 'client' && serverIP) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 3000)

        const serverUrl = getServerUrl(serverIP)
        const response = await fetch(`${serverUrl}/api/health`, {
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          setAppMode('client')
          setLoading(false)
          return
        }
      } catch {
        // Server not reachable, clear and show setup
        console.log('[App] Server not reachable, showing setup')
      }
    }

    // Check if running in Electron
    if (window.electron) {
      setAppMode('standalone')
    } else {
      // Pure browser = needs server connection
      setAppMode('needs-setup')
    }

    setLoading(false)
  }

  const handleClientConnect = (serverIP) => {
    localStorage.setItem('tssr_mode', 'client')
    localStorage.setItem('tssr_server_ip', serverIP)
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  // Show client setup for browser users (not cloud mode)
  if (appMode === 'needs-setup') {
    return (
      <ThemeProvider>
        <LanguageProvider>
          <ClientSetup onConnect={handleClientConnect} />
        </LanguageProvider>
      </ThemeProvider>
    )
  }

  // Normal app (standalone, client, or cloud mode)
  return (
    <GlobalErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <AsyncErrorBoundary>
              <DataProvider>
                <NotificationProvider>
                  {/* Sync Indicator */}
                  {appMode === 'standalone' && <SyncIndicator />}

                  <Router>
                    <AppRoutes />
                  </Router>
                </NotificationProvider>
              </DataProvider>
            </AsyncErrorBoundary>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </GlobalErrorBoundary>
  )
}

export default App
