/**
 * Formula Engine - Excel-like formula parser and evaluator
 * Phase 8: Power Features
 *
 * Supported functions:
 * - SUM(field) - Sum of values
 * - AVG(field) - Average of values
 * - COUNT(field) - Count non-empty values
 * - MAX(field) - Maximum value
 * - MIN(field) - Minimum value
 * - IF(condition, trueVal, falseVal) - Conditional
 * - ROUND(value, decimals) - Round number
 * - COUNTIF(field, criteria) - Count matching values
 * - SUMIF(field, criteria) - Sum matching values
 */

// Available functions for autocomplete
export const AVAILABLE_FUNCTIONS = [
  { name: 'SUM', syntax: 'SUM(field)', description: 'مجموع القيم' },
  { name: 'AVG', syntax: 'AVG(field)', description: 'متوسط القيم' },
  { name: 'COUNT', syntax: 'COUNT(field)', description: 'عدد القيم غير الفارغة' },
  { name: 'MAX', syntax: 'MAX(field)', description: 'أعلى قيمة' },
  { name: 'MIN', syntax: 'MIN(field)', description: 'أدنى قيمة' },
  { name: 'IF', syntax: 'IF(cond, true, false)', description: 'شرط' },
  { name: 'ROUND', syntax: 'ROUND(value, decimals)', description: 'تقريب' },
  { name: 'COUNTIF', syntax: 'COUNTIF(field, criteria)', description: 'عدد المطابق' },
  { name: 'SUMIF', syntax: 'SUMIF(field, criteria)', description: 'مجموع المطابق' }
]

/**
 * FormulaEngine class
 */
export class FormulaEngine {
  constructor(data = []) {
    this.data = data
  }

  /**
   * Set data for formula evaluation
   */
  setData(data) {
    this.data = data || []
  }

  /**
   * Evaluate a formula string
   * @param {string} formula - Formula starting with '='
   * @returns {number|string} - Result of evaluation
   */
  evaluate(formula) {
    if (!formula || !formula.startsWith('=')) {
      throw new Error('المعادلة يجب أن تبدأ بـ =')
    }

    // Remove leading '='
    const expr = formula.slice(1).trim()

    if (!expr) {
      throw new Error('المعادلة فارغة')
    }

    try {
      return this.parseAndEvaluate(expr)
    } catch (error) {
      throw new Error(error.message || 'خطأ في المعادلة')
    }
  }

  /**
   * Parse and evaluate expression
   */
  parseAndEvaluate(expr) {
    // Match function calls: FUNC(args)
    const funcMatch = expr.match(/^(\w+)\s*\((.*)\)$/i)

    if (funcMatch) {
      const funcName = funcMatch[1].toUpperCase()
      const args = this.parseArgs(funcMatch[2])

      switch (funcName) {
        case 'SUM':
          return this.sum(args[0])
        case 'AVG':
        case 'AVERAGE':
          return this.avg(args[0])
        case 'COUNT':
          return this.count(args[0])
        case 'MAX':
          return this.max(args[0])
        case 'MIN':
          return this.min(args[0])
        case 'IF':
          return this.ifFunc(args[0], args[1], args[2])
        case 'ROUND':
          return this.round(args[0], args[1])
        case 'COUNTIF':
          return this.countIf(args[0], args[1])
        case 'SUMIF':
          return this.sumIf(args[0], args[1])
        default:
          throw new Error(`دالة غير معروفة: ${funcName}`)
      }
    }

    // Try to evaluate as simple expression
    if (!isNaN(Number(expr))) {
      return Number(expr)
    }

    throw new Error('صيغة غير صالحة')
  }

  /**
   * Parse function arguments
   */
  parseArgs(argsStr) {
    const args = []
    let current = ''
    let depth = 0

    for (const char of argsStr) {
      if (char === '(' ) depth++
      if (char === ')') depth--

      if (char === ',' && depth === 0) {
        args.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }

    if (current.trim()) {
      args.push(current.trim())
    }

    return args
  }

  /**
   * Get values from field
   */
  getFieldValues(fieldName) {
    const field = fieldName.replace(/['"]/g, '').trim()

    const values = this.data
      .map(row => row[field])
      .filter(val => val !== null && val !== undefined && val !== '')
      .map(val => {
        const num = parseFloat(val)
        return isNaN(num) ? val : num
      })

    return values
  }

  /**
   * Get numeric values only
   */
  getNumericValues(fieldName) {
    return this.getFieldValues(fieldName)
      .filter(val => typeof val === 'number' && !isNaN(val))
  }

  /**
   * SUM function
   */
  sum(fieldName) {
    const values = this.getNumericValues(fieldName)

    if (values.length === 0) {
      return 0
    }

    return values.reduce((sum, val) => sum + val, 0)
  }

  /**
   * AVG function
   */
  avg(fieldName) {
    const values = this.getNumericValues(fieldName)

    if (values.length === 0) {
      return 0
    }

    const sum = values.reduce((s, val) => s + val, 0)
    return Math.round((sum / values.length) * 100) / 100
  }

  /**
   * COUNT function
   */
  count(fieldName) {
    const values = this.getFieldValues(fieldName)
    return values.length
  }

  /**
   * MAX function
   */
  max(fieldName) {
    const values = this.getNumericValues(fieldName)

    if (values.length === 0) {
      return 0
    }

    return Math.max(...values)
  }

  /**
   * MIN function
   */
  min(fieldName) {
    const values = this.getNumericValues(fieldName)

    if (values.length === 0) {
      return 0
    }

    return Math.min(...values)
  }

  /**
   * IF function
   */
  ifFunc(condition, trueVal, falseVal) {
    // Parse simple conditions like: field="value" or field>10
    const condMatch = condition.match(/^(\w+)\s*(=|!=|>|<|>=|<=)\s*(.+)$/)

    if (condMatch) {
      const [, field, operator, value] = condMatch
      const cleanValue = value.replace(/['"]/g, '').trim()

      // Count matching rows
      let matchCount = 0
      for (const row of this.data) {
        const rowVal = row[field]
        let matches = false

        switch (operator) {
          case '=':
            matches = String(rowVal) === cleanValue
            break
          case '!=':
            matches = String(rowVal) !== cleanValue
            break
          case '>':
            matches = Number(rowVal) > Number(cleanValue)
            break
          case '<':
            matches = Number(rowVal) < Number(cleanValue)
            break
          case '>=':
            matches = Number(rowVal) >= Number(cleanValue)
            break
          case '<=':
            matches = Number(rowVal) <= Number(cleanValue)
            break
        }

        if (matches) matchCount++
      }

      return matchCount > 0 ? this.parseValue(trueVal) : this.parseValue(falseVal)
    }

    throw new Error('صيغة شرط غير صالحة')
  }

  /**
   * ROUND function
   */
  round(value, decimals = '0') {
    const num = this.parseValue(value)
    const dec = parseInt(decimals) || 0

    if (isNaN(num)) {
      throw new Error('قيمة غير رقمية')
    }

    return Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec)
  }

  /**
   * COUNTIF function
   */
  countIf(fieldName, criteria) {
    const field = fieldName.replace(/['"]/g, '').trim()
    const criterion = criteria.replace(/['"]/g, '').trim()

    return this.data.filter(row => String(row[field]) === criterion).length
  }

  /**
   * SUMIF function
   */
  sumIf(fieldName, criteria) {
    const field = fieldName.replace(/['"]/g, '').trim()
    const criterion = criteria.replace(/['"]/g, '').trim()

    return this.data
      .filter(row => String(row[field]) === criterion)
      .reduce((sum, row) => sum + (parseFloat(row[field]) || 0), 0)
  }

  /**
   * Parse a value (could be number, string, or nested function)
   */
  parseValue(val) {
    if (val === undefined || val === null) return 0

    const trimmed = String(val).trim()

    // Check if it's a function call
    if (trimmed.match(/^\w+\s*\(/)) {
      return this.parseAndEvaluate(trimmed)
    }

    // Check if it's a number
    const num = parseFloat(trimmed)
    if (!isNaN(num)) {
      return num
    }

    // Return as string
    return trimmed.replace(/['"]/g, '')
  }
}

// Default instance
export const formulaEngine = new FormulaEngine()

export default FormulaEngine
