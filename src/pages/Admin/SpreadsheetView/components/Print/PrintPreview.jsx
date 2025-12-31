/**
 * PrintPreview - Print preview and settings modal
 * Phase 9: Mobile & Print
 *
 * Features:
 * - Live preview with iframe
 * - Paper/orientation settings
 * - Column selection
 * - Uses react-to-print
 */

import React, { useState, useRef, useMemo, useCallback } from 'react'
import { useReactToPrint } from 'react-to-print'
import PrintSettings from './PrintSettings'
import './Print.css'

// Default print columns
const DEFAULT_COLUMNS = [
  { key: 'site_id', label: 'Site ID', enabled: true },
  { key: 'site_name', label: 'اسم الموقع', enabled: true },
  { key: 'governorate', label: 'المحافظة', enabled: true },
  { key: 'tssr_status', label: 'حالة TSSR', enabled: true },
  { key: 'contractor', label: 'المقاول', enabled: true },
  { key: 'region', label: 'المنطقة', enabled: false },
  { key: 'part_of', label: 'جزء من', enabled: false },
  { key: 'dept_status', label: 'حالة القسم', enabled: false },
  { key: 'priority', label: 'الأولوية', enabled: false }
]

const PrintPreview = ({ data = [], onClose }) => {
  const printRef = useRef(null)

  // Print settings state
  const [settings, setSettings] = useState({
    orientation: 'landscape',
    paperSize: 'a4',
    includeHeader: true,
    includeFooter: true,
    includeStats: true,
    rowsPerPage: 30,
    columns: DEFAULT_COLUMNS
  })

  // Calculate stats
  const stats = useMemo(() => {
    const total = data.length
    const approved = data.filter(d =>
      d.tssr_status?.toLowerCase().includes('approved')
    ).length
    const pending = data.filter(d =>
      d.tssr_status?.toLowerCase().includes('pending') ||
      d.tssr_status?.toLowerCase().includes('under')
    ).length
    const rejected = data.filter(d =>
      d.tssr_status?.toLowerCase().includes('rejected') ||
      d.tssr_status?.toLowerCase().includes('rfi')
    ).length

    return { total, approved, pending, rejected }
  }, [data])

  // Get enabled columns
  const enabledColumns = useMemo(() =>
    settings.columns.filter(col => col.enabled),
    [settings.columns]
  )

  // Paginate data
  const pages = useMemo(() => {
    const result = []
    for (let i = 0; i < data.length; i += settings.rowsPerPage) {
      result.push(data.slice(i, i + settings.rowsPerPage))
    }
    return result
  }, [data, settings.rowsPerPage])

  // Print handler
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `TSSR_Report_${new Date().toISOString().slice(0, 10)}`,
    pageStyle: `
      @page {
        size: ${settings.paperSize} ${settings.orientation};
        margin: 10mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `
  })

  // Update setting
  const updateSetting = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }, [])

  // Toggle column
  const toggleColumn = useCallback((columnKey) => {
    setSettings(prev => ({
      ...prev,
      columns: prev.columns.map(col =>
        col.key === columnKey ? { ...col, enabled: !col.enabled } : col
      )
    }))
  }, [])

  // Get current date
  const currentDate = new Date().toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="print-preview-overlay" onClick={onClose}>
      <div className="print-preview-panel" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="print-header">
          <h2>🖨️ معاينة الطباعة</h2>
          <div className="print-actions">
            <button className="btn-print" onClick={handlePrint}>
              🖨️ طباعة
            </button>
            <button className="btn-close" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="print-content">
          {/* Settings Panel */}
          <PrintSettings
            settings={settings}
            onUpdateSetting={updateSetting}
            onToggleColumn={toggleColumn}
          />

          {/* Preview Area */}
          <div className="preview-area">
            <div
              className={`preview-container ${settings.orientation}`}
              style={{
                aspectRatio: settings.orientation === 'landscape'
                  ? (settings.paperSize === 'a3' ? '1.414' : '1.414')
                  : (settings.paperSize === 'a3' ? '0.707' : '0.707')
              }}
            >
              {/* Printable Content */}
              <div ref={printRef} className="print-document">
                {pages.map((pageData, pageIndex) => (
                  <div key={pageIndex} className="print-page">
                    {/* Page Header */}
                    {settings.includeHeader && (
                      <div className="print-page-header">
                        <div className="header-logo">
                          <span className="logo-text">e-YAS SITES</span>
                        </div>
                        <div className="header-title">
                          <h1>تقرير TSSR</h1>
                          <p>{currentDate}</p>
                        </div>
                        <div className="header-page">
                          صفحة {pageIndex + 1} من {pages.length}
                        </div>
                      </div>
                    )}

                    {/* Stats (first page only) */}
                    {settings.includeStats && pageIndex === 0 && (
                      <div className="print-stats">
                        <div className="print-stat">
                          <span className="stat-value">{stats.total}</span>
                          <span className="stat-label">إجمالي</span>
                        </div>
                        <div className="print-stat approved">
                          <span className="stat-value">{stats.approved}</span>
                          <span className="stat-label">معتمد</span>
                        </div>
                        <div className="print-stat pending">
                          <span className="stat-value">{stats.pending}</span>
                          <span className="stat-label">قيد الانتظار</span>
                        </div>
                        <div className="print-stat rejected">
                          <span className="stat-value">{stats.rejected}</span>
                          <span className="stat-label">مرفوض</span>
                        </div>
                      </div>
                    )}

                    {/* Data Table */}
                    <table className="print-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          {enabledColumns.map(col => (
                            <th key={col.key}>{col.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {pageData.map((row, rowIndex) => (
                          <tr key={row.site_id || rowIndex}>
                            <td>{pageIndex * settings.rowsPerPage + rowIndex + 1}</td>
                            {enabledColumns.map(col => (
                              <td key={col.key}>{row[col.key] || '-'}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Page Footer */}
                    {settings.includeFooter && (
                      <div className="print-page-footer">
                        <span>TSSR Monitor - e-YAS SITES</span>
                        <span>تم الإنشاء: {currentDate}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Preview Info */}
            <div className="preview-info">
              <span>📄 {pages.length} صفحات</span>
              <span>•</span>
              <span>{data.length} سجل</span>
              <span>•</span>
              <span>{enabledColumns.length} أعمدة</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrintPreview
