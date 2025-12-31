import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

// Check if running in Electron (desktop app)
const isElectron = typeof window !== 'undefined' && !!(window.electron)

// Check if running in cloud/production mode
const isCloudMode = () => {
  // Check for production API URL
  const apiUrl = import.meta.env.VITE_API_URL
  return apiUrl && (apiUrl.includes('onrender.com') || apiUrl.includes('vercel.app') || apiUrl.includes('https://'))
}

// Check if running in client mode (browser connecting to server)
const isClientMode = () => {
  // In cloud mode, always use API
  if (isCloudMode()) return true

  const mode = localStorage.getItem('tssr_mode')
  const serverIP = localStorage.getItem('tssr_server_ip')
  return mode === 'client' && serverIP
}

// Check if IP is a domain
const isDomain = (ip) => {
  return ip && (
    ip.includes('.com') ||
    ip.includes('.net') ||
    ip.includes('.io') ||
    ip.includes('.dev') ||
    ip.includes('.app') ||
    ip.includes('.onrender.com') ||
    ip.includes('.vercel.app')
  )
}

// Get server URL for client mode
const getServerURL = () => {
  // First check for environment variable (production)
  const envApiUrl = import.meta.env.VITE_API_URL
  if (envApiUrl) {
    return envApiUrl.replace(/\/$/, '')
  }

  // Fall back to localStorage (development/local)
  const serverIP = localStorage.getItem('tssr_server_ip')
  if (!serverIP) return ''

  // If already a full URL
  if (serverIP.startsWith('http://') || serverIP.startsWith('https://')) {
    const url = serverIP.replace(/\/$/, '')
    return url.endsWith('/api') ? url : `${url}/api`
  }

  const cleanIP = serverIP.replace(/^https?:\/\//, '').replace(/\/$/, '')
  if (isDomain(cleanIP)) {
    return `https://${cleanIP}/api`
  }
  return `http://${cleanIP}:3001/api`
}

// Mock login for browser development (no server)
const mockLogin = async ({ username, password }) => {
  const users = {
    admin: { username: 'admin', role: 'admin', name: 'Administrator' },
    management: { username: 'management', role: 'management', name: 'Manager' },
    subcon: { username: 'subcon', role: 'contractor', name: 'Contractor', contractorName: 'Test Contractor' },
  }

  const user = users[username]
  // Allow password to be '123456' OR the username itself (for demo convenience as shown in UI)
  if (user && (password === '123456' || password === username)) {
    return { success: true, user }
  }
  return { success: false, error: 'Invalid credentials' }
}

// API login for client mode
const apiLogin = async ({ username, password }) => {
  try {
    const response = await fetch(`${getServerURL()}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })

    const result = await response.json()

    if (result.success && result.token) {
      // Store JWT token
      localStorage.setItem('tssr_auth_token', result.token)
      return {
        success: true,
        user: {
          id: result.user.id,
          username: result.user.username,
          role: result.user.role,
          contractorName: result.user.contractor_name
        }
      }
    }

    return { success: false, error: result.error || 'Invalid credentials' }
  } catch (error) {
    console.error('[Auth] API login error:', error)
    return { success: false, error: error.message }
  }
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = localStorage.getItem('tssr_user')
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)

        // In client mode, verify token is still valid
        if (isClientMode()) {
          verifyToken().then(valid => {
            if (valid) {
              setUser(parsedUser)
            } else {
              // Token expired, clear stored data
              localStorage.removeItem('tssr_user')
              localStorage.removeItem('tssr_auth_token')
            }
            setLoading(false)
          })
        } else {
          setUser(parsedUser)
          setLoading(false)
        }
      } catch (e) {
        localStorage.removeItem('tssr_user')
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }, [])

  const verifyToken = async () => {
    try {
      const token = localStorage.getItem('tssr_auth_token')
      if (!token) return false

      const response = await fetch(`${getServerURL()}/auth/verify`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const result = await response.json()
      return result.valid
    } catch {
      return false
    }
  }

  const login = async (username, password) => {
    try {
      let loginFn

      if (isElectron) {
        loginFn = window.electron.login
      } else if (isClientMode()) {
        loginFn = apiLogin
      } else {
        loginFn = mockLogin
      }

      const result = await loginFn({ username, password })

      if (result.success) {
        setUser(result.user)
        localStorage.setItem('tssr_user', JSON.stringify(result.user))
        return { success: true, user: result.user }
      }

      return { success: false, error: result.error || 'Invalid credentials' }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: error.message }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('tssr_user')
    localStorage.removeItem('tssr_auth_token')
  }

  const updatePassword = async (newPassword) => {
    if (!user) return { success: false, error: 'Not logged in' }

    try {
      if (isElectron) {
        const result = await window.electron.updatePassword({
          username: user.username,
          newPassword,
        })
        return result
      }

      if (isClientMode()) {
        // Password update not available in client mode
        return { success: false, error: 'Password update not available in client mode' }
      }

      // Mock update for browser dev mode
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Get auth token for API requests
  const getAuthToken = () => {
    return localStorage.getItem('tssr_auth_token')
  }

  const value = {
    user,
    login,
    logout,
    updatePassword,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isManagement: user?.role === 'management',
    isContractor: user?.role === 'contractor',
    getAuthToken,
    isClientMode: isClientMode()
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext
