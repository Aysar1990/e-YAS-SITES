import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useData } from '../../context/DataContext'
import { useFirebaseData } from '../../hooks/useFirebaseData'
import { MainLayout } from '../../components/Layout'
import { Card, StatusBadge } from '../../components/UI'
import '../Admin/AdminDashboard.css'

const ManagementDashboard = () => {
  const { t } = useTranslation()
  const { stats: localStats, phases, activePhase, setActivePhase, loading: localLoading, fetchData } = useData()
  
  // Auto-detect online status
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Firebase data - enabled only when online
  const {
    sites: firebaseSites,
    stats: firebaseStats,
    loading: firebaseLoading,
    connected: firebaseConnected,
    lastUpdate: firebaseLastUpdate
  } = useFirebaseData({ phase: activePhase, enabled: isOnline })

  useEffect(() => {
    if (!isOnline) {
      fetchData()
    }
  }, [isOnline])

  // Auto-switch: Use Firebase/Supabase when online and connected, SQLite when offline
  const useCloudData = isOnline && firebaseConnected
  const loading = isOnline ? firebaseLoading : localLoading
  const stats = useCloudData ? firebaseStats : localStats

  // Calculate totals - handle both Firebase and local stats formats
  const totalSites = useCloudData
    ? (stats.totalSites || firebaseSites.length || 0)
    : (stats.statusBreakdown?.reduce((sum, s) => sum + s.count, 0) || 0)

  const approvedCount = useCloudData
    ? (stats.approved || 0)
    : (stats.statusBreakdown?.find(s => s.tssr_overall_status?.toLowerCase().includes('approved'))?.count || 0)

  // Status breakdown for display
  const statusBreakdown = useCloudData
    ? (stats.statusBreakdown || [])
    : (stats.statusBreakdown || [])

  return (
    <MainLayout>
      <div className="dashboard">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">{t('dashboard.title')}</h1>
            <p className="dashboard-subtitle">
              Management View - TSSR Overview
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div className="phase-selector">
              <label>Phase:</label>
              <select
                value={activePhase}
                onChange={(e) => setActivePhase(e.target.value)}
              >
                <option value="ALL">All Phases</option>
                {phases.map((phase) => (
                  <option key={phase.phase_name} value={phase.phase_name}>
                    {phase.phase_name} ({phase.count})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>{t('common.loading')}</p>
          </div>
        ) : (
          <>
            <div className="stats-grid">
              <Card className="stat-card">
                <div className="stat-content">
                  <div className="stat-icon">📍</div>
                  <div className="stat-info">
                    <span className="stat-value">{totalSites.toLocaleString()}</span>
                    <span className="stat-label">{t('dashboard.totalSites')}</span>
                  </div>
                </div>
              </Card>

              <Card className="stat-card success">
                <div className="stat-content">
                  <div className="stat-icon">✅</div>
                  <div className="stat-info">
                    <span className="stat-value">{approvedCount.toLocaleString()}</span>
                    <span className="stat-label">{t('dashboard.approved')}</span>
                  </div>
                </div>
              </Card>

              <Card className="stat-card warning">
                <div className="stat-content">
                  <div className="stat-icon">⏳</div>
                  <div className="stat-info">
                    <span className="stat-value">{(totalSites - approvedCount).toLocaleString()}</span>
                    <span className="stat-label">{t('dashboard.pending')}</span>
                  </div>
                </div>
              </Card>

              <Card className="stat-card info">
                <div className="stat-content">
                  <div className="stat-icon">📊</div>
                  <div className="stat-info">
                    <span className="stat-value">
                      {totalSites > 0 ? ((approvedCount / totalSites) * 100).toFixed(1) : 0}%
                    </span>
                    <span className="stat-label">{t('dashboard.approvalRate')}</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Status Breakdown */}
            <Card title={t('dashboard.statusBreakdown')} className="status-breakdown-card">
              <div className="status-list">
                {statusBreakdown.slice(0, 10).map((item, index) => (
                  <div key={index} className="status-item">
                    <StatusBadge status={item.tssr_overall_status || item.status} />
                    <span className="status-count">{item.count}</span>
                    <div className="status-bar">
                      <div
                        className="status-bar-fill"
                        style={{
                          width: `${(item.count / totalSites) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Phases Overview */}
            <Card title="Phases Overview" className="phases-card">
              <div className="phases-grid">
                {phases.slice(0, 8).map((phase) => (
                  <div
                    key={phase.phase_name}
                    className={`phase-item ${activePhase === phase.phase_name ? 'active' : ''}`}
                    onClick={() => setActivePhase(phase.phase_name)}
                  >
                    <span className="phase-name">{phase.phase_name}</span>
                    <span className="phase-count">{phase.count}</span>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>
    </MainLayout>
  )
}

export default ManagementDashboard
