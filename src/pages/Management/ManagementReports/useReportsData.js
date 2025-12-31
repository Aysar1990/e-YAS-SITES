/**
 * useReportsData Hook
 * Statistics calculations for ManagementReports
 */

import { useMemo } from 'react'

export const useReportsData = (sites) => {
  return useMemo(() => {
    const total = sites.length
    const approved = sites.filter(s => s.tssr_overall_status === 'Approved').length
    const underReview = sites.filter(s => s.tssr_overall_status?.includes('Under')).length
    const rejected = sites.filter(s =>
      s.ti_status?.toLowerCase().includes('rejected') ||
      s.rf_plan_status?.toLowerCase().includes('rejected') ||
      s.rf_opt_status?.toLowerCase().includes('rejected') ||
      s.civil_status?.toLowerCase().includes('rejected') ||
      s.mw_status?.toLowerCase().includes('rejected')
    ).length
    const notSurveyed = sites.filter(s => s.tssr_overall_status === 'Site not Surveyed').length

    // Status breakdown for pie chart
    const statusCounts = {}
    sites.forEach(site => {
      const status = site.tssr_overall_status || 'Unknown'
      statusCounts[status] = (statusCounts[status] || 0) + 1
    })
    const statusData = Object.entries(statusCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    // Governorate breakdown
    const govCounts = {}
    sites.forEach(site => {
      const gov = site.governorate || 'Unknown'
      govCounts[gov] = (govCounts[gov] || 0) + 1
    })
    const governorateData = Object.entries(govCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)

    // Contractor breakdown
    const contractorCounts = {}
    sites.forEach(site => {
      const contractor = site.tssr_subcon || 'Unknown'
      contractorCounts[contractor] = (contractorCounts[contractor] || 0) + 1
    })
    const contractorData = Object.entries(contractorCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)

    // Department stats
    const deptStats = {
      ti: { approved: 0, pending: 0, rejected: 0 },
      rfPlan: { approved: 0, pending: 0, rejected: 0 },
      rfOpt: { approved: 0, pending: 0, rejected: 0 },
      civil: { approved: 0, pending: 0, rejected: 0 },
      mw: { approved: 0, pending: 0, rejected: 0 }
    }

    const fieldMap = {
      ti: 'ti_status',
      rfPlan: 'rf_plan_status',
      rfOpt: 'rf_opt_status',
      civil: 'civil_status',
      mw: 'mw_status'
    }

    sites.forEach(site => {
      Object.keys(deptStats).forEach(dept => {
        const status = site[fieldMap[dept]]?.toLowerCase() || ''
        if (status.includes('approved')) deptStats[dept].approved++
        else if (status.includes('rejected')) deptStats[dept].rejected++
        else if (status) deptStats[dept].pending++
      })
    })

    const departmentData = [
      { name: 'TI', ...deptStats.ti },
      { name: 'RF Plan', ...deptStats.rfPlan },
      { name: 'RF Opt', ...deptStats.rfOpt },
      { name: 'Civil', ...deptStats.civil },
      { name: 'MW', ...deptStats.mw }
    ]

    return {
      total,
      approved,
      underReview,
      rejected,
      notSurveyed,
      approvalRate: total > 0 ? ((approved / total) * 100).toFixed(1) : 0,
      statusData,
      governorateData,
      contractorData,
      departmentData,
      uniqueGovernorates: [...new Set(sites.map(s => s.governorate).filter(Boolean))],
      uniqueStatuses: [...new Set(sites.map(s => s.tssr_overall_status).filter(Boolean))]
    }
  }, [sites])
}

export default useReportsData
