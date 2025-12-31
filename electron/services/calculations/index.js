/**
 * Calculations Module - Day 12
 *
 * Exports all calculation, validation, and workflow services
 * For business logic migrated from Excel VBA
 */

const autoCalculations = require('./autoCalculations')
const validation = require('./validation')
const workflow = require('./workflow')

module.exports = {
  // Auto Calculations
  ...autoCalculations,

  // Validation
  ...validation,

  // Workflow
  ...workflow,

  // Namespaced exports for clarity
  calculations: autoCalculations,
  validation,
  workflow
}
