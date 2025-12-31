/**
 * BulkActionsBar Component (Enhanced)
 * Displays available bulk actions for selected sites
 */

import React, { useState } from 'react'
import './BulkActionsBar.css'

const BulkActionsBar = ({
  selectedCount = 0,
  onClear,
  onUpdateStatus,
  onAssignContractor,
  onUpdatePriority,
  onDelete,
  onExport,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  if (selectedCount === 0) return null

  return (
    <div className={`bulk-actions-bar ${isExpanded ? 'bulk-actions-bar--expanded' : ''} ${className}`}>
      <div className="bulk-actions-bar__info">
        <div className="bulk-actions-bar__count">
          <span className="bulk-actions-bar__number">{selectedCount}</span>
          <span className="bulk-actions-bar__label">selected</span>
        </div>

        <button
          className="bulk-actions-bar__expand"
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? 'Show less' : 'Show more'}
        >
          {isExpanded ? '▼' : '▲'}
        </button>
      </div>

      <div className="bulk-actions-bar__actions">
        {/* Primary Actions (Always Visible) */}
        <button
          className="bulk-actions-bar__btn bulk-actions-bar__btn--primary"
          onClick={onUpdateStatus}
          title="Update Status"
        >
          <span className="bulk-actions-bar__icon">📝</span>
          <span>Status</span>
        </button>

        <button
          className="bulk-actions-bar__btn bulk-actions-bar__btn--primary"
          onClick={onAssignContractor}
          title="Assign Contractor"
        >
          <span className="bulk-actions-bar__icon">👷</span>
          <span>Contractor</span>
        </button>

        {/* Secondary Actions (Show when expanded) */}
        {isExpanded && (
          <>
            <button
              className="bulk-actions-bar__btn bulk-actions-bar__btn--secondary"
              onClick={onUpdatePriority}
              title="Update Priority"
            >
              <span className="bulk-actions-bar__icon">⭐</span>
              <span>Priority</span>
            </button>

            <button
              className="bulk-actions-bar__btn bulk-actions-bar__btn--secondary"
              onClick={onExport}
              title="Export Selected"
            >
              <span className="bulk-actions-bar__icon">📥</span>
              <span>Export</span>
            </button>

            <button
              className="bulk-actions-bar__btn bulk-actions-bar__btn--danger"
              onClick={onDelete}
              title="Delete Selected"
            >
              <span className="bulk-actions-bar__icon">🗑️</span>
              <span>Delete</span>
            </button>
          </>
        )}

        {/* Clear Button */}
        <button
          className="bulk-actions-bar__btn bulk-actions-bar__btn--clear"
          onClick={onClear}
          title="Clear Selection"
        >
          <span className="bulk-actions-bar__icon">✕</span>
          <span>Clear</span>
        </button>
      </div>
    </div>
  )
}

export default BulkActionsBar
