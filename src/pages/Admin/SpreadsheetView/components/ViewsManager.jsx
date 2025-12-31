/**
 * ViewsManager - Component for managing saved view presets
 * Allows creating, applying, and deleting custom views
 */

import React, { useState, useCallback } from 'react'
import './ViewsManager.css'

const ViewsManager = ({
  views,
  currentView,
  onApplyView,
  onCreateView,
  onDeleteView,
  onClose,
  currentConfig
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newViewName, setNewViewName] = useState('')
  const [newViewIcon, setNewViewIcon] = useState('?')
  const [error, setError] = useState(null)

  // Available icons for custom views
  const icons = ['*', '?', '!', '#', '@', '~', '+', '>', '<', '=']

  // Handle creating a new view
  const handleCreate = useCallback(() => {
    const trimmedName = newViewName.trim()

    if (!trimmedName) {
      setError('Please enter a view name')
      return
    }

    if (trimmedName.length < 2) {
      setError('Name must be at least 2 characters')
      return
    }

    // Check for duplicate names
    const exists = views.some(
      v => v.name.toLowerCase() === trimmedName.toLowerCase()
    )
    if (exists) {
      setError('A view with this name already exists')
      return
    }

    // Create the view with current configuration
    onCreateView(trimmedName, currentConfig, newViewIcon)

    // Reset form
    setNewViewName('')
    setNewViewIcon('?')
    setShowCreateForm(false)
    setError(null)
  }, [newViewName, newViewIcon, currentConfig, views, onCreateView])

  // Handle delete with confirmation
  const handleDelete = useCallback((viewId, viewName) => {
    if (window.confirm(`Delete view "${viewName}"?`)) {
      onDeleteView(viewId)
    }
  }, [onDeleteView])

  // Cancel create form
  const handleCancel = useCallback(() => {
    setShowCreateForm(false)
    setNewViewName('')
    setNewViewIcon('?')
    setError(null)
  }, [])

  return (
    <div className="views-manager">
      <div className="manager-header">
        <h3>Saved Views</h3>
        <button onClick={onClose} className="btn-close" title="Close">
          &times;
        </button>
      </div>

      {/* Views List */}
      <div className="views-list">
        {views.map(view => (
          <div
            key={view.id}
            className={`view-item ${currentView?.id === view.id ? 'active' : ''}`}
          >
            <button
              className="view-btn"
              onClick={() => onApplyView(view.id)}
              title={`Apply "${view.name}" view`}
            >
              <span className="view-icon">{view.icon}</span>
              <span className="view-name">{view.name}</span>
              {view.isDefault && <span className="view-badge">Default</span>}
              {currentView?.id === view.id && (
                <span className="view-active-badge">Active</span>
              )}
            </button>

            {!view.isDefault && (
              <button
                className="delete-view"
                onClick={() => handleDelete(view.id, view.name)}
                title="Delete this view"
              >
                x
              </button>
            )}
          </div>
        ))}

        {views.length === 0 && (
          <div className="no-views">
            <p>No saved views yet</p>
          </div>
        )}
      </div>

      {/* Create View Section */}
      <div className="create-view-section">
        {!showCreateForm ? (
          <button
            className="btn-create-view"
            onClick={() => setShowCreateForm(true)}
          >
            + Create New View
          </button>
        ) : (
          <div className="create-form">
            <div className="form-row">
              <input
                type="text"
                placeholder="View name..."
                value={newViewName}
                onChange={(e) => {
                  setNewViewName(e.target.value)
                  setError(null)
                }}
                className={`view-name-input ${error ? 'error' : ''}`}
                autoFocus
                maxLength={50}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate()
                  if (e.key === 'Escape') handleCancel()
                }}
              />
            </div>

            {error && <div className="form-error">{error}</div>}

            <div className="icon-picker">
              <span className="picker-label">Icon:</span>
              {icons.map(icon => (
                <button
                  key={icon}
                  className={`icon-btn ${newViewIcon === icon ? 'active' : ''}`}
                  onClick={() => setNewViewIcon(icon)}
                  title={`Select ${icon} as icon`}
                >
                  {icon}
                </button>
              ))}
            </div>

            <div className="form-hint">
              This will save your current column visibility, density, and pinned columns.
            </div>

            <div className="form-actions">
              <button
                className="btn-save"
                onClick={handleCreate}
                disabled={!newViewName.trim()}
              >
                Save View
              </button>
              <button className="btn-cancel" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Current View Info */}
      {currentView && (
        <div className="current-view-info">
          <span className="info-label">Current:</span>
          <span className="info-value">
            {currentView.icon} {currentView.name}
          </span>
        </div>
      )}
    </div>
  )
}

export default ViewsManager
