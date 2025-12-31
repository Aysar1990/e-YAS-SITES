import { useEffect, useRef } from 'react'
import '@google/model-viewer'
import './Logo3D.css'

const Logo3D = ({
  size = 'medium',
  className = '',
  autoRotate = true,
  rotationSpeed = '30deg'
}) => {
  const modelRef = useRef(null)

  const sizeMap = {
    small: { width: '50px', height: '50px' },
    medium: { width: '80px', height: '80px' },
    large: { width: '150px', height: '150px' },
    xlarge: { width: '200px', height: '200px' }
  }

  const dimensions = sizeMap[size] || sizeMap.medium

  useEffect(() => {
    // Ensure model-viewer is properly loaded
    if (modelRef.current) {
      modelRef.current.addEventListener('load', () => {
        console.log('3D Logo loaded successfully')
      })
      modelRef.current.addEventListener('error', (e) => {
        console.error('3D Logo loading error:', e)
      })
    }
  }, [])

  return (
    <div
      className={`logo-3d-container logo-3d-${size} ${className}`}
      style={{ width: dimensions.width, height: dimensions.height }}
    >
      <model-viewer
        ref={modelRef}
        src="/src/assets/images/logo.glb"
        alt="YAS TSSR Monitor Logo"
        auto-rotate={autoRotate ? '' : undefined}
        rotation-per-second={rotationSpeed}
        camera-controls={false}
        disable-zoom
        disable-pan
        disable-tap
        shadow-intensity="0"
        environment-image="neutral"
        exposure="1.2"
        style={{
          width: '100%',
          height: '100%',
          '--poster-color': 'transparent'
        }}
      />
    </div>
  )
}

export default Logo3D
