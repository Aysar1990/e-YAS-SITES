/**
 * User management IPC handlers
 * Handles: update-password, get-contractors, update-contractor, create-contractor, delete-contractor,
 *          get-users, create-user, update-user, delete-user, get-role-permissions, update-role-permissions,
 *          get-unique-contractors-from-sites
 * @module electron/ipc/userHandlers
 */

const bcrypt = require('bcryptjs')
const supabaseSync = require('../services/supabaseSync')
const {
  isNonEmptyString,
  isPositiveInteger,
  isPlainObject,
  sanitizeString
} = require('../utils/validation')

// Supabase sync functions
const saveUserToSupabase = async (user) => {
  try {
    if (supabaseSync.isReady()) {
      const result = await supabaseSync.syncUserToSupabase(user)
      return result
    }
    return { success: true, message: 'Supabase not configured, saved locally only' }
  } catch (error) {
    console.warn('⚠️ Supabase sync failed:', error.message)
    return { success: true, message: 'Saved locally, cloud sync failed' }
  }
}

const deleteUserFromSupabase = async (username) => {
  try {
    if (supabaseSync.isReady()) {
      const result = await supabaseSync.deleteUserFromSupabase(username)
      return result
    }
    return { success: true }
  } catch (error) {
    console.warn('⚠️ Supabase delete failed:', error.message)
    return { success: true }
  }
}

const getAllUsersFromSupabase = async () => {
  try {
    if (supabaseSync.isReady()) {
      return await supabaseSync.getUsersFromSupabase()
    }
    return []
  } catch (error) {
    console.warn('⚠️ Supabase fetch failed:', error.message)
    return []
  }
}

/**
 * Registers user management IPC handlers
 * @param {Electron.IpcMain} ipcMain - Electron IPC main instance
 * @param {Object} deps - Dependencies object
 * @param {Object} deps.db - Database instance
 * @param {Object} deps.authQueries - Authentication queries module
 * @param {Object} deps.contractorsQueries - Contractors queries module
 * @param {Function} deps.logAction - Audit logging function
 */
function registerUserHandlers(ipcMain, deps) {
  const { db, authQueries, contractorsQueries, logAction } = deps

  ipcMain.handle('update-password', async (event, { username, newPassword }) => {
    try {
      await authQueries.updatePassword(username, newPassword)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      }
    }
  })

  ipcMain.handle('get-contractors', async () => {
    try {
      const contractors = await authQueries.getAllContractors()
      const uniqueFromSites = await contractorsQueries.getUniqueContractors()

      return {
        success: true,
        contractors: contractors || [],
        uniqueFromSites: uniqueFromSites || [],
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      }
    }
  })

  ipcMain.handle('update-contractor', async (event, { id, isActive, password }) => {
    try {
      // Input validation
      if (!id || !isPositiveInteger(id)) {
        return {
          success: false,
          error: 'Valid contractor ID (positive integer) is required',
        }
      }

      // Validate password if provided
      if (password !== undefined && password !== null) {
        if (!isNonEmptyString(password) || password.length < 6) {
          return {
            success: false,
            error: 'Password must be at least 6 characters',
          }
        }
      }

      // Check if contractor exists
      const contractor = await db.prepare('SELECT id, username FROM users WHERE id = ? AND role = ?').get(id, 'contractor')
      if (!contractor) {
        return {
          success: false,
          error: 'Contractor not found',
        }
      }

      console.log('[AUDIT] Contractor updated:', id, contractor.username)

      if (isActive !== undefined) {
        await authQueries.updateContractorStatus(id, isActive ? 1 : 0)
      }
      if (password) {
        await authQueries.updateContractorPassword(id, password)
      }
      return { success: true }
    } catch (error) {
      console.error('Update contractor error:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  })

  ipcMain.handle('create-contractor', async (event, { username, password, contractorName }) => {
    try {
      // Input validation
      if (!username || !isNonEmptyString(username)) {
        return {
          success: false,
          error: 'Username is required',
        }
      }

      if (!password || !isNonEmptyString(password)) {
        return {
          success: false,
          error: 'Password is required',
        }
      }

      if (!contractorName || !isNonEmptyString(contractorName)) {
        return {
          success: false,
          error: 'Contractor name is required',
        }
      }

      // Sanitize inputs
      const sanitizedUsername = sanitizeString(username)
      const sanitizedContractorName = sanitizeString(contractorName)

      // Validate username format
      if (sanitizedUsername.length < 3 || sanitizedUsername.length > 50) {
        return {
          success: false,
          error: 'Username must be between 3 and 50 characters',
        }
      }

      // Validate password strength
      if (password.length < 6) {
        return {
          success: false,
          error: 'Password must be at least 6 characters',
        }
      }

      // Validate contractor name length
      if (sanitizedContractorName.length < 2 || sanitizedContractorName.length > 100) {
        return {
          success: false,
          error: 'Contractor name must be between 2 and 100 characters',
        }
      }

      // Check for existing user
      const existing = await authQueries.getUserByUsername(sanitizedUsername)
      if (existing) {
        return {
          success: false,
          error: 'Username already exists',
        }
      }

      console.log('[AUDIT] Contractor created:', sanitizedUsername, sanitizedContractorName)

      await authQueries.createUser(sanitizedUsername, password, 'contractor', sanitizedContractorName)
      return { success: true }
    } catch (error) {
      console.error('Create contractor error:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  })

  ipcMain.handle('delete-contractor', async (event, { id }) => {
    try {
      // Input validation
      if (!id || !isPositiveInteger(id)) {
        return {
          success: false,
          error: 'Valid contractor ID (positive integer) is required',
        }
      }

      // Check if contractor exists
      const contractor = await db.prepare('SELECT id, username, contractor_name FROM users WHERE id = ? AND role = ?').get(id, 'contractor')
      if (!contractor) {
        return {
          success: false,
          error: 'Contractor not found',
        }
      }

      console.log('[AUDIT] Contractor deleted:', id, contractor.username, contractor.contractor_name)

      await authQueries.deleteUser(id)
      return { success: true }
    } catch (error) {
      console.error('Delete contractor error:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  })

  // Enhanced User Management
  ipcMain.handle('get-users', async () => {
    try {
      // Try to get from Supabase first for freshest data
      let users = await getAllUsersFromSupabase()

      // If Supabase fails or returns empty (offline?), fall back to local DB
      if (!users || users.length === 0) {
        console.log('[UserHandlers] Fetching users from local DB (offline/fallback)')
        users = await authQueries.getAllUsersWithDetails()
      }

      return {
        success: true,
        users: users || [],
      }
    } catch (error) {
      console.error('Get users error:', error)
      // Fallback to local DB on error
      try {
        const users = await authQueries.getAllUsersWithDetails()
        return { success: true, users: users || [] }
      } catch (localError) {
        return {
          success: false,
          error: error.message,
        }
      }
    }
  })

  ipcMain.handle('create-user', async (event, { username, password, role, contractor_name, contractorName: contractorNameAlt, performedBy }) => {
    try {
      // Input validation
      if (!username || !isNonEmptyString(username)) {
        return {
          success: false,
          error: 'Username is required',
        }
      }

      if (!password || !isNonEmptyString(password)) {
        return {
          success: false,
          error: 'Password is required',
        }
      }

      // Validate role
      const validRoles = ['admin', 'management', 'contractor', 'nokia_engineer']
      if (!role || !validRoles.includes(role)) {
        return {
          success: false,
          error: 'Invalid role. Must be one of: admin, management, contractor, nokia_engineer',
        }
      }

      // Sanitize username
      const sanitizedUsername = sanitizeString(username)

      // Validate username format
      if (sanitizedUsername.length < 3 || sanitizedUsername.length > 50) {
        return {
          success: false,
          error: 'Username must be between 3 and 50 characters',
        }
      }

      // Validate password strength
      if (password.length < 6) {
        return {
          success: false,
          error: 'Password must be at least 6 characters',
        }
      }

      // contractor_name is required only for contractor role (support both property names)
      const contractorName = role === 'contractor' ? (contractor_name || contractorNameAlt) : null

      // Validate contractor name for contractor role
      if (role === 'contractor' && (!contractorName || !isNonEmptyString(contractorName))) {
        return {
          success: false,
          error: 'Contractor name is required for contractor role',
        }
      }

      // Sanitize contractor name if provided
      const sanitizedContractorName = contractorName ? sanitizeString(contractorName) : null

      // Check for existing user
      const existing = await authQueries.getUserByUsername(sanitizedUsername)
      if (existing) {
        return {
          success: false,
          error: 'Username already exists',
        }
      }

      // Hash password with bcrypt before storing
      const hashedPassword = await bcrypt.hash(password, 10)

      // 1. Save to Local DB (Backup & Constraints check)
      try {
        await authQueries.createUserFull(sanitizedUsername, hashedPassword, role, sanitizedContractorName)
      } catch (dbError) {
        if (dbError.message.includes('UNIQUE constraint failed')) {
          return { success: false, error: 'Username already exists' }
        }
        throw dbError
      }

      // Get the newly created user's ID
      const newUser = await db.prepare('SELECT id FROM users WHERE username = ?').get(sanitizedUsername)

      console.log('[AUDIT] User created:', sanitizedUsername, 'Role:', role)

      // 2. Save to Supabase (Cloud Sync)
      const supabaseResult = await saveUserToSupabase({
        username: sanitizedUsername,
        password: hashedPassword, // Store hash
        role,
        contractor_name: sanitizedContractorName,
        is_active: 1
      })

      if (!supabaseResult.success) {
        console.warn('[UserHandlers] Failed to sync new user to Supabase:', supabaseResult.error)
      }

      // Audit log for user creation
      if (logAction) {
        await logAction(
          performedBy?.id || null,
          performedBy?.username || 'system',
          'CREATE_USER',
          'user',
          newUser?.id?.toString(),
          null,
          { username: sanitizedUsername, role, contractor_name: sanitizedContractorName }
        )
      }

      return { success: true }
    } catch (error) {
      console.error('Create user error:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  })

  ipcMain.handle('update-user', async (event, { id, updates, performedBy }) => {
    try {
      // Input validation
      if (!id || !isPositiveInteger(id)) {
        return {
          success: false,
          error: 'Valid user ID (positive integer) is required',
        }
      }

      if (!updates || !isPlainObject(updates)) {
        return {
          success: false,
          error: 'Updates must be a valid object',
        }
      }

      // Validate role if being updated
      if (updates.role) {
        const validRoles = ['admin', 'management', 'contractor', 'nokia_engineer']
        if (!validRoles.includes(updates.role)) {
          return {
            success: false,
            error: 'Invalid role. Must be one of: admin, management, contractor, nokia_engineer',
          }
        }
      }

      // Validate password if being updated
      if (updates.password) {
        if (!isNonEmptyString(updates.password) || updates.password.length < 6) {
          return {
            success: false,
            error: 'Password must be at least 6 characters',
          }
        }
        // Hash password before updating
        updates.password = await bcrypt.hash(updates.password, 10)
      }

      // Sanitize contractor_name if provided
      if (updates.contractor_name) {
        updates.contractor_name = sanitizeString(updates.contractor_name)
      }

      // Get old user data for audit
      const oldUser = await db.prepare('SELECT id, username, role, contractor_name FROM users WHERE id = ?').get(id)

      if (!oldUser) {
        return {
          success: false,
          error: 'User not found',
        }
      }

      console.log('[AUDIT] User updated:', id, oldUser.username)

      // 1. Update Local DB
      await authQueries.updateUser(id, updates)

      // 2. Update Supabase (Cloud Sync)
      if (oldUser && oldUser.username) {
        await saveUserToSupabase({
          username: oldUser.username,
          ...updates
        })
      }

      // Audit log for user update
      if (logAction) {
        await logAction(
          performedBy?.id || null,
          performedBy?.username || 'system',
          'UPDATE_USER',
          'user',
          id?.toString(),
          oldUser,
          updates
        )
      }

      return { success: true }
    } catch (error) {
      console.error('Update user error:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  })

  ipcMain.handle('delete-user', async (event, { id, performedBy }) => {
    try {
      // Input validation
      if (!id || !isPositiveInteger(id)) {
        return {
          success: false,
          error: 'Valid user ID (positive integer) is required',
        }
      }

      // Get user data before deletion for audit
      const deletedUser = await db.prepare('SELECT id, username, role, contractor_name FROM users WHERE id = ?').get(id)

      if (!deletedUser) {
        return {
          success: false,
          error: 'User not found',
        }
      }

      // Prevent deletion of last admin
      if (deletedUser.role === 'admin') {
        const adminCount = await db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('admin')
        if (adminCount && adminCount.count <= 1) {
          return {
            success: false,
            error: 'Cannot delete the last admin user',
          }
        }
      }

      console.log('[AUDIT] User deleted:', id, deletedUser.username)

      // 1. Delete from Local DB
      await authQueries.deleteUserById(id)

      // 2. Delete from Supabase (Cloud Sync)
      if (deletedUser && deletedUser.username) {
        await deleteUserFromSupabase(deletedUser.username)
      }

      // Audit log for user deletion
      if (logAction) {
        await logAction(
          performedBy?.id || null,
          performedBy?.username || 'system',
          'DELETE_USER',
          'user',
          id?.toString(),
          deletedUser,
          null
        )
      }

      return { success: true }
    } catch (error) {
      console.error('Delete user error:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  })

  // Role Permissions
  ipcMain.handle('get-role-permissions', async () => {
    try {
      const permissions = await authQueries.getRolePermissions()
      return {
        success: true,
        permissions: permissions || [],
      }
    } catch (error) {
      console.error('Get role permissions error:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  })

  ipcMain.handle('update-role-permissions', async (event, { role, permissions }) => {
    try {
      await authQueries.updateRolePermissions(role, permissions)
      return { success: true }
    } catch (error) {
      console.error('Update role permissions error:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  })

  // Contractors List from Sites
  ipcMain.handle('get-unique-contractors-from-sites', async (event, phase) => {
    try {
      // Get unique contractors from sites table
      let query = `
        SELECT DISTINCT tssr_subcon as name
        FROM sites
        WHERE tssr_subcon IS NOT NULL AND tssr_subcon != ''
      `
      const params = []

      if (phase && phase !== 'ALL') {
        query += ' AND phase_name = ?'
        params.push(phase)
      }

      query += ' ORDER BY tssr_subcon ASC'

      const contractors = await db.prepare(query).all(...params)

      return {
        success: true,
        contractors: Array.isArray(contractors) ? contractors.map(c => c.name) : [],
      }
    } catch (error) {
      console.error('Get unique contractors error:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  })
}

module.exports = { registerUserHandlers }
