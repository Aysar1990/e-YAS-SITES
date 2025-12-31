/**
 * User Management Routes
 * CRUD operations for users using Supabase
 */

const express = require('express');
const bcrypt = require('bcryptjs');

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 10;
const VALID_ROLES = ['admin', 'management', 'nokia', 'contractor'];

module.exports = function(supabase) {
  const router = express.Router();

  // GET /api/users - Get all users (admin/management only)
  router.get('/', async (req, res) => {
    try {
      if (!['admin', 'management'].includes(req.user?.role)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const { data, error } = await supabase
        .from('users')
        .select('id, username, role, contractor_name, is_active, created_at')
        .order('role', { ascending: true })
        .order('username', { ascending: true });

      if (error) throw error;

      res.json(data || []);
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  // GET /api/users/with-passwords - Admin only (for export)
  router.get('/with-passwords', async (req, res) => {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { data, error } = await supabase
        .from('users')
        .select('id, username, role, contractor_name, is_active, created_at')
        .order('id', { ascending: true });

      if (error) throw error;

      res.json(data || []);
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  // GET /api/users/:id - Get single user
  router.get('/:id', async (req, res) => {
    try {
      if (!['admin', 'management'].includes(req.user?.role)) {
        // Users can only view their own profile
        if (req.user?.id !== parseInt(req.params.id)) {
          return res.status(403).json({ error: 'Access denied' });
        }
      }

      const { data, error } = await supabase
        .from('users')
        .select('id, username, role, contractor_name, is_active, created_at')
        .eq('id', req.params.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'User not found' });
        }
        throw error;
      }

      res.json(data);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  });

  // POST /api/users - Create new user (admin only)
  router.post('/', async (req, res) => {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { username, password, role, contractor_name } = req.body;

      // Validate input
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      if (username.length < 2 || username.length > 50) {
        return res.status(400).json({ error: 'Username must be 2-50 characters' });
      }

      if (password.length < 4) {
        return res.status(400).json({ error: 'Password must be at least 4 characters' });
      }

      if (role && !VALID_ROLES.includes(role)) {
        return res.status(400).json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` });
      }

      // Check if username exists
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('username', username.toLowerCase().trim())
        .single();

      if (existing) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

      // Create user
      const { data, error } = await supabase
        .from('users')
        .insert({
          username: username.toLowerCase().trim(),
          password: hashedPassword,
          role: role || 'contractor',
          contractor_name: contractor_name || null,
          is_active: 1,
          created_at: new Date().toISOString()
        })
        .select('id, username, role, contractor_name')
        .single();

      if (error) throw error;

      // Log action
      await logAction(supabase, req.user, 'CREATE_USER', { username, role });

      res.status(201).json({ success: true, user: data });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  });

  // PUT /api/users/:id - Update user
  router.put('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { role, contractor_name, is_active, password } = req.body;

      // Only admin can update other users
      if (req.user?.role !== 'admin' && req.user?.id !== parseInt(id)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Non-admin can only change their own password
      if (req.user?.role !== 'admin' && (role || contractor_name || is_active !== undefined)) {
        return res.status(403).json({ error: 'You can only change your password' });
      }

      // Protect admin user (id = 1)
      if (id === '1' && role && role !== 'admin') {
        return res.status(403).json({ error: 'Cannot change admin role' });
      }

      const updateData = {
        updated_at: new Date().toISOString()
      };

      if (role && VALID_ROLES.includes(role)) {
        updateData.role = role;
      }

      if (contractor_name !== undefined) {
        updateData.contractor_name = contractor_name || null;
      }

      if (is_active !== undefined) {
        updateData.is_active = is_active ? 1 : 0;
      }

      if (password) {
        if (password.length < 4) {
          return res.status(400).json({ error: 'Password must be at least 4 characters' });
        }
        updateData.password = await bcrypt.hash(password, BCRYPT_ROUNDS);
      }

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select('id, username, role, contractor_name, is_active')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'User not found' });
        }
        throw error;
      }

      // Log action
      await logAction(supabase, req.user, 'UPDATE_USER', { userId: id, fields: Object.keys(updateData) });

      res.json({ success: true, user: data });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  });

  // DELETE /api/users/:id - Delete user (admin only)
  router.delete('/:id', async (req, res) => {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { id } = req.params;

      // Protect admin user (id = 1)
      if (id === '1') {
        return res.status(403).json({ error: 'Cannot delete primary admin user' });
      }

      // Get user info before deletion
      const { data: user } = await supabase
        .from('users')
        .select('username')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Log action
      await logAction(supabase, req.user, 'DELETE_USER', { userId: id, username: user?.username });

      res.json({ success: true });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });

  // POST /api/users/change-password - Change own password
  router.post('/change-password', async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user?.id;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current and new password are required' });
      }

      if (newPassword.length < 4) {
        return res.status(400).json({ error: 'New password must be at least 4 characters' });
      }

      // Get current user
      const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('password')
        .eq('id', userId)
        .single();

      if (fetchError || !user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify current password
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      // Update password
      const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
      const { error: updateError } = await supabase
        .from('users')
        .update({ password: hashedPassword, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (updateError) throw updateError;

      res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Failed to change password' });
    }
  });

  return router;
};

/**
 * Log user action
 */
async function logAction(supabase, user, action, details) {
  try {
    await supabase.from('activity_log').insert({
      action,
      user_id: user?.id,
      details: JSON.stringify(details),
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to log action:', error);
  }
}
