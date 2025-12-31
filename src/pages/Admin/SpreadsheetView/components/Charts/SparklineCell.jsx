/**
 * SparklineCell - Mini trend visualization for grid cells
 * Phase 7: Visualization
 *
 * Usage: Pass comma-separated values like "10,15,12,18,20"
 */

import React, { useMemo } from 'react'
import { Sparklines, SparklinesLine, SparklinesSpots } from 'react-sparklines'

// YAS Colors
const SPARKLINE_COLOR = '#8FD9D9'
const SPOT_COLOR = '#FF8566'

/**
 * Parse value string to array of numbers
 * Handles: "10,15,12" or "10 15 12" or "[10,15,12]"
 */
const parseValues = (value) => {
  if (!value) return null

  // If already array
  if (Array.isArray(value)) {
    return value.filter(v => typeof v === 'number' && !isNaN(v))
  }

  // If string
  if (typeof value === 'string') {
    // Remove brackets if present
    const cleaned = value.replace(/[\[\]]/g, '').trim()
    if (!cleaned) return null

    // Split by comma or space
    const parts = cleaned.split(/[,\s]+/)
    const numbers = parts
      .map(p => parseFloat(p.trim()))
      .filter(n => !isNaN(n))

    return numbers.length >= 2 ? numbers : null
  }

  return null
}

/**
 * Calculate trend direction
 */
const getTrend = (values) => {
  if (!values || values.length < 2) return 'neutral'
  const first = values[0]
  const last = values[values.length - 1]
  if (last > first * 1.05) return 'up'
  if (last < first * 0.95) return 'down'
  return 'neutral'
}

const SparklineCell = ({ value, width = 100, height = 30 }) => {
  const data = useMemo(() => parseValues(value), [value])

  // If no valid data, show placeholder
  if (!data) {
    return (
      <div className="sparkline-cell sparkline-empty">
        <span className="sparkline-placeholder">-</span>
      </div>
    )
  }

  const lastValue = data[data.length - 1]
  const trend = getTrend(data)

  return (
    <div className="sparkline-cell">
      <div className="sparkline-chart" style={{ width, height }}>
        <Sparklines data={data} width={width} height={height} margin={2}>
          <SparklinesLine
            color={SPARKLINE_COLOR}
            style={{ strokeWidth: 2, fill: 'none' }}
          />
          <SparklinesSpots
            size={3}
            style={{ fill: SPOT_COLOR }}
            spotColors={{ '-1': SPOT_COLOR, '0': SPARKLINE_COLOR, '1': SPOT_COLOR }}
          />
        </Sparklines>
      </div>
      <span className={`sparkline-value trend-${trend}`}>
        {lastValue}
        <span className="trend-icon">
          {trend === 'up' && '↑'}
          {trend === 'down' && '↓'}
          {trend === 'neutral' && '→'}
        </span>
      </span>
    </div>
  )
}

// AG-Grid Cell Renderer wrapper
export const SparklineCellRenderer = (params) => {
  return <SparklineCell value={params.value} />
}

export default SparklineCell
