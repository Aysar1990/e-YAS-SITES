/**
 * ColumnManager Component
 * Sidebar for managing column visibility and freezing
 * Extracted from SpreadsheetView.jsx
 */

import React from 'react'
import { ALL_COLUMNS } from '../../columns'
import './ColumnManager.css'

const ColumnManager = ({
  hiddenColumns,
  pinnedColumns,
  onToggleColumn,
  onToggleFreeze,
  onShowAll,
  onShowEssentialOnly,
  onClose
}) => {
  return (
    <div className="column-manager">
      <div className="manager-header">
        <h3>Column Manager</h3>
        <button onClick={onClose} className="btn-close">&times;</button>
      </div>

      <div className="manager-actions">
        <button onClick={onShowAll} className="btn-sm">Show All</button>
        <button onClick={onShowEssentialOnly} className="btn-sm">Essential Only</button>
      </div>

      <div className="column-list">
        {ALL_COLUMNS.map(col => (
          <label key={col.field} className="column-item">
            <input
              type="checkbox"
              checked={!hiddenColumns.includes(col.field)}
              onChange={() => onToggleColumn(col.field)}
            />
            <span className={col.editable === false ? 'readonly' : ''}>
              {col.headerName}
            </span>
            <button
              className={`freeze-btn ${pinnedColumns.includes(col.field) ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onToggleFreeze(col.field)
              }}
              title={pinnedColumns.includes(col.field) ? 'Unfreeze Column' : 'Freeze Column'}
            >
              {pinnedColumns.includes(col.field) ? '❄ Frozen' : 'Freeze'}
            </button>
          </label>
        ))}
      </div>
    </div>
  )
}

export default ColumnManager
