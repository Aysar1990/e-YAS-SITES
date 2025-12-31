/**
 * ChartPanel - Modal panel for creating and viewing charts
 * Phase 7: Visualization
 */

import React, { useState, useMemo } from 'react'
import ChartBuilder from './ChartBuilder'
import './ChartPanel.css'

// Available fields for charting
const CHART_FIELDS = [
  { value: 'governorate', label: 'المحافظة' },
  { value: 'contractor', label: 'المقاول' },
  { value: 'tssr_status', label: 'حالة TSSR' },
  { value: 'dept_status', label: 'حالة القسم' },
  { value: 'part_of', label: 'جزء من' },
  { value: 'priority', label: 'الأولوية' },
  { value: 'region', label: 'المنطقة' },
  { value: 'sitetype', label: 'نوع الموقع' }
]

// Chart types
const CHART_TYPES = [
  { value: 'bar', label: 'أعمدة', icon: '📊' },
  { value: 'line', label: 'خطي', icon: '📈' },
  { value: 'pie', label: 'دائري', icon: '🥧' }
]

// Aggregation methods
const AGGREGATIONS = [
  { value: 'count', label: 'العدد' },
  { value: 'percentage', label: 'النسبة المئوية' }
]

const ChartPanel = ({ data = [], onClose }) => {
  const [chartType, setChartType] = useState('bar')
  const [selectedField, setSelectedField] = useState('governorate')
  const [aggregation, setAggregation] = useState('count')
  const [showTop, setShowTop] = useState(10)

  // Aggregate data based on selected field
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []

    // Count occurrences of each value
    const counts = {}
    data.forEach(row => {
      const value = row[selectedField] || 'غير محدد'
      counts[value] = (counts[value] || 0) + 1
    })

    // Convert to array and sort by count
    let result = Object.entries(counts)
      .map(([name, value]) => ({
        name: name.length > 20 ? name.substring(0, 20) + '...' : name,
        fullName: name,
        value,
        percentage: ((value / data.length) * 100).toFixed(1)
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, showTop)

    // If percentage aggregation, use percentage as value
    if (aggregation === 'percentage') {
      result = result.map(item => ({
        ...item,
        value: parseFloat(item.percentage)
      }))
    }

    return result
  }, [data, selectedField, aggregation, showTop])

  // Calculate totals
  const totals = useMemo(() => {
    if (!chartData.length) return { total: 0, displayed: 0 }
    const displayedCount = chartData.reduce((sum, item) =>
      sum + (aggregation === 'count' ? item.value : (item.value * data.length / 100)), 0
    )
    return {
      total: data.length,
      displayed: Math.round(displayedCount),
      categories: chartData.length
    }
  }, [chartData, data.length, aggregation])

  return (
    <div className="chart-panel-overlay" onClick={onClose}>
      <div className="chart-panel" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="chart-panel-header">
          <h2>📊 إنشاء مخطط</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Config Section */}
        <div className="chart-config">
          {/* Chart Type */}
          <div className="config-group">
            <label>نوع المخطط</label>
            <div className="chart-type-buttons">
              {CHART_TYPES.map(type => (
                <button
                  key={type.value}
                  className={`type-btn ${chartType === type.value ? 'active' : ''}`}
                  onClick={() => setChartType(type.value)}
                >
                  <span className="icon">{type.icon}</span>
                  <span>{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Field Selector */}
          <div className="config-group">
            <label>حقل البيانات</label>
            <select
              value={selectedField}
              onChange={e => setSelectedField(e.target.value)}
              className="field-select"
            >
              {CHART_FIELDS.map(field => (
                <option key={field.value} value={field.value}>
                  {field.label}
                </option>
              ))}
            </select>
          </div>

          {/* Aggregation */}
          <div className="config-group">
            <label>طريقة التجميع</label>
            <select
              value={aggregation}
              onChange={e => setAggregation(e.target.value)}
              className="field-select"
            >
              {AGGREGATIONS.map(agg => (
                <option key={agg.value} value={agg.value}>
                  {agg.label}
                </option>
              ))}
            </select>
          </div>

          {/* Top N */}
          <div className="config-group">
            <label>عرض أعلى</label>
            <select
              value={showTop}
              onChange={e => setShowTop(parseInt(e.target.value))}
              className="field-select small"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="chart-stats">
          <div className="stat-item">
            <span className="stat-value">{totals.total}</span>
            <span className="stat-label">إجمالي السجلات</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{totals.categories}</span>
            <span className="stat-label">الفئات المعروضة</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{totals.displayed}</span>
            <span className="stat-label">السجلات في المخطط</span>
          </div>
        </div>

        {/* Chart Container */}
        <div className="chart-container">
          {chartData.length > 0 ? (
            <ChartBuilder
              type={chartType}
              data={chartData}
              aggregation={aggregation}
              fieldLabel={CHART_FIELDS.find(f => f.value === selectedField)?.label || selectedField}
            />
          ) : (
            <div className="no-data">
              <span className="no-data-icon">📉</span>
              <p>لا توجد بيانات للعرض</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChartPanel
