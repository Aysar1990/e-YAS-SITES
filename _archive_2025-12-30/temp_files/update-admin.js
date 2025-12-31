const bcrypt = require('bcryptjs')
const fs = require('fs')
const initSqlJs = require('sql.js')

async function updateAdmin() {
  const SQL = await initSqlJs()
  const dbPath = './data/tssr.db'
  
  const fileBuffer = fs.readFileSync(dbPath)
  const db = new SQL.Database(fileBuffer)
  
  const hash = bcrypt.hashSync('admin', 10)
  
  // Check if admin exists
  const result = db.exec("SELECT * FROM users WHERE username = 'admin'")
  
  if (result.length === 0 || result[0].values.length === 0) {
    db.run(`INSERT INTO users (username, password, role) VALUES (?, ?, ?)`, ['admin', hash, 'admin'])
    console.log('✅ Admin user created')
  } else {
    db.run('UPDATE users SET password = ? WHERE username = ?', [hash, 'admin'])
    console.log('✅ Admin password updated')
  }
  
  const data = db.export()
  const buffer = Buffer.from(data)
  fs.writeFileSync(dbPath, buffer)
  
  console.log('🔐 Login: admin / admin')
}

updateAdmin().catch(console.error)
