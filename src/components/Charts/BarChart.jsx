import { useState } from 'react'
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts'

// Default bar colors
const BAR_COLORS = {
  total: '#FF8566',
  approved: '#8FD9D9',
  pending: '#f59e0b',
  rejected: '#ef4444',
  submitted: '#8b5cf6'
}

// Custom tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="tooltip-title">{label}</p>
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

// Custom bar label
const CustomBarLabel = ({ x, y, width, value }) => {
  if (value === 0) return null
  return (
    <text
      x={x + width / 2}
      y={y - 5}
      fill="#9ca3af"
      textAnchor="middle"
      fontSize={11}
      fontWeight={600}
    >
      {value}
    </text>
  )
}

const BarChart = ({
  data = [],
  bars = ['total', 'approved', 'pending'],
  colors = BAR_COLORS,
  height = 300,
  layout = 'vertical', // 'vertical' or 'horizontal'
  showGrid = true,
  showLegend = true,
  showLabels = true,
  sortBy = null, // null, 'total', 'approved', etc.
  sortOrder = 'desc', // 'asc' or 'desc'
  barSize = 20,
  animationDuration = 1000,
  onBarClick
}) => {
  const [hoveredBar, setHoveredBar] = useState(null)

  // Sort data if needed
  let chartData = [...data]
  if (sortBy && chartData.length > 0) {
    chartData.sort((a, b) => {
      const aVal = a[sortBy] || 0
      const bVal = b[sortBy] || 0
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal
    })
  }

  const isHorizontal = layout === 'horizontal'

  if (!data || data.length === 0) {
    return (
      <div className="chart-empty">
        <span className="empty-icon">📊</span>
        <p>No comparison data available</p>
      </div>
    )
  }

  return (
    <div className="bar-chart-wrapper">
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart
          data={chartData}
          layout={isHorizontal ? 'vertical' : 'horizontal'}
          margin={{
            top: 20,
            right: 30,
            left: isHorizontal ? 100 : 0,
            bottom: isHorizontal ? 5 : 60
          }}
          barCategoryGap="20%"
        >
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.1)"
              horizontal={!isHorizontal}
              vertical={isHorizontal}
            />
          )}

          {isHorizontal ? (
            <>
              <XAxis
                type="number"
                stroke="#6b7280"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                axisLine={{ stroke: '#374151' }}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#6b7280"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                axisLine={{ stroke: '#374151' }}
                width={90}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey="name"
                stroke="#6b7280"
                tick={{ fill: '#9ca3af', fontSize: 10, angle: -45, textAnchor: 'end' }}
                axisLine={{ stroke: '#374151' }}
                height={60}
                interval={0}
              />
              <YAxis
                stroke="#6b7280"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                axisLine={{ stroke: '#374151' }}
                width={40}
              />
            </>
          )}

          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />

          {showLegend && (
            <Legend
              wrapperStyle={{ paddingTop: 10 }}
              formatter={(value) => (
                <span style={{ color: '#9ca3af', fontSize: 12 }}>{value}</span>
              )}
            />
          )}

          {bars.map((barKey, idx) => (
            <Bar
              key={barKey}
              dataKey={barKey}
              name={barKey.charAt(0).toUpperCase() + barKey.slice(1)}
              fill={colors[barKey] || '#8884d8'}
              barSize={barSize}
              radius={[4, 4, 0, 0]}
              animationDuration={animationDuration}
              onMouseEnter={() => setHoveredBar(barKey)}
              onMouseLeave={() => setHoveredBar(null)}
              onClick={(data) => onBarClick && onBarClick(data, barKey)}
              label={showLabels && idx === 0 ? <CustomBarLabel /> : false}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[barKey]}
                  fillOpacity={hoveredBar === null || hoveredBar === barKey ? 1 : 0.4}
                  style={{
                    cursor: onBarClick ? 'pointer' : 'default',
                    transition: 'fill-opacity 0.2s ease'
                  }}
                />
              ))}
            </Bar>
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default BarChart
