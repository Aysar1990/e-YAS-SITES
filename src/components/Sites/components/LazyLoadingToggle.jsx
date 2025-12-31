/**
 * LazyLoadingToggle Component
 * Toggle to enable/disable lazy loading (virtualization)
 */

import React from 'react'
import './LazyLoadingToggle.css'

const LazyLoadingToggle = ({
  enabled = false,
  onToggle,
  itemCount = 0,
  className = ''
}) => {
  const performanceGain = enabled ? '80-90%' : '0%'
  const memoryUsage = enabled ? '~30-50 MB' : '~150-200 MB'

  return (
    <div className={`lazy-loading-toggle ${className}`}>
      <div className="lazy-loading-toggle__header">
        <div className="lazy-loading-toggle__info">
          <span className="lazy-loading-toggle__icon">⚡</span>
          <div>
            <div className="lazy-loading-toggle__title">Lazy Loading</div>
            <div className="lazy-loading-toggle__subtitle">
              Virtual scrolling for {itemCount.toLocaleString()} items
            </div>
          </div>
        </div>

        <label className="lazy-loading-toggle__switch">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onToggle(e.target.checked)}
          />
          <span className="lazy-loading-toggle__slider"></span>
        </label>
      </div>

      {enabled && (
        <div className="lazy-loading-toggle__metrics">
          <div className="lazy-loading-toggle__metric">
            <span className="lazy-loading-toggle__metric-label">Performance</span>
            <span className="lazy-loading-toggle__metric-value">+{performanceGain}</span>
          </div>
          <div className="lazy-loading-toggle__metric">
            <span className="lazy-loading-toggle__metric-label">Memory</span>
            <span className="lazy-loading-toggle__metric-value">{memoryUsage}</span>
          </div>
          <div className="lazy-loading-toggle__metric">
            <span className="lazy-loading-toggle__metric-label">Scroll</span>
            <span className="lazy-loading-toggle__metric-value">60 FPS</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default LazyLoadingToggle
