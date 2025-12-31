const db = require('../db')

const authQueries = {
  validateUser: (username, password) => {
    const database = db.getDB()
    const stmt = database.prepare(`
      SELECT id, username, role, contractor_name, is_active
      FROM users
      WHERE username = ? AND password = ? AND is_active = 1
    `)
    return stmt.get(username, password)
  },

  getUserById: (id) => {
    const database = db.getDB()
    const stmt = database.prepare('SELECT * FROM users WHERE id = ?')
    return stmt.get(id)
  },

  getAllUsers: () => {
    const database = db.getDB()
    const stmt = database.prepare('SELECT id, username, role, contractor_name, is_active, created_at FROM users')
    return stmt.all()
  },

  createUser: (username, password, role, contractorName) => {
    const database = db.getDB()
    const stmt = database.prepare(`
      INSERT INTO users (username, password, role, contractor_name, is_active)
      VALUES (?, ?, ?, ?, 1)
    `)
    return stmt.run(username, password, role, contractorName)
  },

  updatePassword: (username, newPassword) => {
    const database = db.getDB()
    const stmt = database.prepare(`
      UPDATE users
      SET password = ?, updated_at = CURRENT_TIMESTAMP
      WHERE username = ?
    `)
    return stmt.run(newPassword, username)
  },

  getAllContractors: () => {
    const database = db.getDB()
    const stmt = database.prepare(`
      SELECT id, username, contractor_name, is_active, created_at
      FROM users
      WHERE role = 'contractor'
      ORDER BY contractor_name ASC
    `)
    return stmt.all()
  },

  updateContractorStatus: (id, isActive) => {
    const database = db.getDB()
    const stmt = database.prepare(`
      UPDATE users
      SET is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    return stmt.run(isActive, id)
  },

  updateContractorPassword: (id, newPassword) => {
    const database = db.getDB()
    const stmt = database.prepare(`
      UPDATE users
      SET password = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    return stmt.run(newPassword, id)
  },

  deleteUser: (id) => {
    const database = db.getDB()
    const stmt = database.prepare('DELETE FROM users WHERE id = ? AND role = "contractor"')
    return stmt.run(id)
  },

  logActivity: (userId, action, details) => {
    const database = db.getDB()
    const stmt = database.prepare(`
      INSERT INTO activity_log (user_id, action, details)
      VALUES (?, ?, ?)
    `)
    return stmt.run(userId, action, details)
  },

  getActivityLog: (limit = 100) => {
    const database = db.getDB()
    const stmt = database.prepare(`
      SELECT al.*, u.username
      FROM activity_log al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.timestamp DESC
      LIMIT ?
    `)
    return stmt.all(limit)
  },

  // ============================================
  // Role Permissions
  // ============================================

  getRolePermissions: () => {
    const database = db.getDB()
    const stmt = database.prepare('SELECT role_name, page_access FROM role_permissions')
    const rows = stmt.all()

    // Convert to object format
    const permissions = {}
    rows.forEach(row => {
      try {
        permissions[row.role_name] = JSON.parse(row.page_access)
      } catch (e) {
        permissions[row.role_name] = {}
      }
    })
    return permissions
  },

  getRolePermissionsByRole: (roleName) => {
    const database = db.getDB()
    const stmt = database.prepare('SELECT page_access FROM role_permissions WHERE role_name = ?')
    const row = stmt.get(roleName)

    if (row) {
      try {
        return JSON.parse(row.page_access)
      } catch (e) {
        return {}
      }
    }
    return null
  },

  updateRolePermissions: (roleName, permissions) => {
    const database = db.getDB()
    const pageAccess = JSON.stringify(permissions)

    // Try to update first
    const updateStmt = database.prepare(`
      UPDATE role_permissions
      SET page_access = ?, updated_at = CURRENT_TIMESTAMP
      WHERE role_name = ?
    `)
    const result = updateStmt.run(pageAccess, roleName)

    // If no rows updated, insert new
    if (result.changes === 0) {
      const insertStmt = database.prepare(`
        INSERT INTO role_permissions (role_name, page_access) VALUES (?, ?)
      `)
      return insertStmt.run(roleName, pageAccess)
    }

    return result
  },

  // ============================================
  // Enhanced User Management
  // ============================================

  getAllUsersWithDetails: () => {
    const database = db.getDB()
    const stmt = database.prepare(`
      SELECT id, username, role, contractor_name, is_active, created_at, updated_at
      FROM users
      ORDER BY
        CASE role
          WHEN 'admin' THEN 1
          WHEN 'management' THEN 2
          WHEN 'nokia_engineer' THEN 3
          WHEN 'contractor' THEN 4
        END,
        username ASC
    `)
    return stmt.all()
  },

  createUserFull: (username, password, role, contractorName = null) => {
    const database = db.getDB()

    // Check if username already exists
    const checkStmt = database.prepare('SELECT id FROM users WHERE username = ?')
    const existing = checkStmt.get(username)
    if (existing) {
      throw new Error('Username already exists')
    }

    const stmt = database.prepare(`
      INSERT INTO users (username, password, role, contractor_name, is_active)
      VALUES (?, ?, ?, ?, 1)
    `)
    return stmt.run(username, password, role, contractorName)
  },

  updateUser: (id, updates) => {
    const database = db.getDB()
    const { username, password, role, contractor_name, is_active } = updates

    let sql = 'UPDATE users SET updated_at = CURRENT_TIMESTAMP'
    const params = []

    if (username !== undefined) {
      sql += ', username = ?'
      params.push(username)
    }
    if (password !== undefined && password !== '') {
      sql += ', password = ?'
      params.push(password)
    }
    if (role !== undefined) {
      sql += ', role = ?'
      params.push(role)
    }
    if (contractor_name !== undefined) {
      sql += ', contractor_name = ?'
      params.push(contractor_name)
    }
    if (is_active !== undefined) {
      sql += ', is_active = ?'
      params.push(is_active ? 1 : 0)
    }

    sql += ' WHERE id = ?'
    params.push(id)

    const stmt = database.prepare(sql)
    return stmt.run(...params)
  },

  deleteUserById: (id) => {
    const database = db.getDB()
    // Don't allow deleting admin users
    const checkStmt = database.prepare('SELECT role FROM users WHERE id = ?')
    const user = checkStmt.get(id)

    if (user && user.role === 'admin') {
      throw new Error('Cannot delete admin users')
    }

    const stmt = database.prepare('DELETE FROM users WHERE id = ?')
    return stmt.run(id)
  },

  getUserByUsername: (username) => {
    const database = db.getDB()
    const stmt = database.prepare('SELECT * FROM users WHERE username = ?')
    return stmt.get(username)
  },
}

module.exports = authQueries
