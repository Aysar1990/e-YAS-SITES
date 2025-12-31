/**
 * Admin Reports Page - Simplified Main Controller
 */

import { useState, useMemo } from 'react'
import MainLayout from '../../../components/Layout/MainLayout'
import { useData } from '../../../context/DataContext'
import { useLanguage } from '../../../context/LanguageContext'
import { useFirebaseData } from '../../../hooks/useFirebaseData'
import { useReportsStats } from './hooks/useReportsStats'
import { exportToExcel, getRejectedSites } from './utils/exportUtils'
import { OverviewTab, BuilderTab, TemplatesTab, PerformanceTab, AgingTab } from './components'
import Predictions from '../components/Predictions'
import { COLUMN_MAP } from './config'
import '../Reports.css'
const Reports = () => {
  const { direction } = useLanguage()
  const { sites: localSites, activePhase, setActivePhase, phases } = useData()
  const [useFirebase, setUseFirebase] = useState(true)
  const { sites: firebaseSites, loading, connected } = useFirebaseData({ phase: activePhase, enabled: useFirebase })

  const [activeTab, setActiveTab] = useState('overview')
  const [selectedColumns, setSelectedColumns] = useState(['Site ID', 'Final Site Name', 'Governorate', 'TSSR Overall Status'])
  const [filters, setFilters] = useState([])
  const [sortField, setSortField] = useState('site_id')
  const [sortOrder, setSortOrder] = useState('asc')
  const [previewData, setPreviewData] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [governorateFilter, setGovernorateFilter] = useState('all')

  const sites = useMemo(() => {
    if (useFirebase && connected) {
      return firebaseSites.map(s => ({
        site_id: s.siteId,
        final_site_name: s.finalSiteName,
        governorate: s.governorate,
        phase_name: s.phaseName,
        tssr_overall_status: s.tssrOverallStatus,
        // Performance Report Mappings
        tssr_subcon: s.tssrSubcon,
        tssr_status_date: s.tssrStatusDate || s.updatedAt,
        ti_status: s.tiStatus,
        rf_plan_status: s.rfPlanStatus,
        rf_opt_status: s.rfOptimStatus,
        civil_status: s.civilStatus,
        mw_status: s.mwStatus,
        ...s
      }))
    }
    return localSites
  }, [useFirebase, connected, firebaseSites, localSites])

  const stats = useReportsStats(sites)

  const filteredSites = useMemo(() => {
    let result = [...sites]
    if (statusFilter !== 'all') result = result.filter(s => s.tssr_overall_status === statusFilter)
    if (governorateFilter !== 'all') result = result.filter(s => s.governorate === governorateFilter)
    filters.forEach(f => {
      if (!f.field || !f.value) return
      result = result.filter(site => {
        const val = String(site[COLUMN_MAP[f.field]] || '').toLowerCase()
        const fVal = String(f.value).toLowerCase()
        if (f.operator === 'equals') return val === fVal
        if (f.operator === 'contains') return val.includes(fVal)
        if (f.operator === 'not_equals') return val !== fVal
        if (f.operator === 'not_contains') return !val.includes(fVal)
        return true
      })
    })
    result.sort((a, b) => {
      const aVal = String(a[COLUMN_MAP[sortField]] || '')
      const bVal = String(b[COLUMN_MAP[sortField]] || '')
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    })
    return result
  }, [sites, statusFilter, governorateFilter, filters, sortField, sortOrder])

  const toggleColumn = (col) => setSelectedColumns(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col])
  const addFilter = () => setFilters(prev => [...prev, { field: '', operator: 'contains', value: '' }])
  const updateFilter = (i, k, v) => setFilters(prev => prev.map((f, idx) => idx === i ? { ...f, [k]: v } : f))
  const removeFilter = (i) => setFilters(prev => prev.filter((_, idx) => idx !== i))
  const buildPreview = () => setPreviewData(filteredSites.slice(0, 10))

  const exportCurrentView = () => {
    setExporting(true)
    exportToExcel(filteredSites, `TSSR_Report_${new Date().toISOString().split('T')[0]}.xlsx`, selectedColumns)
    setExporting(false)
  }

  const applyTemplate = (tmpl) => {
    setSelectedColumns(tmpl.columns)
    if (tmpl.filter?.field === 'has_rejection') {
      exportToExcel(getRejectedSites(sites), `${tmpl.name.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`, tmpl.columns)
    } else if (tmpl.filter) {
      setFilters([{ field: Object.keys(COLUMN_MAP).find(k => COLUMN_MAP[k] === tmpl.filter.field) || tmpl.filter.field, operator: tmpl.filter.operator, value: tmpl.filter.value }])
    } else {
      setFilters([])
    }
    setActiveTab('builder')
    buildPreview()
  }

  const quickExportTemplate = (tmpl) => {
    setExporting(true)
    let data = sites
    if (tmpl.filter?.field === 'has_rejection') {
      data = getRejectedSites(sites)
    } else if (tmpl.filter) {
      const val = String(tmpl.filter.value).toLowerCase()
      data = sites.filter(s => {
        const sVal = String(s[tmpl.filter.field] || '').toLowerCase()
        return tmpl.filter.operator === 'equals' ? sVal === val : sVal.includes(val)
      })
    }
    exportToExcel(data, `${tmpl.name.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`, tmpl.columns)
    setExporting(false)
  }

  return (
    <MainLayout>
      <div className="reports-page" dir={direction}>
        <div className="reports-header">
          <div className="reports-header-left">
            <h1 className="reports-title">Reports & Analytics</h1>
            <p className="reports-subtitle">{sites.length} sites {useFirebase && connected && <span className="firebase-badge">Firebase Live</span>}</p>
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
            <div className="reports-tabs">
              <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
              <button className={`tab-btn ${activeTab === 'performance' ? 'active' : ''}`} onClick={() => setActiveTab('performance')}>Performance (New)</button>
              <button className={`tab-btn ${activeTab === 'aging' ? 'active' : ''}`} onClick={() => setActiveTab('aging')}>Aging Analysis (New)</button>
              <button className={`tab-btn ${activeTab === 'predictions' ? 'active' : ''}`} onClick={() => setActiveTab('predictions')}>Predictions (Beta)</button>
              <button className={`tab-btn ${activeTab === 'builder' ? 'active' : ''}`} onClick={() => setActiveTab('builder')}>Custom Report Builder</button>
              <button className={`tab-btn ${activeTab === 'templates' ? 'active' : ''}`} onClick={() => setActiveTab('templates')}>Quick Templates</button>
            </div>
            {activeTab === 'overview' && <OverviewTab stats={stats} activePhase={activePhase} filteredSites={filteredSites} sites={sites} statusFilter={statusFilter} setStatusFilter={setStatusFilter} governorateFilter={governorateFilter} setGovernorateFilter={setGovernorateFilter} exportCurrentView={exportCurrentView} exporting={exporting} />}
            {activeTab === 'performance' && <PerformanceTab sites={sites} activePhase={activePhase} />}
            {activeTab === 'aging' && <AgingTab sites={sites} />}
            {activeTab === 'predictions' && <Predictions />}
            {activeTab === 'builder' && <BuilderTab selectedColumns={selectedColumns} toggleColumn={toggleColumn} filters={filters} addFilter={addFilter} updateFilter={updateFilter} removeFilter={removeFilter} sortField={sortField} setSortField={setSortField} sortOrder={sortOrder} setSortOrder={setSortOrder} buildPreview={buildPreview} exportCurrentView={exportCurrentView} exporting={exporting} filteredSites={filteredSites} previewData={previewData} />}
            {activeTab === 'templates' && <TemplatesTab applyTemplate={applyTemplate} quickExportTemplate={quickExportTemplate} exporting={exporting} />}
          </>
        )}
      </div>
    </MainLayout>
  )
}

export default Reports
