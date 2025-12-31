#!/usr/bin/env node

/**
 * TSSR Monitor Standalone Server
 *
 * Runs as a pure Node.js server without Electron
 * Uses SQLite database and provides REST API + WebSocket
 *
 * Usage:
 *   node standaloneServer.js
 */

const path = require('path')
const fs = require('fs')

// Load server-side environment variables (includes SUPABASE_SERVICE_KEY)
const serverEnvPath = path.join(__dirname, '.env.server')
if (fs.existsSync(serverEnvPath)) {
  require('dotenv').config({ path: serverEnvPath })
  console.log('✅ Server environment loaded from .env.server')
} else {
  console.warn('⚠️ electron/.env.server not found - server-side features may be limited')
}

// Initialize database first
const db = require('./database/db')
const ApiServer = require('./server/apiServer')
const excelReader = require('./services/excelReader')
const realtimeSync = require('./services/realtimeSync')

class StandaloneTSSRServer {
  constructor() {
    this.apiServer = null
    this.syncInterval = null
  }

  async initialize() {
    console.log('='.repeat(60))
    console.log('🚀 TSSR Monitor Standalone Server')
    console.log('='.repeat(60))

    try {
      // 1. Initialize database
      console.log('\n💾 Initializing Database...')
      await db.initialize()
      console.log('✅ Database ready')

      // 2. Start API server
      console.log('\n🌐 Starting API Server...')
      this.apiServer = new ApiServer(db)
      await this.apiServer.start()

      // 3. Initialize real-time sync service
      console.log('\n🔄 Starting Real-time Sync Service...')
      await this.initializeRealtimeSync()

      // 4. Setup auto-sync from Excel (if file exists)
      this.setupAutoSync()

      console.log('\n' + '='.repeat(60))
      console.log('✅ TSSR Monitor Server Running Successfully!')
      console.log('='.repeat(60))

      this.printServerInfo()
      this.setupGracefulShutdown()

    } catch (error) {
      console.error('\n❌ Server initialization failed:', error)
      process.exit(1)
    }
  }

  async syncFromExcel() {
    try {
      // Get Excel path from settings or use default
      let excelPath = null
      try {
        const settings = db.prepare('SELECT value FROM settings WHERE key = ?').get('excel_path')
        excelPath = settings?.value
      } catch (e) {
        // Settings table might not have this key
      }

      if (!excelPath) {
        // Try default paths
        const defaultPaths = [
          path.join(__dirname, '..', 'TSSR Tracker Zain Jo 5.xlsm'),
          path.join(__dirname, '..', '..', 'TSSR Tracker Zain Jo 5.xlsm'),
        ]
        for (const p of defaultPaths) {
          if (fs.existsSync(p)) {
            excelPath = p
            break
          }
        }
      }

      if (!excelPath || !fs.existsSync(excelPath)) {
        console.log('⚠️ Excel file not found, skipping sync')
        return
      }

      console.log('🔄 Syncing from Excel:', excelPath)
      const sites = excelReader.getAllData(excelPath)
      console.log(`✅ Read ${sites.length} sites from Excel`)

      // Sync to database would happen here via dataSync service
      // For standalone mode, the API server handles the database

    } catch (error) {
      console.error('❌ Excel sync failed:', error.message)
    }
  }

  async initializeRealtimeSync() {
    try {
      const dbType = db.getAdapterType() // 'sqlite' or 'supabase'
      const adapter = db.getAdapter()

      // Get broadcast function from API server's WebSocket
      const broadcastFn = this.apiServer ? this.apiServer.broadcast.bind(this.apiServer) : null

      const success = await realtimeSync.initializeSync(
        dbType,
        adapter,
        null, // wsServer (not needed when using broadcastFn)
        broadcastFn
      )

      if (success) {
        console.log(`✅ Real-time sync enabled (${dbType} mode)`)
      } else {
        console.warn('⚠️ Real-time sync initialization failed')
      }
    } catch (error) {
      console.error('❌ Real-time sync error:', error.message)
    }
  }

  setupAutoSync() {
    console.log('\n⏰ Auto-sync: Every 5 minutes')

    // Initial sync
    this.syncFromExcel()

    // Periodic sync
    this.syncInterval = setInterval(() => {
      console.log('\n🔄 Auto-sync triggered...')
      this.syncFromExcel()
    }, 5 * 60 * 1000) // 5 minutes
  }

  printServerInfo() {
    const os = require('os')
    const interfaces = os.networkInterfaces()

    console.log('\n📡 Server Access URLs:')
    console.log('   API:       http://localhost:3001')
    console.log('   WebSocket: ws://localhost:3002')

    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          console.log(`   Network:   http://${iface.address}:3001`)
        }
      }
    }

    console.log('\n💡 Default Credentials:')
    console.log('   Username: admin')
    console.log('   Password: 123456')

    console.log('\n📌 Tips:')
    console.log('   - Press Ctrl+C to stop the server')
    console.log('   - Clients connect using the Network IP')
    console.log()
  }

  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      console.log(`\n\n🛑 Received ${signal}, shutting down...`)

      // Stop real-time sync service
      if (realtimeSync) {
        console.log('🔄 Stopping real-time sync...')
        await realtimeSync.stopSync()
      }

      if (this.syncInterval) {
        clearInterval(this.syncInterval)
      }

      if (this.apiServer) {
        await this.apiServer.stop()
      }

      console.log('✅ Server stopped')
      process.exit(0)
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'))
    process.on('SIGINT', () => shutdown('SIGINT'))
  }
}

// Start server
const server = new StandaloneTSSRServer()
server.initialize().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
