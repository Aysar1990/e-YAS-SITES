/**
 * BaseAdapter - Abstract base class for database adapters
 *
 * Defines the interface that all database adapters must implement.
 * This allows seamless switching between SQLite and Supabase databases.
 */

class BaseAdapter {
  /**
   * Initialize database connection
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    throw new Error('initialize() must be implemented by subclass')
  }

  /**
   * Prepare a SQL statement for execution
   * @param {string} sql - SQL query string
   * @returns {Object} Statement object with run(), get(), all() methods
   */
  prepare(sql) {
    throw new Error('prepare() must be implemented by subclass')
  }

  /**
   * Execute SQL directly
   * @param {string} sql - SQL query string
   */
  exec(sql) {
    throw new Error('exec() must be implemented by subclass')
  }

  /**
   * Close database connection
   */
  close() {
    throw new Error('close() must be implemented by subclass')
  }

  /**
   * Execute a transaction
   * @param {Function} fn - Transaction function
   * @returns {Function} Transaction wrapper
   */
  transaction(fn) {
    throw new Error('transaction() must be implemented by subclass')
  }

  /**
   * Create a database backup
   * @returns {Promise<string>} Backup file path or identifier
   */
  async backup() {
    throw new Error('backup() must be implemented by subclass')
  }

  /**
   * Get adapter type identifier
   * @returns {string} Adapter type ('sqlite' or 'supabase')
   */
  getType() {
    throw new Error('getType() must be implemented by subclass')
  }
}

module.exports = BaseAdapter
