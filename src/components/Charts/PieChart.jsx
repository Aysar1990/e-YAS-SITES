import { useState } from 'react'
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Sector
} from 'recharts'

// Default status colors
const STATUS_COLORS = {
  'Approved': '#8FD9D9',
  'Submitted': '#8b5cf6',
  'Rejected': '#ef4444',
  'Pending': '#f59e0b',
  'Under Zain': '#FF8566',
  'Under ROM': '#06b6d4',
  'Under Nokia': '#6366f1',
  'Under Subcon': '#ec4899',
  'Need Access': '#f97316',
  'Not Surveyed': '#6b7280',
  'RFI': '#14b8a6'
}

// Active shape for hover effect
const renderActiveShape = (props) => {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent, value
  } = props

  return (
    <g>
      <text x={cx} y={cy - 10} textAnchor="middle" fill="#f3f4f6" fontSize={14} fontWeight={600}>
        {payload.name}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#9ca3af" fontSize={12}>
        {value} ({(percent * 100).toFixed(1)}%)
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 10}
        outerRadius={outerRadius + 14}
        fill={fill}
      />
    </g>
  )
}

// Custom tooltip
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0]
    return (
      <div className="chart-tooltip">
        <div className="tooltip-item">
          <span className="tooltip-dot" style={{ backgroundColor: data.payload.color }} />
          <span className="tooltip-label">{data.name}:</span>
          <span className="tooltip-value">{data.value}</span>
        </div>
        <div className="tooltip-percent">
          {((data.payload.value / data.payload.total) * 100).toFixed(1)}% of total
        </div>
      </div>
    )
  }
  return null
}

// Custom legend
const CustomLegend = ({ payload, onItemClick, activeIndex }) => {
  return (
    <div className="pie-legend">
      {payload.map((entry, index) => (
        <div
          key={entry.value}
          className={`legend-item ${activeIndex === index ? 'active' : ''}`}
          onClick={() => onItemClick(index)}
        >
          <span
            className="legend-dot"
            style={{ backgroundColor: entry.color }}
          />
          <span className="legend-label">{entry.value}</span>
          <span className="legend-value">{entry.payload.value}</span>
        </div>
      ))}
    </div>
  )
}

const PieChart = ({
  data = [],
  colors = STATUS_COLORS,
  height = 350,
  innerRadius = 60,
  outerRadius = 100,
  showLegend = true,
  onSliceClick,
  animationDuration = 800
}) => {
  const [activeIndex, setActiveIndex] = useState(-1)

  // Calculate total and add to each item
  const total = data.reduce((sum, item) => sum + (item.value || 0), 0)
  const chartData = data.map(item => ({
    ...item,
    total,
    color: item.color || colors[item.name] || '#6b7280'
  }))

  const handleMouseEnter = (_, index) => {
    setActiveIndex(index)
  }

  const handleMouseLeave = () => {
    setActiveIndex(-1)
  }

  const handleClick = (data, index) => {
    if (onSliceClick) {
      onSliceClick(data, index)
    }
  }

  if (!data || data.length === 0) {
    return (
      <div className="chart-empty">
        <span className="empty-icon">🥧</span>
        <p>No distribution data available</p>
      </div>
    )
  }

  return (
    <div className="pie-chart-wrapper">
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart>
          <Pie
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey="value"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
            animationDuration={animationDuration}
            animationBegin={0}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                stroke="rgba(0,0,0,0.2)"
                strokeWidth={1}
                style={{ cursor: onSliceClick ? 'pointer' : 'default' }}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          {showLegend && (
            <Legend
              content={
                <CustomLegend
                  onItemClick={setActiveIndex}
                  activeIndex={activeIndex}
                />
              }
              layout="vertical"
              align="right"
              verticalAlign="middle"
            />
          )}
        </RechartsPieChart>
      </ResponsiveContainer>

      {/* Center label */}
      <div className="pie-center-label">
        <span className="center-value">{total}</span>
        <span className="center-text">Total</span>
      </div>
    </div>
  )
}

export default PieChart
