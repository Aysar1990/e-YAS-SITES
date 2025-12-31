import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import './ClientSetup.css'

const ClientSetup = ({ onConnect }) => {
  const { t } = useTranslation()
  const [serverIP, setServerIP] = useState('')
  const [savedIP, setSavedIP] = useState('')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    // Load saved IP
    const saved = localStorage.getItem('tssr_server_ip')
    if (saved) {
      setSavedIP(saved)
      setServerIP(saved)
    }
  }, [])

  const getServerUrl = (ip) => {
    // إذا كان domain (مثل Cloudflare) استخدم https بدون port
    if (ip.includes('.com') || ip.includes('.net') || ip.includes('.io')) {
      return `https://${ip.replace(/^https?:\/\//, '')}`
    }
    // إذا كان IP عادي استخدم http مع port
    return `http://${ip}:3001`
  }

  const testConnection = async () => {
    if (!serverIP.trim()) return

    setTesting(true)
    setTestResult(null)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const serverUrl = getServerUrl(serverIP.trim())
      const response = await fetch(`${serverUrl}/api/health`, {
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        setTestResult({ success: true, message: 'Connected successfully!' })
      } else {
        setTestResult({ success: false, message: 'Server responded with error' })
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error.name === 'AbortError'
          ? 'Connection timeout'
          : 'Cannot reach server'
      })
    }

    setTesting(false)
  }

  const handleConnect = async () => {
    if (!testResult?.success) {
      await testConnection()
      return
    }

    setConnecting(true)

    // Save IP
    localStorage.setItem('tssr_server_ip', serverIP)
    localStorage.setItem('tssr_mode', 'client')

    // Notify parent
    onConnect(serverIP)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      testConnection()
    }
  }

  return (
    <div className="client-setup">
      <div className="setup-container">
        <div className="setup-header">
          <div className="setup-icon">🔌</div>
          <h1>{t('clientSetup.title', 'Connect to Server')}</h1>
          <p>{t('clientSetup.subtitle', 'Enter the server IP provided by your admin')}</p>
        </div>

        <div className="setup-form">
          <div className="input-group">
            <label>{t('clientSetup.serverIP', 'Server IP Address')}</label>
            <input
              type="text"
              value={serverIP}
              onChange={(e) => {
                setServerIP(e.target.value)
                setTestResult(null)
              }}
              onKeyPress={handleKeyPress}
              placeholder="192.168.1.100"
              className="ip-input"
            />
          </div>

          {savedIP && savedIP !== serverIP && (
            <button
              className="btn-use-saved"
              onClick={() => setServerIP(savedIP)}
            >
              {t('clientSetup.useSaved', 'Use last server:')} {savedIP}
            </button>
          )}

          {testResult && (
            <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
              <span className="result-icon">
                {testResult.success ? '✓' : '✗'}
              </span>
              <span>{testResult.message}</span>
            </div>
          )}

          <div className="button-group">
            <button
              className="btn-test"
              onClick={testConnection}
              disabled={testing || !serverIP.trim()}
            >
              {testing ? (
                <>
                  <span className="spinner-small"></span>
                  {t('clientSetup.testing', 'Testing...')}
                </>
              ) : (
                t('clientSetup.testConnection', 'Test Connection')
              )}
            </button>

            <button
              className="btn-connect"
              onClick={handleConnect}
              disabled={connecting || !serverIP.trim()}
            >
              {connecting ? (
                <>
                  <span className="spinner-small"></span>
                  {t('clientSetup.connecting', 'Connecting...')}
                </>
              ) : (
                t('clientSetup.connect', 'Connect')
              )}
            </button>
          </div>
        </div>

        <div className="setup-footer">
          <p>{t('clientSetup.hint', 'Ask your admin for the server IP address')}</p>
        </div>
      </div>
    </div>
  )
}

export default ClientSetup
