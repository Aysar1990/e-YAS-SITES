/**
 * BulkAssignModal Component
 * Assigns contractor, priority, or other fields to multiple sites
 */

import React, { useState } from 'react'
import './BulkAssignModal.css'

const BulkAssignModal = ({
  isOpen,
  onClose,
  onConfirm,
  selectedCount = 0,
  assignType = 'contractor', // contractor, priority, phase
  availableOptions = [],
  className = ''
}) => {
  const [selectedValue, setSelectedValue] = useState('')

  const titles = {
    contractor: 'Assign Contractor',
    priority: 'Update Priority',
    phase: 'Change Phase',
    status: 'Update Status'
  }

  const labels = {
    contractor: 'Contractor',
    priority: 'Priority',
    phase: 'Phase',
    status: 'Status'
  }

  const handleConfirm = () => {
    if (selectedValue) {
      onConfirm(selectedValue, assignType)
      handleClose()
    }
  }

  const handleClose = () => {
    setSelectedValue('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="bulk-assign-modal-overlay" onClick={handleClose}>
      <div 
        className={`bulk-assign-modal ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bulk-assign-modal__header">
          <div className="bulk-assign-modal__icon">📋</div>
          <h2 className="bulk-assign-modal__title">
            {titles[assignType] || 'Bulk Assignment'}
          </h2>
          <button 
            className="bulk-assign-modal__close"
            onClick={handleClose}
          >
            ✕
          </button>
        </div>

        {/* Info */}
        <div className="bulk-assign-modal__info">
          <p>
            Updating <strong>{selectedCount} site{selectedCount !== 1 ? 's' : ''}</strong>
          </p>
        </div>

        {/* Selection */}
        <div className="bulk-assign-modal__selection">
          <label className="bulk-assign-modal__label">
            Select {labels[assignType]}:
          </label>
          <select
            className="bulk-assign-modal__select"
            value={selectedValue}
            onChange={(e) => setSelectedValue(e.target.value)}
            autoFocus
          >
            <option value="">-- Select {labels[assignType]} --</option>
            {availableOptions.map((option, idx) => (
              <option key={idx} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {/* Preview */}
        {selectedValue && (
          <div className="bulk-assign-modal__preview">
            <div className="bulk-assign-modal__preview-title">
              Preview:
            </div>
            <div className="bulk-assign-modal__preview-value">
              {selectedCount} sites will be updated to:
              <span className="bulk-assign-modal__preview-highlight">
                {selectedValue}
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bulk-assign-modal__actions">
          <button
            className="bulk-assign-modal__btn bulk-assign-modal__btn--cancel"
            onClick={handleClose}
          >
            Cancel
          </button>
          <button
            className="bulk-assign-modal__btn bulk-assign-modal__btn--confirm"
            onClick={handleConfirm}
            disabled={!selectedValue}
          >
            Update {selectedCount} Sites
          </button>
        </div>
      </div>
    </div>
  )
}

export default BulkAssignModal
