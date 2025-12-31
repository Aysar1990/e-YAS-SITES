/**
 * Performance Tab Component
 * Displays performance metrics, charts, and alerts
 */

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'

// Performance thresholds
const THRESHOLDS = {
  slowQuery: 500,
  highMemory: 500,
  largeBundleSize: 5
}

// Health status colors
const HEALTH_COLORS = {
  good: '#22c55e',
  warning: '#eab308',
  critical: '#ef4444'
}

/**
 * Health Badge Component
 */
function HealthBadge({ status, label }) {
  const color = HEALTH_COLORS[status] || HEALTH_COLORS.warning

  return (
    <div
      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
      style={{ backgroundColor: `${color}20`, color }}
    >
      <span
        className="w-2 h-2 rounded-full mr-2"
        style={{ backgroundColor: color }}
      />
      {label}
    </div>
  )
}

/**
 * Metric Card Component
 */
function MetricCard({ title, value, unit, icon, trend, status }) {
  const trendColor = trend > 0 ? '#ef4444' : trend < 0 ? '#22c55e' : '#6b7280'
  const trendIcon = trend > 0 ? '↑' : trend < 0 ? '↓' : '→'

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400 text-sm">{title}</span>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-white">{value}</span>
        <span className="text-gray-400 text-sm mb-1">{unit}</span>
      </div>
      {trend !== undefined && (
        <div className="mt-2 flex items-center gap-1" style={{ color: trendColor }}>
          <span>{trendIcon}</span>
          <span className="text-xs">{Math.abs(trend)}% from last hour</span>
        </div>
      )}
      {status && (
        <div className="mt-2">
          <HealthBadge status={status} label={status} />
        </div>
      )}
    </div>
  )
}

/**
 * Alert Item Component
 */
function AlertItem({ alert, onDismiss }) {
  const severityColors = {
    slowQuery: '#eab308',
    highMemory: '#ef4444',
    largeBundleSize: '#f97316'
  }

  const alertIcons = {
    slowQuery: '🐌',
    highMemory: '💾',
    largeBundleSize: '📦'
  }

  const color = severityColors[alert.type] || '#6b7280'

  return (
    <div
      className="flex items-center justify-between p-3 rounded-lg border"
      style={{ borderColor: color, backgroundColor: `${color}10` }}
    >
      <div className="flex items-center gap-3">
        <span className="text-xl">{alertIcons[alert.type] || '⚠️'}</span>
        <div>
          <p className="text-white text-sm font-medium">{alert.type}</p>
          <p className="text-gray-400 text-xs">
            {alert.data?.duration && `Duration: ${alert.data.duration}ms`}
            {alert.data?.heapUsed && `Memory: ${alert.data.heapUsed}MB`}
            {alert.data?.size && `Size: ${alert.data.size.toFixed(1)}MB`}
          </p>
        </div>
      </div>
      <button
        onClick={() => onDismiss(alert.id)}
        className="text-gray-400 hover:text-white p-1"
      >
        ✕
      </button>
    </div>
  )
}

/**
 * Recommendation Card
 */
function RecommendationCard({ rec }) {
  const severityColors = {
    high: '#ef4444',
    medium: '#eab308',
    low: '#22c55e'
  }

  const color = severityColors[rec.severity] || '#6b7280'

  return (
    <div className="bg-gray-800 rounded-lg p-4 border-l-4" style={{ borderColor: color }}>
      <div className="flex items-start gap-3">
        <span className="text-xl">
          {rec.type === 'memory' && '💾'}
          {rec.type === 'query' && '🔍'}
          {rec.type === 'error' && '❌'}
          {rec.type === 'bundle' && '📦'}
        </span>
        <div>
          <p className="text-white text-sm">{rec.message}</p>
          <p className="text-gray-400 text-xs mt-1">
            Severity: {rec.severity} | Value: {rec.value}
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * Main Performance Tab Component
 */
export default function PerformanceTab() {
  const { t } = useTranslation()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  // Fetch performance data
  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true)

      // Try to get from electron API
      if (window.electronAPI?.getPerformanceMetrics) {
        const metrics = await window.electronAPI.getPerformanceMetrics()
        setData(metrics)
      } else {
        // Mock data for development
        setData(generateMockData())
      }

      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Initial fetch and periodic refresh
  useEffect(() => {
    fetchData()

    const interval = setInterval(fetchData, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [fetchData])

  // Dismiss alert handler
  const handleDismissAlert = useCallback(async (alertId) => {
    if (window.electronAPI?.dismissAlert) {
      await window.electronAPI.dismissAlert(alertId)
    }
    setData(prev => ({
      ...prev,
      alerts: prev.alerts.filter(a => a.id !== alertId)
    }))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-500 border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 text-red-400">
        <p>Failed to load performance data: {error}</p>
        <button
          onClick={fetchData}
          className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Performance Monitor</h2>
          <p className="text-gray-400 text-sm">Real-time application metrics</p>
        </div>
        <div className="flex items-center gap-4">
          <HealthBadge
            status={data.health?.overallHealth || 'good'}
            label={`Score: ${data.health?.healthScore || 100}`}
          />
          <button
            onClick={fetchData}
            disabled={refreshing}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Memory Usage"
          value={data.memory?.current || 0}
          unit="MB"
          icon="💾"
          status={data.health?.components?.memory}
          trend={calculateTrend(data.memory?.history)}
        />
        <MetricCard
          title="Avg Query Time"
          value={data.queries?.avgDuration || 0}
          unit="ms"
          icon="🔍"
          status={data.health?.components?.queries}
        />
        <MetricCard
          title="Total Queries (24h)"
          value={data.queries?.total || 0}
          unit=""
          icon="📊"
        />
        <MetricCard
          title="Errors (24h)"
          value={data.errors?.total || 0}
          unit=""
          icon="❌"
          status={data.health?.components?.errors}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Memory Chart */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-white font-medium mb-4">Memory Usage (Last 6 Hours)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={formatChartData(data.memory?.history)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} unit=" MB" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Area
                  type="monotone"
                  dataKey="heapUsed"
                  stroke="#14b8a6"
                  fill="#14b8a620"
                  name="Heap Used"
                />
                <Line
                  type="monotone"
                  dataKey="threshold"
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                  dot={false}
                  name="Threshold"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Query Performance Chart */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-white font-medium mb-4">Query Performance</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formatQueryData(data.queries?.history)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} unit=" ms" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Bar dataKey="duration" fill="#8b5cf6" name="Duration" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Alerts and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Alerts */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-white font-medium mb-4">
            Active Alerts ({data.alerts?.length || 0})
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {data.alerts?.length > 0 ? (
              data.alerts.map((alert, i) => (
                <AlertItem
                  key={alert.id || i}
                  alert={alert}
                  onDismiss={handleDismissAlert}
                />
              ))
            ) : (
              <p className="text-gray-400 text-center py-4">No active alerts</p>
            )}
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-white font-medium mb-4">Recommendations</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {data.recommendations?.length > 0 ? (
              data.recommendations.map((rec, i) => (
                <RecommendationCard key={i} rec={rec} />
              ))
            ) : (
              <p className="text-gray-400 text-center py-4">
                All systems running optimally
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Top Components */}
      {data.topComponents?.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-white font-medium mb-4">Top Components by Render Count</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="text-left py-2 px-3">Component</th>
                  <th className="text-right py-2 px-3">Renders</th>
                  <th className="text-right py-2 px-3">Avg Time</th>
                  <th className="text-right py-2 px-3">Slow Renders</th>
                  <th className="text-right py-2 px-3">Errors</th>
                </tr>
              </thead>
              <tbody>
                {data.topComponents.map((comp, i) => (
                  <tr key={i} className="border-b border-gray-700/50 text-white">
                    <td className="py-2 px-3">{comp.component}</td>
                    <td className="text-right py-2 px-3">{comp.renders}</td>
                    <td className="text-right py-2 px-3">
                      {comp.avgRenderTime.toFixed(1)}ms
                    </td>
                    <td className="text-right py-2 px-3">
                      <span className={comp.slowRenders > 0 ? 'text-yellow-400' : ''}>
                        {comp.slowRenders}
                      </span>
                    </td>
                    <td className="text-right py-2 px-3">
                      <span className={comp.errors > 0 ? 'text-red-400' : ''}>
                        {comp.errors}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Thresholds Info */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <h4 className="text-gray-400 text-sm font-medium mb-2">Alert Thresholds</h4>
        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
          <span>Slow Query: {'>'}500ms</span>
          <span>High Memory: {'>'}{THRESHOLDS.highMemory}MB</span>
          <span>Large Bundle: {'>'}{THRESHOLDS.largeBundleSize}MB</span>
        </div>
      </div>
    </div>
  )
}

// Helper functions
function formatChartData(history) {
  if (!history || !Array.isArray(history)) {
    return generateMockMemoryData()
  }

  return history.map(m => ({
    time: new Date(m.timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }),
    heapUsed: m.heapUsed,
    threshold: THRESHOLDS.highMemory
  }))
}

function formatQueryData(history) {
  if (!history || !Array.isArray(history)) {
    return generateMockQueryData()
  }

  return history.slice(-20).map(q => ({
    time: new Date(q.timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }),
    duration: q.duration
  }))
}

function calculateTrend(history) {
  if (!history || history.length < 2) return 0

  const recent = history.slice(-5)
  const older = history.slice(-10, -5)

  if (recent.length === 0 || older.length === 0) return 0

  const recentAvg = recent.reduce((sum, h) => sum + (h.heapUsed || 0), 0) / recent.length
  const olderAvg = older.reduce((sum, h) => sum + (h.heapUsed || 0), 0) / older.length

  if (olderAvg === 0) return 0
  return Math.round(((recentAvg - olderAvg) / olderAvg) * 100)
}

function generateMockData() {
  return {
    health: {
      healthScore: 85,
      overallHealth: 'good',
      components: {
        memory: 'good',
        queries: 'good',
        errors: 'good'
      }
    },
    memory: {
      current: 245,
      max: 512,
      history: generateMockMemoryData()
    },
    queries: {
      total: 1234,
      avgDuration: 45,
      slowCount: 3,
      history: generateMockQueryData()
    },
    errors: {
      total: 2,
      byType: { 'TypeError': 1, 'NetworkError': 1 }
    },
    alerts: [],
    recommendations: [],
    topComponents: [
      { component: 'SitesTable', renders: 156, avgRenderTime: 12.5, slowRenders: 2, errors: 0 },
      { component: 'SpreadsheetView', renders: 89, avgRenderTime: 45.2, slowRenders: 5, errors: 0 },
      { component: 'Dashboard', renders: 67, avgRenderTime: 8.3, slowRenders: 0, errors: 0 }
    ]
  }
}

function generateMockMemoryData() {
  const data = []
  const now = Date.now()

  for (let i = 36; i >= 0; i--) {
    data.push({
      timestamp: now - i * 10 * 60 * 1000,
      time: new Date(now - i * 10 * 60 * 1000).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      heapUsed: 200 + Math.random() * 100,
      threshold: THRESHOLDS.highMemory
    })
  }

  return data
}

function generateMockQueryData() {
  const data = []
  const now = Date.now()

  for (let i = 20; i >= 0; i--) {
    data.push({
      timestamp: now - i * 5 * 60 * 1000,
      time: new Date(now - i * 5 * 60 * 1000).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      duration: 20 + Math.random() * 80
    })
  }

  return data
}
