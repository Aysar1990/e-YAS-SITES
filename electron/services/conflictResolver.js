/**
 * ConflictResolver - Handles data conflicts between local and remote databases
 *
 * Provides multiple resolution strategies and conflict detection
 */

/**
 * Resolution strategies
 */
const STRATEGIES = {
  LAST_WRITE_WINS: 'last_write_wins',    // Most recent timestamp wins
  MANUAL_REVIEW: 'manual_review',         // Queue for user review
  FIELD_LEVEL_MERGE: 'field_level_merge', // Merge non-conflicting fields
  USER_CHOICE: 'user_choice',             // Let user decide
  LOCAL_WINS: 'local_wins',               // Local always wins
  REMOTE_WINS: 'remote_wins'              // Remote always wins
}

/**
 * Conflict types
 */
const CONFLICT_TYPES = {
  VALUE_MISMATCH: 'value_mismatch',       // Same field, different values
  MISSING_LOCAL: 'missing_local',          // Record exists remote, not local
  MISSING_REMOTE: 'missing_remote',        // Record exists local, not remote
  DELETED_CONFLICT: 'deleted_conflict',    // One deleted, one modified
  CONCURRENT_EDIT: 'concurrent_edit'       // Both modified recently
}

class ConflictResolver {
  constructor(options = {}) {
    this.defaultStrategy = options.defaultStrategy || STRATEGIES.LAST_WRITE_WINS
    this.conflictThreshold = options.conflictThreshold || 1000 // 1 second
    this.activityLog = []
    this.pendingConflicts = []
  }

  /**
   * Detect conflicts between local and remote data
   * @param {Array} localData - Local database records
   * @param {Array} remoteData - Remote database records
   * @param {string} keyField - Primary key field name
   * @returns {Object} Detected conflicts and matches
   */
  detectConflicts(localData, remoteData, keyField = 'siteId') {
    const conflicts = []
    const matches = []
    const localOnly = []
    const remoteOnly = []

    // Create maps for quick lookup
    const localMap = new Map(localData.map(item => [this.getKey(item, keyField), item]))
    const remoteMap = new Map(remoteData.map(item => [this.getKey(item, keyField), item]))

    // Check each local record
    localMap.forEach((localItem, key) => {
      const remoteItem = remoteMap.get(key)

      if (!remoteItem) {
        // Record only exists locally
        localOnly.push({
          type: CONFLICT_TYPES.MISSING_REMOTE,
          key,
          local: localItem,
          remote: null
        })
      } else {
        // Compare records
        const comparison = this.compareRecords(localItem, remoteItem)

        if (comparison.hasConflicts) {
          conflicts.push({
            type: comparison.type,
            key,
            local: localItem,
            remote: remoteItem,
            differences: comparison.differences
          })
        } else {
          matches.push({ key, local: localItem, remote: remoteItem })
        }
      }
    })

    // Check for remote-only records
    remoteMap.forEach((remoteItem, key) => {
      if (!localMap.has(key)) {
        remoteOnly.push({
          type: CONFLICT_TYPES.MISSING_LOCAL,
          key,
          local: null,
          remote: remoteItem
        })
      }
    })

    return {
      conflicts,
      matches,
      localOnly,
      remoteOnly,
      summary: {
        totalLocal: localData.length,
        totalRemote: remoteData.length,
        conflictCount: conflicts.length,
        matchCount: matches.length,
        localOnlyCount: localOnly.length,
        remoteOnlyCount: remoteOnly.length
      }
    }
  }

  /**
   * Get composite key for record
   * @param {Object} item - Data record
   * @param {string|Array} keyField - Key field(s)
   * @returns {string} Composite key
   */
  getKey(item, keyField) {
    if (Array.isArray(keyField)) {
      return keyField.map(f => item[f] || '').join('|')
    }
    return String(item[keyField] || '')
  }

  /**
   * Compare two records to find differences
   * @param {Object} local - Local record
   * @param {Object} remote - Remote record
   * @returns {Object} Comparison result
   */
  compareRecords(local, remote) {
    const differences = []
    const ignoreFields = ['_rowIndex', 'id', 'created_at', 'updated_at', 'last_synced_at']

    // Get all fields from both records
    const allFields = new Set([
      ...Object.keys(local),
      ...Object.keys(remote)
    ])

    allFields.forEach(field => {
      if (ignoreFields.includes(field)) return

      const localValue = this.normalizeValue(local[field])
      const remoteValue = this.normalizeValue(remote[field])

      if (localValue !== remoteValue) {
        differences.push({
          field,
          localValue: local[field],
          remoteValue: remote[field]
        })
      }
    })

    // Determine conflict type
    let type = CONFLICT_TYPES.VALUE_MISMATCH
    const localTime = new Date(local.updated_at || 0).getTime()
    const remoteTime = new Date(remote.updated_at || 0).getTime()

    if (Math.abs(localTime - remoteTime) < this.conflictThreshold) {
      type = CONFLICT_TYPES.CONCURRENT_EDIT
    }

    return {
      hasConflicts: differences.length > 0,
      type,
      differences,
      localTimestamp: localTime,
      remoteTimestamp: remoteTime
    }
  }

  /**
   * Normalize value for comparison
   * @param {*} value - Value to normalize
   * @returns {string} Normalized string
   */
  normalizeValue(value) {
    if (value === null || value === undefined) return ''
    if (typeof value === 'string') return value.trim().toLowerCase()
    if (typeof value === 'number') return String(value)
    if (typeof value === 'boolean') return value ? 'true' : 'false'
    if (value instanceof Date) return value.toISOString()
    return JSON.stringify(value)
  }

  /**
   * Resolve a conflict using specified strategy
   * @param {Object} conflict - Conflict object
   * @param {string} strategy - Resolution strategy
   * @param {Object} options - Additional options
   * @returns {Object} Resolution result
   */
  resolveConflict(conflict, strategy = this.defaultStrategy, options = {}) {
    const resolution = {
      key: conflict.key,
      strategy,
      timestamp: new Date().toISOString(),
      resolvedData: null,
      action: null
    }

    switch (strategy) {
      case STRATEGIES.LAST_WRITE_WINS:
        resolution.resolvedData = this.resolveByTimestamp(conflict)
        resolution.action = 'auto_resolved'
        break

      case STRATEGIES.LOCAL_WINS:
        resolution.resolvedData = conflict.local
        resolution.action = 'local_selected'
        break

      case STRATEGIES.REMOTE_WINS:
        resolution.resolvedData = conflict.remote
        resolution.action = 'remote_selected'
        break

      case STRATEGIES.FIELD_LEVEL_MERGE:
        resolution.resolvedData = this.mergeFields(conflict, options.fieldPreferences)
        resolution.action = 'merged'
        break

      case STRATEGIES.USER_CHOICE:
        if (options.userSelection) {
          resolution.resolvedData = options.userSelection
          resolution.action = 'user_selected'
        } else {
          // Queue for later resolution
          this.pendingConflicts.push(conflict)
          resolution.action = 'pending'
        }
        break

      case STRATEGIES.MANUAL_REVIEW:
        this.pendingConflicts.push(conflict)
        resolution.action = 'queued_for_review'
        break

      default:
        resolution.resolvedData = this.resolveByTimestamp(conflict)
        resolution.action = 'auto_resolved'
    }

    // Log the resolution
    this.logResolution(resolution)

    return resolution
  }

  /**
   * Resolve by timestamp (last write wins)
   * @param {Object} conflict - Conflict object
   * @returns {Object} Winning record
   */
  resolveByTimestamp(conflict) {
    const localTime = new Date(conflict.local?.updated_at || 0).getTime()
    const remoteTime = new Date(conflict.remote?.updated_at || 0).getTime()

    if (localTime >= remoteTime) {
      return { ...conflict.local, _resolvedFrom: 'local' }
    }
    return { ...conflict.remote, _resolvedFrom: 'remote' }
  }

  /**
   * Merge data at field level
   * @param {Object} local - Local record
   * @param {Object} remote - Remote record
   * @param {Object} fieldPreferences - Field-level preferences
   * @returns {Object} Merged record
   */
  mergeData(local, remote, fieldPreferences = {}) {
    const merged = { ...local }
    const mergeLog = []

    Object.keys(remote).forEach(field => {
      const preference = fieldPreferences[field]

      if (preference === 'local') {
        // Keep local value
        mergeLog.push({ field, source: 'local', value: local[field] })
      } else if (preference === 'remote') {
        // Use remote value
        merged[field] = remote[field]
        mergeLog.push({ field, source: 'remote', value: remote[field] })
      } else {
        // Use latest non-empty value
        const localEmpty = !local[field] || local[field] === ''
        const remoteEmpty = !remote[field] || remote[field] === ''

        if (!localEmpty && remoteEmpty) {
          mergeLog.push({ field, source: 'local', value: local[field] })
        } else if (localEmpty && !remoteEmpty) {
          merged[field] = remote[field]
          mergeLog.push({ field, source: 'remote', value: remote[field] })
        } else if (local[field] !== remote[field]) {
          // Both have values - use most recent
          const localTime = new Date(local.updated_at || 0).getTime()
          const remoteTime = new Date(remote.updated_at || 0).getTime()
          if (remoteTime > localTime) {
            merged[field] = remote[field]
            mergeLog.push({ field, source: 'remote', value: remote[field] })
          }
        }
      }
    })

    merged._mergeLog = mergeLog
    merged._resolvedFrom = 'merged'
    return merged
  }

  /**
   * Merge fields for conflict resolution
   * @param {Object} conflict - Conflict object
   * @param {Object} fieldPreferences - Field preferences
   * @returns {Object} Merged record
   */
  mergeFields(conflict, fieldPreferences = {}) {
    return this.mergeData(conflict.local || {}, conflict.remote || {}, fieldPreferences)
  }

  /**
   * Log resolution for audit
   * @param {Object} resolution - Resolution details
   */
  logResolution(resolution) {
    this.activityLog.push({
      ...resolution,
      loggedAt: new Date().toISOString()
    })

    // Keep log size manageable
    if (this.activityLog.length > 1000) {
      this.activityLog = this.activityLog.slice(-500)
    }

    console.log(`[ConflictResolver] ${resolution.action}: ${resolution.key}`)
  }

  /**
   * Get pending conflicts for manual resolution
   * @returns {Array} Pending conflicts
   */
  getPendingConflicts() {
    return [...this.pendingConflicts]
  }

  /**
   * Clear a pending conflict after resolution
   * @param {string} key - Conflict key
   */
  clearPendingConflict(key) {
    this.pendingConflicts = this.pendingConflicts.filter(c => c.key !== key)
  }

  /**
   * Get activity log
   * @param {number} limit - Max entries to return
   * @returns {Array} Activity log entries
   */
  getActivityLog(limit = 100) {
    return this.activityLog.slice(-limit)
  }

  /**
   * Clear activity log
   */
  clearActivityLog() {
    this.activityLog = []
  }

  /**
   * Batch resolve conflicts
   * @param {Array} conflicts - Array of conflicts
   * @param {string} strategy - Resolution strategy
   * @returns {Array} Resolution results
   */
  batchResolve(conflicts, strategy = this.defaultStrategy) {
    return conflicts.map(conflict => this.resolveConflict(conflict, strategy))
  }
}

// Export
module.exports = {
  ConflictResolver,
  STRATEGIES,
  CONFLICT_TYPES
}
