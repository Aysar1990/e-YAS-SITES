/**
 * StatsCard3D Component
 * 3D animated stats card with breakdown table
 * Extracted from AdminDashboard.jsx
 */

import { useEffect, useState } from 'react'

// Animated counter hook
export const useCountUp = (end, duration = 1500) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (end === 0) {
      setCount(0)
      return
    }

    let startTime
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      setCount(Math.floor(progress * end))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [end, duration])

  return count
}

// 3D Stats Card Component
const StatsCard3D = ({ icon, title, total, breakdown, className }) => {
  const animatedTotal = useCountUp(total)
  const animatedThinLayer = useCountUp(breakdown?.thinLayer || 0)
  const animatedFullSwap = useCountUp(breakdown?.fullSwap || 0)
  const animatedSwapExisting = useCountUp(breakdown?.swapExisting || 0)

  return (
    <div className={`stats-card-3d ${className}`}>
      <div className="card-header-3d">
        <div className="card-icon">{icon}</div>
        <div className="card-info">
          <div className="card-value">{animatedTotal.toLocaleString()}</div>
          <div className="card-title">{title}</div>
        </div>
      </div>
      <div className="breakdown-table">
        <div>
          <div className="breakdown-header">ThinLayer</div>
          <div className="breakdown-value">{animatedThinLayer}</div>
        </div>
        <div>
          <div className="breakdown-header">Full Swap</div>
          <div className="breakdown-value">{animatedFullSwap}</div>
        </div>
        <div>
          <div className="breakdown-header">Swap Exist</div>
          <div className="breakdown-value">{animatedSwapExisting}</div>
        </div>
        <div>
          <div className="breakdown-header">Total</div>
          <div className="breakdown-value total-highlight">{animatedTotal}</div>
        </div>
      </div>
    </div>
  )
}

export default StatsCard3D
