/**
 * Validation Examples for Common IPC Handler Patterns
 *
 * This file contains ready-to-use validation code for common handler patterns.
 * Copy and adapt these examples to your handlers.
 *
 * @module electron/utils/validation-examples
 */

const {
  isNonEmptyString,
  isPositiveInteger,
  isValidId,
  isPlainObject,
  isArray,
  sanitizeString,
  validateSiteData,
  validatePagination,
  validateFilters
} = require('./validation')

// =============================================================================
// SITE MODIFICATION HANDLERS
// =============================================================================

/**
 * Example: update-site handler with full validation
 */
function exampleUpdateSite(ipcMain, deps) {
  const { db } = deps

  ipcMain.handle('update-site', async (event, siteData) => {
    try {
      // 1. Validate input type
      if (!siteData || !isPlainObject(siteData)) {
        return {
          success: false,
          error: 'Site data must be a valid object'
        }
      }

      // 2. Use validateSiteData utility
      let validatedData
      try {
        validatedData = validateSiteData(siteData)
      } catch (validationError) {
        return {
          success: false,
          error: `Validation failed: ${validationError.message}`
        }
      }

      // 3. Proceed with validated data
      await db.updateSite(validatedData)

      return {
        success: true,
        message: 'Site updated successfully'
      }
    } catch (error) {
      console.error('Update site error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  })
}

/**
 * Example: delete-site handler with ID validation
 */
function exampleDeleteSite(ipcMain, deps) {
  const { db } = deps

  ipcMain.handle('delete-site', async (event, siteId) => {
    try {
      // 1. Validate ID
      if (!siteId || !isValidId(siteId)) {
        return {
          success: false,
          error: 'Valid site ID is required'
        }
      }

      // 2. Sanitize ID (if string)
      const sanitizedId = typeof siteId === 'string'
        ? sanitizeString(siteId)
        : siteId

      // 3. TODO: Add role-based permission check
      // Only admin/management should be able to delete sites

      // 4. TODO: Add confirmation check
      // Require explicit confirmation for destructive operations

      // 5. Proceed with deletion
      await db.deleteSite(sanitizedId)

      console.log('[AUDIT] Site deleted:', sanitizedId)

      return {
        success: true,
        message: 'Site deleted successfully'
      }
    } catch (error) {
      console.error('Delete site error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  })
}

/**
 * Example: create-site handler with validation
 */
function exampleCreateSite(ipcMain, deps) {
  const { db } = deps

  ipcMain.handle('create-site', async (event, siteData) => {
    try {
      // 1. Validate input type
      if (!siteData || !isPlainObject(siteData)) {
        return {
          success: false,
          error: 'Site data must be a valid object'
        }
      }

      // 2. Validate required fields
      const requiredFields = ['site_id', 'site_name', 'contractor']
      for (const field of requiredFields) {
        if (!siteData[field] || !isNonEmptyString(String(siteData[field]))) {
          return {
            success: false,
            error: `Field '${field}' is required`
          }
        }
      }

      // 3. Use validateSiteData utility
      const validatedData = validateSiteData(siteData)

      // 4. Check for duplicates
      const existing = await db.getSiteBySiteId(validatedData.site_id)
      if (existing) {
        return {
          success: false,
          error: `Site with ID '${validatedData.site_id}' already exists`
        }
      }

      // 5. Create site
      await db.createSite(validatedData)

      return {
        success: true,
        message: 'Site created successfully',
        siteId: validatedData.site_id
      }
    } catch (error) {
      console.error('Create site error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  })
}

// =============================================================================
// USER MANAGEMENT HANDLERS
// =============================================================================

/**
 * Example: create-user handler with validation
 */
function exampleCreateUser(ipcMain, deps) {
  const { db, bcrypt } = deps

  ipcMain.handle('create-user', async (event, userData) => {
    try {
      // 1. Validate input type
      if (!userData || !isPlainObject(userData)) {
        return {
          success: false,
          error: 'User data must be a valid object'
        }
      }

      // 2. Validate required fields
      if (!userData.username || !isNonEmptyString(userData.username)) {
        return {
          success: false,
          error: 'Username is required'
        }
      }

      if (!userData.password || !isNonEmptyString(userData.password)) {
        return {
          success: false,
          error: 'Password is required'
        }
      }

      if (!userData.role || !['admin', 'management', 'contractor', 'nokia'].includes(userData.role)) {
        return {
          success: false,
          error: 'Invalid role. Must be one of: admin, management, contractor, nokia'
        }
      }

      // 3. Sanitize username
      const sanitizedUsername = sanitizeString(userData.username)

      // 4. Validate username format
      if (sanitizedUsername.length < 3 || sanitizedUsername.length > 50) {
        return {
          success: false,
          error: 'Username must be between 3 and 50 characters'
        }
      }

      // 5. Validate password strength
      if (userData.password.length < 6) {
        return {
          success: false,
          error: 'Password must be at least 6 characters'
        }
      }

      // 6. Check for existing user
      const existing = await db.getUserByUsername(sanitizedUsername)
      if (existing) {
        return {
          success: false,
          error: 'Username already exists'
        }
      }

      // 7. Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10)

      // 8. Create user
      await db.createUser({
        username: sanitizedUsername,
        password: hashedPassword,
        role: userData.role,
        contractor_name: userData.contractor_name ? sanitizeString(userData.contractor_name) : null
      })

      console.log('[AUDIT] User created:', sanitizedUsername, 'Role:', userData.role)

      return {
        success: true,
        message: 'User created successfully'
      }
    } catch (error) {
      console.error('Create user error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  })
}

/**
 * Example: delete-user handler with validation
 */
function exampleDeleteUser(ipcMain, deps) {
  const { db } = deps

  ipcMain.handle('delete-user', async (event, userId) => {
    try {
      // 1. Validate ID
      if (!userId || !isPositiveInteger(userId)) {
        return {
          success: false,
          error: 'Valid user ID (positive integer) is required'
        }
      }

      // 2. TODO: Add role-based permission check
      // Only admin should be able to delete users

      // 3. TODO: Prevent self-deletion
      // const currentUserId = event.sender.getUserId()
      // if (userId === currentUserId) {
      //   return { success: false, error: 'Cannot delete your own account' }
      // }

      // 4. Check if user exists
      const user = await db.getUserById(userId)
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        }
      }

      // 5. Prevent deletion of last admin
      if (user.role === 'admin') {
        const adminCount = await db.countUsersByRole('admin')
        if (adminCount <= 1) {
          return {
            success: false,
            error: 'Cannot delete the last admin user'
          }
        }
      }

      // 6. Delete user
      await db.deleteUser(userId)

      console.log('[AUDIT] User deleted:', userId, user.username)

      return {
        success: true,
        message: 'User deleted successfully'
      }
    } catch (error) {
      console.error('Delete user error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  })
}

// =============================================================================
// CONTRACTOR MANAGEMENT HANDLERS
// =============================================================================

/**
 * Example: create-contractor handler with validation
 */
function exampleCreateContractor(ipcMain, deps) {
  const { db } = deps

  ipcMain.handle('create-contractor', async (event, contractorData) => {
    try {
      // 1. Validate input type
      if (!contractorData || !isPlainObject(contractorData)) {
        return {
          success: false,
          error: 'Contractor data must be a valid object'
        }
      }

      // 2. Validate required fields
      if (!contractorData.name || !isNonEmptyString(contractorData.name)) {
        return {
          success: false,
          error: 'Contractor name is required'
        }
      }

      // 3. Sanitize name
      const sanitizedName = sanitizeString(contractorData.name)

      if (sanitizedName.length < 2 || sanitizedName.length > 100) {
        return {
          success: false,
          error: 'Contractor name must be between 2 and 100 characters'
        }
      }

      // 4. Check for duplicates
      const existing = await db.getContractorByName(sanitizedName)
      if (existing) {
        return {
          success: false,
          error: 'Contractor with this name already exists'
        }
      }

      // 5. Create contractor
      const newContractor = {
        name: sanitizedName,
        contact: contractorData.contact ? sanitizeString(contractorData.contact) : null,
        email: contractorData.email ? sanitizeString(contractorData.email) : null,
        phone: contractorData.phone ? sanitizeString(contractorData.phone) : null
      }

      await db.createContractor(newContractor)

      return {
        success: true,
        message: 'Contractor created successfully'
      }
    } catch (error) {
      console.error('Create contractor error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  })
}

// =============================================================================
// IMPORT HANDLERS
// =============================================================================

/**
 * Example: import-batch handler with array validation
 */
function exampleImportBatch(ipcMain, deps) {
  const { db } = deps

  ipcMain.handle('import-batch', async (event, sites) => {
    try {
      // 1. Validate input is array
      if (!sites || !isArray(sites)) {
        return {
          success: false,
          error: 'Sites must be an array'
        }
      }

      // 2. Validate array size (prevent DoS)
      if (sites.length === 0) {
        return {
          success: false,
          error: 'No sites to import'
        }
      }

      if (sites.length > 10000) {
        return {
          success: false,
          error: 'Too many sites. Maximum 10,000 per batch'
        }
      }

      // 3. Validate each site
      const validatedSites = []
      const errors = []

      for (let i = 0; i < sites.length; i++) {
        try {
          const validatedSite = validateSiteData(sites[i])
          validatedSites.push(validatedSite)
        } catch (validationError) {
          errors.push(`Site ${i + 1}: ${validationError.message}`)

          // Stop after 10 errors to avoid overwhelming the user
          if (errors.length >= 10) {
            errors.push(`... and more errors (showing first 10)`)
            break
          }
        }
      }

      // 4. Return validation errors if any
      if (errors.length > 0) {
        return {
          success: false,
          error: 'Validation failed for some sites',
          errors: errors
        }
      }

      // 5. Import validated sites
      const result = await db.importBatch(validatedSites)

      return {
        success: true,
        message: `Successfully imported ${validatedSites.length} sites`,
        imported: validatedSites.length
      }
    } catch (error) {
      console.error('Import batch error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  })
}

// =============================================================================
// SEARCH/FILTER HANDLERS
// =============================================================================

/**
 * Example: search-sites handler with filter validation
 */
function exampleSearchSites(ipcMain, deps) {
  const { db } = deps

  ipcMain.handle('search-sites', async (event, params) => {
    try {
      // 1. Validate params object
      if (!params || !isPlainObject(params)) {
        return {
          success: false,
          error: 'Search params must be a valid object',
          sites: []
        }
      }

      // 2. Validate and sanitize search query
      let query = ''
      if (params.query) {
        if (!isNonEmptyString(params.query)) {
          return {
            success: false,
            error: 'Search query must be a non-empty string',
            sites: []
          }
        }
        query = sanitizeString(params.query)
      }

      // 3. Validate pagination
      let pagination = { page: 1, limit: 50 }
      try {
        pagination = validatePagination(params)
      } catch (paginationError) {
        return {
          success: false,
          error: paginationError.message,
          sites: []
        }
      }

      // 4. Validate filters
      let filters = {}
      if (params.filters) {
        try {
          filters = validateFilters(params.filters)
        } catch (filterError) {
          return {
            success: false,
            error: filterError.message,
            sites: []
          }
        }
      }

      // 5. Execute search
      const sites = await db.searchSites(query, filters, pagination)

      return {
        success: true,
        sites: sites || [],
        count: sites?.length || 0
      }
    } catch (error) {
      console.error('Search sites error:', error)
      return {
        success: false,
        error: error.message,
        sites: []
      }
    }
  })
}

// =============================================================================
// EXPORT FOR REFERENCE
// =============================================================================

module.exports = {
  // Site handlers
  exampleUpdateSite,
  exampleDeleteSite,
  exampleCreateSite,

  // User handlers
  exampleCreateUser,
  exampleDeleteUser,

  // Contractor handlers
  exampleCreateContractor,

  // Import handlers
  exampleImportBatch,

  // Search handlers
  exampleSearchSites
}
