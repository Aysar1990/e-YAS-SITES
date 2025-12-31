/**
 * Conditional Formatting Rules Engine
 * Phase 4: Dynamic cell styling based on configurable rules
 */

// Rule type enums
export const ruleTypes = {
  TEXT_CONTAINS: 'text_contains',
  TEXT_EQUALS: 'text_equals',
  TEXT_STARTS_WITH: 'text_starts_with',
  TEXT_ENDS_WITH: 'text_ends_with',
  TEXT_REGEX: 'text_regex',
  NUMBER_GREATER: 'number_greater',
  NUMBER_LESS: 'number_less',
  NUMBER_BETWEEN: 'number_between',
  NUMBER_EQUALS: 'number_equals',
  DATE_BEFORE: 'date_before',
  DATE_AFTER: 'date_after',
  IS_EMPTY: 'is_empty',
  IS_NOT_EMPTY: 'is_not_empty',
  CUSTOM: 'custom'
}

// Format type enums
export const formatTypes = {
  BACKGROUND: 'background',
  TEXT_COLOR: 'text_color',
  FONT_WEIGHT: 'font_weight',
  FONT_STYLE: 'font_style',
  BORDER: 'border',
  ICON: 'icon'
}

// Human-readable labels for rule types
export const ruleTypeLabels = {
  [ruleTypes.TEXT_CONTAINS]: 'Text Contains',
  [ruleTypes.TEXT_EQUALS]: 'Text Equals',
  [ruleTypes.TEXT_STARTS_WITH]: 'Text Starts With',
  [ruleTypes.TEXT_ENDS_WITH]: 'Text Ends With',
  [ruleTypes.TEXT_REGEX]: 'Text Matches Regex',
  [ruleTypes.NUMBER_GREATER]: 'Number Greater Than',
  [ruleTypes.NUMBER_LESS]: 'Number Less Than',
  [ruleTypes.NUMBER_BETWEEN]: 'Number Between',
  [ruleTypes.NUMBER_EQUALS]: 'Number Equals',
  [ruleTypes.DATE_BEFORE]: 'Date Before',
  [ruleTypes.DATE_AFTER]: 'Date After',
  [ruleTypes.IS_EMPTY]: 'Is Empty',
  [ruleTypes.IS_NOT_EMPTY]: 'Is Not Empty'
}

// Default formatting rules
export const defaultRules = [
  {
    id: 'approved_green',
    name: 'Approved Status - Green',
    enabled: true,
    field: 'tssr_overall_status',
    isDefault: true,
    condition: {
      type: ruleTypes.TEXT_EQUALS,
      value: 'Approved'
    },
    format: {
      type: formatTypes.BACKGROUND,
      value: 'rgba(76, 175, 80, 0.2)',
      textColor: '#4CAF50',
      fontWeight: 'bold'
    },
    priority: 1
  },
  {
    id: 'pending_yellow',
    name: 'Pending Status - Yellow',
    enabled: true,
    field: null, // Apply to any field
    isDefault: true,
    condition: {
      type: ruleTypes.TEXT_CONTAINS,
      value: 'pending'
    },
    format: {
      type: formatTypes.BACKGROUND,
      value: 'rgba(255, 193, 7, 0.2)',
      textColor: '#FFC107',
      fontWeight: null
    },
    priority: 2
  },
  {
    id: 'rejected_red',
    name: 'Rejected - Red',
    enabled: true,
    field: null,
    isDefault: true,
    condition: {
      type: ruleTypes.TEXT_EQUALS,
      value: 'Rejected'
    },
    format: {
      type: formatTypes.BACKGROUND,
      value: 'rgba(244, 67, 54, 0.2)',
      textColor: '#F44336',
      fontWeight: 'bold'
    },
    priority: 1
  },
  {
    id: 'old_action_age',
    name: 'Action Age > 30 days - Orange',
    enabled: true,
    field: 'action_age',
    isDefault: true,
    condition: {
      type: ruleTypes.NUMBER_GREATER,
      value: 30
    },
    format: {
      type: formatTypes.BACKGROUND,
      value: 'rgba(255, 152, 0, 0.2)',
      textColor: '#FF9800',
      fontWeight: 'bold'
    },
    priority: 3
  },
  {
    id: 'high_priority',
    name: 'High Priority - Bold',
    enabled: true,
    field: 'priority',
    isDefault: true,
    condition: {
      type: ruleTypes.TEXT_EQUALS,
      value: 'High'
    },
    format: {
      type: formatTypes.FONT_WEIGHT,
      fontWeight: 'bold',
      textColor: '#FF5722',
      value: null
    },
    priority: 4
  }
]

/**
 * Evaluate a single rule condition against a value
 * @param {*} value - The cell value to evaluate
 * @param {Object} condition - The condition to evaluate
 * @returns {boolean} - Whether the condition matches
 */
export const evaluateRule = (value, condition) => {
  // Handle IS_EMPTY first - it specifically checks for null/undefined/empty
  if (condition.type === ruleTypes.IS_EMPTY) {
    return value == null || String(value).trim() === ''
  }

  // For other rules, null/undefined values don't match
  if (value == null) return false

  const strValue = String(value)
  const condValue = condition.value

  try {
    switch (condition.type) {
      case ruleTypes.TEXT_CONTAINS:
        return strValue.toLowerCase().includes(String(condValue).toLowerCase())

      case ruleTypes.TEXT_EQUALS:
        return strValue.toLowerCase() === String(condValue).toLowerCase()

      case ruleTypes.TEXT_STARTS_WITH:
        return strValue.toLowerCase().startsWith(String(condValue).toLowerCase())

      case ruleTypes.TEXT_ENDS_WITH:
        return strValue.toLowerCase().endsWith(String(condValue).toLowerCase())

      case ruleTypes.TEXT_REGEX:
        try {
          const regex = new RegExp(condValue, 'i')
          return regex.test(strValue)
        } catch {
          // Invalid regex, return false
          return false
        }

      case ruleTypes.NUMBER_GREATER:
        return Number(value) > Number(condValue)

      case ruleTypes.NUMBER_LESS:
        return Number(value) < Number(condValue)

      case ruleTypes.NUMBER_BETWEEN:
        const num = Number(value)
        return num >= Number(condition.min) && num <= Number(condition.max)

      case ruleTypes.NUMBER_EQUALS:
        return Number(value) === Number(condValue)

      case ruleTypes.DATE_BEFORE:
        const dateBefore = new Date(value)
        const condDateBefore = new Date(condValue)
        return dateBefore < condDateBefore

      case ruleTypes.DATE_AFTER:
        const dateAfter = new Date(value)
        const condDateAfter = new Date(condValue)
        return dateAfter > condDateAfter

      case ruleTypes.IS_NOT_EMPTY:
        return value != null && String(value).trim() !== ''

      case ruleTypes.CUSTOM:
        // Custom function evaluation (for advanced use cases)
        if (typeof condition.fn === 'function') {
          try {
            return condition.fn(value)
          } catch {
            return false
          }
        }
        return false

      default:
        return false
    }
  } catch (error) {
    console.error('Error evaluating rule:', error)
    return false
  }
}

/**
 * Apply formatting rules to a cell value and return style object
 * @param {*} value - The cell value
 * @param {string} field - The field/column name
 * @param {Array} rules - Array of formatting rules
 * @returns {Object} - CSS style object for the cell
 */
export const applyFormattingRules = (value, field, rules) => {
  if (!rules || !Array.isArray(rules)) return {}

  const styles = {}

  // Filter enabled rules and sort by priority (lower = higher priority)
  const applicableRules = rules
    .filter(rule => rule.enabled)
    .filter(rule => !rule.field || rule.field === field) // null field = applies to all
    .sort((a, b) => (a.priority || 99) - (b.priority || 99))

  // Apply rules in priority order (later rules can override)
  for (const rule of applicableRules) {
    if (evaluateRule(value, rule.condition)) {
      // Apply background color
      if (rule.format.value) {
        styles.backgroundColor = rule.format.value
      }

      // Apply text color
      if (rule.format.textColor) {
        styles.color = rule.format.textColor
      }

      // Apply font weight
      if (rule.format.fontWeight) {
        styles.fontWeight = rule.format.fontWeight
      }

      // Apply font style
      if (rule.format.fontStyle) {
        styles.fontStyle = rule.format.fontStyle
      }

      // Apply border
      if (rule.format.border) {
        styles.border = rule.format.border
      }
    }
  }

  return styles
}

/**
 * Get all matching rules for a cell (for debugging/display purposes)
 * @param {*} value - The cell value
 * @param {string} field - The field/column name
 * @param {Array} rules - Array of formatting rules
 * @returns {Array} - Array of matching rule objects
 */
export const getMatchingRules = (value, field, rules) => {
  if (!rules || !Array.isArray(rules)) return []

  return rules
    .filter(rule => rule.enabled)
    .filter(rule => !rule.field || rule.field === field)
    .filter(rule => evaluateRule(value, rule.condition))
    .sort((a, b) => (a.priority || 99) - (b.priority || 99))
}

// Storage key for localStorage
const STORAGE_KEY = 'spreadsheet_formatting_rules'

/**
 * Save rules to localStorage
 * @param {Array} rules - Array of formatting rules to save
 */
export const saveRulesToStorage = (rules) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rules))
    return true
  } catch (error) {
    console.error('Failed to save formatting rules:', error)
    return false
  }
}

/**
 * Load rules from localStorage
 * @returns {Array} - Array of formatting rules
 */
export const loadRulesFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Validate that parsed data is an array
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge with defaults to ensure new default rules are included
        return mergeWithDefaults(parsed)
      }
    }
    return [...defaultRules]
  } catch (error) {
    console.error('Failed to load formatting rules:', error)
    return [...defaultRules]
  }
}

/**
 * Merge stored rules with default rules (add any new defaults)
 * @param {Array} storedRules - Rules from localStorage
 * @returns {Array} - Merged rules array
 */
const mergeWithDefaults = (storedRules) => {
  const storedIds = new Set(storedRules.map(r => r.id))

  // Add any default rules that don't exist in stored rules
  const newDefaults = defaultRules.filter(r => !storedIds.has(r.id))

  return [...storedRules, ...newDefaults]
}

/**
 * Reset rules to defaults
 * @returns {Array} - Default rules array
 */
export const resetToDefaults = () => {
  const defaults = [...defaultRules]
  saveRulesToStorage(defaults)
  return defaults
}

/**
 * Create a new empty rule
 * @returns {Object} - New rule object
 */
export const createEmptyRule = () => {
  return {
    id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: 'New Rule',
    enabled: true,
    field: null,
    isDefault: false,
    condition: {
      type: ruleTypes.TEXT_CONTAINS,
      value: ''
    },
    format: {
      type: formatTypes.BACKGROUND,
      value: 'rgba(143, 217, 217, 0.2)',
      textColor: '#8FD9D9',
      fontWeight: null
    },
    priority: 99
  }
}

/**
 * Validate a rule object
 * @param {Object} rule - Rule to validate
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
export const validateRule = (rule) => {
  const errors = []

  if (!rule.id) errors.push('Rule must have an ID')
  if (!rule.name || rule.name.trim() === '') errors.push('Rule must have a name')
  if (!rule.condition) errors.push('Rule must have a condition')
  if (!rule.condition.type) errors.push('Condition must have a type')
  if (!rule.format) errors.push('Rule must have a format')

  // Validate condition value based on type
  if (rule.condition) {
    switch (rule.condition.type) {
      case ruleTypes.TEXT_CONTAINS:
      case ruleTypes.TEXT_EQUALS:
      case ruleTypes.TEXT_STARTS_WITH:
      case ruleTypes.TEXT_ENDS_WITH:
        if (!rule.condition.value && rule.condition.value !== '') {
          errors.push('Text conditions require a value')
        }
        break
      case ruleTypes.NUMBER_GREATER:
      case ruleTypes.NUMBER_LESS:
      case ruleTypes.NUMBER_EQUALS:
        if (isNaN(Number(rule.condition.value))) {
          errors.push('Number conditions require a numeric value')
        }
        break
      case ruleTypes.NUMBER_BETWEEN:
        if (isNaN(Number(rule.condition.min)) || isNaN(Number(rule.condition.max))) {
          errors.push('Number between requires min and max values')
        }
        break
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
