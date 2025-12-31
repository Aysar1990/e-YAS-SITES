/**
 * Transformation Engine Service
 * Handles mapping different Excel formats to standard database schema
 */

// Standard database schema field names
export const DB_SCHEMA = {
  // Primary fields
  site_id: 'Site ID',
  final_site_name: 'Site Name',
  site_code: 'Site Code',
  governorate: 'Governorate',
  phase_name: 'Phase',
  
  // Location
  latitude: 'Latitude',
  longitude: 'Longitude',
  
  // Status fields
  tssr_overall_status: 'TSSR Overall Status',
  ti_status: 'TI Status',
  rf_plan_status: 'RF Planning Status',
  rf_optim_status: 'RF Optimization Status',
  civil_status: 'Civil Status',
  mw_status: 'MW Status',
  nokia_npo_status: 'Nokia NPO Status',
  
  // Other fields
  priority: 'Priority',
  tssr_subcon: 'Subcontractor',
  structure_type: 'Structure Type',
  site_owner: 'Site Owner',
  height_m: 'Height (m)',
}

// Predefined transformation templates
export const TRANSFORMATION_TEMPLATES = {
  nokia_format: {
    name: 'Nokia Format',
    description: 'Standard Nokia Excel format',
    mapping: {
      'ID': 'site_id',
      'Site Name': 'final_site_name',
      'Site': 'site_code',
      'Gov': 'governorate',
      'Phase': 'phase_name',
      'Lat': 'latitude',
      'Long': 'longitude',
      'Lon': 'longitude',
      'Status': 'tssr_overall_status',
      'Priority': 'priority',
      'Contractor': 'tssr_subcon'
    },
    transformations: {
      // Custom transformations for specific fields
      governorate: (value) => {
        const mapping = {
          'AMM': 'Amman',
          'IRBID': 'Irbid',
          'ZRQ': 'Zarqa',
          'AQB': 'Aqaba'
        }
        return mapping[value?.toUpperCase()] || value
      }
    }
  },
  
  contractor_format: {
    name: 'Contractor Format',
    description: 'Standard Contractor Excel format',
    mapping: {
      'SiteID': 'site_id',
      'Name': 'final_site_name',
      'Code': 'site_code',
      'Location': 'governorate',
      'Project': 'phase_name',
      'X': 'longitude',
      'Y': 'latitude',
      'State': 'tssr_overall_status',
      'Importance': 'priority'
    },
    transformations: {}
  },
  
  zain_standard: {
    name: 'Zain Standard Format',
    description: 'Standard Zain TSSR Tracker format',
    mapping: {
      'Site ID': 'site_id',
      'Final Site Name': 'final_site_name',
      'Site Code': 'site_code',
      'Governorate': 'governorate',
      'Phase Name': 'phase_name',
      'Latitude': 'latitude',
      'Longitude': 'longitude',
      'TSSR Overall Status': 'tssr_overall_status',
      'TI Status': 'ti_status',
      'RF Plan. Status': 'rf_plan_status',
      'RF Optim Status': 'rf_optim_status',
      'Civil Status': 'civil_status',
      'MW Status': 'mw_status',
      'Nokia NPO status': 'nokia_npo_status',
      'Priority': 'priority',
      'TSSR Subcon': 'tssr_subcon',
      'Structure Type': 'structure_type',
      'Site Owner': 'site_owner',
      'Height (m)': 'height_m'
    },
    transformations: {}
  }
}

/**
 * Transformation Engine Class
 */
export class TransformationEngine {
  constructor() {
    this.templates = TRANSFORMATION_TEMPLATES
  }

  /**
   * Detect which template matches the uploaded Excel file
   * @param {Array} headers - Array of column headers from Excel
   * @returns {string|null} - Template key or null
   */
  detectTemplate(headers) {
    let bestMatch = null
    let highestScore = 0

    Object.entries(this.templates).forEach(([key, template]) => {
      const score = this.calculateMatchScore(headers, template.mapping)
      if (score > highestScore) {
        highestScore = score
        bestMatch = key
      }
    })

    // Require at least 50% match
    return highestScore >= 0.5 ? bestMatch : null
  }

  /**
   * Calculate how well headers match a template
   */
  calculateMatchScore(headers, mapping) {
    const mappingKeys = Object.keys(mapping)
    let matches = 0

    headers.forEach(header => {
      if (mappingKeys.includes(header)) {
        matches++
      }
    })

    return matches / Math.max(headers.length, mappingKeys.length)
  }

  /**
   * Transform row data using a template
   * @param {Object} row - Raw row data from Excel
   * @param {string} templateKey - Template to use
   * @returns {Object} - Transformed row
   */
  transformRow(row, templateKey) {
    const template = this.templates[templateKey]
    if (!template) {
      throw new Error(`Template ${templateKey} not found`)
    }

    const transformed = {}

    // Apply field mapping
    Object.entries(template.mapping).forEach(([sourceField, targetField]) => {
      let value = row[sourceField]

      // Apply transformation if exists
      if (template.transformations[targetField]) {
        value = template.transformations[targetField](value)
      }

      transformed[targetField] = value
    })

    return transformed
  }

  /**
   * Transform entire dataset
   * @param {Array} data - Array of row objects
   * @param {string} templateKey - Template to use
   * @returns {Array} - Transformed data
   */
  transformDataset(data, templateKey) {
    return data.map(row => this.transformRow(row, templateKey))
  }

  /**
   * Create custom mapping from user selections
   * @param {Object} mapping - { excelColumn: dbField }
   * @returns {string} - Custom template key
   */
  createCustomMapping(mapping, transformations = {}) {
    const customKey = `custom_${Date.now()}`
    this.templates[customKey] = {
      name: 'Custom Mapping',
      description: 'User-defined mapping',
      mapping,
      transformations
    }
    return customKey
  }

  /**
   * Get template by key
   */
  getTemplate(key) {
    return this.templates[key]
  }

  /**
   * Get all available templates
   */
  getAllTemplates() {
    return this.templates
  }

  /**
   * Validate transformed data
   * @param {Array} data - Transformed data
   * @returns {Object} - { valid, errors, warnings }
   */
  validateData(data) {
    const errors = []
    const warnings = []

    data.forEach((row, index) => {
      // Required fields
      if (!row.site_id) {
        errors.push(`Row ${index + 1}: Missing site_id`)
      }
      if (!row.final_site_name) {
        errors.push(`Row ${index + 1}: Missing final_site_name`)
      }
      if (!row.phase_name) {
        errors.push(`Row ${index + 1}: Missing phase_name`)
      }

      // Optional but recommended
      if (!row.governorate) {
        warnings.push(`Row ${index + 1}: Missing governorate`)
      }
      if (!row.latitude || !row.longitude) {
        warnings.push(`Row ${index + 1}: Missing coordinates`)
      }
    })

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }
}

// Export singleton instance
export default new TransformationEngine()
