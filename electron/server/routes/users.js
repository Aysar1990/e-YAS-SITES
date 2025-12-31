/**
 * User Management Routes
 * Fully migrated to SQLite/Supabase - Firebase removed
 */

const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { validateUsername, validatePassword, validateRole, sanitizeString } = require('../utils/validation')
const RateLimiter = require('../utils/rateLimiter')

const JWT_SECRET = process.env.JWT_SECRET || 'tssr-monitor-fallback-key-change-me'
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h'
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 10

// Create rate limiter for login attempts
const loginRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000,
  maxAttempts: 5,
  blockDuration: 15 * 60 * 1000
})

function createUsersRoutes(db, authenticateToken, logAction) {
  const router = express.Router()

  // Get all users (for admin)
  router.get('/', authenticateToken, (req, res) => {
    try {
      if (!['admin', 'management'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Access denied' })
      }
      const users = db.prepare('SELECT id, username, role, contractor_name, created_at FROM users').all()
      res.json(users)
    } catch (error) {
      console.error('Error fetching users:', error)
      res.status(500).json({ error: 'Failed to fetch users' })
    }
  })

  // Get all users WITH passwords (admin only)
  router.get('/with-passwords', authenticateToken, (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' })
      }
      const users = db.prepare('SELECT id, username, role, contractor_name, created_at FROM users ORDER BY id ASC').all()
      res.json(users)
    } catch (error) {
      console.error('Error fetching users:', error)
      res.status(500).json({ error: 'Failed to fetch users' })
    }
  })

  // Create user
  router.post('/', authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' })
      }

      const { username, password, role, contractor_name } = req.body
      const performedBy = req.user
      const ip_address = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress
      const user_agent = req.headers['user-agent']

      // Input validation
      const usernameCheck = validateUsername(username)
      if (!usernameCheck.valid) {
        return res.status(400).json({ error: usernameCheck.error })
      }
      const passwordCheck = validatePassword(password)
      if (!passwordCheck.valid) {
        return res.status(400).json({ error: passwordCheck.error })
      }
      const roleCheck = validateRole(role)
      if (!roleCheck.valid) {
        return res.status(400).json({ error: roleCheck.error })
      }

      // Check if username already exists
      const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(sanitizeString(username))
      if (existing) {
        return res.status(400).json({ error: 'Username already exists' })
      }

      // Hash password with bcrypt
      const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS)

      const result = db.prepare(
        'INSERT INTO users (username, password, role, contractor_name) VALUES (?, ?, ?, ?)'
      ).run(sanitizeString(username), hashedPassword, role, sanitizeString(contractor_name) || null)

      if (logAction) {
        logAction(
          performedBy?.id,
          performedBy?.username || 'system',
          'CREATE_USER',
          'user',
          result.lastInsertRowid?.toString(),
          null,
          { username, role, contractor_name },
          ip_address,
          user_agent
        )
      }

      res.json({ success: true, id: result.lastInsertRowid })
    } catch (error) {
      console.error('Error creating user:', error)
      res.status(500).json({ error: 'Failed to create user' })
    }
  })

  // Delete user
  router.delete('/:id', authenticateToken, (req, res) => {
    try {
      const { id } = req.params
      const performedBy = req.user
      const ip_address = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress
      const user_agent = req.headers['user-agent']

      // Protect admin user (id = 1)
      if (id === '1' || id === 1) {
        return res.status(403).json({ error: 'Cannot delete admin user' })
      }

      const deletedUser = db.prepare('SELECT id, username, role, contractor_name FROM users WHERE id = ?').get(id)

      db.prepare('DELETE FROM users WHERE id = ?').run(id)

      if (logAction && deletedUser) {
        logAction(
          performedBy?.id,
          performedBy?.username || 'system',
          'DELETE_USER',
          'user',
          id,
          deletedUser,
          null,
          ip_address,
          user_agent
        )
      }

      res.json({ success: true })
    } catch (error) {
      console.error('Error deleting user:', error)
      res.status(500).json({ error: 'Failed to delete user' })
    }
  })

  return router
}

// Login endpoint (standalone) - SQLite/Supabase only
function createLoginRoute(db) {
  const router = express.Router()

  router.post('/', async (req, res) => {
    try {
      const ip_address = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress

      if (loginRateLimiter.isBlocked(req)) {
        const blockTime = loginRateLimiter.getBlockTimeRemaining(req)
        return res.status(429).json({
          success: false,
          error: 'Too many login attempts. Please try again later.',
          retryAfter: blockTime
        })
      }

      const { username, password } = req.body

      const usernameCheck = validateUsername(username)
      if (!usernameCheck.valid) {
        return res.status(400).json({ success: false, error: usernameCheck.error })
      }
      const passwordCheck = validatePassword(password)
      if (!passwordCheck.valid) {
        return res.status(400).json({ success: false, error: passwordCheck.error })
      }

      // Fetch user from local database
      const localUser = db.prepare('SELECT * FROM users WHERE username = ?').get(sanitizeString(username))

      if (!localUser) {
        loginRateLimiter.recordAttempt(req, false)
        const remaining = loginRateLimiter.getRemainingAttempts(req)
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
          attemptsRemaining: remaining
        })
      }

      // Verify Password
      let passwordValid = false
      if (localUser.password.startsWith('$2')) {
        // Bcrypt hash
        passwordValid = await bcrypt.compare(password, localUser.password)
      } else {
        // Legacy plain text - upgrade it
        passwordValid = localUser.password === password
        if (passwordValid) {
          const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS)
          db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, localUser.id)
        }
      }

      if (!passwordValid) {
        loginRateLimiter.recordAttempt(req, false)
        const remaining = loginRateLimiter.getRemainingAttempts(req)
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
          attemptsRemaining: remaining
        })
      }

      loginRateLimiter.recordAttempt(req, true)

      const token = jwt.sign(
        { id: localUser.id, username: localUser.username, role: localUser.role, contractor_name: localUser.contractor_name },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY }
      )

      res.json({
        success: true,
        token,
        user: {
          id: localUser.id,
          username: localUser.username,
          role: localUser.role,
          contractor_name: localUser.contractor_name
        }
      })
    } catch (error) {
      console.error('Login error:', error)
      res.status(500).json({ success: false, error: 'Login failed' })
    }
  })

  return router
}

module.exports = { createUsersRoutes, createLoginRoute }
