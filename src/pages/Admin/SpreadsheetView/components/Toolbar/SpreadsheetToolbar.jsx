/**
 * SpreadsheetToolbar Component
 * Reorganized with grouped tools
 */

import React, { useState } from 'react'
import SmartSearch from '../SmartSearch'
import OnlineUsers from '../UserPresence'
import ThemeSwitcher from '../../../../../components/ThemeSwitcher'
import { useTheme } from '../../../../../context/ThemeContext'
import { ALL_COLUMNS } from '../../columns'
import './SpreadsheetToolbar.css'

const SpreadsheetToolbar = ({
  rowData,
  filteredData,
  searchQuery,
  hiddenColumns,
  currentView,
  selectedRows,
  activeFilter,
  onlineUsers,
  currentUser,
  suggestions,
  hasNewSuggestions,
  density,
  setDensity,
  fontSize,
  setFontSize,
  isFullscreen,
  isDetached,
  onDetachWindow,
  // Layout Controls
  toolbarCollapsed,
  setToolbarCollapsed,
  shortcutsBarVisible,
  setShortcutsBarVisible,
  showStats, setShowStats,
  showViewsManager, setShowViewsManager,
  showColumnManager, setShowColumnManager,
  showFormattingPanel, setShowFormattingPanel,
  showSuggestionsPanel, setShowSuggestionsPanel,
  showActivityFeed, setShowActivityFeed,
  showComments, setShowComments,
  setShowBulkEdit,
  setShowImportModal,
  setShowAdvancedFilter,
  setShowExportDialog,
  setShowCharts,
  setShowReports,
  setShowShortcutsHelp,
  setShowFormulaBar,
  showFormulaBar,
  setShowMacroRecorder,
  setShowPrintPreview,
  autoFitColumns,
  sizeToFit,
  toggleFullscreen,
  handleSearchResults,
  handleClearAdvancedFilter
}) => {
  const [expandedGroup, setExpandedGroup] = useState(null)
  const [showThemePanel, setShowThemePanel] = useState(false)
  const { currentTheme, themes } = useTheme()

  const toggleGroup = (groupName) => {
    setExpandedGroup(expandedGroup === groupName ? null : groupName)
  }

  return (
    <div className={`spreadsheet-toolbar ${toolbarCollapsed ? 'collapsed' : ''}`}>
      {/* Collapse Toggle Button */}
      <button 
        className="toolbar-collapse-btn"
        onClick={() => setToolbarCollapsed(!toolbarCollapsed)}
        title={toolbarCollapsed ? 'Expand Toolbar (Alt+T)' : 'Collapse Toolbar (Alt+T)'}
      >
        {toolbarCollapsed ? '»' : '«'}
      </button>

      {/* Section 1: Title & Info */}
      <div className="toolbar-section toolbar-info">
        <h1 className="toolbar-title">📊 Spreadsheet View</h1>
        <div className="info-badges">
          <span className="badge badge-sites">
            {searchQuery
              ? `${filteredData?.length || 0} / ${rowData.length}`
              : rowData.length} sites
          </span>
          {!toolbarCollapsed && (
            <>
              <span className="badge badge-columns">
                {ALL_COLUMNS.length - hiddenColumns.length}/{ALL_COLUMNS.length} columns
              </span>
              {currentView && (
                <span className="badge badge-view" title={`Active view: ${currentView.name}`}>
                  {currentView.icon} {currentView.name}
                </span>
              )}
            </>
          )}
          {selectedRows.length > 0 && (
            <span className="badge badge-selected">
              {selectedRows.length} selected
            </span>
          )}
        </div>
      </div>

      {/* Section 2: Search - Always Visible */}
      <div className="toolbar-section toolbar-search">
        <SmartSearch
          data={rowData}
          onSearchResults={handleSearchResults}
          columns={null}
        />
      </div>

      {/* Section 3: Tool Groups - Hidden when collapsed */}
      {!toolbarCollapsed && (
        <div className="toolbar-section toolbar-groups">

        {/* Group 1: Display */}
        <div className="tool-group">
          <div className="group-header" onClick={() => toggleGroup('display')}>
            <span className="group-icon">👁️</span>
            <span className="group-label">Display</span>
          </div>
          <div className={`group-content ${expandedGroup === 'display' ? 'expanded' : ''}`}>
            <div className="control-row">
              <span className="control-label">Density:</span>
              <div className="density-buttons">
                <button
                  onClick={() => setDensity('comfortable')}
                  className={`btn-sm ${density === 'comfortable' ? 'active' : ''}`}
                  title="Comfortable"
                >Comfort</button>
                <button
                  onClick={() => setDensity('compact')}
                  className={`btn-sm ${density === 'compact' ? 'active' : ''}`}
                  title="Compact"
                >Compact</button>
                <button
                  onClick={() => setDensity('dense')}
                  className={`btn-sm ${density === 'dense' ? 'active' : ''}`}
                  title="Dense"
                >Dense</button>
              </div>
            </div>
            <div className="control-row">
              <span className="control-label">Font:</span>
              <div className="font-buttons">
                <button onClick={() => setFontSize(s => Math.max(11, s - 1))} className="btn-sm">−</button>
                <span className="font-value">{fontSize}</span>
                <button onClick={() => setFontSize(s => Math.min(16, s + 1))} className="btn-sm">+</button>
              </div>
            </div>
            <div className="control-row">
              <button
                onClick={() => setShowStats(!showStats)}
                className={`btn-tool ${showStats ? 'active' : ''}`}
              >📈 Statistics</button>
              <button onClick={toggleFullscreen} className="btn-tool">
                {isFullscreen ? '⛶ Exit' : '⛶ Fullscreen'}
              </button>
              {!isDetached && window.electron && (
                <button
                  onClick={onDetachWindow}
                  className="btn-tool btn-detach"
                  title="Open in separate window"
                >
                  🗗 Detach
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Group 2: Columns & Views */}
        <div className="tool-group">
          <div className="group-header" onClick={() => toggleGroup('columns')}>
            <span className="group-icon">☰</span>
            <span className="group-label">Columns</span>
          </div>
          <div className={`group-content ${expandedGroup === 'columns' ? 'expanded' : ''}`}>
            <button
              onClick={() => setShowColumnManager(!showColumnManager)}
              className={`btn-tool ${showColumnManager ? 'active' : ''}`}
            >☰ Column Manager</button>
            <button
              onClick={() => setShowViewsManager(!showViewsManager)}
              className={`btn-tool ${showViewsManager ? 'active' : ''} ${currentView ? 'has-view' : ''}`}
            >💾 Saved Views</button>
            <button onClick={autoFitColumns} className="btn-tool">📏 Auto-fit</button>
            <button onClick={sizeToFit} className="btn-tool">⇔ Fit Screen</button>
          </div>
        </div>

        {/* Group 3: Filter */}
        <div className="tool-group">
          <div className="group-header" onClick={() => toggleGroup('filter')}>
            <span className="group-icon">🔍</span>
            <span className="group-label">Filter</span>
            {activeFilter && <span className="group-badge">Active</span>}
          </div>
          <div className={`group-content ${expandedGroup === 'filter' ? 'expanded' : ''}`}>
            <button
              onClick={() => setShowAdvancedFilter(true)}
              className={`btn-tool ${activeFilter ? 'active' : ''}`}
            >
              🔍 Advanced Filter
            </button>
            {activeFilter && (
              <button
                onClick={handleClearAdvancedFilter}
                className="btn-tool btn-danger"
              >✕ Clear Filter</button>
            )}
          </div>
        </div>

        {/* Group 4: Edit */}
        <div className="tool-group">
          <div className="group-header" onClick={() => toggleGroup('edit')}>
            <span className="group-icon">✏️</span>
            <span className="group-label">Edit</span>
            {selectedRows.length > 0 && <span className="group-badge">{selectedRows.length}</span>}
          </div>
          <div className={`group-content ${expandedGroup === 'edit' ? 'expanded' : ''}`}>
            <button
              onClick={() => setShowBulkEdit(true)}
              className={`btn-tool ${selectedRows.length > 0 ? 'has-selection' : ''}`}
              disabled={selectedRows.length === 0}
            >
              📝 Bulk Edit
              {selectedRows.length > 0 && <span className="count">({selectedRows.length})</span>}
            </button>
            <button
              onClick={() => setShowFormattingPanel(!showFormattingPanel)}
              className={`btn-tool ${showFormattingPanel ? 'active' : ''}`}
            >🎨 Conditional Format</button>
          </div>
        </div>

        {/* Group 5: Import/Export */}
        <div className="tool-group">
          <div className="group-header" onClick={() => toggleGroup('io')}>
            <span className="group-icon">📂</span>
            <span className="group-label">Files</span>
          </div>
          <div className={`group-content ${expandedGroup === 'io' ? 'expanded' : ''}`}>
            <button onClick={() => setShowImportModal(true)} className="btn-tool">
              📤 Import Excel
            </button>
            <button onClick={() => setShowExportDialog(true)} className="btn-tool btn-primary">
              📥 Export
            </button>
            <button onClick={() => setShowReports(true)} className="btn-tool">
              📄 PDF Report
            </button>
            <button onClick={() => setShowPrintPreview(true)} className="btn-tool">
              🖨️ Print
            </button>
          </div>
        </div>

        {/* Group 6: Charts */}
        <div className="tool-group">
          <div className="group-header" onClick={() => toggleGroup('charts')}>
            <span className="group-icon">📊</span>
            <span className="group-label">Charts</span>
          </div>
          <div className={`group-content ${expandedGroup === 'charts' ? 'expanded' : ''}`}>
            <button onClick={() => setShowCharts(true)} className="btn-tool">
              📊 Create Chart
            </button>
          </div>
        </div>

        {/* Group 7: Smart Tools */}
        <div className="tool-group">
          <div className="group-header" onClick={() => toggleGroup('smart')}>
            <span className="group-icon">🤖</span>
            <span className="group-label">Smart</span>
            {hasNewSuggestions && <span className="group-badge pulse">{suggestions?.length || 0}</span>}
          </div>
          <div className={`group-content ${expandedGroup === 'smart' ? 'expanded' : ''}`}>
            <button
              onClick={() => setShowSuggestionsPanel(!showSuggestionsPanel)}
              className={`btn-tool ${showSuggestionsPanel ? 'active' : ''} ${hasNewSuggestions ? 'has-new' : ''}`}
            >
              🤖 AI Suggestions
              {hasNewSuggestions && <span className="count">({suggestions?.length || 0})</span>}
            </button>
            <button
              onClick={() => setShowFormulaBar(prev => !prev)}
              className={`btn-tool ${showFormulaBar ? 'active' : ''}`}
            >ƒx Formulas</button>
            <button onClick={() => setShowMacroRecorder(true)} className="btn-tool">
              ⏺️ Macros
            </button>
            <button onClick={() => setShowShortcutsHelp(true)} className="btn-tool">
              ⌨️ Shortcuts
            </button>
          </div>
        </div>

        {/* Group 8: Collaboration */}
        <div className="tool-group">
          <div className="group-header" onClick={() => toggleGroup('collab')}>
            <span className="group-icon">👥</span>
            <span className="group-label">Collab</span>
            {onlineUsers?.filter(u => u.status === 'online').length > 0 && (
              <span className="group-badge online">
                {onlineUsers.filter(u => u.status === 'online').length}
              </span>
            )}
          </div>
          <div className={`group-content ${expandedGroup === 'collab' ? 'expanded' : ''}`}>
            <button
              onClick={() => setShowActivityFeed(!showActivityFeed)}
              className={`btn-tool ${showActivityFeed ? 'active' : ''}`}
            >📋 Activity Feed</button>
            <button
              onClick={() => setShowComments(!showComments)}
              className={`btn-tool ${showComments ? 'active' : ''}`}
            >💬 Comments</button>
            <div className="online-users-wrapper">
              <OnlineUsers
                currentUser={currentUser}
                compact={true}
                onUserClick={(user) => console.log('User clicked:', user)}
              />
            </div>
          </div>
        </div>

        {/* Group 9: Theme */}
        <div className="tool-group theme-group">
          <div className="group-header" onClick={() => toggleGroup('theme')}>
            <span className="group-icon">{themes[currentTheme]?.icon || '🎨'}</span>
            <span className="group-label">Theme</span>
          </div>
          <div className={`group-content ${expandedGroup === 'theme' ? 'expanded' : ''}`}>
            <div className="theme-quick-select">
              <ThemeSwitcher compact={true} />
            </div>
            <button
              onClick={() => setShowThemePanel(!showThemePanel)}
              className={`btn-tool ${showThemePanel ? 'active' : ''}`}
            >
              🎨 Customize
            </button>
          </div>
          {/* Full Theme Panel (Popup) */}
          {showThemePanel && (
            <div className="theme-panel-popup">
              <ThemeSwitcher onClose={() => setShowThemePanel(false)} />
            </div>
          )}
        </div>

      </div>
      )}
    </div>
  )
}

export default SpreadsheetToolbar
