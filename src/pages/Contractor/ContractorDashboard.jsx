import { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { useFirebaseData } from '../../hooks/useFirebaseData'
import { MainLayout } from '../../components/Layout'
import './ContractorDashboard.css'

const ContractorDashboard = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { phases, activePhase, setActivePhase } = useData()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [useFirebase, setUseFirebase] = useState(true) // Default to Firebase

  // Firebase data hook
  const {
    sites: firebaseSites,
    loading: firebaseLoading,
    connected: firebaseConnected,
    lastUpdate: firebaseLastUpdate
  } = useFirebaseData({ phase: activePhase, enabled: useFirebase })

  // Get contractor name from user object (supports both formats)
  const contractorName = user?.contractorName || user?.contractor_name

  // Filter Firebase sites by contractor name
  const contractorFirebaseSites = useMemo(() => {
    if (!contractorName || !firebaseSites) return []
    return firebaseSites.filter(site => site.tssrSubcon === contractorName)
  }, [firebaseSites, contractorName])

  // Calculate Firebase stats
  const firebaseStats = useMemo(() => {
    if (!contractorFirebaseSites.length) return null

    const statusCounts = {}
    contractorFirebaseSites.forEach(site => {
      const status = site.tssrOverallStatus || 'Unknown'
      statusCounts[status] = (statusCounts[status] || 0) + 1
    })

    const statusCountsArray = Object.entries(statusCounts).map(([status, count]) => ({ status, count }))

    // Part Of counts
    const partOfCounts = {}
    contractorFirebaseSites.forEach(site => {
      const partOf = site.partOf || 'Not Specified'
      if (!partOfCounts[partOf]) {
        partOfCounts[partOf] = { category: partOf, total: 0, approved: 0 }
      }
      partOfCounts[partOf].total++
      if (site.tssrOverallStatus === 'Approved') {
        partOfCounts[partOf].approved++
      }
    })

    return {
      totalSites: contractorFirebaseSites.length,
      approved: contractorFirebaseSites.filter(s => s.tssrOverallStatus === 'Approved').length,
      tssrSubmitted: contractorFirebaseSites.filter(s => s.version && s.version > 0).length,
      statusCounts: statusCountsArray,
      partOfCounts: Object.values(partOfCounts)
    }
  }, [contractorFirebaseSites])

  useEffect(() => {
    if (!useFirebase) {
      loadContractorStats()
    } else {
      setLoading(false)
    }
  }, [activePhase, contractorName, useFirebase])

  const loadContractorStats = async () => {
    if (!contractorName) return

    setLoading(true)
    try {
      const result = await window.electron.getContractorDetailedStats({
        phase: activePhase,
        name: contractorName
      })
      if (result.success) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Failed to load contractor stats:', error)
    }
    setLoading(false)
  }

  // Use Firebase or local stats
  const activeStats = useFirebase && firebaseConnected ? firebaseStats : stats
  const isLoading = useFirebase ? firebaseLoading : loading

  // Workflow stages configuration
  const workflowStages = [
    { key: 'Site not Surveyed', label: 'Not Surveyed', icon: '📋', color: '#6b7280' },
    { key: 'Need Access', label: 'Need Access', icon: '🔒', color: '#f59e0b' },
    { key: 'TSSR Under Subcon validation', label: 'Under Subcon', icon: '🔧', color: '#8b5cf6' },
    { key: 'TSSR Under Nokia GSD Validation', label: 'Nokia GSD', icon: '📡', color: '#FF8566' },
    { key: 'TSSR Under Nokia NPO Validation', label: 'Nokia NPO', icon: '📶', color: '#0ea5e9' },
    { key: 'TSSR Under Nokia ROM Validation', label: 'Nokia ROM', icon: '🔄', color: '#14b8a6' },
    { key: 'TSSR Under ROM Review', label: 'ROM Review', icon: '📝', color: '#8FD9D9' },
    { key: 'TSSR Under Zain validation', label: 'Under Zain', icon: '🏢', color: '#22c55e' },
    { key: 'Approved', label: 'Approved', icon: '✅', color: '#16a34a' }
  ]

  // Calculate counts from statusCounts
  const getStatusCount = (statusKey) => {
    if (!activeStats?.statusCounts) return 0
    const found = activeStats.statusCounts.find(s => s.status === statusKey)
    return found?.count || 0
  }

  // Calculate metrics
  const totalSites = activeStats?.totalSites || 0
  const approvedCount = activeStats?.approved || 0
  const submittedToZain = activeStats?.tssrSubmitted || 0

  // Submitted to Nokia = past "Under Subcon" stage
  const submittedToNokia = workflowStages
    .slice(3) // From Nokia GSD onwards
    .reduce((sum, stage) => sum + getStatusCount(stage.key), 0)

  // Calculate rates
  const submissionRate = totalSites > 0 ? ((submittedToZain / totalSites) * 100).toFixed(1) : 0
  const approvalRate = totalSites > 0 ? ((approvedCount / totalSites) * 100).toFixed(1) : 0
  const nokiaRate = totalSites > 0 ? ((submittedToNokia / totalSites) * 100).toFixed(1) : 0

  // Part Of breakdown
  const partOfData = activeStats?.partOfCounts || []

  return (
    <MainLayout>
      <div className="contractor-dashboard">
        {/* Header with Phase Filter */}
        <div className="cd-header">
          <div className="cd-header-left">
            <h1 className="cd-title">Contractor Dashboard</h1>
            <p className="cd-subtitle">
              Monitor your sites progress and performance
              {useFirebase && firebaseConnected && (
                <span style={{ marginLeft: '10px', color: '#8FD9D9', fontSize: '0.85rem' }}>
                  ☁️ Firebase Live
                </span>
              )}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {/* Firebase Toggle */}
            <div className="firebase-toggle" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ position: 'relative', width: '44px', height: '22px' }}>
                <input
                  type="checkbox"
                  checked={useFirebase}
                  onChange={(e) => setUseFirebase(e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: useFirebase ? '#8FD9D9' : '#64748b',
                  borderRadius: '22px',
                  transition: '0.3s'
                }}>
                  <span style={{
                    position: 'absolute',
                    height: '18px', width: '18px',
                    left: useFirebase ? '24px' : '2px',
                    bottom: '2px',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    transition: '0.3s'
                  }}></span>
                </span>
              </label>
              <span style={{ fontSize: '0.8rem', color: useFirebase ? '#8FD9D9' : '#64748b' }}>
                {useFirebase ? 'Firebase' : 'SQLite'}
              </span>
              {useFirebase && firebaseLastUpdate && (
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                  {new Date(firebaseLastUpdate).toLocaleTimeString()}
                </span>
              )}
            </div>
            <div className="cd-phase-filter">
              <label>Phase:</label>
              <select
                value={activePhase}
                onChange={(e) => setActivePhase(e.target.value)}
              >
                <option value="ALL">All Phases</option>
                {phases.map((phase) => (
                  <option key={phase.phase_name} value={phase.phase_name}>
                    {phase.phase_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="cd-loading">
            <div className="cd-spinner"></div>
            <p>Loading dashboard...</p>
          </div>
        ) : (
          /* Main Dashboard Card */
          <div className="cd-main-card">
            {/* Card Header */}
            <div className="cd-card-header">
              <div className="cd-contractor-info">
                <div className="cd-contractor-avatar">
                  {(user?.contractor_name || 'C')[0].toUpperCase()}
                </div>
                <div className="cd-contractor-details">
                  <h2 className="cd-contractor-name">{user?.contractor_name || 'Contractor'}</h2>
                  <span className="cd-contractor-role">TSSR Contractor</span>
                </div>
              </div>
              <div className="cd-total-badge">
                <span className="cd-badge-value">{totalSites}</span>
                <span className="cd-badge-label">Total Sites</span>
              </div>
            </div>

            {/* Workflow Pipeline */}
            <div className="cd-section">
              <h3 className="cd-section-title">
                <span className="cd-section-icon">🔄</span>
                Site Workflow Pipeline
              </h3>
              <div className="cd-pipeline">
                {workflowStages.map((stage, index) => {
                  const count = getStatusCount(stage.key)
                  const isActive = count > 0
                  return (
                    <div key={stage.key} className="cd-pipeline-wrapper">
                      <div
                        className={`cd-pipeline-stage ${isActive ? 'active' : ''}`}
                        style={{ '--stage-color': stage.color }}
                      >
                        <div className="cd-stage-icon">{stage.icon}</div>
                        <div className="cd-stage-count">{count}</div>
                        <div className="cd-stage-label">{stage.label}</div>
                      </div>
                      {index < workflowStages.length - 1 && (
                        <div className="cd-pipeline-arrow">→</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="cd-section">
              <h3 className="cd-section-title">
                <span className="cd-section-icon">📊</span>
                Performance Metrics
              </h3>
              <div className="cd-metrics-grid">
                <div className="cd-metric-box total">
                  <div className="cd-metric-icon">📍</div>
                  <div className="cd-metric-value">{totalSites}</div>
                  <div className="cd-metric-label">Total Sites</div>
                </div>
                <div className="cd-metric-box nokia">
                  <div className="cd-metric-icon">📡</div>
                  <div className="cd-metric-value">{submittedToNokia}</div>
                  <div className="cd-metric-label">Submitted to Nokia</div>
                  <div className="cd-metric-sub">Past Subcon Stage</div>
                </div>
                <div className="cd-metric-box zain">
                  <div className="cd-metric-icon">🏢</div>
                  <div className="cd-metric-value">{submittedToZain}</div>
                  <div className="cd-metric-label">Submitted to Zain</div>
                  <div className="cd-metric-sub">Version Submitted</div>
                </div>
                <div className="cd-metric-box approved">
                  <div className="cd-metric-icon">✅</div>
                  <div className="cd-metric-value">{approvedCount}</div>
                  <div className="cd-metric-label">Approved</div>
                  <div className="cd-metric-sub">Final Approval</div>
                </div>
              </div>
            </div>

            {/* Submission & Approval Rates */}
            <div className="cd-section">
              <h3 className="cd-section-title">
                <span className="cd-section-icon">📈</span>
                Submission & Approval Rates
              </h3>
              <div className="cd-rates-container">
                <div className="cd-rate-item">
                  <div className="cd-rate-header">
                    <span className="cd-rate-label">Nokia Submission Rate</span>
                    <span className="cd-rate-value">{nokiaRate}%</span>
                  </div>
                  <div className="cd-progress-bar">
                    <div
                      className="cd-progress-fill nokia"
                      style={{ width: `${nokiaRate}%` }}
                    ></div>
                  </div>
                  <div className="cd-rate-detail">{submittedToNokia} of {totalSites} sites</div>
                </div>

                <div className="cd-rate-item">
                  <div className="cd-rate-header">
                    <span className="cd-rate-label">Zain Submission Rate</span>
                    <span className="cd-rate-value">{submissionRate}%</span>
                  </div>
                  <div className="cd-progress-bar">
                    <div
                      className="cd-progress-fill zain"
                      style={{ width: `${submissionRate}%` }}
                    ></div>
                  </div>
                  <div className="cd-rate-detail">{submittedToZain} of {totalSites} sites</div>
                </div>

                <div className="cd-rate-item">
                  <div className="cd-rate-header">
                    <span className="cd-rate-label">Approval Rate</span>
                    <span className="cd-rate-value">{approvalRate}%</span>
                  </div>
                  <div className="cd-progress-bar">
                    <div
                      className="cd-progress-fill approved"
                      style={{ width: `${approvalRate}%` }}
                    ></div>
                  </div>
                  <div className="cd-rate-detail">{approvedCount} of {totalSites} sites</div>
                </div>
              </div>
            </div>

            {/* By Category (Part Of) */}
            <div className="cd-section">
              <h3 className="cd-section-title">
                <span className="cd-section-icon">📦</span>
                By Category (Part Of)
              </h3>
              <div className="cd-category-grid">
                {partOfData.length > 0 ? (
                  partOfData.map((cat) => {
                    const catTotal = cat.total || 0
                    const catApproved = cat.approved || 0
                    const catRate = catTotal > 0 ? ((catApproved / catTotal) * 100).toFixed(0) : 0
                    return (
                      <div key={cat.category} className="cd-category-card">
                        <div className="cd-category-header">
                          <span className="cd-category-name">{cat.category}</span>
                          <span className="cd-category-badge">{catTotal}</span>
                        </div>
                        <div className="cd-category-stats">
                          <div className="cd-category-stat">
                            <span className="cd-cat-value approved">{catApproved}</span>
                            <span className="cd-cat-label">Approved</span>
                          </div>
                          <div className="cd-category-stat">
                            <span className="cd-cat-value pending">{catTotal - catApproved}</span>
                            <span className="cd-cat-label">Pending</span>
                          </div>
                        </div>
                        <div className="cd-category-progress">
                          <div
                            className="cd-cat-progress-fill"
                            style={{ width: `${catRate}%` }}
                          ></div>
                        </div>
                        <div className="cd-category-rate">{catRate}% Approved</div>
                      </div>
                    )
                  })
                ) : (
                  <div className="cd-no-data">No category data available</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}

export default ContractorDashboard
