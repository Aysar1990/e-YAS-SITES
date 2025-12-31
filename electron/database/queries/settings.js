const db = require('../db')

const settingsQueries = {
  getSetting: (key) => {
    const database = db.getDB()
    const stmt = database.prepare('SELECT value FROM settings WHERE key = ?')
    const result = stmt.get(key)
    return result ? result.value : null
  },

  getAllSettings: () => {
    const database = db.getDB()
    const stmt = database.prepare('SELECT key, value FROM settings')
    const rows = stmt.all()

    const settings = {}
    rows.forEach((row) => {
      settings[row.key] = row.value
    })
    return settings
  },

  setSetting: (key, value) => {
    const database = db.getDB()
    const stmt = database.prepare(`
      INSERT INTO settings (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = CURRENT_TIMESTAMP
    `)
    return stmt.run(key, value)
  },

  setMultipleSettings: (settings) => {
    const database = db.getDB()

    // Simply update each setting one by one
    for (const [key, value] of Object.entries(settings)) {
      const stmt = database.prepare(`
        INSERT INTO settings (key, value)
        VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          updated_at = CURRENT_TIMESTAMP
      `)
      stmt.run(key, String(value))
    }
  },

  deleteSetting: (key) => {
    const database = db.getDB()
    const stmt = database.prepare('DELETE FROM settings WHERE key = ?')
    return stmt.run(key)
  },
}

module.exports = settingsQueries
