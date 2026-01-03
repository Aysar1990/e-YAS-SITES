/**
 * SupabaseAdapter - Database adapter for Supabase
 *
 * Implements cloud database functionality using Supabase.
 * Translates SQL.js-style API calls to Supabase query builder syntax.
 * Uses columnDefinitions.js for proper column mapping.
 */

const BaseAdapter = require('./baseAdapter')
const { supabaseToSQLite, transformSupabaseToSQLite } = require('../../columnDefinitions')

class SupabaseAdapter extends BaseAdapter {
  constructor(config = {}) {
    super()
    this.supabase = null
    this.config = config
    this.connected = false
    this._inTransaction = false
    this._transactionOperations = []
  }

  /**
   * Initialize Supabase connection
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    try {
      const { createClient } = require('@supabase/supabase-js')

      const supabaseUrl = this.config.url || process.env.SUPABASE_URL
      const supabaseKey = this.config.key || process.env.SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase URL and API key are required')
      }

      this.supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        },
        db: {
          schema: 'public'
        }
      })

      // Test connection
      const { error } = await this.supabase.from('sites').select('count', { count: 'exact', head: true })

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      this.connected = true
      console.log('✅ Supabase connection established')
      return true
    } catch (error) {
      console.error('❌ Supabase initialization error:', error.message)
      this.connected = false
      return false
    }
  }

  /**
   * Prepare a SQL statement for execution
   * @param {string} sql - SQL query string
   * @returns {Object} Statement object with run(), get(), all() methods
   */
  prepare(sql) {
    const self = this
    const parsedQuery = this._parseSQL(sql)

    return {
      run: async (...params) => {
        try {
          const boundQuery = self._bindParams(parsedQuery, params)
          const result = await self._executeMutation(boundQuery)
          return { changes: result.count || 0 }
        } catch (error) {
          console.error('Supabase run error:', error.message)
          // Mark network errors for fallback handling
          if (error.message?.includes('fetch failed') || error.message?.includes('network') || error.code === 'ECONNREFUSED') {
            const networkError = new Error(`SUPABASE_NETWORK_ERROR: ${error.message}`)
            networkError.isNetworkError = true
            throw networkError
          }
          throw error
        }
      },

      get: async (...params) => {
        try {
          const boundQuery = self._bindParams(parsedQuery, params)
          const result = await self._executeQuery(boundQuery, true)
          return result
        } catch (error) {
          console.error('Supabase get error:', error.message)
          // Throw network errors for fallback handling instead of returning undefined
          if (error.message?.includes('fetch failed') || error.message?.includes('network') || error.message?.includes('COMPLEX_AGGREGATE') || error.code === 'ECONNREFUSED') {
            const networkError = new Error(`SUPABASE_NETWORK_ERROR: ${error.message}`)
            networkError.isNetworkError = true
            throw networkError
          }
          return undefined
        }
      },

      all: async (...params) => {
        try {
          const boundQuery = self._bindParams(parsedQuery, params)
          const result = await self._executeQuery(boundQuery, false)
          return result
        } catch (error) {
          console.error('Supabase all error:', error.message)
          // Throw network errors for fallback handling instead of returning []
          if (error.message?.includes('fetch failed') || error.message?.includes('network') || error.message?.includes('COMPLEX_AGGREGATE') || error.code === 'ECONNREFUSED') {
            const networkError = new Error(`SUPABASE_NETWORK_ERROR: ${error.message}`)
            networkError.isNetworkError = true
            throw networkError
          }
          return []
        }
      }
    }
  }

  /**
   * Execute SQL directly
   * @param {string} sql - SQL query string
   */
  async exec(sql) {
    try {
      if (sql.trim().toUpperCase().startsWith('CREATE TABLE')) {
        console.warn('⚠️ CREATE TABLE via exec() not supported. Use Supabase dashboard.')
        return
      }

      if (sql.trim().toUpperCase().startsWith('DROP TABLE')) {
        console.warn('⚠️ DROP TABLE via exec() not supported. Use Supabase dashboard.')
        return
      }

      const parsedQuery = this._parseSQL(sql)
      if (parsedQuery.type === 'SELECT') {
        await this._executeQuery(parsedQuery, false)
      } else {
        await this._executeMutation(parsedQuery)
      }
    } catch (error) {
      console.error('Supabase exec error:', error.message)
      throw error
    }
  }

  /**
   * Execute a transaction
   * @param {Function} fn - Transaction function
   * @returns {Function} Transaction wrapper
   */
  transaction(fn) {
    const self = this
    return async (data) => {
      try {
        self._inTransaction = true
        self._transactionOperations = []

        await fn(data)

        for (const operation of self._transactionOperations) {
          await operation()
        }

        self._inTransaction = false
        self._transactionOperations = []
      } catch (error) {
        self._inTransaction = false
        self._transactionOperations = []
        console.error('Transaction failed:', error)
        throw error
      }
    }
  }

  close() {
    if (this.supabase) {
      this.connected = false
      console.log('✅ Supabase connection closed')
    }
  }

  async backup() {
    try {
      const timestamp = new Date().toISOString()
      console.log('✅ Supabase backup initiated at:', timestamp)
      console.log('ℹ️ Note: Use Supabase dashboard for full database backups')
      return `supabase_backup_${timestamp}`
    } catch (error) {
      console.error('❌ Backup failed:', error)
      throw error
    }
  }

  getType() {
    return 'supabase'
  }

  getSupabase() {
    return this.supabase
  }

  /**
   * Parse SQL query to extract operation details
   * @private
   */
  _parseSQL(sql) {
    const trimmedSql = sql.trim()
    const upperSql = trimmedSql.toUpperCase()

    if (upperSql.startsWith('SELECT')) {
      return this._parseSELECT(trimmedSql)
    } else if (upperSql.startsWith('INSERT')) {
      return this._parseINSERT(trimmedSql)
    } else if (upperSql.startsWith('UPDATE')) {
      return this._parseUPDATE(trimmedSql)
    } else if (upperSql.startsWith('DELETE')) {
      return this._parseDELETE(trimmedSql)
    } else {
      return { type: 'OTHER', sql: trimmedSql }
    }
  }

  /**
   * Parse SELECT query
   * @private
   */
  _parseSELECT(sql) {
    const result = {
      type: 'SELECT',
      sql,
      table: null,
      columns: '*',
      where: null,
      orderBy: null,
      limit: null,
      isCount: false,
      countAlias: 'count',
      isComplexAggregate: false
    }

    // Check for complex aggregates (SUM, AVG, COUNT, GROUP BY) that can't be translated
    const hasComplexAggregate = /\b(SUM|AVG|MIN|MAX|COUNT\s*\(|GROUP\s+BY)\b/i.test(sql)
    if (hasComplexAggregate) {
      result.isComplexAggregate = true
      return result
    }

    // Extract table name: SELECT ... FROM table_name
    const fromMatch = sql.match(/FROM\s+([a-zA-Z_][a-zA-Z0-9_]*)/i)
    if (fromMatch) {
      result.table = fromMatch[1]
    }

    // Extract columns: SELECT col1, col2 FROM
    const selectMatch = sql.match(/SELECT\s+(.*?)\s+FROM/i)
    if (selectMatch) {
      const columnsStr = selectMatch[1].trim()

      // Check for COUNT(*) or COUNT(column) with optional alias
      const countMatch = columnsStr.match(/COUNT\s*\(\s*\*?\s*\)\s*(?:as\s+([a-zA-Z_][a-zA-Z0-9_]*)|([a-zA-Z_][a-zA-Z0-9_]*))?/i)
      if (countMatch) {
        result.isCount = true
        result.countAlias = countMatch[1] || countMatch[2] || 'count'
        result.columns = '*'
      } else {
        result.columns = columnsStr
      }
    }

    // Extract WHERE clause
    const whereMatch = sql.match(/WHERE\s+(.*?)(?:\s+ORDER BY|\s+LIMIT|\s+GROUP BY|\s*$)/i)
    if (whereMatch) {
      result.where = whereMatch[1].trim()
    }

    // Extract ORDER BY
    const orderMatch = sql.match(/ORDER BY\s+(.*?)(?:\s+LIMIT|\s*$)/i)
    if (orderMatch) {
      result.orderBy = orderMatch[1].trim()
    }

    // Extract LIMIT
    const limitMatch = sql.match(/LIMIT\s+(\d+)/i)
    if (limitMatch) {
      result.limit = parseInt(limitMatch[1])
    }

    return result
  }

  /**
   * Parse INSERT query
   * @private
   */
  _parseINSERT(sql) {
    const result = {
      type: 'INSERT',
      sql,
      table: null,
      columns: [],
      values: [],
      upsert: sql.toUpperCase().includes('INSERT OR REPLACE')
    }

    // Extract table name: INSERT INTO table_name or INSERT OR REPLACE INTO table_name
    const tableMatch = sql.match(/INSERT\s+(?:OR\s+REPLACE\s+)?INTO\s+([a-zA-Z_][a-zA-Z0-9_]*)/i)
    if (tableMatch) {
      result.table = tableMatch[1]
    }

    // Extract columns: (col1, col2, col3)
    const columnsMatch = sql.match(/\(([^)]+)\)\s+VALUES/i)
    if (columnsMatch) {
      result.columns = columnsMatch[1].split(',').map(c => c.trim())
    }

    // Extract VALUES - handle both single and multiple rows
    const valuesMatch = sql.match(/VALUES\s+(.+)/i)
    if (valuesMatch) {
      const valuesStr = valuesMatch[1].trim()
      
      // Split by ),( to handle multiple rows
      const valueGroups = valuesStr.split(/\),\s*\(/)
      
      result.values = valueGroups.map(group => {
        // Clean parentheses
        let cleaned = group.replace(/^\(/, '').replace(/\)$/, '').trim()
        // Remove trailing semicolon if exists
        cleaned = cleaned.replace(/;$/, '')
        return cleaned
      })
    }

    return result
  }

  /**
   * Parse UPDATE query
   * @private
   */
  _parseUPDATE(sql) {
    const result = {
      type: 'UPDATE',
      sql,
      table: null,
      sets: [],
      where: null
    }

    // Extract table name: UPDATE table_name SET
    const tableMatch = sql.match(/UPDATE\s+([a-zA-Z_][a-zA-Z0-9_]*)/i)
    if (tableMatch) {
      result.table = tableMatch[1]
    }

    // Extract SET clause
    const setMatch = sql.match(/SET\s+(.*?)(?:\s+WHERE|\s*$)/i)
    if (setMatch) {
      result.sets = setMatch[1].split(',').map(s => s.trim())
    }

    // Extract WHERE clause
    const whereMatch = sql.match(/WHERE\s+(.+)/i)
    if (whereMatch) {
      result.where = whereMatch[1].trim().replace(/;$/, '')
    }

    return result
  }

  /**
   * Parse DELETE query
   * @private
   */
  _parseDELETE(sql) {
    const result = {
      type: 'DELETE',
      sql,
      table: null,
      where: null
    }

    // Extract table name: DELETE FROM table_name
    const tableMatch = sql.match(/DELETE\s+FROM\s+([a-zA-Z_][a-zA-Z0-9_]*)/i)
    if (tableMatch) {
      result.table = tableMatch[1]
    }

    // Extract WHERE clause
    const whereMatch = sql.match(/WHERE\s+(.+)/i)
    if (whereMatch) {
      result.where = whereMatch[1].trim().replace(/;$/, '')
    }

    return result
  }

  /**
   * Bind parameters to query
   * @private
   */
  _bindParams(query, params) {
    if (!params || params.length === 0) {
      return query
    }

    let boundQuery = { ...query }
    
    // Replace ? placeholders with actual values
    if (query.type === 'INSERT' && query.values) {
      boundQuery.values = query.values.map(valueStr => {
        let paramIndex = 0
        return valueStr.replace(/\?/g, () => {
          const value = params[paramIndex++]
          return this._formatValue(value)
        })
      })
    } else if (query.type === 'UPDATE' && query.sets) {
      let paramIndex = 0
      boundQuery.sets = query.sets.map(setClause => {
        return setClause.replace(/\?/g, () => {
          const value = params[paramIndex++]
          return this._formatValue(value)
        })
      })
      
      if (query.where) {
        boundQuery.where = query.where.replace(/\?/g, () => {
          const value = params[paramIndex++]
          return this._formatValue(value)
        })
      }
    } else if (query.where) {
      let paramIndex = 0
      boundQuery.where = query.where.replace(/\?/g, () => {
        const value = params[paramIndex++]
        return this._formatValue(value)
      })
    }

    return boundQuery
  }

  /**
   * Format value for SQL
   * @private
   */
  _formatValue(value) {
    if (value === null || value === undefined) {
      return 'NULL'
    }
    if (typeof value === 'string') {
      return `'${value.replace(/'/g, "''")}'`
    }
    if (typeof value === 'boolean') {
      return value ? 'TRUE' : 'FALSE'
    }
    return value
  }

  /**
   * Execute SELECT query
   * @private
   */
  async _executeQuery(query, single = false) {
    // Handle complex aggregate queries - these need SQLite
    if (query.isComplexAggregate) {
      throw new Error('COMPLEX_AGGREGATE: Query contains SUM/AVG/GROUP BY which requires SQLite fallback')
    }

    if (!query.table) {
      throw new Error('No table specified in query')
    }

    // Handle COUNT queries specially
    if (query.isCount) {
      let supabaseQuery = this.supabase.from(query.table).select('*', { count: 'exact', head: true })

      // Apply WHERE conditions
      if (query.where) {
        supabaseQuery = this._applyWhereClause(supabaseQuery, query.where)
      }

      const { count, error } = await supabaseQuery

      if (error) {
        throw error
      }

      // Return result in expected format: { count: N } or { alias: N }
      const result = {}
      result[query.countAlias] = count || 0
      return result
    }

    let supabaseQuery = this.supabase.from(query.table)

    // Select columns
    if (query.columns && query.columns !== '*') {
      supabaseQuery = supabaseQuery.select(query.columns)
    } else {
      supabaseQuery = supabaseQuery.select('*')
    }

    // Apply WHERE conditions
    if (query.where) {
      supabaseQuery = this._applyWhereClause(supabaseQuery, query.where)
    }

    // Apply ORDER BY
    if (query.orderBy) {
      const [column, direction] = query.orderBy.split(/\s+/)
      const ascending = !direction || direction.toUpperCase() === 'ASC'
      supabaseQuery = supabaseQuery.order(column, { ascending })
    }

    // Apply LIMIT
    if (query.limit) {
      supabaseQuery = supabaseQuery.limit(query.limit)
    }

    // Execute query
    if (single) {
      const { data, error } = await supabaseQuery.single()
      if (error && error.code !== 'PGRST116') {
        throw error
      }
      // Transform Supabase column names to SQLite column names
      return data ? this._transformSupabaseRow(data) : null
    } else {
      const { data, error } = await supabaseQuery
      if (error) {
        throw error
      }
      // Transform Supabase column names to SQLite column names
      return data ? data.map(row => this._transformSupabaseRow(row)) : []
    }
  }

  /**
   * Transform Supabase row to SQLite format
   * @private
   */
  _transformSupabaseRow(row) {
    if (!row) return null
    
    const transformed = {}
    for (const [supabaseCol, value] of Object.entries(row)) {
      // Convert Supabase column name to SQLite column name
      const sqliteCol = supabaseToSQLite(supabaseCol)
      if (sqliteCol) {
        transformed[sqliteCol] = value
      } else {
        // Keep column if no mapping exists (like id, created_at, etc.)
        transformed[supabaseCol] = value
      }
    }
    return transformed
  }

  /**
   * Execute INSERT, UPDATE, DELETE mutation
   * @private
   */
  async _executeMutation(query) {
    if (!query.table) {
      throw new Error('No table specified in query')
    }

    if (query.type === 'INSERT') {
      return await this._executeInsert(query)
    } else if (query.type === 'UPDATE') {
      return await this._executeUpdate(query)
    } else if (query.type === 'DELETE') {
      return await this._executeDelete(query)
    }

    throw new Error(`Unsupported mutation type: ${query.type}`)
  }

  /**
   * Execute INSERT (with upsert support using site_id,phase_name)
   * @private
   */
  async _executeInsert(query) {
    const records = []

    for (const valueStr of query.values) {
      const values = this._parseValues(valueStr)
      const record = {}

      query.columns.forEach((col, i) => {
        record[col] = values[i]
      })

      records.push(record)
    }

    // Use upsert with composite key (site_id, phase_name) if INSERT OR REPLACE
    if (query.upsert) {
      const { data, error, count } = await this.supabase
        .from(query.table)
        .upsert(records, {
          onConflict: 'site_id,phase_name',
          ignoreDuplicates: false
        })
        .select()

      if (error) {
        throw error
      }

      // Transform returned data
      const transformedData = data ? data.map(row => this._transformSupabaseRow(row)) : []
      return { count: count || records.length, data: transformedData }
    }

    // Regular insert
    const { data, error, count } = await this.supabase
      .from(query.table)
      .insert(records)
      .select()

    if (error) {
      throw error
    }

    // Transform returned data
    const transformedData = data ? data.map(row => this._transformSupabaseRow(row)) : []
    return { count: count || records.length, data: transformedData }
  }

  /**
   * Execute UPDATE
   * @private
   */
  async _executeUpdate(query) {
    const updateData = {}
    
    query.sets.forEach(setClause => {
      const [column, value] = setClause.split('=').map(s => s.trim())
      updateData[column] = this._parseValue(value)
    })

    let supabaseQuery = this.supabase.from(query.table).update(updateData)

    if (query.where) {
      supabaseQuery = this._applyWhereClause(supabaseQuery, query.where)
    }

    const { data, error, count } = await supabaseQuery.select()

    if (error) {
      throw error
    }

    // Transform returned data
    const transformedData = data ? data.map(row => this._transformSupabaseRow(row)) : []
    return { count: count || 0, data: transformedData }
  }

  /**
   * Execute DELETE
   * @private
   */
  async _executeDelete(query) {
    let supabaseQuery = this.supabase.from(query.table).delete()

    if (query.where) {
      supabaseQuery = this._applyWhereClause(supabaseQuery, query.where)
    }

    const { data, error, count } = await supabaseQuery.select()

    if (error) {
      throw error
    }

    // Transform returned data
    const transformedData = data ? data.map(row => this._transformSupabaseRow(row)) : []
    return { count: count || 0, data: transformedData }
  }

  /**
   * Apply WHERE clause to Supabase query
   * @private
   */
  _applyWhereClause(supabaseQuery, whereClause) {
    // Split by AND/OR
    const conditions = whereClause.split(/\s+AND\s+/i)

    conditions.forEach(condition => {
      const eqMatch = condition.match(/([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)/)
      const neqMatch = condition.match(/([a-zA-Z_][a-zA-Z0-9_]*)\s*!=\s*(.+)/)
      const gtMatch = condition.match(/([a-zA-Z_][a-zA-Z0-9_]*)\s*>\s*(.+)/)
      const gteMatch = condition.match(/([a-zA-Z_][a-zA-Z0-9_]*)\s*>=\s*(.+)/)
      const ltMatch = condition.match(/([a-zA-Z_][a-zA-Z0-9_]*)\s*<\s*(.+)/)
      const lteMatch = condition.match(/([a-zA-Z_][a-zA-Z0-9_]*)\s*<=\s*(.+)/)
      const likeMatch = condition.match(/([a-zA-Z_][a-zA-Z0-9_]*)\s+LIKE\s+(.+)/i)

      if (eqMatch) {
        const [, column, value] = eqMatch
        supabaseQuery = supabaseQuery.eq(column, this._parseValue(value))
      } else if (neqMatch) {
        const [, column, value] = neqMatch
        supabaseQuery = supabaseQuery.neq(column, this._parseValue(value))
      } else if (gteMatch) {
        const [, column, value] = gteMatch
        supabaseQuery = supabaseQuery.gte(column, this._parseValue(value))
      } else if (gtMatch) {
        const [, column, value] = gtMatch
        supabaseQuery = supabaseQuery.gt(column, this._parseValue(value))
      } else if (lteMatch) {
        const [, column, value] = lteMatch
        supabaseQuery = supabaseQuery.lte(column, this._parseValue(value))
      } else if (ltMatch) {
        const [, column, value] = ltMatch
        supabaseQuery = supabaseQuery.lt(column, this._parseValue(value))
      } else if (likeMatch) {
        const [, column, value] = likeMatch
        supabaseQuery = supabaseQuery.like(column, this._parseValue(value))
      }
    })

    return supabaseQuery
  }

  /**
   * Parse comma-separated values
   * @private
   */
  _parseValues(valueStr) {
    const values = []
    let current = ''
    let inString = false
    
    for (let i = 0; i < valueStr.length; i++) {
      const char = valueStr[i]
      
      if (char === "'" && (i === 0 || valueStr[i - 1] !== '\\')) {
        inString = !inString
        current += char
      } else if (char === ',' && !inString) {
        values.push(this._parseValue(current.trim()))
        current = ''
      } else {
        current += char
      }
    }
    
    if (current.trim()) {
      values.push(this._parseValue(current.trim()))
    }
    
    return values
  }

  /**
   * Parse single value
   * @private
   */
  _parseValue(value) {
    value = value.trim()
    
    if (value === 'NULL') {
      return null
    }
    if (value === 'TRUE') {
      return true
    }
    if (value === 'FALSE') {
      return false
    }
    if (value.startsWith("'") && value.endsWith("'")) {
      return value.slice(1, -1).replace(/''/g, "'")
    }
    if (/^-?\d+$/.test(value)) {
      return parseInt(value)
    }
    if (/^-?\d+\.\d+$/.test(value)) {
      return parseFloat(value)
    }
    
    return value
  }

  /**
   * Subscribe to real-time changes
   */
  subscribeToChanges(table, callback) {
    if (!this.supabase) {
      throw new Error('Supabase not initialized')
    }

    return this.supabase
      .channel(`${table}_changes`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table },
        callback
      )
      .subscribe()
  }
}

module.exports = SupabaseAdapter
