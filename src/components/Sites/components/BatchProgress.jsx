/**
 * BatchProgress Component
 * Shows progress of batch operations
 */

import React from 'react'
import './BatchProgress.css'

const BatchProgress = ({
  isProcessing,
  current = 0,
  total = 0,
  operation = 'Processing',
  onCancel,
  className = ''
}) => {
  if (!isProcessing && current === 0) return null

  const percentage = total > 0 ? Math.round((current / total) * 100) : 0
  const isComplete = current === total && total > 0

  return (
    <div className={`batch-progress ${isComplete ? 'batch-progress--complete' : ''} ${className}`}>
      <div className="batch-progress__header">
        <div className="batch-progress__info">
          <span className="batch-progress__icon">
            {isComplete ? '✅' : '⚙️'}
          </span>
          <div>
            <div className="batch-progress__title">
              {isComplete ? 'Complete!' : operation}
            </div>
            <div className="batch-progress__subtitle">
              {current} of {total} sites
            </div>
          </div>
        </div>

        {!isComplete && onCancel && (
          <button
            className="batch-progress__cancel"
            onClick={onCancel}
            disabled={!isProcessing}
          >
            Cancel
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="batch-progress__bar-container">
        <div 
          className="batch-progress__bar"
          style={{ width: `${percentage}%` }}
        >
          <span className="batch-progress__percentage">{percentage}%</span>
        </div>
      </div>

      {/* Status */}
      {isComplete && (
        <div className="batch-progress__status">
          Operation completed successfully
        </div>
      )}
    </div>
  )
}

export default BatchProgress
