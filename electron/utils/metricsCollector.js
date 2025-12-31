/**
 * Metrics Collector
 * Aggregates metrics from all sources and persists to logs
 *
 * Collects from:
 * - Performance Monitor (queries, renders, memory)
 * - Client-side performance reports
 * - System metrics
 */

const fs = require('fs')
const path = require('path')
const os = require('os')
const { EventEmitter } = require('events')
const performanceMonitor = require('../services/performanceMonitor')

// Configuration
const CONFIG = {
  logPath: path.join(__dirname, '../../logs/performance.json'),
  historyPath: path.join(__dirname, '../../logs/performance-history'),
  maxHistoryFiles: 30, // Keep last 30 daily files
  aggregateInterval: 5 * 60 * 1000, // Aggregate every 5 minutes
  saveInterval: 60 * 1000 // Save to disk every minute
}

class MetricsCollector extends EventEmitter {
  constructor() {
    super()

    this.aggregatedMetrics = {
      startTime: Date.now(),
      lastUpdated: null,
      system: {},
      performance: {},
      client: [],
      alerts: [],
      summary: {}
    }

    this.clientMetrics = []
    this.isRunning = false
    this.aggregateIntervalId = null
    this.saveIntervalId = null
  }

  /**
   * Start collecting metrics
   */
  start() {
    if (this.isRunning) return

    this.isRunning = true
    this.aggregatedMetrics.startTime = Date.now()

    // Start performance monitor
    performanceMonitor.start(60000)

    // Listen for alerts from performance monitor
    performanceMonitor.onAlert((alert) => {
      this.addAlert(alert)
    })

    // Aggregate metrics periodically
    this.aggregateIntervalId = setInterval(() => {
      this.aggregate()
    }, CONFIG.aggregateInterval)

    // Save to disk periodically
    this.saveIntervalId = setInterval(() => {
      this.saveToDisk()
    }, CONFIG.saveInterval)

    // Initial aggregation
    this.aggregate()

    console.log('[MetricsCollector] Started')
  }

  /**
   * Stop collecting metrics
   */
  stop() {
    if (!this.isRunning) return

    this.isRunning = false
    performanceMonitor.stop()

    if (this.aggregateIntervalId) {
      clearInterval(this.aggregateIntervalId)
      this.aggregateIntervalId = null
    }

    if (this.saveIntervalId) {
      clearInterval(this.saveIntervalId)
      this.saveIntervalId = null
    }

    // Final save
    this.saveToDisk()

    console.log('[MetricsCollector] Stopped')
  }

  /**
   * Collect system metrics
   */
  collectSystemMetrics() {
    const cpus = os.cpus()
    const totalMemory = os.totalmem()
    const freeMemory = os.freemem()

    // Calculate CPU usage
    let totalIdle = 0
    let totalTick = 0

    for (const cpu of cpus) {
      for (const type in cpu.times) {
        totalTick += cpu.times[type]
      }
      totalIdle += cpu.times.idle
    }

    const cpuUsage = 100 - (100 * totalIdle / totalTick)

    return {
      timestamp: Date.now(),
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      uptime: os.uptime(),
      cpu: {
        count: cpus.length,
        model: cpus[0]?.model || 'Unknown',
        usage: Math.round(cpuUsage * 100) / 100
      },
      memory: {
        total: Math.round(totalMemory / 1024 / 1024),
        free: Math.round(freeMemory / 1024 / 1024),
        used: Math.round((totalMemory - freeMemory) / 1024 / 1024),
        usagePercent: Math.round((1 - freeMemory / totalMemory) * 10000) / 100
      },
      process: {
        pid: process.pid,
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
      }
    }
  }

  /**
   * Aggregate all metrics
   */
  aggregate() {
    const systemMetrics = this.collectSystemMetrics()
    const perfSummary = performanceMonitor.getSummary()

    this.aggregatedMetrics = {
      ...this.aggregatedMetrics,
      lastUpdated: Date.now(),
      system: systemMetrics,
      performance: perfSummary,
      client: this.processClientMetrics(),
      summary: this.calculateSummary(systemMetrics, perfSummary)
    }

    this.emit('aggregated', this.aggregatedMetrics)
    return this.aggregatedMetrics
  }

  /**
   * Process client-side metrics
   */
  processClientMetrics() {
    // Group by component
    const byComponent = {}

    for (const metric of this.clientMetrics) {
      const key = metric.component || 'unknown'
      if (!byComponent[key]) {
        byComponent[key] = {
          component: key,
          mounts: 0,
          renders: 0,
          avgRenderTime: 0,
          slowRenders: 0,
          errors: 0
        }
      }

      const comp = byComponent[key]

      if (metric.type === 'mount') {
        comp.mounts++
      } else if (metric.type === 'render') {
        comp.renders++
        comp.avgRenderTime = (comp.avgRenderTime * (comp.renders - 1) + metric.duration) / comp.renders
        if (metric.isSlow) comp.slowRenders++
      } else if (metric.type === 'error' || metric.type === 'fetchError') {
        comp.errors++
      }
    }

    return Object.values(byComponent)
      .sort((a, b) => b.renders - a.renders)
      .slice(0, 20) // Top 20 components
  }

  /**
   * Calculate overall summary
   */
  calculateSummary(system, perf) {
    const memoryHealth = system.process.heapUsed < 400 ? 'good' :
      system.process.heapUsed < 500 ? 'warning' : 'critical'

    const queryHealth = perf.queries.slowQueries === 0 ? 'good' :
      perf.queries.slowQueries < 5 ? 'warning' : 'critical'

    const errorHealth = perf.errors.total === 0 ? 'good' :
      perf.errors.total < 10 ? 'warning' : 'critical'

    // Overall health score (0-100)
    let healthScore = 100

    // Deduct for memory issues
    if (memoryHealth === 'warning') healthScore -= 10
    else if (memoryHealth === 'critical') healthScore -= 30

    // Deduct for slow queries
    if (queryHealth === 'warning') healthScore -= 10
    else if (queryHealth === 'critical') healthScore -= 20

    // Deduct for errors
    if (errorHealth === 'warning') healthScore -= 10
    else if (errorHealth === 'critical') healthScore -= 20

    // Deduct for slow renders
    if (perf.renders.slowRenders > 10) healthScore -= 10

    const overallHealth = healthScore >= 80 ? 'good' :
      healthScore >= 60 ? 'warning' : 'critical'

    return {
      timestamp: Date.now(),
      healthScore: Math.max(0, healthScore),
      overallHealth,
      components: {
        memory: memoryHealth,
        queries: queryHealth,
        errors: errorHealth
      },
      recommendations: this.getRecommendations(system, perf, healthScore)
    }
  }

  /**
   * Generate performance recommendations
   */
  getRecommendations(system, perf, healthScore) {
    const recs = []

    if (system.process.heapUsed > 400) {
      recs.push({
        type: 'memory',
        severity: system.process.heapUsed > 500 ? 'high' : 'medium',
        message: 'High memory usage detected. Consider restarting the application.',
        value: system.process.heapUsed
      })
    }

    if (perf.queries.slowQueries > 0) {
      recs.push({
        type: 'query',
        severity: perf.queries.slowQueries > 5 ? 'high' : 'medium',
        message: `${perf.queries.slowQueries} slow queries detected. Review database indexes.`,
        value: perf.queries.slowQueries
      })
    }

    if (perf.errors.total > 0) {
      recs.push({
        type: 'error',
        severity: perf.errors.total > 10 ? 'high' : 'medium',
        message: `${perf.errors.total} errors in the last 24 hours. Check error logs.`,
        value: perf.errors.total
      })
    }

    if (perf.bundleSize?.totalSizeMB > 5) {
      recs.push({
        type: 'bundle',
        severity: perf.bundleSize.totalSizeMB > 10 ? 'high' : 'medium',
        message: 'Large bundle size. Consider code splitting or removing unused dependencies.',
        value: perf.bundleSize.totalSizeMB
      })
    }

    return recs
  }

  /**
   * Add a client-side metric
   */
  addClientMetric(metric) {
    this.clientMetrics.push({
      ...metric,
      timestamp: Date.now()
    })

    // Keep only last 1000 metrics
    if (this.clientMetrics.length > 1000) {
      this.clientMetrics = this.clientMetrics.slice(-1000)
    }
  }

  /**
   * Add an alert
   */
  addAlert(alert) {
    this.aggregatedMetrics.alerts.push({
      ...alert,
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
    })

    // Keep only last 100 alerts
    if (this.aggregatedMetrics.alerts.length > 100) {
      this.aggregatedMetrics.alerts = this.aggregatedMetrics.alerts.slice(-100)
    }

    this.emit('alert', alert)
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return this.aggregatedMetrics
  }

  /**
   * Get metrics for dashboard display
   */
  getDashboardData() {
    const metrics = this.getMetrics()

    return {
      health: metrics.summary,
      memory: {
        current: metrics.system.process?.heapUsed || 0,
        max: metrics.system.process?.heapTotal || 0,
        history: performanceMonitor.getTimeSeriesData('memory', 6)
      },
      queries: {
        total: metrics.performance.queries?.total || 0,
        avgDuration: metrics.performance.queries?.avgDuration || 0,
        slowCount: metrics.performance.queries?.slowQueries || 0,
        history: performanceMonitor.getTimeSeriesData('queries', 6)
      },
      errors: {
        total: metrics.performance.errors?.total || 0,
        byType: metrics.performance.errors?.byType || {},
        history: performanceMonitor.getTimeSeriesData('errors', 6)
      },
      alerts: metrics.alerts.slice(-10),
      recommendations: metrics.summary.recommendations || [],
      topComponents: metrics.client.slice(0, 10)
    }
  }

  /**
   * Save metrics to disk
   */
  saveToDisk() {
    try {
      const logsDir = path.dirname(CONFIG.logPath)
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true })
      }

      // Save current metrics
      fs.writeFileSync(CONFIG.logPath, JSON.stringify(this.aggregatedMetrics, null, 2))

      // Save daily history
      this.saveHistoryFile()

    } catch (err) {
      console.error('[MetricsCollector] Failed to save:', err.message)
    }
  }

  /**
   * Save daily history file
   */
  saveHistoryFile() {
    const historyDir = CONFIG.historyPath
    if (!fs.existsSync(historyDir)) {
      fs.mkdirSync(historyDir, { recursive: true })
    }

    const date = new Date().toISOString().split('T')[0]
    const historyFile = path.join(historyDir, `perf-${date}.json`)

    // Append to today's history
    let history = []
    if (fs.existsSync(historyFile)) {
      try {
        history = JSON.parse(fs.readFileSync(historyFile, 'utf-8'))
      } catch {
        history = []
      }
    }

    history.push({
      timestamp: Date.now(),
      summary: this.aggregatedMetrics.summary,
      system: {
        heapUsed: this.aggregatedMetrics.system.process?.heapUsed,
        cpuUsage: this.aggregatedMetrics.system.cpu?.usage
      }
    })

    // Keep last 288 entries (every 5 minutes for 24 hours)
    if (history.length > 288) {
      history = history.slice(-288)
    }

    fs.writeFileSync(historyFile, JSON.stringify(history, null, 2))

    // Cleanup old history files
    this.cleanupHistoryFiles()
  }

  /**
   * Remove old history files
   */
  cleanupHistoryFiles() {
    const historyDir = CONFIG.historyPath
    if (!fs.existsSync(historyDir)) return

    const files = fs.readdirSync(historyDir)
      .filter(f => f.startsWith('perf-') && f.endsWith('.json'))
      .sort()
      .reverse()

    // Remove files beyond max limit
    for (let i = CONFIG.maxHistoryFiles; i < files.length; i++) {
      try {
        fs.unlinkSync(path.join(historyDir, files[i]))
        console.log('[MetricsCollector] Removed old history:', files[i])
      } catch (err) {
        console.error('[MetricsCollector] Failed to remove:', files[i], err.message)
      }
    }
  }

  /**
   * Load metrics from disk
   */
  loadFromDisk() {
    try {
      if (fs.existsSync(CONFIG.logPath)) {
        const data = JSON.parse(fs.readFileSync(CONFIG.logPath, 'utf-8'))
        this.aggregatedMetrics = {
          ...this.aggregatedMetrics,
          ...data
        }
        console.log('[MetricsCollector] Loaded metrics from disk')
      }
    } catch (err) {
      console.error('[MetricsCollector] Failed to load:', err.message)
    }
  }

  /**
   * Get historical data for a specific date
   */
  getHistoricalData(date) {
    const historyFile = path.join(CONFIG.historyPath, `perf-${date}.json`)

    if (!fs.existsSync(historyFile)) {
      return null
    }

    try {
      return JSON.parse(fs.readFileSync(historyFile, 'utf-8'))
    } catch {
      return null
    }
  }

  /**
   * Get available history dates
   */
  getAvailableDates() {
    const historyDir = CONFIG.historyPath
    if (!fs.existsSync(historyDir)) return []

    return fs.readdirSync(historyDir)
      .filter(f => f.startsWith('perf-') && f.endsWith('.json'))
      .map(f => f.replace('perf-', '').replace('.json', ''))
      .sort()
      .reverse()
  }

  /**
   * Clear all alerts
   */
  clearAlerts() {
    this.aggregatedMetrics.alerts = []
    this.emit('alertsCleared')
  }

  /**
   * Dismiss a specific alert
   */
  dismissAlert(alertId) {
    this.aggregatedMetrics.alerts = this.aggregatedMetrics.alerts.filter(a => a.id !== alertId)
  }
}

// Singleton instance
const metricsCollector = new MetricsCollector()

module.exports = metricsCollector
