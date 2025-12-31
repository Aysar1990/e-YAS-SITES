/**
 * YAS TSSR Monitor - Live Sync File Watcher
 * Watches JSON file exported from Excel for real-time updates
 */

const fs = require('fs')
const path = require('path')
const { EventEmitter } = require('events')

class LiveSyncWatcher extends EventEmitter {
  constructor(options = {}) {
    super()
    
    this.jsonPath = options.jsonPath || path.join(__dirname, '../../data/live_sync.json')
    this.watcher = null
    this.isWatching = false
    this.lastModified = null
    this.debounceTimer = null
    this.debounceMs = options.debounceMs || 500 // Wait 500ms after last change
    this.mainWindow = null
  }

  /**
   * Start watching the JSON file
   */
  start(mainWindow) {
    if (this.isWatching) {
      console.log('⚠️ LiveSync watcher already running')
      return
    }

    this.mainWindow = mainWindow
    
    // Ensure data directory exists
    const dataDir = path.dirname(this.jsonPath)
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
      console.log('📁 Created data directory:', dataDir)
    }

    // Check if file exists, create empty if not
    if (!fs.existsSync(this.jsonPath)) {
      fs.writeFileSync(this.jsonPath, JSON.stringify({ metadata: {}, data: [] }))
      console.log('📄 Created empty sync file:', this.jsonPath)
    }

    try {
      this.watcher = fs.watch(this.jsonPath, (eventType, filename) => {
        if (eventType === 'change') {
          this.handleFileChange()
        }
      })

      this.isWatching = true
      console.log('👁️ LiveSync watcher started:', this.jsonPath)
      
      // Initial read
      this.readAndEmit()

    } catch (error) {
      console.error('❌ Failed to start LiveSync watcher:', error.message)
      this.emit('error', error)
    }
  }

  /**
   * Stop watching
   */
  stop() {
    if (this.watcher) {
      this.watcher.close()
      this.watcher = null
    }
    
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }
    
    this.isWatching = false
    console.log('⏹️ LiveSync watcher stopped')
  }

  /**
   * Handle file change with debouncing
   */
  handleFileChange() {
    // Clear existing timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }

    // Set new timer
    this.debounceTimer = setTimeout(() => {
      this.readAndEmit()
    }, this.debounceMs)
  }

  /**
   * Read JSON file and emit update
   */
  readAndEmit() {
    try {
      // Check file modification time
      const stats = fs.statSync(this.jsonPath)
      
      if (this.lastModified && stats.mtime <= this.lastModified) {
        return // No actual change
      }
      
      this.lastModified = stats.mtime

      // Read and parse JSON
      const content = fs.readFileSync(this.jsonPath, 'utf8')
      const data = JSON.parse(content)

      console.log(`📥 LiveSync: Received ${data.data?.length || 0} records from Excel`)
      console.log(`   Export time: ${data.metadata?.exportTime}`)

      // Emit event for other modules
      this.emit('data-update', data)

      // Send to renderer
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('live-sync-update', {
          success: true,
          recordCount: data.data?.length || 0,
          exportTime: data.metadata?.exportTime,
          timestamp: new Date().toISOString()
        })
      }

    } catch (error) {
      console.error('❌ LiveSync read error:', error.message)
      this.emit('error', error)
    }
  }

  /**
   * Get current data from JSON file
   */
  getData() {
    try {
      if (!fs.existsSync(this.jsonPath)) {
        return { metadata: {}, data: [] }
      }

      const content = fs.readFileSync(this.jsonPath, 'utf8')
      return JSON.parse(content)

    } catch (error) {
      console.error('❌ LiveSync getData error:', error.message)
      return { metadata: {}, data: [] }
    }
  }

  /**
   * Get sync status
   */
  getStatus() {
    try {
      if (!fs.existsSync(this.jsonPath)) {
        return {
          isWatching: this.isWatching,
          lastSync: null,
          recordCount: 0
        }
      }

      const stats = fs.statSync(this.jsonPath)
      const data = this.getData()

      return {
        isWatching: this.isWatching,
        lastSync: stats.mtime,
        recordCount: data.data?.length || 0,
        exportTime: data.metadata?.exportTime
      }

    } catch (error) {
      return {
        isWatching: this.isWatching,
        error: error.message
      }
    }
  }
}

module.exports = LiveSyncWatcher
