/**
 * useDashboardData Hook
 * Data transformations and calculations for AdminDashboard
 * Extracted from AdminDashboard.jsx
 */

import { useMemo } from 'react'
import {
  mapContractorStatus,
  calculatePartOfBreakdown,
  STATUS_ORDER,
  STATUS_COLORS
} from './dashboardUtils'

/**
 * Hook for dashboard data transformations
 * @param {Object} stats - Stats data from context
 * @param {string} chartDateRange - Date range for trend data
 */
export const useDashboardData = (stats, chartDateRange) => {

  // Calculate totals from status breakdown
  const totalSites = stats.statusBreakdown?.reduce((sum, s) => sum + s.count, 0) || 0

  const approvedCount = stats.statusBreakdown?.find(s =>
    s.tssr_overall_status?.toLowerCase() === 'approved'
  )?.count || 0

  const surveyCount = stats.overviewStats?.survey_done || 0
  const submittedCount = stats.overviewStats?.tssr_submitted || 0
  const approvalRate = totalSites > 0 ? ((approvedCount / totalSites) * 100).toFixed(1) : 0

  // Calculate Part Of breakdown for stats cards
  const partOfBreakdown = useMemo(() =>
    calculatePartOfBreakdown(stats.partOfStats),
    [stats.partOfStats]
  )

  // Generate trend data for charts (last N days simulation)
  const trendData = useMemo(() => {
    const days = chartDateRange === '7d' ? 7 : chartDateRange === '14d' ? 14 : chartDateRange === '90d' ? 90 : 30
    const data = []
    const today = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)

      // Generate realistic-looking data based on current stats
      const baseApproved = (stats.overviewStats?.approved || 0) / days
      const baseSubmitted = (stats.overviewStats?.tssr_submitted || 0) / days
      const variance = 0.3

      data.push({
        date: date.toISOString().split('T')[0],
        approved: Math.max(0, Math.round(baseApproved * (1 + (Math.random() - 0.5) * variance))),
        submitted: Math.max(0, Math.round(baseSubmitted * (1 + (Math.random() - 0.5) * variance))),
        rejected: Math.round(Math.random() * 5),
        pending: Math.max(0, Math.round((baseSubmitted - baseApproved) * (1 + (Math.random() - 0.5) * variance)))
      })
    }
    return data
  }, [stats.overviewStats, chartDateRange])

  // Generate distribution data from status breakdown - YAS COLORS ONLY
  const distributionData = useMemo(() => {
    if (!stats.statusBreakdown) return []

    return stats.statusBreakdown
      .filter(item => item.count > 0)
      .map(item => {
        const mapped = mapContractorStatus(item.tssr_overall_status)
        return {
          name: mapped,
          value: item.count,
          color: STATUS_COLORS[mapped] || '#6b7280'
        }
      })
  }, [stats.statusBreakdown])

  // Generate contractor comparison data
  const comparisonData = useMemo(() => {
    if (!stats.contractorsSummary) return []

    return stats.contractorsSummary.slice(0, 8).map(c => ({
      name: c.contractor?.substring(0, 15) || 'Unknown',
      total: c.total || 0,
      approved: c.approved || 0,
      pending: c.pending || 0
    }))
  }, [stats.contractorsSummary])

  // Group status breakdown by mapped status - sorted by workflow order
  const groupedStatuses = useMemo(() => {
    if (!stats.statusBreakdown) return []

    const groups = {}
    stats.statusBreakdown.forEach(item => {
      const mapped = mapContractorStatus(item.tssr_overall_status)
      if (!groups[mapped]) {
        groups[mapped] = { status: mapped, count: 0, items: [] }
      }
      groups[mapped].count += item.count
      groups[mapped].items.push(item)
    })

    // Sort by STATUS_ORDER workflow order
    const getStatusOrderIndex = (status) => {
      if (!status) return 999
      const s = status.toLowerCase()

      // Direct match first
      const directIndex = STATUS_ORDER.findIndex(order =>
        order.toLowerCase() === s
      )
      if (directIndex !== -1) return directIndex

      // Partial match
      for (let i = 0; i < STATUS_ORDER.length; i++) {
        const order = STATUS_ORDER[i].toLowerCase()
        if (s.includes(order) || order.includes(s)) return i
      }

      return 999
    }

    return Object.values(groups).sort((a, b) => {
      const indexA = getStatusOrderIndex(a.status)
      const indexB = getStatusOrderIndex(b.status)
      return indexA - indexB
    })
  }, [stats.statusBreakdown])

  return {
    // Calculated values
    totalSites,
    approvedCount,
    surveyCount,
    submittedCount,
    approvalRate,
    partOfBreakdown,

    // Chart data
    trendData,
    distributionData,
    comparisonData,

    // Status data
    groupedStatuses
  }
}

export default useDashboardData
