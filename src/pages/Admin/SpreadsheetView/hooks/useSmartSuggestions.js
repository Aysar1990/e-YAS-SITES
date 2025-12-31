/**
 * Smart Suggestions Hook
 * Phase 4: AI-powered insights and recommendations based on data analysis
 */

import { useState, useEffect, useMemo, useCallback } from 'react'

/**
 * Suggestion types for visual styling
 */
export const suggestionTypes = {
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  INFO: 'info'
}

/**
 * Smart Suggestions Hook - Analyzes data and provides actionable insights
 * @param {Array} data - The row data to analyze
 * @returns {Object} - { suggestions, dismissSuggestion, clearDismissed, hasNew }
 */
export const useSmartSuggestions = (data) => {
  const [suggestions, setSuggestions] = useState([])
  const [dismissed, setDismissed] = useState([])

  /**
   * Calculate all suggestions from the data
   * Uses useMemo for performance optimization on large datasets
   */
  const calculatedSuggestions = useMemo(() => {
    if (!data || data.length === 0) return []

    const newSuggestions = []

    // =========================================
    // 1. OLD PENDING DETECTION
    // Sites with pending status for more than 15 days
    // =========================================
    const oldPending = data.filter(site =>
      site.tssr_overall_status?.toLowerCase().includes('pending') &&
      Number(site.action_age) > 15
    )

    if (oldPending.length > 0) {
      newSuggestions.push({
        id: 'old_pending',
        type: suggestionTypes.WARNING,
        icon: '⏰',
        title: `${oldPending.length} sites pending > 15 days`,
        description: `These sites have been waiting for action and may need escalation.`,
        action: {
          label: 'View Sites',
          filter: {
            type: 'smart',
            query: 'status:pending age:>15'
          }
        },
        priority: 1,
        data: { count: oldPending.length }
      })
    }

    // =========================================
    // 2. BEST CONTRACTOR PERFORMANCE
    // Identify contractors with >80% approval rate (min 10 sites)
    // =========================================
    const contractorStats = {}
    data.forEach(site => {
      const contractor = site.tssr_subcon
      if (!contractor || contractor.trim() === '') return

      if (!contractorStats[contractor]) {
        contractorStats[contractor] = { total: 0, approved: 0 }
      }

      contractorStats[contractor].total++
      if (site.tssr_overall_status === 'Approved') {
        contractorStats[contractor].approved++
      }
    })

    const contractorRankings = Object.entries(contractorStats)
      .map(([name, stats]) => ({
        name,
        rate: stats.total > 0 ? (stats.approved / stats.total * 100) : 0,
        total: stats.total,
        approved: stats.approved
      }))
      .filter(c => c.total >= 10)
      .sort((a, b) => b.rate - a.rate)

    const bestContractor = contractorRankings[0]

    if (bestContractor && bestContractor.rate > 80) {
      newSuggestions.push({
        id: 'best_contractor',
        type: suggestionTypes.SUCCESS,
        icon: '⭐',
        title: `${bestContractor.name} leads with ${bestContractor.rate.toFixed(1)}% approval`,
        description: `Excellent performance on ${bestContractor.total} sites (${bestContractor.approved} approved).`,
        action: {
          label: 'View Their Sites',
          filter: {
            type: 'field',
            field: 'tssr_subcon',
            value: bestContractor.name
          }
        },
        priority: 4,
        data: { contractor: bestContractor }
      })
    }

    // Also identify worst performer (if significantly low)
    const worstContractor = contractorRankings[contractorRankings.length - 1]
    if (worstContractor && worstContractor.rate < 40 && worstContractor.total >= 15) {
      newSuggestions.push({
        id: 'worst_contractor',
        type: suggestionTypes.WARNING,
        icon: '⚡',
        title: `${worstContractor.name} has ${worstContractor.rate.toFixed(1)}% approval rate`,
        description: `May need quality review on ${worstContractor.total} sites.`,
        action: {
          label: 'View Their Sites',
          filter: {
            type: 'field',
            field: 'tssr_subcon',
            value: worstContractor.name
          }
        },
        priority: 3,
        data: { contractor: worstContractor }
      })
    }

    // =========================================
    // 3. GOVERNORATE NEAR COMPLETION
    // Governorates with >=90% completion rate
    // =========================================
    const govStats = {}
    data.forEach(site => {
      const gov = site.governorate
      if (!gov || gov.trim() === '') return

      if (!govStats[gov]) {
        govStats[gov] = { total: 0, approved: 0 }
      }

      govStats[gov].total++
      if (site.tssr_overall_status === 'Approved') {
        govStats[gov].approved++
      }
    })

    const nearComplete = Object.entries(govStats)
      .map(([name, stats]) => ({
        name,
        rate: stats.total > 0 ? (stats.approved / stats.total * 100) : 0,
        remaining: stats.total - stats.approved,
        total: stats.total
      }))
      .filter(g => g.rate >= 90 && g.remaining > 0)
      .sort((a, b) => b.rate - a.rate)

    nearComplete.forEach(gov => {
      newSuggestions.push({
        id: `gov_complete_${gov.name.replace(/\s+/g, '_').toLowerCase()}`,
        type: suggestionTypes.INFO,
        icon: '🎯',
        title: `${gov.name} is ${gov.rate.toFixed(1)}% complete`,
        description: `Only ${gov.remaining} site${gov.remaining > 1 ? 's' : ''} remaining to finish!`,
        action: {
          label: 'View Remaining',
          filter: {
            type: 'combined',
            filters: [
              { field: 'governorate', value: gov.name },
              { field: 'tssr_overall_status', value: 'Approved', negate: true }
            ]
          }
        },
        priority: 3,
        data: { governorate: gov }
      })
    })

    // =========================================
    // 4. DEPARTMENT BOTTLENECK DETECTION
    // Departments with >20 pending items
    // =========================================
    const deptFields = [
      { field: 'ti_status', name: 'TI Department' },
      { field: 'rf_plan_status', name: 'RF Plan Department' },
      { field: 'rf_optim_status', name: 'RF Optimization' },
      { field: 'civil_status', name: 'Civil Department' }
    ]

    const deptStats = deptFields.map(dept => {
      const pending = data.filter(site =>
        site[dept.field]?.toLowerCase().includes('pending')
      ).length
      return { ...dept, pending }
    }).filter(d => d.pending > 20)
      .sort((a, b) => b.pending - a.pending)

    if (deptStats.length > 0) {
      const maxDept = deptStats[0]
      newSuggestions.push({
        id: 'dept_bottleneck',
        type: suggestionTypes.WARNING,
        icon: '🚧',
        title: `${maxDept.name} has ${maxDept.pending} pending reviews`,
        description: deptStats.length > 1
          ? `${deptStats.length} departments have backlogs. Focus on ${maxDept.name} first.`
          : `This department may be creating a bottleneck in the workflow.`,
        action: {
          label: 'View Pending',
          filter: {
            type: 'smart',
            query: `${maxDept.field.replace('_status', '')}:pending`
          }
        },
        priority: 2,
        data: { departments: deptStats }
      })
    }

    // =========================================
    // 5. DUPLICATE SITE NAME DETECTION
    // Find potential duplicate entries
    // =========================================
    const siteNames = {}
    data.forEach(site => {
      const name = site.final_site_name?.trim()
      if (name) {
        if (!siteNames[name]) {
          siteNames[name] = []
        }
        siteNames[name].push(site.site_id)
      }
    })

    const duplicates = Object.entries(siteNames)
      .filter(([_, ids]) => ids.length > 1)
      .map(([name, ids]) => ({ name, count: ids.length, ids }))

    if (duplicates.length > 0) {
      const totalDuplicates = duplicates.reduce((sum, d) => sum + d.count, 0)
      newSuggestions.push({
        id: 'duplicates',
        type: suggestionTypes.ERROR,
        icon: '⚠️',
        title: `${duplicates.length} potential duplicate site names`,
        description: `Found ${totalDuplicates} entries with duplicate names. Review and verify these entries.`,
        action: duplicates.length > 0 ? {
          label: 'View First Duplicate',
          filter: {
            type: 'field',
            field: 'final_site_name',
            value: duplicates[0].name
          }
        } : null,
        priority: 1,
        data: { duplicates }
      })
    }

    // =========================================
    // 6. QUICK WIN DETECTION
    // Sites that are almost approved (3+ departments approved)
    // =========================================
    const deptStatusFields = ['ti_status', 'rf_plan_status', 'rf_optim_status', 'civil_status']
    const quickWins = data.filter(site => {
      if (site.tssr_overall_status === 'Approved') return false

      const approvedDepts = deptStatusFields.filter(field =>
        site[field]?.toLowerCase() === 'approved'
      ).length

      return approvedDepts >= 3
    })

    if (quickWins.length > 0) {
      newSuggestions.push({
        id: 'quick_wins',
        type: suggestionTypes.SUCCESS,
        icon: '🏁',
        title: `${quickWins.length} sites almost complete`,
        description: `These sites have 3+ departments approved. Just one or two more to go!`,
        action: {
          label: 'View Quick Wins',
          filter: {
            type: 'custom',
            predicate: 'quick_wins'
          }
        },
        priority: 2,
        data: { sites: quickWins.slice(0, 10) }
      })
    }

    // =========================================
    // 7. RECENT ACTIVITY SUMMARY
    // Sites modified recently (action_age < 3)
    // =========================================
    const recentActivity = data.filter(site =>
      Number(site.action_age) < 3 && Number(site.action_age) >= 0
    )

    if (recentActivity.length > 5) {
      newSuggestions.push({
        id: 'recent_activity',
        type: suggestionTypes.INFO,
        icon: '📊',
        title: `${recentActivity.length} sites active in last 3 days`,
        description: `Good momentum! Recent activity shows progress on the ground.`,
        action: {
          label: 'View Recent',
          filter: {
            type: 'smart',
            query: 'age:<3'
          }
        },
        priority: 5,
        data: { count: recentActivity.length }
      })
    }

    // =========================================
    // 8. COMPLETION MILESTONE
    // Overall completion percentage milestones
    // =========================================
    const totalSites = data.length
    const approvedSites = data.filter(s => s.tssr_overall_status === 'Approved').length
    const completionRate = (approvedSites / totalSites * 100)

    if (completionRate >= 75 && completionRate < 90) {
      newSuggestions.push({
        id: 'milestone_75',
        type: suggestionTypes.SUCCESS,
        icon: '🎉',
        title: `${completionRate.toFixed(1)}% overall completion reached!`,
        description: `Great progress! ${totalSites - approvedSites} sites remaining to reach 100%.`,
        action: null,
        priority: 5,
        data: { completionRate, remaining: totalSites - approvedSites }
      })
    } else if (completionRate >= 90) {
      newSuggestions.push({
        id: 'milestone_90',
        type: suggestionTypes.SUCCESS,
        icon: '🏆',
        title: `${completionRate.toFixed(1)}% completion - Final stretch!`,
        description: `Almost there! Only ${totalSites - approvedSites} sites remaining.`,
        action: {
          label: 'View Remaining',
          filter: {
            type: 'field',
            field: 'tssr_overall_status',
            value: 'Approved',
            negate: true
          }
        },
        priority: 4,
        data: { completionRate, remaining: totalSites - approvedSites }
      })
    }

    // Sort by priority (1 = highest priority)
    return newSuggestions.sort((a, b) => a.priority - b.priority)
  }, [data])

  /**
   * Filter out dismissed suggestions and update state
   */
  useEffect(() => {
    const active = calculatedSuggestions.filter(s => !dismissed.includes(s.id))
    setSuggestions(active)
  }, [calculatedSuggestions, dismissed])

  /**
   * Dismiss a suggestion by ID
   */
  const dismissSuggestion = useCallback((id) => {
    setDismissed(prev => [...prev, id])
  }, [])

  /**
   * Clear all dismissed suggestions (show all again)
   */
  const clearDismissed = useCallback(() => {
    setDismissed([])
  }, [])

  /**
   * Check if there are new/active suggestions
   */
  const hasNew = suggestions.length > 0

  /**
   * Get count by type
   */
  const countByType = useMemo(() => {
    return {
      success: suggestions.filter(s => s.type === suggestionTypes.SUCCESS).length,
      warning: suggestions.filter(s => s.type === suggestionTypes.WARNING).length,
      error: suggestions.filter(s => s.type === suggestionTypes.ERROR).length,
      info: suggestions.filter(s => s.type === suggestionTypes.INFO).length,
      total: suggestions.length
    }
  }, [suggestions])

  return {
    suggestions,
    dismissSuggestion,
    clearDismissed,
    hasNew,
    countByType,
    dismissedCount: dismissed.length,
    totalCalculated: calculatedSuggestions.length
  }
}

export default useSmartSuggestions
