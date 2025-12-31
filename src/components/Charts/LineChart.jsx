import { useState } from 'react'
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

// Default colors for lines
const LINE_COLORS = {
  approved: '#8FD9D9',
  submitted: '#8b5cf6',
  rejected: '#ef4444',
  pending: '#f59e0b',
  underReview: '#FF8566'
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="tooltip-date">{label}</p>
        <div className="tooltip-items">
          {payload.map((entry, index) => (
            <div key={index} className="tooltip-item">
              <span
                className="tooltip-dot"
                style={{ backgroundColor: entry.color }}
              />
              <span className="tooltip-label">{entry.name}:</span>
              <span className="tooltip-value">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}

const LineChart = ({
  data = [],
  lines = ['approved', 'submitted', 'rejected'],
  colors = LINE_COLORS,
  height = 300,
  showGrid = true,
  showLegend = true,
  animationDuration = 1000
}) => {
  const [activeLines, setActiveLines] = useState(lines)

  const toggleLine = (dataKey) => {
    setActiveLines(prev =>
      prev.includes(dataKey)
        ? prev.filter(l => l !== dataKey)
        : [...prev, dataKey]
    )
  }

  // Format date for X-axis
  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
  }

  if (!data || data.length === 0) {
    return (
      <div className="chart-empty">
        <span className="empty-icon">📈</span>
        <p>No trend data available</p>
      </div>
    )
  }

  return (
    <div className="line-chart-wrapper">
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart
          data={data}
          margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
        >
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.1)"
              vertical={false}
            />
          )}
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            stroke="#6b7280"
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            axisLine={{ stroke: '#374151' }}
          />
          <YAxis
            stroke="#6b7280"
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            axisLine={{ stroke: '#374151' }}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && (
            <Legend
              onClick={(e) => toggleLine(e.dataKey)}
              wrapperStyle={{ paddingTop: 20 }}
              formatter={(value, entry) => (
                <span style={{
                  color: activeLines.includes(entry.dataKey) ? entry.color : '#6b7280',
                  cursor: 'pointer',
                  textDecoration: activeLines.includes(entry.dataKey) ? 'none' : 'line-through'
                }}>
                  {value}
                </span>
              )}
            />
          )}
          {lines.map(lineKey => (
            <Line
              key={lineKey}
              type="monotone"
              dataKey={lineKey}
              name={lineKey.charAt(0).toUpperCase() + lineKey.slice(1)}
              stroke={colors[lineKey] || '#8884d8'}
              strokeWidth={activeLines.includes(lineKey) ? 3 : 0}
              dot={{ fill: colors[lineKey], strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
              animationDuration={animationDuration}
              hide={!activeLines.includes(lineKey)}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default LineChart
