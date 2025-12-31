/**
 * Performance IPC Handlers
 * Handles performance monitoring and metrics collection
 */

const { ipcMain } = require('electron')
const metricsCollector = require('../utils/metricsCollector')
const performanceMonitor = require('../services/performanceMonitor')

/**
 * Register performance-related IPC handlers
 */
function registerPerformanceHandlers() {
  /**
   * Get performance metrics for dashboard
   */
  ipcMain.handle('performance:getMetrics', async () => {
    try {
      return metricsCollector.getDashboardData()
    } catch (error) {
      console.error('[PerformanceIPC] Failed to get metrics:', error)
      return null
    }
  })

  /**
   * Get full performance summary
   */
  ipcMain.handle('performance:getSummary', async () => {
    try {
      return performanceMonitor.getSummary()
    } catch (error) {
      console.error('[PerformanceIPC] Failed to get summary:', error)
      return null
    }
  })

  /**
   * Get time series data for charts
   */
  ipcMain.handle('performance:getTimeSeries', async (event, { type, hours }) => {
    try {
      return performanceMonitor.getTimeSeriesData(type, hours || 24)
    } catch (error) {
      console.error('[PerformanceIPC] Failed to get time series:', error)
      return []
    }
  })

  /**
   * Report client-side performance metric
   */
  ipcMain.handle('performance:report', async (event, { type, data }) => {
    try {
      metricsCollector.addClientMetric({ type, ...data })
      return { success: true }
    } catch (error) {
      console.error('[PerformanceIPC] Failed to report metric:', error)
      return { success: false, error: error.message }
    }
  })

  /**
   * Dismiss an alert
   */
  ipcMain.handle('performance:dismissAlert', async (event, alertId) => {
    try {
      metricsCollector.dismissAlert(alertId)
      return { success: true }
    } catch (error) {
      console.error('[PerformanceIPC] Failed to dismiss alert:', error)
      return { success: false, error: error.message }
    }
  })

  /**
   * Clear all alerts
   */
  ipcMain.handle('performance:clearAlerts', async () => {
    try {
      metricsCollector.clearAlerts()
      return { success: true }
    } catch (error) {
      console.error('[PerformanceIPC] Failed to clear alerts:', error)
      return { success: false, error: error.message }
    }
  })

  /**
   * Get historical data for a specific date
   */
  ipcMain.handle('performance:getHistory', async (event, date) => {
    try {
      return metricsCollector.getHistoricalData(date)
    } catch (error) {
      console.error('[PerformanceIPC] Failed to get history:', error)
      return null
    }
  })

  /**
   * Get available history dates
   */
  ipcMain.handle('performance:getAvailableDates', async () => {
    try {
      return metricsCollector.getAvailableDates()
    } catch (error) {
      console.error('[PerformanceIPC] Failed to get dates:', error)
      return []
    }
  })

  /**
   * Export metrics to file
   */
  ipcMain.handle('performance:export', async () => {
    try {
      const filepath = metricsCollector.exportMetrics()
      return { success: true, filepath }
    } catch (error) {
      console.error('[PerformanceIPC] Failed to export:', error)
      return { success: false, error: error.message }
    }
  })

  /**
   * Get performance thresholds
   */
  ipcMain.handle('performance:getThresholds', async () => {
    try {
      return performanceMonitor.getThresholds()
    } catch (error) {
      console.error('[PerformanceIPC] Failed to get thresholds:', error)
      return null
    }
  })

  /**
   * Update a performance threshold
   */
  ipcMain.handle('performance:setThreshold', async (event, { key, value }) => {
    try {
      performanceMonitor.setThreshold(key, value)
      return { success: true }
    } catch (error) {
      console.error('[PerformanceIPC] Failed to set threshold:', error)
      return { success: false, error: error.message }
    }
  })

  /**
   * Analyze bundle size
   */
  ipcMain.handle('performance:analyzeBundleSize', async () => {
    try {
      return performanceMonitor.analyzeBundleSize()
    } catch (error) {
      console.error('[PerformanceIPC] Failed to analyze bundle:', error)
      return { error: error.message }
    }
  })

  console.log('[PerformanceIPC] Handlers registered')
}

/**
 * Start performance monitoring
 */
function startPerformanceMonitoring() {
  metricsCollector.start()
  console.log('[PerformanceIPC] Monitoring started')
}

/**
 * Stop performance monitoring
 */
function stopPerformanceMonitoring() {
  metricsCollector.stop()
  console.log('[PerformanceIPC] Monitoring stopped')
}

module.exports = {
  registerPerformanceHandlers,
  startPerformanceMonitoring,
  stopPerformanceMonitoring
}
