/**
 * Performance Monitor Service
 * Tracks application performance metrics
 *
 * Monitors:
 * - Render times
 * - Database query times
 * - Memory usage
 * - Bundle size
 */

const fs = require('fs')
const path = require('path')
const { EventEmitter } = require('events')

// Performance thresholds for alerts
const THRESHOLDS = {
  slowQuery: 500,      // ms - queries slower than this trigger alerts
  highMemory: 500,     // MB - memory usage above this triggers alerts
  largeBundleSize: 5,  // MB - bundle size above this triggers alerts
  slowRender: 100,     // ms - render times above this are flagged
  maxMetricsAge: 24 * 60 * 60 * 1000 // 24 hours in ms
}

class PerformanceMonitor extends EventEmitter {
  constructor() {
    super()
    this.metrics = {
      queries: [],
      renders: [],
      memory: [],
      api: [],
      errors: []
    }
    this.isRunning = false
    this.intervalId = null
    this.startTime = Date.now()
    this.alertCallbacks = []
  }

  /**
   * Start the performance monitor
   */
  start(intervalMs = 60000) {
    if (this.isRunning) return

    this.isRunning = true
    this.startTime = Date.now()

    // Collect memory metrics periodically
    this.intervalId = setInterval(() => {
      this.collectMemoryMetrics()
      this.cleanOldMetrics()
    }, intervalMs)

    console.log('[PerfMonitor] Started with interval:', intervalMs, 'ms')
  }

  /**
   * Stop the performance monitor
   */
  stop() {
    if (!this.isRunning) return

    this.isRunning = false
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    console.log('[PerfMonitor] Stopped')
  }

  /**
   * Track a database query
   */
  trackQuery(queryName, durationMs, success = true, rowCount = 0) {
    const metric = {
      timestamp: Date.now(),
      name: queryName,
      duration: durationMs,
      success,
      rowCount
    }

    this.metrics.queries.push(metric)

    // Check for slow query alert
    if (durationMs > THRESHOLDS.slowQuery) {
      this.triggerAlert('slowQuery', {
        query: queryName,
        duration: durationMs,
        threshold: THRESHOLDS.slowQuery
      })
    }

    this.emit('query', metric)
    return metric
  }

  /**
   * Track a render time
   */
  trackRender(componentName, durationMs, rerenderCount = 1) {
    const metric = {
      timestamp: Date.now(),
      component: componentName,
      duration: durationMs,
      rerenderCount
    }

    this.metrics.renders.push(metric)

    if (durationMs > THRESHOLDS.slowRender) {
      this.emit('slowRender', metric)
    }

    this.emit('render', metric)
    return metric
  }

  /**
   * Track an API call
   */
  trackApi(endpoint, method, durationMs, status, dataSize = 0) {
    const metric = {
      timestamp: Date.now(),
      endpoint,
      method,
      duration: durationMs,
      status,
      dataSize
    }

    this.metrics.api.push(metric)
    this.emit('api', metric)
    return metric
  }

  /**
   * Track an error
   */
  trackError(errorType, message, stack = null) {
    const metric = {
      timestamp: Date.now(),
      type: errorType,
      message,
      stack
    }

    this.metrics.errors.push(metric)
    this.emit('error', metric)
    return metric
  }

  /**
   * Collect current memory metrics
   */
  collectMemoryMetrics() {
    const usage = process.memoryUsage()

    const metric = {
      timestamp: Date.now(),
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      rss: Math.round(usage.rss / 1024 / 1024), // MB
      external: Math.round((usage.external || 0) / 1024 / 1024) // MB
    }

    this.metrics.memory.push(metric)

    // Check for high memory alert
    if (metric.heapUsed > THRESHOLDS.highMemory) {
      this.triggerAlert('highMemory', {
        heapUsed: metric.heapUsed,
        threshold: THRESHOLDS.highMemory
      })
    }

    this.emit('memory', metric)
    return metric
  }

  /**
   * Analyze bundle size
   */
  analyzeBundleSize() {
    const distPath = path.join(__dirname, '../../dist')

    if (!fs.existsSync(distPath)) {
      return { error: 'dist folder not found' }
    }

    let totalSize = 0
    const files = []

    const walkDir = (dir) => {
      const items = fs.readdirSync(dir)
      for (const item of items) {
        const fullPath = path.join(dir, item)
        const stat = fs.statSync(fullPath)

        if (stat.isDirectory()) {
          walkDir(fullPath)
        } else {
          const sizeKB = stat.size / 1024
          totalSize += sizeKB
          files.push({
            path: fullPath.replace(distPath, ''),
            size: sizeKB
          })
        }
      }
    }

    walkDir(distPath)

    const sizeMB = totalSize / 1024

    // Sort by size descending
    files.sort((a, b) => b.size - a.size)

    const result = {
      timestamp: Date.now(),
      totalSizeMB: Math.round(sizeMB * 100) / 100,
      fileCount: files.length,
      largestFiles: files.slice(0, 10).map(f => ({
        path: f.path,
        sizeKB: Math.round(f.size * 100) / 100
      }))
    }

    // Check for large bundle alert
    if (sizeMB > THRESHOLDS.largeBundleSize) {
      this.triggerAlert('largeBundleSize', {
        size: sizeMB,
        threshold: THRESHOLDS.largeBundleSize
      })
    }

    return result
  }

  /**
   * Get performance summary
   */
  getSummary() {
    const now = Date.now()
    const last24h = now - 24 * 60 * 60 * 1000

    // Query stats
    const recentQueries = this.metrics.queries.filter(q => q.timestamp > last24h)
    const queryStats = {
      total: recentQueries.length,
      avgDuration: recentQueries.length > 0
        ? Math.round(recentQueries.reduce((sum, q) => sum + q.duration, 0) / recentQueries.length)
        : 0,
      slowQueries: recentQueries.filter(q => q.duration > THRESHOLDS.slowQuery).length,
      failed: recentQueries.filter(q => !q.success).length
    }

    // Memory stats
    const recentMemory = this.metrics.memory.filter(m => m.timestamp > last24h)
    const memoryStats = {
      samples: recentMemory.length,
      avgHeapUsed: recentMemory.length > 0
        ? Math.round(recentMemory.reduce((sum, m) => sum + m.heapUsed, 0) / recentMemory.length)
        : 0,
      maxHeapUsed: recentMemory.length > 0
        ? Math.max(...recentMemory.map(m => m.heapUsed))
        : 0,
      current: recentMemory.length > 0
        ? recentMemory[recentMemory.length - 1]
        : null
    }

    // Render stats
    const recentRenders = this.metrics.renders.filter(r => r.timestamp > last24h)
    const renderStats = {
      total: recentRenders.length,
      avgDuration: recentRenders.length > 0
        ? Math.round(recentRenders.reduce((sum, r) => sum + r.duration, 0) / recentRenders.length)
        : 0,
      slowRenders: recentRenders.filter(r => r.duration > THRESHOLDS.slowRender).length
    }

    // API stats
    const recentApi = this.metrics.api.filter(a => a.timestamp > last24h)
    const apiStats = {
      total: recentApi.length,
      avgDuration: recentApi.length > 0
        ? Math.round(recentApi.reduce((sum, a) => sum + a.duration, 0) / recentApi.length)
        : 0,
      errors: recentApi.filter(a => a.status >= 400).length
    }

    // Error stats
    const recentErrors = this.metrics.errors.filter(e => e.timestamp > last24h)
    const errorStats = {
      total: recentErrors.length,
      byType: recentErrors.reduce((acc, e) => {
        acc[e.type] = (acc[e.type] || 0) + 1
        return acc
      }, {})
    }

    return {
      timestamp: now,
      uptime: now - this.startTime,
      thresholds: THRESHOLDS,
      queries: queryStats,
      memory: memoryStats,
      renders: renderStats,
      api: apiStats,
      errors: errorStats,
      bundleSize: this.analyzeBundleSize()
    }
  }

  /**
   * Get time series data for charts
   */
  getTimeSeriesData(type, hours = 24) {
    const since = Date.now() - hours * 60 * 60 * 1000
    const data = this.metrics[type] || []

    return data
      .filter(m => m.timestamp > since)
      .map(m => ({
        ...m,
        time: new Date(m.timestamp).toISOString()
      }))
  }

  /**
   * Register alert callback
   */
  onAlert(callback) {
    this.alertCallbacks.push(callback)
  }

  /**
   * Trigger an alert
   */
  triggerAlert(type, data) {
    const alert = {
      type,
      timestamp: Date.now(),
      data
    }

    console.warn('[PerfMonitor] Alert:', type, data)

    this.alertCallbacks.forEach(cb => {
      try {
        cb(alert)
      } catch (err) {
        console.error('[PerfMonitor] Alert callback error:', err)
      }
    })

    this.emit('alert', alert)
  }

  /**
   * Clean old metrics to prevent memory leaks
   */
  cleanOldMetrics() {
    const cutoff = Date.now() - THRESHOLDS.maxMetricsAge

    for (const type of Object.keys(this.metrics)) {
      const before = this.metrics[type].length
      this.metrics[type] = this.metrics[type].filter(m => m.timestamp > cutoff)
      const after = this.metrics[type].length

      if (before !== after) {
        console.log(`[PerfMonitor] Cleaned ${before - after} old ${type} metrics`)
      }
    }
  }

  /**
   * Export metrics to file
   */
  exportMetrics(filepath = null) {
    const exportPath = filepath || path.join(__dirname, '../../logs/performance.json')
    const dir = path.dirname(exportPath)

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    const data = {
      exportedAt: new Date().toISOString(),
      summary: this.getSummary(),
      metrics: this.metrics
    }

    fs.writeFileSync(exportPath, JSON.stringify(data, null, 2))
    console.log('[PerfMonitor] Metrics exported to:', exportPath)

    return exportPath
  }

  /**
   * Create a query timer helper
   */
  createQueryTimer(queryName) {
    const start = process.hrtime.bigint()

    return {
      end: (success = true, rowCount = 0) => {
        const end = process.hrtime.bigint()
        const durationMs = Number(end - start) / 1_000_000
        return this.trackQuery(queryName, durationMs, success, rowCount)
      }
    }
  }

  /**
   * Create a render timer helper
   */
  createRenderTimer(componentName) {
    const start = process.hrtime.bigint()

    return {
      end: (rerenderCount = 1) => {
        const end = process.hrtime.bigint()
        const durationMs = Number(end - start) / 1_000_000
        return this.trackRender(componentName, durationMs, rerenderCount)
      }
    }
  }

  /**
   * Get thresholds
   */
  getThresholds() {
    return { ...THRESHOLDS }
  }

  /**
   * Update threshold
   */
  setThreshold(key, value) {
    if (key in THRESHOLDS) {
      THRESHOLDS[key] = value
      console.log(`[PerfMonitor] Threshold ${key} set to ${value}`)
    }
  }
}

// Singleton instance
const performanceMonitor = new PerformanceMonitor()

module.exports = performanceMonitor
