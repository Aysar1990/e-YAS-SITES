/**
 * Contractors Routes
 * Contractor statistics and management using Supabase
 */

const express = require('express');

module.exports = function(supabase) {
  const router = express.Router();

  // GET /api/contractors - Get list of contractors
  router.get('/', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('sites')
        .select('tssr_subcon')
        .not('tssr_subcon', 'is', null)
        .not('tssr_subcon', 'eq', '');

      if (error) throw error;

      // Get unique contractors with counts
      const contractorCounts = {};
      (data || []).forEach(row => {
        const contractor = row.tssr_subcon;
        contractorCounts[contractor] = (contractorCounts[contractor] || 0) + 1;
      });

      const contractors = Object.entries(contractorCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      res.json(contractors);
    } catch (error) {
      console.error('Get contractors error:', error);
      res.status(500).json({ error: 'Failed to fetch contractors' });
    }
  });

  // GET /api/contractors/detailed - Detailed contractor statistics
  router.get('/detailed', async (req, res) => {
    try {
      const { phase } = req.query;

      let query = supabase.from('sites').select('tssr_subcon, tssr_overall_status, ti_status, rf_plan_status, civil_status, phase_name');

      if (phase && phase !== 'ALL') {
        query = query.eq('phase_name', phase);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Group by contractor
      const contractorStats = {};

      (data || []).forEach(site => {
        const contractor = site.tssr_subcon || 'Unassigned';

        if (!contractorStats[contractor]) {
          contractorStats[contractor] = {
            name: contractor,
            total: 0,
            completed: 0,
            inProgress: 0,
            pending: 0,
            rejected: 0,
            departments: {
              ti: { total: 0, completed: 0 },
              rfPlan: { total: 0, completed: 0 },
              civil: { total: 0, completed: 0 }
            }
          };
        }

        const stats = contractorStats[contractor];
        stats.total++;

        // Overall status
        const status = (site.tssr_overall_status || '').toLowerCase();
        if (status.includes('complete') || status.includes('approved')) {
          stats.completed++;
        } else if (status.includes('progress') || status.includes('review')) {
          stats.inProgress++;
        } else if (status.includes('reject') || status.includes('fail')) {
          stats.rejected++;
        } else {
          stats.pending++;
        }

        // Department stats
        const tiStatus = (site.ti_status || '').toLowerCase();
        stats.departments.ti.total++;
        if (tiStatus.includes('complete') || tiStatus.includes('done')) {
          stats.departments.ti.completed++;
        }

        const rfStatus = (site.rf_plan_status || '').toLowerCase();
        stats.departments.rfPlan.total++;
        if (rfStatus.includes('complete') || rfStatus.includes('done')) {
          stats.departments.rfPlan.completed++;
        }

        const civilStatus = (site.civil_status || '').toLowerCase();
        stats.departments.civil.total++;
        if (civilStatus.includes('complete') || civilStatus.includes('done')) {
          stats.departments.civil.completed++;
        }
      });

      // Calculate percentages and format output
      const result = Object.values(contractorStats).map(c => ({
        ...c,
        completionRate: c.total > 0 ? Math.round((c.completed / c.total) * 100) : 0,
        departments: {
          ti: {
            ...c.departments.ti,
            rate: c.departments.ti.total > 0 ? Math.round((c.departments.ti.completed / c.departments.ti.total) * 100) : 0
          },
          rfPlan: {
            ...c.departments.rfPlan,
            rate: c.departments.rfPlan.total > 0 ? Math.round((c.departments.rfPlan.completed / c.departments.rfPlan.total) * 100) : 0
          },
          civil: {
            ...c.departments.civil,
            rate: c.departments.civil.total > 0 ? Math.round((c.departments.civil.completed / c.departments.civil.total) * 100) : 0
          }
        }
      })).sort((a, b) => b.total - a.total);

      res.json(result);
    } catch (error) {
      console.error('Get detailed contractors error:', error);
      res.status(500).json({ error: 'Failed to fetch contractor details' });
    }
  });

  // GET /api/contractors/:name/stats - Single contractor statistics
  router.get('/:name/stats', async (req, res) => {
    try {
      const { name } = req.params;
      const { phase } = req.query;

      let query = supabase
        .from('sites')
        .select('*')
        .eq('tssr_subcon', decodeURIComponent(name));

      if (phase && phase !== 'ALL') {
        query = query.eq('phase_name', phase);
      }

      const { data: sites, error } = await query;

      if (error) throw error;

      if (!sites || sites.length === 0) {
        return res.status(404).json({ error: 'Contractor not found or has no sites' });
      }

      // Calculate detailed stats
      const stats = {
        name: decodeURIComponent(name),
        total: sites.length,
        completed: 0,
        inProgress: 0,
        pending: 0,
        rejected: 0,
        byPhase: {},
        byStatus: {},
        departments: {
          ti: { total: 0, completed: 0, inProgress: 0, pending: 0 },
          rfPlan: { total: 0, completed: 0, inProgress: 0, pending: 0 },
          rfOpt: { total: 0, completed: 0, inProgress: 0, pending: 0 },
          civil: { total: 0, completed: 0, inProgress: 0, pending: 0 },
          mw: { total: 0, completed: 0, inProgress: 0, pending: 0 }
        },
        recentActivity: []
      };

      sites.forEach(site => {
        // Overall status
        const status = site.tssr_overall_status || 'Unknown';
        stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

        const statusLower = status.toLowerCase();
        if (statusLower.includes('complete') || statusLower.includes('approved')) {
          stats.completed++;
        } else if (statusLower.includes('progress') || statusLower.includes('review')) {
          stats.inProgress++;
        } else if (statusLower.includes('reject') || statusLower.includes('fail')) {
          stats.rejected++;
        } else {
          stats.pending++;
        }

        // By phase
        const phase = site.phase_name || 'Unknown';
        stats.byPhase[phase] = (stats.byPhase[phase] || 0) + 1;

        // Department stats
        processDepartment(stats.departments.ti, site.ti_status);
        processDepartment(stats.departments.rfPlan, site.rf_plan_status);
        processDepartment(stats.departments.rfOpt, site.rf_opt_status);
        processDepartment(stats.departments.civil, site.civil_status);
        processDepartment(stats.departments.mw, site.mw_status);
      });

      // Calculate rates
      stats.completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

      for (const dept of Object.values(stats.departments)) {
        dept.rate = dept.total > 0 ? Math.round((dept.completed / dept.total) * 100) : 0;
      }

      res.json(stats);
    } catch (error) {
      console.error('Get contractor stats error:', error);
      res.status(500).json({ error: 'Failed to fetch contractor stats' });
    }
  });

  // GET /api/contractors/:name/sites - Get sites for a contractor
  router.get('/:name/sites', async (req, res) => {
    try {
      const { name } = req.params;
      const { phase, limit = 100, offset = 0 } = req.query;

      let query = supabase
        .from('sites')
        .select('*')
        .eq('tssr_subcon', decodeURIComponent(name));

      if (phase && phase !== 'ALL') {
        query = query.eq('phase_name', phase);
      }

      query = query
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1)
        .order('site_id', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;

      res.json(data || []);
    } catch (error) {
      console.error('Get contractor sites error:', error);
      res.status(500).json({ error: 'Failed to fetch contractor sites' });
    }
  });

  return router;
};

/**
 * Helper to process department status
 */
function processDepartment(dept, status) {
  dept.total++;
  const statusLower = (status || '').toLowerCase();
  if (statusLower.includes('complete') || statusLower.includes('done') || statusLower.includes('approved')) {
    dept.completed++;
  } else if (statusLower.includes('progress') || statusLower.includes('review')) {
    dept.inProgress++;
  } else {
    dept.pending++;
  }
}
