/**
 * Admin Dashboard V2.0
 * REFACTORED: Modular architecture with extracted hooks and utilities
 * Auto-switching between Online (Supabase) and Offline (SQLite)
 */

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useData } from '../../context/DataContext'
import { useFirebaseData } from '../../hooks/useFirebaseData'
import { MainLayout } from '../../components/Layout'
import { Card, StatusBadge } from '../../components/UI'
import DashboardKPIs, { KPISummaryCards, KPIAnalyticsGrid } from './components/KPIs'
import { WorkflowCompact } from './components/Workflow'
import ActivityWidget from './components/ActivityFeed/ActivityWidget'
import SyncToSupabase from './components/SyncToSupabase'

// Extracted modules
import { StatsCard3D, useDashboardData, getStatusColorByType, sortByStatusOrder } from './AdminDashboard/index'

import './AdminDashboard.css'

const AdminDashboard = () => {
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
    statsByPartOf,
    overviewTable
  } = useData()

  const [chartsCollapsed, setChartsCollapsed] = useState(false)
  const [chartDateRange, setChartDateRange] = useState('30d')
  
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

  // Firebase data hook - enabled only when online
  const {
    stats: firebaseStats,
    loading: firebaseLoading,
    connected: firebaseConnected,
    lastUpdate: firebaseLastUpdate
  } = useFirebaseData({ phase: activePhase, enabled: isOnline })

  // Auto-switch: Use Firebase/Supabase when online and connected, SQLite when offline
  const useCloudData = isOnline && firebaseConnected
  const stats = useCloudData ? firebaseStats : localStats
  const loading = isOnline ? firebaseLoading : localLoading

  useEffect(() => {
    fetchData()
    fetchStatsByPartOf()
    fetchOverviewTable()
  }, [activePhase])

  // Dashboard data transformations hook
  const {
    totalSites,
    approvedCount,
    approvalRate,
    groupedStatuses
  } = useDashboardData(stats, chartDateRange)

  const handleChartDateRangeChange = (range) => {
    setChartDateRange(range)
  }

  const getStatusColor = (status) => {
    return getStatusColorByType(status)
  }

  return (
    <MainLayout>
      <div className="dashboard">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">{t('dashboard.title')}</h1>
            <p className="dashboard-subtitle">Admin Overview - Zain Jordan TSSR</p>
          </div>

          <div className="dashboard-actions" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            {/* Phase Selector */}
            <div className="phase-selector" style={{ margin: 0 }}>
              <select
                value={activePhase}
                onChange={(e) => setActivePhase(e.target.value)}
                style={{ background: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '6px 12px', borderRadius: '8px' }}
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

        <div className="dashboard-content"></div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>{t('common.loading')}</p>
          </div>
        ) : (
          <>
            {/* 3D Animated Stats Cards */}
            <div className="stats-cards-grid">
              <StatsCard3D
                icon="📍"
                title="Total Scope"
                total={stats.overviewStats?.total || totalSites}
                className="total-scope"
                breakdown={{
                  thinLayer: stats.overviewStats?.total_thin_layer || 0,
                  fullSwap: stats.overviewStats?.total_full_swap || 0,
                  swapExisting: stats.overviewStats?.total_swap_existing || 0,
                }}
              />
              <StatsCard3D
                icon="📋"
                title="Survey Done"
                total={stats.overviewStats?.survey_done || 0}
                className="survey-done"
                breakdown={{
                  thinLayer: stats.overviewStats?.survey_thin_layer || 0,
                  fullSwap: stats.overviewStats?.survey_full_swap || 0,
                  swapExisting: stats.overviewStats?.survey_swap_existing || 0,
                }}
              />
              <StatsCard3D
                icon="✅"
                title="TSSR Ready"
                total={stats.overviewStats?.tssr_ready_count || 0}
                className="tssr-ready"
                breakdown={{
                  thinLayer: stats.overviewStats?.ready_thin_layer || 0,
                  fullSwap: stats.overviewStats?.ready_full_swap || 0,
                  swapExisting: stats.overviewStats?.ready_swap_existing || 0,
                }}
              />
              <StatsCard3D
                icon="📤"
                title="TSSR Submitted"
                total={stats.overviewStats?.tssr_submitted || 0}
                className="tssr-submitted"
                breakdown={{
                  thinLayer: stats.overviewStats?.submitted_thin_layer || 0,
                  fullSwap: stats.overviewStats?.submitted_full_swap || 0,
                  swapExisting: stats.overviewStats?.submitted_swap_existing || 0,
                }}
              />
              <StatsCard3D
                icon="🏆"
                title="Approved"
                total={stats.overviewStats?.approved || approvedCount}
                className="approved"
                breakdown={{
                  thinLayer: stats.overviewStats?.approved_thin_layer || 0,
                  fullSwap: stats.overviewStats?.approved_full_swap || 0,
                  swapExisting: stats.overviewStats?.approved_swap_existing || 0,
                }}
              />
              <StatsCard3D
                icon="📡"
                title="RFI"
                total={stats.overviewStats?.rfi || 0}
                className="rfi"
                breakdown={{
                  thinLayer: stats.overviewStats?.rfi_thin_layer || 0,
                  fullSwap: stats.overviewStats?.rfi_full_swap || 0,
                  swapExisting: stats.overviewStats?.rfi_swap_existing || 0,
                }}
              />
            </div>

            {/* Three Tables Grid - Part Of + Status + Contractor */}
            <div className="dashboard-tables-grid">
              {/* Overview Pivot Table */}
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
                            <td className="status-cell">
                              <StatusBadge status={row.status} />
                            </td>
                            <td className="data-cell">{row.thin_layer || 0}</td>
                            <td className="data-cell">{row.full_swap || 0}</td>
                            <td className="data-cell">{row.swap_existing || 0}</td>
                            <td className="data-cell total">{row.total || 0}</td>
                          </tr>
                        ))}
                        <tr className="totals-row">
                          <td className="status-cell"><strong>Total</strong></td>
                          <td className="data-cell">
                            <strong>{overviewTable.reduce((sum, r) => sum + (r.thin_layer || 0), 0)}</strong>
                          </td>
                          <td className="data-cell">
                            <strong>{overviewTable.reduce((sum, r) => sum + (r.full_swap || 0), 0)}</strong>
                          </td>
                          <td className="data-cell">
                            <strong>{overviewTable.reduce((sum, r) => sum + (r.swap_existing || 0), 0)}</strong>
                          </td>
                          <td className="data-cell total">
                            <strong>{overviewTable.reduce((sum, r) => sum + (r.total || 0), 0)}</strong>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {/* Status Breakdown */}
              <Card title="Status" className="status-card">
                <div className="status-list">
                  {groupedStatuses.map((statusGroup, index) => (
                    <div key={index} className="status-item">
                      <div className="status-info">
                        <span
                          className="status-dot"
                          style={{ background: getStatusColor(statusGroup.status) }}
                        ></span>
                        <span className="status-name">{statusGroup.status}</span>
                      </div>
                      <div className="status-bar">
                        <div
                          className="status-bar-fill"
                          style={{
                            width: `${(statusGroup.count / totalSites) * 100}%`,
                            background: getStatusColor(statusGroup.status),
                          }}
                        ></div>
                      </div>
                      <span className="status-count">{statusGroup.count}</span>
                      <span className="status-percent">
                        {((statusGroup.count / totalSites) * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Contractor */}
              <Card title="Contractor" className="contractors-card">
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

            {/* Zain Department Section - Modern Design */}
            {stats.departmentStats && (
              <Card title={t('dashboard.byDepartment')} className="department-section">
                <div className="department-cards">
                  {[
                    { key: 'ti', name: 'TI', icon: '🔧', gradient: 'ti' },
                    { key: 'rf_plan', name: 'RF Planning', icon: '📡', gradient: 'rf-plan' },
                    { key: 'rf_opt', name: 'RF Optimization', icon: '📶', gradient: 'rf-opt' },
                    { key: 'civil', name: 'Civil', icon: '🏗️', gradient: 'civil' },
                    { key: 'mw', name: 'MW', icon: '📻', gradient: 'mw' },
                  ].map((dept) => {
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
                            <path
                              className="circle-bg"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                              className="circle-fill"
                              strokeDasharray={`${approvalPct}, 100`}
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <text x="18" y="20.35" className="progress-text">{approvalPct}%</text>
                          </svg>
                        </div>

                        <div className="dept-stats-row">
                          <div className="dept-stat-item approved">
                            <span className="stat-num">{approved}</span>
                            <span className="stat-lbl">Approved</span>
                          </div>
                          <div className="dept-stat-item rejected">
                            <span className="stat-num">{rejected}</span>
                            <span className="stat-lbl">Rejected</span>
                          </div>
                          <div className="dept-stat-item pending">
                            <span className="stat-num">{pending}</span>
                            <span className="stat-lbl">Pending</span>
                          </div>
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
                  <div
                    className="approval-bar-fill"
                    style={{ width: `${approvalRate}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Process Workflow */}
            <div className="section-divider">
              <h3 className="section-title">Workflow Status</h3>
              <WorkflowCompact />
            </div>

            {/* Detailed Analytics & Activity Feed */}
            <div className="section-divider">
              <h3 className="section-title">Performance Analytics</h3>
              <div className="analytics-activity-grid" style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '20px' }}>
                <KPIAnalyticsGrid />
                <ActivityWidget />
              </div>
            </div>

            {/* Cloud Sync Section */}
            <div className="section-divider">
              <h3 className="section-title">Cloud Sync</h3>
              <SyncToSupabase />
            </div>
          </>
        )}
      </div>
    </MainLayout>
  )
}

export default AdminDashboard
