/**
 * SyncToSupabase Component
 * UI for uploading data from SQLite to Supabase cloud database
 */

import { useState, useEffect, useCallback } from 'react'
import './SyncToSupabase.css'

const SyncToSupabase = () => {
  // States
  const [status, setStatus] = useState('idle') // idle, testing, syncing, success, error
  const [selectedPhase, setSelectedPhase] = useState('RO4')
  const [phases, setPhases] = useState([])
  const [connectionInfo, setConnectionInfo] = useState(null)
  const [syncInfo, setSyncInfo] = useState(null)
  const [progress, setProgress] = useState({ current: 0, total: 0, percentage: 0 })
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [lastSync, setLastSync] = useState(null)

  // Load phases on mount
  useEffect(() => {
    loadPhases()
  }, [])

  // Load sync info when phase changes
  useEffect(() => {
    if (selectedPhase) {
      loadSyncInfo(selectedPhase)
    }
  }, [selectedPhase])

  // Setup progress listener
  useEffect(() => {
    if (window.electron?.onSupabaseProgress) {
      window.electron.onSupabaseProgress((data) => {
        setProgress({
          current: data.current || 0,
          total: data.total || 0,
          percentage: data.percentage || 0
        })

        if (data.status === 'completed') {
          setStatus('success')
        } else if (data.status === 'completed_with_errors') {
          setStatus('error')
        } else if (data.status === 'error') {
          setStatus('error')
          setError(data.error || 'Unknown error occurred')
        }
      })
    }

    return () => {
      if (window.electron?.removeSupabaseProgressListener) {
        window.electron.removeSupabaseProgressListener()
      }
    }
  }, [])

  // Load available phases
  const loadPhases = async () => {
    try {
      if (window.electron?.supabaseGetPhases) {
        const result = await window.electron.supabaseGetPhases()
        if (result.success && result.data?.phases) {
          setPhases(result.data.phases)
          // Set default phase if available
          if (result.data.phases.length > 0 && !selectedPhase) {
            setSelectedPhase(result.data.phases[0].name)
          }
        }
      }
    } catch (err) {
      console.error('Failed to load phases:', err)
    }
  }

  // Load sync info for selected phase
  const loadSyncInfo = async (phase) => {
    try {
      if (window.electron?.supabaseGetInfo) {
        const result = await window.electron.supabaseGetInfo(phase)
        if (result.success && result.data) {
          setSyncInfo(result.data)
        }
      }
    } catch (err) {
      console.error('Failed to load sync info:', err)
    }
  }

  // Test connection to Supabase
  const handleTestConnection = async () => {
    setStatus('testing')
    setError(null)
    setConnectionInfo(null)

    try {
      if (window.electron?.supabaseTestConnection) {
        const result = await window.electron.supabaseTestConnection()

        if (result.success) {
          setConnectionInfo({
            connected: true,
            message: result.data?.message || 'Connected successfully',
            latency: result.data?.latency
          })
          setStatus('idle')
        } else {
          setConnectionInfo({
            connected: false,
            message: result.error || 'Connection failed'
          })
          setStatus('error')
          setError(result.error)
        }
      }
    } catch (err) {
      setConnectionInfo({
        connected: false,
        message: err.message || 'Connection failed'
      })
      setStatus('error')
      setError(err.message)
    }
  }

  // Start sync process
  const handleSync = async () => {
    if (!selectedPhase) {
      setError('Please select a phase')
      return
    }

    setStatus('syncing')
    setError(null)
    setResult(null)
    setProgress({ current: 0, total: 0, percentage: 0 })

    try {
      if (window.electron?.supabaseSync) {
        const result = await window.electron.supabaseSync(selectedPhase)

        if (result.success) {
          setResult(result.data?.summary)
          setStatus('success')
          setLastSync(new Date().toISOString())
          // Reload sync info
          loadSyncInfo(selectedPhase)
        } else {
          setError(result.error || 'Sync failed')
          setResult(result.data?.summary)
          setStatus('error')
        }
      }
    } catch (err) {
      setError(err.message || 'Sync failed')
      setStatus('error')
    }
  }

  // Reset state
  const handleReset = () => {
    setStatus('idle')
    setError(null)
    setResult(null)
    setProgress({ current: 0, total: 0, percentage: 0 })
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    return date.toLocaleString('ar-JO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get status icon
  const getStatusIcon = () => {
    switch (status) {
      case 'testing':
      case 'syncing':
        return (
          <div className="sync-spinner">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
            </svg>
          </div>
        )
      case 'success':
        return (
          <div className="sync-icon success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )
      case 'error':
        return (
          <div className="sync-icon error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
            </svg>
          </div>
        )
      default:
        return (
          <div className="sync-icon idle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )
    }
  }

  const isDisabled = status === 'testing' || status === 'syncing'

  return (
    <div className="sync-to-supabase" dir="rtl">
      {/* Header */}
      <div className="sync-header">
        <div className="sync-title">
          {getStatusIcon()}
          <div className="title-text">
            <h2>رفع البيانات إلى Supabase</h2>
            <p className="subtitle">مزامنة البيانات المحلية مع قاعدة البيانات السحابية</p>
          </div>
        </div>

        {/* Connection Status Badge */}
        <div className={`connection-badge ${connectionInfo?.connected ? 'connected' : 'disconnected'}`}>
          <span className="badge-dot"></span>
          <span className="badge-text">
            {connectionInfo?.connected ? 'متصل' : 'غير متصل'}
          </span>
          {connectionInfo?.latency && (
            <span className="badge-latency">{connectionInfo.latency}ms</span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="sync-content">
        {/* Phase Selection */}
        <div className="sync-section">
          <label className="section-label">اختر المرحلة (Phase)</label>
          <div className="phase-selector">
            <select
              value={selectedPhase}
              onChange={(e) => setSelectedPhase(e.target.value)}
              disabled={isDisabled}
              className="phase-dropdown"
            >
              <option value="">-- اختر المرحلة --</option>
              {phases.map((phase, index) => (
                <option key={`${phase.name}-${index}`} value={phase.name}>
                  {phase.name} ({phase.count} سجل)
                </option>
              ))}
              <option value="ALL">جميع المراحل</option>
            </select>
          </div>
        </div>

        {/* Info Cards */}
        <div className="sync-info-grid">
          <div className="info-card">
            <div className="info-icon local">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3z" />
                <path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
              </svg>
            </div>
            <div className="info-content">
              <span className="info-label">السجلات المحلية</span>
              <span className="info-value">{syncInfo?.localCount || 0}</span>
            </div>
          </div>

          <div className="info-card">
            <div className="info-icon cloud">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
              </svg>
            </div>
            <div className="info-content">
              <span className="info-label">السجلات في Supabase</span>
              <span className="info-value">{syncInfo?.remoteCount || 0}</span>
            </div>
          </div>

          <div className="info-card">
            <div className="info-icon sync">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 4v6h-6M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </div>
            <div className="info-content">
              <span className="info-label">آخر مزامنة</span>
              <span className="info-value small">{formatDate(lastSync)}</span>
            </div>
          </div>

          <div className="info-card">
            <div className={`info-icon status ${syncInfo?.syncNeeded ? 'warning' : 'ok'}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {syncInfo?.syncNeeded ? (
                  <path d="M12 9v4M12 17h.01M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z" />
                ) : (
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                )}
              </svg>
            </div>
            <div className="info-content">
              <span className="info-label">الحالة</span>
              <span className={`info-value small ${syncInfo?.syncNeeded ? 'warning' : 'ok'}`}>
                {syncInfo?.syncNeeded ? 'يحتاج مزامنة' : 'متزامن'}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar (visible during sync) */}
        {status === 'syncing' && (
          <div className="sync-progress-section">
            <div className="progress-header">
              <span className="progress-label">جاري الرفع...</span>
              <span className="progress-stats">
                {progress.current} / {progress.total} ({progress.percentage}%)
              </span>
            </div>
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Result Section */}
        {result && (
          <div className={`sync-result ${status === 'success' ? 'success' : 'error'}`}>
            <div className="result-header">
              <span className="result-title">
                {status === 'success' ? 'تمت المزامنة بنجاح!' : 'اكتملت المزامنة مع أخطاء'}
              </span>
            </div>
            <div className="result-stats">
              <div className="result-stat">
                <span className="stat-label">الإجمالي</span>
                <span className="stat-value">{result.total || 0}</span>
              </div>
              <div className="result-stat updated">
                <span className="stat-label">تم التحديث</span>
                <span className="stat-value">{result.updated || 0}</span>
              </div>
              <div className="result-stat failed">
                <span className="stat-label">فشل</span>
                <span className="stat-value">{result.failed || 0}</span>
              </div>
            </div>
            {result.errors && result.errors.length > 0 && (
              <div className="result-errors">
                <span className="errors-title">الأخطاء:</span>
                <ul className="errors-list">
                  {result.errors.slice(0, 5).map((err, index) => (
                    <li key={index}>Batch {err.batch}: {err.message}</li>
                  ))}
                  {result.errors.length > 5 && (
                    <li>...و {result.errors.length - 5} أخطاء أخرى</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && status === 'error' && !result && (
          <div className="sync-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="sync-actions">
          <button
            className="btn btn-secondary"
            onClick={handleTestConnection}
            disabled={isDisabled}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" />
            </svg>
            <span>{status === 'testing' ? 'جاري الاختبار...' : 'اختبار الاتصال'}</span>
          </button>

          {(status === 'success' || status === 'error') && result ? (
            <button
              className="btn btn-primary"
              onClick={handleReset}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              <span>مزامنة أخرى</span>
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={handleSync}
              disabled={isDisabled || !selectedPhase}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
              <span>{status === 'syncing' ? 'جاري الرفع...' : 'رفع الآن'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="sync-footer">
        <div className="footer-info">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          <span>
            سيتم رفع البيانات من الجدول المحلي <code>sites_cache</code> إلى جدول <code>sites</code> في Supabase
          </span>
        </div>
      </div>
    </div>
  )
}

export default SyncToSupabase
