/**
 * Site statistics badges component
 * @module components/Sites/components/SiteStats
 */

/**
 * Site statistics badges for Nokia view
 * @param {Object} props - Component props
 * @param {Array} props.sites - Sites array to calculate stats from
 * @param {string} props.className - Additional CSS class
 */
export const SiteStats = ({ sites = [], className = '' }) => {
  const rejectedCount = sites.filter(s => s.rejection_status === 'Rejected').length
  const approvedCount = sites.filter(s => s.rejection_status === 'Approved').length
  const notReviewedCount = sites.filter(s => !s.rejection_status).length

  return (
    <div className={`nokia-stats-badges ${className}`}>
      <div className="nokia-stat-badge rejected">
        <span className="stat-count">{rejectedCount}</span>
        <span className="stat-label">Rejected</span>
      </div>
      <div className="nokia-stat-badge approved">
        <span className="stat-count">{approvedCount}</span>
        <span className="stat-label">Approved</span>
      </div>
      <div className="nokia-stat-badge pending">
        <span className="stat-count">{notReviewedCount}</span>
        <span className="stat-label">Not Reviewed</span>
      </div>
    </div>
  )
}

/**
 * Generic status summary for admin view
 * @param {Object} props - Component props
 * @param {number} props.total - Total sites count
 * @param {number} props.filtered - Filtered sites count
 * @param {string} props.phase - Current phase name
 * @param {boolean} props.useFirebase - Firebase enabled
 * @param {boolean} props.connected - Firebase connected
 */
export const SiteSummary = ({
  total,
  filtered,
  phase,
  useFirebase = false,
  connected = false
}) => {
  return (
    <div className="page-header__info">
      <h1 className="page-title">Sites</h1>
      <p className="page-subtitle">
        {filtered} of {total} sites
        {phase && phase !== 'ALL' && ` - ${phase}`}
        {useFirebase && connected && (
          <span style={{ marginLeft: '10px', color: '#8FD9D9' }}>☁️ Firebase Live</span>
        )}
      </p>
    </div>
  )
}

export default SiteStats
