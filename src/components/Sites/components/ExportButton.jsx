/**
 * Export to Excel button component
 * @module components/Sites/components/ExportButton
 */

/**
 * Export button with progress indicator
 * @param {Object} props - Component props
 * @param {Function} props.onExport - Export handler
 * @param {boolean} props.exporting - Whether export is in progress
 * @param {boolean} props.disabled - Whether button is disabled
 * @param {string} props.className - Additional CSS class
 */
export const ExportButton = ({
  onExport,
  exporting = false,
  disabled = false,
  className = ''
}) => {
  return (
    <button
      className={`export-btn ${exporting ? 'exporting' : ''} ${className}`}
      onClick={onExport}
      disabled={disabled || exporting}
    >
      {exporting ? (
        <>
          <span className="export-spinner"></span>
          Exporting...
        </>
      ) : (
        <>
          <span className="export-icon">📥</span>
          Export Excel
        </>
      )}
    </button>
  )
}

/**
 * Export progress indicator
 * @param {Object} props - Component props
 * @param {Object} props.progress - Progress object { status, progress, message }
 */
export const ExportProgress = ({ progress }) => {
  if (!progress) return null

  return (
    <div className={`export-progress ${progress.status}`}>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${progress.progress}%` }}
        ></div>
      </div>
      <span className="progress-message">{progress.message}</span>
    </div>
  )
}

export default ExportButton
