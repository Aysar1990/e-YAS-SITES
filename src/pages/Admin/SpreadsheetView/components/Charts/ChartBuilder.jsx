/**
 * ChartBuilder - Renders different chart types using recharts
 * Phase 7: Visualization
 */

import React from 'react'
import {
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis,
  CartesianGrid,
  Tooltip, Legend,
  ResponsiveContainer
} from 'recharts'

// YAS Brand Colors
const COLORS = [
  '#8FD9D9', // Primary Turquoise
  '#FF8566', // Secondary Orange
  '#6B8E8E', // Dark Turquoise
  '#FFB399', // Light Orange
  '#4ECDC4', // Teal
  '#FF6B6B', // Coral
  '#95E1D3', // Mint
  '#F38181', // Salmon
  '#AA96DA', // Lavender
  '#FCBAD3', // Pink
]

// Custom tooltip component
const CustomTooltip = ({ active, payload, label, aggregation }) => {
  if (!active || !payload?.length) return null

  const data = payload[0]
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{data.payload?.fullName || label}</p>
      <p className="tooltip-value">
        {aggregation === 'percentage' ? `${data.value}%` : data.value}
        {aggregation === 'count' && data.payload?.percentage && (
          <span className="tooltip-percent"> ({data.payload.percentage}%)</span>
        )}
      </p>
    </div>
  )
}

// Custom label for pie chart
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
  if (percent < 0.05) return null // Hide labels for small slices

  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={12}
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

const ChartBuilder = ({ type, data, aggregation, fieldLabel }) => {
  if (!data || data.length === 0) {
    return <div className="no-chart-data">لا توجد بيانات</div>
  }

  // Common props
  const commonProps = {
    data,
    margin: { top: 20, right: 30, left: 20, bottom: 60 }
  }

  // Render Bar Chart
  if (type === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="name"
            tick={{ fill: '#9CA3AF', fontSize: 11 }}
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
          />
          <YAxis
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            label={{
              value: aggregation === 'percentage' ? 'النسبة %' : 'العدد',
              angle: -90,
              position: 'insideLeft',
              fill: '#9CA3AF',
              fontSize: 12
            }}
          />
          <Tooltip content={<CustomTooltip aggregation={aggregation} />} />
          <Legend
            formatter={() => fieldLabel}
            wrapperStyle={{ paddingTop: 20 }}
          />
          <Bar
            dataKey="value"
            fill="#8FD9D9"
            radius={[4, 4, 0, 0]}
            maxBarSize={60}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    )
  }

  // Render Line Chart
  if (type === 'line') {
    return (
      <ResponsiveContainer width="100%" height={400}>
        <LineChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="name"
            tick={{ fill: '#9CA3AF', fontSize: 11 }}
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
          />
          <YAxis
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            label={{
              value: aggregation === 'percentage' ? 'النسبة %' : 'العدد',
              angle: -90,
              position: 'insideLeft',
              fill: '#9CA3AF',
              fontSize: 12
            }}
          />
          <Tooltip content={<CustomTooltip aggregation={aggregation} />} />
          <Legend
            formatter={() => fieldLabel}
            wrapperStyle={{ paddingTop: 20 }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#8FD9D9"
            strokeWidth={3}
            dot={{ fill: '#FF8566', strokeWidth: 2, r: 6 }}
            activeDot={{ r: 8, fill: '#FF8566' }}
          />
        </LineChart>
      </ResponsiveContainer>
    )
  }

  // Render Pie Chart
  if (type === 'pie') {
    return (
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={150}
            innerRadius={60}
            fill="#8884d8"
            dataKey="value"
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip aggregation={aggregation} />} />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            formatter={(value, entry) => (
              <span style={{ color: '#E5E7EB', fontSize: 12 }}>
                {entry.payload?.name} ({entry.payload?.value})
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    )
  }

  return <div className="unsupported-chart">نوع مخطط غير مدعوم</div>
}

export default ChartBuilder
