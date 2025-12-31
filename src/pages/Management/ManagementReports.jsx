/**
 * Management Reports Page V2.0
 * REFACTORED: Extracted config, hooks, and utilities
 * Original: 570 lines → Refactored: ~250 lines
 */

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts'
import MainLayout from '../../components/Layout/MainLayout'
import { Card } from '../../components/UI'
import { useData } from '../../context/DataContext'
import { useLanguage } from '../../context/LanguageContext'
import { useFirebaseData } from '../../hooks/useFirebaseData'

// Extracted modules
import {
  CHART_COLORS, STATUS_COLORS, REPORT_TEMPLATES,
  useReportsData, StatCard, exportCurrentView, quickExportTemplate
} from './ManagementReports/index'

import '../Admin/Reports.css'

const ManagementReports = () => {
  const { t } = useTranslation()
  const { direction } = useLanguage()
  const { sites: localSites, activePhase, setActivePhase, phases } = useData()

  // Firebase data
  const [useFirebase, setUseFirebase] = useState(true)
  const { sites: firebaseSites, loading: firebaseLoading, connected: firebaseConnected } = useFirebaseData({ phase: activePhase, enabled: useFirebase })

  // State
  const [activeTab, setActiveTab] = useState('overview')
  const [statusFilter, setStatusFilter] = useState('all')
  const [governorateFilter, setGovernorateFilter] = useState('all')
  const [exporting, setExporting] = useState(false)

  // Map Firebase sites to local format
  const sites = useMemo(() => {
    if (useFirebase && firebaseConnected) {
      return firebaseSites.map(s => ({
        site_id: s.siteId, final_site_name: s.finalSiteName, governorate: s.governorate,
        phase_name: s.phaseName, priority: s.priority, tssr_subcon: s.tssrSubcon,
        tssr_overall_status: s.tssrOverallStatus, ti_status: s.tiStatus,
        rf_plan_status: s.rfPlanStatus, rf_opt_status: s.rfOptimStatus,
        civil_status: s.civilStatus, mw_status: s.mwStatus,
        part_of: s.partOf, version: s.version, ...s
      }))
    }
    return localSites
  }, [useFirebase, firebaseConnected, firebaseSites, localSites])

  // Calculate statistics
  const stats = useReportsData(sites)

  // Filter sites
  const filteredSites = useMemo(() => {
    let result = [...sites]
    if (statusFilter !== 'all') result = result.filter(s => s.tssr_overall_status === statusFilter)
    if (governorateFilter !== 'all') result = result.filter(s => s.governorate === governorateFilter)
    return result
  }, [sites, statusFilter, governorateFilter])

  const loading = useFirebase ? firebaseLoading : false

  return (
    <MainLayout>
      <div className="reports-page" dir={direction}>
        {/* Header */}
        <div className="reports-header">
          <div className="reports-header-left">
            <h1 className="reports-title">Reports & Analytics</h1>
            <p className="reports-subtitle">
              {sites.length} sites - Management View
              {useFirebase && firebaseConnected && <span className="firebase-badge">Firebase Live</span>}
            </p>
          </div>
          <div className="reports-header-right">
            <div className="firebase-toggle-report">
              <label className="toggle-switch">
                <input type="checkbox" checked={useFirebase} onChange={(e) => setUseFirebase(e.target.checked)} />
                <span className="toggle-slider"></span>
              </label>
              <span className={`toggle-label ${useFirebase ? 'active' : ''}`}>{useFirebase ? 'Firebase' : 'SQLite'}</span>
            </div>
            <select className="phase-select" value={activePhase} onChange={(e) => setActivePhase(e.target.value)}>
              <option value="ALL">All Phases</option>
              {phases.map(p => <option key={p.phase_name} value={p.phase_name}>{p.phase_name}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading-state"><div className="spinner"></div><p>Loading data...</p></div>
        ) : (
          <>
            {/* Tab Navigation */}
            <div className="reports-tabs">
              <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
              <button className={`tab-btn ${activeTab === 'templates' ? 'active' : ''}`} onClick={() => setActiveTab('templates')}>Quick Reports</button>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="overview-content">
                {/* Quick Stats */}
                <div className="stats-grid">
                  <StatCard title="Total Sites" value={stats.total} icon="📍" color={CHART_COLORS.default} subtitle={`Phase: ${activePhase}`} />
                  <StatCard title="Approved" value={stats.approved} icon="✅" color={CHART_COLORS.approved} subtitle={`${stats.approvalRate}% approval rate`} />
                  <StatCard title="Under Review" value={stats.underReview} icon="⏳" color={CHART_COLORS.pending} />
                  <StatCard title="Has Rejection" value={stats.rejected} icon="❌" color={CHART_COLORS.rejected} />
                  <StatCard title="Not Surveyed" value={stats.notSurveyed} icon="📋" color={CHART_COLORS.notSurveyed} />
                </div>

                {/* Charts */}
                <div className="charts-grid">
                  <Card className="chart-card">
                    <h3 className="chart-title">Status Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={stats.statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value" label={({ value }) => `${value}`}>
                          {stats.statusData.map((entry, index) => <Cell key={index} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />)}
                        </Pie>
                        <Tooltip /><Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Card>

                  <Card className="chart-card">
                    <h3 className="chart-title">Sites by Governorate (Top 10)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={stats.governorateData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis type="number" stroke="#9ca3af" />
                        <YAxis dataKey="name" type="category" width={100} stroke="#9ca3af" fontSize={12} />
                        <Tooltip contentStyle={{ background: '#1f2937', border: 'none', borderRadius: '8px' }} />
                        <Bar dataKey="value" fill="#8FD9D9" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>

                  <Card className="chart-card">
                    <h3 className="chart-title">Sites by Contractor (Top 10)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={stats.contractorData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis type="number" stroke="#9ca3af" />
                        <YAxis dataKey="name" type="category" width={120} stroke="#9ca3af" fontSize={11} />
                        <Tooltip contentStyle={{ background: '#1f2937', border: 'none', borderRadius: '8px' }} />
                        <Bar dataKey="value" fill="#FF8566" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>

                  <Card className="chart-card">
                    <h3 className="chart-title">Department Status Comparison</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={stats.departmentData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="name" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip contentStyle={{ background: '#1f2937', border: 'none', borderRadius: '8px' }} />
                        <Legend />
                        <Bar dataKey="approved" stackId="a" fill="#8FD9D9" name="Approved" />
                        <Bar dataKey="pending" stackId="a" fill="#f59e0b" name="Pending" />
                        <Bar dataKey="rejected" stackId="a" fill="#ef4444" name="Rejected" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                </div>

                {/* Quick Filters & Export */}
                <Card className="quick-export-card">
                  <h3 className="card-title">Quick Filters & Export</h3>
                  <div className="quick-filters">
                    <div className="filter-group">
                      <label>Status:</label>
                      <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="all">All Statuses</option>
                        {stats.uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="filter-group">
                      <label>Governorate:</label>
                      <select value={governorateFilter} onChange={(e) => setGovernorateFilter(e.target.value)}>
                        <option value="all">All Governorates</option>
                        {stats.uniqueGovernorates.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div className="filter-actions">
                      <button className="btn-reset" onClick={() => { setStatusFilter('all'); setGovernorateFilter('all'); }}>Reset</button>
                      <button className="btn-export" onClick={() => exportCurrentView(filteredSites, setExporting)} disabled={exporting}>
                        {exporting ? 'Exporting...' : 'Export to Excel'}
                      </button>
                    </div>
                  </div>
                  <p className="filter-result">Showing {filteredSites.length} of {sites.length} sites</p>
                </Card>
              </div>
            )}

            {/* Templates Tab */}
            {activeTab === 'templates' && (
              <div className="templates-content">
                <div className="templates-grid">
                  {REPORT_TEMPLATES.map(template => (
                    <Card key={template.id} className="template-card">
                      <div className="template-icon">{template.icon}</div>
                      <h3 className="template-name">{template.name}</h3>
                      <p className="template-desc">{template.description}</p>
                      <div className="template-columns">Columns: {template.columns.slice(0, 3).join(', ')}{template.columns.length > 3 ? '...' : ''}</div>
                      <div className="template-actions">
                        <button className="btn-quick-export" onClick={() => quickExportTemplate(template, sites, setExporting)} disabled={exporting}>
                          {exporting ? 'Exporting...' : 'Export Report'}
                        </button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  )
}

export default ManagementReports
