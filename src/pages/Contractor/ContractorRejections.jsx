// Contractor Rejections Page - View sites with department rejections

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import MainLayout from '../../components/Layout/MainLayout'
import { Card } from '../../components/UI'
import { useData } from '../../context/DataContext'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import './ContractorRejections.css'

// Department configuration
const departments = [
  { key: 'ti', label: 'TI', statusField: 'ti_status', commentField: 'ti_comment' },
  { key: 'rf_plan', label: 'RF Planning', statusField: 'rf_plan_status', commentField: 'rf_plan_comment' },
  { key: 'rf_opt', label: 'RF Optimization', statusField: 'rf_opt_status', commentField: 'rf_opt_comment' },
  { key: 'civil', label: 'Civil', statusField: 'civil_status', commentField: 'civil_comment' },
  { key: 'mw', label: 'MW', statusField: 'mw_status', commentField: 'mw_comment' },
  { key: 'nokia_npo', label: 'Nokia NPO', statusField: 'nokia_npo_status', commentField: 'nokia_npo_comment' },
]

// Check if any department is rejected
const hasRejection = (site) => {
  return departments.some(dept => {
    const status = site[dept.statusField]
    return status && status.toLowerCase().includes('rejected')
  })
}

// Get status class
const getStatusClass = (status) => {
  if (!status) return 'unknown'
  const s = status.toLowerCase()
  if (s.includes('rejected')) return 'rejected'
  if (s.includes('approved')) return 'approved'
  if (s.includes('released')) return 'released'
  if (s.includes('pending')) return 'pending'
  return 'unknown'
}

// Department Row Component
const DepartmentRow = ({ dept, site, expandedComments, toggleComment }) => {
  const status = site[dept.statusField] || 'N/A'
  const comment = site[dept.commentField] || ''
  const isRejected = status.toLowerCase().includes('rejected')
  const isExpanded = expandedComments[`${site.site_id}-${dept.key}`]
  const hasLongComment = comment.length > 100

  return (
    <div className={`dept-row ${isRejected ? 'dept-row--rejected' : ''}`}>
      <div className="dept-row__header">
        <span className="dept-label">{dept.label}</span>
        <span className={`dept-status dept-status--${getStatusClass(status)}`}>
          {status}
        </span>
      </div>
      {comment && (
        <div className="dept-comment">
          <div className={`comment-text ${isExpanded ? 'expanded' : ''}`}>
            {isExpanded || !hasLongComment ? comment : `${comment.substring(0, 100)}...`}
          </div>
          {hasLongComment && (
            <button
              className="comment-expand-btn"
              onClick={(e) => {
                e.stopPropagation()
                toggleComment(`${site.site_id}-${dept.key}`)
              }}
            >
              {isExpanded ? 'عرض أقل ▲' : 'عرض المزيد ▼'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// Rejection Card Component
const RejectionCard = ({ site, expandedComments, toggleComment, isCardExpanded, toggleCard }) => {
  const rejectedDepts = departments.filter(dept => {
    const status = site[dept.statusField]
    return status && status.toLowerCase().includes('rejected')
  })

  return (
    <Card className="rejection-site-card">
      <div className="rejection-site-card__header" onClick={() => toggleCard(site.site_id)}>
        <div className="site-info">
          <span className="site-id">{site.site_id}</span>
          <span className="site-name">{site.final_site_name || '—'}</span>
        </div>
        <div className="header-right">
          <span className="rejection-count">
            {rejectedDepts.length} قسم مرفوض
          </span>
          <span className="expand-icon">{isCardExpanded ? '▲' : '▼'}</span>
        </div>
      </div>

      <div className="overall-status">
        <span className="overall-label">الحالة العامة:</span>
        <span className={`overall-value status--${getStatusClass(site.tssr_overall_status)}`}>
          {site.tssr_overall_status || 'N/A'}
        </span>
      </div>

      {isCardExpanded && (
        <div className="departments-table">
          <div className="table-header">
            <span>القسم</span>
            <span>الحالة</span>
          </div>
          {departments.map(dept => (
            <DepartmentRow
              key={dept.key}
              dept={dept}
              site={site}
              expandedComments={expandedComments}
              toggleComment={toggleComment}
            />
          ))}
        </div>
      )}

      {!isCardExpanded && (
        <div className="rejected-depts-preview">
          {rejectedDepts.map(dept => (
            <span key={dept.key} className="rejected-dept-badge">
              {dept.label}
            </span>
          ))}
        </div>
      )}
    </Card>
  )
}

const ContractorRejections = () => {
  const { t } = useTranslation()
  const { direction } = useLanguage()
  const { sites, loading, activePhase } = useData()
  const { user } = useAuth()
  const [expandedComments, setExpandedComments] = useState({})
  const [expandedCards, setExpandedCards] = useState({})
  const [searchTerm, setSearchTerm] = useState('')

  // Get contractor name (supports both formats)
  const contractorName = user?.contractorName || user?.contractor_name

  // Filter sites: only contractor's sites with rejections
  const rejectedSites = sites.filter(site => {
    // Must be contractor's site (supports both snake_case and camelCase)
    const siteContractor = site.tssr_subcon || site.tssrSubcon
    if (contractorName && siteContractor !== contractorName) {
      return false
    }
    // Must have at least one rejected department
    if (!hasRejection(site)) {
      return false
    }
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      return (
        (site.site_id && site.site_id.toLowerCase().includes(term)) ||
        (site.final_site_name && site.final_site_name.toLowerCase().includes(term))
      )
    }
    return true
  })

  const toggleComment = (key) => {
    setExpandedComments(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleCard = (siteId) => {
    setExpandedCards(prev => ({ ...prev, [siteId]: !prev[siteId] }))
  }

  const expandAll = () => {
    const allExpanded = {}
    rejectedSites.forEach(site => {
      allExpanded[site.site_id] = true
    })
    setExpandedCards(allExpanded)
  }

  const collapseAll = () => {
    setExpandedCards({})
  }

  return (
    <MainLayout>
      <div className="contractor-rejections-page" dir={direction}>
        <div className="page-header">
          <div className="page-header__info">
            <h1 className="page-title">المواقع المرفوضة</h1>
            <p className="page-subtitle">
              {rejectedSites.length} موقع يحتاج مراجعة
              {activePhase && activePhase !== 'ALL' && ` - ${activePhase}`}
            </p>
          </div>
          {contractorName && (
            <div className="contractor-badge">
              <span className="contractor-icon">🏢</span>
              <span>{contractorName}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="rejection-stats">
          <Card className="stat-card stat-card--error">
            <span className="stat-icon">❌</span>
            <span className="stat-value">{rejectedSites.length}</span>
            <span className="stat-label">مواقع مرفوضة</span>
          </Card>
          <Card className="stat-card stat-card--warning">
            <span className="stat-icon">⏳</span>
            <span className="stat-value">
              {rejectedSites.reduce((count, site) => {
                return count + departments.filter(dept => {
                  const status = site[dept.statusField]
                  return status && status.toLowerCase().includes('rejected')
                }).length
              }, 0)}
            </span>
            <span className="stat-label">إجمالي الأقسام المرفوضة</span>
          </Card>
        </div>

        {/* Filters */}
        <Card className="filters-card">
          <div className="filters">
            <div className="search-box">
              <input
                type="text"
                placeholder="بحث بالاسم أو رقم الموقع..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="action-buttons">
              <button className="btn btn--outline btn--sm" onClick={expandAll}>
                توسيع الكل
              </button>
              <button className="btn btn--outline btn--sm" onClick={collapseAll}>
                طي الكل
              </button>
            </div>
          </div>
        </Card>

        {/* Rejections List */}
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>جاري التحميل...</p>
          </div>
        ) : rejectedSites.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">✅</span>
            <p>لا يوجد مواقع مرفوضة</p>
            <span className="empty-hint">جميع مواقعك بحالة جيدة</span>
          </div>
        ) : (
          <div className="rejections-list">
            {rejectedSites.map(site => (
              <RejectionCard
                key={`${site.site_id}-${site.phase_name}`}
                site={site}
                expandedComments={expandedComments}
                toggleComment={toggleComment}
                isCardExpanded={expandedCards[site.site_id]}
                toggleCard={toggleCard}
              />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  )
}

export default ContractorRejections
