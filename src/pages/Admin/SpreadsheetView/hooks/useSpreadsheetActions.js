/**
 * useSpreadsheetActions Hook
 * All action handlers for SpreadsheetView
 * Extracted from SpreadsheetView.jsx
 */

import { useCallback } from 'react'
import { ALL_COLUMNS } from '../columns'
import { logActivity } from '../components/ActivityFeed'
import { presenceService } from '../services/firebase/presence'

/**
 * Hook for all SpreadsheetView actions/handlers
 * @param {Object} state - State from useSpreadsheetState
 * @param {Object} refs - React refs (gridRef)
 * @param {Object} hooks - Custom hooks (recentChanges, cellHistory, savedViews)
 * @param {Object} firebase - Firebase utilities (useFirebase, updateFirebaseSite)
 */
export const useSpreadsheetActions = (state, refs, hooks, firebase) => {
  const { gridRef } = refs
  const {
    markChanged,
    addHistoryEntry,
    revertChange,
    applyView,
    createView,
    getCurrentConfig: getConfigFromHook
  } = hooks
  const { useFirebase, updateFirebaseSite } = firebase

  const {
    rowData, setRowData,
    setQuickFilter,
    setIsFullscreen,
    setHiddenColumns,
    setPinnedColumns,
    setFilteredData,
    setSearchQuery,
    setSelectedCell,
    setSelectedRows,
    setShowHistoryPanel,
    setShowViewsManager,
    setShowSuggestionsPanel,
    setShowComments,
    setSelectedSiteForComments,
    setActiveFilter,
    setShowAdvancedFilter,
    hiddenColumns,
    pinnedColumns,
    density,
    currentUser
  } = state

  // ==================== Grid Actions ====================

  // Export to Excel
  const onExportExcel = useCallback(() => {
    gridRef.current?.api?.exportDataAsExcel({
      fileName: `TSSR_Data_${new Date().toISOString().split('T')[0]}.xlsx`
    })
  }, [gridRef])

  // Auto-fit columns
  const autoFitColumns = useCallback(() => {
    if (gridRef.current?.api) {
      const allColumnIds = gridRef.current.api.getColumns()
        .filter(col => !col.colDef.hide)
        .map(col => col.getColId())
      gridRef.current.api.autoSizeColumns(allColumnIds)
    }
  }, [gridRef])

  // Size columns to fit
  const sizeToFit = useCallback(() => {
    gridRef.current?.api?.sizeColumnsToFit()
  }, [gridRef])

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev)
  }, [setIsFullscreen])

  // ==================== Column Actions ====================

  // Toggle column visibility
  const toggleColumn = useCallback((field) => {
    setHiddenColumns(prev =>
      prev.includes(field)
        ? prev.filter(f => f !== field)
        : [...prev, field]
    )
  }, [setHiddenColumns])

  // Show all columns
  const showAllColumns = useCallback(() => {
    setHiddenColumns([])
  }, [setHiddenColumns])

  // Hide all except essential
  const showEssentialOnly = useCallback(() => {
    const essential = ['site_id', 'final_site_name', 'governorate', 'tssr_overall_status',
                       'ti_status', 'rf_plan_status', 'rf_optim_status', 'civil_status']
    setHiddenColumns(ALL_COLUMNS.map(c => c.field).filter(f => !essential.includes(f)))
  }, [setHiddenColumns])

  // Toggle freeze column
  const toggleFreeze = useCallback((field) => {
    setPinnedColumns(prev =>
      prev.includes(field)
        ? prev.filter(f => f !== field)
        : [...prev, field]
    )
  }, [setPinnedColumns])

  // ==================== Cell/Row Handlers ====================

  // Cell value changed
  const onCellValueChanged = useCallback(async (params) => {
    const { data, colDef } = params
    const field = colDef.field
    const oldValue = params.oldValue
    const newValue = params.newValue

    if (oldValue === newValue) return

    // Record change in history
    addHistoryEntry(data.site_id, field, oldValue, newValue)

    // Mark cell as recently changed
    markChanged(data.site_id, field)

    // Log activity
    logActivity({
      type: field.includes('status') ? 'status_change' : 'edit',
      siteId: data.site_id,
      siteName: data.final_site_name || data.site_id,
      userId: currentUser?.id,
      userName: currentUser?.name,
      details: {
        field,
        fieldLabel: colDef.headerName,
        oldValue,
        newValue
      }
    })

    if (useFirebase) {
      try {
        await updateFirebaseSite(data.site_id, { [field]: newValue })
      } catch (error) {
        console.error('Update failed:', error)
        params.node.setDataValue(field, oldValue)
      }
    }
  }, [useFirebase, updateFirebaseSite, markChanged, addHistoryEntry, currentUser])

  // Cell click for history panel (Ctrl+Click)
  const onCellClicked = useCallback((params) => {
    if (params.event.ctrlKey || params.event.metaKey) {
      const { data, colDef } = params
      if (data && colDef) {
        setSelectedCell({
          siteId: data.site_id,
          field: colDef.field,
          fieldLabel: colDef.headerName
        })
        setShowHistoryPanel(true)
      }
    }
  }, [setSelectedCell, setShowHistoryPanel])

  // Row selection change
  const onSelectionChanged = useCallback(() => {
    if (gridRef.current?.api) {
      const selected = gridRef.current.api.getSelectedRows()
      setSelectedRows(selected)
    }
  }, [gridRef, setSelectedRows])

  // Row double-click to open comments
  const onRowDoubleClicked = useCallback((params) => {
    const { data } = params
    if (data?.site_id) {
      setSelectedSiteForComments({ id: data.site_id, name: data.final_site_name || data.site_id })
      setShowComments(true)
      presenceService.setCurrentSite(data.site_id, data.final_site_name)
    }
  }, [setSelectedSiteForComments, setShowComments])

  // ==================== Filter/Search Actions ====================

  // Handle stat click for filtering
  const handleStatClick = useCallback((type, value) => {
    let filterValue = ''
    switch (type) {
      case 'all': filterValue = ''; break
      case 'approved': filterValue = 'Approved'; break
      case 'pending': filterValue = 'pending'; break
      case 'rejected': filterValue = 'Rejected'; break
      case 'gov': filterValue = value || ''; break
      default: filterValue = ''
    }
    setQuickFilter(filterValue)
  }, [setQuickFilter])

  // Handle search results from SmartSearch
  const handleSearchResults = useCallback((results, query) => {
    setFilteredData(results)
    setSearchQuery(query)
    setQuickFilter('')
  }, [setFilteredData, setSearchQuery, setQuickFilter])

  // ==================== Views Actions ====================

  // Get current grid configuration
  const getCurrentConfig = useCallback(() => {
    const visibleColumns = ALL_COLUMNS
      .filter(col => !hiddenColumns.includes(col.field))
      .map(col => col.field)

    return {
      visibleColumns,
      density,
      filters: null,
      sort: null,
      pinnedColumns: [...pinnedColumns]
    }
  }, [hiddenColumns, density, pinnedColumns])

  // Apply saved view
  const handleApplyView = useCallback((viewId) => {
    const config = applyView(viewId)
    if (!config) return

    if (config.visibleColumns && config.visibleColumns.length > 0) {
      const allFields = ALL_COLUMNS.map(c => c.field)
      const hidden = allFields.filter(f => !config.visibleColumns.includes(f))
      setHiddenColumns(hidden)
    }

    if (config.density) {
      state.setDensity(config.density)
    }

    if (config.pinnedColumns) {
      setPinnedColumns(config.pinnedColumns)
    }

    if (config.filters && gridRef.current?.api) {
      const filterValues = Object.values(config.filters).filter(Boolean)
      if (filterValues.length > 0) {
        setQuickFilter(filterValues[0])
      }
    }

    setShowViewsManager(false)
  }, [applyView, setHiddenColumns, setPinnedColumns, setQuickFilter, setShowViewsManager, gridRef, state])

  // Create new view
  const handleCreateView = useCallback((name, config, icon) => {
    const currentConfig = getCurrentConfig()
    createView(name, currentConfig, icon)
  }, [createView, getCurrentConfig])

  // ==================== History Actions ====================

  // Handle revert from history panel
  const handleRevert = useCallback((entryId) => {
    const revertedEntry = revertChange(entryId)
    if (revertedEntry && gridRef.current?.api) {
      gridRef.current.api.forEachNode(node => {
        if (node.data?.site_id === revertedEntry.siteId) {
          node.setDataValue(revertedEntry.field, revertedEntry.oldValue)
        }
      })
    }
  }, [revertChange, gridRef])

  // ==================== Suggestion Actions ====================

  // Handle suggestion action clicks
  const handleSuggestionAction = useCallback((filter, suggestion) => {
    if (!filter) return

    setShowSuggestionsPanel(false)

    switch (filter.type) {
      case 'smart':
        setSearchQuery(filter.query)
        if (filter.query) {
          setQuickFilter(filter.query.split(':').pop() || '')
        }
        break

      case 'field':
        if (filter.field && filter.value) {
          if (filter.negate) {
            const filtered = rowData.filter(row => row[filter.field] !== filter.value)
            setFilteredData(filtered)
            setSearchQuery(`${filter.field}:!${filter.value}`)
          } else {
            setQuickFilter(filter.value)
          }
        }
        break

      case 'combined':
        if (filter.filters && filter.filters.length > 0) {
          let filtered = [...rowData]
          filter.filters.forEach(f => {
            if (f.negate) {
              filtered = filtered.filter(row => row[f.field] !== f.value)
            } else {
              filtered = filtered.filter(row =>
                String(row[f.field] || '').toLowerCase().includes(String(f.value).toLowerCase())
              )
            }
          })
          setFilteredData(filtered)
          setSearchQuery('Combined filter applied')
        }
        break

      case 'custom':
        if (filter.predicate === 'quick_wins') {
          const deptFields = ['ti_status', 'rf_plan_status', 'rf_optim_status', 'civil_status']
          const quickWins = rowData.filter(site => {
            if (site.tssr_overall_status === 'Approved') return false
            const approvedDepts = deptFields.filter(field =>
              site[field]?.toLowerCase() === 'approved'
            ).length
            return approvedDepts >= 3
          })
          setFilteredData(quickWins)
          setSearchQuery('Quick wins: 3+ depts approved')
        }
        break

      default:
        if (typeof filter === 'string') {
          setQuickFilter(filter)
        }
    }
  }, [rowData, setShowSuggestionsPanel, setSearchQuery, setQuickFilter, setFilteredData])

  // ==================== Collaboration Actions ====================

  // Open comments for selected row
  const handleOpenComments = useCallback((siteId, siteName) => {
    setSelectedSiteForComments({ id: siteId, name: siteName })
    setShowComments(true)
    presenceService.setCurrentSite(siteId, siteName)
  }, [setSelectedSiteForComments, setShowComments])

  // Handle mention notification
  const handleMention = useCallback((userId, siteId, siteName, text) => {
    logActivity({
      type: 'mention',
      siteId,
      siteName,
      userId: currentUser?.id,
      userName: currentUser?.name,
      details: {
        mentionedUserId: userId,
        text: text.substring(0, 100)
      }
    })
  }, [currentUser])

  // ==================== Phase 6: Data Management Actions ====================

  // Handle bulk edit apply
  const handleBulkEditApply = useCallback(async (field, value, rows) => {
    if (!rows || rows.length === 0) return

    for (const row of rows) {
      if (gridRef.current?.api) {
        gridRef.current.api.forEachNode(node => {
          if (node.data?.site_id === row.site_id) {
            node.setDataValue(field, value)
          }
        })
      }

      if (useFirebase) {
        try {
          await updateFirebaseSite(row.site_id, { [field]: value })
        } catch (error) {
          console.error(`[BulkEdit] Failed to update ${row.site_id}:`, error)
        }
      }
    }

    logActivity({
      type: 'edit',
      siteId: 'bulk',
      siteName: `${rows.length} sites`,
      userId: currentUser?.id,
      userName: currentUser?.name,
      details: {
        field,
        newValue: value,
        rowCount: rows.length,
        isBulkEdit: true
      }
    })
  }, [gridRef, useFirebase, updateFirebaseSite, currentUser])

  // Handle import data
  const handleImportData = useCallback(async (importedRows) => {
    if (!importedRows || importedRows.length === 0) return { imported: 0 }

    let imported = 0
    let errors = 0

    for (const row of importedRows) {
      try {
        if (useFirebase && row.site_id) {
          await updateFirebaseSite(row.site_id, row)
          imported++
        } else {
          imported++
        }
      } catch (error) {
        console.error(`[Import] Failed to import row:`, error)
        errors++
      }
    }

    if (imported > 0) {
      logActivity({
        type: 'import',
        siteId: 'import',
        siteName: 'Excel Import',
        userId: currentUser?.id,
        userName: currentUser?.name,
        details: {
          count: imported,
          format: 'Excel'
        }
      })
    }

    return { imported, errors }
  }, [useFirebase, updateFirebaseSite, currentUser])

  // Handle advanced filter apply
  const handleAdvancedFilterApply = useCallback((filteredData, filterConfig) => {
    if (!filteredData) {
      setFilteredData(null)
      setSearchQuery(null)
      setActiveFilter(null)
      return
    }

    setFilteredData(filteredData)
    setSearchQuery(filterConfig?.name || 'Advanced Filter')
    setActiveFilter(filterConfig)
    setShowAdvancedFilter(false)
  }, [setFilteredData, setSearchQuery, setActiveFilter, setShowAdvancedFilter])

  // Clear advanced filter
  const handleClearAdvancedFilter = useCallback(() => {
    setFilteredData(null)
    setSearchQuery(null)
    setActiveFilter(null)
  }, [setFilteredData, setSearchQuery, setActiveFilter])

  return {
    // Grid Actions
    onExportExcel,
    autoFitColumns,
    sizeToFit,
    toggleFullscreen,

    // Column Actions
    toggleColumn,
    showAllColumns,
    showEssentialOnly,
    toggleFreeze,

    // Cell/Row Handlers
    onCellValueChanged,
    onCellClicked,
    onSelectionChanged,
    onRowDoubleClicked,

    // Filter/Search
    handleStatClick,
    handleSearchResults,

    // Views
    getCurrentConfig,
    handleApplyView,
    handleCreateView,

    // History
    handleRevert,

    // Suggestions
    handleSuggestionAction,

    // Collaboration
    handleOpenComments,
    handleMention,

    // Phase 6
    handleBulkEditApply,
    handleImportData,
    handleAdvancedFilterApply,
    handleClearAdvancedFilter
  }
}

export default useSpreadsheetActions
