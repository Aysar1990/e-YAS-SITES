import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, OrbitControls, Environment } from '@react-three/drei'
import logoModel from '../../assets/images/logo.glb'
import './Logo3D.css'

function Model() {
  const { scene } = useGLTF(logoModel)
  const meshRef = useRef()

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5
    }
  })

  return (
    <primitive
      ref={meshRef}
      object={scene}
      scale={5.5}
      position={[0, 0, 0]}
    />
  )
}

const Logo3D = ({ size = 200 }) => {
  return (
    <div
      className="logo-3d-container"
      style={{ width: size, height: size }}
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={2.5} />
        <directionalLight position={[5, 5, 5]} intensity={2} />
        <directionalLight position={[-5, -5, -5]} intensity={1.2} />
        <Environment preset="studio" />
        <Suspense fallback={null}>
          <Model />
        </Suspense>
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={false}
        />
      </Canvas>
    </div>
  )
}

useGLTF.preload(logoModel)

export default Logo3D
