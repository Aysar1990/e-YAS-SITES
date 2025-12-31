/**
 * Admin Sites Page V2.0 - GOD LEVEL DESIGN
 * REFACTORED: Modular architecture with extracted hooks
 * Original: 855 lines → Refactored: ~350 lines
 */

import { useTranslation } from 'react-i18next'
import MainLayout from '../../components/Layout/MainLayout'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import EditSiteModal from '../../components/EditSiteModal'
import {
  useSitesData,
  useSitesFilters,
  usePagination,
  useAdvancedSearch,
  useBatchOperations,
  useMapView,
  SitesTable,
  FlipCard,
  SitesToolbar,
  BulkUpdateModal,
  BulkDeleteModal,
  BulkAssignModal,
  BatchProgress,
  MapView,
  Pagination,
  AdvancedSearchBar,
  QuickFilters,
  VirtualizedCardGrid,
  VirtualizedTable,
  LazyLoadingToggle
} from '../../components/Sites'

// Extracted hooks and config
import { useSitesLocalState, useSitesHandlers, getTableColumns } from './Sites/index'

import '../../utils/leafletFix'
import './Sites.css'

const Sites = () => {
  const { t } = useTranslation()
  const { direction } = useLanguage()
  const { user } = useAuth()

  // Check if user can edit (Admin only)
  const canEdit = user?.role === 'admin' || user?.role === 'Admin'

  // Data hook
  const {
    sites,
    loading,
    activePhase,
    useFirebase,
    setUseFirebase,
    firebaseConnected,
    firebaseLastUpdate,
    updateFirebaseSite,
    firebaseSites,
    uniqueStatuses,
    uniquePriorities
  } = useSitesData()

  // Filters hook
  const {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    sortedSites
  } = useSitesFilters(sites)

  // Advanced Search hook
  const {
    searchQuery,
    searchFields,
    searchMode,
    quickFilters,
    filteredSites: searchFilteredSites,
    suggestions,
    searchHistory,
    setSearchQuery,
    setSearchFields,
    setSearchMode,
    toggleQuickFilter,
    clearAllFilters,
    clearHistory,
    totalResults,
    hasActiveFilters
  } = useAdvancedSearch(sortedSites)

  // Local state hook
  const localState = useSitesLocalState()

  // Batch Operations hook (needs handleSaveSite)
  const handleSaveSite = async (siteId, updates) => {
    if (useFirebase) {
      return await updateFirebaseSite(siteId, updates)
    }
    return { success: false, error: 'Local editing not implemented' }
  }

  const {
    isProcessing,
    progress,
    results,
    batchDelete,
    batchStatusUpdate,
    batchAssignContractor,
    batchPriorityUpdate
  } = useBatchOperations(handleSaveSite)

  // Handlers hook
  const handlers = useSitesHandlers({
    useFirebase,
    firebaseConnected,
    updateFirebaseSite,
    firebaseSites,
    activePhase,
    sites,
    searchFilteredSites,
    sortedSites,
    statusFilter,
    selectedSites: localState.selectedSites,
    setSelectedSites: localState.setSelectedSites,
    setExporting: localState.setExporting,
    setEditModalOpen: localState.setEditModalOpen,
    setSelectedSite: localState.setSelectedSite,
    setDeleteModalOpen: localState.setDeleteModalOpen,
    setAssignModalOpen: localState.setAssignModalOpen,
    setAssignType: localState.setAssignType,
    batchDelete,
    batchStatusUpdate,
    batchAssignContractor,
    batchPriorityUpdate,
    canEdit
  })

  // Map View hook
  const {
    center,
    zoom,
    clustering,
    validSites,
    setClustering,
    focusSite,
    resetView,
    getStatusColor,
    updateMapPosition
  } = useMapView(searchFilteredSites)

  // Pagination hook
  const {
    paginatedItems: paginatedSites,
    paginationInfo,
    itemsPerPage,
    itemsPerPageOptions,
    goToPage,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPreviousPage,
    changeItemsPerPage
  } = usePagination(searchFilteredSites, 'admin_sites_pagination')

  // Table columns config
  const tableColumns = getTableColumns()

  return (
    <MainLayout>
      <div className="sites-page-v2" dir={direction}>
        {/* HEADER */}
        <div className="sites-header-v2">
          <h1 className="sites-header-v2__title">{t('sites.title', 'Sites')}</h1>
          <div className="sites-header-v2__stats">
            <div className="stat-pill">
              <span className="stat-pill__value">{sites.length}</span>
              <span>Total Sites</span>
            </div>
            {activePhase && activePhase !== 'ALL' && (
              <div className="stat-pill">
                <span className="stat-pill__value">{activePhase}</span>
                <span>Phase</span>
              </div>
            )}
            <div className="stat-pill" style={{ borderColor: firebaseConnected ? '#22c55e' : '#ef4444' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: firebaseConnected ? '#22c55e' : '#ef4444' }}></span>
              <span>{firebaseConnected ? 'Connected' : 'Offline'}</span>
            </div>
          </div>
        </div>

        {/* TOOLBAR */}
        <SitesToolbar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          statuses={uniqueStatuses}
          priorityFilter={priorityFilter}
          onPriorityChange={setPriorityFilter}
          priorities={uniquePriorities}
          viewMode={localState.viewMode}
          onViewModeChange={localState.setViewMode}
          onExport={handlers.handleExport}
          onExportFull={handlers.handleExportFull}
          onExportPhase={handlers.handleExportPhase}
          onExportFiltered={handlers.handleExportFiltered}
          activePhase={activePhase}
          filteredCount={searchFilteredSites.length}
          canExport={canEdit}
          exporting={localState.exporting}
          useFirebase={useFirebase}
          onFirebaseToggle={setUseFirebase}
          firebaseConnected={firebaseConnected}
        />

        {/* ADVANCED SEARCH & FILTERS */}
        <div style={{ marginBottom: '1.5rem' }}>
          <AdvancedSearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchFields={searchFields}
            onFieldsChange={setSearchFields}
            searchMode={searchMode}
            onModeChange={setSearchMode}
            suggestions={suggestions}
            searchHistory={searchHistory}
            onClearHistory={clearHistory}
            placeholder="Search sites by ID, Name, Contractor, Governorate..."
          />

          <div style={{ marginTop: '1rem' }}>
            <LazyLoadingToggle
              enabled={localState.lazyLoadingEnabled}
              onToggle={localState.handleLazyLoadingToggle}
              itemCount={searchFilteredSites.length}
            />
          </div>

          {hasActiveFilters && (
            <div style={{ marginTop: '0.75rem', padding: '0.75rem 1rem', background: 'rgba(143, 217, 217, 0.1)', border: '1px solid rgba(143, 217, 217, 0.2)', borderRadius: '12px', color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📊</span>
              <span>Showing <strong>{totalResults}</strong> of <strong>{sortedSites.length}</strong> sites</span>
              <button onClick={clearAllFilters} style={{ marginLeft: 'auto', padding: '0.4rem 0.75rem', background: 'rgba(255, 85, 102, 0.15)', border: '1px solid rgba(255, 85, 102, 0.3)', borderRadius: '8px', color: '#FF8566', fontSize: '0.8rem', cursor: 'pointer' }}>
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* QUICK FILTERS */}
        <QuickFilters filters={quickFilters} onToggleFilter={toggleQuickFilter} onClearAll={clearAllFilters} className="sites-quick-filters" />

        {/* CONTENT */}
        {loading ? (
          <div className="sites-grid-v2">
            {[...Array(12)].map((_, i) => <div key={i} className="skeleton-card"></div>)}
          </div>
        ) : searchFilteredSites.length === 0 ? (
          <div className="sites-empty-state">
            <div className="sites-empty-state__icon">{hasActiveFilters ? '🔍' : '📭'}</div>
            <h3 className="sites-empty-state__title">{hasActiveFilters ? 'No Results Found' : 'No Sites Found'}</h3>
            <p className="sites-empty-state__text">{hasActiveFilters ? 'Try adjusting your search or filters.' : 'No sites available.'}</p>
            {hasActiveFilters && (
              <button onClick={clearAllFilters} style={{ marginTop: '1rem', padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #8FD9D9 0%, #6bc5c5 100%)', border: 'none', borderRadius: '12px', color: 'white', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>
                Clear All Filters
              </button>
            )}
          </div>
        ) : localState.viewMode === 'map' ? (
          <MapView sites={validSites} center={center} zoom={zoom} clustering={clustering} onClusteringToggle={() => setClustering(!clustering)} onSiteClick={(site) => { if (canEdit && useFirebase && firebaseConnected) handlers.handleEditSite(site, { stopPropagation: () => {} }) }} onMapMove={updateMapPosition} onResetView={resetView} getStatusColor={getStatusColor} />
        ) : localState.viewMode === 'cards' ? (
          <>
            {localState.lazyLoadingEnabled ? (
              <VirtualizedCardGrid sites={paginatedSites} renderCard={(site) => (
                <FlipCard site={site} isFlipped={localState.flippedCards[site.site_id]} onFlip={() => localState.handleFlip(site.site_id)} onEdit={handlers.handleEditSite} canEdit={canEdit && useFirebase && firebaseConnected} isSelected={localState.selectedSites.has(site.site_id)} onSelect={localState.handleSelectSite} selectionMode={localState.selectedSites.size > 0} />
              )} cardWidth={200} cardHeight={240} gap={16} className="sites-virtualized-grid" />
            ) : (
              <div className="sites-grid-v2">
                {paginatedSites.map((site) => (
                  <FlipCard key={`${site.site_id}-${site.phase_name}`} site={site} isFlipped={localState.flippedCards[site.site_id]} onFlip={() => localState.handleFlip(site.site_id)} onEdit={handlers.handleEditSite} canEdit={canEdit && useFirebase && firebaseConnected} isSelected={localState.selectedSites.has(site.site_id)} onSelect={localState.handleSelectSite} selectionMode={localState.selectedSites.size > 0} />
                ))}
              </div>
            )}
            <Pagination paginationInfo={paginationInfo} itemsPerPage={itemsPerPage} itemsPerPageOptions={itemsPerPageOptions} onPageChange={goToPage} onItemsPerPageChange={changeItemsPerPage} onFirstPage={goToFirstPage} onLastPage={goToLastPage} onNextPage={goToNextPage} onPreviousPage={goToPreviousPage} />
          </>
        ) : (
          <>
            {localState.lazyLoadingEnabled ? (
              <VirtualizedTable data={paginatedSites} columns={tableColumns} rowHeight={60} headerHeight={50} onRowClick={(site) => { if (canEdit && useFirebase && firebaseConnected) handlers.handleEditSite(site, { stopPropagation: () => {} }) }} selectedRows={localState.selectedSites} className="sites-virtualized-table" />
            ) : (
              <SitesTable sites={paginatedSites} selectedSites={localState.selectedSites} onSelect={localState.handleSelectSite} onEdit={handlers.handleEditSite} onUpdate={handleSaveSite} canEdit={canEdit && useFirebase && firebaseConnected} />
            )}
            <Pagination paginationInfo={paginationInfo} itemsPerPage={itemsPerPage} itemsPerPageOptions={itemsPerPageOptions} onPageChange={goToPage} onItemsPerPageChange={changeItemsPerPage} onFirstPage={goToFirstPage} onLastPage={goToLastPage} onNextPage={goToNextPage} onPreviousPage={goToPreviousPage} />
          </>
        )}

        {/* BULK ACTIONS BAR */}
        {localState.selectedSites.size > 0 && (
          <div className="bulk-actions-bar">
            <div className="bulk-actions-bar__info">
              <span className="bulk-actions-bar__count">{localState.selectedSites.size} {localState.selectedSites.size === 1 ? 'site' : 'sites'} selected</span>
            </div>
            <div className="bulk-actions-bar__actions">
              <button className="bulk-action-btn bulk-action-btn--status" onClick={handlers.handleBulkUpdateStatus} title="Update Status"><span>📊</span>Update Status</button>
              <button className="bulk-action-btn bulk-action-btn--contractor" onClick={handlers.handleBulkAssignContractor} title="Assign Contractor"><span>👷</span>Assign Contractor</button>
              <button className="bulk-action-btn bulk-action-btn--priority" onClick={handlers.handleBulkUpdatePriority} title="Set Priority"><span>⚡</span>Set Priority</button>
              <button className="bulk-action-btn bulk-action-btn--export" onClick={handlers.handleExportSelected} title="Export Selected"><span>📥</span>Export</button>
              <button className="bulk-action-btn bulk-action-btn--delete" onClick={handlers.handleBulkDelete} title="Delete Selected"><span>🗑️</span>Delete</button>
              <button className="bulk-action-btn bulk-action-btn--clear" onClick={localState.handleClearSelection} title="Clear Selection"><span>✕</span>Clear</button>
            </div>
          </div>
        )}

        {/* BATCH PROGRESS */}
        {isProcessing && <BatchProgress progress={progress} results={results} />}

        {/* MODALS */}
        <EditSiteModal site={localState.selectedSite} isOpen={localState.editModalOpen} onClose={localState.closeEditModal} onSave={handleSaveSite} />
        <BulkUpdateModal isOpen={localState.bulkModalOpen} onClose={() => localState.setBulkModalOpen(false)} onConfirm={handlers.handleBulkUpdate} selectedCount={localState.selectedSites.size} availableStatuses={uniqueStatuses} />
        <BulkDeleteModal isOpen={localState.deleteModalOpen} onClose={() => localState.setDeleteModalOpen(false)} onConfirm={handlers.confirmBulkDelete} selectedCount={localState.selectedSites.size} />
        <BulkAssignModal isOpen={localState.assignModalOpen} onClose={() => localState.setAssignModalOpen(false)} onConfirm={(value) => handlers.confirmBulkAssign(value, localState.assignType)} selectedCount={localState.selectedSites.size} assignType={localState.assignType} />
      </div>
    </MainLayout>
  )
}

export default Sites
