/**
 * Ghirbal Page V2.0
 * REFACTORED: Extracted SiteRow, config, and hooks
 * Original: 444 lines → Refactored: ~180 lines
 */

import { useTranslation } from 'react-i18next'
import MainLayout from '../../components/Layout/MainLayout'
import { Card } from '../../components/UI'
import { useLanguage } from '../../context/LanguageContext'
import { STATUS_FILTERS, filterGhirbalSites } from './ghirbalConfig'
import { useGhirbalData } from './useGhirbalData'
import SiteRow from './SiteRow'
import './Ghirbal.css'

const Ghirbal = () => {
  const { t } = useTranslation()
  const { direction } = useLanguage()

  const {
    sites, loading, error, phases, selectedPhase, setSelectedPhase,
    statusFilter, setStatusFilter, searchTerm, setSearchTerm,
    isReadOnly, checkedCount, totalCount, fetchSites,
    handleCheckChange, handleNoteChange, handleSave
  } = useGhirbalData()

  const filteredSites = filterGhirbalSites(sites, statusFilter, searchTerm)

  return (
    <MainLayout>
      <div className="ghirbal-page" dir={direction}>
        {/* Header */}
        <div className="page-header">
          <div className="page-header__info">
            <h1 className="page-title">
              Ghirbal <span className="title-ar">(غربال)</span>
            </h1>
            <p className="page-subtitle">
              {isReadOnly ? 'View Mode (Admin)' : 'Nokia Review & Filtering'}
              {' - '}{totalCount} sites, {checkedCount} checked
            </p>
          </div>
          {isReadOnly && (
            <div className="readonly-badge">
              <span>🔒</span>
              <span>Read Only</span>
            </div>
          )}
        </div>

        {/* Filters */}
        <Card className="filters-card">
          <div className="filters">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search by Site ID, Name, Contractor, or Note..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <select
              value={selectedPhase}
              onChange={(e) => setSelectedPhase(e.target.value)}
              className="filter-select"
            >
              <option value="ALL">All Phases</option>
              {phases.map((phase, index) => (
                <option key={phase.phase_name || phase || index} value={phase.phase_name || phase}>
                  {phase.phase_name || phase}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              {STATUS_FILTERS.map(filter => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>

            <button className="btn-refresh" onClick={fetchSites} title="Refresh">
              🔄
            </button>
          </div>
        </Card>

        {/* Stats Row */}
        <div className="stats-row">
          <Card className="stat-card">
            <span className="stat-icon">📋</span>
            <span className="stat-value">{totalCount}</span>
            <span className="stat-label">Total Sites</span>
          </Card>
          <Card className="stat-card stat-card--checked">
            <span className="stat-icon">✅</span>
            <span className="stat-value">{checkedCount}</span>
            <span className="stat-label">Checked (Ready for Clear)</span>
          </Card>
          <Card className="stat-card">
            <span className="stat-icon">⏳</span>
            <span className="stat-value">{totalCount - checkedCount}</span>
            <span className="stat-label">Pending Review</span>
          </Card>
        </div>

        {/* Content */}
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading sites...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <span className="error-icon">❌</span>
            <p>{error}</p>
            <button className="btn-retry" onClick={fetchSites}>Retry</button>
          </div>
        ) : filteredSites.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <p>No sites found</p>
            <span className="empty-hint">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No sites match the Ghirbal criteria'}
            </span>
          </div>
        ) : (
          <Card className="table-card">
            <div className="table-wrapper">
              <table className="ghirbal-table">
                <thead>
                  <tr>
                    <th className="col-checkbox"><span title="Check to mark for Clear TSSR">☑</span></th>
                    <th className="col-site-id">Site ID</th>
                    <th className="col-status">Status</th>
                    <th className="col-contractor">Contractor</th>
                    <th className="col-note">Note</th>
                    <th className="col-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSites.map(site => (
                    <SiteRow
                      key={`${site.site_id}-${site.phase_name}`}
                      site={site}
                      isReadOnly={isReadOnly}
                      onCheckChange={handleCheckChange}
                      onNoteChange={handleNoteChange}
                      onSave={handleSave}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Legend */}
        <div className="legend">
          <div className="legend-item">
            <span className="legend-color legend-color--checked"></span>
            <span>Checked - Ready for Clear TSSR</span>
          </div>
          <div className="legend-item">
            <span className="legend-color legend-color--npo"></span>
            <span>Under NPO Validation</span>
          </div>
          <div className="legend-item">
            <span className="legend-color legend-color--gsd"></span>
            <span>Under GSD Validation</span>
          </div>
          <div className="legend-item">
            <span className="legend-color legend-color--subcon"></span>
            <span>Under Subcon Validation</span>
          </div>
          <div className="legend-item">
            <span className="legend-color legend-color--not-surveyed"></span>
            <span>Not Surveyed</span>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

export default Ghirbal
