/**
 * Priority card component with flip effect
 * @module components/Sites/components/PriorityCard
 */

import { useTranslation } from 'react-i18next'
import { getStatusColors, hasRejection, getDeptClass, getStatusClass } from '../statusUtils'

/**
 * Priority card with front/back flip animation
 * @param {Object} props - Component props
 * @param {Object} props.site - Site data object
 * @param {boolean} props.isFlipped - Whether card is flipped
 * @param {Function} props.onFlip - Flip handler
 * @param {Function} props.onEdit - Edit handler
 * @param {boolean} props.canEdit - Whether editing is allowed
 */
export const PriorityCard = ({ site, isFlipped, onFlip, onEdit, canEdit, isSelected, onSelect, selectionMode }) => {
  const { t } = useTranslation()
  const statusColors = getStatusColors(site.tssr_overall_status)
  const isRejected = hasRejection(site)
  const statusClass = getStatusClass(site.tssr_overall_status)

  const cardStyle = {
    '--status-color': statusColors.hex,
    '--neon-rgb': isRejected ? '239, 68, 68' : statusColors.rgb,
    height: '160px',
    minWidth: '160px',
  }

  const handleEditClick = (e) => {
    e.stopPropagation()
    onEdit(site, e)
  }

  const handleCheckboxClick = (e) => {
    e.stopPropagation()
    onSelect(site.site_id)
  }

  return (
    <div
      className={`priority-card ${isFlipped ? 'flipped' : ''} ${isRejected ? 'has-rejection' : ''} ${statusClass} ${isSelected ? 'selected' : ''}`}
      style={cardStyle}
      onClick={onFlip}
    >
      <div className="priority-card__inner">
        {/* Front Side */}
        <div className="priority-card__front">
          {/* Selection Checkbox - Visible on hover or if selected/selectionMode */}
          {(canEdit || selectionMode) && (
            <div
              className={`card-checkbox ${isSelected ? 'checked' : ''}`}
              onClick={handleCheckboxClick}
            >
              {isSelected && '✓'}
            </div>
          )}

          <div className="priority-badge">{site.priority || '—'}</div>
          <div className="site-id-front">{site.site_id}</div>
          <div className="status-indicator" style={{ backgroundColor: statusColors.hex }}>
            {site.tssr_overall_status ? site.tssr_overall_status.replace('TSSR ', '').substring(0, 18) : 'N/A'}
          </div>
          <div className="dept-row">
            <span className={`dept-mini ${getDeptClass(site.ti_status)}`}>TI</span>
            <span className={`dept-mini ${getDeptClass(site.rf_plan_status)}`}>RF</span>
            <span className={`dept-mini ${getDeptClass(site.rf_optim_status)}`}>OP</span>
            <span className={`dept-mini ${getDeptClass(site.civil_status)}`}>CW</span>
            <span className={`dept-mini ${getDeptClass(site.mw_status)}`}>MW</span>
          </div>
        </div>

        {/* Back Side */}
        <div className="priority-card__back">
          {/* Selection Checkbox - Also on Back Side */}
          {(canEdit || selectionMode) && (
            <div
              className={`card-checkbox ${isSelected ? 'checked' : ''}`}
              onClick={handleCheckboxClick}
            >
              {isSelected && '✓'}
            </div>
          )}

          <div className="back-header">
            <span className="back-site-id">{site.site_id}</span>
            <span className="back-priority">P{site.priority || '—'}</span>
          </div>

          <div className="back-status" style={{ backgroundColor: statusColors.hex }}>
            {site.tssr_overall_status || 'Unknown'}
          </div>

          <div className="back-info">
            <div className="info-row">
              <span className="info-label">{t('card.name')}:</span>
              <span className="info-value">{site.final_site_name?.substring(0, 20) || '—'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">{t('card.contractor')}:</span>
              <span className="info-value">{site.tssr_subcon || '—'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">{t('card.location')}:</span>
              <span className="info-value">{site.governorate || '—'}</span>
            </div>
          </div>

          {/* Edit Button */}
          {canEdit && (
            <button className="card-edit-btn" onClick={handleEditClick} title="Edit Site">
              ✏️
            </button>
          )}

          {/* Department Status Row */}
          <div className="back-dept-row">
            <span className={`back-dept-item ${getDeptClass(site.mw_status)}`}>MW</span>
            <span className={`back-dept-item ${getDeptClass(site.civil_status)}`}>CW</span>
            <span className={`back-dept-item ${getDeptClass(site.rf_optim_status)}`}>OP</span>
            <span className={`back-dept-item ${getDeptClass(site.rf_plan_status)}`}>RF</span>
            <span className={`back-dept-item ${getDeptClass(site.ti_status)}`}>TI</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PriorityCard
