/**
 * Request Change Modal Component
 * Allows contractors to submit change requests for site data
 */

import { useState, useEffect } from 'react'
import { Button } from '../UI'
import { useAuth } from '../../context/AuthContext'
import './RequestChangeModal.css'

// Available fields that contractors can request changes for
const EDITABLE_FIELDS = [
  { value: 'tssr_overall_status', label: 'Overall Status', type: 'select', options: ['TSSR Approved', 'TSSR Under Review', 'TSSR Rejected', 'RFI Sent'] },
  { value: 'ti_status', label: 'TI Status', type: 'select', options: ['Approved', 'Pending', 'Rejected', 'Under Review', 'N/A'] },
  { value: 'ti_comment', label: 'TI Comment', type: 'text' },
  { value: 'rf_plan_status', label: 'RF Plan Status', type: 'select', options: ['Approved', 'Pending', 'Rejected', 'Under Review', 'N/A'] },
  { value: 'rf_plan_comment', label: 'RF Plan Comment', type: 'text' },
  { value: 'rf_optim_status', label: 'RF Optimization Status', type: 'select', options: ['Approved', 'Pending', 'Rejected', 'Under Review', 'N/A'] },
  { value: 'rf_opt_comment', label: 'RF Optimization Comment', type: 'text' },
  { value: 'civil_status', label: 'Civil Status', type: 'select', options: ['Approved', 'Pending', 'Rejected', 'Under Review', 'N/A'] },
  { value: 'civil_comment', label: 'Civil Comment', type: 'text' },
  { value: 'mw_status', label: 'MW Status', type: 'select', options: ['Approved', 'Pending', 'Rejected', 'Under Review', 'N/A'] },
  { value: 'mw_comment', label: 'MW Comment', type: 'text' },
  { value: 'nokia_npo_status', label: 'Nokia NPO Status', type: 'select', options: ['Approved', 'Pending', 'Rejected', 'Under Review', 'N/A'] },
  { value: 'nokia_npo_comment', label: 'Nokia NPO Comment', type: 'text' },
  { value: 'rfi_status', label: 'RFI Status', type: 'text' },
  { value: 'version', label: 'Version', type: 'text' },
  { value: 'tssr_remark', label: 'TSSR Remark', type: 'textarea' },
  { value: 'priority', label: 'Priority', type: 'number' }
]

// Map camelCase to snake_case for field values
const FIELD_MAPPING = {
  tssrOverallStatus: 'tssr_overall_status',
  tiStatus: 'ti_status',
  tiComment: 'ti_comment',
  rfPlanStatus: 'rf_plan_status',
  rfPlanComment: 'rf_plan_comment',
  rfOptStatus: 'rf_optim_status',
  rfOptComment: 'rf_opt_comment',
  civilStatus: 'civil_status',
  civilComment: 'civil_comment',
  mwStatus: 'mw_status',
  mwComment: 'mw_comment',
  nokiaNpoStatus: 'nokia_npo_status',
  nokiaNpoComment: 'nokia_npo_comment',
  rfiStatus: 'rfi_status',
  tssrRemark: 'tssr_remark'
}

const RequestChangeModal = ({ site, isOpen, onClose, onSubmit }) => {
  const { user } = useAuth()
  const [selectedField, setSelectedField] = useState('')
  const [newValue, setNewValue] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Reset form when site changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedField('')
      setNewValue('')
      setError('')
      setSuccess(false)
    }
  }, [isOpen, site])

  if (!isOpen || !site) return null

  // Get current value for selected field
  const getCurrentValue = (fieldName) => {
    if (!fieldName) return ''

    // Try snake_case first, then camelCase
    const snakeValue = site[fieldName]
    if (snakeValue !== undefined) return snakeValue || ''

    // Find camelCase equivalent
    const camelKey = Object.entries(FIELD_MAPPING).find(([k, v]) => v === fieldName)?.[0]
    if (camelKey) {
      return site[camelKey] || ''
    }

    return ''
  }

  const currentValue = getCurrentValue(selectedField)
  const selectedFieldConfig = EDITABLE_FIELDS.find(f => f.value === selectedField)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!selectedField) {
      setError('Please select a field to change')
      return
    }

    if (!newValue.trim() && selectedFieldConfig?.type !== 'number') {
      setError('Please enter a new value')
      return
    }

    if (newValue === currentValue) {
      setError('New value must be different from current value')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const result = await onSubmit({
        siteId: site.site_id || site.siteId,
        phaseName: site.phase_name || site.phaseName,
        fieldName: selectedField,
        oldValue: currentValue,
        newValue: newValue,
        requestedBy: user?.username || user?.name || 'Unknown',
        requestedByRole: user?.role || 'contractor'
      })

      if (result?.success) {
        setSuccess(true)
        setTimeout(() => {
          onClose()
        }, 1500)
      } else {
        setError(result?.error || 'Failed to submit request')
      }
    } catch (err) {
      setError(err.message || 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  // Render input based on field type
  const renderInput = () => {
    if (!selectedFieldConfig) {
      return (
        <input
          type="text"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder="Enter new value..."
          className="form-input"
          disabled={!selectedField}
        />
      )
    }

    switch (selectedFieldConfig.type) {
      case 'select':
        return (
          <select
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            className="form-select"
          >
            <option value="">-- Select value --</option>
            {selectedFieldConfig.options?.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        )
      case 'textarea':
        return (
          <textarea
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="Enter new value..."
            className="form-textarea"
            rows={4}
          />
        )
      case 'number':
        return (
          <input
            type="number"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="Enter number..."
            className="form-input"
            min={1}
          />
        )
      default:
        return (
          <input
            type="text"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="Enter new value..."
            className="form-input"
          />
        )
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="request-change-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="header-info">
            <h2>Request Change</h2>
            <span className="site-info">
              Site: <strong>{site.site_id || site.siteId}</strong>
              {(site.phase_name || site.phaseName) && (
                <span className="phase-tag">{site.phase_name || site.phaseName}</span>
              )}
            </span>
          </div>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        {/* Success State */}
        {success ? (
          <div className="success-state">
            <span className="success-icon">&#10004;</span>
            <h3>Request Submitted!</h3>
            <p>Your change request has been sent for admin approval.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* Site Info */}
              <div className="site-details">
                <div className="detail-item">
                  <span className="label">Site Name:</span>
                  <span className="value">{site.final_site_name || site.finalSiteName || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Contractor:</span>
                  <span className="value">{site.tssr_subcon || site.tssrSubcon || 'N/A'}</span>
                </div>
              </div>

              {/* Field Selection */}
              <div className="form-group">
                <label>Select Field to Change:</label>
                <select
                  value={selectedField}
                  onChange={(e) => {
                    setSelectedField(e.target.value)
                    setNewValue('')
                    setError('')
                  }}
                  className="form-select"
                >
                  <option value="">-- Select a field --</option>
                  {EDITABLE_FIELDS.map(field => (
                    <option key={field.value} value={field.value}>
                      {field.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Current Value */}
              {selectedField && (
                <div className="current-value-box">
                  <span className="label">Current Value:</span>
                  <span className="value">
                    {currentValue || <em>(empty)</em>}
                  </span>
                </div>
              )}

              {/* New Value Input */}
              <div className="form-group">
                <label>New Value:</label>
                {renderInput()}
              </div>

              {/* Change Preview */}
              {selectedField && newValue && newValue !== currentValue && (
                <div className="change-preview">
                  <span className="preview-label">Change Preview:</span>
                  <div className="preview-change">
                    <span className="old">{currentValue || '(empty)'}</span>
                    <span className="arrow">&#8594;</span>
                    <span className="new">{newValue}</span>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="error-message">
                  &#10006; {error}
                </div>
              )}

              {/* Info Note */}
              <div className="info-note">
                <span className="info-icon">&#9432;</span>
                <p>Your change request will be reviewed by an administrator before being applied.</p>
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <Button variant="secondary" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={!selectedField || !newValue || newValue === currentValue || submitting}
                loading={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default RequestChangeModal
