/**
 * BulkDeleteModal Component
 * Confirms and executes bulk delete operations with safety checks
 */

import React, { useState } from 'react'
import './BulkDeleteModal.css'

const BulkDeleteModal = ({
  isOpen,
  onClose,
  onConfirm,
  selectedCount = 0,
  selectedSites = [],
  className = ''
}) => {
  const [confirmText, setConfirmText] = useState('')
  const [understood, setUnderstood] = useState(false)

  const requiredText = 'DELETE'
  const canDelete = confirmText === requiredText && understood

  const handleConfirm = () => {
    if (canDelete) {
      onConfirm()
      handleClose()
    }
  }

  const handleClose = () => {
    setConfirmText('')
    setUnderstood(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="bulk-delete-modal-overlay" onClick={handleClose}>
      <div 
        className={`bulk-delete-modal ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bulk-delete-modal__header">
          <div className="bulk-delete-modal__icon">⚠️</div>
          <h2 className="bulk-delete-modal__title">Delete {selectedCount} Sites?</h2>
          <button 
            className="bulk-delete-modal__close"
            onClick={handleClose}
          >
            ✕
          </button>
        </div>

        {/* Warning */}
        <div className="bulk-delete-modal__warning">
          <p>
            <strong>Warning:</strong> This will mark {selectedCount} site{selectedCount !== 1 ? 's' : ''} as deleted.
          </p>
          <p>
            This action will update the status to "Deleted" and add a deletion timestamp.
          </p>
        </div>

        {/* Sites Preview (max 10) */}
        {selectedSites.length > 0 && (
          <div className="bulk-delete-modal__preview">
            <div className="bulk-delete-modal__preview-title">
              Sites to be deleted:
            </div>
            <div className="bulk-delete-modal__preview-list">
              {selectedSites.slice(0, 10).map((site, idx) => (
                <div key={idx} className="bulk-delete-modal__preview-item">
                  <span className="bulk-delete-modal__preview-id">{site.site_id}</span>
                  <span className="bulk-delete-modal__preview-name">{site.final_site_name}</span>
                </div>
              ))}
              {selectedSites.length > 10 && (
                <div className="bulk-delete-modal__preview-more">
                  + {selectedSites.length - 10} more sites
                </div>
              )}
            </div>
          </div>
        )}

        {/* Confirmation Checkbox */}
        <div className="bulk-delete-modal__checkbox">
          <label>
            <input
              type="checkbox"
              checked={understood}
              onChange={(e) => setUnderstood(e.target.checked)}
            />
            <span>I understand this action will mark these sites as deleted</span>
          </label>
        </div>

        {/* Confirmation Input */}
        <div className="bulk-delete-modal__confirm">
          <label className="bulk-delete-modal__confirm-label">
            Type <strong>DELETE</strong> to confirm:
          </label>
          <input
            type="text"
            className="bulk-delete-modal__confirm-input"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
            placeholder="Type DELETE here"
            autoFocus
          />
        </div>

        {/* Actions */}
        <div className="bulk-delete-modal__actions">
          <button
            className="bulk-delete-modal__btn bulk-delete-modal__btn--cancel"
            onClick={handleClose}
          >
            Cancel
          </button>
          <button
            className="bulk-delete-modal__btn bulk-delete-modal__btn--delete"
            onClick={handleConfirm}
            disabled={!canDelete}
          >
            Delete {selectedCount} Sites
          </button>
        </div>
      </div>
    </div>
  )
}

export default BulkDeleteModal
