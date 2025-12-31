/**
 * Statistics Routes
 * Dashboard stats, breakdowns, overviews using Supabase
 */

const express = require('express');

module.exports = function(supabase) {
  const router = express.Router();

  // GET /api/stats - Main statistics
  router.get('/', async (req, res) => {
    try {
      const { phase, contractor } = req.query;
      const user = req.user;

      // Build base query
      let query = supabase.from('sites').select('*');

      if (phase && phase !== 'ALL') {
        query = query.eq('phase_name', phase);
      }

      // Contractor filter
      if (user.role === 'contractor' && user.contractor_name) {
        query = query.eq('tssr_subcon', user.contractor_name);
      } else if (contractor) {
        query = query.eq('tssr_subcon', contractor);
      }

      const { data: sites, error } = await query;

      if (error) throw error;

      const sitesList = sites || [];

      // Calculate statistics
      const stats = calculateStats(sitesList);

      res.json(stats);
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  });

  // GET /api/stats/breakdown - Stats by part_of
  router.get('/breakdown', async (req, res) => {
    try {
      const { phase } = req.query;

      let query = supabase.from('sites').select('part_of, tssr_overall_status');

      if (phase && phase !== 'ALL') {
        query = query.eq('phase_name', phase);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Group by part_of
      const breakdown = {};
      (data || []).forEach(site => {
        const partOf = site.part_of || 'Unknown';
        if (!breakdown[partOf]) {
          breakdown[partOf] = { total: 0, statuses: {} };
        }
        breakdown[partOf].total++;

        const status = site.tssr_overall_status || 'Unknown';
        breakdown[partOf].statuses[status] = (breakdown[partOf].statuses[status] || 0) + 1;
      });

      res.json(breakdown);
    } catch (error) {
      console.error('Get breakdown error:', error);
      res.status(500).json({ error: 'Failed to fetch breakdown' });
    }
  });

  // GET /api/stats/overview - Overview table
  router.get('/overview', async (req, res) => {
    try {
      const { phase } = req.query;

      let query = supabase.from('sites').select('tssr_subcon, tssr_overall_status, ti_status, rf_plan_status, civil_status');

      if (phase && phase !== 'ALL') {
        query = query.eq('phase_name', phase);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Group by contractor
      const overview = {};
      (data || []).forEach(site => {
        const contractor = site.tssr_subcon || 'Unassigned';
        if (!overview[contractor]) {
          overview[contractor] = {
            contractor,
            total: 0,
            completed: 0,
            inProgress: 0,
            pending: 0,
            rejected: 0
          };
        }
        overview[contractor].total++;

        const status = (site.tssr_overall_status || '').toLowerCase();
        if (status.includes('complete') || status.includes('approved')) {
          overview[contractor].completed++;
        } else if (status.includes('progress') || status.includes('review')) {
          overview[contractor].inProgress++;
        } else if (status.includes('reject') || status.includes('fail')) {
          overview[contractor].rejected++;
        } else {
          overview[contractor].pending++;
        }
      });

      res.json(Object.values(overview));
    } catch (error) {
      console.error('Get overview error:', error);
      res.status(500).json({ error: 'Failed to fetch overview' });
    }
  });

  // GET /api/stats/departments - Department-wise statistics
  router.get('/departments', async (req, res) => {
    try {
      const { phase } = req.query;

      let query = supabase.from('sites').select('ti_status, rf_plan_status, rf_opt_status, civil_status, mw_status, nokia_npo_status');

      if (phase && phase !== 'ALL') {
        query = query.eq('phase_name', phase);
      }

      const { data, error } = await query;

      if (error) throw error;

      const departments = {
        TI: { total: 0, completed: 0, inProgress: 0, pending: 0 },
        'RF Planning': { total: 0, completed: 0, inProgress: 0, pending: 0 },
        'RF Optimization': { total: 0, completed: 0, inProgress: 0, pending: 0 },
        Civil: { total: 0, completed: 0, inProgress: 0, pending: 0 },
        MW: { total: 0, completed: 0, inProgress: 0, pending: 0 },
        'Nokia NPO': { total: 0, completed: 0, inProgress: 0, pending: 0 }
      };

      const statusFields = {
        'TI': 'ti_status',
        'RF Planning': 'rf_plan_status',
        'RF Optimization': 'rf_opt_status',
        'Civil': 'civil_status',
        'MW': 'mw_status',
        'Nokia NPO': 'nokia_npo_status'
      };

      (data || []).forEach(site => {
        for (const [dept, field] of Object.entries(statusFields)) {
          departments[dept].total++;
          const status = (site[field] || '').toLowerCase();
          if (status.includes('complete') || status.includes('done') || status.includes('approved')) {
            departments[dept].completed++;
          } else if (status.includes('progress') || status.includes('review')) {
            departments[dept].inProgress++;
          } else {
            departments[dept].pending++;
          }
        }
      });

      res.json(departments);
    } catch (error) {
      console.error('Get departments stats error:', error);
      res.status(500).json({ error: 'Failed to fetch department stats' });
    }
  });

  return router;
};

/**
 * Calculate statistics from sites array
 */
function calculateStats(sites) {
  const total = sites.length;

  // Status breakdown
  const statusBreakdown = {};
  const partOfStats = {};
  const contractorStats = {};

  let completed = 0;
  let inProgress = 0;
  let pending = 0;
  let rejected = 0;
  
  // Dashboard specific counts
  let surveyDone = 0;
  let tssrReady = 0;
  let tssrSubmitted = 0;
  let approved = 0;
  let rfiCount = 0;
  
  // Part of breakdown
  let totalThinLayer = 0, totalFullSwap = 0, totalSwapExist = 0;
  let surveyThinLayer = 0, surveyFullSwap = 0, surveySwapExist = 0;
  let readyThinLayer = 0, readyFullSwap = 0, readySwapExist = 0;
  let submittedThinLayer = 0, submittedFullSwap = 0, submittedSwapExist = 0;
  let approvedThinLayer = 0, approvedFullSwap = 0, approvedSwapExist = 0;
  let rfiThinLayer = 0, rfiFullSwap = 0, rfiSwapExist = 0;

  sites.forEach(site => {
    // Overall status
    const status = site.tssr_overall_status || 'Unknown';
    statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;

    const statusLower = status.toLowerCase();
    
    // Part of categorization
    const partOf = (site.part_of || '').toLowerCase();
    const isThinLayer = partOf.includes('thin');
    const isFullSwap = partOf.includes('full');
    const isSwapExist = partOf.includes('swap exist') || partOf.includes('swapexist');
    
    // Total by part_of
    if (isThinLayer) totalThinLayer++;
    else if (isFullSwap) totalFullSwap++;
    else if (isSwapExist) totalSwapExist++;
    
    // Survey Done - sites that have been surveyed
    if (statusLower !== 'site not surveyed' && statusLower !== 'unknown' && status !== '') {
      surveyDone++;
      if (isThinLayer) surveyThinLayer++;
      else if (isFullSwap) surveyFullSwap++;
      else if (isSwapExist) surveySwapExist++;
    }
    
    // TSSR Ready - check multiple possible field values
    const tssrReadyVal = (site.tssr_ready || '').toLowerCase().trim();
    const spocReadiness = (site.spoc_readiness || '').toString().trim();
    // TSSR is ready if tssr_ready is yes/ready/1 OR spoc_readiness is a number >= 5
    const isReady = tssrReadyVal === 'yes' || tssrReadyVal === 'ready' || tssrReadyVal === '1' ||
                    tssrReadyVal === 'true' || parseInt(spocReadiness) >= 5;
    if (isReady) {
      tssrReady++;
      if (isThinLayer) readyThinLayer++;
      else if (isFullSwap) readyFullSwap++;
      else if (isSwapExist) readySwapExist++;
    }

    // TSSR Submitted (under validation)
    if (statusLower.includes('validation') || statusLower.includes('review') || statusLower.includes('submitted')) {
      tssrSubmitted++;
      if (isThinLayer) submittedThinLayer++;
      else if (isFullSwap) submittedFullSwap++;
      else if (isSwapExist) submittedSwapExist++;
    }

    // Approved
    if (statusLower.includes('approved') || statusLower === 'complete' || statusLower === 'completed') {
      approved++;
      completed++;
      if (isThinLayer) approvedThinLayer++;
      else if (isFullSwap) approvedFullSwap++;
      else if (isSwapExist) approvedSwapExist++;
    } else if (statusLower.includes('progress') || statusLower.includes('review')) {
      inProgress++;
    } else if (statusLower.includes('reject') || statusLower.includes('fail')) {
      rejected++;
    } else {
      pending++;
    }

    // RFI - check for "RFI", "yes", "done", "1", or any non-empty truthy value
    const rfiStatus = (site.rfi_status || '').toLowerCase().trim();
    const isRfi = rfiStatus === 'rfi' || rfiStatus === 'yes' || rfiStatus === 'done' ||
                  rfiStatus === '1' || rfiStatus === 'true' || rfiStatus === 'completed';
    if (isRfi) {
      rfiCount++;
      if (isThinLayer) rfiThinLayer++;
      else if (isFullSwap) rfiFullSwap++;
      else if (isSwapExist) rfiSwapExist++;
    }

    // Part of stats (for chart)
    const partOfKey = site.part_of || 'Unknown';
    partOfStats[partOfKey] = (partOfStats[partOfKey] || 0) + 1;

    // Contractor stats
    const contractor = site.tssr_subcon || 'Unassigned';
    if (!contractorStats[contractor]) {
      contractorStats[contractor] = { total: 0, completed: 0 };
    }
    contractorStats[contractor].total++;
    if (statusLower.includes('approved')) {
      contractorStats[contractor].completed++;
    }
  });

  // Calculate department stats
  const departmentStats = {
    TI: { total: 0, completed: 0, inProgress: 0, pending: 0 },
    'RF Planning': { total: 0, completed: 0, inProgress: 0, pending: 0 },
    'RF Optimization': { total: 0, completed: 0, inProgress: 0, pending: 0 },
    Civil: { total: 0, completed: 0, inProgress: 0, pending: 0 },
    MW: { total: 0, completed: 0, inProgress: 0, pending: 0 },
    'Nokia NPO': { total: 0, completed: 0, inProgress: 0, pending: 0 }
  };

  const statusFields = {
    'TI': 'ti_status',
    'RF Planning': 'rf_plan_status',
    'RF Optimization': 'rf_opt_status',
    'Civil': 'civil_status',
    'MW': 'mw_status',
    'Nokia NPO': 'nokia_npo_status'
  };

  sites.forEach(site => {
    for (const [dept, field] of Object.entries(statusFields)) {
      departmentStats[dept].total++;
      const deptStatus = (site[field] || '').toLowerCase();
      if (deptStatus.includes('complete') || deptStatus.includes('done') || deptStatus.includes('approved')) {
        departmentStats[dept].completed++;
      } else if (deptStatus.includes('progress') || deptStatus.includes('review')) {
        departmentStats[dept].inProgress++;
      } else {
        departmentStats[dept].pending++;
      }
    }
  });

  // Transform departmentStats to flat structure for Dashboard compatibility
  const flatDepartmentStats = {
    // TI
    ti_approved: departmentStats.TI.completed,
    ti_rejected: 0, // No rejected in current calculation
    ti_pending: departmentStats.TI.pending,
    // RF Planning
    rf_plan_approved: departmentStats['RF Planning'].completed,
    rf_plan_rejected: 0,
    rf_plan_pending: departmentStats['RF Planning'].pending,
    // RF Optimization
    rf_opt_approved: departmentStats['RF Optimization'].completed,
    rf_opt_rejected: 0,
    rf_opt_pending: departmentStats['RF Optimization'].pending,
    // Civil
    civil_approved: departmentStats.Civil.completed,
    civil_rejected: 0,
    civil_pending: departmentStats.Civil.pending,
    // MW
    mw_approved: departmentStats.MW.completed,
    mw_rejected: 0,
    mw_pending: departmentStats.MW.pending,
    // Nokia NPO
    nokia_npo_approved: departmentStats['Nokia NPO'].completed,
    nokia_npo_rejected: 0,
    nokia_npo_pending: departmentStats['Nokia NPO'].pending,
    // Also include original structure for backward compatibility
    ...departmentStats
  };

  return {
    overviewStats: {
      total,
      completed,
      inProgress,
      pending,
      rejected,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      // Dashboard specific fields (both naming conventions for compatibility)
      survey_done_count: surveyDone,
      survey_done: surveyDone,  // Alias for Dashboard
      tssr_ready_count: tssrReady,
      tssr_submitted: tssrSubmitted,
      approved_count: approved,
      approved: approved,  // Alias for Dashboard
      rfi_count: rfiCount,
      rfi: rfiCount,  // Alias for Dashboard
      // Part of breakdowns
      total_thin_layer: totalThinLayer,
      total_full_swap: totalFullSwap,
      total_swap_exist: totalSwapExist,
      total_swap_existing: totalSwapExist,  // Alias
      survey_thin_layer: surveyThinLayer,
      survey_full_swap: surveyFullSwap,
      survey_swap_exist: surveySwapExist,
      survey_swap_existing: surveySwapExist,  // Alias
      ready_thin_layer: readyThinLayer,
      ready_full_swap: readyFullSwap,
      ready_swap_exist: readySwapExist,
      ready_swap_existing: readySwapExist,  // Alias
      submitted_thin_layer: submittedThinLayer,
      submitted_full_swap: submittedFullSwap,
      submitted_swap_exist: submittedSwapExist,
      submitted_swap_existing: submittedSwapExist,  // Alias
      approved_thin_layer: approvedThinLayer,
      approved_full_swap: approvedFullSwap,
      approved_swap_exist: approvedSwapExist,
      approved_swap_existing: approvedSwapExist,  // Alias
      rfi_thin_layer: rfiThinLayer,
      rfi_full_swap: rfiFullSwap,
      rfi_swap_exist: rfiSwapExist,
      rfi_swap_existing: rfiSwapExist  // Alias
    },
    statusBreakdown: Object.entries(statusBreakdown).map(([status, count]) => ({
      status,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    })),
    partOfStats: Object.entries(partOfStats).map(([part_of, count]) => ({
      part_of,
      count
    })),
    departmentStats: flatDepartmentStats,
    contractorsSummary: Object.entries(contractorStats).map(([name, stats]) => ({
      name,
      contractor: name,  // Alias for Dashboard
      total: stats.total,
      completed: stats.completed,
      approved: stats.completed,  // Alias for Dashboard
      pending: stats.total - stats.completed,  // Calculate pending
      rejected: 0,  // No rejected data
      completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
    })).sort((a, b) => b.total - a.total)
  };
}
