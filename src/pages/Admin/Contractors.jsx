import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useData } from '../../context/DataContext'
import { MainLayout } from '../../components/Layout'
import ApiClient from '../../services/apiClient'
import './Contractors.css'

// Workflow stages from first to last
const WORKFLOW_STAGES = [
  { key: 'Site not Surveyed', label: 'Not Surveyed', color: '#64748b', icon: '??' },
  { key: 'Need Access', label: 'Need Access', color: '#ef4444', icon: '??' },
  { key: 'TSSR Under Subcon validation', label: 'Under Subcon', color: '#f59e0b', icon: '??' },
  { key: 'TSSR Under Nokia GSD Validation', label: 'Nokia GSD', color: '#8b5cf6', icon: '??' },
  { key: 'TSSR Under Nokia NPO Validation', label: 'Nokia NPO', color: '#6366f1', icon: '??' },
  { key: 'TSSR Under Nokia ROM Validation', label: 'Nokia ROM', color: '#FF8566', icon: '??' },
  { key: 'TSSR Under ROM Review', label: 'ROM Review', color: '#FF8566', icon: '???' },
  { key: 'TSSR Under Zain validation', label: 'Under Zain', color: '#06b6d4', icon: '?' },
  { key: 'Approved', label: 'Approved', color: '#8FD9D9', icon: '?' }
]

// Get API based on mode
const getApi = () => {
  const mode = localStorage.getItem('tssr_mode')
  const serverIP = localStorage.getItem('tssr_server_ip')
  
  if (mode === 'client' && serverIP) {
    return new ApiClient(serverIP)
  }
  return window.electron
}

// Animated counter hook
const useCountUp = (end, duration = 1000) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (end === 0) {
      setCount(0)
      return
    }

    let startTime
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      setCount(Math.floor(progress * end))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [end, duration])

  return count
}

// Contractor Card Component
const ContractorCard = ({ contractor, index }) => {
  // Get status count helper
  const getStatusCount = (status) => {
    const found = contractor.statusCounts?.find(s =>
      s.status?.toLowerCase() === status.toLowerCase() ||
      s.status?.toLowerCase().includes(status.toLowerCase().replace('tssr ', ''))
    )
    return found?.count || 0
  }

  // Calculate metrics
  const approved = getStatusCount('Approved')
  const notSurveyed = getStatusCount('Site not Surveyed')
  const needAccess = getStatusCount('Need Access')

  // Submitted to Nokia = everything past Under Subcon
  const submittedToNokia = WORKFLOW_STAGES
    .filter(s => !['Site not Surveyed', 'Need Access', 'TSSR Under Subcon validation'].includes(s.key))
    .reduce((sum, stage) => sum + getStatusCount(stage.key), 0)

  const submissionRate = contractor.totalSites > 0
    ? ((submittedToNokia / contractor.totalSites) * 100).toFixed(1)
    : 0
  const approvalRate = submittedToNokia > 0
    ? ((approved / submittedToNokia) * 100).toFixed(1)
    : 0

  // Animated values
  const animatedTotal = useCountUp(contractor.totalSites)
  const animatedSubmitted = useCountUp(submittedToNokia)
  const animatedApproved = useCountUp(approved)
  const animatedRfi = useCountUp(contractor.rfiCount)

  return (
    <div className="contractor-card" style={{ animationDelay: `${index * 0.1}s` }}>
      {/* Header */}
      <div className="contractor-header">
        <div className="contractor-icon">??</div>
        <div className="contractor-info">
          <div className="contractor-name">{contractor.name}</div>
          <div className="contractor-subtitle">Contractor Performance</div>
        </div>
        <div className="contractor-total-badge">
          <span className="total-number">{animatedTotal}</span>
          <span className="total-label">Sites</span>
        </div>
      </div>

      {/* Workflow Pipeline */}
      <div className="workflow-section">
        <div className="section-header">
          <span className="section-icon">??</span>
          <span className="section-title">Site Workflow Pipeline</span>
        </div>
        <div className="workflow-pipeline">
          {WORKFLOW_STAGES.map((stage, idx) => {
            const count = getStatusCount(stage.key)
            return (
              <div key={stage.key} className="workflow-stage">
                <div
                  className="stage-icon"
                  style={{ backgroundColor: stage.color }}
                  title={stage.key}
                >
                  {stage.icon}
                </div>
                <div className="stage-count" style={{ color: count > 0 ? stage.color : '#475569' }}>
                  {count}
                </div>
                <div className="stage-label">{stage.label}</div>
                {idx < WORKFLOW_STAGES.length - 1 && (
                  <div className="stage-arrow">?</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="metrics-section">
        <div className="section-header">
          <span className="section-icon">??</span>
          <span className="section-title">Performance Metrics</span>
        </div>
        <div className="metrics-grid">
          <div className="metric-box total">
            <div className="metric-value">{animatedTotal}</div>
            <div className="metric-label">Total Sites</div>
          </div>
          <div className="metric-box submitted">
            <div className="metric-value">{animatedSubmitted}</div>
            <div className="metric-label">Submitted to Nokia</div>
          </div>
          <div className="metric-box approved">
            <div className="metric-value">{animatedApproved}</div>
            <div className="metric-label">Approved</div>
          </div>
          <div className="metric-box rfi">
            <div className="metric-value">{animatedRfi}</div>
            <div className="metric-label">RFI</div>
          </div>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="rates-section">
        <div className="section-header">
          <span className="section-icon">??</span>
          <span className="section-title">Submission & Approval Rates</span>
        </div>
        <div className="rate-bar-container">
          <div className="rate-bar">
            <div className="rate-info">
              <span className="rate-name">Submission Rate</span>
              <span className="rate-value">{submissionRate}%</span>
            </div>
            <div className="rate-track">
              <div
                className="rate-fill submission"
                style={{ width: `${submissionRate}%` }}
              />
            </div>
          </div>
          <div className="rate-bar">
            <div className="rate-info">
              <span className="rate-name">Approval Rate</span>
              <span className="rate-value">{approvalRate}%</span>
            </div>
            <div className="rate-track">
              <div
                className="rate-fill approval"
                style={{ width: `${approvalRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Part Of Breakdown */}
      {contractor.partOfCounts && contractor.partOfCounts.length > 0 && (
        <div className="partof-section">
          <div className="section-header">
            <span className="section-icon">??</span>
            <span className="section-title">By Category</span>
          </div>
          <div className="partof-grid">
            {contractor.partOfCounts.map((po, idx) => (
              <div key={idx} className="partof-item">
                <div className="partof-name">{po.category}</div>
                <div className="partof-stats">
                  <span className="partof-total">{po.total}</span>
                  <span className="partof-approved">({po.approved} approved)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alerts Section */}
      {(contractor.rejectionCount > 0 || notSurveyed > 10 || needAccess > 5) && (
        <div className="alerts-section">
          <div className="section-header">
            <span className="section-icon">??</span>
            <span className="section-title">Pending Actions</span>
          </div>
          <div className="alerts-list">
            {contractor.rejectionCount > 0 && (
              <div className="alert-item danger">
                <span className="alert-dot"></span>
                <span>{contractor.rejectionCount} rejections need attention</span>
              </div>
            )}
            {notSurveyed > 10 && (
              <div className="alert-item warning">
                <span className="alert-dot"></span>
                <span>{notSurveyed} sites pending survey</span>
              </div>
            )}
            {needAccess > 5 && (
              <div className="alert-item info">
                <span className="alert-dot"></span>
                <span>{needAccess} sites need access</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const Contractors = () => {
  const { t } = useTranslation()
  const { activePhase, phases, setActivePhase } = useData()
  const [contractors, setContractors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sortBy, setSortBy] = useState('total') // total, approved, name

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        const api = getApi()
        if (api && api.getContractorDetailedStats) {
          const result = await api.getContractorDetailedStats({ phase: activePhase })
          if (result.success) {
            setContractors(result.contractors || [])
          } else {
            setError(result.error)
          }
        } else {
          setError('API not available')
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [activePhase])

  // Sort contractors
  const sortedContractors = [...contractors].sort((a, b) => {
    if (sortBy === 'total') return b.totalSites - a.totalSites
    if (sortBy === 'approved') {
      const aApproved = a.statusCounts?.find(s => s.status === 'Approved')?.count || 0
      const bApproved = b.statusCounts?.find(s => s.status === 'Approved')?.count || 0
      return bApproved - aApproved
    }
    if (sortBy === 'name') return a.name.localeCompare(b.name)
    return 0
  })

  // Calculate totals
  const totalSitesAll = contractors.reduce((sum, c) => sum + (c.totalSites || 0), 0)
  const totalContractors = contractors.length

  return (
    <MainLayout>
      <div className="contractors-page">
        {/* Page Header */}
        <div className="page-header">
          <div className="header-content">
            <h1 className="page-title">Contractor Performance Dashboard</h1>
            <p className="page-subtitle">Track contractor progress from survey to RFI</p>
          </div>
          <div className="header-actions">
            {/* Phase Selector */}
            <div className="filter-group">
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
            {/* Sort Selector */}
            <div className="filter-group">
              <label>Sort by:</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="total">Total Sites</option>
                <option value="approved">Approved</option>
                <option value="name">Name</option>
              </select>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="summary-row">
          <div className="summary-card">
            <div className="summary-icon">??</div>
            <div className="summary-info">
              <div className="summary-value">{totalContractors}</div>
              <div className="summary-label">Contractors</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">??</div>
            <div className="summary-info">
              <div className="summary-value">{totalSitesAll}</div>
              <div className="summary-label">Total Sites</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">??</div>
            <div className="summary-info">
              <div className="summary-value">
                {totalContractors > 0 ? Math.round(totalSitesAll / totalContractors) : 0}
              </div>
              <div className="summary-label">Avg Sites/Contractor</div>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading contractors...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p>Error: {error}</p>
          </div>
        ) : contractors.length === 0 ? (
          <div className="empty-container">
            <p>No contractors found for this phase</p>
          </div>
        ) : (
          <div className="contractors-grid">
            {sortedContractors.map((contractor, index) => (
              <ContractorCard
                key={contractor.name}
                contractor={contractor}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  )
}

export default Contractors
