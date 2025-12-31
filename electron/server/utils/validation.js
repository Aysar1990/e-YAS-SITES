/**
 * Input Validation Helpers
 */

const validateUsername = (username) => {
  if (!username || typeof username !== 'string') return { valid: false, error: 'Username is required' }
  if (username.length < 3 || username.length > 50) return { valid: false, error: 'Username must be 3-50 characters' }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return { valid: false, error: 'Username can only contain letters, numbers, and underscores' }
  return { valid: true }
}

const validatePassword = (password) => {
  if (!password || typeof password !== 'string') return { valid: false, error: 'Password is required' }
  if (password.length < 6) return { valid: false, error: 'Password must be at least 6 characters' }
  return { valid: true }
}

const validateRole = (role) => {
  const validRoles = ['admin', 'management', 'contractor', 'nokia_engineer']
  if (!role || !validRoles.includes(role)) {
    return { valid: false, error: `Role must be one of: ${validRoles.join(', ')}` }
  }
  return { valid: true }
}

const sanitizeString = (str) => {
  if (typeof str !== 'string') return str
  return str.trim().replace(/[<>]/g, '')
}

module.exports = {
  validateUsername,
  validatePassword,
  validateRole,
  sanitizeString
}
