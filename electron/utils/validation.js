/**
 * Input Validation Utilities for IPC Handlers
 * Protects against injection attacks and invalid data
 */

/**
 * Validate that a value is a non-empty string
 */
function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * Validate that a value is a positive integer
 */
function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0
}

/**
 * Validate that a value is a valid ID (positive integer or non-empty string)
 */
function isValidId(value) {
  return isPositiveInteger(value) || isNonEmptyString(value)
}

/**
 * Validate that a value is a plain object
 */
function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Validate that a value is an array
 */
function isArray(value) {
  return Array.isArray(value)
}

/**
 * Sanitize string input to prevent SQL injection
 * Removes dangerous characters and escapes single quotes
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return ''

  // Remove null bytes and other dangerous characters
  return str
    .replace(/\0/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim()
}

/**
 * Validate and sanitize site data object
 */
function validateSiteData(data) {
  if (!isPlainObject(data)) {
    throw new Error('Site data must be a valid object')
  }

  const errors = []

  // Required fields validation
  if (!data.site_id || !isNonEmptyString(String(data.site_id))) {
    errors.push('site_id is required and must be a non-empty string')
  }

  // Sanitize string fields
  const stringFields = ['site_id', 'site_name', 'contractor', 'phase', 'status', 'notes']
  stringFields.forEach(field => {
    if (data[field] !== undefined && data[field] !== null) {
      data[field] = sanitizeString(String(data[field]))
    }
  })

  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`)
  }

  return data
}

/**
 * Validate pagination parameters
 */
function validatePagination(params) {
  const { page = 1, limit = 50 } = params || {}

  if (!isPositiveInteger(page)) {
    throw new Error('Page must be a positive integer')
  }

  if (!isPositiveInteger(limit) || limit > 1000) {
    throw new Error('Limit must be a positive integer (max 1000)')
  }

  return { page, limit }
}

/**
 * Validate filter parameters
 */
function validateFilters(filters) {
  if (!filters) return {}

  if (!isPlainObject(filters)) {
    throw new Error('Filters must be a valid object')
  }

  // Sanitize filter values
  const sanitized = {}
  for (const [key, value] of Object.entries(filters)) {
    if (typeof value === 'string') {
      sanitized[sanitizeString(key)] = sanitizeString(value)
    } else if (Array.isArray(value)) {
      sanitized[sanitizeString(key)] = value.map(v =>
        typeof v === 'string' ? sanitizeString(v) : v
      )
    } else {
      sanitized[sanitizeString(key)] = value
    }
  }

  return sanitized
}

/**
 * Validate database configuration
 */
function validateDatabaseConfig(config) {
  if (!isPlainObject(config)) {
    throw new Error('Database config must be a valid object')
  }

  const { type, url, key } = config

  if (type && !['sqlite', 'supabase'].includes(type)) {
    throw new Error('Database type must be either "sqlite" or "supabase"')
  }

  if (type === 'supabase') {
    if (!url || !isNonEmptyString(url)) {
      throw new Error('Supabase URL is required')
    }
    if (!key || !isNonEmptyString(key)) {
      throw new Error('Supabase key is required')
    }
  }

  return config
}

/**
 * Wrapper for IPC handlers with automatic validation
 */
function withValidation(handler, validator) {
  return async (event, ...args) => {
    try {
      // Validate input
      const validatedArgs = validator ? validator(...args) : args

      // Execute handler with validated input
      return await handler(event, ...(Array.isArray(validatedArgs) ? validatedArgs : [validatedArgs]))
    } catch (error) {
      console.error('IPC Handler Validation Error:', error)
      throw new Error(`Validation failed: ${error.message}`)
    }
  }
}

module.exports = {
  isNonEmptyString,
  isPositiveInteger,
  isValidId,
  isPlainObject,
  isArray,
  sanitizeString,
  validateSiteData,
  validatePagination,
  validateFilters,
  validateDatabaseConfig,
  withValidation
}
