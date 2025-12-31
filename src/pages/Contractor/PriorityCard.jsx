/**
 * PriorityCard Component
 * Flippable card showing site priority and status
 * Extracted from ContractorSites.jsx
 */

import { useTranslation } from 'react-i18next'
import { getStatusColors, hasRejection, getDeptClass, getStatusClass } from './contractorUtils'

const PriorityCard = ({ site, isFlipped, onFlip, onRequestChange }) => {
  const { t } = useTranslation()
  const statusColors = getStatusColors(site.tssr_overall_status)
  const isRejected = hasRejection(site)
  const statusClassValue = getStatusClass(site.tssr_overall_status)

  const cardStyle = {
    '--status-color': statusColors.hex,
    '--neon-rgb': isRejected ? '239, 68, 68' : statusColors.rgb,
    height: '160px',
    minWidth: '160px',
  }

  return (
    <div
      className={`priority-card ${isFlipped ? 'flipped' : ''} ${isRejected ? 'has-rejection' : ''} ${statusClassValue}`}
      style={cardStyle}
      onClick={onFlip}
    >
      <div className="priority-card__inner">
        {/* Front Side */}
        <div className="priority-card__front">
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
              <span className="info-label">{t('card.location')}:</span>
              <span className="info-value">{site.governorate || '—'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Part Of:</span>
              <span className="info-value">{site.part_of || '—'}</span>
            </div>
          </div>

          {/* Department Status Row */}
          <div className="back-dept-row">
            <span className={`back-dept-item ${getDeptClass(site.mw_status)}`}>MW</span>
            <span className={`back-dept-item ${getDeptClass(site.civil_status)}`}>CW</span>
            <span className={`back-dept-item ${getDeptClass(site.rf_optim_status)}`}>OP</span>
            <span className={`back-dept-item ${getDeptClass(site.rf_plan_status)}`}>RF</span>
            <span className={`back-dept-item ${getDeptClass(site.ti_status)}`}>TI</span>
          </div>

          {/* Request Change Button */}
          {onRequestChange && (
            <button
              className="request-change-btn"
              onClick={(e) => {
                e.stopPropagation()
                onRequestChange()
              }}
              style={{
                marginTop: '8px',
                width: '100%',
                padding: '6px 8px',
                background: 'linear-gradient(135deg, #8fd9d9 0%, #6bc5c5 100%)',
                color: '#0f172a',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.7rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.02)'
                e.target.style.boxShadow = '0 2px 8px rgba(143, 217, 217, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)'
                e.target.style.boxShadow = 'none'
              }}
            >
              Request Change
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default PriorityCard
