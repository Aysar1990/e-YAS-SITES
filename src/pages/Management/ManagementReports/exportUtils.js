/**
 * Export Utilities for ManagementReports
 */

import XLSX from 'xlsx-js-style'
import { COLUMN_MAP } from './config'

// Export to Excel with styling
export const exportToExcel = (data, filename, columns, setExporting) => {
  setExporting(true)

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

  const borderStyle = {
    top: { style: 'thin', color: { rgb: '000000' } },
    bottom: { style: 'thin', color: { rgb: '000000' } },
    left: { style: 'thin', color: { rgb: '000000' } },
    right: { style: 'thin', color: { rgb: '000000' } }
  }

  const headerStyle = {
    font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 10 },
    fill: { fgColor: { rgb: '10b981' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: borderStyle
  }

  const dataStyle = {
    font: { color: { rgb: '000000' }, sz: 9 },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: borderStyle
  }

  for (let col = range.s.c; col <= range.e.c; col++) {
    for (let row = range.s.r; row <= range.e.r; row++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
      if (!ws[cellAddress]) continue
      ws[cellAddress].s = row === 0 ? headerStyle : dataStyle
    }
  }

  const colWidths = columns.map(col => ({ wch: Math.max(col.length + 2, 15) }))
  ws['!cols'] = colWidths

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Report')
  XLSX.writeFile(wb, filename)
  setExporting(false)
}

// Quick export current view
export const exportCurrentView = (filteredSites, setExporting) => {
  const timestamp = new Date().toISOString().split('T')[0]
  const columns = ['Site ID', 'Final Site Name', 'Governorate', 'TSSR Overall Status', 'TSSR Subcon']
  exportToExcel(filteredSites, `TSSR_Report_${timestamp}.xlsx`, columns, setExporting)
}

// Quick export from template
export const quickExportTemplate = (template, sites, setExporting) => {
  let data = sites
  if (template.filter) {
    const field = template.filter.field
    const value = String(template.filter.value).toLowerCase()
    data = sites.filter(s => {
      const siteValue = String(s[field] || '').toLowerCase()
      if (template.filter.operator === 'equals') return siteValue === value
      if (template.filter.operator === 'contains') return siteValue.includes(value)
      return true
    })
  }
  const timestamp = new Date().toISOString().split('T')[0]
  exportToExcel(data, `${template.name.replace(/ /g, '_')}_${timestamp}.xlsx`, template.columns, setExporting)
}
