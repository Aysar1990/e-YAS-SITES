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
    const key = this.getKey(req)
    const record = this.attempts.get(key)

    if (!record) return false

    if (record.blocked && record.blockedUntil > Date.now()) {
      return true
    }

    // Unblock if block duration passed
    if (record.blocked && record.blockedUntil <= Date.now()) {
      this.attempts.delete(key)
      return false
    }

    return false
  }

  recordAttempt(req, success = false) {
    const key = this.getKey(req)
    const now = Date.now()

    if (success) {
      // Successful login - reset attempts
      this.attempts.delete(key)
      return
    }

    let record = this.attempts.get(key)

    if (!record || (now - record.firstAttempt) > this.windowMs) {
      // Start new window
      record = { count: 1, firstAttempt: now, blocked: false, blockedUntil: 0 }
    } else {
      record.count++
    }

    // Block if max attempts reached
    if (record.count >= this.maxAttempts) {
      record.blocked = true
      record.blockedUntil = now + this.blockDuration
      console.log(`[RateLimiter] Blocked IP ${key} for ${this.blockDuration / 1000}s after ${record.count} failed attempts`)
    }

    this.attempts.set(key, record)
  }

  getRemainingAttempts(req) {
    const key = this.getKey(req)
    const record = this.attempts.get(key)
    if (!record) return this.maxAttempts
    return Math.max(0, this.maxAttempts - record.count)
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
