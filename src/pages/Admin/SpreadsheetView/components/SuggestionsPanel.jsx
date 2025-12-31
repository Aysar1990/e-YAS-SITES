/**
 * Suggestions Panel Component
 * Phase 4: Smart suggestions display with actionable insights
 */

import React, { useState } from 'react'
import { suggestionTypes } from '../hooks/useSmartSuggestions'
import './SuggestionsPanel.css'

/**
 * Suggestions Panel - Displays AI-powered insights and recommendations
 */
const SuggestionsPanel = ({
  suggestions,
  onDismiss,
  onAction,
  onClose,
  dismissedCount = 0,
  onClearDismissed
}) => {
  const [expandedId, setExpandedId] = useState(null)

  // Get CSS class based on suggestion type
  const getTypeClass = (type) => {
    switch (type) {
      case suggestionTypes.SUCCESS:
        return 'suggestion-success'
      case suggestionTypes.WARNING:
        return 'suggestion-warning'
      case suggestionTypes.ERROR:
        return 'suggestion-error'
      case suggestionTypes.INFO:
      default:
        return 'suggestion-info'
    }
  }

  // Get border color based on type
  const getTypeBorderColor = (type) => {
    switch (type) {
      case suggestionTypes.SUCCESS:
        return '#4CAF50'
      case suggestionTypes.WARNING:
        return '#FFC107'
      case suggestionTypes.ERROR:
        return '#F44336'
      case suggestionTypes.INFO:
      default:
        return '#8FD9D9'
    }
  }

  // Handle action click
  const handleAction = (suggestion) => {
    if (suggestion.action && onAction) {
      onAction(suggestion.action.filter, suggestion)
    }
  }

  // Toggle expanded state for suggestion details
  const toggleExpanded = (id) => {
    setExpandedId(prev => prev === id ? null : id)
  }

  // Count by type for summary
  const countByType = {
    error: suggestions.filter(s => s.type === suggestionTypes.ERROR).length,
    warning: suggestions.filter(s => s.type === suggestionTypes.WARNING).length,
    success: suggestions.filter(s => s.type === suggestionTypes.SUCCESS).length,
    info: suggestions.filter(s => s.type === suggestionTypes.INFO).length
  }

  return (
    <div className="suggestions-panel">
      {/* Header */}
      <div className="panel-header">
        <div className="header-content">
          <span className="header-icon">🤖</span>
          <h3>Smart Suggestions</h3>
        </div>
        <div className="header-badges">
          {countByType.error > 0 && (
            <span className="type-badge error" title="Issues found">
              {countByType.error}
            </span>
          )}
          {countByType.warning > 0 && (
            <span className="type-badge warning" title="Warnings">
              {countByType.warning}
            </span>
          )}
          {countByType.success > 0 && (
            <span className="type-badge success" title="Good news">
              {countByType.success}
            </span>
          )}
          {countByType.info > 0 && (
            <span className="type-badge info" title="Information">
              {countByType.info}
            </span>
          )}
        </div>
        <button onClick={onClose} className="btn-close" title="Close">
          ✕
        </button>
      </div>

      {/* Dismissed indicator */}
      {dismissedCount > 0 && (
        <div className="dismissed-indicator">
          <span>{dismissedCount} suggestion{dismissedCount > 1 ? 's' : ''} hidden</span>
          <button onClick={onClearDismissed} className="btn-show-all">
            Show all
          </button>
        </div>
      )}

      {/* Suggestions List */}
      <div className="suggestions-list">
        {suggestions.length === 0 ? (
          <div className="empty-suggestions">
            <span className="empty-icon">✨</span>
            <p>No suggestions at the moment</p>
            <small>
              {dismissedCount > 0
                ? 'Some suggestions are hidden. Click "Show all" to restore.'
                : 'Everything looks good! Check back later for insights.'}
            </small>
          </div>
        ) : (
          suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className={`suggestion-item ${getTypeClass(suggestion.type)} ${expandedId === suggestion.id ? 'expanded' : ''}`}
              style={{ borderLeftColor: getTypeBorderColor(suggestion.type) }}
            >
              {/* Suggestion Header */}
              <div className="suggestion-header">
                <span className="suggestion-icon">{suggestion.icon}</span>
                <div className="suggestion-content">
                  <h4 className="suggestion-title">{suggestion.title}</h4>
                  <p className="suggestion-description">{suggestion.description}</p>
                </div>
                <button
                  className="btn-dismiss"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDismiss(suggestion.id)
                  }}
                  title="Dismiss suggestion"
                >
                  ✕
                </button>
              </div>

              {/* Suggestion Data (expandable) */}
              {suggestion.data && (
                <div className="suggestion-data">
                  {suggestion.data.count !== undefined && (
                    <span className="data-badge">
                      Count: <strong>{suggestion.data.count}</strong>
                    </span>
                  )}
                  {suggestion.data.contractor && (
                    <span className="data-badge">
                      Sites: <strong>{suggestion.data.contractor.total}</strong>
                    </span>
                  )}
                  {suggestion.data.governorate && (
                    <span className="data-badge">
                      Remaining: <strong>{suggestion.data.governorate.remaining}</strong>
                    </span>
                  )}
                  {suggestion.data.completionRate !== undefined && (
                    <span className="data-badge">
                      Rate: <strong>{suggestion.data.completionRate.toFixed(1)}%</strong>
                    </span>
                  )}
                </div>
              )}

              {/* Action Button */}
              {suggestion.action && (
                <button
                  className="suggestion-action"
                  onClick={() => handleAction(suggestion)}
                >
                  {suggestion.action.label}
                  <span className="action-arrow">→</span>
                </button>
              )}

              {/* Priority Indicator */}
              <div className="priority-indicator" title={`Priority: ${suggestion.priority}`}>
                {Array(5 - Math.min(suggestion.priority, 5) + 1).fill('●').join('')}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {suggestions.length > 0 && (
        <div className="panel-footer">
          <span className="footer-text">
            {suggestions.length} active suggestion{suggestions.length !== 1 ? 's' : ''}
          </span>
          <button
            className="btn-dismiss-all"
            onClick={() => suggestions.forEach(s => onDismiss(s.id))}
            title="Dismiss all suggestions"
          >
            Dismiss All
          </button>
        </div>
      )}
    </div>
  )
}

export default SuggestionsPanel
