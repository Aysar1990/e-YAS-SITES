import { useState, useEffect } from 'react'
import './ModeSelection.css'

const ModeSelection = ({ onModeSelect }) => {
  const [serverIP, setServerIP] = useState('')
  const [savedIP, setSavedIP] = useState('')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [serverInfo, setServerInfo] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadConfig = async () => {
      try {
        if (window.electron && window.electron.getAppConfig) {
          const config = await window.electron.getAppConfig()
          if (config.lastServerIP) {
            setServerIP(config.lastServerIP)
            setSavedIP(config.lastServerIP)
          }
        }
      } catch (error) {
        console.error('Failed to load config:', error)
      }
      setLoading(false)
    }
    loadConfig()
  }, [])

  const handleServerMode = async () => {
    try {
      if (window.electron && window.electron.saveAppConfig) {
        await window.electron.saveAppConfig({ lastMode: 'server' })
      }
      onModeSelect({ mode: 'server' })
    } catch (error) {
      console.error('Failed to start server mode:', error)
    }
  }

  const testConnection = async () => {
    if (!serverIP) {
      alert('Please enter server IP address')
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(`http://${serverIP}:3001/api/health`, {
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        setTestResult('success')
        setServerInfo(data)
      } else {
        setTestResult('failed')
      }
    } catch (error) {
      console.error('Connection test failed:', error)
      setTestResult('failed')
    }

    setTesting(false)
  }

  const handleClientMode = async () => {
    if (!serverIP) {
      alert('Please enter server IP address')
      return
    }

    if (testResult !== 'success') {
      await testConnection()
      return
    }

    try {
      if (window.electron && window.electron.saveAppConfig) {
        await window.electron.saveAppConfig({
          lastMode: 'client',
          lastServerIP: serverIP
        })
      }
      onModeSelect({ mode: 'client', serverIP })
    } catch (error) {
      console.error('Failed to start client mode:', error)
    }
  }

  if (loading) {
    return (
      <div className="mode-selection loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="mode-selection">
      <div className="mode-container">
        {/* Header */}
        <div className="mode-header">
          <div className="logo">🏗️</div>
          <h1>YAS TSSR Monitor</h1>
          <p>Technical Site Survey Report Tracker</p>
        </div>

        {/* Cards Container */}
        <div className="mode-cards">
          {/* Server Mode Card */}
          <div className="mode-card server">
            <div className="card-glow"></div>
            <div className="card-content">
              <div className="card-icon">🖥️</div>
              <h2>Server Mode</h2>
              <p className="card-desc">Run as the main server with full control</p>

              <div className="features">
                <div className="feature">
                  <span className="check">✓</span>
                  <span>Read Excel files</span>
                </div>
                <div className="feature">
                  <span className="check">✓</span>
                  <span>Manage database</span>
                </div>
                <div className="feature">
                  <span className="check">✓</span>
                  <span>Serve other clients</span>
                </div>
                <div className="feature">
                  <span className="check">✓</span>
                  <span>Full admin access</span>
                </div>
              </div>

              <button className="btn-primary" onClick={handleServerMode}>
                <span className="btn-icon">🚀</span>
                Start as Server
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="mode-divider">
            <div className="divider-line"></div>
            <span>OR</span>
            <div className="divider-line"></div>
          </div>

          {/* Client Mode Card */}
          <div className="mode-card client">
            <div className="card-glow"></div>
            <div className="card-content">
              <div className="card-icon">💻</div>
              <h2>Client Mode</h2>
              <p className="card-desc">Connect to an existing server</p>

              <div className="connection-form">
                <label>Server IP Address</label>
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="192.168.1.100"
                    value={serverIP}
                    onChange={(e) => {
                      setServerIP(e.target.value)
                      setTestResult(null)
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && testConnection()}
                  />
                  <button
                    className="btn-test"
                    onClick={testConnection}
                    disabled={testing || !serverIP}
                  >
                    {testing ? (
                      <span className="mini-spinner"></span>
                    ) : (
                      'Test'
                    )}
                  </button>
                </div>

                {testResult === 'success' && (
                  <div className="test-result success">
                    <span className="result-icon">✓</span>
                    <div className="result-text">
                      <span>Connected to server</span>
                      {serverInfo && <small>Version: {serverInfo.version}</small>}
                    </div>
                  </div>
                )}

                {testResult === 'failed' && (
                  <div className="test-result failed">
                    <span className="result-icon">✗</span>
                    <div className="result-text">
                      <span>Cannot connect to server</span>
                      <small>Check IP and make sure server is running</small>
                    </div>
                  </div>
                )}

                {savedIP && savedIP !== serverIP && (
                  <button
                    className="btn-link"
                    onClick={() => setServerIP(savedIP)}
                  >
                    Use last server: {savedIP}
                  </button>
                )}
              </div>

              <button
                className="btn-primary"
                onClick={handleClientMode}
                disabled={testing}
              >
                <span className="btn-icon">🔗</span>
                {testResult === 'success' ? 'Connect to Server' : 'Test & Connect'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mode-footer">
          <p>Zain Jordan - TSSR Tracking System</p>
          <small>v1.0.0</small>
        </div>
      </div>

      {/* Background Effects */}
      <div className="bg-effects">
        <div className="bg-circle circle-1"></div>
        <div className="bg-circle circle-2"></div>
        <div className="bg-circle circle-3"></div>
      </div>
    </div>
  )
}

export default ModeSelection
