/**
 * useSpreadsheetState Hook
 * Centralized state management for SpreadsheetView
 * Extracted from SpreadsheetView.jsx (1116 lines -> modular)
 */

import { useState, useMemo, useEffect } from 'react'
import { loadRulesFromStorage } from '../utils/formattingRules'
import { getValidationEngine } from '../utils/validation'

// Get or create current user from localStorage
const getOrCreateCurrentUser = () => {
  const stored = localStorage.getItem('tssr_current_user')
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      // Ignore parse errors
    }
  }
  // Generate temporary user for demo
  const tempUser = {
    id: `user_${Date.now()}`,
    name: `مستخدم ${Math.floor(Math.random() * 1000)}`
  }
  localStorage.setItem('tssr_current_user', JSON.stringify(tempUser))
  return tempUser
}

/**
 * Hook for managing all SpreadsheetView state
 */
export const useSpreadsheetState = () => {
  // Core Data State
  const [rowData, setRowData] = useState([])
  const [quickFilter, setQuickFilter] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Layout Controls - Maximize workspace
  const [toolbarCollapsed, setToolbarCollapsed] = useState(() => {
    const saved = localStorage.getItem('tssr_toolbar_collapsed')
    return saved === 'true'
  })
  const [shortcutsBarVisible, setShortcutsBarVisible] = useState(() => {
    const saved = localStorage.getItem('tssr_shortcuts_visible')
    return saved !== 'false' // Default true
  })

  // Save layout preferences
  useEffect(() => {
    localStorage.setItem('tssr_toolbar_collapsed', toolbarCollapsed.toString())
  }, [toolbarCollapsed])
  
  useEffect(() => {
    localStorage.setItem('tssr_shortcuts_visible', shortcutsBarVisible.toString())
  }, [shortcutsBarVisible])

  // View Controls
  const [density, setDensity] = useState('comfortable') // comfortable, compact, dense
  const [fontSize, setFontSize] = useState(13) // 11-16
  const [showColumnManager, setShowColumnManager] = useState(false)
  const [hiddenColumns, setHiddenColumns] = useState([])

  // Phase 1: Stats & Freeze
  const [showStats, setShowStats] = useState(false)
  const [pinnedColumns, setPinnedColumns] = useState(['site_id'])

  // Phase 2: Views & Search
  const [showViewsManager, setShowViewsManager] = useState(false)
  const [filteredData, setFilteredData] = useState(null)
  const [searchQuery, setSearchQuery] = useState(null)

  // Phase 3: Export & History
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showHistoryPanel, setShowHistoryPanel] = useState(false)
  const [selectedCell, setSelectedCell] = useState(null)
  const [selectedRows, setSelectedRows] = useState([])

  // Phase 4: Formatting & Suggestions
  const [formattingRules, setFormattingRules] = useState(() => loadRulesFromStorage())
  const [showFormattingPanel, setShowFormattingPanel] = useState(false)
  const [showSuggestionsPanel, setShowSuggestionsPanel] = useState(false)

  // Phase 5: Collaboration
  const [showActivityFeed, setShowActivityFeed] = useState(false)
  const [showOnlineUsers, setShowOnlineUsers] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [selectedSiteForComments, setSelectedSiteForComments] = useState(null)
  const [onlineUsers, setOnlineUsers] = useState([])
  const [currentUser] = useState(getOrCreateCurrentUser)

  // Phase 6: Data Management
  const [showBulkEdit, setShowBulkEdit] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false)
  const [validationErrors, setValidationErrors] = useState({})
  const [activeFilter, setActiveFilter] = useState(null)

  // Phase 7: Visualization
  const [showCharts, setShowCharts] = useState(false)
  const [showReports, setShowReports] = useState(false)

  // Phase 8: Power Features
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false)
  const [showFormulaBar, setShowFormulaBar] = useState(false)
  const [showMacroRecorder, setShowMacroRecorder] = useState(false)

  // Phase 9: Mobile & Print
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  )
  const [showPrintPreview, setShowPrintPreview] = useState(false)

  // Mobile detection effect
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Validation Engine (memoized)
  const validationEngine = useMemo(() => getValidationEngine(), [])

  // Density settings
  const densitySettings = useMemo(() => ({
    comfortable: { rowHeight: 40, headerHeight: 50, fontSize: 14 },
    compact: { rowHeight: 32, headerHeight: 42, fontSize: 13 },
    dense: { rowHeight: 26, headerHeight: 36, fontSize: 12 }
  }), [])

  const currentDensity = densitySettings[density]

  return {
    // Core Data
    rowData, setRowData,
    quickFilter, setQuickFilter,
    isFullscreen, setIsFullscreen,

    // Layout Controls
    toolbarCollapsed, setToolbarCollapsed,
    shortcutsBarVisible, setShortcutsBarVisible,

    // View Controls
    density, setDensity,
    fontSize, setFontSize,
    showColumnManager, setShowColumnManager,
    hiddenColumns, setHiddenColumns,

    // Phase 1
    showStats, setShowStats,
    pinnedColumns, setPinnedColumns,

    // Phase 2
    showViewsManager, setShowViewsManager,
    filteredData, setFilteredData,
    searchQuery, setSearchQuery,

    // Phase 3
    showExportDialog, setShowExportDialog,
    showHistoryPanel, setShowHistoryPanel,
    selectedCell, setSelectedCell,
    selectedRows, setSelectedRows,

    // Phase 4
    formattingRules, setFormattingRules,
    showFormattingPanel, setShowFormattingPanel,
    showSuggestionsPanel, setShowSuggestionsPanel,

    // Phase 5
    showActivityFeed, setShowActivityFeed,
    showOnlineUsers, setShowOnlineUsers,
    showComments, setShowComments,
    selectedSiteForComments, setSelectedSiteForComments,
    onlineUsers, setOnlineUsers,
    currentUser,

    // Phase 6
    showBulkEdit, setShowBulkEdit,
    showImportModal, setShowImportModal,
    showAdvancedFilter, setShowAdvancedFilter,
    validationErrors, setValidationErrors,
    activeFilter, setActiveFilter,
    validationEngine,

    // Phase 7: Visualization
    showCharts, setShowCharts,
    showReports, setShowReports,

    // Phase 8: Power Features
    showShortcutsHelp, setShowShortcutsHelp,
    showFormulaBar, setShowFormulaBar,
    showMacroRecorder, setShowMacroRecorder,

    // Phase 9: Mobile & Print
    isMobile, setIsMobile,
    showPrintPreview, setShowPrintPreview,

    // Computed
    currentDensity,
    densitySettings
  }
}

export default useSpreadsheetState
