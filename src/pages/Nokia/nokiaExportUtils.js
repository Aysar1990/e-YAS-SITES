/**
 * Nokia Export Utilities
 * Excel export functions for Nokia reports
 * Extracted from NokiaReports.jsx
 */

import XLSX from 'xlsx-js-style'
import { COLUMN_MAP, TSSR_PROGRESS_COLUMNS, PENDING_COLUMNS, REJECTION_COLUMNS } from './nokiaReportsConfig'

// Excel styles
const borderStyle = {
  top: { style: 'thin', color: { rgb: '000000' } },
  bottom: { style: 'thin', color: { rgb: '000000' } },
  left: { style: 'thin', color: { rgb: '000000' } },
  right: { style: 'thin', color: { rgb: '000000' } }
}

const headerStyle = {
  font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 10 },
  fill: { fgColor: { rgb: '000000' } },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: borderStyle
}

const dataStyle = {
  font: { color: { rgb: '000000' }, sz: 8 },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: borderStyle
}

// Export data to Excel file
export const exportToExcel = (data, filename, columns) => {
  const exportData = data.map(site => {
    const row = {}
    columns.forEach(displayName => {
      const dbField = COLUMN_MAP[displayName] || displayName.toLowerCase().replace(/ /g, '_')
      row[displayName] = site[dbField] || ''
    })
    return row
  })

  const ws = XLSX.utils.json_to_sheet(exportData)
  const range = XLSX.utils.decode_range(ws['!ref'])

  // Apply styles
  for (let col = range.s.c; col <= range.e.c; col++) {
    for (let row = range.s.r; row <= range.e.r; row++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
      if (!ws[cellAddress]) continue
      ws[cellAddress].s = row === 0 ? headerStyle : dataStyle
    }
  }

  // Set column widths
  ws['!cols'] = columns.map(col => ({ wch: Math.max(col.length + 2, 12) }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Data')
  XLSX.writeFile(wb, filename)
}

// Generate TSSR Progress report
export const generateTssrProgressReport = (sites, t) => {
  const timestamp = new Date().toISOString().split('T')[0]
  exportToExcel(sites, `TSSR_Progress_${timestamp}.xlsx`, TSSR_PROGRESS_COLUMNS)

  return {
    id: `RPT-${Date.now()}`,
    name: t('reports.tssrProgress.title'),
    type: 'tssrProgress',
    generatedAt: new Date().toISOString(),
    generatedBy: 'Nokia Engineer',
    size: `${Math.round(sites.length * 0.5)} KB`,
    status: 'ready'
  }
}

// Generate Pending report
export const generatePendingReport = (sites, t) => {
  const timestamp = new Date().toISOString().split('T')[0]

  const pendingFilters = [
    { field: 'ti_status', name: 'TI' },
    { field: 'rf_plan_status', name: 'Planning' },
    { field: 'rf_opt_status', name: 'Optimization' },
    { field: 'civil_status', name: 'Civil' },
    { field: 'mw_status', name: 'MW' },
  ]

  let totalPending = 0
  pendingFilters.forEach(({ field, name }) => {
    const pending = sites.filter(s => s[field]?.toLowerCase().includes('pending'))
    if (pending.length > 0) {
      exportToExcel(pending, `Pending_${name}_${timestamp}.xlsx`, PENDING_COLUMNS)
      totalPending += pending.length
    }
  })

  return {
    id: `RPT-${Date.now()}`,
    name: t('reports.pendingTssr.title'),
    type: 'pendingTssr',
    generatedAt: new Date().toISOString(),
    generatedBy: 'Nokia Engineer',
    size: `${Math.round(totalPending * 0.5)} KB (5 files)`,
    status: 'ready'
  }
}

// Generate Rejection report
export const generateRejectionReport = (sites, t) => {
  const timestamp = new Date().toISOString().split('T')[0]

  const rejectedSites = sites.filter(s =>
    s.ti_status?.toLowerCase().includes('rejected') ||
    s.rf_plan_status?.toLowerCase().includes('rejected') ||
    s.rf_opt_status?.toLowerCase().includes('rejected') ||
    s.civil_status?.toLowerCase().includes('rejected') ||
    s.mw_status?.toLowerCase().includes('rejected')
  )

  exportToExcel(rejectedSites, `Rejection_Report_${timestamp}.xlsx`, REJECTION_COLUMNS)

  return {
    id: `RPT-${Date.now()}`,
    name: t('reports.rejection.title'),
    type: 'rejection',
    generatedAt: new Date().toISOString(),
    generatedBy: 'Nokia Engineer',
    size: `${Math.round(rejectedSites.length * 0.5)} KB`,
    status: 'ready'
  }
}

export default {
  exportToExcel,
  generateTssrProgressReport,
  generatePendingReport,
  generateRejectionReport
}
