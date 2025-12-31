/**
 * useVirtualization Hook
 * Provides virtualization utilities and calculations
 */

import { useState, useEffect, useMemo, useCallback } from 'react'

export const useVirtualization = (items = [], options = {}) => {
  const {
    itemHeight = 240,      // Default card height
    itemWidth = 200,       // Default card width
    gap = 16,              // Gap between items
    containerWidth = 1200, // Container width
    overscan = 3           // Items to render outside viewport
  } = options

  const [containerHeight, setContainerHeight] = useState(600)

  // Calculate columns for grid layout
  const columns = useMemo(() => {
    return Math.floor((containerWidth + gap) / (itemWidth + gap)) || 1
  }, [containerWidth, itemWidth, gap])

  // Calculate total rows
  const rows = useMemo(() => {
    return Math.ceil(items.length / columns)
  }, [items.length, columns])

  // Calculate total height
  const totalHeight = useMemo(() => {
    return rows * (itemHeight + gap) - gap
  }, [rows, itemHeight, gap])

  // Get item position
  const getItemPosition = useCallback((index) => {
    const row = Math.floor(index / columns)
    const col = index % columns
    
    return {
      top: row * (itemHeight + gap),
      left: col * (itemWidth + gap),
      width: itemWidth,
      height: itemHeight
    }
  }, [columns, itemHeight, itemWidth, gap])

  // Get visible range based on scroll position
  const getVisibleRange = useCallback((scrollTop, viewportHeight) => {
    const startRow = Math.floor(scrollTop / (itemHeight + gap))
    const endRow = Math.ceil((scrollTop + viewportHeight) / (itemHeight + gap))
    
    const startIndex = Math.max(0, (startRow - overscan) * columns)
    const endIndex = Math.min(items.length, (endRow + overscan) * columns)
    
    return { startIndex, endIndex }
  }, [itemHeight, gap, columns, items.length, overscan])

  // Get items in viewport
  const getVisibleItems = useCallback((scrollTop, viewportHeight) => {
    const { startIndex, endIndex } = getVisibleRange(scrollTop, viewportHeight)
    
    return items.slice(startIndex, endIndex).map((item, idx) => ({
      item,
      index: startIndex + idx,
      position: getItemPosition(startIndex + idx)
    }))
  }, [items, getVisibleRange, getItemPosition])

  return {
    // Dimensions
    columns,
    rows,
    totalHeight,
    containerHeight,
    setContainerHeight,
    
    // Functions
    getItemPosition,
    getVisibleRange,
    getVisibleItems,
    
    // Metrics
    metrics: {
      totalItems: items.length,
      itemsPerRow: columns,
      totalRows: rows,
      itemHeight,
      itemWidth,
      gap
    }
  }
}

export default useVirtualization
