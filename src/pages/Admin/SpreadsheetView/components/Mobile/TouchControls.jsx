/**
 * TouchControls - Touch gesture handling for mobile
 * Phase 9: Mobile & Print
 *
 * Features:
 * - Swipe left/right for actions
 * - Long press to select
 * - Uses react-swipeable
 */

import React, { useState, useRef, useCallback } from 'react'
import { useSwipeable } from 'react-swipeable'

const SWIPE_THRESHOLD = 80 // pixels to trigger action
const LONG_PRESS_DURATION = 500 // ms

const TouchControls = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onLongPress,
  swipeLeftLabel = '🗑️ حذف',
  swipeRightLabel = '✏️ تعديل',
  disabled = false
}) => {
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isLongPressing, setIsLongPressing] = useState(false)
  const [showLeftAction, setShowLeftAction] = useState(false)
  const [showRightAction, setShowRightAction] = useState(false)

  const longPressTimer = useRef(null)
  const containerRef = useRef(null)

  // Handle swipe start
  const handleSwipeStart = useCallback(() => {
    // Start long press timer
    if (onLongPress && !disabled) {
      longPressTimer.current = setTimeout(() => {
        setIsLongPressing(true)
        onLongPress()
        // Vibration feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(50)
        }
      }, LONG_PRESS_DURATION)
    }
  }, [onLongPress, disabled])

  // Handle swipe move
  const handleSwiping = useCallback((eventData) => {
    if (disabled || isLongPressing) return

    // Cancel long press if swiping
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }

    const { deltaX } = eventData
    setSwipeOffset(deltaX)

    // Show action indicators
    setShowLeftAction(deltaX < -SWIPE_THRESHOLD / 2)
    setShowRightAction(deltaX > SWIPE_THRESHOLD / 2)
  }, [disabled, isLongPressing])

  // Handle swipe end
  const handleSwipeEnd = useCallback((eventData) => {
    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }

    setIsLongPressing(false)

    if (disabled) {
      setSwipeOffset(0)
      setShowLeftAction(false)
      setShowRightAction(false)
      return
    }

    const { deltaX } = eventData

    // Trigger actions based on swipe distance
    if (deltaX < -SWIPE_THRESHOLD && onSwipeLeft) {
      onSwipeLeft()
      // Vibration feedback
      if (navigator.vibrate) {
        navigator.vibrate([50, 50, 50])
      }
    } else if (deltaX > SWIPE_THRESHOLD && onSwipeRight) {
      onSwipeRight()
      // Vibration feedback
      if (navigator.vibrate) {
        navigator.vibrate([50, 50, 50])
      }
    }

    // Reset state
    setSwipeOffset(0)
    setShowLeftAction(false)
    setShowRightAction(false)
  }, [disabled, onSwipeLeft, onSwipeRight])

  // Swipeable handlers
  const handlers = useSwipeable({
    onSwipeStart: handleSwipeStart,
    onSwiping: handleSwiping,
    onSwiped: handleSwipeEnd,
    trackMouse: false,
    trackTouch: true,
    preventScrollOnSwipe: true,
    delta: 10
  })

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={`touch-controls-wrapper ${isLongPressing ? 'long-pressing' : ''}`}
      {...handlers}
    >
      {/* Left Action (Swipe Left - Delete) */}
      <div
        className={`swipe-action left ${showLeftAction ? 'visible' : ''}`}
        style={{ opacity: Math.min(1, Math.abs(swipeOffset) / SWIPE_THRESHOLD) }}
      >
        <span>{swipeLeftLabel}</span>
      </div>

      {/* Right Action (Swipe Right - Edit) */}
      <div
        className={`swipe-action right ${showRightAction ? 'visible' : ''}`}
        style={{ opacity: Math.min(1, Math.abs(swipeOffset) / SWIPE_THRESHOLD) }}
      >
        <span>{swipeRightLabel}</span>
      </div>

      {/* Main Content */}
      <div
        className="touch-content"
        style={{
          transform: `translateX(${swipeOffset * 0.5}px)`,
          transition: swipeOffset === 0 ? 'transform 0.2s ease' : 'none'
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default TouchControls
