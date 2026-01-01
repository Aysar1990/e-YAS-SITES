/**
 * Database Settings Component - Compact Version
 */

import { useState, useEffect } from 'react'

const DatabaseSettings = ({ onShowMessage }) => {
  const [databaseType, setDatabaseType] = useState('sqlite')
  const [supabaseConfig, setSupabaseConfig] = useState({ url: '', key: '' })
  const [connectionStatus, setConnectionStatus] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        if (window.electron?.getDatabaseType) {
          const result = await window.electron.getDatabaseType()
          if (result.success && result.type) setDatabaseType(result.type)
        }
        if (window.electron?.getSupabaseConfig) {
          const configResult = await window.electron.getSupabaseConfig()
          if (configResult.success && configResult.config) {
            setSupabaseConfig({
              url: configResult.config.url || '',
              key: configResult.config.key || ''
            })
            if (configResult.config.url && configResult.config.key) {
              setConnectionStatus('connected')
            }
          }
        }
      } catch (error) {
        console.error('Error loading database settings:', error)
      }
    }
    loadSettings()
  }, [])

  const handleTestConnection = async () => {
    if (!supabaseConfig.url || !supabaseConfig.key) {
      onShowMessage?.('error', 'Enter URL and API Key')
      return
    }
    setIsLoading(true)
    setConnectionStatus('testing')
    try {
      if (window.electron?.testDatabaseConnection) {
        const result = await window.electron.testDatabaseConnection('supabase', supabaseConfig)
        setConnectionStatus(result.success ? 'connected' : 'disconnected')
        onShowMessage?.(result.success ? 'success' : 'error', result.message)
      }
    } catch (error) {
      setConnectionStatus('disconnected')
      onShowMessage?.('error', error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApplySettings = async () => {
    setIsSaving(true)
    try {
      if (databaseType === 'supabase') {
        if (!supabaseConfig.url || !supabaseConfig.key) {
          onShowMessage?.('error', 'Enter Supabase credentials')
          setIsSaving(false)
          return
        }
        if (window.electron?.setSupabaseConfig) {
          await window.electron.setSupabaseConfig(supabaseConfig.url, supabaseConfig.key)
        }
      }
      if (window.electron?.setDatabaseType) {
        const result = await window.electron.setDatabaseType(databaseType)
        if (result.success) {
          onShowMessage?.('success', 'Saved! Restart required.')
        }
      }
    } catch (error) {
      onShowMessage?.('error', error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const statusColors = {
    connected: '#8FD9D9',
    disconnected: '#ef4444',
    testing: '#f59e0b'
  }

  return (
    <div className="settings-card">
      <h3>
        🗄️ Database
        {connectionStatus && (
          <span style={{
            marginLeft: '0.5rem',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: statusColors[connectionStatus] || '#64748b',
            display: 'inline-block'
          }} />
        )}
      </h3>

      <div className="settings-form">
        <div className="form-group">
          <label>Type</label>
          <select
            value={databaseType}
            onChange={(e) => setDatabaseType(e.target.value)}
          >
            <option value="sqlite">SQLite (Local)</option>
            <option value="supabase">Supabase (Cloud)</option>
          </select>
        </div>

        {databaseType === 'supabase' && (
          <>
            <div className="form-group">
              <label>Supabase URL</label>
              <input
                type="text"
                placeholder="https://your-project.supabase.co"
                value={supabaseConfig.url}
                onChange={(e) => setSupabaseConfig({ ...supabaseConfig, url: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>API Key</label>
              <input
                type="password"
                placeholder="eyJhbGci..."
                value={supabaseConfig.key}
                onChange={(e) => setSupabaseConfig({ ...supabaseConfig, key: e.target.value })}
              />
            </div>

            <button
              className="btn btn-secondary"
              onClick={handleTestConnection}
              disabled={isLoading}
              style={{ width: '100%', marginBottom: '0.5rem' }}
            >
              {isLoading ? '⏳ Testing...' : '🔌 Test Connection'}
            </button>
          </>
        )}

        <div className="message info" style={{ fontSize: '0.75rem', padding: '0.5rem' }}>
          ⚠️ Restart required after changes
        </div>

        <div className="form-actions">
          <button
            className="save-btn"
            onClick={handleApplySettings}
            disabled={isSaving}
          >
            {isSaving ? '⏳ Saving...' : '💾 Apply'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DatabaseSettings
