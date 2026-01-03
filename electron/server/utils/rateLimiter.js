/**
 * Rate Limiter for brute force protection
 */

class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 15 * 60 * 1000 // 15 minutes default
    this.maxAttempts = options.maxAttempts || 5 // 5 attempts default
    this.blockDuration = options.blockDuration || 15 * 60 * 1000 // 15 min block
    this.attempts = new Map() // IP -> { count, firstAttempt, blocked, blockedUntil }

    // Cleanup old entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000)
  }

  getKey(req) {
    return req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown'
  }

  isBlocked(req) {
    // RATE LIMITING DISABLED - Always return false
    return false
  }

  recordAttempt(req, success = false) {
    // RATE LIMITING DISABLED - Do nothing
    return
  }

  getRemainingAttempts(req) {
    // RATE LIMITING DISABLED - Always return 999
    return 999
  }

  getBlockTimeRemaining(req) {
    const key = this.getKey(req)
    const record = this.attempts.get(key)
    if (!record || !record.blocked) return 0
    return Math.max(0, Math.ceil((record.blockedUntil - Date.now()) / 1000))
  }

  cleanup() {
    const now = Date.now()
    for (const [key, record] of this.attempts.entries()) {
      // Remove expired blocks and old windows
      if (record.blocked && record.blockedUntil <= now) {
        this.attempts.delete(key)
      } else if (!record.blocked && (now - record.firstAttempt) > this.windowMs) {
        this.attempts.delete(key)
      }
    }
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.attempts.clear()
  }
}

module.exports = RateLimiter
