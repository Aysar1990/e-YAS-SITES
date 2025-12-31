/**
 * useSitesHandlers Hook
 * All handler functions for Sites page
 * Extracted from Sites.jsx
 */

import { useCallback } from 'react'
import { exportToExcelDownload } from '../../../services/exportService'
import { mapLocalToFirebase } from '../../../components/Sites'

/**
 * Hook for all Sites page handlers
 * @param {Object} params - Handler dependencies
 */
export const useSitesHandlers = ({
  // Firebase
  useFirebase,
  firebaseConnected,
  updateFirebaseSite,
  firebaseSites,
  activePhase,
  // Data
  sites,
  searchFilteredSites,
  sortedSites,
  statusFilter,
  // State setters
  selectedSites,
  setSelectedSites,
  setExporting,
  setEditModalOpen,
  setSelectedSite,
  setDeleteModalOpen,
  setAssignModalOpen,
  setAssignType,
  // Batch operations
  batchDelete,
  batchStatusUpdate,
  batchAssignContractor,
  batchPriorityUpdate,
  // User
  canEdit
}) => {

  // Save site handler
  const handleSaveSite = useCallback(async (siteId, updates) => {
    if (useFirebase) {
      return await updateFirebaseSite(siteId, updates)
    }
    return { success: false, error: 'Local editing not implemented' }
  }, [useFirebase, updateFirebaseSite])

  // Edit site handler
  const handleEditSite = useCallback((site, e) => {
    e?.stopPropagation?.()
    setSelectedSite(mapLocalToFirebase(site))
    setEditModalOpen(true)
  }, [setSelectedSite, setEditModalOpen])

  // Clear selection
  const handleClearSelection = useCallback(() => {
    setSelectedSites(new Set())
  }, [setSelectedSites])

  // Bulk update handler
  const handleBulkUpdate = useCallback(async (newStatus) => {
    if (!useFirebase || !firebaseConnected) {
      alert('Bulk update requires Firebase connection')
      return
    }

    const siteIds = Array.from(selectedSites)
    let successCount = 0
    let failCount = 0

    for (const siteId of siteIds) {
      const idString = String(siteId)
      const result = await updateFirebaseSite(idString, { tssr_overall_status: newStatus })
      if (result.success) {
        successCount++
      } else {
        failCount++
      }
    }

    alert(`Bulk Update Complete.\nSuccess: ${successCount}\nFailed: ${failCount}`)
    handleClearSelection()
  }, [useFirebase, firebaseConnected, selectedSites, updateFirebaseSite, handleClearSelection])

  // Export handlers
  const handleExport = useCallback(async () => {
    if (!canEdit) {
      alert('Only Admin users can export data')
      return
    }
    if (!useFirebase || !firebaseConnected) {
      alert('Please enable Firebase mode to export data')
      return
    }
    if (firebaseSites.length === 0) {
      alert('No data to export')
      return
    }
    setExporting(true)
    try {
      const result = await exportToExcelDownload(firebaseSites, activePhase, () => {})
      if (result.success) {
        alert(`Exported ${result.sitesCount} sites to ${result.filename}`)
      } else {
        alert(`Export failed: ${result.error}`)
      }
    } catch (error) {
      alert(`Export error: ${error.message}`)
    }
    setExporting(false)
  }, [canEdit, useFirebase, firebaseConnected, firebaseSites, activePhase, setExporting])

  // Full report export
  const handleExportFull = useCallback(async () => {
    if (!canEdit || sites.length === 0) return
    setExporting(true)
    try {
      if (window.electron?.generateFullReport) {
        const result = await window.electron.generateFullReport(sites)
        if (result.success) {
          const openFile = window.confirm(
            `Full report generated successfully!\n\nFile: ${result.path}\nSheets: ${result.sheetsCreated}\nRows: ${result.totalRows}\n\nOpen the file now?`
          )
          if (openFile && window.electron?.openExportedFile) {
            await window.electron.openExportedFile(result.path)
          }
        } else {
          alert(`Export failed: ${result.error}`)
        }
      } else {
        alert('Full report export requires Electron mode')
      }
    } catch (error) {
      alert(`Export error: ${error.message}`)
    }
    setExporting(false)
  }, [canEdit, sites, setExporting])

  // Phase report export
  const handleExportPhase = useCallback(async () => {
    if (!canEdit || sites.length === 0) return
    setExporting(true)
    try {
      if (window.electron?.generatePhaseReport) {
        const result = await window.electron.generatePhaseReport(sites, activePhase)
        if (result.success) {
          const openFile = window.confirm(
            `Phase ${activePhase} report generated!\n\nFile: ${result.path}\nRows: ${result.totalRows}\n\nOpen the file now?`
          )
          if (openFile && window.electron?.openExportedFile) {
            await window.electron.openExportedFile(result.path)
          }
        } else {
          alert(`Export failed: ${result.error}`)
        }
      } else {
        alert('Phase report export requires Electron mode')
      }
    } catch (error) {
      alert(`Export error: ${error.message}`)
    }
    setExporting(false)
  }, [canEdit, sites, activePhase, setExporting])

  // Filtered data export
  const handleExportFiltered = useCallback(async () => {
    if (!canEdit || searchFilteredSites.length === 0) return
    setExporting(true)
    try {
      if (window.electron?.generateCustomReport) {
        const config = {
          filters: {
            status: statusFilter !== 'all' ? [statusFilter] : [],
            phase: activePhase && activePhase !== 'ALL' ? [activePhase] : []
          },
          columns: [],
          groupBy: null
        }
        const result = await window.electron.generateCustomReport(searchFilteredSites, config)
        if (result.success) {
          const openFile = window.confirm(
            `Filtered data exported!\n\nFile: ${result.path}\nRows: ${result.totalRows}\n\nOpen the file now?`
          )
          if (openFile && window.electron?.openExportedFile) {
            await window.electron.openExportedFile(result.path)
          }
        } else {
          alert(`Export failed: ${result.error}`)
        }
      } else {
        alert('Custom report export requires Electron mode')
      }
    } catch (error) {
      alert(`Export error: ${error.message}`)
    }
    setExporting(false)
  }, [canEdit, searchFilteredSites, statusFilter, activePhase, setExporting])

  // Export selected sites
  const handleExportSelected = useCallback(async () => {
    if (selectedSites.size === 0) return

    const selectedSitesData = searchFilteredSites.filter(site =>
      selectedSites.has(site.site_id)
    )

    setExporting(true)
    try {
      const result = await exportToExcelDownload(selectedSitesData, 'Selected_Sites', () => {})
      if (result.success) {
        alert(`Exported ${result.sitesCount} selected sites to ${result.filename}`)
      } else {
        alert(`Export failed: ${result.error}`)
      }
    } catch (error) {
      alert(`Export error: ${error.message}`)
    }
    setExporting(false)
  }, [selectedSites, searchFilteredSites, setExporting])

  // Batch operation handlers
  const handleBulkDelete = useCallback(() => {
    if (!useFirebase || !firebaseConnected) {
      alert('Bulk delete requires Firebase connection')
      return
    }
    setDeleteModalOpen(true)
  }, [useFirebase, firebaseConnected, setDeleteModalOpen])

  const confirmBulkDelete = useCallback(async () => {
    const siteIds = Array.from(selectedSites)
    setDeleteModalOpen(false)
    await batchDelete(siteIds)
    handleClearSelection()
  }, [selectedSites, setDeleteModalOpen, batchDelete, handleClearSelection])

  const handleBulkAssignContractor = useCallback(() => {
    setAssignType('contractor')
    setAssignModalOpen(true)
  }, [setAssignType, setAssignModalOpen])

  const handleBulkUpdateStatus = useCallback(() => {
    setAssignType('status')
    setAssignModalOpen(true)
  }, [setAssignType, setAssignModalOpen])

  const handleBulkUpdatePriority = useCallback(() => {
    setAssignType('priority')
    setAssignModalOpen(true)
  }, [setAssignType, setAssignModalOpen])

  const confirmBulkAssign = useCallback(async (value, assignType) => {
    const siteIds = Array.from(selectedSites)
    setAssignModalOpen(false)

    if (assignType === 'contractor') {
      await batchAssignContractor(siteIds, value)
    } else if (assignType === 'status') {
      await batchStatusUpdate(siteIds, value)
    } else if (assignType === 'priority') {
      await batchPriorityUpdate(siteIds, value)
    }

    handleClearSelection()
  }, [selectedSites, setAssignModalOpen, batchAssignContractor, batchStatusUpdate, batchPriorityUpdate, handleClearSelection])

  return {
    handleSaveSite,
    handleEditSite,
    handleClearSelection,
    handleBulkUpdate,
    handleExport,
    handleExportFull,
    handleExportPhase,
    handleExportFiltered,
    handleExportSelected,
    handleBulkDelete,
    confirmBulkDelete,
    handleBulkAssignContractor,
    handleBulkUpdateStatus,
    handleBulkUpdatePriority,
    confirmBulkAssign
  }
}

export default useSitesHandlers
