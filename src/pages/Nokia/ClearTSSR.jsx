import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import MainLayout from '../../components/Layout/MainLayout'
import './ClearTSSR.css'

const ClearTSSR = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [clearedSites, setClearedSites] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPhase, setSelectedPhase] = useState('all')
  const [uncheckingId, setUncheckingId] = useState(null)

  const phases = [
    { value: 'all', label: 'All Phases' },
    { value: 'Phase 1', label: 'Phase 1' },
    { value: 'Phase 2', label: 'Phase 2' },
    { value: 'Phase 3', label: 'Phase 3' }
  ]

  useEffect(() => {
    fetchClearedSites()
  }, [selectedPhase])

  const fetchClearedSites = async () => {
    setLoading(true)
    try {
      if (window.electron?.getCheckedSites) {
        const phase = selectedPhase === 'all' ? null : selectedPhase
        const result = await window.electron.getCheckedSites(phase)
        // Handle different response formats
        const sites = Array.isArray(result) ? result : (result?.sites || result?.data || [])
        setClearedSites(sites)
      } else {
        console.warn('getCheckedSites not available')
        setClearedSites([])
      }
    } catch (error) {
      console.error('Error fetching cleared sites:', error)
      setClearedSites([])
    } finally {
      setLoading(false)
    }
  }

  const handleUncheck = async (siteId) => {
    if (user?.role === 'admin') {
      return // Admin is view only
    }

    setUncheckingId(siteId)
    try {
      if (window.electron?.uncheckSite) {
        await window.electron.uncheckSite(siteId)
        // Remove from local state
        setClearedSites(prev => prev.filter(site => site.site_id !== siteId))
      }
    } catch (error) {
      console.error('Error unchecking site:', error)
    } finally {
      setUncheckingId(null)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const canUncheck = user?.role === 'nokia_engineer'

  return (
    <MainLayout>
      <div className="clear-tssr-page">
        {/* Page Header */}
        <div className="clear-tssr-header">
          <div className="header-content">
            <h1 className="page-title">Clear TSSR ✅</h1>
            <p className="page-subtitle">Sites reviewed and cleared for next stage</p>
          </div>

          <div className="header-actions">
            <select
              className="phase-filter"
              value={selectedPhase}
              onChange={(e) => setSelectedPhase(e.target.value)}
            >
              {phases.map(phase => (
                <option key={phase.value} value={phase.value}>
                  {phase.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="clear-stats-bar">
          <div className="stat-item">
            <span className="stat-value">{clearedSites.length}</span>
            <span className="stat-label">Total Cleared</span>
          </div>
        </div>

        {/* Table */}
        <div className="clear-tssr-table-container">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading cleared sites...</p>
            </div>
          ) : clearedSites.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📋</span>
              <h3>No Cleared Sites</h3>
              <p>No sites have been cleared for the selected phase</p>
            </div>
          ) : (
            <table className="clear-tssr-table">
              <thead>
                <tr>
                  <th>Site ID</th>
                  <th>Site Name</th>
                  <th>Status</th>
                  <th>Part Of</th>
                  <th>Contractor</th>
                  <th>Note</th>
                  <th>Cleared By</th>
                  <th>Cleared At</th>
                  {canUncheck && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {Array.isArray(clearedSites) && clearedSites.map((site) => (
                  <tr key={site.site_id || site.id}>
                    <td className="site-id-cell">
                      <span className="site-id">{site.site_id}</span>
                    </td>
                    <td className="site-name-cell">{site.site_name || '-'}</td>
                    <td>
                      <span className={`status-badge status-${(site.status || '').toLowerCase().replace(/\s+/g, '-')}`}>
                        {site.status || '-'}
                      </span>
                    </td>
                    <td>{site.part_of || '-'}</td>
                    <td>{site.contractor || '-'}</td>
                    <td className="note-cell">
                      {site.note ? (
                        <span className="note-text" title={site.note}>
                          "{site.note}"
                        </span>
                      ) : (
                        <span className="no-note">-</span>
                      )}
                    </td>
                    <td className="cleared-by-cell">
                      <span className="cleared-by">{site.checked_by || site.cleared_by || '-'}</span>
                    </td>
                    <td className="cleared-at-cell">
                      {formatDate(site.updated_at || site.checked_at)}
                    </td>
                    {canUncheck && (
                      <td className="actions-cell">
                        <button
                          className="uncheck-btn"
                          onClick={() => handleUncheck(site.site_id)}
                          disabled={uncheckingId === site.site_id}
                          title="Remove from Clear TSSR"
                        >
                          {uncheckingId === site.site_id ? (
                            <span className="btn-loading">...</span>
                          ) : (
                            <>
                              <span className="btn-icon">↩️</span>
                              <span className="btn-text">Uncheck</span>
                            </>
                          )}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Info Footer */}
        {user?.role === 'admin' && (
          <div className="admin-notice">
            <span className="notice-icon">ℹ️</span>
            <span>Admin view only - Nokia Engineers can uncheck sites</span>
          </div>
        )}
      </div>
    </MainLayout>
  )
}

export default ClearTSSR
