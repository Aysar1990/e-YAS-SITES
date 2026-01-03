/**
 * Authentication Middleware
 */

const jwt = require('jsonwebtoken')

// JWT_SECRET is required - no fallback for security
const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  throw new Error(
    'SECURITY ERROR: JWT_SECRET environment variable is required for authentication. ' +
    'Please set JWT_SECRET in your .env file with a strong random secret (minimum 32 characters).'
  )
}

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' })
    }
    req.user = user
    next()
  })
}

module.exports = {
  authenticateToken,
  JWT_SECRET
}
