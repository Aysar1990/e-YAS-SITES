/**
 * Authentication IPC handlers
 * Handles: login
 * @module electron/ipc/authHandlers
 */

const bcrypt = require('bcryptjs')
const { isNonEmptyString, sanitizeString } = require('../utils/validation')

/**
 * Registers authentication IPC handlers
 * @param {Electron.IpcMain} ipcMain - Electron IPC main instance
 * @param {Object} deps - Dependencies object
 * @param {Object} deps.db - Database instance
 * @param {Object} deps.authQueries - Authentication queries module
 * @param {Function} deps.logAction - Audit logging function
 */
function registerAuthHandlers(ipcMain, deps) {
  const { db, authQueries, logAction } = deps

  ipcMain.handle('login', async (event, { username, password }) => {
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

      // Sanitize username (prevent injection attacks)
      const sanitizedUsername = sanitizeString(username)

      if (sanitizedUsername.length < 3 || sanitizedUsername.length > 50) {
        return {
          success: false,
          error: 'Invalid username format',
        }
      }

      // Get user by username only
      const user = await authQueries.getUserByUsername(sanitizedUsername)

      if (!user || !user.is_active) {
        await logAction(null, username, 'LOGIN_FAILED', 'user', null, null, { reason: 'User not found or inactive' })
        return {
          success: false,
          error: 'Invalid credentials',
        }
      }

      // Check password with bcrypt (supports both hashed and legacy plaintext)
      let passwordValid = false
      if (user.password.startsWith('$2')) {
        // Password is bcrypt hashed
        passwordValid = await bcrypt.compare(password, user.password)
      } else {
        // Legacy plaintext password - compare and upgrade
        passwordValid = user.password === password
        if (passwordValid) {
          // Upgrade to bcrypt hash
          const hashedPassword = await bcrypt.hash(password, 10)
          await db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, user.id)
          console.log(`[Security] Upgraded password hash for user: ${username}`)
        }
      }

      if (!passwordValid) {
        await logAction(null, username, 'LOGIN_FAILED', 'user', null, null, { reason: 'Invalid credentials' })
        return {
          success: false,
          error: 'Invalid credentials',
        }
      }

      await authQueries.logActivity(user.id, 'login', `User ${username} logged in`)

      // Audit log for successful login
      await logAction(user.id, user.username, 'LOGIN', 'user', user.id, null, { role: user.role })

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          contractorName: user.contractor_name,
        },
      }
    } catch (error) {
      console.error('Login error:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  })
}

module.exports = { registerAuthHandlers }
