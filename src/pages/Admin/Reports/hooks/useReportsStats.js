/**
 * Reports Statistics Hook
 */

import { useMemo } from 'react'

export const useReportsStats = (sites) => {
  return useMemo(() => {
    // Helper function to get field value (supports both snake_case and camelCase)
    const getField = (site, snakeCase, camelCase) => {
      return site[camelCase] || site[snakeCase]
    }

    const total = sites.length
    const approved = sites.filter(s => 
      (s.tssrOverallStatus || s.tssr_overall_status) === 'Approved'
    ).length
    const underReview = sites.filter(s => 
      (s.tssrOverallStatus || s.tssr_overall_status)?.includes('Under')
    ).length
    const rejected = sites.filter(s =>
      getField(s, 'ti_status', 'tiStatus')?.toLowerCase().includes('rejected') ||
      getField(s, 'rf_plan_status', 'rfPlanStatus')?.toLowerCase().includes('rejected') ||
      getField(s, 'rf_opt_status', 'rfOptimStatus')?.toLowerCase().includes('rejected') ||
      getField(s, 'civil_status', 'civilStatus')?.toLowerCase().includes('rejected') ||
      getField(s, 'mw_status', 'mwStatus')?.toLowerCase().includes('rejected')
    ).length
    const notSurveyed = sites.filter(s => 
      (s.tssrOverallStatus || s.tssr_overall_status) === 'Site not Surveyed'
    ).length

    // Status breakdown for pie chart
    const statusCounts = {}
    sites.forEach(site => {
      const status = site.tssrOverallStatus || site.tssr_overall_status || 'Unknown'
      statusCounts[status] = (statusCounts[status] || 0) + 1
    })
    const statusData = Object.entries(statusCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    // Governorate breakdown for bar chart
    const govCounts = {}
    sites.forEach(site => {
      const gov = site.governorate || 'Unknown'
      govCounts[gov] = (govCounts[gov] || 0) + 1
    })
    const governorateData = Object.entries(govCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)

    // Contractor breakdown (support both snake_case and camelCase)
    const contractorCounts = {}
    sites.forEach(site => {
      const contractor = site.tssrSubcon || site.tssr_subcon || 'Unknown'
      contractorCounts[contractor] = (contractorCounts[contractor] || 0) + 1
    })
    const contractorData = Object.entries(contractorCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)

    // Department stats (support both snake_case and camelCase)
    const deptStats = {
      ti: { approved: 0, pending: 0, rejected: 0 },
      rfPlan: { approved: 0, pending: 0, rejected: 0 },
      rfOpt: { approved: 0, pending: 0, rejected: 0 },
      civil: { approved: 0, pending: 0, rejected: 0 },
      mw: { approved: 0, pending: 0, rejected: 0 }
    }
    sites.forEach(site => {
      ['ti', 'rfPlan', 'rfOpt', 'civil', 'mw'].forEach(dept => {
        const fieldMap = {
          ti: { snake: 'ti_status', camel: 'tiStatus' },
          rfPlan: { snake: 'rf_plan_status', camel: 'rfPlanStatus' },
          rfOpt: { snake: 'rf_opt_status', camel: 'rfOptimStatus' },
          civil: { snake: 'civil_status', camel: 'civilStatus' },
          mw: { snake: 'mw_status', camel: 'mwStatus' }
        }
        const status = (site[fieldMap[dept].camel] || site[fieldMap[dept].snake] || '').toLowerCase()
        if (status.includes('approved')) deptStats[dept].approved++
        else if (status.includes('rejected')) deptStats[dept].rejected++
        else if (status) deptStats[dept].pending++
      })
    })

    const departmentData = [
      { name: 'TI', approved: deptStats.ti.approved, pending: deptStats.ti.pending, rejected: deptStats.ti.rejected },
      { name: 'RF Plan', approved: deptStats.rfPlan.approved, pending: deptStats.rfPlan.pending, rejected: deptStats.rfPlan.rejected },
      { name: 'RF Opt', approved: deptStats.rfOpt.approved, pending: deptStats.rfOpt.pending, rejected: deptStats.rfOpt.rejected },
      { name: 'Civil', approved: deptStats.civil.approved, pending: deptStats.civil.pending, rejected: deptStats.civil.rejected },
      { name: 'MW', approved: deptStats.mw.approved, pending: deptStats.mw.pending, rejected: deptStats.mw.rejected }
    ]

    // Debug logging
    console.log('📊 CONTRACTOR DATA (Fixed):')
    contractorData.slice(0, 5).forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.name}: ${c.value}`)
    })
    
    console.log('📊 DEPARTMENT DATA (Fixed):')
    departmentData.forEach(d => {
      console.log(`  ${d.name}: Approved=${d.approved}, Pending=${d.pending}, Rejected=${d.rejected}`)
    })
    
    // Debug: Show first site structure
    if (sites.length > 0) {
      console.log('📊 Sample site fields:', {
        tssrSubcon: sites[0].tssrSubcon,
        tssr_subcon: sites[0].tssr_subcon,
        tiStatus: sites[0].tiStatus,
        ti_status: sites[0].ti_status
      })
    }

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
      uniqueStatuses: [...new Set(sites.map(s => s.tssrOverallStatus || s.tssr_overall_status).filter(Boolean))]
    }
  }, [sites])
}
