/**
 * usePerformanceTracker Hook
 * Custom hook for tracking component performance
 *
 * Features:
 * - Measures component mount/unmount times
 * - Tracks re-render frequency
 * - Reports to electron performance monitor
 */

import { useEffect, useRef, useCallback, useState } from 'react'

// Performance threshold (ms)
const SLOW_RENDER_THRESHOLD = 50

/**
 * Hook to track component performance
 * @param {string} componentName - Name of the component for identification
 * @param {Object} options - Configuration options
 * @returns {Object} Performance tracking utilities
 */
export function usePerformanceTracker(componentName, options = {}) {
  const {
    trackRenders = true,
    trackMounts = true,
    logToConsole = false,
    threshold = SLOW_RENDER_THRESHOLD
  } = options

  const mountTime = useRef(performance.now())
  const lastRenderTime = useRef(performance.now())
  const renderCount = useRef(0)
  const [metrics, setMetrics] = useState({
    mountDuration: 0,
    avgRenderTime: 0,
    renderCount: 0,
    slowRenders: 0
  })

  const renderTimes = useRef([])

  // Report to electron if available
  const reportToElectron = useCallback((type, data) => {
    if (window.electronAPI?.reportPerformance) {
      window.electronAPI.reportPerformance(type, data)
    }
  }, [])

  // Track mount time
  useEffect(() => {
    if (!trackMounts) return

    const mountDuration = performance.now() - mountTime.current

    if (logToConsole) {
      console.log(`[Perf] ${componentName} mounted in ${mountDuration.toFixed(2)}ms`)
    }

    reportToElectron('mount', {
      component: componentName,
      duration: mountDuration
    })

    setMetrics(prev => ({
      ...prev,
      mountDuration
    }))

    // Cleanup on unmount
    return () => {
      const lifetime = performance.now() - mountTime.current

      if (logToConsole) {
        console.log(`[Perf] ${componentName} unmounted after ${lifetime.toFixed(2)}ms, ${renderCount.current} renders`)
      }

      reportToElectron('unmount', {
        component: componentName,
        lifetime,
        renderCount: renderCount.current
      })
    }
  }, [componentName, trackMounts, logToConsole, reportToElectron])

  // Track renders
  useEffect(() => {
    if (!trackRenders) return

    renderCount.current++
    const now = performance.now()
    const renderTime = now - lastRenderTime.current
    lastRenderTime.current = now

    // Skip first render (mount)
    if (renderCount.current > 1) {
      renderTimes.current.push(renderTime)

      // Keep only last 100 renders
      if (renderTimes.current.length > 100) {
        renderTimes.current.shift()
      }

      const avgRenderTime = renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length
      const slowRenders = renderTimes.current.filter(t => t > threshold).length

      if (logToConsole && renderTime > threshold) {
        console.warn(`[Perf] ${componentName} slow render: ${renderTime.toFixed(2)}ms (threshold: ${threshold}ms)`)
      }

      setMetrics(prev => ({
        ...prev,
        avgRenderTime,
        renderCount: renderCount.current,
        slowRenders
      }))

      reportToElectron('render', {
        component: componentName,
        duration: renderTime,
        renderCount: renderCount.current,
        isSlow: renderTime > threshold
      })
    }
  })

  /**
   * Manually mark a timing event
   */
  const mark = useCallback((markName) => {
    const time = performance.now()
    performance.mark(`${componentName}:${markName}`)

    if (logToConsole) {
      console.log(`[Perf] ${componentName} mark: ${markName} at ${time.toFixed(2)}ms`)
    }

    return time
  }, [componentName, logToConsole])

  /**
   * Measure time between two marks
   */
  const measure = useCallback((measureName, startMark, endMark) => {
    try {
      performance.measure(
        `${componentName}:${measureName}`,
        `${componentName}:${startMark}`,
        `${componentName}:${endMark}`
      )

      const entries = performance.getEntriesByName(`${componentName}:${measureName}`)
      const duration = entries[entries.length - 1]?.duration || 0

      if (logToConsole) {
        console.log(`[Perf] ${componentName} measure ${measureName}: ${duration.toFixed(2)}ms`)
      }

      reportToElectron('measure', {
        component: componentName,
        name: measureName,
        duration
      })

      return duration
    } catch (err) {
      console.warn(`[Perf] Failed to measure ${measureName}:`, err.message)
      return 0
    }
  }, [componentName, logToConsole, reportToElectron])

  /**
   * Create a timer for async operations
   */
  const createTimer = useCallback((operationName) => {
    const start = performance.now()

    return {
      end: () => {
        const duration = performance.now() - start

        if (logToConsole) {
          console.log(`[Perf] ${componentName} ${operationName}: ${duration.toFixed(2)}ms`)
        }

        reportToElectron('operation', {
          component: componentName,
          operation: operationName,
          duration
        })

        return duration
      }
    }
  }, [componentName, logToConsole, reportToElectron])

  /**
   * Track data fetch performance
   */
  const trackFetch = useCallback(async (fetchFn, fetchName = 'fetch') => {
    const timer = createTimer(fetchName)

    try {
      const result = await fetchFn()
      const duration = timer.end()

      return {
        data: result,
        duration,
        success: true
      }
    } catch (error) {
      const duration = timer.end()

      reportToElectron('fetchError', {
        component: componentName,
        operation: fetchName,
        duration,
        error: error.message
      })

      return {
        data: null,
        duration,
        success: false,
        error
      }
    }
  }, [componentName, createTimer, reportToElectron])

  /**
   * Get performance report for this component
   */
  const getReport = useCallback(() => {
    return {
      componentName,
      ...metrics,
      renderTimes: [...renderTimes.current],
      timestamp: Date.now()
    }
  }, [componentName, metrics])

  /**
   * Reset metrics
   */
  const reset = useCallback(() => {
    renderCount.current = 0
    renderTimes.current = []
    lastRenderTime.current = performance.now()
    setMetrics({
      mountDuration: 0,
      avgRenderTime: 0,
      renderCount: 0,
      slowRenders: 0
    })
  }, [])

  return {
    metrics,
    mark,
    measure,
    createTimer,
    trackFetch,
    getReport,
    reset,
    renderCount: renderCount.current
  }
}

/**
 * Higher-order component for performance tracking
 */
export function withPerformanceTracking(WrappedComponent, componentName) {
  return function PerformanceTrackedComponent(props) {
    usePerformanceTracker(componentName || WrappedComponent.displayName || WrappedComponent.name)
    return <WrappedComponent {...props} />
  }
}

/**
 * Simple render counter hook
 */
export function useRenderCount(componentName) {
  const count = useRef(0)
  count.current++

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Render] ${componentName}: ${count.current}`)
    }
  })

  return count.current
}

/**
 * Hook to detect unnecessary re-renders
 */
export function useWhyDidYouUpdate(componentName, props) {
  const previousProps = useRef({})

  useEffect(() => {
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props })
      const changedProps = {}

      allKeys.forEach(key => {
        if (previousProps.current[key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current[key],
            to: props[key]
          }
        }
      })

      if (Object.keys(changedProps).length > 0) {
        console.log(`[WhyDidYouUpdate] ${componentName}:`, changedProps)
      }
    }

    previousProps.current = props
  })
}

export default usePerformanceTracker
