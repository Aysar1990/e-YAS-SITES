// Management Sites Page - Firebase View-Only (No Edit Permissions)

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import MainLayout from '../../components/Layout/MainLayout'
import { Card } from '../../components/UI'
import { useData } from '../../context/DataContext'
import { useLanguage } from '../../context/LanguageContext'
import { useFirebaseData } from '../../hooks/useFirebaseData'
import '../Admin/Sites.css'

// Status colors mapping
const getStatusColors = (status) => {
  if (!status) return { hex: '#6b7280', rgb: '107, 114, 128' }
  const s = status.toLowerCase()

  if (s.includes('approved')) return { hex: '#8FD9D9', rgb: '143, 217, 217' }
  if (s.includes('rejected')) return { hex: '#ef4444', rgb: '239, 68, 68' }
  if (s.includes('under zain')) return { hex: '#f59e0b', rgb: '245, 158, 11' }
  if (s.includes('under nokia npo')) return { hex: '#8b5cf6', rgb: '139, 92, 246' }
  if (s.includes('under nokia rom')) return { hex: '#f97316', rgb: '249, 115, 22' }
  if (s.includes('under nokia gsd')) return { hex: '#06b6d4', rgb: '6, 182, 212' }
  if (s.includes('under subcon')) return { hex: '#FF8566', rgb: '255, 133, 102' }
  if (s.includes('not surveyed')) return { hex: '#6b7280', rgb: '107, 114, 128' }

  return { hex: '#FF8566', rgb: '255, 133, 102' }
}

// Check if any department is rejected
const hasRejection = (site) => {
  const depts = [site.ti_status, site.rf_plan_status, site.rf_opt_status, site.civil_status, site.mw_status]
  return depts.some(d => d && d.toLowerCase().includes('rejected'))
}

// Get department status class
const getDeptClass = (status) => {
  if (!status) return ''
  const s = status.toLowerCase()
  if (s.includes('rejected')) return 'rejected'
  if (s.includes('approved')) return 'approved'
  if (s.includes('released')) return 'released'
  if (s.includes('pending')) return 'pending'
  return ''
}

// Get card status class for smoke effects
const getStatusClass = (status) => {
  if (!status) return 'status-not-surveyed'
  const s = status.toLowerCase()
  if (s.includes('approved')) return 'status-approved'
  if (s.includes('under zain')) return 'status-under-zain'
  if (s.includes('under nokia npo')) return 'status-under-nokia-npo'
  if (s.includes('under nokia gsd')) return 'status-under-nokia-gsd'
  if (s.includes('under subcon')) return 'status-under-subcon'
  if (s.includes('not surveyed')) return 'status-not-surveyed'
  return ''
}

// Priority Card Component (View Only - No Edit Button)
const PriorityCard = ({ site, isFlipped, onFlip }) => {
  const { t } = useTranslation()
  const statusColors = getStatusColors(site.tssr_overall_status)
  const isRejected = hasRejection(site)
  const statusClass = getStatusClass(site.tssr_overall_status)

  const cardStyle = {
    '--status-color': statusColors.hex,
    '--neon-rgb': isRejected ? '239, 68, 68' : statusColors.rgb,
    height: '160px',
    minWidth: '160px',
  }

  return (
    <div
      className={`priority-card ${isFlipped ? 'flipped' : ''} ${isRejected ? 'has-rejection' : ''} ${statusClass}`}
      style={cardStyle}
      onClick={onFlip}
    >
      <div className="priority-card__inner">
        {/* Front Side */}
        <div className="priority-card__front">
          <div className="priority-badge">{site.priority || '—'}</div>
          <div className="site-id-front">{site.site_id}</div>
          <div className="status-indicator" style={{ backgroundColor: statusColors.hex }}>
            {site.tssr_overall_status ? site.tssr_overall_status.replace('TSSR ', '').substring(0, 18) : 'N/A'}
          </div>
          <div className="dept-row">
            <span className={`dept-mini ${getDeptClass(site.ti_status)}`}>TI</span>
            <span className={`dept-mini ${getDeptClass(site.rf_plan_status)}`}>RF</span>
            <span className={`dept-mini ${getDeptClass(site.rf_opt_status)}`}>OP</span>
            <span className={`dept-mini ${getDeptClass(site.civil_status)}`}>CW</span>
            <span className={`dept-mini ${getDeptClass(site.mw_status)}`}>MW</span>
          </div>
        </div>

        {/* Back Side - NO EDIT BUTTON */}
        <div className="priority-card__back">
          <div className="back-header">
            <span className="back-site-id">{site.site_id}</span>
            <span className="back-priority">P{site.priority || '—'}</span>
          </div>

          <div className="back-status" style={{ backgroundColor: statusColors.hex }}>
            {site.tssr_overall_status || 'Unknown'}
          </div>

          <div className="back-info">
            <div className="info-row">
              <span className="info-label">{t('card.name')}:</span>
              <span className="info-value">{site.final_site_name?.substring(0, 20) || '—'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">{t('card.contractor')}:</span>
              <span className="info-value">{site.tssr_subcon || '—'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">{t('card.location')}:</span>
              <span className="info-value">{site.governorate || '—'}</span>
            </div>
          </div>

          {/* Department Status Row */}
          <div className="back-dept-row">
            <span className={`back-dept-item ${getDeptClass(site.mw_status)}`}>MW</span>
            <span className={`back-dept-item ${getDeptClass(site.civil_status)}`}>CW</span>
            <span className={`back-dept-item ${getDeptClass(site.rf_opt_status)}`}>OP</span>
            <span className={`back-dept-item ${getDeptClass(site.rf_plan_status)}`}>RF</span>
            <span className={`back-dept-item ${getDeptClass(site.ti_status)}`}>TI</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const ManagementSites = () => {
  const { t } = useTranslation()
  const { direction } = useLanguage()
  const { sites: localSites, loading: localLoading, activePhase } = useData()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [flippedCards, setFlippedCards] = useState({})
  const [useFirebase, setUseFirebase] = useState(true) // Default to Firebase

  // Firebase data hook
  const {
    sites: firebaseSites,
    loading: firebaseLoading,
    connected: firebaseConnected,
    lastUpdate: firebaseLastUpdate
  } = useFirebaseData({ phase: activePhase, enabled: useFirebase })

  // Use Firebase or local data
  const sites = useFirebase && firebaseConnected ? firebaseSites.map(s => ({
    site_id: s.siteId,
    final_site_name: s.finalSiteName,
    tssr_overall_status: s.tssrOverallStatus,
    tssr_subcon: s.tssrSubcon,
    governorate: s.governorate,
    ti_status: s.tiStatus,
    rf_plan_status: s.rfPlanStatus,
    rf_opt_status: s.rfOptimStatus,
    civil_status: s.civilStatus,
    mw_status: s.mwStatus,
    priority: s.priority,
    phase_name: s.phaseName,
    id: s.id,
    ...s
  })) : localSites
  const loading = useFirebase ? firebaseLoading : localLoading

  const uniqueStatuses = [...new Set(sites.map(s => s.tssr_overall_status).filter(Boolean))]
  const uniquePriorities = [...new Set(sites.map(s => s.priority).filter(p => p !== null && p !== undefined))].sort((a, b) => a - b)

  const filteredSites = sites.filter((site) => {
    const siteId = String(site.site_id || '').toLowerCase()
    const siteName = String(site.final_site_name || '').toLowerCase()
    const governorate = String(site.governorate || '').toLowerCase()
    const search = searchTerm.toLowerCase()

    const matchesSearch =
      siteId.includes(search) ||
      siteName.includes(search) ||
      governorate.includes(search)

    const matchesStatus = statusFilter === 'all' || site.tssr_overall_status === statusFilter
    const matchesPriority = priorityFilter === 'all' || String(site.priority) === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

  const sortedSites = [...filteredSites].sort((a, b) => (a.priority || 999) - (b.priority || 999))

  const handleFlip = (siteId) => {
    setFlippedCards(prev => ({ ...prev, [siteId]: !prev[siteId] }))
  }

  return (
    <MainLayout>
      <div className="sites-page" dir={direction}>
        <div className="page-header">
          <div className="page-header__info">
            <h1 className="page-title">{t('sites.title')}</h1>
            <p className="page-subtitle">
              {t('sites.total', { count: sites.length })}
              {activePhase && activePhase !== 'ALL' && ` - ${activePhase}`}
              {useFirebase && firebaseConnected && (
                <span style={{ marginLeft: '10px', color: '#8FD9D9' }}>☁️ Firebase Live</span>
              )}
            </p>
          </div>

          {/* Firebase Data Toggle */}
          <div className="firebase-toggle">
            <label className="firebase-switch">
              <input
                type="checkbox"
                checked={useFirebase}
                onChange={(e) => setUseFirebase(e.target.checked)}
              />
              <span className="firebase-slider"></span>
            </label>
            <span className="firebase-label">
              {useFirebase ? (
                <>
                  <span className={`firebase-status ${firebaseConnected ? 'connected' : 'disconnected'}`}></span>
                  Firebase {firebaseConnected ? 'Live' : 'Offline'}
                </>
              ) : (
                'SQLite'
              )}
            </span>
            {useFirebase && firebaseLastUpdate && (
              <span className="firebase-last-update">
                {new Date(firebaseLastUpdate).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        <Card className="filters-card">
          <div className="filters">
            <div className="search-box">
              <input
                type="text"
                placeholder={t('sites.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">{t('sites.allStatuses')}</option>
              {uniqueStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">{t('sites.allPriorities')}</option>
              {uniquePriorities.map(p => (
                <option key={p} value={String(p)}>{t('sites.priority')} {p}</option>
              ))}
            </select>
          </div>
        </Card>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>{t('sites.loading')}</p>
          </div>
        ) : sortedSites.length === 0 ? (
          <div className="empty-state">
            <p>{t('sites.noResults')}</p>
          </div>
        ) : (
          <div
            className="cards-grid"
            dir="ltr"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: '12px',
              width: '100%'
            }}
          >
            {sortedSites.map((site) => (
              <PriorityCard
                key={`${site.site_id}-${site.phase_name}`}
                site={site}
                isFlipped={flippedCards[site.site_id]}
                onFlip={() => handleFlip(site.site_id)}
              />
            ))}
          </div>
        )}

        {/* View-Only Notice */}
        <div style={{
          textAlign: 'center',
          padding: '1rem',
          color: '#64748b',
          fontSize: '0.85rem',
          marginTop: '1rem'
        }}>
          View-Only Mode - Contact Admin for edit permissions
        </div>
      </div>
    </MainLayout>
  )
}

export default ManagementSites
