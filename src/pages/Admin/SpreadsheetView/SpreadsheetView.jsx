/**
 * Spreadsheet View - Excel-like data editor with FULL CONTROL
 * REFACTORED: Modular architecture with extracted hooks and components
 *
 * Features:
 * - Phase 1: Stats Widget, Freeze Columns, Recent Changes Highlight
 * - Phase 2: Smart Search, Saved Views/Presets
 * - Phase 3: Export Dialog, Cell History & Audit Trail
 * - Phase 4: Conditional Formatting, Smart Suggestions
 * - Phase 5: Collaboration (Activity Feed, Presence, Comments)
 * - Phase 6: Data Management (Bulk Edit, Import, Advanced Filter, Validation)
 */

import React, { useEffect, useMemo, useRef } from 'react'
import { AgGridReact } from 'ag-grid-react'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'

// Layout
import MainLayout from '../../../components/Layout/MainLayout'
import { useSitesData } from '../../../components/Sites'

// Column definitions
import { ALL_COLUMNS } from './columns'

// Extracted Hooks
import {
  useSpreadsheetState,
  useSpreadsheetActions,
  useRecentChanges,
  useSavedViews,
  useCellHistory,
  useSmartSuggestions
} from './hooks'

// Extracted Components
import SpreadsheetToolbar from './components/Toolbar'
import ColumnManager from './components/ColumnManager'

// Feature Components
import StatsWidget from './components/StatsWidget'
import ViewsManager from './components/ViewsManager'
import ExportDialog from './components/ExportDialog'
import CellHistoryPanel from './components/CellHistoryPanel'
import FormattingRules from './components/FormattingRules'
import SuggestionsPanel from './components/SuggestionsPanel'
import ActivityFeed from './components/ActivityFeed'
import CommentsPanel from './components/Comments'
import BulkEditModal from './components/BulkEdit'
import ImportModal from './components/Import'
import FilterBuilder from './components/AdvancedFilter'

// Phase 7: Visualization
import { ChartPanel } from './components/Charts'
import { ReportGenerator } from './components/Reports'

// Phase 8: Power Features
import { ShortcutsHub, useShortcuts } from './components/Shortcuts'
import { FormulaBar } from './components/Formulas'
import { MacroRecorder } from './components/Macros'

// Phase 9: Mobile & Print
import { MobileSpreadsheet } from './components/Mobile'
import { PrintPreview } from './components/Print'

// Utils
import { presenceService } from './services/firebase/presence'
import { applyFormattingRules } from './utils/formattingRules'

// Styles
import './SpreadsheetView.css'
import './detached.css'

const SpreadsheetView = () => {
  const gridRef = useRef(null)

  // Detached Window State
  const [isDetached, setIsDetached] = React.useState(false)

  // Data from Firebase/Mock
  const { sites, loading, updateFirebaseSite, useFirebase } = useSitesData()

  // Check if running in detached mode on mount
  useEffect(() => {
    if (window.electron?.isDetachedWindow?.()) {
      setIsDetached(true)
    }
  }, [])

  // Handler to open detached window
  const handleDetachWindow = async () => {
    if (window.electron?.openDetachedWindow) {
      await window.electron.openDetachedWindow({
        route: '/admin/spreadsheet',
        title: 'e-YAS SITES - Spreadsheet View'
      })
    }
  }

  // Centralized State Management
  const state = useSpreadsheetState()

  // Custom Hooks
  const { markChanged, isRecentlyChanged } = useRecentChanges(10)
  const { views, currentView, createView, deleteView, applyView, clearView } = useSavedViews()
  const { addHistoryEntry, getCellHistory, revertChange } = useCellHistory()
  const { suggestions, dismissSuggestion, clearDismissed, hasNew: hasNewSuggestions, dismissedCount } = useSmartSuggestions(state.rowData)

  // Phase 8: Keyboard Shortcuts
  useShortcuts({
    onSave: () => console.log('[Shortcuts] Save triggered'),
    onSearch: () => {
      const searchInput = document.querySelector('.smart-search input')
      if (searchInput) searchInput.focus()
    },
    onExport: () => state.setShowExportDialog(true),
    onSelectAll: () => gridRef.current?.api?.selectAll(),
    onClearSelection: () => gridRef.current?.api?.deselectAll(),
    onRefresh: () => window.location.reload(),
    onShowHelp: () => state.setShowShortcutsHelp(prev => !prev),
    gridRef
  })

  // Actions
  const actions = useSpreadsheetActions(
    state,
    { gridRef },
    { markChanged, addHistoryEntry, revertChange, applyView, createView },
    { useFirebase, updateFirebaseSite }
  )

  // Load sites data
  useEffect(() => {
    if (sites?.length > 0) {
      state.setRowData(sites)
    }
  }, [sites])

  // ESC key handler for fullscreen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && state.isFullscreen) {
        state.setIsFullscreen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [state.isFullscreen])

  // Initialize presence service
  useEffect(() => {
    if (!state.currentUser?.id) return

    let unsubscribe = null
    const initPresence = async () => {
      try {
        await presenceService.initialize(state.currentUser.id, state.currentUser.name)
        unsubscribe = presenceService.listen((users) => state.setOnlineUsers(users))
      } catch (error) {
        console.error('[SpreadsheetView] Presence init error:', error)
      }
    }

    initPresence()
    return () => {
      if (unsubscribe) unsubscribe()
      presenceService.cleanup()
    }
  }, [state.currentUser?.id, state.currentUser?.name])

  // Column Definitions with formatting
  const columnDefs = useMemo(() =>
    ALL_COLUMNS.map(col => ({
      ...col,
      hide: state.hiddenColumns.includes(col.field),
      pinned: state.pinnedColumns.includes(col.field) ? 'left' : null,
      filter: col.type === 'number' ? 'agNumberColumnFilter' : 'agTextColumnFilter',
      cellClass: (params) => {
        const classes = []
        if (col.editable === false) classes.push('cell-readonly')
        if (params.data && isRecentlyChanged(params.data.site_id, col.field, 5)) {
          classes.push('cell-changed-recent')
        } else if (params.data && isRecentlyChanged(params.data.site_id, col.field, 60)) {
          classes.push('cell-changed-hour')
        }
        return classes.join(' ')
      },
      cellStyle: (params) => applyFormattingRules(params.value, params.colDef.field, state.formattingRules),
      valueParser: col.type === 'number' ? (params => parseFloat(params.newValue) || params.oldValue) : undefined,
      cellClassRules: col.field.includes('status') ? {
        'cell-approved': params => params.value === 'Approved' || params.value === 'approved',
        'cell-pending': params => params.value?.toLowerCase().includes('pending') || params.value?.toLowerCase().includes('under'),
        'cell-rejected': params => params.value === 'Rejected' || params.value === 'rejected'
      } : undefined
    }))
  , [state.hiddenColumns, state.pinnedColumns, isRecentlyChanged, state.formattingRules])

  // Default column properties
  const defaultColDef = useMemo(() => ({
    sortable: true,
    resizable: true,
    filter: 'agTextColumnFilter',
    floatingFilter: false,  // Disabled - use Advanced Filter instead
    enableCellChangeFlash: true,
    minWidth: 80,
    cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
    filterParams: { buttons: ['reset', 'apply'], closeOnApply: true }
  }), [])

  // Loading state
  if (loading) {
    return (
      <MainLayout>
        <div className="spreadsheet-loading">
          <div className="spinner"></div>
          <p>Loading spreadsheet data...</p>
        </div>
      </MainLayout>
    )
  }

  // Main content
  const spreadsheetContent = (
    <div className={`spreadsheet-container ${state.isFullscreen ? 'fullscreen' : ''}`} style={{ fontSize: `${state.fontSize}px` }}>
      {/* Toolbar */}
      <SpreadsheetToolbar
        rowData={state.rowData}
        filteredData={state.filteredData}
        searchQuery={state.searchQuery}
        hiddenColumns={state.hiddenColumns}
        currentView={currentView}
        selectedRows={state.selectedRows}
        activeFilter={state.activeFilter}
        onlineUsers={state.onlineUsers}
        currentUser={state.currentUser}
        suggestions={suggestions}
        hasNewSuggestions={hasNewSuggestions}
        density={state.density}
        setDensity={state.setDensity}
        fontSize={state.fontSize}
        setFontSize={state.setFontSize}
        isFullscreen={state.isFullscreen}
        isDetached={isDetached}
        onDetachWindow={handleDetachWindow}
        toolbarCollapsed={state.toolbarCollapsed}
        setToolbarCollapsed={state.setToolbarCollapsed}
        shortcutsBarVisible={state.shortcutsBarVisible}
        setShortcutsBarVisible={state.setShortcutsBarVisible}
        showStats={state.showStats} setShowStats={state.setShowStats}
        showViewsManager={state.showViewsManager} setShowViewsManager={state.setShowViewsManager}
        showColumnManager={state.showColumnManager} setShowColumnManager={state.setShowColumnManager}
        showFormattingPanel={state.showFormattingPanel} setShowFormattingPanel={state.setShowFormattingPanel}
        showSuggestionsPanel={state.showSuggestionsPanel} setShowSuggestionsPanel={state.setShowSuggestionsPanel}
        showActivityFeed={state.showActivityFeed} setShowActivityFeed={state.setShowActivityFeed}
        showComments={state.showComments} setShowComments={state.setShowComments}
        setShowBulkEdit={state.setShowBulkEdit}
        setShowImportModal={state.setShowImportModal}
        setShowAdvancedFilter={state.setShowAdvancedFilter}
        setShowExportDialog={state.setShowExportDialog}
        setShowCharts={state.setShowCharts}
        setShowReports={state.setShowReports}
        setShowShortcutsHelp={state.setShowShortcutsHelp}
        setShowFormulaBar={state.setShowFormulaBar}
        showFormulaBar={state.showFormulaBar}
        setShowMacroRecorder={state.setShowMacroRecorder}
        setShowPrintPreview={state.setShowPrintPreview}
        autoFitColumns={actions.autoFitColumns}
        sizeToFit={actions.sizeToFit}
        toggleFullscreen={actions.toggleFullscreen}
        handleSearchResults={actions.handleSearchResults}
        handleClearAdvancedFilter={actions.handleClearAdvancedFilter}
      />

      {/* Feature Panels */}
      {state.showStats && <StatsWidget data={state.filteredData || state.rowData} onStatClick={actions.handleStatClick} onClose={() => state.setShowStats(false)} />}
      {state.showViewsManager && <ViewsManager views={views} currentView={currentView} onApplyView={actions.handleApplyView} onCreateView={actions.handleCreateView} onDeleteView={deleteView} onClose={() => state.setShowViewsManager(false)} currentConfig={actions.getCurrentConfig()} />}
      {state.showExportDialog && <ExportDialog data={state.searchQuery ? state.filteredData : state.rowData} columns={columnDefs} selectedRows={state.selectedRows} onClose={() => state.setShowExportDialog(false)} />}
      {state.showHistoryPanel && state.selectedCell && <CellHistoryPanel siteId={state.selectedCell.siteId} field={state.selectedCell.field} fieldLabel={state.selectedCell.fieldLabel} getCellHistory={getCellHistory} onRevert={actions.handleRevert} onClose={() => { state.setShowHistoryPanel(false); state.setSelectedCell(null) }} />}
      {state.showFormattingPanel && <FormattingRules rules={state.formattingRules} onUpdateRules={state.setFormattingRules} onClose={() => state.setShowFormattingPanel(false)} columns={ALL_COLUMNS} />}
      {state.showSuggestionsPanel && <SuggestionsPanel suggestions={suggestions} onDismiss={dismissSuggestion} onAction={actions.handleSuggestionAction} onClose={() => state.setShowSuggestionsPanel(false)} dismissedCount={dismissedCount} onClearDismissed={clearDismissed} />}
      {state.showActivityFeed && <ActivityFeed currentUser={state.currentUser} onClose={() => state.setShowActivityFeed(false)} />}
      {state.showComments && state.selectedSiteForComments && <CommentsPanel siteId={state.selectedSiteForComments.id} siteName={state.selectedSiteForComments.name} currentUser={state.currentUser} onlineUsers={state.onlineUsers} onClose={() => { state.setShowComments(false); state.setSelectedSiteForComments(null); presenceService.setCurrentSite(null) }} onMention={actions.handleMention} />}
      {state.showComments && !state.selectedSiteForComments && (
        <div className="comments-prompt">
          <div className="prompt-content">
            <span className="prompt-icon">💬</span>
            <p>انقر مرتين على صف لفتح التعليقات</p>
            <button className="btn-sm" onClick={() => state.setShowComments(false)}>إغلاق</button>
          </div>
        </div>
      )}

      {/* Phase 6 Modals */}
      {state.showBulkEdit && <BulkEditModal selectedRows={state.selectedRows} onApply={actions.handleBulkEditApply} onClose={() => state.setShowBulkEdit(false)} />}
      {state.showImportModal && <ImportModal columns={ALL_COLUMNS} onImport={actions.handleImportData} onClose={() => state.setShowImportModal(false)} />}
      {state.showAdvancedFilter && <FilterBuilder columns={ALL_COLUMNS} data={state.rowData} onApplyFilter={actions.handleAdvancedFilterApply} onClose={() => state.setShowAdvancedFilter(false)} />}

      {/* Phase 7 Visualization Modals */}
      {state.showCharts && <ChartPanel data={state.searchQuery ? state.filteredData : state.rowData} onClose={() => state.setShowCharts(false)} />}
      {state.showReports && <ReportGenerator data={state.searchQuery ? state.filteredData : state.rowData} onClose={() => state.setShowReports(false)} />}

      {/* Phase 8 Power Features */}
      <ShortcutsHub isOpen={state.showShortcutsHelp} onClose={() => state.setShowShortcutsHelp(false)} />
      {state.showMacroRecorder && <MacroRecorder onClose={() => state.setShowMacroRecorder(false)} />}

      {/* Phase 9: Print Preview */}
      {state.showPrintPreview && (
        <PrintPreview
          data={state.searchQuery ? state.filteredData : state.rowData}
          onClose={() => state.setShowPrintPreview(false)}
        />
      )}

      {/* Column Manager */}
      {state.showColumnManager && (
        <ColumnManager
          hiddenColumns={state.hiddenColumns}
          pinnedColumns={state.pinnedColumns}
          onToggleColumn={actions.toggleColumn}
          onToggleFreeze={actions.toggleFreeze}
          onShowAll={actions.showAllColumns}
          onShowEssentialOnly={actions.showEssentialOnly}
          onClose={() => state.setShowColumnManager(false)}
        />
      )}

      {/* Phase 8: Formula Bar */}
      {state.showFormulaBar && (
        <FormulaBar
          data={state.rowData}
          selectedCell={state.selectedCell}
          onApplyFormula={(result) => {
            console.log('[Formula] Applied:', result)
            state.setShowFormulaBar(false)
          }}
          onClose={() => state.setShowFormulaBar(false)}
        />
      )}

      {/* AG Grid */}
      <div className="ag-theme-alpine spreadsheet-grid">
        <AgGridReact
          ref={gridRef}
          rowData={state.searchQuery ? state.filteredData : state.rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          quickFilterText={state.quickFilter}
          onCellValueChanged={actions.onCellValueChanged}
          onCellClicked={actions.onCellClicked}
          onRowDoubleClicked={actions.onRowDoubleClicked}
          rowSelection="multiple"
          onSelectionChanged={actions.onSelectionChanged}
          enableCellTextSelection={true}
          ensureDomOrder={true}
          animateRows={true}
          pagination={true}
          paginationPageSize={state.density === 'dense' ? 200 : state.density === 'compact' ? 150 : 100}
          paginationPageSizeSelector={[50, 100, 150, 200, 500]}
          domLayout="normal"
          rowHeight={state.currentDensity.rowHeight}
          headerHeight={state.currentDensity.headerHeight}
        />
      </div>

      {/* Keyboard Shortcuts Help - Toggleable */}
      {state.shortcutsBarVisible && (
        <div className="keyboard-shortcuts">
          <button 
            className="shortcuts-toggle"
            onClick={() => state.setShortcutsBarVisible(false)}
            title="Hide shortcuts bar"
          >✕</button>
          <span>⌨️ Shortcuts:</span>
          <kbd>Ctrl+C</kbd> Copy <kbd>Ctrl+V</kbd> Paste <kbd>Enter</kbd> Edit
          <kbd>Ctrl+Click</kbd> History <kbd>Double-Click</kbd> Comments
          {state.isFullscreen && <><kbd>ESC</kbd> Exit</>}
          <span className="separator">|</span>
          <span>Density: ⊞ Comfortable | ⊟ Compact | ≡ Dense</span>
          {state.selectedRows.length > 0 && <span className="selection-info">| {state.selectedRows.length} rows selected</span>}
          {state.onlineUsers.filter(u => u.status === 'online').length > 0 && <span className="online-info">| 👥 {state.onlineUsers.filter(u => u.status === 'online').length} online</span>}
        </div>
      )}
      {!state.shortcutsBarVisible && (
        <button 
          className="shortcuts-show-btn"
          onClick={() => state.setShortcutsBarVisible(true)}
          title="Show shortcuts bar"
        >⌨️</button>
      )}
    </div>
  )

  // Phase 9: Mobile View
  if (state.isMobile) {
    return (
      <MobileSpreadsheet
        data={state.searchQuery ? state.filteredData : state.rowData}
        loading={loading}
        onRefresh={() => window.location.reload()}
        onSearch={actions.handleSearchResults}
      />
    )
  }

  // Detached Mode - Full screen without MainLayout
  if (isDetached) {
    return (
      <div className="spreadsheet-detached-container">
        <div className="detached-header">
          <h2>📊 Spreadsheet View - Detached</h2>
          <div className="detached-header-actions">
            <span className="detached-info">
              {state.rowData?.length || 0} sites | {state.selectedRows?.length || 0} selected
            </span>
            <button onClick={() => window.close()} className="btn-close-detached">
              ✕ Close Window
            </button>
          </div>
        </div>
        <div className="spreadsheet-content-full">
          {spreadsheetContent}
        </div>
      </div>
    )
  }

  // Return with or without MainLayout
  return state.isFullscreen ? spreadsheetContent : <MainLayout>{spreadsheetContent}</MainLayout>
}

export default SpreadsheetView
