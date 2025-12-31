/**
 * Data Validation Engine
 * Provides validation rules for spreadsheet cells
 * PHASE 6: Data Management
 */

// Validation rule types
export const RULE_TYPES = {
  REQUIRED: 'required',
  EMAIL: 'email',
  RANGE: 'range',
  ENUM: 'enum',
  PATTERN: 'pattern',
  LENGTH: 'length',
  UNIQUE: 'unique',
  CUSTOM: 'custom'
}

// Status enum values
export const STATUS_VALUES = [
  'Approved',
  'Pending',
  'Under Review',
  'Rejected',
  'Not Started',
  'In Progress',
  'Site not Surveyed',
  'N/A'
]

// Default validation rules for TSSR fields
export const DEFAULT_RULES = {
  site_id: [
    { type: RULE_TYPES.REQUIRED, message: 'معرف الموقع مطلوب' }
  ],
  final_site_name: [
    { type: RULE_TYPES.REQUIRED, message: 'اسم الموقع مطلوب' }
  ],
  height: [
    { type: RULE_TYPES.RANGE, min: 0, max: 200, message: 'الارتفاع يجب أن يكون بين 0 و 200 متر' }
  ],
  longitude: [
    { type: RULE_TYPES.RANGE, min: 38, max: 50, message: 'خط الطول يجب أن يكون بين 38 و 50' }
  ],
  latitude: [
    { type: RULE_TYPES.RANGE, min: 29, max: 38, message: 'خط العرض يجب أن يكون بين 29 و 38' }
  ],
  tssr_overall_status: [
    { type: RULE_TYPES.ENUM, values: STATUS_VALUES, message: 'حالة غير صالحة' }
  ],
  ti_status: [
    { type: RULE_TYPES.ENUM, values: STATUS_VALUES, message: 'حالة TI غير صالحة' }
  ],
  rf_plan_status: [
    { type: RULE_TYPES.ENUM, values: STATUS_VALUES, message: 'حالة RF Plan غير صالحة' }
  ],
  rf_optim_status: [
    { type: RULE_TYPES.ENUM, values: STATUS_VALUES, message: 'حالة RF Optim غير صالحة' }
  ],
  civil_status: [
    { type: RULE_TYPES.ENUM, values: STATUS_VALUES, message: 'حالة Civil غير صالحة' }
  ],
  mw_status: [
    { type: RULE_TYPES.ENUM, values: STATUS_VALUES, message: 'حالة MW غير صالحة' }
  ],
  nokia_npo_status: [
    { type: RULE_TYPES.ENUM, values: STATUS_VALUES, message: 'حالة Nokia NPO غير صالحة' }
  ]
}

/**
 * Validation Engine Class
 */
export class ValidationEngine {
  constructor(customRules = {}) {
    this.rules = { ...DEFAULT_RULES, ...customRules }
    this.errors = new Map() // Map<rowId, Map<field, error>>
  }

  /**
   * Add or update validation rules for a field
   */
  setRules(field, rules) {
    this.rules[field] = rules
  }

  /**
   * Get rules for a field
   */
  getRules(field) {
    return this.rules[field] || []
  }

  /**
   * Validate a single value against rules
   */
  validateValue(value, rules) {
    const errors = []

    for (const rule of rules) {
      const error = this.checkRule(value, rule)
      if (error) {
        errors.push(error)
      }
    }

    return errors
  }

  /**
   * Check a single rule
   */
  checkRule(value, rule) {
    switch (rule.type) {
      case RULE_TYPES.REQUIRED:
        if (value === null || value === undefined || value === '') {
          return rule.message || 'هذا الحقل مطلوب'
        }
        break

      case RULE_TYPES.EMAIL:
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return rule.message || 'البريد الإلكتروني غير صالح'
        }
        break

      case RULE_TYPES.RANGE:
        const num = parseFloat(value)
        if (value !== '' && value !== null && value !== undefined) {
          if (isNaN(num)) {
            return rule.message || 'يجب أن يكون رقماً'
          }
          if (rule.min !== undefined && num < rule.min) {
            return rule.message || `القيمة يجب أن تكون أكبر من ${rule.min}`
          }
          if (rule.max !== undefined && num > rule.max) {
            return rule.message || `القيمة يجب أن تكون أقل من ${rule.max}`
          }
        }
        break

      case RULE_TYPES.ENUM:
        if (value && rule.values && !rule.values.includes(value)) {
          return rule.message || `القيمة يجب أن تكون إحدى: ${rule.values.join(', ')}`
        }
        break

      case RULE_TYPES.PATTERN:
        if (value && rule.pattern && !new RegExp(rule.pattern).test(value)) {
          return rule.message || 'القيمة لا تطابق النمط المطلوب'
        }
        break

      case RULE_TYPES.LENGTH:
        if (value) {
          const len = String(value).length
          if (rule.min !== undefined && len < rule.min) {
            return rule.message || `الطول يجب أن يكون على الأقل ${rule.min} حرف`
          }
          if (rule.max !== undefined && len > rule.max) {
            return rule.message || `الطول يجب أن يكون أقل من ${rule.max} حرف`
          }
        }
        break

      case RULE_TYPES.CUSTOM:
        if (rule.validator && typeof rule.validator === 'function') {
          const result = rule.validator(value)
          if (result !== true) {
            return result || rule.message || 'القيمة غير صالحة'
          }
        }
        break
    }

    return null
  }

  /**
   * Validate a field in a row
   */
  validateField(rowId, field, value) {
    const rules = this.getRules(field)
    if (!rules || rules.length === 0) {
      return { valid: true, errors: [] }
    }

    const errors = this.validateValue(value, rules)

    // Update error map
    if (!this.errors.has(rowId)) {
      this.errors.set(rowId, new Map())
    }

    if (errors.length > 0) {
      this.errors.get(rowId).set(field, errors[0])
    } else {
      this.errors.get(rowId).delete(field)
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Validate entire row
   */
  validateRow(rowId, row) {
    const rowErrors = {}
    let isValid = true

    for (const [field, rules] of Object.entries(this.rules)) {
      const value = row[field]
      const result = this.validateField(rowId, field, value)
      if (!result.valid) {
        rowErrors[field] = result.errors
        isValid = false
      }
    }

    return { valid: isValid, errors: rowErrors }
  }

  /**
   * Validate all rows
   */
  validateAll(rows, idField = 'site_id') {
    const results = {
      valid: true,
      errorCount: 0,
      rowErrors: {}
    }

    for (const row of rows) {
      const rowId = row[idField]
      const result = this.validateRow(rowId, row)
      if (!result.valid) {
        results.valid = false
        results.rowErrors[rowId] = result.errors
        results.errorCount += Object.keys(result.errors).length
      }
    }

    return results
  }

  /**
   * Get error for a specific cell
   */
  getError(rowId, field) {
    return this.errors.get(rowId)?.get(field) || null
  }

  /**
   * Get all errors
   */
  getAllErrors() {
    const allErrors = {}
    for (const [rowId, fieldErrors] of this.errors) {
      if (fieldErrors.size > 0) {
        allErrors[rowId] = Object.fromEntries(fieldErrors)
      }
    }
    return allErrors
  }

  /**
   * Clear all errors
   */
  clearErrors() {
    this.errors.clear()
  }

  /**
   * Clear errors for a row
   */
  clearRowErrors(rowId) {
    this.errors.delete(rowId)
  }

  /**
   * Check if there are any errors
   */
  hasErrors() {
    for (const fieldErrors of this.errors.values()) {
      if (fieldErrors.size > 0) return true
    }
    return false
  }

  /**
   * Get error count
   */
  getErrorCount() {
    let count = 0
    for (const fieldErrors of this.errors.values()) {
      count += fieldErrors.size
    }
    return count
  }
}

/**
 * Get cell style for validation error
 */
export const getValidationCellStyle = (hasError, baseStyle = {}) => {
  if (!hasError) return baseStyle

  return {
    ...baseStyle,
    borderColor: '#F44336',
    borderWidth: '2px',
    borderStyle: 'solid',
    backgroundColor: 'rgba(244, 67, 54, 0.1)'
  }
}

/**
 * Create a singleton validation engine instance
 */
let validationEngineInstance = null

export const getValidationEngine = () => {
  if (!validationEngineInstance) {
    validationEngineInstance = new ValidationEngine()
  }
  return validationEngineInstance
}

export default ValidationEngine
