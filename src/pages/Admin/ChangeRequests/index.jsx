/**
 * Admin Change Requests Page
 * View and approve/reject change requests from contractors
 */

import { useState, useMemo } from 'react'
import MainLayout from '../../../components/Layout/MainLayout'
import { Card, Button } from '../../../components/UI'
import { useAuth } from '../../../context/AuthContext'
import { useChangeRequests } from '../../../hooks/useChangeRequests'
import './ChangeRequests.css'

// Status badge component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    pending: { label: 'Pending', className: 'status-pending', icon: '⏳' },
    approved: { label: 'Approved', className: 'status-approved', icon: '✅' },
    rejected: { label: 'Rejected', className: 'status-rejected', icon: '❌' }
  }

  const config = statusConfig[status] || statusConfig.pending

  return (
    <span className={`status-badge ${config.className}`}>
      {config.icon} {config.label}
    </span>
  )
}

// Review Modal component
const ReviewModal = ({ request, onClose, onApprove, onReject, loading }) => {
  const [comment, setComment] = useState('')
  const [action, setAction] = useState(null)

  const handleSubmit = async () => {
    if (action === 'approve') {
      await onApprove(request.id, comment)
    } else if (action === 'reject') {
      await onReject(request.id, comment)
    }
    onClose()
  }

  if (!request) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="review-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Review Change Request</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="request-details">
            <div className="detail-row">
              <span className="detail-label">Site ID:</span>
              <span className="detail-value">{request.site_id}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Field:</span>
              <span className="detail-value">{request.field_label || request.field_name}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Current Value:</span>
              <span className="detail-value old-value">{request.old_value || '(empty)'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Requested Value:</span>
              <span className="detail-value new-value">{request.new_value}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Requested By:</span>
              <span className="detail-value">{request.requested_by}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Date:</span>
              <span className="detail-value">
                {new Date(request.requested_at).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="comment-section">
            <label>Review Comment (optional):</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment for the requester..."
              rows={3}
            />
          </div>
        </div>

        <div className="modal-footer">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => { setAction('reject'); handleSubmit() }}
            disabled={loading}
            loading={loading && action === 'reject'}
          >
            Reject
          </Button>
          <Button
            variant="success"
            onClick={() => { setAction('approve'); handleSubmit() }}
            disabled={loading}
            loading={loading && action === 'approve'}
          >
            Approve
          </Button>
        </div>
      </div>
    </div>
  )
}

const ChangeRequests = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('pending')
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const {
    requests,
    pendingCount,
    loading,
    error,
    approveRequest,
    rejectRequest,
    fetchPendingRequests,
    fetchHistory
  } = useChangeRequests({ role: 'admin', autoRefresh: true })

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    if (tab === 'pending') {
      fetchPendingRequests()
    } else if (tab === 'history') {
      fetchHistory({ status: 'all' })
    } else if (tab === 'approved') {
      fetchHistory({ status: 'approved' })
    } else if (tab === 'rejected') {
      fetchHistory({ status: 'rejected' })
    }
  }

  // Filter requests by search term
  const filteredRequests = useMemo(() => {
    if (!searchTerm.trim()) return requests

    const term = searchTerm.toLowerCase()
    return requests.filter(req =>
      req.site_id?.toLowerCase().includes(term) ||
      req.requested_by?.toLowerCase().includes(term) ||
      req.field_label?.toLowerCase().includes(term) ||
      req.field_name?.toLowerCase().includes(term)
    )
  }, [requests, searchTerm])

  // Handle approve
  const handleApprove = async (requestId, comment) => {
    setProcessing(true)
    const result = await approveRequest(requestId, user?.username, comment)
    setProcessing(false)

    if (result.success) {
      setSuccessMessage('Request approved successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
    }
  }

  // Handle reject
  const handleReject = async (requestId, comment) => {
    setProcessing(true)
    const result = await rejectRequest(requestId, user?.username, comment)
    setProcessing(false)

    if (result.success) {
      setSuccessMessage('Request rejected successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
    }
  }

  // Quick approve/reject without modal
  const handleQuickAction = async (request, action) => {
    setProcessing(true)
    if (action === 'approve') {
      await approveRequest(request.id, user?.username, '')
    } else {
      await rejectRequest(request.id, user?.username, '')
    }
    setProcessing(false)
  }

  return (
    <MainLayout>
      <div className="change-requests-page">
        <div className="page-header">
          <div className="page-header__info">
            <h1 className="page-title">Change Requests</h1>
            <p className="page-subtitle">
              Review and approve changes requested by contractors
            </p>
          </div>

          {pendingCount > 0 && (
            <div className="pending-badge">
              <span className="pending-count">{pendingCount}</span>
              <span className="pending-label">Pending</span>
            </div>
          )}
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="success-toast">
            {successMessage}
          </div>
        )}

        {/* Tabs */}
        <div className="tabs-container">
          <button
            className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => handleTabChange('pending')}
          >
            Pending
            {pendingCount > 0 && <span className="tab-badge">{pendingCount}</span>}
          </button>
          <button
            className={`tab-btn ${activeTab === 'approved' ? 'active' : ''}`}
            onClick={() => handleTabChange('approved')}
          >
            Approved
          </button>
          <button
            className={`tab-btn ${activeTab === 'rejected' ? 'active' : ''}`}
            onClick={() => handleTabChange('rejected')}
          >
            Rejected
          </button>
          <button
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => handleTabChange('history')}
          >
            All History
          </button>
        </div>

        {/* Search */}
        <Card className="search-card">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by Site ID, Requester, or Field..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button className="clear-search" onClick={() => setSearchTerm('')}>
                &times;
              </button>
            )}
          </div>
          <span className="results-count">
            Showing {filteredRequests.length} request(s)
          </span>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="error-card">
            <p className="error-message">Error: {error}</p>
            <Button variant="secondary" onClick={fetchPendingRequests}>
              Retry
            </Button>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading requests...</p>
          </div>
        )}

        {/* Requests Table */}
        {!loading && filteredRequests.length > 0 && (
          <Card className="requests-table-card">
            <table className="requests-table">
              <thead>
                <tr>
                  <th>Site ID</th>
                  <th>Field</th>
                  <th>Change</th>
                  <th>Requested By</th>
                  <th>Date</th>
                  <th>Status</th>
                  {activeTab === 'pending' && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => (
                  <tr key={request.id} className={`request-row status-${request.status}`}>
                    <td className="site-id-cell">
                      <strong>{request.site_id}</strong>
                      {request.phase_name && (
                        <span className="phase-tag">{request.phase_name}</span>
                      )}
                    </td>
                    <td className="field-cell">
                      {request.field_label || request.field_name}
                    </td>
                    <td className="change-cell">
                      <span className="old-value" title="Current value">
                        {request.old_value || '(empty)'}
                      </span>
                      <span className="arrow"></span>
                      <span className="new-value" title="Requested value">
                        {request.new_value}
                      </span>
                    </td>
                    <td className="requester-cell">
                      <span className="requester-name">{request.requested_by}</span>
                      {request.requested_by_role && (
                        <span className="role-tag">{request.requested_by_role}</span>
                      )}
                    </td>
                    <td className="date-cell">
                      {new Date(request.requested_at).toLocaleDateString()}
                      <span className="time">
                        {new Date(request.requested_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="status-cell">
                      <StatusBadge status={request.status} />
                      {request.reviewed_by && (
                        <span className="reviewed-by">
                          by {request.reviewed_by}
                        </span>
                      )}
                    </td>
                    {activeTab === 'pending' && (
                      <td className="actions-cell">
                        <div className="action-buttons">
                          <button
                            className="action-btn approve-btn"
                            onClick={() => handleQuickAction(request, 'approve')}
                            disabled={processing}
                            title="Quick Approve"
                          >

                          </button>
                          <button
                            className="action-btn reject-btn"
                            onClick={() => handleQuickAction(request, 'reject')}
                            disabled={processing}
                            title="Quick Reject"
                          >

                          </button>
                          <button
                            className="action-btn review-btn"
                            onClick={() => setSelectedRequest(request)}
                            title="Review with Comment"
                          >

                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {/* Empty State */}
        {!loading && filteredRequests.length === 0 && (
          <Card className="empty-state-card">
            <div className="empty-state">
              <span className="empty-icon">
                {activeTab === 'pending' ? '📭' : '📋'}
              </span>
              <h3>No {activeTab} requests</h3>
              <p>
                {activeTab === 'pending'
                  ? 'All caught up! No pending requests to review.'
                  : 'No requests found matching your criteria.'}
              </p>
            </div>
          </Card>
        )}

        {/* Review Modal */}
        {selectedRequest && (
          <ReviewModal
            request={selectedRequest}
            onClose={() => setSelectedRequest(null)}
            onApprove={handleApprove}
            onReject={handleReject}
            loading={processing}
          />
        )}
      </div>
    </MainLayout>
  )
}

export default ChangeRequests
