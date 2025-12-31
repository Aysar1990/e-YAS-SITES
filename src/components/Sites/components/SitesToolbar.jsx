/**
 * SitesToolbar Component - Premium Unified Command Bar
 * Glassmorphism, Search, Filters, View Toggle, Export
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import './SitesToolbar.css'

const SitesToolbar = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  statuses = [],
  priorityFilter,
  onPriorityChange,
  priorities = [],
  viewMode,
  onViewModeChange,
  onExport,
  onExportFull,
  onExportPhase,
  onExportFiltered,
  canExport,
  exporting,
  activePhase,
  filteredCount,
  // Firebase Toggle
  useFirebase,
  onFirebaseToggle,
  firebaseConnected
}) => {
  const { t } = useTranslation()
  const [openDropdown, setOpenDropdown] = useState(null)

  const toggleDropdown = (name) => {
    setOpenDropdown(openDropdown === name ? null : name)
  }

  return (
    <div className="sites-toolbar-v2">
      {/* Firebase Toggle */}
      <div className="toolbar-firebase-toggle">
        <button
          className={`firebase-toggle-btn ${useFirebase ? 'active' : ''}`}
          onClick={() => onFirebaseToggle(!useFirebase)}
          title={useFirebase ? 'Switch to Local/SQL' : 'Switch to Firebase'}
        >
          <span className={`toggle-indicator ${firebaseConnected ? 'connected' : 'disconnected'}`}></span>
          {useFirebase ? 'Firebase' : 'Local'}
        </button>
      </div>

      {/* Search */}
      <div className="toolbar-search">
        <svg className="toolbar-search__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          className="toolbar-search__input"
          placeholder={t('sites.searchPlaceholder', 'Search by ID, Name, or Contractor...')}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Filters */}
      <div className="toolbar-filters">
        {/* Status Filter */}
        <div className="filter-dropdown">
          <button
            className={`filter-pill ${statusFilter !== 'all' ? 'active' : ''}`}
            onClick={() => toggleDropdown('status')}
          >
            Status
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          {openDropdown === 'status' && (
            <div className="filter-dropdown__menu">
              <div 
                className={`filter-dropdown__item ${statusFilter === 'all' ? 'selected' : ''}`}
                onClick={() => { onStatusChange('all'); setOpenDropdown(null); }}
              >
                All Statuses
              </div>
              {statuses.map(s => (
                <div
                  key={s}
                  className={`filter-dropdown__item ${statusFilter === s ? 'selected' : ''}`}
                  onClick={() => { onStatusChange(s); setOpenDropdown(null); }}
                >
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Priority Filter */}
        <div className="filter-dropdown">
          <button
            className={`filter-pill ${priorityFilter !== 'all' ? 'active' : ''}`}
            onClick={() => toggleDropdown('priority')}
          >
            Priority
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          {openDropdown === 'priority' && (
            <div className="filter-dropdown__menu">
              <div 
                className={`filter-dropdown__item ${priorityFilter === 'all' ? 'selected' : ''}`}
                onClick={() => { onPriorityChange('all'); setOpenDropdown(null); }}
              >
                All Priorities
              </div>
              {priorities.map(p => (
                <div
                  key={p}
                  className={`filter-dropdown__item ${priorityFilter === String(p) ? 'selected' : ''}`}
                  onClick={() => { onPriorityChange(String(p)); setOpenDropdown(null); }}
                >
                  Priority {p}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* View Toggle */}
      <div className="toolbar-views">
        <button
          className={`view-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
          onClick={() => onViewModeChange('cards')}
          title="Card View"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
          </svg>
        </button>
        <button
          className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
          onClick={() => onViewModeChange('table')}
          title="Table View"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <button
          className={`view-toggle-btn ${viewMode === 'map' ? 'active' : ''}`}
          onClick={() => onViewModeChange('map')}
          title="Map View"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </button>
      </div>

      {/* Export Dropdown */}
      {canExport && (
        <div className="filter-dropdown export-dropdown">
          <button
            className="toolbar-export-btn"
            onClick={() => toggleDropdown('export')}
            disabled={exporting}
          >
            {exporting ? (
              <>
                <span className="spinner-sm"></span>
                Exporting...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Export
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </>
            )}
          </button>
          {openDropdown === 'export' && !exporting && (
            <div className="filter-dropdown__menu export-menu">
              <div
                className="filter-dropdown__item export-item"
                onClick={() => { onExportFull?.(); setOpenDropdown(null); }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                <div>
                  <span className="export-item__title">Full Report</span>
                  <span className="export-item__desc">All sheets, all data</span>
                </div>
              </div>
              {activePhase && activePhase !== 'ALL' && (
                <div
                  className="filter-dropdown__item export-item"
                  onClick={() => { onExportPhase?.(); setOpenDropdown(null); }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                  </svg>
                  <div>
                    <span className="export-item__title">Phase: {activePhase}</span>
                    <span className="export-item__desc">Export current phase only</span>
                  </div>
                </div>
              )}
              <div
                className="filter-dropdown__item export-item"
                onClick={() => { onExportFiltered?.(); setOpenDropdown(null); }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                </svg>
                <div>
                  <span className="export-item__title">Filtered Data</span>
                  <span className="export-item__desc">{filteredCount || 0} sites matching filters</span>
                </div>
              </div>
              <div className="export-divider"></div>
              <div
                className="filter-dropdown__item export-item"
                onClick={() => { onExport?.(); setOpenDropdown(null); }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <div>
                  <span className="export-item__title">Quick Export</span>
                  <span className="export-item__desc">Simple Excel export</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export { SitesToolbar }
export default SitesToolbar
