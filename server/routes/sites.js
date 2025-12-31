/**
 * Sites Routes
 * CRUD operations for sites using Supabase
 */

const express = require('express');

module.exports = function(supabase) {
  const router = express.Router();

  // GET /api/phases - Get all unique phases
  router.get('/phases', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('sites')
        .select('phase_name')
        .not('phase_name', 'is', null);

      if (error) throw error;

      // Count by phase
      const phaseCounts = {};
      (data || []).forEach(row => {
        const phase = row.phase_name;
        phaseCounts[phase] = (phaseCounts[phase] || 0) + 1;
      });

      const phases = Object.entries(phaseCounts).map(([phase_name, count]) => ({
        phase_name,
        count
      })).sort((a, b) => a.phase_name.localeCompare(b.phase_name));

      res.json(phases);
    } catch (error) {
      console.error('Get phases error:', error);
      res.status(500).json({ error: 'Failed to fetch phases' });
    }
  });

  // GET /api/sites - Get all sites with filters
  router.get('/', async (req, res) => {
    try {
      const { phase, contractor, search, limit = 1000, offset = 0 } = req.query;
      const user = req.user;

      let query = supabase.from('sites').select('*');

      // Phase filter
      if (phase && phase !== 'ALL') {
        query = query.eq('phase_name', phase);
      }

      // Contractor filter (for contractor role users)
      if (user.role === 'contractor' && user.contractor_name) {
        query = query.eq('tssr_subcon', user.contractor_name);
      } else if (contractor) {
        query = query.eq('tssr_subcon', contractor);
      }

      // Search filter
      if (search) {
        query = query.or(`site_id.ilike.%${search}%,final_site_name.ilike.%${search}%`);
      }

      // Pagination
      query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

      // Order by site_id
      query = query.order('site_id', { ascending: true });

      const { data, error, count } = await query;

      if (error) throw error;

      res.json(data || []);
    } catch (error) {
      console.error('Get sites error:', error);
      res.status(500).json({ error: 'Failed to fetch sites' });
    }
  });

  // GET /api/sites/:siteId - Get single site
  router.get('/:siteId', async (req, res) => {
    try {
      const { siteId } = req.params;
      const { phase } = req.query;

      let query = supabase
        .from('sites')
        .select('*')
        .eq('site_id', siteId);

      if (phase && phase !== 'ALL') {
        query = query.eq('phase_name', phase);
      }

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Site not found' });
        }
        throw error;
      }

      res.json(data);
    } catch (error) {
      console.error('Get site error:', error);
      res.status(500).json({ error: 'Failed to fetch site' });
    }
  });

  // PUT /api/sites/:siteId - Update site
  router.put('/:siteId', async (req, res) => {
    try {
      const { siteId } = req.params;
      const { phase } = req.query;
      const updates = req.body;
      const username = req.user?.username || 'api';

      console.log(`Updating site ${siteId}, phase: ${phase}`);

      // Build update object
      const allowedFields = [
        'final_site_name', 'governorate', 'latitude', 'longitude', 'height_m',
        'ti_status', 'ti_comment', 'rf_plan_status', 'rf_plan_comment',
        'rf_opt_status', 'rf_opt_comment', 'civil_status', 'civil_comment',
        'mw_status', 'nokia_npo_status', 'nokia_npo_comment',
        'tssr_overall_status', 'tssr_status_date', 'tssr_subcon',
        'action_age', 'tssr_ready', 'version', 'part_of',
        'ts_survey_ac', 'rfi_status', 'tssr_remark', 'priority',
        'cluster', 'area', 'weekly_plan', 'spoc_status', 'spoc_readiness'
      ];

      const updateData = {
        updated_at: new Date().toISOString()
      };

      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key) && value !== undefined) {
          updateData[key] = value;
        }
      }

      // Build query
      let query = supabase
        .from('sites')
        .update(updateData)
        .eq('site_id', siteId);

      if (phase && phase !== 'ALL') {
        query = query.eq('phase_name', phase);
      }

      const { data, error } = await query.select().single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ success: false, error: 'Site not found' });
        }
        throw error;
      }

      // Log the update
      try {
        await supabase.from('activity_log').insert({
          action: 'UPDATE_SITE',
          site_id: siteId,
          user_id: req.user?.id,
          details: JSON.stringify({ fields: Object.keys(updateData), username })
        });
      } catch (logError) {
        console.error('Failed to log update:', logError);
      }

      console.log(`Site ${siteId} updated successfully`);

      res.json({
        success: true,
        site: data
      });
    } catch (error) {
      console.error('Update site error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // POST /api/sites - Create new site (admin only)
  router.post('/', async (req, res) => {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const siteData = req.body;

      if (!siteData.site_id) {
        return res.status(400).json({ error: 'site_id is required' });
      }

      const { data, error } = await supabase
        .from('sites')
        .insert({
          ...siteData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return res.status(400).json({ error: 'Site already exists' });
        }
        throw error;
      }

      res.status(201).json({ success: true, site: data });
    } catch (error) {
      console.error('Create site error:', error);
      res.status(500).json({ error: 'Failed to create site' });
    }
  });

  // DELETE /api/sites/:siteId - Delete site (admin only)
  router.delete('/:siteId', async (req, res) => {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { siteId } = req.params;
      const { phase } = req.query;

      let query = supabase
        .from('sites')
        .delete()
        .eq('site_id', siteId);

      if (phase && phase !== 'ALL') {
        query = query.eq('phase_name', phase);
      }

      const { error } = await query;

      if (error) throw error;

      res.json({ success: true });
    } catch (error) {
      console.error('Delete site error:', error);
      res.status(500).json({ error: 'Failed to delete site' });
    }
  });

  // POST /api/sites/bulk - Bulk upsert sites (admin only)
  router.post('/bulk', async (req, res) => {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { sites } = req.body;

      if (!Array.isArray(sites) || sites.length === 0) {
        return res.status(400).json({ error: 'sites array is required' });
      }

      const timestamp = new Date().toISOString();
      const sitesWithTimestamp = sites.map(site => ({
        ...site,
        updated_at: timestamp
      }));

      // Upsert in batches of 100
      const BATCH_SIZE = 100;
      let inserted = 0;
      let updated = 0;
      const errors = [];

      for (let i = 0; i < sitesWithTimestamp.length; i += BATCH_SIZE) {
        const batch = sitesWithTimestamp.slice(i, i + BATCH_SIZE);

        const { data, error } = await supabase
          .from('sites')
          .upsert(batch, {
            onConflict: 'site_id,phase_name',
            ignoreDuplicates: false
          })
          .select();

        if (error) {
          errors.push({ batch: Math.floor(i / BATCH_SIZE) + 1, error: error.message });
        } else {
          updated += data?.length || batch.length;
        }
      }

      res.json({
        success: errors.length === 0,
        total: sites.length,
        updated,
        errors
      });
    } catch (error) {
      console.error('Bulk upsert error:', error);
      res.status(500).json({ error: 'Bulk operation failed' });
    }
  });

  return router;
};
