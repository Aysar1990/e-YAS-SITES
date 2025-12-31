/**
 * CellHistoryPanel - Shows change history for a specific cell
 * Displays timeline of changes with revert capability
 */

import React, { useMemo } from 'react'
import './CellHistoryPanel.css'

const CellHistoryPanel = ({
  siteId,
  field,
  fieldLabel,
  getCellHistory,
  onRevert,
  onClose
}) => {
  // Get history entries for this cell
  const entries = useMemo(() => {
    if (!siteId || !field) return []
    return getCellHistory(siteId, field)
  }, [siteId, field, getCellHistory])

  /**
   * Format timestamp to relative time
   */
  const formatTime = (timestamp) => {
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

    // For older entries, show full date
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  /**
   * Format value for display
   */
  const formatValue = (value) => {
    if (value === null || value === undefined) return '(empty)'
    if (value === '') return '(empty)'
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
  }

  /**
   * Handle revert click with confirmation
   */
  const handleRevert = (entry) => {
    const confirmMsg = `Revert "${field}" to previous value?\n\nFrom: ${formatValue(entry.newValue)}\nTo: ${formatValue(entry.oldValue)}`

    if (window.confirm(confirmMsg)) {
      onRevert(entry.id)
    }
  }

  return (
    <div className="cell-history-panel">
      <div className="panel-header">
        <div className="header-info">
          <h3>Change History</h3>
          <p className="cell-info">
            <strong>{fieldLabel || field}</strong>
            <span className="site-id">Site: {siteId}</span>
          </p>
        </div>
        <button onClick={onClose} className="btn-close" title="Close">
          &times;
        </button>
      </div>

      <div className="history-list">
        {entries.length === 0 ? (
          <div className="empty-history">
            <span className="empty-icon">~</span>
            <p>No changes recorded</p>
            <span className="empty-hint">Changes will appear here after editing this cell</span>
          </div>
        ) : (
          <>
            <div className="history-count">
              {entries.length} change{entries.length !== 1 ? 's' : ''} recorded
            </div>

            {entries.map((entry, idx) => (
              <div key={entry.id} className={`history-entry ${idx === 0 ? 'latest' : ''}`}>
                <div className="entry-header">
                  <span className="entry-user">{entry.user}</span>
                  <span className="entry-time">{formatTime(entry.timestamp)}</span>
                </div>

                <div className="entry-change">
                  <div className="change-from">
                    <span className="change-label">From</span>
                    <span className="change-value old">
                      {formatValue(entry.oldValue)}
                    </span>
                  </div>

                  <span className="change-arrow">&rarr;</span>

                  <div className="change-to">
                    <span className="change-label">To</span>
                    <span className="change-value new">
                      {formatValue(entry.newValue)}
                    </span>
                  </div>
                </div>

                {idx > 0 && (
                  <button
                    className="btn-revert"
                    onClick={() => handleRevert(entry)}
                    title="Revert to this previous value"
                  >
                    Revert to this value
                  </button>
                )}

                {idx === 0 && (
                  <div className="current-badge">Current Value</div>
                )}
              </div>
            ))}
          </>
        )}
      </div>

      <div className="panel-footer">
        <span className="footer-hint">
          Ctrl+Click on any cell to view its history
        </span>
      </div>
    </div>
  )
}

export default CellHistoryPanel
