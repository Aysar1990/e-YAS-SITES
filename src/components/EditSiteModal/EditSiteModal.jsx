/**
 * EditSiteModal Component V2.0
 * REFACTORED: Extracted state and handlers to hooks
 * Original: 524 lines → Refactored: ~300 lines
 */

import {
  DEPARTMENTS,
  STATUS_OPTIONS,
  OVERALL_STATUS_OPTIONS,
  calculateActionAge,
  getStatusClass as getStatusClassName
} from '../../utils/calculations'
import { Button } from '../UI'
import { useEditModalState } from './useEditModalState'
import { useEditModalHandlers } from './useEditModalHandlers'
import './EditSiteModal.css'

const EditSiteModal = ({ site, onClose, onSave, isOpen }) => {
  const state = useEditModalState(site)
  const {
    user, canEdit, activeTab, setActiveTab, formData, setFormData,
    saving, setSaving, error, setError, successMessage, setSuccessMessage,
    changes, newComment, setNewComment, addingComment, setAddingComment,
    fieldErrors, workflowWarnings, workflowInfo, handleChange,
    hasChanges, comments, editHistory
  } = state

  const handlers = useEditModalHandlers({
    site, user, canEdit, changes, formData, setFormData, fieldErrors, workflowWarnings,
    setSaving, setError, setSuccessMessage, newComment, setNewComment, setAddingComment,
    onSave, onClose
  })

  if (!isOpen || !site) return null

  const getStatusClass = getStatusClassName

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="edit-site-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <h2>Edit Site</h2>
            <span className="site-id">{site.siteId}</span>
          </div>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        {/* Site Info Bar */}
        <div className="site-info-bar">
          <div className="info-item"><span className="info-label">Site Name:</span><span className="info-value">{site.finalSiteName}</span></div>
          <div className="info-item"><span className="info-label">Contractor:</span><span className="info-value">{site.tssrSubcon || 'N/A'}</span></div>
          <div className="info-item"><span className="info-label">Governorate:</span><span className="info-value">{site.governorate || 'N/A'}</span></div>
          <div className="info-item"><span className="info-label">Phase:</span><span className="info-value">{site.phaseName || 'N/A'}</span></div>
          <div className="info-item"><span className="info-label">Age:</span><span className="info-value">{calculateActionAge(site)} days</span></div>
        </div>

        {/* Workflow Progress Bar */}
        <div className="workflow-progress-bar">
          <div className="workflow-progress-header">
            <span>Workflow Progress: {workflowInfo.percentage}%</span>
            {workflowInfo.hasRejection && <span className="rejection-badge">Has Rejection</span>}
          </div>
          <div className="workflow-progress-track">
            <div className="workflow-progress-fill" style={{ width: `${workflowInfo.percentage}%` }} />
          </div>
          <div className="workflow-steps">
            {workflowInfo.steps.map(step => (
              <div key={step.key} className={`workflow-step ${step.isComplete ? 'complete' : ''} ${step.isCurrent ? 'current' : ''} ${step.status === 'rejected' ? 'rejected' : ''}`} title={`${step.label}: ${step.status}`}>
                <span className="step-icon">{step.icon}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          <button className={`tab-btn ${activeTab === 'status' ? 'active' : ''}`} onClick={() => setActiveTab('status')}>📋 Status</button>
          <button className={`tab-btn ${activeTab === 'comments' ? 'active' : ''}`} onClick={() => setActiveTab('comments')}>💬 Comments {comments.length > 0 && <span className="badge">{comments.length}</span>}</button>
          <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>📜 History {editHistory.length > 0 && <span className="badge">{editHistory.length}</span>}</button>
        </div>

        {/* Tab Content */}
        <div className="modal-body">
          {!canEdit && <div className="permission-warning">⚠️ Only Admin users can edit site data</div>}

          {/* Status Tab */}
          {activeTab === 'status' && (
            <div className="status-tab">
              <div className="overall-status-section">
                <h3>Overall Status</h3>
                <div className="overall-status-field">
                  <select value={formData.tssrOverallStatus || ''} onChange={e => handleChange('tssrOverallStatus', e.target.value)} disabled={!canEdit} className={`status-select ${getStatusClass(formData.tssrOverallStatus)} ${changes.tssrOverallStatus ? 'changed' : ''}`}>
                    <option value="">-- Select Status --</option>
                    {OVERALL_STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  {changes.tssrOverallStatus && <span className="change-badge">Modified</span>}
                </div>
              </div>

              <div className="departments-section">
                <h3>Department Statuses</h3>
                <div className="departments-grid">
                  {DEPARTMENTS.map(dept => (
                    <div key={dept.key} className="department-card">
                      <div className="dept-header">
                        <span className="dept-icon">{dept.icon}</span>
                        <span className="dept-label">{dept.label}</span>
                      </div>
                      <div className="dept-status">
                        <select value={formData[dept.statusField] || ''} onChange={e => handleChange(dept.statusField, e.target.value)} disabled={!canEdit} className={`${getStatusClass(formData[dept.statusField])} ${changes[dept.statusField] ? 'changed' : ''}`}>
                          <option value="">-- Select --</option>
                          {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                      <div className="dept-comment">
                        <textarea placeholder="Comment..." value={formData[dept.commentField] || ''} onChange={e => handleChange(dept.commentField, e.target.value)} disabled={!canEdit} rows={2} className={changes[dept.commentField] ? 'changed' : ''} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="other-fields-section">
                <h3>Other Information</h3>
                <div className="other-fields-grid">
                  <div className="form-field">
                    <label>RFI Status</label>
                    <input type="text" value={formData.rfiStatus || ''} onChange={e => handleChange('rfiStatus', e.target.value)} disabled={!canEdit} className={changes.rfiStatus ? 'changed' : ''} />
                  </div>
                  <div className="form-field">
                    <label>Version</label>
                    <input type="text" value={formData.version || ''} onChange={e => handleChange('version', e.target.value)} disabled={!canEdit} className={changes.version ? 'changed' : ''} />
                  </div>
                  <div className="form-field full-width">
                    <label>TSSR Remark</label>
                    <textarea value={formData.tssrRemark || ''} onChange={e => handleChange('tssrRemark', e.target.value)} disabled={!canEdit} rows={3} className={changes.tssrRemark ? 'changed' : ''} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Comments Tab */}
          {activeTab === 'comments' && (
            <div className="comments-tab">
              {canEdit && (
                <div className="add-comment-section">
                  <textarea placeholder="Write a comment..." value={newComment} onChange={e => setNewComment(e.target.value)} rows={3} />
                  <button className="add-comment-btn" onClick={handlers.handleAddComment} disabled={!newComment.trim() || addingComment}>
                    {addingComment ? 'Adding...' : '➕ Add Comment'}
                  </button>
                </div>
              )}
              <div className="comments-list">
                {comments.length === 0 ? (
                  <div className="no-comments">No comments yet</div>
                ) : (
                  [...comments].reverse().map((comment, idx) => (
                    <div key={idx} className="comment-item">
                      <div className="comment-header">
                        <span className="comment-user">👤 {comment.user}</span>
                        <span className="comment-time">{new Date(comment.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="comment-text">{comment.text}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="history-tab">
              {editHistory.length === 0 ? (
                <div className="no-history">No edit history</div>
              ) : (
                <div className="history-list">
                  {[...editHistory].reverse().map((entry, idx) => (
                    <div key={idx} className="history-entry">
                      <div className="history-header">
                        <span className="history-user">👤 {entry.user}</span>
                        <span className="history-time">{new Date(entry.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="history-changes">
                        {entry.changes.map((change, cIdx) => (
                          <div key={cIdx} className="history-change">
                            <span className="change-field">{change.field}:</span>
                            <span className="change-old">{change.oldValue || '(empty)'}</span>
                            <span className="change-arrow">→</span>
                            <span className="change-new">{change.newValue}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          {error && <div className="error-message">❌ {error}</div>}
          {successMessage && <div className="success-message">✅ {successMessage}</div>}
          <div className="footer-info">
            {hasChanges && <span className="changes-count">{Object.keys(changes).length} field(s) modified</span>}
          </div>
          <div className="footer-actions">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            {activeTab === 'status' && (
              <Button variant="primary" onClick={handlers.handleSave} disabled={!canEdit || !hasChanges || saving} loading={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditSiteModal
