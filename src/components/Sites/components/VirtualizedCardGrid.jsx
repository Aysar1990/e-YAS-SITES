/**
 * VirtualizedCardGrid Component
 * Virtual scrolling grid for site cards using react-window
 * 
 * NOTE: Requires react-window to be installed
 * Run: npm install react-window
 */

import React, { useRef, useEffect, useState } from 'react'
import './VirtualizedCardGrid.css'

const VirtualizedCardGrid = ({
  sites = [],
  renderCard,
  cardWidth = 200,
  cardHeight = 240,
  gap = 16,
  className = ''
}) => {
  const containerRef = useRef(null)
  const [containerWidth, setContainerWidth] = useState(1200)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(600)

  // Calculate grid dimensions
  const columns = Math.floor((containerWidth + gap) / (cardWidth + gap)) || 1
  const rows = Math.ceil(sites.length / columns)
  const totalHeight = rows * (cardHeight + gap) - gap

  // Update container dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setContainerWidth(rect.width)
        setViewportHeight(rect.height)
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Calculate visible range
  const overscan = 2
  const startRow = Math.max(0, Math.floor(scrollTop / (cardHeight + gap)) - overscan)
  const endRow = Math.min(rows, Math.ceil((scrollTop + viewportHeight) / (cardHeight + gap)) + overscan)
  const startIndex = startRow * columns
  const endIndex = Math.min(sites.length, endRow * columns)

  // Get visible items
  const visibleItems = sites.slice(startIndex, endIndex).map((site, idx) => {
    const absoluteIndex = startIndex + idx
    const row = Math.floor(absoluteIndex / columns)
    const col = absoluteIndex % columns

    return {
      site,
      index: absoluteIndex,
      style: {
        position: 'absolute',
        top: row * (cardHeight + gap),
        left: col * (cardWidth + gap),
        width: cardWidth,
        height: cardHeight
      }
    }
  })

  // Handle scroll
  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop)
  }

  return (
    <div
      ref={containerRef}
      className={`virtualized-card-grid ${className}`}
      onScroll={handleScroll}
    >
      <div
        className="virtualized-card-grid__inner"
        style={{ height: totalHeight }}
      >
        {visibleItems.map(({ site, index, style }) => (
          <div
            key={`${site.site_id}-${site.phase_name}-${index}`}
            className="virtualized-card-grid__item"
            style={style}
          >
            {renderCard(site, index)}
          </div>
        ))}
      </div>

      {/* Scroll indicator */}
      {sites.length > 20 && (
        <div className="virtualized-card-grid__info">
          Showing {startIndex + 1}-{Math.min(endIndex, sites.length)} of {sites.length}
        </div>
      )}
    </div>
  )
}

export default VirtualizedCardGrid
