# Phase 3: Export & Audit Trail

## 🎯 **الأهداف:**
1. ✅ Export Options - تصدير محسّن
2. ✅ Cell History & Audit Trail - سجل التغييرات

---

## 📁 **الملفات المتأثرة:**

```
src/pages/Admin/SpreadsheetView/
├── SpreadsheetView.jsx          [MODIFY - Add export & history]
├── SpreadsheetView.css          [MODIFY - Add history styles]
├── components/
│   ├── ExportDialog.jsx         [NEW - Export options]
│   └── CellHistoryPanel.jsx     [NEW - Cell history]
├── hooks/
│   └── useCellHistory.js        [NEW - Track cell changes]
└── utils/
    └── exportUtils.js           [NEW - Export helpers]
```

---

## 🛠️ **التنفيذ:**

### **1. Export Options** 📥

#### **File: utils/exportUtils.js**
```javascript
/**
 * Enhanced export utilities
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

export const exportData = (data, columns, format, options = {}) => {
  const {
    fileName = 'export',
    selectedRows = null,
    includeHidden = true
  } = options
  
  // Filter data based on selection
  const dataToExport = selectedRows ? 
    data.filter(row => selectedRows.includes(row.site_id)) : 
    data
  
  // Filter columns based on visibility
  const columnsToExport = includeHidden ? 
    columns : 
    columns.filter(col => !col.hide)
  
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
  }
}

const exportToExcel = (data, columns, fileName) => {
  // Prepare data
  const headers = columns.map(col => col.headerName)
  const rows = data.map(row => 
    columns.map(col => row[col.field] ?? '')
  )
  
  const wsData = [headers, ...rows]
  
  // Create workbook
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(wsData)
  
  // Auto-size columns
  const colWidths = columns.map(col => ({ wch: Math.max(col.headerName.length, 15) }))
  ws['!cols'] = colWidths
  
  // Add worksheet
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  
  // Download
  XLSX.writeFile(wb, `${fileName}.xlsx`)
}

const exportToCSV = (data, columns, fileName) => {
  const headers = columns.map(col => col.headerName)
  const rows = data.map(row => 
    columns.map(col => {
      const value = row[col.field] ?? ''
      // Escape commas and quotes
      return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
        ? `"${value.replace(/"/g, '""')}"` 
        : value
    })
  )
  
  const csvContent = [headers, ...rows]
    .map(row => row.join(','))
    .join('\n')
  
  // Download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${fileName}.csv`
  link.click()
}

const exportToJSON = (data, columns, fileName) => {
  const exportData = data.map(row => {
    const obj = {}
    columns.forEach(col => {
      obj[col.field] = row[col.field]
    })
    return obj
  })
  
  const jsonContent = JSON.stringify(exportData, null, 2)
  
  // Download
  const blob = new Blob([jsonContent], { type: 'application/json' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${fileName}.json`
  link.click()
}

export const getExportStats = (data, columns, selectedRows) => {
  const rowCount = selectedRows ? selectedRows.length : data.length
  const colCount = columns.filter(col => !col.hide).length
  const totalCols = columns.length
  
  return {
    rowCount,
    colCount,
    totalCols,
    selectedOnly: !!selectedRows,
    hiddenCols: totalCols - colCount
  }
}
```

#### **File: components/ExportDialog.jsx**
```jsx
import React, { useState } from 'react'
import { exportFormats, exportData, getExportStats } from '../utils/exportUtils'
import './ExportDialog.css'

const ExportDialog = ({ data, columns, selectedRows, onClose }) => {
  const [format, setFormat] = useState(exportFormats.EXCEL_VISIBLE)
  const [fileName, setFileName] = useState('TSSR_Export')
  const [includeHidden, setIncludeHidden] = useState(false)
  const [exportSelected, setExportSelected] = useState(false)
  
  const stats = getExportStats(
    data, 
    columns.filter(col => includeHidden || !col.hide),
    exportSelected ? selectedRows : null
  )
  
  const handleExport = () => {
    const dataToExport = exportSelected && selectedRows?.length > 0 ? 
      data.filter(row => selectedRows.includes(row.site_id)) : 
      data
    
    const columnsToExport = includeHidden ? 
      columns : 
      columns.filter(col => !col.hide)
    
    exportData(dataToExport, columnsToExport, format, { fileName })
    onClose()
  }
  
  const formatOptions = [
    { value: exportFormats.EXCEL_VISIBLE, label: '📊 Excel (.xlsx) - Visible Columns', icon: '📊' },
    { value: exportFormats.EXCEL_ALL, label: '📊 Excel (.xlsx) - All Columns', icon: '📊' },
    { value: exportFormats.CSV_VISIBLE, label: '📄 CSV - Visible Columns', icon: '📄' },
    { value: exportFormats.CSV_ALL, label: '📄 CSV - All Columns', icon: '📄' },
    { value: exportFormats.JSON, label: '🔧 JSON', icon: '🔧' }
  ]
  
  return (
    <div className="export-dialog-overlay" onClick={onClose}>
      <div className="export-dialog" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <h3>📥 Export Data</h3>
          <button onClick={onClose} className="btn-close">✕</button>
        </div>
        
        <div className="dialog-body">
          {/* File Name */}
          <div className="form-group">
            <label>File Name</label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="file-name-input"
            />
          </div>
          
          {/* Format Selection */}
          <div className="form-group">
            <label>Export Format</label>
            <div className="format-options">
              {formatOptions.map(opt => (
                <label key={opt.value} className="format-option">
                  <input
                    type="radio"
                    name="format"
                    value={opt.value}
                    checked={format === opt.value}
                    onChange={(e) => setFormat(e.target.value)}
                  />
                  <span className="format-icon">{opt.icon}</span>
                  <span className="format-label">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
          
          {/* Options */}
          <div className="form-group">
            <label>Options</label>
            
            <label className="checkbox-option">
              <input
                type="checkbox"
                checked={includeHidden}
                onChange={(e) => setIncludeHidden(e.target.checked)}
              />
              <span>Include hidden columns ({columns.filter(c => c.hide).length} hidden)</span>
            </label>
            
            {selectedRows && selectedRows.length > 0 && (
              <label className="checkbox-option">
                <input
                  type="checkbox"
                  checked={exportSelected}
                  onChange={(e) => setExportSelected(e.target.checked)}
                />
                <span>Export selected rows only ({selectedRows.length} selected)</span>
              </label>
            )}
          </div>
          
          {/* Stats Preview */}
          <div className="export-stats">
            <h4>Export Summary</h4>
            <div className="stat-item">
              <span>Rows:</span>
              <strong>{stats.rowCount.toLocaleString()}</strong>
            </div>
            <div className="stat-item">
              <span>Columns:</span>
              <strong>{stats.colCount} of {stats.totalCols}</strong>
            </div>
            {stats.hiddenCols > 0 && !includeHidden && (
              <div className="stat-warning">
                ⚠️ {stats.hiddenCols} hidden columns will be excluded
              </div>
            )}
          </div>
        </div>
        
        <div className="dialog-footer">
          <button onClick={onClose} className="btn-cancel">
            Cancel
          </button>
          <button onClick={handleExport} className="btn-export">
            📥 Export
          </button>
        </div>
      </div>
    </div>
  )
}

export default ExportDialog
```

#### **File: components/ExportDialog.css**
```css
.export-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.export-dialog {
  background: #141e30;
  border: 1px solid rgba(143, 217, 217, 0.3);
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.8);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(143, 217, 217, 0.2);
}

.dialog-header h3 {
  margin: 0;
  color: var(--primary-color);
}

.dialog-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 600;
}

.file-name-input {
  width: 100%;
  padding: 10px;
  background: rgba(143, 217, 217, 0.08);
  border: 1px solid rgba(143, 217, 217, 0.3);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.file-name-input:focus {
  outline: none;
  border-color: var(--primary-color);
  background: rgba(143, 217, 217, 0.12);
}

.format-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.format-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: rgba(143, 217, 217, 0.05);
  border: 1px solid rgba(143, 217, 217, 0.2);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.format-option:hover {
  background: rgba(143, 217, 217, 0.1);
}

.format-option input[type="radio"] {
  cursor: pointer;
}

.format-icon {
  font-size: 1.2rem;
}

.format-label {
  font-size: 0.85rem;
  color: var(--text-primary);
}

.checkbox-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  color: var(--text-primary);
}

.checkbox-option input[type="checkbox"] {
  cursor: pointer;
  width: 16px;
  height: 16px;
}

.export-stats {
  background: rgba(143, 217, 217, 0.05);
  border: 1px solid rgba(143, 217, 217, 0.2);
  border-radius: 8px;
  padding: 15px;
  margin-top: 15px;
}

.export-stats h4 {
  margin: 0 0 10px 0;
  font-size: 0.9rem;
  color: var(--primary-color);
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 0.85rem;
}

.stat-item span {
  color: rgba(255, 255, 255, 0.7);
}

.stat-item strong {
  color: var(--primary-color);
}

.stat-warning {
  margin-top: 10px;
  padding: 8px;
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 4px;
  font-size: 0.8rem;
  color: rgba(255, 193, 7, 0.9);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 15px 20px;
  border-top: 1px solid rgba(143, 217, 217, 0.2);
}

.btn-cancel,
.btn-export {
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel {
  background: transparent;
  border: 1px solid rgba(143, 217, 217, 0.3);
  color: var(--text-primary);
}

.btn-cancel:hover {
  background: rgba(143, 217, 217, 0.1);
}

.btn-export {
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  border: none;
  color: white;
  font-weight: 600;
}

.btn-export:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(143, 217, 217, 0.4);
}
```

---

### **2. Cell History & Audit Trail** 📜

#### **File: hooks/useCellHistory.js**
```javascript
import { useState, useCallback } from 'react'

const HISTORY_STORAGE_KEY = 'spreadsheet_cell_history'
const MAX_HISTORY_ENTRIES = 1000

export const useCellHistory = () => {
  const [history, setHistory] = useState(() => {
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })
  
  // Save to localStorage
  const saveToStorage = useCallback((newHistory) => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(newHistory))
    } catch (error) {
      console.error('Failed to save history:', error)
    }
  }, [])
  
  // Add history entry
  const addHistoryEntry = useCallback((siteId, field, oldValue, newValue, user = 'Current User') => {
    const entry = {
      id: `${Date.now()}_${Math.random()}`,
      siteId,
      field,
      oldValue,
      newValue,
      user,
      timestamp: new Date().toISOString()
    }
    
    setHistory(prev => {
      const updated = [entry, ...prev].slice(0, MAX_HISTORY_ENTRIES)
      saveToStorage(updated)
      return updated
    })
    
    return entry
  }, [saveToStorage])
  
  // Get history for specific cell
  const getCellHistory = useCallback((siteId, field) => {
    return history.filter(h => h.siteId === siteId && h.field === field)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }, [history])
  
  // Get history for site
  const getSiteHistory = useCallback((siteId) => {
    return history.filter(h => h.siteId === siteId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }, [history])
  
  // Get all recent history
  const getRecentHistory = useCallback((limit = 50) => {
    return history
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit)
  }, [history])
  
  // Revert to previous value
  const revertChange = useCallback((entryId) => {
    const entry = history.find(h => h.id === entryId)
    if (!entry) return null
    
    return {
      siteId: entry.siteId,
      field: entry.field,
      value: entry.oldValue
    }
  }, [history])
  
  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([])
    localStorage.removeItem(HISTORY_STORAGE_KEY)
  }, [])
  
  return {
    history,
    addHistoryEntry,
    getCellHistory,
    getSiteHistory,
    getRecentHistory,
    revertChange,
    clearHistory
  }
}
```

#### **File: components/CellHistoryPanel.jsx**
```jsx
import React, { useState, useEffect } from 'react'
import './CellHistoryPanel.css'

const CellHistoryPanel = ({ siteId, field, cellHistory, onRevert, onClose }) => {
  const [entries, setEntries] = useState([])
  
  useEffect(() => {
    if (siteId && field) {
      const history = cellHistory(siteId, field)
      setEntries(history)
    }
  }, [siteId, field, cellHistory])
  
  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString()
  }
  
  const handleRevert = (entry) => {
    if (window.confirm(`Revert to "${entry.oldValue}"?`)) {
      onRevert(entry.id)
    }
  }
  
  return (
    <div className="cell-history-panel">
      <div className="panel-header">
        <div>
          <h3>📜 Change History</h3>
          <p className="cell-info">
            <strong>{field}</strong> for Site {siteId}
          </p>
        </div>
        <button onClick={onClose} className="btn-close">✕</button>
      </div>
      
      <div className="history-list">
        {entries.length === 0 ? (
          <div className="empty-history">
            <span className="empty-icon">📋</span>
            <p>No changes recorded for this cell</p>
          </div>
        ) : (
          entries.map((entry, idx) => (
            <div key={entry.id} className="history-entry">
              <div className="entry-header">
                <span className="entry-user">👤 {entry.user}</span>
                <span className="entry-time">{formatDate(entry.timestamp)}</span>
              </div>
              
              <div className="entry-change">
                <div className="change-old">
                  <span className="change-label">From:</span>
                  <span className="change-value old">{entry.oldValue || '(empty)'}</span>
                </div>
                <span className="change-arrow">→</span>
                <div className="change-new">
                  <span className="change-label">To:</span>
                  <span className="change-value new">{entry.newValue || '(empty)'}</span>
                </div>
              </div>
              
              {idx > 0 && (
                <button
                  className="btn-revert"
                  onClick={() => handleRevert(entry)}
                  title="Revert to this value"
                >
                  ↶ Revert
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default CellHistoryPanel
```

#### **File: components/CellHistoryPanel.css**
```css
.cell-history-panel {
  position: fixed;
  right: 20px;
  top: 100px;
  width: 400px;
  max-height: calc(100vh - 140px);
  background: #141e30;
  border: 1px solid rgba(143, 217, 217, 0.3);
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
  z-index: 9999;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 15px;
  border-bottom: 1px solid rgba(143, 217, 217, 0.2);
}

.panel-header h3 {
  margin: 0 0 5px 0;
  font-size: 1rem;
  color: var(--primary-color);
}

.cell-info {
  margin: 0;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.empty-history {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 3rem;
  opacity: 0.3;
  margin-bottom: 10px;
}

.empty-history p {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.85rem;
}

.history-entry {
  background: rgba(143, 217, 217, 0.03);
  border: 1px solid rgba(143, 217, 217, 0.2);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 10px;
  transition: all 0.2s ease;
}

.history-entry:hover {
  background: rgba(143, 217, 217, 0.08);
}

.entry-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 0.75rem;
}

.entry-user {
  color: var(--primary-color);
  font-weight: 600;
}

.entry-time {
  color: rgba(255, 255, 255, 0.5);
}

.entry-change {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.change-old,
.change-new {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.change-label {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
}

.change-value {
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
  font-family: monospace;
}

.change-value.old {
  background: rgba(244, 67, 54, 0.15);
  color: #F44336;
  text-decoration: line-through;
}

.change-value.new {
  background: rgba(76, 175, 80, 0.15);
  color: #4CAF50;
}

.change-arrow {
  color: var(--primary-color);
  font-size: 1.2rem;
}

.btn-revert {
  width: 100%;
  padding: 6px;
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 4px;
  color: rgba(255, 193, 7, 0.9);
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-revert:hover {
  background: rgba(255, 193, 7, 0.2);
  transform: translateY(-1px);
}
```

---

## ✅ **Testing Checklist:**

### **Export Options:**
- [ ] Excel export with visible columns
- [ ] Excel export with all columns
- [ ] CSV export works
- [ ] JSON export works
- [ ] Export selected rows only
- [ ] File name customization
- [ ] Export stats accurate

### **Cell History:**
- [ ] History records on cell change
- [ ] Cell history panel shows changes
- [ ] Timestamps formatted correctly
- [ ] Revert functionality works
- [ ] History persists across sessions
- [ ] Max 1000 entries enforced

---

## 🎯 **Claude Code Instructions:**

```
PHASE 3 IMPLEMENTATION:

1. CREATE files:
   - utils/exportUtils.js
   - hooks/useCellHistory.js
   - components/ExportDialog.jsx + .css
   - components/CellHistoryPanel.jsx + .css

2. MODIFY SpreadsheetView.jsx:
   - Import ExportDialog, CellHistoryPanel, useCellHistory
   - Replace basic export button with ExportDialog trigger
   - Add cell history tracking in onCellValueChanged
   - Add cell click handler to show history panel

3. INTEGRATION:
   - Track row selection for export
   - Record all cell changes to history
   - Add toolbar button for cell history panel

COMPLEXITY: Medium-High
TIME: 70 minutes
DEPENDENCIES: xlsx library (already installed)
```

---

**Next: PHASE_4_Formatting_and_AI.md**
