/**
 * Premium FlipCard Component - GOD LEVEL
 * 3D Flip Animation with Status Glow
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import './FlipCard.css'

const FlipCard = ({
  site,
  isFlipped,
  onFlip,
  onEdit,
  canEdit,
  isSelected,
  onSelect,
  selectionMode
}) => {
  const { t } = useTranslation()

  // Status Classification - Exact Match for Card Colors
  const getStatusClass = (status) => {
    const s = String(status || '').toLowerCase()
    
    // Approved - Green
    if (s.includes('approved')) return 'approved'
    
    // Zain Validation - Purple
    if (s.includes('zain')) return 'zain'
    
    // ROM Review - Light Blue
    if (s.includes('rom review')) return 'rom'
    
    // Nokia NPO Validation - Dark Navy
    if (s.includes('nokia npo')) return 'nokia-npo'
    
    // Nokia ROM Validation - Yellow
    if (s.includes('nokia rom')) return 'nokia-rom'
    
    // Nokia GSD Validation - Orange
    if (s.includes('nokia gsd')) return 'nokia-gsd'
    
    // Subcon Validation - Turquoise
    if (s.includes('subcon')) return 'subcon'
    
    // Need Access - Red
    if (s.includes('need access') || s.includes('access')) return 'access'
    
    // Site not Surveyed - Gray
    if (s.includes('not surveyed') || s.includes('surveyed')) return 'notstarted'
    
    return 'default'
  }

  const statusClass = getStatusClass(site.tssr_overall_status)

  const handleCardClick = (e) => {
    if (selectionMode) {
      e.stopPropagation()
      onSelect(site.site_id)
    } else {
      onFlip()
    }
  }

  const handleCheckboxClick = (e) => {
    e.stopPropagation()
    onSelect(site.site_id)
  }

  const handleEdit = (e) => {
    e.stopPropagation()
    onEdit(site, e)
  }

  return (
    <div
      className={`flip-card flip-card--${statusClass} ${isFlipped ? 'flipped' : ''} ${isSelected ? 'selected' : ''}`}
      onClick={handleCardClick}
    >
      <div className="flip-card__inner">
        {/* FRONT FACE */}
        <div className="flip-card__front">
          {/* Selection Checkbox */}
          <div
            className="flip-card__checkbox"
            onClick={handleCheckboxClick}
          >
            {isSelected && '✓'}
          </div>

          {/* Header */}
          <div className="flip-card__header">
            <span className="flip-card__id">{site.site_id}</span>
            <span className="flip-card__priority">{site.priority || 'N/A'}</span>
          </div>

          {/* Site Name */}
          <div className="flip-card__name">
            {site.final_site_name || site.site_id}
          </div>

          {/* Status */}
          <div className={`flip-card__status flip-card__status--${statusClass}`}>
            <span className="status-dot"></span>
            {site.tssr_overall_status || 'Unknown'}
          </div>
        </div>

        {/* BACK FACE */}
        <div className="flip-card__back">
          <div className="flip-card__back-content">
            <div className="flip-card__back-row">
              <span className="flip-card__back-label">Phase</span>
              <span className="flip-card__back-value">{site.phase_name || '-'}</span>
            </div>
            <div className="flip-card__back-row">
              <span className="flip-card__back-label">Type</span>
              <span className="flip-card__back-value">{site.site_type || '-'}</span>
            </div>
            <div className="flip-card__back-row">
              <span className="flip-card__back-label">Governorate</span>
              <span className="flip-card__back-value">{site.governorate || '-'}</span>
            </div>
            <div className="flip-card__back-row">
              <span className="flip-card__back-label">Contractor</span>
              <span className="flip-card__back-value">{site.subcontractor || '-'}</span>
            </div>
          </div>

          {/* Actions */}
          {canEdit && (
            <div className="flip-card__actions">
              <button className="flip-card__action-btn" onClick={handleEdit}>
                ✎ Edit
              </button>
              <button className="flip-card__action-btn" onClick={(e) => { e.stopPropagation(); onFlip(); }}>
                ↩ Back
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export { FlipCard }
export default FlipCard
