/**
 * Reports Charts Component
 * Displays various analytics charts with YAS color palette
 */

import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts'
import { Card } from '../UI'
import './ReportsCharts.css'

const ReportsCharts = ({ stats }) => {
  // Debug logging
  console.log('🎨 CONTRACTOR CHART DATA:')
  stats.contractorData?.slice(0, 5).forEach((c, i) => {
    console.log(`  ${i + 1}. ${c.name}: ${c.value}`)
  })
  
  console.log('🎨 DEPARTMENT CHART DATA:')
  stats.departmentData?.forEach(d => {
    console.log(`  ${d.name}: A=${d.approved}, P=${d.pending}, R=${d.rejected}`)
  })

  // YAS Color Palette - High contrast colors for better distinction
  const CHART_COLORS = [
    '#8FD9D9',  // Turquoise (primary)
    '#FF8566',  // Orange (accent)
    '#60A5FA',  // Blue
    '#34D399',  // Green
    '#A78BFA',  // Purple
    '#F472B6',  // Pink
    '#FBBF24',  // Yellow
    '#FB923C',  // Deep Orange
    '#6B7280',  // Gray
    '#8FD9D9'   // Emerald
  ]

  // Department colors (distinct for stacked bars)
  const DEPT_COLORS = {
    approved: '#8FD9D9',   // Turquoise
    pending: '#FF8566',    // Orange
    rejected: '#DC2626'    // Red
  }

  // Tooltip styling
  const tooltipStyle = {
    background: '#374151',
    border: 'none',
    borderRadius: '8px',
    color: '#F9FAFB',
    padding: '8px 12px'
  }

  // Legend styling
  const legendStyle = {
    paddingTop: '15px',
    fontSize: '11px',
    color: '#9CA3AF'
  }

  return (
    <div className="charts-grid">
      {/* Status Distribution Pie Chart */}
      <Card className="chart-card">
        <h3 className="chart-title">Status Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={stats.statusData || []}
              cx="50%"
              cy="40%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
              label={false}
              labelLine={false}
              isAnimationActive={true}
            >
              {(stats.statusData || []).map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={CHART_COLORS[index % CHART_COLORS.length]} 
                  stroke="rgba(0,0,0,0.1)"
                  strokeWidth={1}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [value, name]}
              contentStyle={tooltipStyle}
            />
            <Legend
              layout="horizontal"
              align="center"
              verticalAlign="bottom"
              wrapperStyle={legendStyle}
              iconType="circle"
              iconSize={10}
            />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      {/* Sites by Contractor Bar Chart */}
      <Card className="chart-card">
        <h3 className="chart-title">Sites by Contractor (Top 10)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.contractorData || []} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              type="number" 
              stroke="#9CA3AF" 
              fontSize={11}
              tick={{ fill: '#9CA3AF' }}
            />
            <YAxis
              dataKey="name"
              type="category"
              width={120}
              stroke="#9CA3AF"
              fontSize={10}
              tick={{ fill: '#9CA3AF' }}
            />
            <Tooltip 
              contentStyle={tooltipStyle}
              cursor={{ fill: 'rgba(143, 217, 217, 0.1)' }}
            />
            <Bar 
              dataKey="value" 
              radius={[0, 8, 8, 0]}
              barSize={22}
            >
              {(stats.contractorData || []).map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={CHART_COLORS[index % CHART_COLORS.length]} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Department Status Comparison Grouped Bar */}
      <Card className="chart-card chart-card-wide">
        <h3 className="chart-title">Department Status Comparison</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart 
            data={stats.departmentData || []}
            margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="name" 
              stroke="#9CA3AF" 
              fontSize={11}
              tick={{ fill: '#9CA3AF' }}
            />
            <YAxis 
              stroke="#9CA3AF" 
              fontSize={11}
              tick={{ fill: '#9CA3AF' }}
            />
            <Tooltip 
              contentStyle={tooltipStyle}
              cursor={{ fill: 'rgba(143, 217, 217, 0.05)' }}
            />
            <Legend
              layout="horizontal"
              align="center"
              verticalAlign="bottom"
              wrapperStyle={legendStyle}
              iconType="rect"
            />
            <Bar 
              dataKey="approved" 
              fill={DEPT_COLORS.approved}
              name="Approved" 
              radius={[8, 8, 0, 0]}
              barSize={35}
            />
            <Bar 
              dataKey="pending" 
              fill={DEPT_COLORS.pending}
              name="Pending" 
              radius={[8, 8, 0, 0]}
              barSize={35}
            />
            <Bar 
              dataKey="rejected" 
              fill={DEPT_COLORS.rejected}
              name="Rejected" 
              radius={[8, 8, 0, 0]}
              barSize={35}
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}

export default ReportsCharts
