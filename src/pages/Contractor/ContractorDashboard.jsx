import { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { MainLayout } from '../../components/Layout'
import './ContractorDashboard.css'

const ContractorDashboard = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { sites, phases, activePhase, setActivePhase, loading: dataLoading } = useData()

  // Get contractor name from user object (supports both formats)
  const contractorName = user?.contractorName || user?.contractor_name

  // Filter sites by contractor name (supports both snake_case and camelCase)
  const contractorSites = useMemo(() => {
    if (!contractorName || !sites || sites.length === 0) return []
    return sites.filter(site => {
      const siteContractor = site.tssr_subcon || site.tssrSubcon
      return siteContractor === contractorName
    })
  }, [sites, contractorName])

  // Calculate stats from contractor sites
  const contractorStats = useMemo(() => {
    if (!contractorSites.length) return null

    const statusCounts = {}
    contractorSites.forEach(site => {
      const status = site.tssr_overall_status || site.tssrOverallStatus || 'Unknown'
      statusCounts[status] = (statusCounts[status] || 0) + 1
    })

    const statusCountsArray = Object.entries(statusCounts).map(([status, count]) => ({ status, count }))

    // Part Of counts
    const partOfCounts = {}
    contractorSites.forEach(site => {
      const partOf = site.part_of || site.partOf || 'Not Specified'
      if (!partOfCounts[partOf]) {
        partOfCounts[partOf] = { category: partOf, total: 0, approved: 0 }
      }
      partOfCounts[partOf].total++
      const siteStatus = site.tssr_overall_status || site.tssrOverallStatus || ''
      if (siteStatus === 'Approved') {
        partOfCounts[partOf].approved++
      }
    })

    return {
      totalSites: contractorSites.length,
      approved: contractorSites.filter(s => (s.tssr_overall_status || s.tssrOverallStatus) === 'Approved').length,
      tssrSubmitted: contractorSites.filter(s => s.version && s.version > 0).length,
      statusCounts: statusCountsArray,
      partOfCounts: Object.values(partOfCounts)
    }
  }, [contractorSites])

  // Use calculated stats
  const activeStats = contractorStats
  const isLoading = dataLoading

  // Workflow stages configuration
  const workflowStages = [
    { key: 'Site not Surveyed', label: 'Not Surveyed', icon: '??', color: '#6b7280' },
    { key: 'Need Access', label: 'Need Access', icon: '??', color: '#f59e0b' },
    { key: 'TSSR Under Subcon validation', label: 'Under Subcon', icon: '??', color: '#8b5cf6' },
    { key: 'TSSR Under Nokia GSD Validation', label: 'Nokia GSD', icon: '??', color: '#FF8566' },
    { key: 'TSSR Under Nokia NPO Validation', label: 'Nokia NPO', icon: '??', color: '#FF8566' },
    { key: 'TSSR Under Nokia ROM Validation', label: 'Nokia ROM', icon: '??', color: '#14b8a6' },
    { key: 'TSSR Under ROM Review', label: 'ROM Review', icon: '??', color: '#8FD9D9' },
    { key: 'TSSR Under Zain validation', label: 'Under Zain', icon: '??', color: '#8FD9D9' },
    { key: 'Approved', label: 'Approved', icon: '?', color: '#6ECECE' }
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
              <span style={{ marginLeft: '10px', color: '#8FD9D9', fontSize: '0.85rem' }}>
                {contractorSites.length} sites
              </span>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
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
                <span className="cd-section-icon">??</span>
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
                        <div className="cd-pipeline-arrow">?</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="cd-section">
              <h3 className="cd-section-title">
                <span className="cd-section-icon">??</span>
                Performance Metrics
              </h3>
              <div className="cd-metrics-grid">
                <div className="cd-metric-box total">
                  <div className="cd-metric-icon">??</div>
                  <div className="cd-metric-value">{totalSites}</div>
                  <div className="cd-metric-label">Total Sites</div>
                </div>
                <div className="cd-metric-box nokia">
                  <div className="cd-metric-icon">??</div>
                  <div className="cd-metric-value">{submittedToNokia}</div>
                  <div className="cd-metric-label">Submitted to Nokia</div>
                  <div className="cd-metric-sub">Past Subcon Stage</div>
                </div>
                <div className="cd-metric-box zain">
                  <div className="cd-metric-icon">??</div>
                  <div className="cd-metric-value">{submittedToZain}</div>
                  <div className="cd-metric-label">Submitted to Zain</div>
                  <div className="cd-metric-sub">Version Submitted</div>
                </div>
                <div className="cd-metric-box approved">
                  <div className="cd-metric-icon">?</div>
                  <div className="cd-metric-value">{approvedCount}</div>
                  <div className="cd-metric-label">Approved</div>
                  <div className="cd-metric-sub">Final Approval</div>
                </div>
              </div>
            </div>

            {/* Submission & Approval Rates */}
            <div className="cd-section">
              <h3 className="cd-section-title">
                <span className="cd-section-icon">??</span>
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
                <span className="cd-section-icon">??</span>
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
