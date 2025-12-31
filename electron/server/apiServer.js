/**
 * API Server - Main Entry Point
 * Refactored modular version - NO PORT KILLING
 */

const express = require('express')
const cors = require('cors')
const net = require('net')
require('dotenv').config()

// Import routes
const { createAuthRoutes } = require('./routes/auth')
const createSitesRoutes = require('./routes/sites')
const createStatsRoutes = require('./routes/stats')
const createContractorsRoutes = require('./routes/contractors')
const { createNokiaReviewsRoutes, createGhirbalRoutes, createCheckedSitesRoutes } = require('./routes/nokiaReviews')
const { createUsersRoutes, createLoginRoute } = require('./routes/users')
const { createAuditLogsRoutes, createAuditLogAction } = require('./routes/auditLogs')
const { createBackupRoutes, createBackupSettingsRoutes } = require('./routes/backup')

// Import utilities
const { authenticateToken } = require('./middleware/auth')
const WebSocketServer = require('./websocket')

const API_PORT = 3001

class ApiServer {
  constructor(database) {
    this.db = database
    this.app = express()
    this.server = null
    this.wsServer = new WebSocketServer()
    this.logAction = createAuditLogAction(database)
    this.setupMiddleware()
    this.setupRoutes()
  }

  // Check if port is available
  async isPortAvailable(port) {
    return new Promise((resolve) => {
      const server = net.createServer()
      server.once('error', () => resolve(false))
      server.once('listening', () => {
        server.close()
        resolve(true)
      })
      server.listen(port)
    })
  }

  broadcast(event, data, excludeWs = null) {
    this.wsServer.broadcast(event, data, excludeWs)
  }

  setupMiddleware() {
    this.app.use(cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }))
    this.app.use(express.json())

    this.app.use((req, res, next) => {
      console.log(`[API] ${req.method} ${req.path}`)
      next()
    })
  }

  setupRoutes() {
    const auth = authenticateToken.bind(this)

    // Health check
    this.app.get('/api/health', (req, res) => {
      res.json({
        status: 'ok',
        mode: 'server',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      })
    })

    // Settings
    this.app.get('/api/settings', auth, (req, res) => {
      try {
        const settings = this.db.prepare('SELECT * FROM settings').all()
        const settingsObj = {}
        settings.forEach(s => {
          settingsObj[s.key] = s.value
        })
        res.json(settingsObj)
      } catch (error) {
        res.json({})
      }
    })

    // Server info
    this.app.get('/api/server/info', (req, res) => {
      const os = require('os')
      const interfaces = os.networkInterfaces()
      const addresses = []

      for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
          if (iface.family === 'IPv4' && !iface.internal) {
            addresses.push({ name, address: iface.address })
          }
        }
      }

      res.json({ hostname: os.hostname(), addresses, port: API_PORT })
    })

    // Mount routes
    this.app.use('/api/auth', createAuthRoutes(this.db, this.broadcast.bind(this), this.logAction))
    this.app.use('/api/login', createLoginRoute(this.db))
    this.app.use('/api/sites', createSitesRoutes(this.db, auth))
    this.app.use('/api/phases', (req, res, next) => {
      req.url = '/phases' + req.url
      createSitesRoutes(this.db, auth)(req, res, next)
    })
    this.app.use('/api/stats', createStatsRoutes(this.db, auth))
    this.app.use('/api/contractors', createContractorsRoutes(this.db, auth))
    this.app.use('/api/nokia-reviews', createNokiaReviewsRoutes(this.db, auth, this.broadcast.bind(this), this.logAction))
    this.app.use('/api/ghirbal-sites', createGhirbalRoutes(this.db, auth))
    this.app.use('/api/checked-sites', createCheckedSitesRoutes(this.db, auth))
    this.app.use('/api/users', createUsersRoutes(this.db, auth, this.logAction))
    this.app.use('/api/users-with-passwords', (req, res, next) => {
      req.url = '/with-passwords'
      createUsersRoutes(this.db, auth, this.logAction)(req, res, next)
    })
    this.app.use('/api/auth/users', createUsersRoutes(this.db, auth, this.logAction))
    this.app.use('/api/audit-logs', createAuditLogsRoutes(this.db, auth, this.logAction))
    this.app.use('/api/backups', createBackupRoutes(auth))
    this.app.use('/api/backup-settings', createBackupSettingsRoutes(auth))
  }

  async start() {
    // Check if port is available - if not, skip (standalone server running)
    const portAvailable = await this.isPortAvailable(API_PORT)
    
    if (!portAvailable) {
      console.log(`[API Server] Port ${API_PORT} already in use - skipping (standalone server running)`)
      return null
    }

    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(API_PORT, '0.0.0.0', async () => {
          console.log(`[API Server] ✅ Running on port ${API_PORT}`)

          const os = require('os')
          const interfaces = os.networkInterfaces()
          for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name]) {
              if (iface.family === 'IPv4' && !iface.internal) {
                console.log(`[API Server] Network: http://${iface.address}:${API_PORT}`)
              }
            }
          }

          // Start WebSocket server
          try {
            await this.wsServer.start()
          } catch (wsError) {
            console.warn('[API Server] WebSocket failed, continuing without it')
          }

          resolve(this.server)
        })

        this.server.on('error', (error) => {
          if (error.code === 'EADDRINUSE') {
            console.log(`[API Server] Port ${API_PORT} in use - standalone server running`)
            resolve(null)
          } else {
            reject(error)
          }
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  stop() {
    return new Promise(async (resolve) => {
      await this.wsServer.stop()

      if (this.server) {
        this.server.close(() => {
          console.log('[API Server] Stopped')
          resolve()
        })
      } else {
        resolve()
      }
    })
  }

  getConnectedClientsCount() {
    return this.wsServer.getConnectedClientsCount()
  }
}

module.exports = ApiServer
