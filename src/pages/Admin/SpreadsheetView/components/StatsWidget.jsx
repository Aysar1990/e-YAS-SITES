/**
 * StatsWidget - Quick Stats Dashboard for SpreadsheetView
 * Displays live statistics with clickable filtering
 */

import React, { useMemo } from 'react'
import './StatsWidget.css'

const StatsWidget = ({ data, onStatClick, onClose }) => {
  const stats = useMemo(() => {
    if (!data || data.length === 0) return null

    const total = data.length
    const approved = data.filter(s => s.tssr_overall_status === 'Approved').length
    const pending = data.filter(s =>
      s.tssr_overall_status?.toLowerCase().includes('pending') ||
      s.tssr_overall_status?.toLowerCase().includes('under')
    ).length
    const rejected = data.filter(s => s.tssr_overall_status === 'Rejected').length

    // Count by governorate
    const byGov = data.reduce((acc, site) => {
      const gov = site.governorate || 'Unknown'
      acc[gov] = (acc[gov] || 0) + 1
      return acc
    }, {})

    // Get top 5 governorates
    const topGovs = Object.entries(byGov)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    const approvalRate = total > 0 ? (approved / total * 100).toFixed(1) : '0.0'

    return { total, approved, pending, rejected, topGovs, approvalRate }
  }, [data])

  if (!stats) return null

  const handleStatClick = (type, value) => {
    if (onStatClick) {
      onStatClick(type, value)
    }
  }

  return (
    <div className="stats-widget">
      <div className="stats-header">
        <h3>Quick Stats</h3>
        {onClose && (
          <button onClick={onClose} className="stats-close" title="Close">
            &times;
          </button>
        )}
      </div>

      <div className="stat-grid">
        <div
          className="stat-card total"
          onClick={() => handleStatClick('all')}
          title="Click to show all sites"
        >
          <span className="stat-value">{stats.total}</span>
          <span className="stat-label">Total Sites</span>
        </div>

        <div
          className="stat-card approved"
          onClick={() => handleStatClick('approved')}
          title="Click to filter Approved sites"
        >
          <span className="stat-value">{stats.approved}</span>
          <span className="stat-label">Approved</span>
          <span className="stat-percent">{stats.approvalRate}%</span>
        </div>

        <div
          className="stat-card pending"
          onClick={() => handleStatClick('pending')}
          title="Click to filter Pending sites"
        >
          <span className="stat-value">{stats.pending}</span>
          <span className="stat-label">Pending</span>
        </div>

        <div
          className="stat-card rejected"
          onClick={() => handleStatClick('rejected')}
          title="Click to filter Rejected sites"
        >
          <span className="stat-value">{stats.rejected}</span>
          <span className="stat-label">Rejected</span>
        </div>
      </div>

      <div className="top-govs">
        <h4>Top Governorates</h4>
        {stats.topGovs.map(([gov, count]) => (
          <div
            key={gov}
            className="gov-item"
            onClick={() => handleStatClick('gov', gov)}
            title={`Click to filter ${gov}`}
          >
            <span className="gov-name">{gov}</span>
            <div className="gov-bar-container">
              <div
                className="gov-bar"
                style={{ width: `${(count / stats.total) * 100}%` }}
              />
            </div>
            <span className="gov-count">{count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default StatsWidget
