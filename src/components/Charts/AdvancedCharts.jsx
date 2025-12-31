import { useState, useRef, useCallback } from 'react'
import LineChart from './LineChart'
import PieChart from './PieChart'
import BarChart from './BarChart'
import './AdvancedCharts.css'

// Tab configuration
const TABS = [
  { id: 'trend', label: 'Trend', icon: '📈' },
  { id: 'distribution', label: 'Distribution', icon: '🥧' },
  { id: 'comparison', label: 'Comparison', icon: '📊' }
]

// Date range options
const DATE_RANGES = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '14d', label: 'Last 14 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: 'all', label: 'All Time' }
]

const AdvancedCharts = ({
  trendData = [],
  distributionData = [],
  comparisonData = [],
  onDateRangeChange,
  onSliceClick,
  onBarClick,
  title = 'Analytics',
  defaultTab = 'trend'
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [dateRange, setDateRange] = useState('30d')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const chartRef = useRef(null)

  // Handle date range change
  const handleDateRangeChange = (range) => {
    setDateRange(range)
    if (onDateRangeChange) {
      onDateRangeChange(range)
    }
  }

  // Export chart as image
  const exportChart = useCallback(async () => {
    if (!chartRef.current) return

    setIsExporting(true)
    try {
      // Use html2canvas if available, otherwise fallback
      if (window.html2canvas) {
        const canvas = await window.html2canvas(chartRef.current, {
          backgroundColor: '#1f2937',
          scale: 2
        })
        const link = document.createElement('a')
        link.download = `chart-${activeTab}-${new Date().toISOString().split('T')[0]}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
      } else {
        // Fallback: copy SVG
        const svg = chartRef.current.querySelector('svg')
        if (svg) {
          const svgData = new XMLSerializer().serializeToString(svg)
          const blob = new Blob([svgData], { type: 'image/svg+xml' })
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.download = `chart-${activeTab}-${new Date().toISOString().split('T')[0]}.svg`
          link.href = url
          link.click()
          URL.revokeObjectURL(url)
        }
      }
    } catch (error) {
      console.error('Export failed:', error)
    }
    setIsExporting(false)
  }, [activeTab])

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      chartRef.current?.requestFullscreen?.()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen?.()
      setIsFullscreen(false)
    }
  }

  // Render active chart
  const renderChart = () => {
    switch (activeTab) {
      case 'trend':
        return (
          <LineChart
            data={trendData}
            lines={['approved', 'submitted', 'rejected', 'pending']}
            height={350}
          />
        )
      case 'distribution':
        return (
          <PieChart
            data={distributionData}
            height={380}
            onSliceClick={onSliceClick}
          />
        )
      case 'comparison':
        return (
          <BarChart
            data={comparisonData}
            bars={['total', 'approved', 'pending']}
            height={350}
            layout="vertical"
            sortBy="total"
            onBarClick={onBarClick}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className={`advanced-charts ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* Header */}
      <div className="charts-header">
        <div className="header-left">
          <h3 className="charts-title">
            <span className="title-icon">📊</span>
            {title}
          </h3>
        </div>

        <div className="header-right">
          {/* Date Range Selector */}
          <select
            className="date-range-select"
            value={dateRange}
            onChange={(e) => handleDateRangeChange(e.target.value)}
          >
            {DATE_RANGES.map(range => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>

          {/* Export Button */}
          <button
            className="chart-action-btn"
            onClick={exportChart}
            disabled={isExporting}
            title="Export as Image"
          >
            {isExporting ? '⏳' : '📥'}
          </button>

          {/* Fullscreen Button */}
          <button
            className="chart-action-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? '⛶' : '⛶'}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="charts-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`chart-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Chart Container */}
      <div className="chart-container" ref={chartRef}>
        {renderChart()}
      </div>

      {/* Chart Info */}
      <div className="chart-info">
        {activeTab === 'trend' && (
          <p>Showing TSSR status changes over the selected time period</p>
        )}
        {activeTab === 'distribution' && (
          <p>Click on a slice to filter the dashboard by that status</p>
        )}
        {activeTab === 'comparison' && (
          <p>Contractor performance comparison - sorted by total sites</p>
        )}
      </div>
    </div>
  )
}

export default AdvancedCharts
