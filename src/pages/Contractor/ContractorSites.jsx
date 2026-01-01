/**
 * ContractorSites Page V2.0
 * REFACTORED: Extracted PriorityCard and utilities
 * Original: 408 lines → Refactored: ~220 lines
 */

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import MainLayout from '../../components/Layout/MainLayout'
import { Card, Button } from '../../components/UI'
import { useData } from '../../context/DataContext'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useChangeRequests } from '../../hooks/useChangeRequests'
import { hasRejection, filterContractorSites } from './contractorUtils'
import PriorityCard from './PriorityCard'
import RequestChangeModal from '../../components/RequestChangeModal'
import './ContractorSites.css'

const ContractorSites = () => {
  const { t } = useTranslation()
  const { direction } = useLanguage()
  const { sites: allSites, loading, activePhase } = useData()
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [flippedCards, setFlippedCards] = useState({})
  const [selectedSite, setSelectedSite] = useState(null)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [showMyRequests, setShowMyRequests] = useState(false)

  // Change requests hook
  const {
    requests: myRequests,
    pendingCount,
    createRequest,
    fetchMyRequests
  } = useChangeRequests({
    role: 'contractor',
    username: user?.username,
    autoRefresh: true
  })

  // Get contractor name from user
  const contractorName = user?.contractorName || user?.contractor_name

  // Filter sites by contractor (supports both snake_case and camelCase)
  const sites = useMemo(() => {
    if (!allSites || !contractorName) return []
    return allSites.filter(site => {
      const siteContractor = site.tssr_subcon || site.tssrSubcon
      return siteContractor === contractorName
    })
  }, [allSites, contractorName])

  // Unique values for filters
  const uniqueStatuses = [...new Set(sites.map(s => s.tssr_overall_status).filter(Boolean))]
  const uniquePriorities = [...new Set(sites.map(s => s.priority).filter(p => p !== null && p !== undefined))].sort((a, b) => a - b)

  // Filter and sort sites
  const filteredSites = filterContractorSites(sites, { searchTerm, statusFilter, priorityFilter })
  const sortedSites = [...filteredSites].sort((a, b) => (a.priority || 999) - (b.priority || 999))

  const handleFlip = (siteId) => {
    setFlippedCards(prev => ({ ...prev, [siteId]: !prev[siteId] }))
  }

  const handleRequestChange = (site) => {
    setSelectedSite(site)
    setShowRequestModal(true)
  }

  const handleSubmitRequest = async (data) => {
    const result = await createRequest(data)
    if (result.success) {
      setShowRequestModal(false)
      setSelectedSite(null)
    }
    return result
  }

  // Stats
  const approvedCount = sites.filter(s => s.tssr_overall_status?.toLowerCase().includes('approved')).length
  const rejectedCount = sites.filter(s => hasRejection(s)).length
  const underReviewCount = sites.filter(s => s.tssr_overall_status?.toLowerCase().includes('under')).length

  return (
    <MainLayout>
      <div className="contractor-sites-page" dir={direction}>
        <div className="page-header">
          <div className="page-header__info">
            <h1 className="page-title">مواقعي</h1>
            <p className="page-subtitle">
              إجمالي {sites.length} موقع
              {activePhase && activePhase !== 'ALL' && ` - ${activePhase}`}
            </p>
          </div>

          {/* Contractor Badge */}
          {contractorName && (
            <div className="contractor-badge">
              <span className="contractor-icon">🏢</span>
              <span className="contractor-name">{contractorName}</span>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="stats-row">
          <Card className="mini-stat mini-stat--total">
            <span className="mini-stat__icon">📊</span>
            <span className="mini-stat__value">{sites.length}</span>
            <span className="mini-stat__label">إجمالي المواقع</span>
          </Card>
          <Card className="mini-stat mini-stat--success">
            <span className="mini-stat__icon">✅</span>
            <span className="mini-stat__value">{approvedCount}</span>
            <span className="mini-stat__label">معتمد</span>
          </Card>
          <Card className="mini-stat mini-stat--warning">
            <span className="mini-stat__icon">⏳</span>
            <span className="mini-stat__value">{underReviewCount}</span>
            <span className="mini-stat__label">قيد المراجعة</span>
          </Card>
          <Card className="mini-stat mini-stat--error">
            <span className="mini-stat__icon">❌</span>
            <span className="mini-stat__value">{rejectedCount}</span>
            <span className="mini-stat__label">يوجد رفض</span>
          </Card>
        </div>

        {/* Filters */}
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
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
              <option value="all">{t('sites.allStatuses')}</option>
              {uniqueStatuses.map(status => <option key={status} value={status}>{status}</option>)}
            </select>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="filter-select">
              <option value="all">{t('sites.allPriorities')}</option>
              {uniquePriorities.map(p => <option key={p} value={String(p)}>{t('sites.priority')} {p}</option>)}
            </select>
          </div>
          <div className="filter-info">
            <span className="filter-result">عرض {filteredSites.length} من {sites.length} موقع</span>
          </div>
        </Card>

        {/* Sites Grid */}
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>{t('sites.loading')}</p>
          </div>
        ) : !contractorName ? (
          <div className="empty-state">
            <p style={{ color: '#ef4444' }}>⚠️ خطأ: اسم المقاول غير موجود في حسابك</p>
            <p style={{ fontSize: '14px', marginTop: '8px' }}>الرجاء التواصل مع المسؤول لتحديث بيانات حسابك</p>
          </div>
        ) : sites.length === 0 ? (
          <div className="empty-state">
            <p style={{ color: '#f59e0b' }}>⚠️ لا توجد مواقع مسجلة باسم: {contractorName}</p>
            <p style={{ fontSize: '14px', marginTop: '8px' }}>
              المرحلة الحالية: {activePhase || 'ALL'}
            </p>
          </div>
        ) : sortedSites.length === 0 ? (
          <div className="empty-state"><p>{t('sites.noResults')}</p></div>
        ) : (
          <div className="cards-grid" dir="ltr" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', width: '100%' }}>
            {sortedSites.map((site) => (
              <PriorityCard
                key={`${site.site_id}-${site.phase_name}`}
                site={site}
                isFlipped={flippedCards[site.site_id]}
                onFlip={() => handleFlip(site.site_id)}
                onRequestChange={() => handleRequestChange(site)}
              />
            ))}
          </div>
        )}

        {/* My Requests Section */}
        {showMyRequests && myRequests.length > 0 && (
          <Card className="my-requests-card" style={{ marginTop: '1rem', background: '#1e293b', borderRadius: '12px', padding: '1rem' }}>
            <h3 style={{ color: '#f1f5f9', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>My Change Requests</span>
              <button onClick={() => setShowMyRequests(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.25rem' }}>&times;</button>
            </h3>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {myRequests.map(req => (
                <div key={req.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem',
                  background: '#0f172a',
                  borderRadius: '8px',
                  marginBottom: '0.5rem',
                  borderLeft: `3px solid ${req.status === 'pending' ? '#f59e0b' : req.status === 'approved' ? '#8FD9D9' : '#ef4444'}`
                }}>
                  <div>
                    <div style={{ color: '#8fd9d9', fontFamily: 'monospace', fontSize: '0.85rem' }}>{req.site_id}</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                      {req.field_label || req.field_name}: {req.old_value || '(empty)'} → {req.new_value}
                    </div>
                  </div>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 500,
                    background: req.status === 'pending' ? 'rgba(245, 158, 11, 0.2)' : req.status === 'approved' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: req.status === 'pending' ? '#fbbf24' : req.status === 'approved' ? '#34d399' : '#f87171'
                  }}>
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', padding: '1rem', marginTop: '1rem' }}>
          <Button
            variant="secondary"
            onClick={() => {
              fetchMyRequests()
              setShowMyRequests(!showMyRequests)
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <span>My Requests</span>
            {myRequests.filter(r => r.status === 'pending').length > 0 && (
              <span style={{ background: '#f59e0b', color: 'white', padding: '0.15rem 0.5rem', borderRadius: '10px', fontSize: '0.7rem' }}>
                {myRequests.filter(r => r.status === 'pending').length}
              </span>
            )}
          </Button>
        </div>

        {/* Instructions Notice */}
        <div style={{ textAlign: 'center', padding: '1rem', color: '#64748b', fontSize: '0.85rem' }}>
          انقر على البطاقة مرتين للدخول ثم اضغط على زر "طلب تعديل" لإرسال طلب تغيير
        </div>

        {/* Request Change Modal */}
        <RequestChangeModal
          site={selectedSite}
          isOpen={showRequestModal}
          onClose={() => {
            setShowRequestModal(false)
            setSelectedSite(null)
          }}
          onSubmit={handleSubmitRequest}
        />
      </div>
    </MainLayout>
  )
}

export default ContractorSites
