/**
 * Reports Summary Cards Component
 * Displays KPI summary statistics in card format
 */

import StatCard from '../../pages/Admin/Reports/components/StatCard'
import './ReportsSummaryCards.css'

const ReportsSummaryCards = ({ stats, activePhase = 'ALL' }) => {
  // Define card colors
  const COLORS = {
    default: '#8FD9D9',
    approved: '#8FD9D9',
    pending: '#FBBF24',
    rejected: '#EF4444',
    notSurveyed: '#6B7280'
  }

  return (
    <div className="summary-cards-grid">
      <StatCard
        title="Total Sites"
        value={stats.total || 0}
        icon="📍"
        color={COLORS.default}
        subtitle={`Phase: ${activePhase}`}
      />
      <StatCard
        title="Approved"
        value={stats.approved || 0}
        icon="✅"
        color={COLORS.approved}
        subtitle={`${stats.approvalRate || 0}% approval rate`}
      />
      <StatCard
        title="Under Review"
        value={stats.underReview || 0}
        icon="⏳"
        color={COLORS.pending}
      />
      <StatCard
        title="Has Rejection"
        value={stats.rejected || 0}
        icon="❌"
        color={COLORS.rejected}
      />
      <StatCard
        title="Not Surveyed"
        value={stats.notSurveyed || 0}
        icon="📋"
        color={COLORS.notSurveyed}
      />
    </div>
  )
}

export default ReportsSummaryCards
