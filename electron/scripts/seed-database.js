/**
 * Database Seeder Script
 * Adds test/demo data to the database
 *
 * Usage: npm run db:seed
 */

const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../../.env') })

const db = require('../database/db')

// Sample phases
const PHASES = [
  'Phase 1 - Urban',
  'Phase 2 - Suburban',
  'Phase 3 - Rural',
  'Phase 4 - Highway',
  'Phase 5 - Industrial'
]

// Sample governorates
const GOVERNORATES = ['Amman', 'Irbid', 'Zarqa', 'Aqaba', 'Mafraq', 'Karak', 'Balqa', 'Madaba']

// Sample contractors
const CONTRACTORS = ['Contractor A', 'Contractor B', 'Contractor C', 'Nokia Direct']

// Sample statuses
const STATUSES = ['Pending', 'Submitted', 'In Review', 'Approved', 'Rejected', 'Done']

// Sample site types
const SITE_TYPES = ['GreenField', 'RoofTop', 'Indoor', 'COW', 'Small Cell']

/**
 * Generate random date within last 90 days
 */
function randomDate() {
  const now = new Date()
  const daysAgo = Math.floor(Math.random() * 90)
  now.setDate(now.getDate() - daysAgo)
  return now.toISOString().split('T')[0]
}

/**
 * Generate random coordinates in Jordan
 */
function randomCoords() {
  // Jordan approximate bounds
  const lat = 29.5 + Math.random() * 3.5 // 29.5 to 33
  const lon = 35.0 + Math.random() * 4.0 // 35 to 39
  return { lat: lat.toFixed(6), lon: lon.toFixed(6) }
}

/**
 * Pick random item from array
 */
function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * Generate a single test site
 */
function generateSite(index) {
  const coords = randomCoords()
  const phase = randomPick(PHASES)
  const status = randomPick(STATUSES)

  return {
    site_id: `TEST-${String(index).padStart(4, '0')}`,
    phase_name: phase,
    site_name: `Test Site ${index}`,
    latitude: parseFloat(coords.lat),
    longitude: parseFloat(coords.lon),
    governorate: randomPick(GOVERNORATES),
    district: `District ${Math.floor(Math.random() * 10) + 1}`,
    city: `City ${Math.floor(Math.random() * 20) + 1}`,
    site_type: randomPick(SITE_TYPES),
    site_category: Math.random() > 0.3 ? 'Macro' : 'Micro',
    priority: Math.floor(Math.random() * 100) + 1,
    tssr_overall_status: status,
    comments: `Test site generated for development - ${new Date().toISOString()}`,

    // TI Section
    ti_assigned_to: `TI Engineer ${Math.floor(Math.random() * 5) + 1}`,
    ti_status: randomPick(STATUSES),
    ti_date: randomDate(),
    ti_notes: 'Auto-generated test data',

    // RF Planning Section
    rf_plan_assigned_to: `RF Planner ${Math.floor(Math.random() * 3) + 1}`,
    rf_plan_status: randomPick(STATUSES),
    rf_plan_date: randomDate(),

    // RF Optimization Section
    rf_opt_assigned_to: `RF Optimizer ${Math.floor(Math.random() * 3) + 1}`,
    rf_opt_status: randomPick(STATUSES),
    rf_opt_date: randomDate(),

    // Civil Section
    civil_assigned_to: `Civil Engineer ${Math.floor(Math.random() * 4) + 1}`,
    civil_status: randomPick(STATUSES),
    civil_date: randomDate(),

    // MW Section
    mw_assigned_to: `MW Engineer ${Math.floor(Math.random() * 3) + 1}`,
    mw_status: randomPick(STATUSES),
    mw_date: randomDate(),

    // Contractor Info
    contractor_name: randomPick(CONTRACTORS),
    contractor_status: randomPick(['Active', 'Pending', 'Complete']),
    contractor_submission_date: randomDate(),

    // Timestamps
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

/**
 * Seed users
 */
async function seedUsers() {
  console.log('Seeding users...')

  const users = [
    { username: 'admin', password: '123456', role: 'admin', full_name: 'Administrator', department: 'IT' },
    { username: 'nokia', password: '123456', role: 'nokia', full_name: 'Nokia Reviewer', department: 'Nokia' },
    { username: 'contractor1', password: '123456', role: 'contractor', full_name: 'Contractor A User', department: 'Contractor A' },
    { username: 'manager', password: '123456', role: 'management', full_name: 'Project Manager', department: 'Management' },
    { username: 'ti_user', password: '123456', role: 'nokia', full_name: 'TI Engineer', department: 'TI' },
    { username: 'rf_user', password: '123456', role: 'nokia', full_name: 'RF Engineer', department: 'RF' }
  ]

  for (const user of users) {
    try {
      // Check if user exists
      const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(user.username)
      if (!existing) {
        const bcrypt = require('bcryptjs')
        const hash = bcrypt.hashSync(user.password, 10)
        db.prepare(`
          INSERT INTO users (username, password_hash, role, full_name, department, is_active, created_at)
          VALUES (?, ?, ?, ?, ?, 1, datetime('now'))
        `).run(user.username, hash, user.role, user.full_name, user.department)
        console.log(`  Created user: ${user.username}`)
      } else {
        console.log(`  User exists: ${user.username}`)
      }
    } catch (err) {
      console.log(`  Error creating ${user.username}: ${err.message}`)
    }
  }
}

/**
 * Seed sites
 */
async function seedSites(count = 100) {
  console.log(`Seeding ${count} test sites...`)

  const sites = []
  for (let i = 1; i <= count; i++) {
    sites.push(generateSite(i))
  }

  // Build column list dynamically
  const columns = Object.keys(sites[0])
  const placeholders = columns.map(() => '?').join(', ')

  const insertSql = `
    INSERT OR REPLACE INTO sites (${columns.join(', ')})
    VALUES (${placeholders})
  `

  const stmt = db.prepare(insertSql)
  let inserted = 0
  let errors = 0

  for (const site of sites) {
    try {
      stmt.run(...columns.map(col => site[col]))
      inserted++
    } catch (err) {
      errors++
      if (errors <= 3) {
        console.log(`  Error inserting site: ${err.message}`)
      }
    }
  }

  console.log(`  Inserted: ${inserted}, Errors: ${errors}`)
}

/**
 * Seed settings
 */
async function seedSettings() {
  console.log('Seeding settings...')

  const settings = [
    { key: 'app_name', value: 'e-YAS SITES' },
    { key: 'app_version', value: '2.0.0' },
    { key: 'database_type', value: process.env.DATABASE_TYPE || 'sqlite' },
    { key: 'realtime_enabled', value: 'true' },
    { key: 'auto_backup', value: 'true' },
    { key: 'backup_interval', value: '24' },
    { key: 'theme', value: 'dark' },
    { key: 'language', value: 'ar' }
  ]

  for (const setting of settings) {
    try {
      db.prepare(`
        INSERT OR REPLACE INTO settings (key, value, updated_at)
        VALUES (?, ?, datetime('now'))
      `).run(setting.key, setting.value)
      console.log(`  Set: ${setting.key} = ${setting.value}`)
    } catch (err) {
      console.log(`  Error setting ${setting.key}: ${err.message}`)
    }
  }
}

/**
 * Main seeding function
 */
async function seed() {
  console.log('========================================')
  console.log('e-YAS SITES Database Seeder')
  console.log('========================================\n')

  try {
    // Initialize database
    console.log('Initializing database...')
    db.initialize()
    console.log(`Database type: ${db.getAdapterType()}\n`)

    // Seed data
    await seedUsers()
    console.log()

    await seedSites(100)
    console.log()

    await seedSettings()
    console.log()

    // Verify
    console.log('Verification:')
    const siteCount = db.prepare('SELECT COUNT(*) as count FROM sites').get()
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get()
    console.log(`  Total sites: ${siteCount?.count || 0}`)
    console.log(`  Total users: ${userCount?.count || 0}`)

    console.log('\n========================================')
    console.log('Seeding complete!')
    console.log('========================================')

  } catch (error) {
    console.error('Seeding failed:', error)
    process.exit(1)
  }
}

// Run seeder
seed()
