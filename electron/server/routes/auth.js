/**
 * Authentication Routes
 */

const express = require('express')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const { validateUsername, validatePassword, sanitizeString } = require('../utils/validation')
const RateLimiter = require('../utils/rateLimiter')
const WS_EVENTS = require('../utils/wsEvents')

const JWT_SECRET = process.env.JWT_SECRET || 'tssr-monitor-fallback-key-change-me'
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h'
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 10

// Create rate limiter for login attempts
const loginRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000,
  maxAttempts: 5,
  blockDuration: 15 * 60 * 1000
})

function createAuthRoutes(db, broadcast, logAction) {
  const router = express.Router()

  // Login
  router.post('/login', async (req, res) => {
    try {
      const ip_address = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress
      const user_agent = req.headers['user-agent']

      // Rate limiting check
      if (loginRateLimiter.isBlocked(req)) {
        const blockTime = loginRateLimiter.getBlockTimeRemaining(req)
        if (logAction) {
          logAction(null, req.body?.username || 'unknown', 'LOGIN_BLOCKED', 'user', null, null,
            { reason: 'Rate limit exceeded', blockTimeRemaining: blockTime }, ip_address, user_agent)
        }
        return res.status(429).json({
          error: 'Too many login attempts. Please try again later.',
          retryAfter: blockTime
        })
      }

      const { username, password } = req.body

      // Input validation
      const usernameCheck = validateUsername(username)
      if (!usernameCheck.valid) {
        return res.status(400).json({ error: usernameCheck.error })
      }
      const passwordCheck = validatePassword(password)
      if (!passwordCheck.valid) {
        return res.status(400).json({ error: passwordCheck.error })
      }

      const user = db.prepare('SELECT * FROM users WHERE username = ?').get(sanitizeString(username))

      if (!user) {
        loginRateLimiter.recordAttempt(req, false)
        const remaining = loginRateLimiter.getRemainingAttempts(req)
        if (logAction) {
          logAction(null, username, 'LOGIN_FAILED', 'user', null, null,
            { reason: 'User not found', attemptsRemaining: remaining }, ip_address, user_agent)
        }
        return res.status(401).json({
          error: 'Invalid credentials',
          attemptsRemaining: remaining
        })
      }

      // Check password with bcrypt
      let passwordValid = false
      if (user.password.startsWith('$2')) {
        passwordValid = await bcrypt.compare(password, user.password)
      } else {
        passwordValid = user.password === password
        if (passwordValid) {
          const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS)
          db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, user.id)
          console.log(`[Security] Upgraded password hash for user: ${username}`)
        }
      }

      if (!passwordValid) {
        loginRateLimiter.recordAttempt(req, false)
        const remaining = loginRateLimiter.getRemainingAttempts(req)
        if (logAction) {
          logAction(null, username, 'LOGIN_FAILED', 'user', null, null,
            { reason: 'Invalid credentials', attemptsRemaining: remaining }, ip_address, user_agent)
        }
        return res.status(401).json({
          error: 'Invalid credentials',
          attemptsRemaining: remaining
        })
      }

      loginRateLimiter.recordAttempt(req, true)

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role, contractor_name: user.contractor_name },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY }
      )

      if (logAction) {
        logAction(user.id, user.username, 'LOGIN', 'user', user.id.toString(), null, { role: user.role }, ip_address, user_agent)
      }

      broadcast(WS_EVENTS.USER_LOGGED_IN, {
        username: user.username,
        role: user.role,
        loginTime: new Date().toISOString()
      })

      res.json({
        success: true,
        token,
        user: { id: user.id, username: user.username, role: user.role, contractor_name: user.contractor_name }
      })
    } catch (error) {
      console.error('[API] Login error:', error)
      res.status(500).json({ error: 'Server error' })
    }
  })

  // Verify token
  router.get('/verify', (req, res) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) return res.json({ valid: false })

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) return res.json({ valid: false })
      res.json({ valid: true, user })
    })
  })

  return router
}

module.exports = { createAuthRoutes, loginRateLimiter, JWT_SECRET, JWT_EXPIRY, BCRYPT_ROUNDS }
