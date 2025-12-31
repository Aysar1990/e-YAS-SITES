/**
 * ExportDialog - Modal dialog for export options
 * Allows customization of export format, columns, and row selection
 */

import React, { useState, useMemo } from 'react'
import { exportFormats, exportData, getExportStats } from '../utils/exportUtils'
import './ExportDialog.css'

const ExportDialog = ({ data, columns, selectedRows, onClose }) => {
  const [format, setFormat] = useState(exportFormats.EXCEL_VISIBLE)
  const [fileName, setFileName] = useState('TSSR_Export')
  const [includeHidden, setIncludeHidden] = useState(false)
  const [exportSelected, setExportSelected] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Calculate export statistics
  const stats = useMemo(() => {
    return getExportStats(
      data,
      columns,
      exportSelected && selectedRows?.length > 0 ? selectedRows : null,
      includeHidden
    )
  }, [data, columns, selectedRows, exportSelected, includeHidden])

  // Format options configuration
  const formatOptions = [
    {
      value: exportFormats.EXCEL_VISIBLE,
      label: 'Excel (.xlsx) - Visible Columns',
      icon: 'XLS',
      description: 'Microsoft Excel format with currently visible columns'
    },
    {
      value: exportFormats.EXCEL_ALL,
      label: 'Excel (.xlsx) - All Columns',
      icon: 'XLS',
      description: 'Microsoft Excel format including hidden columns'
    },
    {
      value: exportFormats.CSV_VISIBLE,
      label: 'CSV - Visible Columns',
      icon: 'CSV',
      description: 'Comma-separated values, compatible with most apps'
    },
    {
      value: exportFormats.JSON,
      label: 'JSON',
      icon: 'JSON',
      description: 'JSON format for developers and integrations'
    }
  ]

  // Handle export action
  const handleExport = async () => {
    if (!fileName.trim()) {
      alert('Please enter a file name')
      return
    }

    setIsExporting(true)

    try {
      // Determine columns to export
      const columnsToExport = includeHidden
        ? columns
        : columns.filter(col => !col.hide)

      // Determine rows to export
      const rowsToExport = exportSelected && selectedRows?.length > 0
        ? selectedRows
        : null

      const success = exportData(data, columnsToExport, format, {
        fileName: fileName.trim(),
        selectedRows: rowsToExport,
        includeHidden
      })

      if (success) {
        onClose()
      } else {
        alert('Export failed. Please try again.')
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Export failed: ' + error.message)
    } finally {
      setIsExporting(false)
    }
  }

  // Handle overlay click to close
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const hiddenColCount = columns.filter(c => c.hide).length

  return (
    <div className="export-dialog-overlay" onClick={handleOverlayClick}>
      <div className="export-dialog">
        <div className="dialog-header">
          <h3>Export Data</h3>
          <button onClick={onClose} className="btn-close" title="Close">
            &times;
          </button>
        </div>

        <div className="dialog-body">
          {/* File Name Input */}
          <div className="form-group">
            <label htmlFor="fileName">File Name</label>
            <div className="file-name-wrapper">
              <input
                id="fileName"
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="file-name-input"
                placeholder="Enter file name..."
                maxLength={100}
              />
              <span className="file-extension">
                {format.includes('excel') ? '.xlsx' : format === 'json' ? '.json' : '.csv'}
              </span>
            </div>
          </div>

          {/* Format Selection */}
          <div className="form-group">
            <label>Export Format</label>
            <div className="format-options">
              {formatOptions.map(opt => (
                <label
                  key={opt.value}
                  className={`format-option ${format === opt.value ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="format"
                    value={opt.value}
                    checked={format === opt.value}
                    onChange={(e) => setFormat(e.target.value)}
                  />
                  <span className="format-icon">{opt.icon}</span>
                  <div className="format-info">
                    <span className="format-label">{opt.label}</span>
                    <span className="format-desc">{opt.description}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Export Options */}
          <div className="form-group">
            <label>Options</label>

            {hiddenColCount > 0 && (
              <label className="checkbox-option">
                <input
                  type="checkbox"
                  checked={includeHidden}
                  onChange={(e) => setIncludeHidden(e.target.checked)}
                />
                <span>Include hidden columns ({hiddenColCount} hidden)</span>
              </label>
            )}

            {selectedRows && selectedRows.length > 0 && (
              <label className="checkbox-option highlight">
                <input
                  type="checkbox"
                  checked={exportSelected}
                  onChange={(e) => setExportSelected(e.target.checked)}
                />
                <span>Export selected rows only ({selectedRows.length} selected)</span>
              </label>
            )}
          </div>

          {/* Export Summary Statistics */}
          <div className="export-stats">
            <h4>Export Summary</h4>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Rows</span>
                <span className="stat-value">{stats.rowCount.toLocaleString()}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Columns</span>
                <span className="stat-value">{stats.colCount} / {stats.totalCols}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Est. Size</span>
                <span className="stat-value">{stats.estimatedSize}</span>
              </div>
            </div>

            {stats.hiddenCols > 0 && !includeHidden && (
              <div className="stat-warning">
                ! {stats.hiddenCols} hidden columns will be excluded
              </div>
            )}

            {stats.selectedOnly && (
              <div className="stat-info">
                Exporting {stats.rowCount} of {stats.totalRows} rows (selected only)
              </div>
            )}
          </div>
        </div>

        <div className="dialog-footer">
          <button onClick={onClose} className="btn-cancel" disabled={isExporting}>
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="btn-export"
            disabled={isExporting || !fileName.trim()}
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ExportDialog
