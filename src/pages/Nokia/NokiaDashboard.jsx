/**
 * Nokia Dashboard V2.0
 * REFACTORED: Reuses shared components from AdminDashboard
 * Original: 670 lines → Refactored: ~300 lines
 */

import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useData } from '../../context/DataContext'
import { useFirebaseData } from '../../hooks/useFirebaseData'
import { MainLayout } from '../../components/Layout'
import { Card, StatusBadge } from '../../components/UI'

// Shared components from AdminDashboard
import {
  StatsCard3D,
  getStatusColorByType,
  sortByStatusOrder,
  mapContractorStatus,
  STATUS_ORDER
} from '../Admin/AdminDashboard/index'

// Nokia-specific utilities
import { transformFirebaseSitesToStats, DEPARTMENTS } from './NokiaDashboard/index'

import './NokiaDashboard.css'

const NokiaDashboard = () => {
  const { t } = useTranslation()
  const {
    stats: localStats,
    phases,
    activePhase,
    setActivePhase,
    loading: localLoading,
    fetchData,
    fetchStatsByPartOf,
    fetchOverviewTable,
    overviewTable
  } = useData()

  const [useFirebase, setUseFirebase] = useState(true)

  // Firebase data hook
  const {
    sites: firebaseSites,
    stats: firebaseStats,
    loading: firebaseLoading,
    connected: firebaseConnected,
    lastUpdate: firebaseLastUpdate
  } = useFirebaseData({ phase: activePhase, enabled: useFirebase })

  useEffect(() => {
    if (!useFirebase) {
      fetchData()
      fetchStatsByPartOf()
      fetchOverviewTable()
    }
  }, [activePhase, useFirebase])

  // Use Firebase or local data
  const loading = useFirebase ? firebaseLoading : localLoading
  const stats = useFirebase && firebaseConnected
    ? transformFirebaseSitesToStats(firebaseSites, firebaseStats, localStats)
    : localStats

  // Calculate totals
  const totalSites = stats.statusBreakdown?.reduce((sum, s) => sum + s.count, 0) || 0
  const approvedCount = stats.statusBreakdown?.find(s =>
    s.tssr_overall_status?.toLowerCase() === 'approved'
  )?.count || 0
  const approvalRate = totalSites > 0 ? ((approvedCount / totalSites) * 100).toFixed(1) : 0

  // Group status breakdown by mapped status
  const groupedStatuses = useMemo(() => {
    if (!stats.statusBreakdown) return []

    const groups = {}
    stats.statusBreakdown.forEach(item => {
      const mapped = mapContractorStatus(item.tssr_overall_status)
      if (!groups[mapped]) {
        groups[mapped] = { status: mapped, count: 0, items: [] }
      }
      groups[mapped].count += item.count
      groups[mapped].items.push(item)
    })

    const getStatusOrderIndex = (status) => {
      if (!status) return 999
      const s = status.toLowerCase()
      const directIndex = STATUS_ORDER.findIndex(order => order.toLowerCase() === s)
      if (directIndex !== -1) return directIndex
      for (let i = 0; i < STATUS_ORDER.length; i++) {
        const order = STATUS_ORDER[i].toLowerCase()
        if (s.includes(order) || order.includes(s)) return i
      }
      return 999
    }

    return Object.values(groups).sort((a, b) => {
      return getStatusOrderIndex(a.status) - getStatusOrderIndex(b.status)
    })
  }, [stats.statusBreakdown])

  return (
    <MainLayout>
      <div className="dashboard">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">{t('dashboard.title')}</h1>
            <p className="dashboard-subtitle">
              Nokia Engineer Overview - Zain Jordan TSSR
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
                  position: 'absolute', cursor: 'pointer',
                  top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: useFirebase ? '#8FD9D9' : '#64748b',
                  borderRadius: '22px', transition: '0.3s'
                }}>
                  <span style={{
                    position: 'absolute', height: '18px', width: '18px',
                    left: useFirebase ? '24px' : '2px', bottom: '2px',
                    backgroundColor: 'white', borderRadius: '50%', transition: '0.3s'
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

            <div className="phase-selector">
              <label>Phase:</label>
              <select value={activePhase} onChange={(e) => setActivePhase(e.target.value)}>
                <option value="ALL">All Phases</option>
                {phases.map((phase, index) => (
                  <option key={`${phase.phase_name}-${index}`} value={phase.phase_name}>
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
            {/* Stats Cards */}
            <div className="stats-cards-grid">
              <StatsCard3D icon="📍" title="Total Scope" total={stats.overviewStats?.total || totalSites} className="total-scope"
                breakdown={{ thinLayer: stats.overviewStats?.total_thin_layer || 0, fullSwap: stats.overviewStats?.total_full_swap || 0, swapExisting: stats.overviewStats?.total_swap_existing || 0 }} />
              <StatsCard3D icon="📋" title="Survey Done" total={stats.overviewStats?.survey_done || 0} className="survey-done"
                breakdown={{ thinLayer: stats.overviewStats?.survey_thin_layer || 0, fullSwap: stats.overviewStats?.survey_full_swap || 0, swapExisting: stats.overviewStats?.survey_swap_existing || 0 }} />
              <StatsCard3D icon="✅" title="TSSR Ready" total={stats.overviewStats?.tssr_ready_count || 0} className="tssr-ready"
                breakdown={{ thinLayer: stats.overviewStats?.ready_thin_layer || 0, fullSwap: stats.overviewStats?.ready_full_swap || 0, swapExisting: stats.overviewStats?.ready_swap_existing || 0 }} />
              <StatsCard3D icon="📤" title="TSSR Submitted" total={stats.overviewStats?.tssr_submitted || 0} className="tssr-submitted"
                breakdown={{ thinLayer: stats.overviewStats?.submitted_thin_layer || 0, fullSwap: stats.overviewStats?.submitted_full_swap || 0, swapExisting: stats.overviewStats?.submitted_swap_existing || 0 }} />
              <StatsCard3D icon="🏆" title="Approved" total={stats.overviewStats?.approved || approvedCount} className="approved"
                breakdown={{ thinLayer: stats.overviewStats?.approved_thin_layer || 0, fullSwap: stats.overviewStats?.approved_full_swap || 0, swapExisting: stats.overviewStats?.approved_swap_existing || 0 }} />
              <StatsCard3D icon="📡" title="RFI" total={stats.overviewStats?.rfi || 0} className="rfi"
                breakdown={{ thinLayer: stats.overviewStats?.rfi_thin_layer || 0, fullSwap: stats.overviewStats?.rfi_full_swap || 0, swapExisting: stats.overviewStats?.rfi_swap_existing || 0 }} />
            </div>

            {/* Overview Table */}
            {overviewTable && overviewTable.length > 0 && (
              <Card title="Part Of" className="overview-pivot-card">
                <div className="overview-table-container">
                  <table className="overview-pivot-table">
                    <thead>
                      <tr>
                        <th className="status-col">Status</th>
                        <th className="partof-col">ThinLayer</th>
                        <th className="partof-col">Full Swap</th>
                        <th className="partof-col">Swap Exist</th>
                        <th className="total-col">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortByStatusOrder(overviewTable).map((row, index) => (
                        <tr key={index} className={`status-row ${row.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                          <td className="status-cell"><StatusBadge status={row.status} /></td>
                          <td className="data-cell">{row.thin_layer || 0}</td>
                          <td className="data-cell">{row.full_swap || 0}</td>
                          <td className="data-cell">{row.swap_existing || 0}</td>
                          <td className="data-cell total">{row.total || 0}</td>
                        </tr>
                      ))}
                      <tr className="totals-row">
                        <td className="status-cell"><strong>Total</strong></td>
                        <td className="data-cell"><strong>{overviewTable.reduce((sum, r) => sum + (r.thin_layer || 0), 0)}</strong></td>
                        <td className="data-cell"><strong>{overviewTable.reduce((sum, r) => sum + (r.full_swap || 0), 0)}</strong></td>
                        <td className="data-cell"><strong>{overviewTable.reduce((sum, r) => sum + (r.swap_existing || 0), 0)}</strong></td>
                        <td className="data-cell total"><strong>{overviewTable.reduce((sum, r) => sum + (r.total || 0), 0)}</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* Status & Contractors Grid */}
            <div className="dashboard-grid">
              <Card title={t('dashboard.overview')} className="status-card">
                <div className="status-list">
                  {groupedStatuses.map((statusGroup, index) => (
                    <div key={index} className="status-item">
                      <div className="status-info">
                        <span className="status-dot" style={{ background: getStatusColorByType(statusGroup.status) }}></span>
                        <span className="status-name">{statusGroup.status}</span>
                      </div>
                      <div className="status-bar">
                        <div className="status-bar-fill" style={{ width: `${(statusGroup.count / totalSites) * 100}%`, background: getStatusColorByType(statusGroup.status) }}></div>
                      </div>
                      <span className="status-count">{statusGroup.count}</span>
                      <span className="status-percent">{((statusGroup.count / totalSites) * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title={t('dashboard.byContractor')} className="contractors-card">
                <div className="contractors-list">
                  {stats.contractorsSummary?.slice(0, 10).map((contractor, index) => (
                    <div key={index} className="contractor-item">
                      <span className="contractor-name">{contractor.contractor || 'Unknown'}</span>
                      <div className="contractor-stats">
                        <span className="approved" title="Approved">{contractor.approved}</span>
                        <span className="pending" title="Pending">{contractor.pending}</span>
                        <span className="rejected" title="Rejected">{contractor.rejected || 0}</span>
                        <span className="total" title="Total">{contractor.total}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Department Section */}
            {stats.departmentStats && (
              <Card title={t('dashboard.byDepartment')} className="department-section">
                <div className="department-cards">
                  {DEPARTMENTS.map((dept) => {
                    const approved = stats.departmentStats[`${dept.key}_approved`] || 0
                    const rejected = stats.departmentStats[`${dept.key}_rejected`] || 0
                    const pending = stats.departmentStats[`${dept.key}_pending`] || 0
                    const total = approved + rejected + pending
                    const approvalPct = total > 0 ? ((approved / total) * 100).toFixed(0) : 0

                    return (
                      <div key={dept.key} className={`dept-card ${dept.gradient}`}>
                        <div className="dept-card-header">
                          <span className="dept-icon">{dept.icon}</span>
                          <h4 className="dept-title">{dept.name}</h4>
                        </div>
                        <div className="dept-progress-ring">
                          <svg viewBox="0 0 36 36" className="circular-progress">
                            <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            <path className="circle-fill" strokeDasharray={`${approvalPct}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            <text x="18" y="20.35" className="progress-text">{approvalPct}%</text>
                          </svg>
                        </div>
                        <div className="dept-stats-row">
                          <div className="dept-stat-item approved"><span className="stat-num">{approved}</span><span className="stat-lbl">Approved</span></div>
                          <div className="dept-stat-item rejected"><span className="stat-num">{rejected}</span><span className="stat-lbl">Rejected</span></div>
                          <div className="dept-stat-item pending"><span className="stat-num">{pending}</span><span className="stat-lbl">Pending</span></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}

            {/* Approval Rate Banner */}
            <div className="approval-banner">
              <div className="approval-content">
                <span className="approval-icon">📊</span>
                <div className="approval-info">
                  <span className="approval-label">Overall Approval Rate</span>
                  <span className="approval-value">{approvalRate}%</span>
                </div>
                <div className="approval-bar">
                  <div className="approval-bar-fill" style={{ width: `${approvalRate}%` }}></div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  )
}

export default NokiaDashboard
