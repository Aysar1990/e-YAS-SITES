/**
 * Validation Service - Day 12
 *
 * Provides validation rules and functions for site data
 * Ensures data integrity before database operations
 */

/**
 * Jordan Governorates (official list)
 */
const GOVERNORATES = [
  'Amman',
  'Irbid',
  'Zarqa',
  'Balqa',
  'Mafraq',
  'Karak',
  'Madaba',
  'Jerash',
  'Ajloun',
  'Aqaba',
  'Maan',
  'Tafilah'
]

/**
 * Valid phases in the system
 */
const PHASES = [
  'RO4',
  'RO3',
  'RO2',
  'Phase-2',
  'Phase-1',
  'PO3',
  'PO2',
  'PO1',
  'ALL'
]

/**
 * Department status options
 */
const DEPARTMENT_STATUSES = [
  'Approved',
  'Pending',
  'Rejected',
  'Released',
  'N/A',
  ''
]

/**
 * Overall TSSR status options
 */
const OVERALL_STATUSES = [
  'Approved',
  'TSSR Under Zain validation',
  'TSSR Under ROM Review',
  'TSSR Under Nokia NPO Validation',
  'TSSR Under Nokia ROM Validation',
  'TSSR Under Nokia GSD Validation',
  'TSSR Under Subcon validation',
  'Site not Surveyed',
  'Need Access',
  ''
]

/**
 * Site types
 */
const SITE_TYPES = [
  'Macro',
  'Micro',
  'IBS',
  'Repeater',
  'Small Cell',
  'Hub',
  ''
]

/**
 * Structure types
 */
const STRUCTURE_TYPES = [
  'Rooftop',
  'Ground',
  'Pole',
  'Tower',
  'Wall Mount',
  'Indoor',
  ''
]

/**
 * Validation rules configuration
 */
const VALIDATION_RULES = {
  // Required fields
  required: ['site_id', 'final_site_name', 'phase_name'],

  // Enum validations (field -> allowed values)
  enums: {
    governorate: { values: GOVERNORATES, allowEmpty: true },
    phase_name: { values: PHASES, allowEmpty: false },
    ti_status: { values: DEPARTMENT_STATUSES, allowEmpty: true },
    rf_plan_status: { values: DEPARTMENT_STATUSES, allowEmpty: true },
    rf_opt_status: { values: DEPARTMENT_STATUSES, allowEmpty: true },
    civil_status: { values: DEPARTMENT_STATUSES, allowEmpty: true },
    mw_status: { values: DEPARTMENT_STATUSES, allowEmpty: true },
    nokia_npo_status: { values: DEPARTMENT_STATUSES, allowEmpty: true },
    tssr_overall_status: { values: OVERALL_STATUSES, allowEmpty: true },
    site_type: { values: SITE_TYPES, allowEmpty: true },
    structure_type: { values: STRUCTURE_TYPES, allowEmpty: true }
  },

  // Range validations
  ranges: {
    longitude: { min: -180, max: 180 },
    latitude: { min: -90, max: 90 },
    height_m: { min: 0, max: 200 },
    priority: { min: 1, max: 99 }
  },

  // Pattern validations
  patterns: {
    site_id: {
      regex: /^[A-Za-z0-9_-]+$/,
      message: 'Site ID must contain only letters, numbers, dashes, and underscores'
    },
    site_code: {
      regex: /^[A-Za-z0-9_-]*$/,
      message: 'Site Code must contain only letters, numbers, dashes, and underscores'
    }
  },

  // Max length validations
  maxLength: {
    site_id: 50,
    final_site_name: 200,
    site_code: 50,
    tssr_remark: 1000,
    ti_comment: 500,
    rf_plan_comment: 500,
    rf_opt_comment: 500,
    civil_comment: 500,
    mw_comment: 500,
    nokia_npo_comment: 500
  }
}

/**
 * Validate a single field
 * @param {string} fieldName - Name of the field
 * @param {any} value - Value to validate
 * @param {Object} options - Validation options
 * @returns {Object} { valid: boolean, error: string|null, warning: string|null }
 */
function validateField(fieldName, value, options = {}) {
  const result = { valid: true, error: null, warning: null }

  // Convert camelCase to snake_case for lookup
  const snakeField = toSnakeCase(fieldName)

  // Check required
  if (VALIDATION_RULES.required.includes(snakeField)) {
    if (value === null || value === undefined || String(value).trim() === '') {
      result.valid = false
      result.error = `${formatFieldName(fieldName)} is required`
      return result
    }
  }

  // Skip further validation if empty and not required
  if (value === null || value === undefined || String(value).trim() === '') {
    return result
  }

  const stringValue = String(value).trim()

  // Check enum values
  const enumRule = VALIDATION_RULES.enums[snakeField]
  if (enumRule) {
    if (!enumRule.values.includes(stringValue) && !(enumRule.allowEmpty && !stringValue)) {
      // Provide warning instead of error for flexibility
      result.warning = `${formatFieldName(fieldName)} has an unrecognized value: "${value}"`
    }
  }

  // Check range
  const rangeRule = VALIDATION_RULES.ranges[snakeField]
  if (rangeRule) {
    const numValue = parseFloat(value)
    if (!isNaN(numValue)) {
      if (numValue < rangeRule.min || numValue > rangeRule.max) {
        result.valid = false
        result.error = `${formatFieldName(fieldName)} must be between ${rangeRule.min} and ${rangeRule.max}`
        return result
      }
    }
  }

  // Check pattern
  const patternRule = VALIDATION_RULES.patterns[snakeField]
  if (patternRule && stringValue) {
    if (!patternRule.regex.test(stringValue)) {
      result.valid = false
      result.error = patternRule.message
      return result
    }
  }

  // Check max length
  const maxLength = VALIDATION_RULES.maxLength[snakeField]
  if (maxLength && stringValue.length > maxLength) {
    result.valid = false
    result.error = `${formatFieldName(fieldName)} must not exceed ${maxLength} characters`
    return result
  }

  return result
}

/**
 * Validate an entire site object
 * @param {Object} site - Site object to validate
 * @param {Object} options - Validation options
 * @param {boolean} options.strictMode - If true, warnings become errors
 * @returns {Object} { valid: boolean, errors: Array, warnings: Array }
 */
function validateSite(site, options = {}) {
  const result = {
    valid: true,
    errors: [],
    warnings: []
  }

  if (!site || typeof site !== 'object') {
    result.valid = false
    result.errors.push({ field: '_site', message: 'Site object is required' })
    return result
  }

  // Validate each field
  const allFields = new Set([
    ...VALIDATION_RULES.required,
    ...Object.keys(VALIDATION_RULES.enums),
    ...Object.keys(VALIDATION_RULES.ranges),
    ...Object.keys(VALIDATION_RULES.patterns),
    ...Object.keys(VALIDATION_RULES.maxLength)
  ])

  allFields.forEach(field => {
    // Try both snake_case and camelCase
    const value = site[field] ?? site[toCamelCase(field)]
    const fieldResult = validateField(field, value, options)

    if (!fieldResult.valid) {
      result.valid = false
      result.errors.push({ field, message: fieldResult.error })
    }

    if (fieldResult.warning) {
      if (options.strictMode) {
        result.valid = false
        result.errors.push({ field, message: fieldResult.warning })
      } else {
        result.warnings.push({ field, message: fieldResult.warning })
      }
    }
  })

  // Custom cross-field validations
  const crossFieldResult = validateCrossFields(site)
  if (!crossFieldResult.valid) {
    result.valid = false
    result.errors.push(...crossFieldResult.errors)
  }
  result.warnings.push(...crossFieldResult.warnings)

  return result
}

/**
 * Cross-field validations
 * @param {Object} site - Site object
 * @returns {Object} { valid: boolean, errors: Array, warnings: Array }
 */
function validateCrossFields(site) {
  const result = { valid: true, errors: [], warnings: [] }

  // Validate coordinates together
  const lat = site.latitude ?? site.lat
  const lng = site.longitude ?? site.lng ?? site.lon

  if ((lat && !lng) || (!lat && lng)) {
    result.warnings.push({
      field: 'coordinates',
      message: 'Both latitude and longitude should be provided together'
    })
  }

  // If approved, check that key departments are approved
  const overallStatus = (site.tssr_overall_status || site.tssrOverallStatus || '').toLowerCase()
  if (overallStatus === 'approved') {
    const departments = ['ti_status', 'rf_plan_status', 'civil_status', 'mw_status']
    departments.forEach(dept => {
      const status = (site[dept] || site[toCamelCase(dept)] || '').toLowerCase()
      if (status && status !== 'approved' && status !== 'n/a' && status !== 'released') {
        result.warnings.push({
          field: dept,
          message: `Overall status is Approved but ${formatFieldName(dept)} is "${status}"`
        })
      }
    })
  }

  return result
}

/**
 * Validate before update (partial validation)
 * @param {Object} updates - Object containing only the fields being updated
 * @returns {Object} { valid: boolean, errors: Array, warnings: Array }
 */
function validateUpdates(updates) {
  const result = {
    valid: true,
    errors: [],
    warnings: []
  }

  if (!updates || typeof updates !== 'object') {
    result.valid = false
    result.errors.push({ field: '_updates', message: 'Updates object is required' })
    return result
  }

  // Validate only the fields being updated
  Object.keys(updates).forEach(field => {
    const fieldResult = validateField(field, updates[field])

    if (!fieldResult.valid) {
      result.valid = false
      result.errors.push({ field, message: fieldResult.error })
    }

    if (fieldResult.warning) {
      result.warnings.push({ field, message: fieldResult.warning })
    }
  })

  return result
}

/**
 * Convert camelCase to snake_case
 */
function toSnakeCase(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
}

/**
 * Convert snake_case to camelCase
 */
function toCamelCase(str) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

/**
 * Format field name for display
 */
function formatFieldName(field) {
  return field
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^\w/, c => c.toUpperCase())
    .trim()
}

// Export
module.exports = {
  VALIDATION_RULES,
  GOVERNORATES,
  PHASES,
  DEPARTMENT_STATUSES,
  OVERALL_STATUSES,
  SITE_TYPES,
  STRUCTURE_TYPES,
  validateField,
  validateSite,
  validateUpdates,
  validateCrossFields,
  formatFieldName
}
