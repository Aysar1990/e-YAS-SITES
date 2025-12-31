/**
 * Rejection review modal component
 * @module components/Sites/components/RejectionModal
 */

import { useState } from 'react'

/**
 * Modal for Nokia rejection reviews
 * @param {Object} props - Component props
 * @param {Object} props.site - Site data object
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onSave - Save handler
 * @param {Object} props.user - Current user object
 */
export const RejectionModal = ({ site, onClose, onSave, user }) => {
  const [rejectionType, setRejectionType] = useState(site.rejection_type || '')
  const [rejectionStatus, setRejectionStatus] = useState(site.rejection_status || '')
  const [rejectionComment, setRejectionComment] = useState(site.rejection_comment || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!rejectionType || !rejectionStatus) {
      alert('Please select rejection type and status')
      return
    }

    setSaving(true)
    try {
      await onSave({
        site_id: site.site_id,
        rejection_type: rejectionType,
        rejection_status: rejectionStatus,
        rejection_comment: rejectionComment,
        updated_by: user?.id
      })
      onClose()
    } catch (error) {
      console.error('Failed to save rejection:', error)
      alert('Failed to save rejection')
    }
    setSaving(false)
  }

  return (
    <div className="nokia-modal-overlay" onClick={onClose}>
      <div className="nokia-modal" onClick={e => e.stopPropagation()}>
        <div className="nokia-modal-header">
          <h3>Review Site: {site.site_id}</h3>
          <button className="nokia-modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="nokia-modal-body">
          <div className="nokia-form-group">
            <label>Site Name</label>
            <div className="nokia-form-value">{site.final_site_name || 'N/A'}</div>
          </div>

          <div className="nokia-form-group">
            <label>Current Status</label>
            <div className="nokia-form-value status-value">
              {site.tssr_overall_status || 'N/A'}
            </div>
          </div>

          <div className="nokia-form-row">
            <div className="nokia-form-group">
              <label>Rejection Type <span className="required">*</span></label>
              <select
                value={rejectionType}
                onChange={(e) => setRejectionType(e.target.value)}
                className="nokia-select"
              >
                <option value="">Select Type...</option>
                <option value="Nokia NPO">Nokia NPO</option>
                <option value="Nokia ROM">Nokia ROM</option>
                <option value="Nokia GSD">Nokia GSD</option>
              </select>
            </div>

            <div className="nokia-form-group">
              <label>Status <span className="required">*</span></label>
              <select
                value={rejectionStatus}
                onChange={(e) => setRejectionStatus(e.target.value)}
                className="nokia-select"
              >
                <option value="">Select Status...</option>
                <option value="Rejected">Rejected</option>
                <option value="Approved">Approved</option>
                <option value="Pending Review">Pending Review</option>
              </select>
            </div>
          </div>

          <div className="nokia-form-group">
            <label>Comment / Notes</label>
            <textarea
              value={rejectionComment}
              onChange={(e) => setRejectionComment(e.target.value)}
              className="nokia-textarea"
              placeholder="Enter rejection reason or notes..."
              rows={4}
            />
          </div>

          {site.rejection_status && (
            <div className="nokia-current-status">
              <span className="current-label">Current Review:</span>
              <span className={`current-badge ${site.rejection_status?.toLowerCase()}`}>
                {site.rejection_type} - {site.rejection_status}
              </span>
            </div>
          )}
        </div>

        <div className="nokia-modal-footer">
          <button className="nokia-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="nokia-btn-save"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Review'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default RejectionModal
