/**
 * Enhanced export utilities for SpreadsheetView
 * Supports Excel, CSV, and JSON export formats
 */

import * as XLSX from 'xlsx'

export const exportFormats = {
  EXCEL_VISIBLE: 'excel_visible',
  EXCEL_ALL: 'excel_all',
  EXCEL_SELECTED: 'excel_selected',
  CSV_VISIBLE: 'csv_visible',
  CSV_ALL: 'csv_all',
  JSON: 'json'
}

/**
 * Export data with specified format and options
 * @param {Array} data - Row data to export
 * @param {Array} columns - Column definitions
 * @param {string} format - Export format from exportFormats
 * @param {Object} options - Export options
 */
export const exportData = (data, columns, format, options = {}) => {
  const {
    fileName = 'TSSR_Export',
    selectedRows = null,
    includeHidden = false
  } = options

  // Validate inputs
  if (!data || !Array.isArray(data) || data.length === 0) {
    console.error('No data to export')
    return false
  }

  if (!columns || !Array.isArray(columns) || columns.length === 0) {
    console.error('No columns defined for export')
    return false
  }

  // Filter data based on selection
  const dataToExport = selectedRows && selectedRows.length > 0
    ? data.filter(row => selectedRows.includes(row.site_id))
    : data

  // Filter columns based on visibility
  const columnsToExport = includeHidden
    ? columns
    : columns.filter(col => !col.hide)

  try {
    switch (format) {
      case exportFormats.EXCEL_VISIBLE:
      case exportFormats.EXCEL_ALL:
      case exportFormats.EXCEL_SELECTED:
        return exportToExcel(dataToExport, columnsToExport, fileName)

      case exportFormats.CSV_VISIBLE:
      case exportFormats.CSV_ALL:
        return exportToCSV(dataToExport, columnsToExport, fileName)

      case exportFormats.JSON:
        return exportToJSON(dataToExport, columnsToExport, fileName)

      default:
        console.error('Unknown export format:', format)
        return false
    }
  } catch (error) {
    console.error('Export failed:', error)
    return false
  }
}

/**
 * Export to Excel format (.xlsx)
 */
const exportToExcel = (data, columns, fileName) => {
  // Prepare headers
  const headers = columns.map(col => col.headerName || col.field)

  // Prepare data rows
  const rows = data.map(row =>
    columns.map(col => {
      const value = row[col.field]
      // Handle null/undefined
      if (value == null) return ''
      // Handle objects and arrays
      if (typeof value === 'object') return JSON.stringify(value)
      return value
    })
  )

  // Create worksheet data
  const wsData = [headers, ...rows]

  // Create workbook
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // Auto-size columns based on content
  const colWidths = columns.map((col, idx) => {
    const headerLen = (col.headerName || col.field).length
    // Find max content length in this column
    const maxContentLen = rows.reduce((max, row) => {
      const cellValue = String(row[idx] || '')
      return Math.max(max, cellValue.length)
    }, 0)
    return { wch: Math.min(Math.max(headerLen, maxContentLen, 10), 50) }
  })
  ws['!cols'] = colWidths

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'TSSR Data')

  // Generate file name with date
  const dateStr = new Date().toISOString().split('T')[0]
  const fullFileName = `${fileName}_${dateStr}.xlsx`

  // Download
  XLSX.writeFile(wb, fullFileName)
  return true
}

/**
 * Export to CSV format
 */
const exportToCSV = (data, columns, fileName) => {
  // Prepare headers
  const headers = columns.map(col => {
    const name = col.headerName || col.field
    // Escape quotes in headers
    return escapeCSVValue(name)
  })

  // Prepare data rows
  const rows = data.map(row =>
    columns.map(col => {
      const value = row[col.field]
      return escapeCSVValue(value)
    })
  )

  // Build CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  // Add BOM for Excel compatibility with UTF-8
  const BOM = '\uFEFF'
  const csvWithBOM = BOM + csvContent

  // Create blob and download
  const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  const dateStr = new Date().toISOString().split('T')[0]
  link.href = url
  link.download = `${fileName}_${dateStr}.csv`
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  return true
}

/**
 * Escape a value for CSV format
 */
const escapeCSVValue = (value) => {
  if (value == null) return ''
  if (typeof value === 'object') value = JSON.stringify(value)

  const strValue = String(value)

  // If value contains comma, newline, or quote, wrap in quotes
  if (strValue.includes(',') || strValue.includes('\n') || strValue.includes('"')) {
    // Escape existing quotes by doubling them
    return `"${strValue.replace(/"/g, '""')}"`
  }

  return strValue
}

/**
 * Export to JSON format
 */
const exportToJSON = (data, columns, fileName) => {
  // Build clean export data with only selected columns
  const exportData = data.map(row => {
    const obj = {}
    columns.forEach(col => {
      obj[col.field] = row[col.field] ?? null
    })
    return obj
  })

  // Create JSON with formatting
  const jsonContent = JSON.stringify(exportData, null, 2)

  // Create blob and download
  const blob = new Blob([jsonContent], { type: 'application/json' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  const dateStr = new Date().toISOString().split('T')[0]
  link.href = url
  link.download = `${fileName}_${dateStr}.json`
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  return true
}

/**
 * Get export statistics for preview
 * @param {Array} data - Full data array
 * @param {Array} columns - Column definitions
 * @param {Array|null} selectedRows - Selected row IDs
 * @param {boolean} includeHidden - Include hidden columns
 */
export const getExportStats = (data, columns, selectedRows = null, includeHidden = false) => {
  const visibleColumns = columns.filter(col => !col.hide)
  const hiddenColumns = columns.filter(col => col.hide)

  return {
    rowCount: selectedRows && selectedRows.length > 0 ? selectedRows.length : data.length,
    totalRows: data.length,
    colCount: includeHidden ? columns.length : visibleColumns.length,
    totalCols: columns.length,
    visibleCols: visibleColumns.length,
    hiddenCols: hiddenColumns.length,
    selectedOnly: !!(selectedRows && selectedRows.length > 0),
    estimatedSize: estimateFileSize(data.length, columns.length)
  }
}

/**
 * Estimate file size based on row and column count
 */
const estimateFileSize = (rowCount, colCount) => {
  // Rough estimate: ~100 bytes per cell
  const bytes = rowCount * colCount * 100
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default {
  exportFormats,
  exportData,
  getExportStats
}
