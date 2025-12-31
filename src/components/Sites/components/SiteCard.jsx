/**
 * Nokia site card component
 * @module components/Sites/components/SiteCard
 */

import { getStatusColors, getDeptClass } from '../statusUtils'

/**
 * Site card for Nokia view with rejection features
 * @param {Object} props - Component props
 * @param {Object} props.site - Site data object
 * @param {Function} props.onReview - Review button handler
 * @param {boolean} props.showReviewButton - Whether to show review button
 */
export const SiteCard = ({ site, onReview, showReviewButton = true }) => {
  const statusColors = getStatusColors(site.tssr_overall_status)
  const hasRejection = site.rejection_status === 'Rejected'
  const isApproved = site.rejection_status === 'Approved'

  const cardStyle = {
    '--status-color': statusColors.hex,
    '--neon-rgb': hasRejection ? '239, 68, 68' : isApproved ? '143, 217, 217' : statusColors.rgb,
  }

  return (
    <div
      className={`nokia-site-card ${hasRejection ? 'has-rejection' : ''} ${isApproved ? 'is-approved' : ''}`}
      style={cardStyle}
    >
      {/* Rejection Badge */}
      {site.rejection_status && (
        <div className={`rejection-badge ${site.rejection_status.toLowerCase().replace(' ', '-')}`}>
          {site.rejection_status === 'Rejected' && `Rejected ${site.rejection_type?.replace('Nokia ', '') || ''}`}
          {site.rejection_status === 'Approved' && 'Approved'}
          {site.rejection_status === 'Pending Review' && 'Pending'}
        </div>
      )}

      <div className="nokia-card-header">
        <div className="nokia-priority">{site.priority || '—'}</div>
        <div className="nokia-site-id">{site.site_id}</div>
      </div>

      <div className="nokia-site-name">{site.final_site_name?.substring(0, 25) || 'N/A'}</div>

      <div className="nokia-status-bar" style={{ backgroundColor: statusColors.hex }}>
        {site.tssr_overall_status ? site.tssr_overall_status.replace('TSSR ', '').substring(0, 22) : 'N/A'}
      </div>

      <div className="nokia-dept-row">
        <span className={`nokia-dept ${getDeptClass(site.ti_status)}`}>TI</span>
        <span className={`nokia-dept ${getDeptClass(site.rf_plan_status)}`}>RF</span>
        <span className={`nokia-dept ${getDeptClass(site.rf_optim_status)}`}>OP</span>
        <span className={`nokia-dept ${getDeptClass(site.civil_status)}`}>CW</span>
        <span className={`nokia-dept ${getDeptClass(site.mw_status)}`}>MW</span>
      </div>

      <div className="nokia-card-info">
        <div className="info-item">
          <span className="info-label">Contractor:</span>
          <span className="info-value">{site.tssr_subcon || '—'}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Location:</span>
          <span className="info-value">{site.governorate || '—'}</span>
        </div>
      </div>

      {/* Review Button */}
      {showReviewButton && (
        <button className="nokia-review-btn" onClick={() => onReview(site)}>
          {site.rejection_status ? 'Edit Review' : 'Review'}
        </button>
      )}
    </div>
  )
}

export default SiteCard
