/**
 * Excel Export Utilities
 */

import XLSX from 'xlsx-js-style'
import { COLUMN_MAP } from '../config'

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
}

export const getRejectedSites = (sites) => {
  return sites.filter(s =>
    s.ti_status?.toLowerCase().includes('rejected') ||
    s.rf_plan_status?.toLowerCase().includes('rejected') ||
    s.rf_opt_status?.toLowerCase().includes('rejected') ||
    s.civil_status?.toLowerCase().includes('rejected') ||
    s.mw_status?.toLowerCase().includes('rejected')
  )
}
