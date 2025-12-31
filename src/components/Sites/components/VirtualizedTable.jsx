/**
 * VirtualizedTable Component  
 * Virtual scrolling table for large datasets
 * 
 * NOTE: Requires react-window to be installed
 * Run: npm install react-window
 */

import React, { useRef, useEffect, useState } from 'react'
import './VirtualizedTable.css'

const VirtualizedTable = ({
  data = [],
  columns = [],
  rowHeight = 60,
  headerHeight = 50,
  onRowClick,
  selectedRows = new Set(),
  className = ''
}) => {
  const containerRef = useRef(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(600)

  // Calculate visible range
  const overscan = 5
  const totalRows = data.length
  const totalHeight = totalRows * rowHeight
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)
  const endIndex = Math.min(totalRows, Math.ceil((scrollTop + viewportHeight) / rowHeight) + overscan)

  // Get visible rows
  const visibleRows = data.slice(startIndex, endIndex).map((row, idx) => ({
    row,
    index: startIndex + idx,
    top: (startIndex + idx) * rowHeight
  }))

  // Update viewport height
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setViewportHeight(rect.height - headerHeight)
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [headerHeight])

  // Handle scroll
  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop)
  }

  return (
    <div className={`virtualized-table ${className}`}>
      {/* Table Header (Sticky) */}
      <div
        className="virtualized-table__header"
        style={{ height: headerHeight }}
      >
        {columns.map((column, idx) => (
          <div
            key={column.key || idx}
            className="virtualized-table__header-cell"
            style={{ 
              width: column.width || 'auto',
              minWidth: column.minWidth || 100,
              flex: column.flex || 1
            }}
          >
            {column.label}
          </div>
        ))}
      </div>

      {/* Table Body (Scrollable) */}
      <div
        ref={containerRef}
        className="virtualized-table__body"
        onScroll={handleScroll}
      >
        <div
          className="virtualized-table__inner"
          style={{ height: totalHeight }}
        >
          {visibleRows.map(({ row, index, top }) => (
            <div
              key={row.site_id || index}
              className={`virtualized-table__row ${
                selectedRows.has(row.site_id) ? 'virtualized-table__row--selected' : ''
              }`}
              style={{
                position: 'absolute',
                top,
                left: 0,
                right: 0,
                height: rowHeight
              }}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column, colIdx) => (
                <div
                  key={column.key || colIdx}
                  className="virtualized-table__cell"
                  style={{
                    width: column.width || 'auto',
                    minWidth: column.minWidth || 100,
                    flex: column.flex || 1
                  }}
                >
                  {column.render ? column.render(row[column.key], row, index) : row[column.key]}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      {totalRows > 20 && (
        <div className="virtualized-table__footer">
          Showing rows {startIndex + 1}-{Math.min(endIndex, totalRows)} of {totalRows}
        </div>
      )}
    </div>
  )
}

export default VirtualizedTable
