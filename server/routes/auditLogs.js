/**
 * Audit Logs Routes
 * Activity and audit log management using Supabase
 */

const express = require('express');

module.exports = function(supabase) {
  const router = express.Router();

  // GET /api/audit-logs - Get audit logs
  router.get('/', async (req, res) => {
    try {
      // Only admin and management can view audit logs
      if (!['admin', 'management'].includes(req.user?.role)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const { limit = 100, offset = 0, action, user_id, site_id, from, to } = req.query;

      let query = supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false });

      // Filters
      if (action) {
        query = query.eq('action', action);
      }

      if (user_id) {
        query = query.eq('user_id', user_id);
      }

      if (site_id) {
        query = query.eq('site_id', site_id);
      }

      if (from) {
        query = query.gte('created_at', from);
      }

      if (to) {
        query = query.lte('created_at', to);
      }

      // Pagination
      query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      res.json({
        logs: data || [],
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    } catch (error) {
      console.error('Get audit logs error:', error);
      res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
  });

  // GET /api/audit-logs/actions - Get list of action types
  router.get('/actions', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('activity_log')
        .select('action')
        .not('action', 'is', null);

      if (error) throw error;

      // Get unique actions
      const actions = [...new Set((data || []).map(row => row.action))].sort();

      res.json(actions);
    } catch (error) {
      console.error('Get actions error:', error);
      res.status(500).json({ error: 'Failed to fetch actions' });
    }
  });

  // GET /api/audit-logs/stats - Get audit log statistics
  router.get('/stats', async (req, res) => {
    try {
      if (!['admin', 'management'].includes(req.user?.role)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const { from, to } = req.query;

      let query = supabase
        .from('activity_log')
        .select('action, user_id, created_at');

      if (from) {
        query = query.gte('created_at', from);
      }

      if (to) {
        query = query.lte('created_at', to);
      }

      const { data, error } = await query;

      if (error) throw error;

      const logs = data || [];

      // Calculate stats
      const stats = {
        total: logs.length,
        byAction: {},
        byUser: {},
        byDay: {}
      };

      logs.forEach(log => {
        // By action
        const action = log.action || 'Unknown';
        stats.byAction[action] = (stats.byAction[action] || 0) + 1;

        // By user
        const userId = log.user_id || 'Unknown';
        stats.byUser[userId] = (stats.byUser[userId] || 0) + 1;

        // By day
        const day = log.created_at ? log.created_at.split('T')[0] : 'Unknown';
        stats.byDay[day] = (stats.byDay[day] || 0) + 1;
      });

      res.json(stats);
    } catch (error) {
      console.error('Get audit stats error:', error);
      res.status(500).json({ error: 'Failed to fetch audit stats' });
    }
  });

  // POST /api/audit-logs - Create audit log entry (internal use)
  router.post('/', async (req, res) => {
    try {
      const { action, site_id, details } = req.body;

      if (!action) {
        return res.status(400).json({ error: 'Action is required' });
      }

      const { data, error } = await supabase
        .from('activity_log')
        .insert({
          action,
          site_id: site_id || null,
          user_id: req.user?.id,
          details: typeof details === 'string' ? details : JSON.stringify(details),
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({ success: true, log: data });
    } catch (error) {
      console.error('Create audit log error:', error);
      res.status(500).json({ error: 'Failed to create audit log' });
    }
  });

  // DELETE /api/audit-logs/cleanup - Cleanup old logs (admin only)
  router.delete('/cleanup', async (req, res) => {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { days = 90 } = req.query;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

      const { error, count } = await supabase
        .from('activity_log')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) throw error;

      res.json({
        success: true,
        message: `Deleted logs older than ${days} days`,
        deleted: count
      });
    } catch (error) {
      console.error('Cleanup audit logs error:', error);
      res.status(500).json({ error: 'Failed to cleanup audit logs' });
    }
  });

  return router;
};
